/**
 * Copy and paste for our blocks (snn/section, snn/container, snn/div and snn/text): the settings of one block go onto
 * any other of ours. The items sit in the block's settings menu, the ⋮ in the block toolbar and the right-click menu
 * of the List View and the canvas. Both are core's block settings menu, which takes items through the
 * BlockSettingsMenuControls fill.
 *
 * Four kinds, each with its own items and its own clipboard state:
 *   Styles          Copy styles        the style values of the block: its layout and item settings, the Style tab
 *                   Paste styles       values, the values of Tablet and Mobile, and its custom CSS. Not its tag, CSS
 *                                      ID or classes, its content, its query loop or its custom attributes.
 *   Conditions      Copy conditions    the block's conditions.
 *                   Paste conditions
 *   Interactions    Copy interactions  the block's interactions.
 *                   Paste interactions
 *   Animations      Copy animations    the block's animations: the GSAP timeline and the older animation presets.
 *                   Paste animations
 *
 * Copying a kind replaces only that kind on the clipboard. A Paste item shows only while its kind is on the clipboard,
 * and it puts that kind on every selected block of ours, so any element takes it, not only the one it came from.
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
	// custom attributes and the three kinds that are not styles (conditions, interactions and animations).
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
	function clone( value ) {
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

	/**
	 * The kinds, in menu order. copy and paste are the item labels; read(attrs) is what Copy stores for the kind;
	 * has(clip) says whether the clipboard holds the kind; attributes(clip) is what Paste puts on a block.
	 */
	const KINDS = {
		styles: {
			copy: __( 'Copy styles', 'snn' ),
			paste: __( 'Paste styles', 'snn' ),
			read: ( attrs ) => {
				const out = {};
				Object.keys( attrs ).forEach( ( key ) => {
					if ( NOT_STYLES.indexOf( key ) === -1 ) {
						out[ key ] = clone( attrs[ key ] );
					}
				} );
				return out;
			},
			has: ( clip ) => !! clip.styles && Object.keys( clip.styles ).length > 0,
			attributes: ( clip ) => {
				const out = {};
				Object.keys( clip.styles ).forEach( ( key ) => {
					if ( NOT_STYLES.indexOf( key ) === -1 ) {
						out[ key ] = clone( clip.styles[ key ] );
					}
				} );
				return out;
			},
		},
		conditions: {
			copy: __( 'Copy conditions', 'snn' ),
			paste: __( 'Paste conditions', 'snn' ),
			read: ( attrs ) => clone( attrs.conditions || [] ),
			has: ( clip ) => Array.isArray( clip.conditions ) && clip.conditions.length > 0,
			attributes: ( clip ) => ( { conditions: clone( clip.conditions ) } ),
		},
		interactions: {
			copy: __( 'Copy interactions', 'snn' ),
			paste: __( 'Paste interactions', 'snn' ),
			read: ( attrs ) => clone( attrs.interactions || [] ),
			has: ( clip ) => Array.isArray( clip.interactions ) && clip.interactions.length > 0,
			attributes: ( clip ) => ( { interactions: clone( clip.interactions ) } ),
		},
		animations: {
			copy: __( 'Copy animations', 'snn' ),
			paste: __( 'Paste animations', 'snn' ),
			read: ( attrs ) => ( {
				gsapTweens: clone( attrs.gsapTweens || [] ),
				gsapScroll: clone( attrs.gsapScroll || {} ),
				animation: clone( attrs.animation || [] ),
			} ),
			has: ( clip ) => !! clip.animations && ( ( clip.animations.gsapTweens || [] ).length > 0 || ( clip.animations.animation || [] ).length > 0 ),
			attributes: ( clip ) => ( {
				gsapTweens: clone( clip.animations.gsapTweens || [] ),
				gsapScroll: clone( clip.animations.gsapScroll || {} ),
				animation: clone( clip.animations.animation || [] ),
			} ),
		},
	};

	/** Copy: stores one kind of the block on the clipboard. The other kinds stay as they are. */
	function copyKind( kind, clientId ) {
		writeClipboard( { ...readClipboard(), [ kind ]: KINDS[ kind ].read( attributesOf( clientId ) ) } );
	}

	/** Paste: puts one kind of the clipboard on each of the blocks. Each block gets its own copy of the values. */
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
	 * The items for the selected blocks. For each kind, in menu order: Copy (one block of ours is selected), then Paste
	 * (when the clipboard holds that kind and at least one block of ours is selected). Nothing is drawn for other blocks.
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

		const items = [];
		Object.keys( KINDS ).forEach( ( kind ) => {
			if ( source ) {
				items.push( h( MenuItem, { key: 'copy-' + kind, onClick: () => { copyKind( kind, source ); close(); } }, KINDS[ kind ].copy ) );
			}
			if ( targets.length && KINDS[ kind ].has( clip ) ) {
				items.push( h( MenuItem, { key: 'paste-' + kind, onClick: () => { paste( kind, targets ); close(); } }, KINDS[ kind ].paste ) );
			}
		} );

		if ( ! items.length ) {
			return null;
		}
		return h( Fragment, null, items );
	}

	wp.plugins.registerPlugin( 'snn-block-clipboard', {
		render: function () {
			return h( wp.blockEditor.BlockSettingsMenuControls, null, ( fillProps ) => h( MenuItems, fillProps ) );
		},
	} );
} )( window.wp );
