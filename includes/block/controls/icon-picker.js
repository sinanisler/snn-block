/**
 * The icon picker, shared by every block that has an icon (Button and Icon today; more blocks can use it).
 *
 *   IconField  the field in a panel: the chosen icon (a click opens the picker) and a button to remove it
 *   IconModal  the picker: a tab per library, a search, the icons, and SVG (pasted code or a file from the media library)
 *   IconGlyph  the icon as the front end prints it (utilities/icons.php): an <i> or the SVG
 *
 * An icon value is { library, name } for a font icon, { library: 'svg', svg } for SVG code, or { library: 'svg', svgId }
 * for an SVG file. The libraries' stylesheets are loaded in the editor and its canvas by icons.php. The names come from
 * assets/icons/icon-lists.json, fetched when the picker first opens. Exposes window.snnIconPicker.
 */
( function ( wp ) {
	const { createElement: h, createPortal, useEffect, useMemo, useState } = wp.element;
	const { __ } = wp.i18n;
	const data = window.snnIconData || {};

	const LIBRARIES = [
		{ id: 'fontawesome-solid', label: 'Font Awesome Solid', prefix: 'fa-solid' },
		{ id: 'fontawesome-regular', label: 'Font Awesome Regular', prefix: 'fa-regular' },
		{ id: 'fontawesome-brands', label: 'Font Awesome Brands', prefix: 'fa-brands' },
		{ id: 'ionicons', label: 'Ionicons', prefix: '' },
		{ id: 'themify', label: 'Themify', prefix: '' },
		{ id: 'svg', label: 'SVG', prefix: '' },
	];
	const PREFIX = LIBRARIES.reduce( ( map, lib ) => ( { ...map, [ lib.id ]: lib.prefix } ), {} );
	// The icons drawn at once; the rest come with Show more, so a library of 1,400 icons opens quickly.
	const PAGE = 240;

	// The name lists, fetched once for the whole editor.
	let listsPromise = null;
	function loadLists() {
		if ( ! listsPromise ) {
			listsPromise = window
				.fetch( data.listsUrl, { credentials: 'same-origin' } )
				.then( ( r ) => ( r.ok ? r.json() : {} ) )
				.catch( () => {
					listsPromise = null;
					return {};
				} );
		}
		return listsPromise;
	}

	/** True when the value is an icon. */
	function hasIcon( icon ) {
		return !! ( icon && icon.library && ( icon.name || icon.svg || icon.svgId ) );
	}

	/** The class list of a font icon (fa-solid fa-star, ti-star), as icons.php writes it. */
	function iconClass( icon ) {
		return [ PREFIX[ icon.library ] || '', icon.name || '' ].filter( Boolean ).join( ' ' );
	}

	/** A style object as CSS text (fontSize -> font-size). */
	function cssText( style ) {
		return Object.keys( style || {} )
			.filter( ( k ) => style[ k ] !== undefined && style[ k ] !== '' )
			.map( ( k ) => k.replace( /[A-Z]/g, ( c ) => '-' + c.toLowerCase() ) + ':' + style[ k ] )
			.join( ';' );
	}

	/** The SVG with the snn-icon class and the style on its root, as icons.php does it. */
	function svgMarkup( svg, style ) {
		let out = String( svg || '' ).replace( /^\s*<\?xml[^>]*>\s*|<!DOCTYPE[^>]*>\s*/gi, '' ).trim();
		if ( out.toLowerCase().indexOf( '<svg' ) === -1 ) {
			return '';
		}
		if ( /<svg\b[^>]*\sclass\s*=\s*("|')/i.test( out ) ) {
			out = out.replace( /(<svg\b[^>]*\sclass\s*=\s*("|'))/i, '$1snn-icon ' );
		} else {
			out = out.replace( /<svg\b/i, '<svg class="snn-icon"' );
		}
		const css = cssText( style );
		return css ? out.replace( /<svg\b/i, '<svg style="' + css.replace( /"/g, '&quot;' ) + '"' ) : out;
	}

	// SVG files from the media library, fetched once each: id -> markup.
	const svgFiles = {};
	function useSvgFile( id ) {
		const [ markup, setMarkup ] = useState( id && svgFiles[ id ] ? svgFiles[ id ] : '' );
		useEffect( () => {
			if ( ! id ) {
				setMarkup( '' );
				return undefined;
			}
			if ( svgFiles[ id ] ) {
				setMarkup( svgFiles[ id ] );
				return undefined;
			}
			let live = true;
			wp.apiFetch( { path: '/wp/v2/media/' + id + '?context=view&_fields=source_url,mime_type' } )
				.then( ( m ) => ( m && m.mime_type === 'image/svg+xml' ? window.fetch( m.source_url ).then( ( r ) => r.text() ) : '' ) )
				.then( ( text ) => {
					svgFiles[ id ] = text || '';
					if ( live ) {
						setMarkup( svgFiles[ id ] );
					}
				} )
				.catch( () => {} );
			return () => {
				live = false;
			};
		}, [ id ] );
		return markup;
	}

	/** The icon as the front end prints it. style: its size and colour. */
	function IconGlyph( { icon, style } ) {
		const file = useSvgFile( icon && icon.library === 'svg' && icon.svgId ? icon.svgId : 0 );
		if ( ! hasIcon( icon ) ) {
			return null;
		}
		if ( icon.library === 'svg' ) {
			const markup = svgMarkup( icon.svgId ? file : icon.svg, style );
			// display: contents, so the SVG itself is the item in the block's row, as on the front end.
			return markup ? h( 'span', { style: { display: 'contents' }, dangerouslySetInnerHTML: { __html: markup } } ) : null;
		}
		return h( 'i', { className: 'snn-icon ' + iconClass( icon ), style, 'aria-hidden': 'true' } );
	}

	/** The SVG tab: SVG code to paste, or an SVG file from the media library. */
	function SvgTab( { value, onPick } ) {
		const [ code, setCode ] = useState( value && value.library === 'svg' && value.svg ? value.svg : '' );
		const valid = code.toLowerCase().indexOf( '<svg' ) !== -1;
		const fromLibrary = () => {
			const frame = wp.media( {
				title: __( 'Choose an SVG file', 'snn' ),
				library: { type: 'image/svg+xml' },
				multiple: false,
				button: { text: __( 'Use this SVG', 'snn' ) },
			} );
			frame.on( 'select', () => {
				const file = frame.state().get( 'selection' ).first().toJSON();
				if ( file && file.mime === 'image/svg+xml' ) {
					onPick( { library: 'svg', svgId: file.id } );
				}
			} );
			frame.open();
		};
		return h(
			'div',
			{ className: 'snn-icon-svg-tab' },
			h( 'label', { className: 'snn-icon-svg-label', htmlFor: 'snn-icon-svg-code' }, __( 'SVG code', 'snn' ) ),
			h( 'textarea', {
				id: 'snn-icon-svg-code',
				className: 'snn-icon-svg-code',
				value: code,
				spellCheck: false,
				placeholder: '<svg viewBox="0 0 24 24">…</svg>',
				onChange: ( e ) => setCode( e.target.value ),
			} ),
			h(
				'div',
				{ className: 'snn-icon-svg-actions' },
				h( 'button', { type: 'button', className: 'button button-primary', disabled: ! valid, onClick: () => onPick( { library: 'svg', svg: code.trim() } ) }, __( 'Use this SVG', 'snn' ) ),
				wp.media ? h( 'button', { type: 'button', className: 'button', onClick: fromLibrary }, __( 'Media library', 'snn' ) ) : null
			),
			h( 'p', { className: 'snn-icon-hint' }, __( 'The SVG is printed as written. Its size follows the font size (1em).', 'snn' ) )
		);
	}

	/** The picker. value: the current icon. onPick gets the new value; onClose closes it. */
	function IconModal( { value, onPick, onClose } ) {
		const [ library, setLibrary ] = useState( value && value.library ? value.library : 'fontawesome-solid' );
		const [ lists, setLists ] = useState( null );
		const [ search, setSearch ] = useState( '' );
		const [ shown, setShown ] = useState( PAGE );

		useEffect( () => {
			let live = true;
			loadLists().then( ( l ) => live && setLists( l || {} ) );
			return () => {
				live = false;
			};
		}, [] );
		useEffect( () => {
			const onKey = ( e ) => {
				if ( e.key === 'Escape' ) {
					onClose();
				}
			};
			document.addEventListener( 'keydown', onKey );
			return () => document.removeEventListener( 'keydown', onKey );
		}, [ onClose ] );
		useEffect( () => setShown( PAGE ), [ library, search ] );

		const names = useMemo( () => {
			const all = lists && Array.isArray( lists[ library ] ) ? lists[ library ] : [];
			const words = search.toLowerCase().trim().split( /\s+/ ).filter( Boolean );
			return words.length ? all.filter( ( n ) => words.every( ( w ) => n.indexOf( w ) !== -1 ) ) : all;
		}, [ lists, library, search ] );

		const title = __( 'Choose an icon', 'snn' );
		const body =
			library === 'svg'
				? h( SvgTab, { value, onPick } )
				: h(
						'div',
						{ className: 'snn-icon-body' },
						h( 'input', {
							type: 'search',
							className: 'snn-input snn-icon-search',
							value: search,
							autoFocus: true,
							placeholder: __( 'Search icons', 'snn' ),
							'aria-label': __( 'Search icons', 'snn' ),
							onChange: ( e ) => setSearch( e.target.value ),
						} ),
						lists === null ? h( 'p', { className: 'snn-icon-hint' }, __( 'Loading icons…', 'snn' ) ) : null,
						h(
							'div',
							{ className: 'snn-icon-grid', role: 'listbox', 'aria-label': title },
							names.slice( 0, shown ).map( ( name ) => {
								const on = value && value.library === library && value.name === name;
								return h(
									'button',
									{
										type: 'button',
										key: name,
										role: 'option',
										'aria-selected': on ? 'true' : 'false',
										className: 'snn-icon-tile' + ( on ? ' is-on' : '' ),
										title: name,
										onClick: () => onPick( { library, name } ),
									},
									h( 'i', { className: iconClass( { library, name } ), 'aria-hidden': 'true' } ),
									h( 'span', { className: 'snn-icon-tile-name' }, name.replace( /^(fa|ion|ti)-/, '' ) )
								);
							} )
						),
						lists !== null && names.length === 0 ? h( 'p', { className: 'snn-icon-hint' }, __( 'No icons found.', 'snn' ) ) : null,
						names.length > shown
							? h( 'button', { type: 'button', className: 'snn-bt-link snn-icon-more', onClick: () => setShown( shown + PAGE ) }, __( 'Show more', 'snn' ) + ' (' + ( names.length - shown ) + ')' )
							: null
				  );

		return createPortal(
			h(
				'div',
				{
					className: 'snn-icon-modal-back',
					onMouseDown: ( e ) => {
						if ( e.target === e.currentTarget ) {
							onClose();
						}
					},
				},
				h(
					'div',
					{ className: 'snn-icon-modal', role: 'dialog', 'aria-modal': 'true', 'aria-label': title },
					h(
						'div',
						{ className: 'snn-icon-modal-head' },
						h( 'strong', null, title ),
						h( 'button', { type: 'button', className: 'snn-bt-x', 'aria-label': __( 'Close', 'snn' ), onClick: onClose }, '×' )
					),
					h(
						'div',
						{ className: 'snn-icon-tabs', role: 'tablist' },
						LIBRARIES.map( ( lib ) =>
							h(
								'button',
								{
									type: 'button',
									key: lib.id,
									role: 'tab',
									'aria-selected': library === lib.id ? 'true' : 'false',
									className: 'snn-icon-tab' + ( library === lib.id ? ' is-on' : '' ),
									onClick: () => setLibrary( lib.id ),
								},
								lib.label
							)
						)
					),
					body
				)
			),
			document.body
		);
	}

	/** The field: the icon (a click opens the picker) and × to remove it. */
	function IconField( { value, onChange, label } ) {
		const [ open, setOpen ] = useState( false );
		const has = hasIcon( value );
		return h(
			'div',
			{ className: 'snn-icon-field' },
			h(
				'button',
				{
					type: 'button',
					className: 'snn-icon-choose',
					'aria-label': label || __( 'Choose an icon', 'snn' ),
					title: has ? ( value.library === 'svg' ? 'SVG' : value.name ) : __( 'Choose an icon', 'snn' ),
					onClick: () => setOpen( true ),
				},
				has ? h( 'span', { className: 'snn-icon-choose-glyph' }, h( IconGlyph, { icon: value } ) ) : null,
				h( 'span', { className: 'snn-icon-choose-text' }, has ? ( value.library === 'svg' ? 'SVG' : value.name ) : __( 'Choose an icon', 'snn' ) )
			),
			has
				? h( 'button', { type: 'button', className: 'snn-bt-x', 'aria-label': __( 'Remove the icon', 'snn' ), title: __( 'Remove the icon', 'snn' ), onClick: () => onChange( {} ) }, '×' )
				: null,
			open
				? h( IconModal, {
						value,
						onClose: () => setOpen( false ),
						onPick: ( v ) => {
							onChange( v );
							setOpen( false );
						},
				  } )
				: null
		);
	}

	window.snnIconPicker = { IconField, IconModal, IconGlyph, hasIcon, iconClass };
} )( window.wp );
