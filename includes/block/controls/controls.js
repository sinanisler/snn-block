/**
 * SNN controls: our own panel controls for the SNN blocks. No WordPress core components.
 *
 *   Switch, SwitchRow   on/off switches (not checkboxes), as Bricks has them
 *   Accordion           a section that opens and closes; disabled sections cannot open
 *   Row                 a compact row: label on the left, control on the right
 *   Select, Segmented   a menu, and a row of icon buttons
 *   TextField           a text or number field with the dynamic data button (lightning) and,
 *                       when given, the variables button; a live preview of the tags
 *
 * Loaded in the block editor (see includes/block/layout-blocks.php). Exposes snn.controls.
 * Uses wp.element only, so it runs on the editor's own React.
 */
( function ( wp ) {
	const { createElement: h, createPortal, Fragment, useState, useEffect, useLayoutEffect, useRef } = wp.element;
	const { __, sprintf } = wp.i18n;

	const data = snn.data.controls || {};
	const dynamic = data.dynamic || { groups: {}, tags: [] };

	/** The MDN page of a CSS property: the "?" after a row's title opens it in a new tab. */
	const MDN_PROPERTY ='https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/';

	/** The post the editor is on, for the preview. 0 when there is none (the Site Editor). */
	function currentPostId() {
		try {
			const editor = wp.data.select( 'core/editor' );
			return ( editor && editor.getCurrentPostId && editor.getCurrentPostId() ) || 0;
		} catch ( e ) {
			return 0;
		}
	}

	/** The tooltip attributes of a control, for the key of its text (tooltips.js). Empty when there is no key. */
	function tipAttr( key ) {
		return key && snn.tips ? snn.tips.attr( key ) : {};
	}

	/** What a field accepts, by the table's type: the tip of a value the table rejects. */
	const LENGTH_TEXT = __( 'A length: 24, 24px, 2rem or a size variable.', 'snn' );
	const ACCEPTS = {
		length: LENGTH_TEXT,
		size: LENGTH_TEXT,
		keywordlength: LENGTH_TEXT,
		margin: __( 'A length: 24, 24px, 2rem or a size variable, or auto.', 'snn' ),
		lengthauto: __( 'A length: 24, 24px, 2rem or a size variable, or auto.', 'snn' ),
		lengthnormal: __( 'A length: 24, 24px, 2rem or a size variable, or normal.', 'snn' ),
		sizenone: __( 'A length: 24, 24px, 2rem or a size variable, or none.', 'snn' ),
		width: __( 'A length such as 24px or 50%, a size variable, or auto, max-content, min-content or fit-content.', 'snn' ),
		lineheight: __( 'A number such as 1.5, a length such as 24px, normal or a variable.', 'snn' ),
		color: __( 'A colour: #1a2b3c, rgb(), rgba(), hsl(), transparent or a colour variable.', 'snn' ),
		integer: __( 'A whole number, such as 2 or -1.', 'snn' ),
		order: __( 'A whole number from -999 to 999.', 'snn' ),
		flexnumber: __( 'A number from 0 up, such as 1 or 0.5.', 'snn' ),
		number: __( 'A number, such as 1 or -0.5.', 'snn' ),
		percent: __( 'A number from 0 to 100.', 'snn' ),
		percentnumber: __( 'A number, such as 50.', 'snn' ),
		opacity: __( 'A number from 0 to 100, as a percentage.', 'snn' ),
		ratio: __( 'A ratio such as 16 / 9, or auto.', 'snn' ),
		time: __( 'A time such as 300ms or 0.5s.', 'snn' ),
		template: __( 'A track list such as 1fr 2fr or repeat(4, minmax(0, 1fr)).', 'snn' ),
		columns: __( 'A count from 1 to 12, or a track list such as 1fr 2fr.', 'snn' ),
		areas: __( 'Quoted area names, one string per row, such as "header header" "main side".', 'snn' ),
		ident: __( 'A name that starts with a letter: letters, digits, - and _.', 'snn' ),
		line: __( 'A grid line from 1 to 12, or a line variable.', 'snn' ),
		span: __( 'A span from 1 to 12, or a span variable.', 'snn' ),
		url: __( 'An image address: url(https://...) or url(/image.jpg).', 'snn' ),
		family: __( 'A font name, such as Inter or Georgia.', 'snn' ),
		text: __( 'Letters, digits, spaces and . , ( ) % # + - * / only.', 'snn' ),
	};

	/** The types a field cannot take below zero: an arrow key does not step under zero for them. */
	const NON_NEGATIVE = [ 'size', 'sizenone', 'width', 'keywordlength', 'flexnumber', 'percent', 'opacity', 'time' ];

	/**
	 * True when the table rejects the value (the same check() as the PHP side). A tag ({...}) resolves on the server,
	 * so it is not marked, and an empty field is not marked either.
	 */
	function isRejected( type, value, options ) {
		const v = value === undefined || value === null ? '' : String( value ).trim();
		if ( ! type || v === '' || v.indexOf( '{' ) !== -1 || ! snn.styleProps ) {
			return false;
		}
		return snn.styleProps.check( type, v, options || [] ) === '';
	}

	/** The attributes of a field: its tip, or, when the table rejects its value, the red mark and what is accepted. */
	function fieldAttr( tip, type, rejected ) {
		if ( ! rejected ) {
			return tipAttr( tip );
		}
		return { 'aria-invalid': 'true', 'data-snn-tip-name': __( 'Not accepted', 'snn' ), 'data-snn-tip-text': ACCEPTS[ type ] || '' };
	}

	/** The table's type and options of a setting (empty when the setting is not in the table). */
	function tableSpec( key ) {
		const row = ( snn.data.styleTable || [] ).find( ( r ) => r[ 0 ] === key );
		return row ? { type: row[ 2 ], options: row[ 3 ] || [] } : { type: undefined, options: [] };
	}

	/** A small lightning bolt, the dynamic data mark. */
	function Bolt() {
		return h(
			'svg',
			{ className: 'snn-bolt', viewBox: '0 0 24 24', width: 12, height: 12, 'aria-hidden': 'true', focusable: 'false' },
			h( 'path', { d: 'M13 2 3 14h7l-1 8 10-12h-7z', fill: 'currentColor' } )
		);
	}

	/** A small picture: the media library button of an image field. */
	function ImageIcon() {
		return h(
			'svg',
			{ className: 'snn-image-icon', viewBox: '0 0 16 16', width: 14, height: 14, 'aria-hidden': 'true', focusable: 'false' },
			h( 'rect', { x: 2.5, y: 3.5, width: 11, height: 9, rx: 1, fill: 'none', stroke: 'currentColor', strokeWidth: 1.4 } ),
			h( 'path', { d: 'M3 11.5l3-3.2 2.4 2.4 1.6-1.6 3 2.4', fill: 'none', stroke: 'currentColor', strokeWidth: 1.4, strokeLinejoin: 'round' } ),
			h( 'circle', { cx: 5.7, cy: 6.2, r: 1, fill: 'currentColor' } )
		);
	}

	/**
	 * The WordPress media library: picks one image and hands its address to onChange as url(...), the form the
	 * background image takes (style-props.php check()). Nothing happens when the media library is not on the page.
	 */
	function pickMedia( onChange ) {
		if ( ! window.wp || ! window.wp.media ) {
			return;
		}
		const frame = window.wp.media( { title: __( 'Choose an image', 'snn' ), library: { type: 'image' }, button: { text: __( 'Use this image', 'snn' ) }, multiple: false } );
		frame.on( 'select', () => {
			const picked = frame.state().get( 'selection' ).first();
			const url = picked && picked.toJSON ? picked.toJSON().url : '';
			if ( url ) {
				onChange( 'url(' + url + ')' );
			}
		} );
		frame.open();
	}

	/** The value differs from its default: a small dot, as Bricks marks a stored value. */
	function Dot() {
		return h( 'span', { className: 'snn-dot', 'aria-hidden': 'true' } );
	}

	function Switch( { checked, onChange, label, tip } ) {
		return h(
			'button',
			{
				type: 'button',
				role: 'switch',
				className: 'snn-switch' + ( checked ? ' is-on' : '' ),
				'aria-checked': checked ? 'true' : 'false',
				'aria-label': label,
				'data-snn-tip': tip || undefined,
					onClick: () => onChange( ! checked ),
			},
			h( 'span', { className: 'snn-switch-knob', 'aria-hidden': 'true' } )
		);
	}

	function Row( { label, changed, tip, children } ) {
		return h(
			'div',
			{ className: 'snn-row' },
			h( 'span', Object.assign( { className: 'snn-row-label' }, tipAttr( tip ) ), label, changed ? h( Dot ) : null ),
			h( 'div', { className: 'snn-row-control' }, children )
		);
	}

	/** A row with a switch on the right. */
	function SwitchRow( { label, checked, onChange, changed, tip } ) {
		return h(
			Row,
			{ label, changed: changed !== undefined ? changed : checked, tip },
			h( Switch, { checked, onChange, label, tip } )
		);
	}

	/**
	 * A section that opens and closes. When disabled, the header is greyed and cannot open, and
	 * the hint says why (for example: turn on the query loop first).
	 */
	function Accordion( { title, open, onToggle, disabled, changed, tip, planned, note, children } ) {
		const isOpen = !! open && ! disabled;
		return h(
			'div',
			{ className: 'snn-acc' + ( isOpen ? ' is-open' : '' ) + ( disabled ? ' is-disabled' : '' ) },
			h(
				'button',
									{
						type: 'button',
						className: 'snn-acc-head',
						'aria-expanded': isOpen ? 'true' : 'false',
						'aria-disabled': disabled ? 'true' : 'false',
						'data-snn-tip': tip || undefined,
						onClick: () => {
						if ( ! disabled ) {
							onToggle( ! open );
						}
					},
				},
				h(
					'svg',
					{ className: 'snn-chev', viewBox: '0 0 16 16', 'aria-hidden': 'true', focusable: 'false' },
					h( 'path', { d: isOpen ? 'M4 6l4 4 4-4' : 'M6 4l4 4-4 4' } )
				),
				h(
					'span',
					{ className: 'snn-acc-title' },
					title,
					planned ? h( 'span', { className: 'snn-planned' }, __( 'planned', 'snn' ) ) : null
				),
				changed ? h( Dot ) : null,
				note ? h( 'span', { className: 'snn-note' }, note ) : null
			),
			isOpen ? h( 'div', { className: 'snn-acc-body' }, children ) : null
		);
	}

	function Select( { value, options, onChange, label, tip } ) {
		return h(
			'select',
			{
				className: 'snn-select',
					...tipAttr( tip ),
				value,
				'aria-label': label,
				onChange: ( e ) => onChange( e.target.value ),
			},
			options.map( ( o ) => h( 'option', { key: o.value, value: o.value }, o.label ) )
		);
	}

	/**
	 * A row of icon buttons, one per option. options: { value, label, glyph (an icon element), changed (a small dot on
	 * the button's top right, when the option holds a change) }.
	 */
	function Segmented( { value, options, onChange, label, tip } ) {
		return h(
			'div',
			{ className: 'snn-seg', role: 'group', 'aria-label': label },
			options.map( ( o ) =>
				h(
					'button',
					{
						key: o.value,
						type: 'button',
						className: 'snn-seg-btn' + ( o.value === value ? ' is-on' : '' ),
						'aria-pressed': o.value === value ? 'true' : 'false',
						'aria-label': o.label,
						...( o.tip ? tipAttr( o.tip ) : tip ? snn.tips.optionAttr( o.label, tip ) : {} ),
						onClick: () => onChange( o.value ),
					},
					o.glyph || null,
					o.changed ? h( 'span', { className: 'snn-dot snn-seg-dot', 'aria-hidden': 'true' } ) : null
				)
			)
		);
	}

	/** Closes a popover on an outside click or Escape. refs: the field and the popover, which sits in the body. */
	function usePopoverClose( open, refs, close ) {
		useEffect( () => {
			if ( ! open ) {
				return undefined;
			}
			const onDown = ( e ) => {
				const inside = refs.some( ( r ) => r.current && r.current.contains( e.target ) );
				if ( ! inside ) {
					close();
				}
			};
			const onKey = ( e ) => {
				if ( e.key === 'Escape' ) {
					close();
				}
			};
			document.addEventListener( 'mousedown', onDown );
			document.addEventListener( 'keydown', onKey );
			return () => {
				document.removeEventListener( 'mousedown', onDown );
				document.removeEventListener( 'keydown', onKey );
			};
		}, [ open ] );
	}

	const POP_GAP = 4; // the space between a field and its popover
	const POP_EDGE = 8; // the least space kept between a popover and the window's edge
	const POP_MAX = 320; // the tallest a popover grows; its list scrolls beyond that

	/**
	 * Places a popover (a fixed box, see controls.css) under its field, with its right edge on the field's right edge.
	 * When there is no room below, it opens above the field. It moves in from the window's edges when it would
	 * stick out, so it always fits the window and the sidebar's overflow cannot cut it off.
	 */
	function placePop( anchor, pop ) {
		const a = anchor.getBoundingClientRect();
		const vw = document.documentElement.clientWidth;
		const vh = window.innerHeight;
		const width = pop.offsetWidth;
		const left = Math.max( POP_EDGE, Math.min( a.right - width, vw - width - POP_EDGE ) );
		// The top limit is under the WordPress admin bar and the editor's header, which paint over a popover.
		const topLimit = popTopLimit() + POP_EDGE;
		const below = vh - POP_EDGE - ( a.bottom + POP_GAP );
		const above = a.top - POP_GAP - topLimit;
		pop.style.left = left + 'px';
		pop.style.right = 'auto';
		if ( below >= 160 || below >= above ) {
			pop.style.top = a.bottom + POP_GAP + 'px';
			pop.style.bottom = 'auto';
			pop.style.maxHeight = Math.max( 80, Math.min( POP_MAX, below ) ) + 'px';
		} else {
			pop.style.top = 'auto';
			pop.style.bottom = vh - a.top + POP_GAP + 'px';
			pop.style.maxHeight = Math.max( 80, Math.min( POP_MAX, above ) ) + 'px';
		}
	}

	/** The bottom of the WordPress admin bar (0 when it is not shown): a popover stays below it. */
	function popTopLimit() {
		const bar = document.getElementById( 'wpadminbar' );
		return bar ? bar.getBoundingClientRect().bottom : 0;
	}

	/** A popover is drawn in the body, not inside the panel: the sidebar's header and the editor's header cannot cover it. */
	function inBody( node ) {
		return createPortal( node, document.body );
	}

	/** Places the open popover when it opens, and again on every scroll or resize, so it stays with its field. */
	function usePopPlacement( open, anchor, pop ) {
		useLayoutEffect( () => {
			if ( ! open ) {
				return undefined;
			}
			const place = () => {
				if ( anchor.current && pop.current ) {
					placePop( anchor.current, pop.current );
				}
			};
			place();
			window.addEventListener( 'resize', place );
			document.addEventListener( 'scroll', place, true );
			return () => {
				window.removeEventListener( 'resize', place );
				document.removeEventListener( 'scroll', place, true );
			};
		}, [ open ] );
	}

	/** The resolved text of a value with tags, from the server. Empty when there are no tags. */
	function usePreview( text ) {
		const [ out, setOut ] = useState( '' );
		useEffect( () => {
			if ( ! text || text.indexOf( '{' ) === -1 ) {
				setOut( '' );
				return undefined;
			}
			let live = true;
			const timer = setTimeout( () => {
				wp.apiFetch( {
					path: '/snn/v1/dynamic-data/preview',
					method: 'POST',
					data: { text, post_id: currentPostId() },
				} )
					.then( ( r ) => {
						if ( live ) {
							setOut( r && typeof r.text === 'string' ? r.text : '' );
						}
					} )
					.catch( () => {
						if ( live ) {
							setOut( '' );
						}
					} );
			}, 350 );
			return () => {
				live = false;
				clearTimeout( timer );
			};
		}, [ text ] );
		return out;
	}

	/** The list of dynamic data tags. Click one to insert it at the cursor. */
	function TagPicker( { onPick, onClose, popRef } ) {
		const [ query, setQuery ] = useState( '' );
		const needle = query.trim().toLowerCase();
		const tags = dynamic.tags.filter(
			( t ) => ! needle || t.key.indexOf( needle ) !== -1 || t.label.toLowerCase().indexOf( needle ) !== -1
		);
		return h(
			'div',
			{ className: 'snn-pop snn-panel snn-tag-pop', ref: popRef, role: 'dialog', 'aria-label': __( 'Dynamic data', 'snn' ) },
			h( 'input', {
				type: 'search',
				className: 'snn-input snn-pop-search',
				placeholder: __( 'Search dynamic data', 'snn' ),
					...tipAttr( 'dynamicSearch' ),
				value: query,
				autoFocus: true,
				onChange: ( e ) => setQuery( e.target.value ),
			} ),
			h(
				'div',
				{ className: 'snn-pop-list' },
				Object.keys( dynamic.groups ).map( ( group ) => {
					const items = tags.filter( ( t ) => t.group === group );
					if ( ! items.length ) {
						return null;
					}
					return h(
						Fragment,
						{ key: group },
						h( 'div', { className: 'snn-pop-group' }, dynamic.groups[ group ] ),
						items.map( ( t ) =>
							h(
								'button',
								{
									key: t.key,
										'data-snn-tip-name': t.label,
										'data-snn-tip-text': t.hint || __( 'Inserts this tag at the cursor.', 'snn' ),
									type: 'button',
									className: 'snn-pop-item',
									onClick: () => {
										onPick( '{' + t.key + '}' );
										onClose();
									},
								},
								h( 'span', { className: 'snn-pop-label' }, t.label ),
								h( 'code', null, '{' + t.key + '}' ),
								t.hint ? h( 'span', { className: 'snn-pop-hint' }, t.hint ) : null
							)
						)
					);
				} ),
				tags.length === 0 ? h( 'div', { className: 'snn-pop-empty' }, __( 'No match.', 'snn' ) ) : null
			)
		);
	}

	/**
	 * Variables: the theme's presets. Click one to use it as the value. The groups of the field's kind
	 * ('color' or 'size') come first. The other kind sits in a closed section at the bottom, so an
	 * exact name can still be found and clicked.
	 */
	function VariablePicker( { groups, kind, onPick, popRef } ) {
		// A colour field sees colour variables only. A size field lists sizes first and the colours closed at the bottom.
		// Every other field (numbers, text, and so on) sees all the variables in one list.
		const own = kind === 'color' || kind === 'size' ? groups.filter( ( g ) => g.kind === kind ) : groups;
		const same = own;
		const other = kind === 'size' ? groups.filter( ( g ) => g.kind !== 'size' ) : [];
		const otherLabel = __( 'Colours', 'snn' );
		const group = ( g ) =>
			h(
				Fragment,
				{ key: g.key },
				h( 'div', { className: 'snn-pop-group' }, g.label ),
				g.items.map( ( it ) =>
					h(
						'button',
						{ key: it.value, type: 'button', className: 'snn-pop-item', onClick: () => onPick( it.value ), 'data-snn-tip-name': '--' + it.label, 'data-snn-tip-text': __( 'Click to use this variable.', 'snn' ) },
						it.color ? h( 'span', { className: 'snn-swatch', style: { background: it.color }, 'aria-hidden': 'true' } ) : null,
						h( 'span', { className: 'snn-pop-label' }, it.label ),
						h( 'code', null, it.value )
					)
				)
			);
		return h(
			'div',
			{ className: 'snn-pop snn-panel snn-var-pop', ref: popRef, role: 'dialog', 'aria-label': __( 'Variables', 'snn' ) },
			h(
				'div',
				{ className: 'snn-pop-list' },
				same.map( group ),
				other.length
					? h(
							'details',
							{ className: 'snn-pop-more' },
							h( 'summary', Object.assign( { className: 'snn-pop-group snn-pop-more-title' }, tipAttr( 'variablesMore' ) ), otherLabel ),
							other.map( group )
					  )
					: null,
				groups.length === 0 ? h( 'div', { className: 'snn-pop-empty' }, __( 'No variables yet.', 'snn' ) ) : null
			)
		);
	}

	/** The colour a value stands for: a colour as typed, or the colour of a variable from the list. Empty when none. */
	function colourOf( value, variables ) {
		const v = String( value || '' ).trim();
		if ( v.indexOf( 'var(' ) !== 0 ) {
			return v;
		}
		let found = '';
		( variables || [] ).forEach( ( g ) =>
			g.items.forEach( ( it ) => {
				if ( it.value === v && it.color ) {
					found = it.color;
				}
			} )
		);
		return found;
	}

	/**
	 * The swatch at the start of a colour field. It shows the colour; a click opens the browser's own colour
	 * picker (decision D17). The picker only handles #rrggbb, so other values open at black until one is chosen.
	 *
	 * A move in the picker changes only this swatch's state, so the picker and the swatch follow the pointer at once.
	 * The block gets the colour at most once per animation frame, and the final colour when the picker closes (its
	 * change event). The block and the panel do not re-render on every move.
	 */
	/**
	 * A colour as the native picker takes it (#rrggbb) and its opacity in percent. rgba() and #rrggbbaa carry the alpha;
	 * a colour with no alpha is opaque (100). Anything else (a variable not resolved, a name) shows black.
	 */
	function splitColour( shown ) {
		const s = String( shown || '' ).trim();
		const rgba = /^rgba?\(\s*(\d{1,3})\s*[ ,]\s*(\d{1,3})\s*[ ,]\s*(\d{1,3})\s*(?:[ ,/]\s*([\d.]+)(%?)\s*)?\)$/i.exec( s );
		if ( rgba ) {
			const hex = '#' + [ rgba[ 1 ], rgba[ 2 ], rgba[ 3 ] ].map( ( n ) => Math.min( 255, Number( n ) ).toString( 16 ).padStart( 2, '0' ) ).join( '' );
			const alpha = rgba[ 4 ] === undefined ? 1 : rgba[ 5 ] ? Number( rgba[ 4 ] ) / 100 : Number( rgba[ 4 ] );
			return { hex, alpha: Math.round( Math.min( 1, Math.max( 0, alpha ) ) * 100 ) };
		}
		const hex8 = /^#([0-9a-f]{6})([0-9a-f]{2})$/i.exec( s );
		if ( hex8 ) {
			return { hex: '#' + hex8[ 1 ].toLowerCase(), alpha: Math.round( ( parseInt( hex8[ 2 ], 16 ) / 255 ) * 100 ) };
		}
		let hex = '#000000';
		if ( /^#[0-9a-f]{6}$/i.test( s ) ) {
			hex = s;
		} else if ( /^#[0-9a-f]{3}$/i.test( s ) ) {
			hex = '#' + s.slice( 1 ).split( '' ).map( ( c ) => c + c ).join( '' );
		}
		return { hex, alpha: 100 };
	}

	/** The colour with its opacity: the hex when opaque (100), rgba() below that. */
	function composeColour( hex, alpha ) {
		if ( alpha >= 100 ) {
			return hex;
		}
		const n = [ 1, 3, 5 ].map( ( i ) => parseInt( hex.substr( i, 2 ), 16 ) );
		return 'rgba(' + n[ 0 ] + ', ' + n[ 1 ] + ', ' + n[ 2 ] + ', ' + Math.max( 0, alpha ) / 100 + ')';
	}

	/** The swatch's checkerboard, under the colour, so a transparent colour shows as transparent. */
	const SWATCH_CHECKER = 'conic-gradient(#d8d8d8 25%, #ffffff 0 50%, #d8d8d8 0 75%, #ffffff 0)';

	function ColourSwatch( { value, variables, label, onChange } ) {
		const stored = colourOf( value, variables );
		// The colour the picker moved to that the block has not shown yet. Null when the block's colour is shown.
		const [ picked, setPicked ] = useState( null );
		const [ open, setOpen ] = useState( false );
		const shown = picked !== null ? picked : stored;
		const { hex, alpha } = splitColour( shown );
		const button = useRef( null );
		const field = useRef( null ); // the field the popover sits under
		const pop = useRef( null );
		const input = useRef( null );
		const frame = useRef( null ); // the animation frame that will write the colour, if one is waiting
		const pending = useRef( null ); // the colour to write, if one is waiting
		const write = useRef( onChange );
		write.current = onChange;

		// Writes the waiting colour to the block now, and cancels the frame that would have done it.
		const flush = () => {
			if ( frame.current !== null ) {
				cancelAnimationFrame( frame.current );
				frame.current = null;
			}
			if ( pending.current !== null ) {
				const next = pending.current;
				pending.current = null;
				write.current( next );
			}
		};

		// A move in the picker: show it now, and write it at the next frame.
		const move = ( next ) => {
			setPicked( next );
			pending.current = next;
			if ( frame.current === null ) {
				frame.current = requestAnimationFrame( () => {
					frame.current = null;
					flush();
				} );
			}
		};

		// The popover (the native picker for the hue, and the opacity). It closes on an outside click or Escape, and
		// closing writes the final colour. The native picker's change event writes it too.
		const close = () => {
			setOpen( false );
			flush();
		};
		usePopoverClose( open, [ field, pop ], close );
		usePopPlacement( open, field, pop );
		useEffect( () => {
			const el = input.current;
			if ( ! open || ! el ) {
				return undefined;
			}
			el.addEventListener( 'change', flush );
			return () => el.removeEventListener( 'change', flush );
		}, [ open ] );

		// The block holds the picked colour: show the block's colour again (it is the same colour, so nothing jumps).
		useEffect( () => {
			if ( picked !== null && stored.toLowerCase() === picked.toLowerCase() ) {
				setPicked( null );
			}
		}, [ picked, stored ] );

		// Removed or deselected in the middle of a drag: the last colour still reaches the block.
		useEffect( () => () => flush(), [] );

		const face = shown || 'transparent';
		return h(
			Fragment,
			null,
			h(
				'button',
				{
					type: 'button',
					ref: button,
					className: 'snn-swatch-btn',
					'aria-haspopup': 'dialog',
					'aria-expanded': open ? 'true' : 'false',
					'aria-label': label,
					...tipAttr( 'swatch' ),
					onClick: () => {
						if ( open ) {
							close();
							return;
						}
						// The popover sits under the whole field, so it lines up with the field's right edge.
						field.current = button.current ? button.current.closest( '.snn-input-wrap' ) : null;
						setOpen( true );
					},
				},
				h( 'span', { className: 'snn-swatch', style: { backgroundImage: 'linear-gradient(' + face + ', ' + face + '), ' + SWATCH_CHECKER, backgroundSize: '100% 100%, 8px 8px' }, 'aria-hidden': 'true' } )
			),
			open
				? inBody(
						h(
							'div',
							{ className: 'snn-pop snn-panel snn-swatch-pop', ref: pop, role: 'dialog', 'aria-label': label },
							h( 'input', {
								ref: input,
								type: 'color',
								className: 'snn-swatch-input',
								value: hex,
								'aria-label': label,
								onChange: ( e ) => move( composeColour( e.target.value, alpha ) ),
							} ),
							h(
								'label',
								{ className: 'snn-swatch-alpha' },
								h( 'span', { className: 'snn-swatch-alpha-title' }, __( 'Opacity', 'snn' ) ),
								h( 'input', {
									type: 'range',
									min: 0,
									max: 100,
									step: 1,
									value: alpha,
									className: 'snn-swatch-range',
									'aria-label': __( 'Opacity', 'snn' ),
									onChange: ( e ) => move( composeColour( hex, Number( e.target.value ) ) ),
								} ),
								h( 'span', { className: 'snn-swatch-value' }, alpha + '%' )
							),
							h( 'div', { className: 'snn-swatch-text' }, composeColour( hex, alpha ) )
						)
				  )
				: null
		);
	}

	/**
	 * A text or number field. variables: the variable groups it may use (optional). The
	 * lightning opens the dynamic data list; the field then keeps the tag as typed and shows
	 * what it resolves to under the field. swatch: a colour field, with its colour at the start.
	 */
	function TextField( { value, onChange, label, placeholder, variables, kind, inputMode, unit, swatch, tip, media, type, options } ) {
		const [ picker, setPicker ] = useState( null ); // null, 'tags' or 'vars'
		const wrap = useRef( null );
		const input = useRef( null );
		const pop = useRef( null );
		const current = value || '';
		// The unit tag (px, %, deg) shows while the value is empty or still a plain number. Once a unit or a
		// function is typed (50%, 10vw, calc(...)), the tag goes, so it never names a unit the value does not use.
		const showUnit = !! unit && /^[\s+\-.\d]*$/.test( String( current ) );
		const preview = usePreview( current );
		// A value the table rejects: the field shows the red mark and what is accepted (its tip), and the value is kept as typed.
		const rejected = isRejected( type, current, options );
		usePopoverClose( picker !== null, [ wrap, pop ], () => setPicker( null ) );
		usePopPlacement( picker !== null, wrap, pop );

		const insert = ( text ) => {
			const el = input.current;
			const start = el && typeof el.selectionStart === 'number' ? el.selectionStart : current.length;
			const end = el && typeof el.selectionEnd === 'number' ? el.selectionEnd : start;
			onChange( current.slice( 0, start ) + text + current.slice( end ) );
		};

		return h(
			'div',
			{ className: 'snn-field', ref: wrap },
			h(
				'div',
				{ className: 'snn-input-wrap' + ( variables ? ' has-vars' : '' ) + ( showUnit ? ' has-unit' : '' ) + ( media ? ' has-media' : '' ) },
				swatch ? h( ColourSwatch, { value: current, variables, label, onChange } ) : null,
				h( 'input', {
					ref: input,
					type: 'text',
					className: 'snn-input',
					value: current,
					placeholder,
					inputMode,
					'aria-label': label,
					spellCheck: false,
					'aria-invalid': rejected ? 'true' : undefined,
					// Up and Down step the number (style-props.js step); the step is a typed change, so it joins the run of typing.
					onKeyDown: ( e ) => {
						if ( e.key !== 'ArrowUp' && e.key !== 'ArrowDown' ) {
							return;
						}
						const next = snn.styleProps ? snn.styleProps.step( current, e.key === 'ArrowUp' ? 1 : -1, e.shiftKey, NON_NEGATIVE.indexOf( type ) !== -1 ? 0 : undefined ) : null;
						if ( next !== null ) {
							e.preventDefault();
							onChange( next );
						}
					},
						...fieldAttr( tip, type, rejected ),
					onChange: ( e ) => onChange( e.target.value ),
				} ),
				showUnit ? h( 'span', { className: 'snn-unit', 'aria-hidden': 'true' }, unit ) : null,
				media
					? h(
							'button',
							{
								type: 'button',
								className: 'snn-tool snn-tool-media',
								...tipAttr( 'mediaLibrary' ),
								'aria-label': __( 'Choose from the media library', 'snn' ),
								onClick: () => pickMedia( onChange ),
							},
							h( ImageIcon )
					  )
					: null,
				variables
					? h(
							'button',
							{
								type: 'button',
								className: 'snn-tool snn-tool-vars',
								...tipAttr( 'variables' ),
								'aria-label': __( 'Variables', 'snn' ),
								'aria-expanded': picker === 'vars' ? 'true' : 'false',
								onClick: () => setPicker( picker === 'vars' ? null : 'vars' ),
							},
							h( 'span', { className: 'snn-tool-text', 'aria-hidden': 'true' }, 'V' )
					  )
					: null,
				h(
					'button',
					{
						type: 'button',
						className: 'snn-tool snn-tool-dyn' + ( picker === 'tags' ? ' is-on' : '' ),
						...tipAttr( 'dynamic' ),
						'aria-label': __( 'Dynamic data', 'snn' ),
						'aria-expanded': picker === 'tags' ? 'true' : 'false',
						onClick: () => setPicker( picker === 'tags' ? null : 'tags' ),
					},
					h( Bolt )
				)
			),
			preview ? h( 'div', { className: 'snn-preview', ...tipAttr( 'preview' ) }, '→ ' + preview ) : null,
			picker === 'tags' ? inBody( h( TagPicker, { onPick: insert, onClose: () => setPicker( null ), popRef: pop } ) ) : null,
			picker === 'vars'
				? inBody(
						h( VariablePicker, {
							groups: variables || [],
							popRef: pop,
							kind,
							onPick: ( v ) => {
								onChange( v );
								setPicker( null );
							},
						} )
				  )
				: null
		);
	}

	/* ------------------------------------------------------------------
	 * Groups and per-view values (the version 12 layout)
	 * ---------------------------------------------------------------- */

	/** A group of rows: a title in small capitals, a note on the right, then the rows. */
	function Group( { title, note, children, tip } ) {
		return h(
			'div',
			{ className: 'snn-group' },
			h(
				'div',
				{ className: 'snn-group-head' },
				h( 'span', Object.assign( { className: 'snn-group-title' }, tipAttr( tip ) ), title ),
				note ? h( 'span', { className: 'snn-group-note' }, note ) : null
			),
			children
		);
	}

	/**
	 * A part that opens and closes, closed at first. card: a row of the Style tab, with its value on the right.
	 * planned: its content is not built yet, so opening it says so (unless it has content).
	 */
	function Disclosure( { title, note, card, planned, startOpen, tip, children } ) {
		const [ open, setOpen ] = useState( !! startOpen );
		return h(
			'div',
			{ className: 'snn-disc' + ( card ? ' is-card' : '' ) + ( open ? ' is-open' : '' ) },
			h(
				'button',
				{
					type: 'button',
					className: 'snn-disc-head',
					...tipAttr( tip ),
					'aria-expanded': open ? 'true' : 'false',
					onClick: () => setOpen( ! open ),
				},
				h( 'span', { className: card ? 'snn-disc-card-title' : 'snn-group-title' }, title ),
				planned ? h( 'span', { className: 'snn-planned' }, __( 'planned', 'snn' ) ) : null,
				note ? h( 'span', { className: 'snn-group-note' }, note ) : null,
				h(
					'svg',
					{ className: 'snn-chev', viewBox: '0 0 16 16', 'aria-hidden': 'true', focusable: 'false' },
					h( 'path', { d: open ? 'M4 6l4 4 4-4' : 'M6 4l4 4-4 4' } )
				)
			),
			open
				? h(
						'div',
						{ className: 'snn-disc-body' },
						children || ( planned ? h( 'p', { className: 'snn-hint' }, __( 'Planned. Not saved yet.', 'snn' ) ) : null )
				  )
				: null
		);
	}

	/**
	 * A value that can differ per view. No hint under the label: an inherited value shows as the field's placeholder,
	 * and a value the view sets shows a dot on the label. Its Reset (not on Desktop) takes the view's own value back.
	 */
	function ViewRow( { label, device, own, onReset, tip, css, children } ) {
		return h(
			'div',
			{ className: 'snn-row snn-view-row' + ( own ? ' is-own' : '' ) },
			h(
				'span',
				{ className: 'snn-row-label' },
				h(
						'span',
						Object.assign( { className: 'snn-row-title' }, tipAttr( tip ) ),
						h( 'span', { className: 'snn-row-text' }, label ),
						own ? h( Dot ) : null,
						// css: the CSS property of the row. Its "?" opens the property's MDN page in a new tab.
						css
							? h(
									'a',
									{
										className: 'snn-row-help',
										href: MDN_PROPERTY + css,
										target: '_blank',
										rel: 'noopener noreferrer',
										'aria-label': sprintf( __( 'Learn more about %s on MDN', 'snn' ), css ),
									},
									'?'
							  )
							: null
					)
			),
			h(
				'div',
				{ className: 'snn-row-control snn-view-control' },
				children,
				own && onReset ? h( 'button', { type: 'button', className: 'snn-reset', onClick: onReset, ...tipAttr( 'reset' ) }, __( 'Reset', 'snn' ) ) : null
			)
		);
	}

	/** The views that can set their own values, by device name. Desktop holds the base values. */
	const VIEW_OF = { Tablet: 'tablet', Mobile: 'mobile' };

	/** The value a view sets for itself, or undefined when it does not (Desktop never does). */
	function ownValue( a, device, key ) {
		const view = VIEW_OF[ device ];
		const own = view && a.responsive ? a.responsive[ view ] : null;
		return own && own[ key ] !== undefined && own[ key ] !== '' ? own[ key ] : undefined;
	}

	/** The value a view inherits: from Tablet for Mobile when Tablet sets it, otherwise from Desktop. */
	function inheritedValue( a, device, key ) {
		if ( device === 'Mobile' ) {
			const tablet = ownValue( a, 'Tablet', key );
			if ( tablet !== undefined ) {
				return { value: tablet, from: 'Tablet' };
			}
		}
		return { value: a[ key ], from: 'Desktop' };
	}

	/** The values a device shows: the base, then the views above it, then its own (as the front end resolves them). */
	function effectiveValues( a, device ) {
		const out = { ...a };
		const layers = device === 'Mobile' ? [ 'tablet', 'mobile' ] : device === 'Tablet' ? [ 'tablet' ] : [];
		layers.forEach( ( view ) => {
			const own = a.responsive && a.responsive[ view ] ? a.responsive[ view ] : {};
			Object.keys( own ).forEach( ( k ) => {
				if ( own[ k ] !== undefined && own[ k ] !== '' ) {
					out[ k ] = own[ k ];
				}
			} );
		} );
		return out;
	}

	/** Sets a value for the device: the base on Desktop, the device's own value on Tablet and Mobile. An empty value clears it. */
	function setValue( a, set, device, key, value ) {
		if ( device === 'Desktop' ) {
			set( { [ key ]: value } );
			return;
		}
		const view = VIEW_OF[ device ];
		if ( value === '' || value === undefined ) {
			clearValue( a, set, device, key );
			return;
		}
		const responsive = { ...( a.responsive || {} ) };
		responsive[ view ] = { ...( responsive[ view ] || {} ), [ key ]: value };
		set( { responsive } );
	}

	/** Takes a view's own value back, so the view inherits again. A view with nothing left is removed. */
	function clearValue( a, set, device, key ) {
		const view = VIEW_OF[ device ];
		if ( ! view ) {
			return;
		}
		const responsive = { ...( a.responsive || {} ) };
		const own = { ...( responsive[ view ] || {} ) };
		delete own[ key ];
		if ( Object.keys( own ).length ) {
			responsive[ view ] = own;
		} else {
			delete responsive[ view ];
		}
		set( { responsive } );
	}

	/**
	 * Back to the block's default, with one set (so one undo step). On Desktop the base value is emptied: an empty value
	 * is the default for every setting. On Tablet and Mobile the view's own value is taken back (clearValue).
	 */
	function resetValue( a, set, device, key ) {
		closeStep();
		if ( device === 'Desktop' ) {
			set( { [ key ]: '' } );
			return;
		}
		clearValue( a, set, device, key );
	}

	/** The key of the typing run in progress (a field and a view), or null. */
	let typingKey = null;

	/**
	 * Undo steps. WordPress merges an update of a block's attributes into the step before when the update has the same
	 * keys (block-editor isUpdatingSameBlockAttribute), so a Reset, an icon click or a view's value would undo together with
	 * the edit before it. closeStep() ends the step before a discrete change (the same call WordPress makes for rich text).
	 * It only ends a step that was recorded (isLastBlockChangePersistent), so a block's automatic ID stays out of undo.
	 */
	function closeStep() {
		typingKey = null;
		const be = wp.data.dispatch( 'core/block-editor' );
		const sel = wp.data.select( 'core/block-editor' );
		if ( be && be.__unstableMarkLastChangeAsPersistent && sel && sel.isLastBlockChangePersistent && sel.isLastBlockChangePersistent() ) {
			be.__unstableMarkLastChangeAsPersistent();
		}
	}

	/** Before a typed change: a run of typing in one field and view is one step; another field or view starts a new one. */
	function typingStep( key ) {
		if ( key !== typingKey ) {
			closeStep();
		}
		typingKey = key;
	}

	/**
	 * Select Animation: the GSAP presets and modifiers (animation.php), in groups, with a search. Several can be
	 * chosen (the block plays them together), or one (an interaction's action). The choices show as chips.
	 */
	function AnimationPicker( { value, onChange, multiple, tip, groups: groupsOf } ) {
		const [ open, setOpen ] = useState( false );
		const wrap = useRef( null );
		const pop = useRef( null );
		usePopPlacement( open, wrap, pop );
		usePopoverClose( open, [ wrap, pop ], () => setOpen( false ) );
		const [ query, setQuery ] = useState( '' );
		// The groups to offer: all of them, unless the caller passes its own (the GSAP pane leaves out Scroll).
		const groups = groupsOf || data.animations || [];
		const labelOf = {};
		groups.forEach( ( g ) => g.items.forEach( ( i ) => {
			labelOf[ i.value ] = i.label;
		} ) );
		const chosen = Array.isArray( value ) ? value : value ? [ value ] : [];
		const q = query.trim().toLowerCase();
		const shown = groups
			.map( ( g ) => ( {
				label: g.label,
				items: g.items.filter( ( i ) => ! q || i.label.toLowerCase().indexOf( q ) !== -1 || i.value.toLowerCase().indexOf( q ) !== -1 ),
			} ) )
			.filter( ( g ) => g.items.length );
		const pick = ( v ) => {
			if ( ! multiple ) {
				onChange( v );
				setOpen( false );
				return;
			}
			onChange( chosen.indexOf( v ) === -1 ? chosen.concat( [ v ] ) : chosen.filter( ( x ) => x !== v ) );
		};
		const button = chosen.length
			? multiple
				? chosen.length + ' ' + __( 'chosen', 'snn' )
				: labelOf[ chosen[ 0 ] ] || chosen[ 0 ]
			: __( 'None', 'snn' );
		return h(
			'div',
			{ className: 'snn-anim', ref: wrap },
			h(
				'button',
				{
					type: 'button',
					className: 'snn-anim-button',
						...tipAttr( tip ),
					'aria-expanded': open ? 'true' : 'false',
					onClick: () => setOpen( ! open ),
				},
				button
			),
			multiple && chosen.length
				? h(
						'div',
						{ className: 'snn-chips' },
						chosen.map( ( v ) =>
							h(
								'span',
								{ key: v, className: 'snn-chip', 'data-snn-tip-name': labelOf[ v ] || v, 'data-snn-tip-text': __( 'GSAP animation on this element.', 'snn' ) },
								labelOf[ v ] || v,
								h(
									'button',
									{
										type: 'button',
										className: 'snn-chip-x',
											...tipAttr( 'chipRemove' ),
										'aria-label': __( 'Remove', 'snn' ),
										onClick: () => pick( v ),
									},
									'×'
								)
							)
						)
				  )
				: null,
			open
				? inBody(
					h(
						'div',
						{ className: 'snn-pop snn-panel snn-anim-pop', ref: pop, role: 'dialog', 'aria-label': __( 'Animations', 'snn' ) },
						h( 'input', {
							type: 'search',
							className: 'snn-input',
							placeholder: __( 'Search animations', 'snn' ),
								...tipAttr( 'gsapSearch' ),
							value: query,
							onChange: ( e ) => setQuery( e.target.value ),
						} ),
						h(
							'div',
							{ className: 'snn-pop-list' },
							shown.map( ( g ) =>
								h(
									Fragment,
									{ key: g.label },
									h( 'div', { className: 'snn-pop-group' }, g.label ),
									g.items.map( ( i ) =>
										h(
											'button',
											{
												key: i.value,
												type: 'button',
												'data-snn-tip-name': i.label,
													'data-snn-tip-text': multiple ? __( 'Click to add or remove it.', 'snn' ) : __( 'Click to choose it.', 'snn' ),
												className: 'snn-pop-item' + ( chosen.indexOf( i.value ) !== -1 ? ' is-on' : '' ),
												onClick: () => pick( i.value ),
											},
											h( 'span', { className: 'snn-pop-label' }, i.label )
										)
									)
								)
							)
						)
				  ) )
				: null
		);
	}

	/**
	 * A button for a rich text's toolbar (the Text block's bar) that opens the dynamic data list or the variable list,
	 * the same lists the fields use. A pick is handed to onPick as text: a tag such as {post_title}, or a variable such
	 * as var(--size-20). kind: 'tags' or 'vars'. groups: the variable groups. icon or glyph is the button's face.
	 */
	function ToolbarPicker( { kind, label, icon, glyph, groups, ToolbarButton, onPick } ) {
		const [ open, setOpen ] = useState( false );
		const wrap = useRef( null );
		const pop = useRef( null );
		usePopoverClose( open, [ wrap, pop ], () => setOpen( false ) );
		usePopPlacement( open, wrap, pop );
		const pick = ( text ) => {
			setOpen( false );
			onPick( text );
		};
		return h(
			'span',
			{ className: 'snn-toolbar-picker', ref: wrap, style: { display: 'inline-flex' } },
			h( ToolbarButton, { label, icon, isPressed: open, onClick: () => setOpen( ! open ) }, glyph ),
			open
				? inBody(
						kind === 'tags'
							? h( TagPicker, { onPick: pick, onClose: () => setOpen( false ), popRef: pop } )
							: h( VariablePicker, { groups: groups || [], onPick: pick, popRef: pop } )
				  )
				: null
		);
	}

	snn.controls = {
		tipAttr,
		tableSpec,
		isRejected,
		fieldAttr,
		AnimationPicker,
		Bolt,
		Dot,
		Switch,
		Row,
		SwitchRow,
		Accordion,
		Select,
		Segmented,
		TextField,
		ToolbarPicker,
		Group,
		Disclosure,
		ViewRow,
		ownValue,
		inheritedValue,
		effectiveValues,
		setValue,
		clearValue,
		resetValue,
		closeStep,
		typingStep,
	};
} )( window.wp );
