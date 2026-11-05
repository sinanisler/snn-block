/**
 * SNN layout icons: the pictures of the flex and grid settings, drawn as in the version 12 mock (the panel
 * previews: docs/research/controls-screens-2026-11-05/lab/panel-v2.html). Each picture is 14 by 14 with filled
 * boxes and a line for the axis. A flex column turns its pictures a quarter turn (the rotated flag).
 *
 * Exposes window.snnLayoutIcons: main(value, rotated), cross(value, rotated), direction(value), columns(n).
 * Uses wp.element only.
 */
( function ( wp ) {
	const { createElement: h } = wp.element;

	/** Main-axis pictures (justify content): the boxes packed along the line. Stretch fills the line. */
	const MAIN = {
		'flex-start': { line: 'M2 1v12', boxes: [ [ 4, 4, 3, 6 ], [ 8, 4, 3, 6 ] ] },
		center: { line: 'M7 1v12', boxes: [ [ 3, 4, 3, 6 ], [ 8, 4, 3, 6 ] ] },
		'flex-end': { line: 'M12 1v12', boxes: [ [ 2, 4, 3, 6 ], [ 6, 4, 3, 6 ] ] },
		'space-between': { line: 'M1 1v12M13 1v12', boxes: [ [ 5.5, 4, 3, 6 ] ] },
		stretch: { line: null, boxes: [ [ 3, 2, 3, 10 ], [ 7.5, 2, 3, 10 ] ] },
	};

	/** Cross-axis pictures (align items, justify items): the boxes lined up across the line. */
	const CROSS = {
		'flex-start': { line: 'M1 2h12', boxes: [ [ 3, 3, 3, 7 ], [ 7.5, 3, 3, 4 ] ] },
		center: { line: 'M1 7h12', boxes: [ [ 3, 3.5, 3, 7 ], [ 7.5, 4.5, 3, 5 ] ] },
		'flex-end': { line: 'M1 12h12', boxes: [ [ 3, 5, 3, 7 ], [ 7.5, 8, 3, 4 ] ] },
		stretch: { line: null, boxes: [ [ 3, 2, 3, 10 ], [ 7.5, 2, 3, 10 ] ] },
	};

	/** The two directions: boxes side by side (row) or one above the other (column). */
	const DIRECTION = {
		row: [ [ 1, 4, 4, 6 ], [ 9, 4, 4, 6 ] ],
		column: [ [ 4, 1, 6, 4 ], [ 4, 9, 6, 4 ] ],
	};

	/** n equal columns across the picture. */
	function columnBoxes( n ) {
		const w = ( 12 - ( n - 1 ) ) / n;
		return Array.from( { length: n }, ( _, i ) => [ 1 + i * ( w + 1 ), 4, w, 6 ] );
	}

	function picture( parts, rotated ) {
		const kids = [];
		if ( parts.line ) {
			kids.push( h( 'path', { key: 'line', d: parts.line, fill: 'none' } ) );
		}
		parts.boxes.forEach( ( b, i ) => {
			kids.push( h( 'rect', { key: 'b' + i, x: b[ 0 ], y: b[ 1 ], width: b[ 2 ], height: b[ 3 ], rx: 0.5 } ) );
		} );
		return h(
			'svg',
			{
				className: 'snn-pic',
				viewBox: '0 0 14 14',
				'aria-hidden': 'true',
				focusable: 'false',
				style: rotated ? { transform: 'rotate(90deg)' } : undefined,
			},
			...kids
		);
	}

	window.snnLayoutIcons = {
		main: ( value, rotated ) => ( MAIN[ value ] ? picture( MAIN[ value ], rotated ) : null ),
		cross: ( value, rotated ) => ( CROSS[ value ] ? picture( CROSS[ value ], rotated ) : null ),
		direction: ( value ) => picture( { line: null, boxes: DIRECTION[ value ] || DIRECTION.row }, false ),
		columns: ( n ) => picture( { line: null, boxes: columnBoxes( n ) }, false ),
	};
} )( window.wp );
