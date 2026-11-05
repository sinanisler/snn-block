/**
 * SNN layout icons: the small pictures for the flex and grid controls. They are our own (no icon
 * font, no core icon set), and each one follows the rule of the CSS it stands for, so the picture
 * shows what the setting does. Justify and align pictures turn with the flex direction.
 *
 *   Glyph            the icon element (a frame, boxes and an optional arrow), 16 px or given size
 *   arrange          boxes in a container: kind 'main' packs them along the axis (justify, align
 *                    content); kind 'cross' lines them up across it (align items, justify items)
 *   columns          equal or weighted columns (grid columns, and the column presets)
 *   BLOCK_SHAPE,     the shapes for the display choices
 *   GRID_SHAPE
 *   ARROWS           the four flex directions, and the grid flow
 *
 * Loaded in the block editor before layout-blocks.js (see includes/blocks/layout-blocks.php).
 * Exposes window.snnLayoutIcons. Uses wp.element only.
 */
( function ( wp ) {
	const { createElement: h } = wp.element;

	const VIEW = 24;
	const PAD = 3; // the frame's inner margin
	const INNER = VIEW - 2 * PAD; // 18: the room inside the frame
	const BOX = 3.6; // a box along the main axis
	const GAP = 1.2; // the space between boxes when packed
	const MAIN_COUNT = 2; // boxes in a justify or content picture (two spread the modes apart)
	const CROSS_SIZES = [ 10, 6, 13 ]; // three boxes of varying sizes across the axis, for align
	const CROSS_BOX = 8; // a box across the main axis when packed
	const BASE = PAD + INNER * 0.7; // the baseline line for 'baseline'

	/** A rectangle from its main-axis and cross-axis extents. axis 'x' runs along the page. */
	function rect( axis, main, mainSize, cross, crossSize ) {
		return axis === 'x'
			? { x: main, y: cross, w: mainSize, h: crossSize }
			: { x: cross, y: main, w: crossSize, h: mainSize };
	}

	/** Mirror a main-axis start, for row-reverse and column-reverse. */
	function flip( start, size ) {
		return VIEW - start - size;
	}

	/** Start positions and sizes of n boxes along the main axis, for a packing mode. */
	function packed( mode, reverse, n ) {
		const idx = Array.from( { length: n }, ( _, i ) => i );
		const free = INNER - n * BOX;
		const len = n * BOX + ( n - 1 ) * GAP;
		let starts;
		let sizes = idx.map( () => BOX );
		switch ( mode ) {
			case 'flex-end':
			case 'end':
				starts = idx.map( ( i ) => PAD + INNER - len + i * ( BOX + GAP ) );
				break;
			case 'center':
				starts = idx.map( ( i ) => PAD + ( INNER - len ) / 2 + i * ( BOX + GAP ) );
				break;
			case 'space-between':
				starts = idx.map( ( i ) => PAD + i * ( ( INNER - BOX ) / ( n - 1 ) ) );
				break;
			case 'space-around':
				starts = idx.map( ( i ) => PAD + free / n / 2 + i * ( BOX + free / n ) );
				break;
			case 'space-evenly':
				starts = idx.map( ( i ) => PAD + ( free / ( n + 1 ) ) * ( i + 1 ) + i * BOX );
				break;
			case 'stretch': {
				const each = ( INNER - ( n - 1 ) * GAP ) / n;
				starts = idx.map( ( i ) => PAD + i * ( each + GAP ) );
				sizes = idx.map( () => each );
				break;
			}
			default:
				starts = idx.map( ( i ) => PAD + i * ( BOX + GAP ) );
		}
		return starts.map( ( s, i ) => ( { s: reverse ? flip( s, sizes[ i ] ) : s, size: sizes[ i ] } ) );
	}

	/**
	 * Boxes arranged for a setting.
	 *   axis     'x' or 'y': the main axis of the flow (x for row, y for column)
	 *   kind     'main' packs the boxes along the axis; 'cross' lines them up across it
	 *   mode     start, center, end (flex-start, flex-end), space-between, space-around,
	 *            space-evenly, stretch; for cross also baseline
	 *   reverse  true for row-reverse and column-reverse (the main axis runs back)
	 */
	function arrange( opts ) {
		const axis = opts.axis || 'x';
		const mode = opts.mode || 'start';
		if ( opts.kind === 'cross' ) {
			const starts = packed( 'start', false, CROSS_SIZES.length );
			const rects = starts.map( ( b, i ) => {
				const size = mode === 'stretch' ? INNER : CROSS_SIZES[ i ];
				let cross = PAD;
				if ( mode === 'baseline' ) {
					cross = BASE - size;
				} else if ( mode === 'center' ) {
					cross = PAD + ( INNER - size ) / 2;
				} else if ( mode === 'end' || mode === 'flex-end' ) {
					cross = PAD + INNER - size;
				}
				return rect( axis, b.s, BOX, cross, size );
			} );
			if ( mode === 'baseline' ) {
				rects.push( Object.assign( rect( axis, PAD, INNER, BASE, 0.8 ), { line: true } ) );
			}
			return rects;
		}
		const cross = PAD + ( INNER - CROSS_BOX ) / 2;
		return packed( mode, !! opts.reverse, MAIN_COUNT ).map( ( b ) => rect( axis, b.s, b.size, cross, CROSS_BOX ) );
	}

	/** Columns across the frame. weights: relative widths (default: equal). */
	function columns( count, weights ) {
		const w = weights && weights.length ? weights : new Array( count ).fill( 1 );
		const gap = 1.4;
		const total = w.reduce( ( a, b ) => a + b, 0 );
		const avail = INNER - ( w.length - 1 ) * gap;
		let x = PAD;
		return w.map( ( v ) => {
			const width = ( avail * v ) / total;
			const out = { x, y: PAD + 2, w: width, h: INNER - 4 };
			x += width + gap;
			return out;
		} );
	}

	/** Three bars: the block display (one flow, top to bottom). */
	const BLOCK_SHAPE = [
		{ x: PAD, y: PAD + 1, w: INNER, h: 3 },
		{ x: PAD, y: PAD + 7.5, w: INNER, h: 3 },
		{ x: PAD, y: PAD + 14, w: INNER, h: 3 },
	];

	/** Four squares in two rows: the grid display. */
	const GRID_SHAPE = ( function () {
		const s = ( INNER - 1.5 ) / 2;
		return [
			{ x: PAD, y: PAD, w: s, h: s },
			{ x: PAD + s + 1.5, y: PAD, w: s, h: s },
			{ x: PAD, y: PAD + s + 1.5, w: s, h: s },
			{ x: PAD + s + 1.5, y: PAD + s + 1.5, w: s, h: s },
		];
	} )();

	/** Arrows for the flex directions and the grid flow. */
	const ARROWS = {
		row: 'M5 12 H19 M15 8 L19 12 L15 16',
		'row-reverse': 'M19 12 H5 M9 8 L5 12 L9 16',
		column: 'M12 5 V19 M8 15 L12 19 L16 15',
		'column-reverse': 'M12 19 V5 M8 9 L12 5 L16 9',
	};

	/** The icon: a frame, the shapes, and an optional arrow. */
	function Glyph( { rects = [], arrow = '', size = 16, frame = true } ) {
		return h(
			'svg',
			{
				className: 'snn-glyph',
				viewBox: '0 0 24 24',
				width: size,
				height: size,
				'aria-hidden': 'true',
				focusable: 'false',
			},
			frame
				? h( 'rect', {
						x: 0.75,
						y: 0.75,
						width: 22.5,
						height: 22.5,
						rx: 3,
						fill: 'none',
						stroke: 'currentColor',
						strokeOpacity: 0.45,
						strokeWidth: 1.5,
				  } )
				: null,
			rects.map( ( r, i ) =>
				h( 'rect', {
					key: i,
					x: r.x,
					y: r.y,
					width: r.w,
					height: r.h,
					rx: r.line ? 0 : 1,
					fill: 'currentColor',
					fillOpacity: r.line ? 0.5 : 1,
				} )
			),
			arrow
				? h( 'path', {
						d: arrow,
						fill: 'none',
						stroke: 'currentColor',
						strokeWidth: 2,
						strokeLinecap: 'round',
						strokeLinejoin: 'round',
				  } )
				: null
		);
	}

	window.snnLayoutIcons = {
		Glyph,
		arrange,
		columns,
		BLOCK_SHAPE,
		GRID_SHAPE,
		ARROWS,
	};
} )( window.wp );
