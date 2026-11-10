/**
 * SNN block editor: the Style tab: the groups on the rail, their rows, the box for margin and padding, the gradient stops.
 *
 * Part of the editor split of the old layout-blocks.js (see the change notes).
 */
( function ( wp ) {
	const C = snn.controls;
	const I = snn.layoutIcons;
	const { createElement: h, Fragment, useState, useEffect, useRef, useLayoutEffect } = wp.element;
	const { __, sprintf } = wp.i18n;
	const { registerBlockType } = wp.blocks;
	const { InnerBlocks, InspectorControls, RichText, useBlockProps, useInnerBlocksProps } = wp.blockEditor;
	const { useSelect } = wp.data;
	const { main: mainPic, cross: crossPic, direction: directionPic, reverse: reversePic, columns: columnsPic } = I;
	const { Row, SwitchRow, Accordion, Select, Segmented, TextField, Group, Disclosure, Dot, Switch, ViewRow, ownValue, inheritedValue, setValue, clearValue, effectiveValues, tipAttr, tableSpec, resetValue, closeStep, typingStep, ToolbarPicker } = C;
	const { HeadIcons, ClassesEditor, AttributesEditor, ConditionsEditor, InteractionsEditor } = snn.blockTools;
	const { AnimationsPane, stateOf, canvasDataAnimate } = snn.animationPane;
	const { ColorPalette, MediaUpload, MediaUploadCheck } = wp.blockEditor;
	const { Button, ColorPicker, Fill, Popover, ToolbarButton } = wp.components;
	const { applyFormat, create, getActiveFormat, insert, insertObject, removeFormat, toggleFormat } = wp.richText;
	const data = snn.data.controls || {};
	const { ALL_VIEWS, VARIABLE_GROUPS, ViewValue, options, setHere, setMany, str } = snn.panel;

	/** The overflow choices of the Visibility group. */
	const OVERFLOW_OPTIONS = [
		{ value: 'visible', label: __( 'Visible', 'snn' ) },
		{ value: 'hidden', label: __( 'Hidden', 'snn' ) },
		{ value: 'clip', label: __( 'Clip', 'snn' ) },
	];

	/**
	 * A choice of keywords, or a length of its own (background size). Custom is the last choice: it opens a length field
	 * under the choice. A length the view already holds opens Custom by itself. Choosing Custom clears a keyword, so the
	 * canvas and the front end show the same thing (the browser's default until a length is typed).
	 */
	/**
	 * The stops a view shows: its saved list (JSON), or, with nothing saved, the two colour fields from before the
	 * repeater, or two empty stops. The list is written whole, so a stop is never saved without its colour.
	 */
	function stopsOf( raw, a ) {
		try {
			const list = JSON.parse( raw || 'null' );
			if ( Array.isArray( list ) && list.length ) {
				return list.map( ( s ) => {
					const item = s && typeof s === 'object' ? s : {};
					return { color: str( item.color ), stop: str( item.stop ) };
				} );
			}
		} catch ( e ) {
			// Not a list: the stops from before the repeater show instead.
		}
		if ( a.gradientColor1 || a.gradientColor2 ) {
			return [ { color: str( a.gradientColor1 ), stop: str( a.gradientStop1 ) }, { color: str( a.gradientColor2 ), stop: str( a.gradientStop2 ) } ];
		}
		return [ { color: '', stop: '' }, { color: '', stop: '' } ];
	}

	/**
	 * The colour stops of a gradient: a repeater, one or more stops (a gradient needs two colours, so two at least). Each
	 * stop is a colour with an optional position; Add appends a stop, the cross removes one (not below two).
	 */
	/** Six dots: the grip of a colour stop (drag it to reorder the stops). */
	function GripIcon() {
		const dots = [ [ 5.5, 4 ], [ 10.5, 4 ], [ 5.5, 8 ], [ 10.5, 8 ], [ 5.5, 12 ], [ 10.5, 12 ] ];
		return h(
			'svg',
			{ className: 'snn-grip-icon', viewBox: '0 0 16 16', width: 12, height: 12, 'aria-hidden': 'true', focusable: 'false' },
			dots.map( ( d, i ) => h( 'circle', { key: i, cx: d[ 0 ], cy: d[ 1 ], r: 1.2, fill: 'currentColor' } ) )
		);
	}

	function GradientStops( { a, set, device } ) {
		const [ drag, setDrag ] = useState( null ); // { from, over } while a stop is dragged, otherwise null
		const own = setHere( a, device, 'gradientStops' );
		const stops = stopsOf( own !== undefined ? own : inheritedValue( a, device, 'gradientStops' ).value, a );
		// The whole list is written at each change, so a stop added before its colour is typed stays in the list.
		// A typed change (a colour or a position) joins the typing in that field; add, remove and move are discrete steps.
		const write = ( list, key ) => {
			if ( key ) {
				typingStep( key );
			} else {
				closeStep();
			}
			setValue( a, set, device, 'gradientStops', JSON.stringify( list ) );
		};
		const replace = ( i, patch ) => write( stops.map( ( s, j ) => ( j === i ? { ...s, ...patch } : s ) ), device + ':stop' + i + ':' + Object.keys( patch )[ 0 ] );
		// Moves the stop at from to the place of to: a drop, or an arrow key on a grip.
		const move = ( from, to ) => {
			if ( from === to || to < 0 || to >= stops.length ) {
				return;
			}
			const list = stops.slice();
			const [ item ] = list.splice( from, 1 );
			list.splice( to, 0, item );
			write( list );
		};
		return h(
			ViewRow,
			{ label: __( 'Colour stops', 'snn' ), device, tip: 'gradientStops', own: own !== undefined, onReset: () => resetValue( a, set, device, 'gradientStops' ) },
			h(
				'div',
				{ className: 'snn-stops' },
				stops.map( ( s, i ) =>
					h(
						'div',
						{
							key: i,
							className: 'snn-stop' + ( drag && drag.over === i && drag.from !== i ? ' is-over' : '' ),
							onDragOver: ( e ) => {
								if ( drag ) {
									e.preventDefault();
									if ( drag.over !== i ) {
										setDrag( { ...drag, over: i } );
									}
								}
							},
							onDrop: ( e ) => {
								e.preventDefault();
								if ( drag ) {
									move( drag.from, i );
								}
								setDrag( null );
							},
						},
						h( TextField, { label: __( 'Colour', 'snn' ) + ' ' + ( i + 1 ), tip: 'gradientStops', value: s.color, kind: 'color', type: 'color', swatch: true, variables: VARIABLE_GROUPS, onChange: ( v ) => replace( i, { color: v } ) } ),
						h( TextField, { label: __( 'Stop', 'snn' ) + ' ' + ( i + 1 ), tip: 'gradientStops', value: s.stop, unit: '%', type: 'percent', onChange: ( v ) => replace( i, { stop: v } ) } ),
						h(
							'span',
							{
								className: 'snn-stop-grip',
								role: 'button',
								tabIndex: 0,
								draggable: true,
								'aria-label': __( 'Move colour stop', 'snn' ) + ' ' + ( i + 1 ),
								title: __( 'Drag to reorder, or press the up and down arrow keys', 'snn' ),
								onDragStart: ( e ) => {
									e.dataTransfer.effectAllowed = 'move';
									e.dataTransfer.setData( 'text/plain', String( i ) );
									setDrag( { from: i, over: i } );
								},
								onDragEnd: () => setDrag( null ),
								onKeyDown: ( e ) => {
									if ( e.key !== 'ArrowUp' && e.key !== 'ArrowDown' ) {
										return;
									}
									e.preventDefault();
									const to = e.key === 'ArrowUp' ? i - 1 : i + 1;
									const box = e.currentTarget.closest( '.snn-stops' );
									move( i, to );
									// The stop moves, and the focus goes with it to its new place.
									window.setTimeout( () => {
										const grip = box ? box.querySelectorAll( '.snn-stop-grip' )[ to ] : null;
										if ( grip ) {
											grip.focus();
										}
									}, 0 );
								},
							},
							h( GripIcon )
						),
						stops.length > 2
							? h( 'button', { type: 'button', className: 'snn-stop-remove', 'aria-label': __( 'Remove colour stop', 'snn' ), onClick: () => write( stops.filter( ( x, j ) => j !== i ) ) }, '×' )
							: null
					)
				),
				h(
					'button',
					{ type: 'button', className: 'snn-stop-add', onClick: () => write( stops.concat( [ { color: stops[ stops.length - 1 ].color, stop: '' } ] ) ) },
					__( 'Add colour stop', 'snn' )
				)
			)
		);
	}

	/**
	 * The Style tab, laid out as Bricks does it: a rail of group icons, one group at a time, and the group's
	 * sections one under another. A row is a property of the table (style-props.php) or a view value. A box is
	 * the four sides of margin or padding, shown as a 2 by 2 grid (BoxModel below).
	 */
	const BOX_MARGIN = { box: 'margin', label: __( 'Margin', 'snn' ), keys: [ 'marginTop', 'marginRight', 'marginBottom', 'marginLeft' ] };

	const BOX_PADDING = { box: 'padding', label: __( 'Padding', 'snn' ), keys: [ 'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft' ] };

	const SIDE_LABEL = [ __( 'Top', 'snn' ), __( 'Right', 'snn' ), __( 'Bottom', 'snn' ), __( 'Left', 'snn' ) ];

	// Where each side sits in the box (layout-blocks.js BoxModel, controls.css .snn-box-grid): the same order as SIDE_LABEL.
	const BOX_AREA = [ 'top', 'right', 'bottom', 'left' ];

	const STYLE_PAGES = [
		{
			id: 'layout',
			label: __( 'Layout', 'snn' ),
			glyph: 'layout',
			sections: [
				{ tip: 'sec.flexgrid', title: __( 'Flex and grid', 'snn' ), rows: [ 'LAYOUT' ] },
				{ tip: 'sec.spacing', title: __( 'Spacing', 'snn' ), rows: [ BOX_MARGIN, BOX_PADDING, 'gap' ] },
				{ tip: 'sec.sizing', title: __( 'Sizing', 'snn' ), rows: [ 'width', 'minWidth', 'maxWidth', 'maxWidthOff', 'height', 'minHeight', 'maxHeight', 'aspectRatio' ] },
				{ tip: 'sec.positioning', title: __( 'Positioning', 'snn' ), rows: [ 'position', 'top', 'right', 'bottom', 'left', 'zIndex', 'scrollSnapAlign' ] },
				{ tip: 'sec.misc', title: __( 'Misc', 'snn' ), rows: [ 'opacity', 'overflow', 'visibility', 'cursor', 'isolation', 'mixBlendMode', 'pointerEvents', 'perspective', 'perspectiveOrigin' ] },
			],
		},
		{
			id: 'typography',
			label: __( 'Typography', 'snn' ),
			glyph: 'typography',
			sections: [
				{ tip: 'sec.text', title: __( 'Text', 'snn' ), rows: [ 'color', 'fontFamily', 'fontSize', 'fontWeight', 'fontStyle' ] },
				{ tip: 'sec.alignment', title: __( 'Alignment', 'snn' ), rows: [ 'textAlign', 'textTransform' ] },
				{ tip: 'sec.textSpacing', title: __( 'Spacing', 'snn' ), rows: [ 'lineHeight', 'letterSpacing' ] },
				{ tip: 'sec.more', title: __( 'More', 'snn' ), rows: [ 'textDecoration', 'textWrap', 'whiteSpace', 'textShadow' ] },
			],
		},
		{
			id: 'background',
			label: __( 'Background', 'snn' ),
			glyph: 'background',
			sections: [
				{ tip: 'sec.colour', title: __( 'Colour', 'snn' ), rows: [ 'backgroundColor' ] },
				{ tip: 'sec.image', title: __( 'Image', 'snn' ), rows: [ 'backgroundImage', 'backgroundSize', 'backgroundPosition', 'backgroundRepeat' ] },
			],
		},
		{
			id: 'gradient',
			label: __( 'Gradient', 'snn' ),
			glyph: 'gradient',
			// The two colour fields from before the repeater: no row now, but a saved value still counts for the rail dot.
			also: [ 'gradientColor1', 'gradientStop1', 'gradientColor2', 'gradientStop2' ],
			sections: [
				{ tip: 'sec.gradient', title: __( 'Gradient', 'snn' ), rows: [ 'gradientApply', 'gradientType', 'gradientAngle', 'gradientStops' ] },
			],
		},
		{
			id: 'border',
			label: __( 'Border', 'snn' ),
			glyph: 'border',
			sections: [
				{ tip: 'sec.border', title: __( 'Border', 'snn' ), rows: [ 'borderWidth', 'borderStyle', 'borderColor', 'borderRadius' ] },
				{ tip: 'sec.shadow', title: __( 'Box shadow', 'snn' ), rows: [ 'boxShadowX', 'boxShadowY', 'boxShadowBlur', 'boxShadowSpread', 'boxShadowColor' ] },
			],
		},
		{
			id: 'transform',
			label: __( 'Transform', 'snn' ),
			glyph: 'transform',
			sections: [
				{ tip: 'sec.transform', title: __( 'Transform', 'snn' ), rows: [ 'transformOrigin', 'translateX', 'translateY', 'rotate', 'scale', 'skewX', 'skewY' ] },
			],
		},
		{
			id: 'filters',
			label: __( 'Filters', 'snn' ),
			glyph: 'filters',
			sections: [
				{ tip: 'sec.filter', title: __( 'Filter', 'snn' ), rows: [ 'filterBlur', 'filterBrightness', 'filterContrast', 'filterGrayscale', 'filterHueRotate', 'filterInvert', 'filterSaturate', 'filterSepia' ] },
				{ tip: 'sec.transition', title: __( 'Transition', 'snn' ), rows: [ 'transitionProperty', 'transitionDuration', 'transitionTiming', 'transitionDelay' ] },
			],
		},
		{
			id: 'css',
			label: __( 'CSS', 'snn' ),
			text: 'CSS',
			kind: 'css',
			sections: [],
		},
	];

	/** The paths of the icons: the rail's group icons, the text align and transform rows, and the link toggle. */
	const GLYPHS = {
		layout: [ 'M2.5 2.5h11v11h-11z', 'M2.5 6.5h11', 'M6.5 6.5v7' ],
		typography: [ 'M3 13.5 7 2.5l4 11', 'M4.7 9.5h4.6' ],
		background: [ 'M2.5 2.5h11v11h-11z', 'M3.5 12 6.3 8.6l2.2 2.3 1.5-1.5 2.5 2.6' ],
		gradient: [ { d: 'M8 2.5a5.5 5.5 0 0 1 0 11z', fill: true }, 'M8 2.5a5.5 5.5 0 0 0 0 11 5.5 5.5 0 0 0 0-11z' ],
		border: [ { d: 'M2.5 2.5h11v11h-11z', dash: true } ],
		transform: [ 'M2.5 8h11', 'M5.5 5.5 3 8l2.5 2.5', 'M10.5 5.5 13 8l-2.5 2.5' ],
		filters: [ 'M2.5 3h11l-4.3 5.5v4l-2.4-1.5v-2.5z' ],
		link: [ 'M6.5 9.5a2.5 2.5 0 0 0 3.5 0l2-2a2.5 2.5 0 0 0-3.5-3.5l-.7.7', 'M9.5 6.5a2.5 2.5 0 0 0-3.5 0l-2 2a2.5 2.5 0 0 0 3.5 3.5l.7-.7' ],
		alignLeft: [ 'M2 3.5h11', 'M2 6.5h7', 'M2 9.5h9', 'M2 12.5h6' ],
		alignCenter: [ 'M2.5 3.5h11', 'M4.5 6.5h7', 'M3 9.5h10', 'M5 12.5h6' ],
		alignRight: [ 'M2 3.5h11', 'M7 6.5h6', 'M5 9.5h8', 'M8 12.5h5' ],
		alignJustify: [ 'M2 3.5h12', 'M2 6.5h12', 'M2 9.5h12', 'M2 12.5h12' ],
		none: [ 'M3.5 8h9' ],
	};

	/** An icon from GLYPHS, in a 16 by 16 box. A path is a d string, or { d, fill } (a filled half) or { d, dash }. */
	function Glyph( { name } ) {
		return h(
			'svg',
			{ className: 'snn-glyph', viewBox: '0 0 16 16', 'aria-hidden': 'true', focusable: 'false' },
			( GLYPHS[ name ] || [] ).map( ( p, i ) => {
				if ( typeof p === 'string' ) {
					return h( 'path', { key: i, d: p } );
				}
				return h( 'path', {
					key: i,
					d: p.d,
					fill: p.fill ? 'currentColor' : 'none',
					fillOpacity: p.fill ? 0.35 : undefined,
					strokeDasharray: p.dash ? '2 1.6' : undefined,
				} );
			} )
		);
	}

	/** The choices of the icon rows in the Typography group. */
	const TEXT_ALIGN_OPTIONS = [
		{ value: 'left', label: __( 'Left', 'snn' ), glyph: h( Glyph, { name: 'alignLeft' } ) },
		{ value: 'center', label: __( 'Centre', 'snn' ), glyph: h( Glyph, { name: 'alignCenter' } ) },
		{ value: 'right', label: __( 'Right', 'snn' ), glyph: h( Glyph, { name: 'alignRight' } ) },
		{ value: 'justify', label: __( 'Justify', 'snn' ), glyph: h( Glyph, { name: 'alignJustify' } ) },
	];

	const TEXT_TRANSFORM_OPTIONS = [
		{ value: 'none', label: __( 'None', 'snn' ), glyph: h( Glyph, { name: 'none' } ) },
		{ value: 'capitalize', label: __( 'Capitalise', 'snn' ), glyph: h( 'span', { className: 'snn-seg-text' }, 'Aa' ) },
		{ value: 'uppercase', label: __( 'Uppercase', 'snn' ), glyph: h( 'span', { className: 'snn-seg-text' }, 'AA' ) },
		{ value: 'lowercase', label: __( 'Lowercase', 'snn' ), glyph: h( 'span', { className: 'snn-seg-text' }, 'aa' ) },
	];

	/** The label of each Style row. */
	const STYLE_LABEL = {
		marginTop: __( 'Margin top', 'snn' ), marginRight: __( 'Margin right', 'snn' ), marginBottom: __( 'Margin bottom', 'snn' ), marginLeft: __( 'Margin left', 'snn' ),
		paddingTop: __( 'Padding top', 'snn' ), paddingBottom: __( 'Padding bottom', 'snn' ), paddingLeft: __( 'Padding left', 'snn' ), paddingRight: __( 'Padding right', 'snn' ), gap: __( 'Gap', 'snn' ),
		width: __( 'Width', 'snn' ), minWidth: __( 'Min. width', 'snn' ), maxWidth: __( 'Max. width', 'snn' ), height: __( 'Height', 'snn' ), minHeight: __( 'Min. height', 'snn' ), maxHeight: __( 'Max. height', 'snn' ), aspectRatio: __( 'Aspect ratio', 'snn' ),
		position: __( 'Position', 'snn' ), top: __( 'Top', 'snn' ), right: __( 'Right', 'snn' ), bottom: __( 'Bottom', 'snn' ), left: __( 'Left', 'snn' ), zIndex: __( 'Z-index', 'snn' ), scrollSnapAlign: __( 'Scroll snap', 'snn' ),
		opacity: __( 'Opacity', 'snn' ), overflow: __( 'Overflow', 'snn' ), visibility: __( 'Visibility', 'snn' ), cursor: __( 'Cursor', 'snn' ), isolation: __( 'Isolation', 'snn' ), mixBlendMode: __( 'Blend mode', 'snn' ), pointerEvents: __( 'Pointer events', 'snn' ), perspective: __( 'Perspective', 'snn' ), perspectiveOrigin: __( 'Perspective origin', 'snn' ),
		color: __( 'Colour', 'snn' ), fontFamily: __( 'Font family', 'snn' ), fontSize: __( 'Font size', 'snn' ), fontWeight: __( 'Font weight', 'snn' ), fontStyle: __( 'Font style', 'snn' ), lineHeight: __( 'Line height', 'snn' ), letterSpacing: __( 'Letter spacing', 'snn' ), textAlign: __( 'Text align', 'snn' ), textTransform: __( 'Text transform', 'snn' ), textDecoration: __( 'Decoration', 'snn' ), textWrap: __( 'Text wrap', 'snn' ), whiteSpace: __( 'White space', 'snn' ), textShadow: __( 'Text shadow', 'snn' ),
		backgroundColor: __( 'Colour', 'snn' ), backgroundImage: __( 'Image URL', 'snn' ), backgroundSize: __( 'Size', 'snn' ), backgroundPosition: __( 'Position', 'snn' ), backgroundRepeat: __( 'Repeat', 'snn' ),
		gradientApply: __( 'Apply to', 'snn' ), gradientType: __( 'Type', 'snn' ), gradientAngle: __( 'Angle', 'snn' ), gradientColor1: __( 'Colour 1', 'snn' ), gradientStop1: __( 'Stop 1', 'snn' ), gradientColor2: __( 'Colour 2', 'snn' ), gradientStop2: __( 'Stop 2', 'snn' ),
		borderWidth: __( 'Border width', 'snn' ), borderStyle: __( 'Border style', 'snn' ), borderColor: __( 'Border colour', 'snn' ), borderRadius: __( 'Radius', 'snn' ),
		boxShadowX: __( 'Shadow x', 'snn' ), boxShadowY: __( 'Shadow y', 'snn' ), boxShadowBlur: __( 'Shadow blur', 'snn' ), boxShadowSpread: __( 'Shadow spread', 'snn' ), boxShadowColor: __( 'Shadow colour', 'snn' ),
		transformOrigin: __( 'Origin', 'snn' ), translateX: __( 'Move x', 'snn' ), translateY: __( 'Move y', 'snn' ), rotate: __( 'Rotate', 'snn' ), scale: __( 'Scale', 'snn' ), skewX: __( 'Skew x', 'snn' ), skewY: __( 'Skew y', 'snn' ),
		filterBlur: __( 'Blur', 'snn' ), filterBrightness: __( 'Brightness', 'snn' ), filterContrast: __( 'Contrast', 'snn' ), filterGrayscale: __( 'Grayscale', 'snn' ), filterHueRotate: __( 'Hue rotate', 'snn' ), filterInvert: __( 'Invert', 'snn' ), filterSaturate: __( 'Saturate', 'snn' ), filterSepia: __( 'Sepia', 'snn' ),
		transitionProperty: __( 'Property', 'snn' ), transitionDuration: __( 'Duration', 'snn' ), transitionTiming: __( 'Timing', 'snn' ), transitionDelay: __( 'Delay', 'snn' ),
	};

	/** The unit a row shows after its field (sizes show px). */
	const STYLE_UNIT = { opacity: '%', gradientAngle: 'deg', gradientStop1: '%', gradientStop2: '%', rotate: 'deg', skewX: 'deg', skewY: 'deg', filterBrightness: '%', filterContrast: '%', filterGrayscale: '%', filterInvert: '%', filterSaturate: '%', filterSepia: '%', filterHueRotate: 'deg' };

	/** The rows that are colours, whatever the table says (the background colour is a view value). */
	const STYLE_COLOUR = [ 'backgroundColor' ];

	/** The view values that are not in the table: their types. */
	const STYLE_EXTRA = { gap: 'size', paddingTop: 'size', paddingBottom: 'size', maxWidth: 'size', opacity: 'number' };

	/** The types a size field shows px for. */
	const STYLE_SIZE = [ 'length', 'margin', 'size', 'sizenone', 'width', 'lengthnormal', 'keywordlength' ];

	/**
	 * The default of a choice: what the front end draws with nothing written. The background size default is cover (an
	 * image with no size is drawn at cover, see style-props.php declarations()); the repeat default is repeat.
	 */
	const STYLE_INITIAL = { backgroundSize: 'cover', backgroundRepeat: 'repeat' };

	/** The rows the table's types decide: a select for keywords, a colour field, a size field, or a plain field. */
	function StyleRow( { a, set, device, k } ) {
		const label = STYLE_LABEL[ k ] || k;
		if ( k === 'gradientStops' ) {
			return h( GradientStops, { a, set, device } );
		}
		if ( k === 'maxWidthOff' ) {
			// Base only, not per view. Centred is the default, so the flag is empty for every block that has a max width today.
			const off = a.maxWidthOff === '1' || a.maxWidthOff === true;
			return h( SwitchRow, {
				label: __( 'Centre the block', 'snn' ),
				tip: 'maxWidthCentre',
				checked: ! off,
				changed: off,
				onChange: ( on ) => {
					closeStep();
					set( { maxWidthOff: on ? '' : '1' } );
				},
			} );
		}
		if ( k === 'overflow' ) {
			return h( ViewValue, { a, set, device, k, label, kind: 'select', options: OVERFLOW_OPTIONS } );
		}
		if ( k === 'textAlign' ) {
			return h( ViewValue, { a, set, device, k, label, kind: 'icons', options: TEXT_ALIGN_OPTIONS } );
		}
		if ( k === 'textTransform' ) {
			return h( ViewValue, { a, set, device, k, label, kind: 'icons', options: TEXT_TRANSFORM_OPTIONS } );
		}
		const spec = ( snn.data.styleTable || [] ).find( ( row ) => row[ 0 ] === k );
		const type = STYLE_COLOUR.indexOf( k ) !== -1 ? 'color' : spec ? spec[ 2 ] : STYLE_EXTRA[ k ] || 'text';
		// A keyword, or a size that also takes keywords (background size: cover, contain, auto), is a choice.
		// Every row has an options list (empty for the sizes), so the test is for a list with items.
		if ( type === 'keyword' || ( spec && Array.isArray( spec[ 3 ] ) && spec[ 3 ].length > 0 ) ) {
			const options = ( spec ? spec[ 3 ] : [] ).map( ( o ) => ( { value: o, label: o.charAt( 0 ).toUpperCase() + o.slice( 1 ) } ) );
			// The default is the CSS initial value: shown when nothing is written, and chosen on Desktop it clears the value.
			const dflt = STYLE_INITIAL[ k ] !== undefined ? STYLE_INITIAL[ k ] : options[ 0 ].value;
			if ( type === 'keywordlength' ) {
				return h( ViewValue, { a, set, device, k, label, kind: 'keywordlength', options, dflt, fallback: dflt, unit: ' px', clearDefault: true } );
			}
			return h( ViewValue, { a, set, device, k, label, kind: 'select', options, dflt, fallback: dflt, clearDefault: true } );
		}
		if ( type === 'color' ) {
			return h( ViewValue, { a, set, device, k, label, kind: 'color' } );
		}
		if ( STYLE_SIZE.indexOf( type ) !== -1 || type === 'size' ) {
			return h( ViewValue, { a, set, device, k, label, unit: ' px', kind: 'size', placeholder: '0' } );
		}
		// An image address (background image): the media library button sits in its field.
		if ( type === 'url' ) {
			return h( ViewValue, { a, set, device, k, label, media: true } );
		}
		return h( ViewValue, { a, set, device, k, label, unit: STYLE_UNIT[ k ] } );
	}

	/** The property names a Style group shows, boxes included. */
	/** The settings of the Flex and grid section (its LAYOUT row): each one a property of the table. */
const LAYOUT_KEYS = [ 'display', 'flexDirection', 'flexWrap', 'justifyContent', 'alignItems', 'gap', 'columnGap', 'rowGap', 'gridColumns', 'gridRows', 'gridAutoColumns', 'gridAutoRows', 'gridAreas', 'gridAutoFlow', 'gridDense', 'justifyItems', 'alignContent', 'alignSelf', 'justifySelf', 'order', 'flexGrow', 'flexShrink', 'flexBasis', 'columnSpan', 'rowSpan', 'columnStart', 'rowStart', 'gridArea' ];

function pageKeys( page ) {
		return page.sections.reduce( ( all, s ) => all.concat( s.rows.reduce( ( ks, r ) => ks.concat( 'LAYOUT' === r ? LAYOUT_KEYS : typeof r === 'string' ? [ r ] : r.keys ), [] ) ), [] );
	}

	/** True when a Style group holds a value on any view, so its rail icon shows a dot. The CSS group counts its text. */
	function groupChanged( a, page ) {
		if ( page.kind === 'css' ) {
			return !! a.customCss;
		}
		return pageKeys( page ).concat( page.also || [] ).some( ( k ) => ALL_VIEWS.some( ( d ) => setHere( a, d, k ) !== undefined ) );
	}

	/**
	 * Margin or padding: the four sides as a 2 by 2 grid. Linked, one edit sets all four. Each side shows the value
	 * the view sets; the value it inherits is its placeholder. A dot marks a side the view sets.
	 */
	function BoxModel( { a, set, device, box } ) {
		const [ linked, setLinked ] = useState( false );
		const keys = box.keys;
		const anyOwn = keys.some( ( k ) => setHere( a, device, k ) !== undefined );
		const change = ( k, v ) => {
			typingStep( device + ':' + ( linked ? 'box' : k ) );
			if ( linked ) {
				setMany( a, set, device, keys.map( ( key ) => [ key, v ] ) );
			} else {
				setValue( a, set, device, k, v );
			}
		};
		return h(
			'div',
			{ className: 'snn-box' },
			h(
				'div',
				{ className: 'snn-box-head' },
				h( 'span', Object.assign( { className: 'snn-box-title' }, tipAttr( box.box ) ), box.label, anyOwn ? h( Dot ) : null ),
				h(
					'span',
					{ className: 'snn-box-tools' },
					h(
						'button',
						{
							type: 'button',
							className: 'snn-box-link' + ( linked ? ' is-on' : '' ),
							'aria-pressed': linked ? 'true' : 'false',
							...tipAttr( 'boxLink' ),
							'aria-label': __( 'Link the four sides', 'snn' ),
							onClick: () => setLinked( ! linked ),
						},
						h( Glyph, { name: 'link' } )
					),
					anyOwn
						? h(
								'button',
								{
									type: 'button',
									className: 'snn-reset',
									onClick: () => {
										closeStep();
										setMany( a, set, device, keys.map( ( key ) => [ key, '' ] ) );
									},
										...tipAttr( 'reset' ),
								},
								__( 'Reset', 'snn' )
						  )
						: null
				)
			),
			h(
				'div',
				{ className: 'snn-box-grid' },
				keys.map( ( k, i ) => {
					const own = setHere( a, device, k );
					const inherited = inheritedValue( a, device, k );
					return h(
						'div',
						{ key: k, className: 'snn-box-cell snn-box-' + BOX_AREA[ i ] },
						own !== undefined ? h( 'span', { className: 'snn-box-mark', 'aria-hidden': 'true' }, h( Dot ) ) : null,
						h( TextField, {
							label: box.label + ' ' + SIDE_LABEL[ i ], tip: k, type: tableSpec( k ).type, options: tableSpec( k ).options,
							value: own !== undefined ? String( own ) : '',
							placeholder: inherited.value !== undefined && inherited.value !== '' ? String( inherited.value ) : '0',
							unit: ' px',
							variables: VARIABLE_GROUPS,
							kind: 'size',
							onChange: ( v ) => change( k, v ),
						} )
					);
				} )
			)
		);
	}


	Object.assign( snn.panel, { STYLE_PAGES, Glyph, StyleRow, groupChanged, BoxModel } );
} )( window.wp );
