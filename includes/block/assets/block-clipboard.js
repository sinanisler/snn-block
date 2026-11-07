/**
 * Copy and paste for our blocks (snn/section, snn/container, snn/div and snn/text): the settings of one block go onto
 * any other of ours. The items sit in the block's settings menu, the ⋮ in the block toolbar and the right-click menu
 * of the List View and the canvas. Both are core's block settings menu, which takes items through the
 * BlockSettingsMenuControls fill.
 *
 *   Copy styles                         the style values of the block: its layout and item settings, the Style tab
 *                                       values, the values of Tablet and Mobile, and its custom CSS. Not its tag, CSS
 *                                       ID or classes, its content, its query loop or its custom attributes.
 *   Copy conditions, interactions       the block's conditions, its interactions and its animations (the GSAP
 *     and animations                    timeline and the older animation presets). Each kind is copied with the others.
 *   Paste styles, Paste conditions,     one item for each kind that is on the clipboard. Pasting puts it on every
 *     Paste interactions, Paste         selected block of ours, so any element takes it, not only the one it came from.
 *     animations
 *
 * The clipboard is kept in the browser (localStorage, key snn-block-clipboard), so it lasts across reloads and posts.
 * It is not the system clipboard, so the browser asks for no permission. Core's Copy and Paste (Ctrl+C and Ctrl+V)
 * still copy whole elements.
 */
( function ( wp ) {
	'use strict';

	if ( ! wp || ! wp.plugins || ! wp.data || ! wp.blockEditor || ! wp.blockEditor.BlockSettingsMenuControls ) {
		return;
	}

	const { createElement: h, Fragment } = wp.element;
	const { __ } = wp.i18n;
	const { MenuItem } = wp.components;

	const KEY = 'snn-block-clipboard';

	// The attributes that are not styles: the block's identity (tag, CSS ID, classes), its content, its query loop, its
	// custom attributes and the three kinds that have their own items.
	const NOT_STYLES = [
		'tagName',
		'htmlId',
		'cssClasses',
		'content',
		'query',
		'customAttributes',
		'conditions',
		'interactions',
		'animation',
		'gsapTweens',
		'gsapScroll',
	];

	// The clipboard: { styles: {...}, conditions: [...], interactions: [...], animations: { gsapTweens, gsapScroll, animation } }.
	// A kind is missing or empty when nothing of it is on the clipboard. The copy of this page is kept in memory, so the
	// clipboard still works when the browser keeps no storage.
	let memory = {};

	function readClipboard() {
		try {
			const raw = window.localStorage.getItem( KEY );
			memory = raw ? JSON.parse( raw ) : {};
		} catch ( e ) {
			// Storage is off (a private window, blocked site data): the memory copy is used.
		}
		return memory && typeof memory === 'object' ? memory : {};
	}

	function writeClipboard( value ) {
		memory = value;
		try {
			window.localStorage.setItem( KEY, JSON.stringify( value ) );
		} catch ( e ) {
			// Storage is full or off: the memory copy still holds it for this page.
		}
	}

	/** A copy of an attribute value. Attributes are JSON values, so a JSON round trip copies them fully. */
	function copy( value ) {
		return JSON.parse( JSON.stringify( value === undefined ? null : value ) );
	}

	function attributesOf( clientId ) {
		return wp.data.select( 'core/block-editor' ).getBlockAttributes( clientId ) || {};
	}

	/** True for our blocks: their names start with snn/. */
	function isOurs( clientId ) {
		const name = wp.data.select( 'core/block-editor' ).getBlockName( clientId ) || '';
		return name.indexOf( 'snn/' ) === 0;
	}

	function copyStyles( clientId ) {
		const attrs = attributesOf( clientId );
		const styles = {};
		Object.keys( attrs ).forEach( ( key ) => {
			if ( NOT_STYLES.indexOf( key ) === -1 ) {
				styles[ key ] = copy( attrs[ key ] );
			}
		} );
		writeClipboard( { ...readClipboard(), styles } );
	}

	function copyLogic( clientId ) {
		const attrs = attributesOf( clientId );
		writeClipboard( {
			...readClipboard(),
			conditions: copy( attrs.conditions || [] ),
			interactions: copy( attrs.interactions || [] ),
			animations: {
				gsapTweens: copy( attrs.gsapTweens || [] ),
				gsapScroll: copy( attrs.gsapScroll || {} ),
				animation: copy( attrs.animation || [] ),
			},
		} );
	}

	/** The paste kinds, in menu order: the label, whether the clipboard holds it, and the attributes it puts on a block. */
	const KINDS = {
		styles: {
			label: __( 'Paste styles', 'snn' ),
			has: ( clip ) => !! clip.styles && Object.keys( clip.styles ).length > 0,
			attributes: ( clip ) => {
				const out = {};
				Object.keys( clip.styles ).forEach( ( key ) => {
					if ( NOT_STYLES.indexOf( key ) === -1 ) {
						out[ key ] = copy( clip.styles[ key ] );
					}
				} );
				return out;
			},
		},
		conditions: {
			label: __( 'Paste conditions', 'snn' ),
			has: ( clip ) => Array.isArray( clip.conditions ) && clip.conditions.length > 0,
			attributes: ( clip ) => ( { conditions: copy( clip.conditions ) } ),
		},
		interactions: {
			label: __( 'Paste interactions', 'snn' ),
			has: ( clip ) => Array.isArray( clip.interactions ) && clip.interactions.length > 0,
			attributes: ( clip ) => ( { interactions: copy( clip.interactions ) } ),
		},
		animations: {
			label: __( 'Paste animations', 'snn' ),
			has: ( clip ) => !! clip.animations && ( ( clip.animations.gsapTweens || [] ).length > 0 || ( clip.animations.animation || [] ).length > 0 ),
			attributes: ( clip ) => ( {
				gsapTweens: copy( clip.animations.gsapTweens || [] ),
				gsapScroll: copy( clip.animations.gsapScroll || {} ),
				animation: copy( clip.animations.animation || [] ),
			} ),
		},
	};

	/** Puts one kind of the clipboard on each of the blocks. Each block gets its own copy of the values. */
	function paste( kind, clientIds ) {
		const clip = readClipboard();
		if ( ! KINDS[ kind ].has( clip ) ) {
			return;
		}
		clientIds.forEach( ( clientId ) => {
			wp.data.dispatch( 'core/block-editor' ).updateBlockAttributes( [ clientId ], KINDS[ kind ].attributes( clip ) );
		} );
	}

	/**
	 * The items for the selected blocks: Copy (one block of ours is selected), then one Paste item for each kind on the
	 * clipboard (when at least one block of ours is selected). Nothing is drawn for other blocks.
	 */
	function MenuItems( { selectedClientIds = [], onClose } ) {
		const close = () => {
			if ( onClose ) {
				onClose();
			}
		};
		const targets = selectedClientIds.filter( isOurs );
		const source = selectedClientIds.length === 1 && targets.length === 1 ? targets[ 0 ] : null;
		const clip = readClipboard();

		const copyItems = source
			? [
				h( MenuItem, { key: 'copy-styles', onClick: () => { copyStyles( source ); close(); } }, __( 'Copy styles', 'snn' ) ),
				h( MenuItem, { key: 'copy-logic', onClick: () => { copyLogic( source ); close(); } }, __( 'Copy conditions, interactions and animations', 'snn' ) ),
			]
			: [];
		const pasteItems = targets.length
			? Object.keys( KINDS )
				.filter( ( kind ) => KINDS[ kind ].has( clip ) )
				.map( ( kind ) => h( MenuItem, { key: 'paste-' + kind, onClick: () => { paste( kind, targets ); close(); } }, KINDS[ kind ].label ) )
			: [];

		if ( ! copyItems.length && ! pasteItems.length ) {
			return null;
		}
		return h( Fragment, null, copyItems, pasteItems );
	}

	wp.plugins.registerPlugin( 'snn-block-clipboard', {
		render: function () {
			return h( wp.blockEditor.BlockSettingsMenuControls, null, ( fillProps ) => h( MenuItems, fillProps ) );
		},
	} );
} )( window.wp );
