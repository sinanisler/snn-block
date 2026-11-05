/**
 * SNN layout blocks for the block editor: Section, Container and Div.
 *
 * The settings sit in the block's inspector, in compact rows (see controls.js):
 *   Layout          display (a dropdown: flex, block, grid), then its settings:
 *                   flex direction, wrap, justify, align and gaps; grid columns, rows, flow,
 *                   justify items and align content. The settings are icons where a choice has a
 *                   picture (layout-icons.js), and the pictures follow the direction.
 *   Query loop      a switch. Turned on, the Query section below it can open.
 *   Query           an accordion, disabled while the switch is off. Post type, order, per page,
 *                   offset, child of, sticky, include and exclude, authors, main query.
 *   Item            how the block sits in its flex or grid parent: align self, grow, shrink, basis,
 *                   justify self, column and row span. Only the settings its parent needs show.
 *   Header          the name, with the Conditions and Interactions buttons at the top right; the CSS ID (the
 *                   field is the rename), the classes button, copy ID, copy styles and paste styles; the
 *                   classes as chips. Conditions and Interactions open as sub-panels in place of the tabs
 *                   (block-tools.js).
 *   Advanced        Custom CSS (planned).
 *
 * Every text-like field has the dynamic data button and every size field can take a variable.
 * The editor shows each block once. On the front end a query loop repeats the block for every
 * post (rendered in includes/blocks/layout-blocks.php, whose style rules this file mirrors).
 */
( function ( wp, C, I ) {
	const { registerBlockType } = wp.blocks;
	const { InnerBlocks, InspectorControls, useBlockProps, useInnerBlocksProps } = wp.blockEditor;
	const { useSelect } = wp.data;
	const { createElement: h, Fragment, useState } = wp.element;
	const { __ } = wp.i18n;
	const data = window.snnControlsData || {};
	const { main: mainPic, cross: crossPic, direction: directionPic, columns: columnsPic } = I;
	const { Row, SwitchRow, Accordion, Select, Segmented, TextField, Group, Disclosure, ViewRow, ownValue, inheritedValue, setValue, clearValue, effectiveValues } = C;
	const { HeadIcons, IdBar, ClassesEditor, ConditionsEditor, InteractionsEditor, readClip, writeClip, styleValues } = window.snnBlockTools;

	const QUERY_DEFAULTS = {
		enabled: false,
		postType: 'post',
		orderBy: 'date',
		order: 'DESC',
		perPage: '10',
		offset: '0',
		parent: '',
		ignoreSticky: false,
		include: '',
		exclude: '',
		includeAuthors: '',
		excludeAuthors: '',
		isMain: false,
	};

	/** The layout settings and their defaults. */
	const LAYOUT_DEFAULTS = {
		display: 'block',
		flexDirection: 'row',
		flexWrap: 'nowrap',
		justifyContent: '',
		alignItems: '',
		gap: '',
		columnGap: '',
		rowGap: '',
		gridColumns: '',
		gridRows: '',
		gridAutoFlow: 'row',
		gridDense: false,
		justifyItems: '',
		alignContent: '',
	};

	/** The item settings: how the block sits in its flex or grid parent. */
	const ITEM_DEFAULTS = {
		alignSelf: '',
		justifySelf: '',
		flexGrow: '',
		flexShrink: '',
		flexBasis: '',
		columnSpan: '',
		rowSpan: '',
	};

	/** The style settings: what Copy styles takes and Paste styles gives (layout, item and background). */
	const STYLE_KEYS = [ ...Object.keys( LAYOUT_DEFAULTS ), ...Object.keys( ITEM_DEFAULTS ), 'backgroundColor', 'paddingTop', 'paddingBottom', 'maxWidth', 'opacity', 'overflow' ];

	const TAG_OPTIONS = ( data.tags || [ 'section', 'div' ] ).map( ( t ) => ( { value: t, label: t } ) );
	const POST_TYPE_OPTIONS = data.postTypes || [ { value: 'post', label: __( 'Post', 'snn' ) } ];
	const ORDER_BY_OPTIONS = data.orderBy || [ { value: 'date', label: __( 'Date', 'snn' ) } ];
	const ORDER_OPTIONS = [
		{ value: 'DESC', label: __( 'Descending', 'snn' ) },
		{ value: 'ASC', label: __( 'Ascending', 'snn' ) },
	];
	// All the variable groups: colours and sizes. Each group has a kind, which the picker uses (controls.js).
	const VARIABLE_GROUPS = data.variables || [];
	const WRAP_OPTIONS = [
		{ value: 'nowrap', label: __( 'No wrap', 'snn' ) },
		{ value: 'wrap', label: __( 'Wrap', 'snn' ) },
		{ value: 'wrap-reverse', label: __( 'Wrap reverse', 'snn' ) },
	];
	const COLOR_OK = /^(#([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})|(rgba?|hsla?)\([0-9a-z.,%\s\/+-]{1,60}\)|var\(--[a-z][a-z0-9-]*\)|transparent)$/i;

	const WORD = {
		start: __( 'Start', 'snn' ),
		center: __( 'Center', 'snn' ),
		end: __( 'End', 'snn' ),
		stretch: __( 'Stretch', 'snn' ),
		baseline: __( 'Baseline', 'snn' ),
		auto: __( 'Auto', 'snn' ),
		between: __( 'Space between', 'snn' ),
		around: __( 'Space around', 'snn' ),
		evenly: __( 'Space evenly', 'snn' ),
	};

	/** The choices of each setting, as [value, label] pairs (the value is the CSS keyword). */
	const CHOICES = {
		justify: [
			[ 'flex-start', WORD.start ],
			[ 'center', WORD.center ],
			[ 'flex-end', WORD.end ],
			[ 'space-between', WORD.between ],
			[ 'space-around', WORD.around ],
			[ 'space-evenly', WORD.evenly ],
		],
		align: [
			[ 'stretch', WORD.stretch ],
			[ 'flex-start', WORD.start ],
			[ 'center', WORD.center ],
			[ 'flex-end', WORD.end ],
			[ 'baseline', WORD.baseline ],
		],
		alignContent: [
			[ 'flex-start', WORD.start ],
			[ 'center', WORD.center ],
			[ 'flex-end', WORD.end ],
			[ 'stretch', WORD.stretch ],
			[ 'space-between', WORD.between ],
			[ 'space-around', WORD.around ],
			[ 'space-evenly', WORD.evenly ],
		],
		cell: [
			[ 'stretch', WORD.stretch ],
			[ 'flex-start', WORD.start ],
			[ 'center', WORD.center ],
			[ 'flex-end', WORD.end ],
		],
		alignSelf: [
			[ 'auto', WORD.auto ],
			[ 'stretch', WORD.stretch ],
			[ 'flex-start', WORD.start ],
			[ 'center', WORD.center ],
			[ 'flex-end', WORD.end ],
			[ 'baseline', WORD.baseline ],
		],
	};


	const GAP_OK = /^(var\(--[a-z][a-z0-9-]*\)|-?(\d+|\d*\.\d+)(px|rem|em|%|vw|vh)|0)$/;
	const TEMPLATE_OK = /^[A-Za-z0-9 .,()%+-]{1,160}$/;
	const NUMBER_OK = /^\d+(\.\d+)?$/;
	/** A length for padding and width (no minus): the same rule as size_value() in layout-blocks.php. */
	const SIZE_OK = /^(var\(--[a-z][a-z0-9-]*\)|\d+(\.\d+)?(px|rem|em|%|vw|vh)|0)$/;
	const OVERFLOW_OK = [ 'visible', 'hidden', 'clip' ];
	/** An opacity from 0 to 100, written as 0 to 1, as the front end writes it. Anything else is empty. */
	/** A bare number is pixels (the panel shows px next to the field). */
	function withPx( v ) {
		const t = str( v ).trim();
		return /^\d+(\.\d+)?$/.test( t ) && t !== '0' ? t + 'px' : t;
	}
	function opacityCss( v ) {
		const t = str( v ).trim();
		return /^\d{1,3}$/.test( t ) && Number( t ) <= 100 ? String( Number( t ) / 100 ) : '';
	}
	const SPAN_OK = /^(1[0-2]|[1-9])$/;

	/* ------------------------------------------------------------------
	 * Pictures and choices
	 * ---------------------------------------------------------------- */

	/** Options from [value, label] pairs, each with its picture (layout-icons.js). */
	function options( pairs, glyph ) {
		return pairs.map( ( [ value, label ] ) => ( { value, label, glyph: glyph( value ) } ) );
	}

	/** Pairs as the dropdowns take them: { value, label }. */
	function toOptions( pairs ) {
		return pairs.map( ( [ value, label ] ) => ( { value, label } ) );
	}

	/** The pairs whose value has a picture in the version 12 mock, in the order of the pairs. */
	function picked( pairs, keys ) {
		return pairs.filter( ( [ value ] ) => keys.indexOf( value ) !== -1 );
	}

	/**
	 * The values that have a picture, by setting. Baseline, space around and space evenly have no picture in the
	 * mock, so they are not offered as icons.
	 */
	const JUSTIFY_PICS = [ 'flex-start', 'center', 'flex-end', 'space-between' ];
	const ALIGN_PICS = [ 'stretch', 'flex-start', 'center', 'flex-end' ];
	const ALIGN_CONTENT_PICS = [ 'stretch', 'flex-start', 'center', 'flex-end', 'space-between' ];

	const DISPLAY_OPTIONS = [
		{ value: 'flex', label: __( 'Flex', 'snn' ) },
		{ value: 'block', label: __( 'Block', 'snn' ) },
		{ value: 'grid', label: __( 'Grid', 'snn' ) },
	];

	/** The two flows, as pictures: a row or a column. */
	const FLOW_PAIRS = [
		[ 'row', __( 'Row', 'snn' ) ],
		[ 'column', __( 'Column', 'snn' ) ],
	];

	/** The grid's columns: one to six equal columns. */
	function columnOptions() {
		return [ 1, 2, 3, 4, 5, 6 ].map( ( n ) => ( {
			value: String( n ),
			label: n === 1 ? __( '1 column', 'snn' ) : n + ' ' + __( 'columns', 'snn' ),
			glyph: columnsPic( n ),
		} ) );
	}

	/* ------------------------------------------------------------------
	 * The inline style, as the front end writes it (includes/blocks/layout-blocks.php)
	 * ---------------------------------------------------------------- */

	const str = ( v ) => ( v === undefined || v === null ? '' : String( v ) );

	/** Grid has start and end; flex-start and flex-end become them (as on the front end). */
	function gridWord( v ) {
		if ( v === 'flex-start' ) {
			return 'start';
		}
		if ( v === 'flex-end' ) {
			return 'end';
		}
		return v;
	}

	function columnsCss( v ) {
		const t = str( v ).trim();
		if ( SPAN_OK.test( t ) ) {
			return 'repeat(' + t + ', minmax(0, 1fr))';
		}
		if ( /^\d+$/.test( t ) ) {
			return '';
		}
		return TEMPLATE_OK.test( t ) ? t : '';
	}

	function templateCss( v ) {
		const t = str( v ).trim();
		return TEMPLATE_OK.test( t ) ? t : '';
	}

	function lengthCss( v ) {
		const t = str( v ).trim();
		if ( t === 'auto' ) {
			return 'auto';
		}
		return GAP_OK.test( t ) ? t : '';
	}

	function styleFor( a ) {
		const css = {};
		const flex = a.display === 'flex';
		const grid = a.display === 'grid';

		if ( flex ) {
			css.display = 'flex';
			css.flexDirection = a.flexDirection || 'row';
			css.flexWrap = a.flexWrap || 'nowrap';
		} else if ( grid ) {
			css.display = 'grid';
			const cols = columnsCss( a.gridColumns );
			if ( cols ) {
				css.gridTemplateColumns = cols;
			}
			const rows = templateCss( a.gridRows );
			if ( rows ) {
				css.gridTemplateRows = rows;
			}
			if ( a.gridDense || a.gridAutoFlow === 'column' ) {
				css.gridAutoFlow = a.gridAutoFlow + ( a.gridDense ? ' dense' : '' );
			}
		}

		if ( flex || grid ) {
			if ( a.justifyContent ) {
				css.justifyContent = grid ? gridWord( a.justifyContent ) : a.justifyContent;
			}
			if ( a.alignItems ) {
				css.alignItems = grid ? gridWord( a.alignItems ) : a.alignItems;
			}
			if ( grid ) {
				if ( a.justifyItems ) {
					css.justifyItems = gridWord( a.justifyItems );
				}
				if ( a.alignContent ) {
					css.alignContent = gridWord( a.alignContent );
				}
			}
			if ( GAP_OK.test( withPx( a.gap ) ) ) {
				css.gap = withPx( a.gap );
			}
			if ( GAP_OK.test( withPx( a.columnGap ) ) ) {
				css.columnGap = withPx( a.columnGap );
			}
			if ( GAP_OK.test( withPx( a.rowGap ) ) ) {
				css.rowGap = withPx( a.rowGap );
			}
		}

		// Item settings act on the block inside its parent, so they are written whatever the display.
		if ( a.alignSelf ) {
			css.alignSelf = gridWord( a.alignSelf );
		}
		if ( a.justifySelf ) {
			css.justifySelf = gridWord( a.justifySelf );
		}
		if ( NUMBER_OK.test( str( a.flexGrow ) ) ) {
			css.flexGrow = a.flexGrow;
		}
		if ( NUMBER_OK.test( str( a.flexShrink ) ) ) {
			css.flexShrink = a.flexShrink;
		}
		const basis = lengthCss( a.flexBasis );
		if ( basis ) {
			css.flexBasis = basis;
		}
		if ( SPAN_OK.test( str( a.columnSpan ).trim() ) ) {
			css.gridColumn = 'span ' + str( a.columnSpan ).trim();
		}
		if ( SPAN_OK.test( str( a.rowSpan ).trim() ) ) {
			css.gridRow = 'span ' + str( a.rowSpan ).trim();
		}

		// Spacing, width, opacity and overflow: the same rules as the front end (layout-blocks.php).
		if ( SIZE_OK.test( withPx( a.paddingTop ) ) ) {
			css.paddingTop = withPx( a.paddingTop );
		}
		if ( SIZE_OK.test( withPx( a.paddingBottom ) ) ) {
			css.paddingBottom = withPx( a.paddingBottom );
		}
		if ( SIZE_OK.test( withPx( a.maxWidth ) ) ) {
			css.maxWidth = withPx( a.maxWidth );
			css.marginLeft = 'auto';
			css.marginRight = 'auto';
		}
		const opacity = opacityCss( a.opacity );
		if ( opacity ) {
			css.opacity = opacity;
		}
		if ( OVERFLOW_OK.indexOf( a.overflow ) !== -1 ) {
			css.overflow = a.overflow;
		}

		if ( a.backgroundColor && COLOR_OK.test( a.backgroundColor ) ) {
			css.backgroundColor = a.backgroundColor;
		}

		return Object.keys( css ).length ? css : undefined;
	}

	/* ------------------------------------------------------------------
	 * Query (unchanged from the first version)
	 * ---------------------------------------------------------------- */

	function changedQuery( q ) {
		return (
			q.enabled &&
			( q.postType !== 'post' ||
				q.orderBy !== 'date' ||
				q.order !== 'DESC' ||
				q.perPage !== '10' ||
				q.offset !== '0' ||
				!! q.parent ||
				q.ignoreSticky ||
				!! q.include ||
				!! q.exclude ||
				!! q.includeAuthors ||
				!! q.excludeAuthors ||
				q.isMain )
		);
	}

	function QueryFields( { q, setQ } ) {
		return h(
			Fragment,
			null,
			h(
				Row,
				{ label: __( 'Post type', 'snn' ), changed: q.postType !== 'post' },
				h( Select, {
					label: __( 'Post type', 'snn' ),
					value: q.postType,
					options: POST_TYPE_OPTIONS,
					onChange: ( v ) => setQ( { postType: v } ),
				} )
			),
			h(
				Row,
				{ label: __( 'Order by', 'snn' ), changed: q.orderBy !== 'date' },
				h( Select, {
					label: __( 'Order by', 'snn' ),
					value: q.orderBy,
					options: ORDER_BY_OPTIONS,
					onChange: ( v ) => setQ( { orderBy: v } ),
				} )
			),
			h(
				Row,
				{ label: __( 'Order', 'snn' ), changed: q.order !== 'DESC' },
				h( Select, {
					label: __( 'Order', 'snn' ),
					value: q.order,
					options: ORDER_OPTIONS,
					onChange: ( v ) => setQ( { order: v } ),
				} )
			),
			h(
				Row,
				{ label: __( 'Per page', 'snn' ), changed: q.perPage !== '10' },
				h( TextField, {
					label: __( 'Posts per page', 'snn' ),
					value: q.perPage,
					inputMode: 'numeric',
					onChange: ( v ) => setQ( { perPage: v } ),
				} )
			),
			h(
				Row,
				{ label: __( 'Offset', 'snn' ), changed: q.offset !== '0' },
				h( TextField, {
					label: __( 'Offset', 'snn' ),
					value: q.offset,
					inputMode: 'numeric',
					onChange: ( v ) => setQ( { offset: v } ),
				} )
			),
			h(
				Row,
				{ label: __( 'Child of', 'snn' ), changed: !! q.parent },
				h( TextField, {
					label: __( 'Child of', 'snn' ),
					value: q.parent,
					placeholder: __( 'Post ID', 'snn' ),
					onChange: ( v ) => setQ( { parent: v } ),
				} )
			),
			h( SwitchRow, {
				label: __( 'Ignore sticky', 'snn' ),
				checked: q.ignoreSticky,
				onChange: ( v ) => setQ( { ignoreSticky: v } ),
			} ),
			h(
				Row,
				{ label: __( 'Include', 'snn' ), changed: !! q.include },
				h( TextField, {
					label: __( 'Include posts', 'snn' ),
					value: q.include,
					placeholder: __( 'IDs', 'snn' ),
					onChange: ( v ) => setQ( { include: v } ),
				} )
			),
			h(
				Row,
				{ label: __( 'Exclude', 'snn' ), changed: !! q.exclude },
				h( TextField, {
					label: __( 'Exclude posts', 'snn' ),
					value: q.exclude,
					placeholder: __( 'IDs', 'snn' ),
					onChange: ( v ) => setQ( { exclude: v } ),
				} )
			),
			h(
				Row,
				{ label: __( 'Authors', 'snn' ), changed: !! q.includeAuthors },
				h( TextField, {
					label: __( 'Include authors', 'snn' ),
					value: q.includeAuthors,
					placeholder: __( 'User IDs', 'snn' ),
					onChange: ( v ) => setQ( { includeAuthors: v } ),
				} )
			),
			h(
				Row,
				{ label: __( 'Not authors', 'snn' ), changed: !! q.excludeAuthors },
				h( TextField, {
					label: __( 'Exclude authors', 'snn' ),
					value: q.excludeAuthors,
					placeholder: __( 'User IDs', 'snn' ),
					onChange: ( v ) => setQ( { excludeAuthors: v } ),
				} )
			),
			h( SwitchRow, {
				label: __( 'Main query', 'snn' ),
				checked: q.isMain,
				onChange: ( v ) => setQ( { isMain: v } ),
			} )
		);
	}

	/* ------------------------------------------------------------------
	 * Layout and item rows
	 * ---------------------------------------------------------------- */

	function layoutChanged( a, tag ) {
		return a.tagName !== tag || Object.keys( LAYOUT_DEFAULTS ).some( ( k ) => a[ k ] !== LAYOUT_DEFAULTS[ k ] );
	}

	function itemChanged( a ) {
		return Object.keys( ITEM_DEFAULTS ).some( ( k ) => a[ k ] !== ITEM_DEFAULTS[ k ] );
	}

	/**
	 * The flex and grid settings, in the order they are used. Display is a dropdown. A flex box has its
	 * direction (two pictures and a Reverse switch), its wrap, its justify and its align. A grid has its
	 * columns and rows, its flow, its justify items and align content, and its gaps. Each row shows only when
	 * it applies to the display chosen. The pictures are the version 12 mock's (layout-icons.js).
	 */
	function LayoutFields( { a, set } ) {
		const flex = a.display === 'flex';
		const grid = a.display === 'grid';
		const box = flex || grid;
		const axis = /^column/.test( a.flexDirection ) ? 'y' : 'x';
		const reverse = /reverse$/.test( a.flexDirection );
		const flow = a.flexDirection.replace( /-reverse$/, '' );
		// A flex column runs its main axis down the block, so its pictures turn a quarter turn.
		const turned = ! grid && axis === 'y';
		const rows = [];

		rows.push(
			h(
				Row,
				{ key: 'display', label: __( 'Display', 'snn' ), changed: a.display !== 'block' },
				h( Select, {
					label: __( 'Display', 'snn' ),
					value: a.display,
					options: DISPLAY_OPTIONS,
					onChange: ( v ) => set( { display: v } ),
				} )
			)
		);

		if ( flex ) {
			rows.push(
				h(
					Row,
					{ key: 'direction', label: __( 'Direction', 'snn' ), changed: flow !== 'row' },
					h( Segmented, {
						label: __( 'Direction', 'snn' ),
						value: flow,
						options: options( FLOW_PAIRS, ( v ) => directionPic( v ) ),
						onChange: ( v ) => set( { flexDirection: reverse ? v + '-reverse' : v } ),
					} )
				),
				h( SwitchRow, {
					key: 'reverse',
					label: __( 'Reverse', 'snn' ),
					checked: reverse,
					onChange: ( v ) => set( { flexDirection: flow + ( v ? '-reverse' : '' ) } ),
				} ),
				h(
					Row,
					{ key: 'wrap', label: __( 'Wrap', 'snn' ), changed: a.flexWrap !== 'nowrap' },
					h( Select, {
						label: __( 'Wrap', 'snn' ),
						value: a.flexWrap,
						options: WRAP_OPTIONS,
						onChange: ( v ) => set( { flexWrap: v } ),
					} )
				)
			);
		}

		if ( grid ) {
			rows.push(
				h(
					Row,
					{ key: 'columns', label: __( 'Columns', 'snn' ), changed: a.gridColumns !== '' },
					h( Segmented, {
						label: __( 'Columns', 'snn' ),
						value: a.gridColumns,
						options: columnOptions(),
						onChange: ( v ) => set( { gridColumns: v } ),
					} )
				),
				h(
					Row,
					{ key: 'template', label: __( 'Template', 'snn' ), changed: a.gridColumns !== '' && ! /^\d+$/.test( a.gridColumns ) },
					h( TextField, {
						label: __( 'Column template', 'snn' ),
						value: a.gridColumns,
						placeholder: __( '1fr 2fr', 'snn' ),
						onChange: ( v ) => set( { gridColumns: v } ),
					} )
				),
				h(
					Row,
					{ key: 'rows', label: __( 'Rows', 'snn' ), changed: a.gridRows !== '' },
					h( TextField, {
						label: __( 'Row template', 'snn' ),
						value: a.gridRows,
						placeholder: __( 'auto', 'snn' ),
						onChange: ( v ) => set( { gridRows: v } ),
					} )
				),
				h(
					Row,
					{ key: 'flow', label: __( 'Flow', 'snn' ), changed: a.gridAutoFlow !== 'row' },
					h( Segmented, {
						label: __( 'Flow', 'snn' ),
						value: a.gridAutoFlow,
						options: options( FLOW_PAIRS, ( v ) => directionPic( v ) ),
						onChange: ( v ) => set( { gridAutoFlow: v } ),
					} )
				),
				h( SwitchRow, {
					key: 'dense',
					label: __( 'Dense', 'snn' ),
					checked: a.gridDense,
					onChange: ( v ) => set( { gridDense: v } ),
				} )
			);
		}

		if ( box ) {
			// In a grid, justify content runs along the columns and align items along the rows.
			rows.push(
				h(
					Row,
					{ key: 'justify', label: __( 'Justify', 'snn' ), changed: !! a.justifyContent },
					h( Segmented, {
						label: __( 'Justify content', 'snn' ),
						value: a.justifyContent || 'flex-start',
						options: options( picked( CHOICES.justify, JUSTIFY_PICS ), ( v ) => mainPic( v, turned ) ),
						onChange: ( v ) => set( { justifyContent: v } ),
					} )
				),
				h(
					Row,
					{ key: 'align', label: __( 'Align', 'snn' ), changed: !! a.alignItems },
					h( Segmented, {
						label: __( 'Align items', 'snn' ),
						value: a.alignItems || 'stretch',
						options: options( picked( CHOICES.align, ALIGN_PICS ), ( v ) => crossPic( v, turned ) ),
						onChange: ( v ) => set( { alignItems: v } ),
					} )
				)
			);
		}

		if ( grid ) {
			rows.push(
				h(
					Row,
					{ key: 'justify-items', label: __( 'Justify items', 'snn' ), changed: !! a.justifyItems },
					h( Segmented, {
						label: __( 'Justify items', 'snn' ),
						value: a.justifyItems || 'stretch',
						options: options( picked( CHOICES.cell, ALIGN_PICS ), ( v ) => crossPic( v, true ) ),
						onChange: ( v ) => set( { justifyItems: v } ),
					} )
				),
				h(
					Row,
					{ key: 'align-content', label: __( 'Align content', 'snn' ), changed: !! a.alignContent },
					h( Segmented, {
						label: __( 'Align content', 'snn' ),
						value: a.alignContent || 'stretch',
						options: options( picked( CHOICES.alignContent, ALIGN_CONTENT_PICS ), ( v ) => mainPic( v, true ) ),
						onChange: ( v ) => set( { alignContent: v } ),
					} )
				)
			);
		}

		if ( box ) {
			rows.push(
				h(
					Row,
					{ key: 'column-gap', label: __( 'Column gap', 'snn' ), changed: !! a.columnGap },
					h( TextField, {
						label: __( 'Column gap', 'snn' ),
						value: a.columnGap,
						placeholder: '0',
						variables: VARIABLE_GROUPS, kind: 'size',
						onChange: ( v ) => set( { columnGap: v } ),
					} )
				),
				h(
					Row,
					{ key: 'row-gap', label: __( 'Row gap', 'snn' ), changed: !! a.rowGap },
					h( TextField, {
						label: __( 'Row gap', 'snn' ),
						value: a.rowGap,
						placeholder: '0',
						variables: VARIABLE_GROUPS, kind: 'size',
						onChange: ( v ) => set( { rowGap: v } ),
					} )
				)
			);
		}

		return h( Fragment, null, rows );
	}

	/** The item settings. They depend on the parent: flex or grid, or neither (then only a hint). */
	function ItemFields( { a, set, parent } ) {
		const flex = parent.display === 'flex';
		const grid = parent.display === 'grid';
		if ( ! flex && ! grid ) {
			return h( 'div', { className: 'snn-hint' }, __( 'Put this block inside a flex or grid block to set its place in it.', 'snn' ) );
		}
		const rows = [
			h(
				Row,
				{ key: 'align-self', label: __( 'Align self', 'snn' ), changed: !! a.alignSelf },
				h( Select, {
					label: __( 'Align self', 'snn' ),
					value: a.alignSelf || 'auto',
					options: toOptions( CHOICES.alignSelf ),
					onChange: ( v ) => set( { alignSelf: v } ),
				} )
			),
		];

		if ( grid ) {
			rows.push(
				h(
					Row,
					{ key: 'justify-self', label: __( 'Justify self', 'snn' ), changed: !! a.justifySelf },
					h( Select, {
						label: __( 'Justify self', 'snn' ),
						value: a.justifySelf || 'stretch',
						options: toOptions( CHOICES.cell ),
						onChange: ( v ) => set( { justifySelf: v } ),
					} )
				),
				h(
					Row,
					{ key: 'column-span', label: __( 'Column span', 'snn' ), changed: !! a.columnSpan },
					h( TextField, {
						label: __( 'Column span', 'snn' ),
						value: a.columnSpan,
						placeholder: '1',
						inputMode: 'numeric',
						onChange: ( v ) => set( { columnSpan: v } ),
					} )
				),
				h(
					Row,
					{ key: 'row-span', label: __( 'Row span', 'snn' ), changed: !! a.rowSpan },
					h( TextField, {
						label: __( 'Row span', 'snn' ),
						value: a.rowSpan,
						placeholder: '1',
						inputMode: 'numeric',
						onChange: ( v ) => set( { rowSpan: v } ),
					} )
				)
			);
		}

		if ( flex ) {
			rows.push(
				h(
					Row,
					{ key: 'grow', label: __( 'Grow', 'snn' ), changed: !! a.flexGrow },
					h( TextField, {
						label: __( 'Flex grow', 'snn' ),
						value: a.flexGrow,
						placeholder: '0',
						inputMode: 'decimal',
						onChange: ( v ) => set( { flexGrow: v } ),
					} )
				),
				h(
					Row,
					{ key: 'shrink', label: __( 'Shrink', 'snn' ), changed: !! a.flexShrink },
					h( TextField, {
						label: __( 'Flex shrink', 'snn' ),
						value: a.flexShrink,
						placeholder: '1',
						inputMode: 'decimal',
						onChange: ( v ) => set( { flexShrink: v } ),
					} )
				),
				h(
					Row,
					{ key: 'basis', label: __( 'Basis', 'snn' ), changed: !! a.flexBasis },
					h( TextField, {
						label: __( 'Flex basis', 'snn' ),
						value: a.flexBasis,
						placeholder: __( 'auto', 'snn' ),
						variables: VARIABLE_GROUPS, kind: 'size',
						onChange: ( v ) => set( { flexBasis: v } ),
					} )
				)
			);
		}

		return h( Fragment, null, rows );
	}

	/** The style settings: the background colour, with the colour variables first in its picker. */
	function StyleFields( { a, set } ) {
		return h(
			Row,
			{ label: __( 'Background', 'snn' ), changed: !! a.backgroundColor },
			h( TextField, {
				label: __( 'Background colour', 'snn' ),
				value: a.backgroundColor,
				placeholder: __( '#ffffff', 'snn' ),
				variables: VARIABLE_GROUPS,
				kind: 'color',
				onChange: ( v ) => set( { backgroundColor: v } ),
			} )
		);
	}

	/** The three views of the header. The choice is the editor's own device, so the two move together. */
	const VIEWS = [
		{ value: 'Desktop', label: __( 'Desktop', 'snn' ), title: __( 'Desktop: base styles', 'snn' ) },
		{ value: 'Tablet', label: __( 'Tablet', 'snn' ), title: __( 'Tablet: up to 991 px', 'snn' ) },
		{ value: 'Mobile', label: __( 'Mobile', 'snn' ), title: __( 'Mobile: up to 478 px', 'snn' ) },
	];

	/** The icon of a view, as in the version 12 panel mock. */
	function viewIcon( value ) {
		if ( value === 'Tablet' ) {
			return [ h( 'rect', { x: 3.5, y: 1.5, width: 9, height: 13, rx: 1.5 } ), h( 'path', { d: 'M7 12.5h2' } ) ];
		}
		if ( value === 'Mobile' ) {
			return [ h( 'rect', { x: 5, y: 1.5, width: 6, height: 13, rx: 1.2 } ), h( 'path', { d: 'M7.2 12.5h1.6' } ) ];
		}
		return [ h( 'rect', { x: 1.5, y: 2.5, width: 13, height: 8.5, rx: 1 } ), h( 'path', { d: 'M5.5 13.5h5M8 11v2.5' } ) ];
	}

	/** The view switch in the panel header. It reads and sets the editor's device switch. */
	function ViewSwitch() {
		const current = useSelect( ( select ) => {
			try {
				return select( 'core/editor' ).getDeviceType();
			} catch ( e ) {
				return 'Desktop';
			}
		}, [] );
		return h(
			'div',
			{ className: 'snn-views', role: 'group', 'aria-label': __( 'View', 'snn' ) },
			VIEWS.map( ( v ) =>
				h(
					'button',
					{
						key: v.value,
						type: 'button',
						'aria-pressed': ( current || 'Desktop' ) === v.value ? 'true' : 'false',
						title: v.title,
						onClick: () => {
							try {
								wp.data.dispatch( 'core/editor' ).setDeviceType( v.value );
							} catch ( e ) {
								// No device switch on this screen: nothing to change.
							}
						},
					},
					h( 'svg', { viewBox: '0 0 16 16', 'aria-hidden': 'true', focusable: 'false' }, viewIcon( v.value ) ),
					v.label
				)
			)
		);
	}

	/** The overflow choices of the Visibility group. */
	const OVERFLOW_OPTIONS = [
		{ value: 'visible', label: __( 'Visible', 'snn' ) },
		{ value: 'hidden', label: __( 'Hidden', 'snn' ) },
		{ value: 'clip', label: __( 'Clip', 'snn' ) },
	];

	/**
	 * One value a view can set: its field, in a row with the hint and the Reset (see ViewRow in controls.js).
	 * The field shows the device's own value, or the value it inherits.
	 */
	function ViewValue( { a, set, device, k, label, unit, kind, options, placeholder } ) {
		const own = ownValue( a, device, k );
		const inherited = inheritedValue( a, device, k );
		const value = own !== undefined ? own : inherited.value;
		const change = ( v ) => setValue( a, set, device, k, v );
		const control =
			kind === 'select'
				? h( Select, { label, value: value || options[ 0 ].value, options, onChange: change } )
				: h( TextField, {
						label,
						value: value === undefined || value === null ? '' : String( value ),
						placeholder,
						unit,
						variables: kind === 'size' ? VARIABLE_GROUPS : undefined,
						kind: kind === 'size' ? 'size' : undefined,
						onChange: change,
				  } );
		return h(
			ViewRow,
			{
				label,
				device,
				own: own !== undefined,
				from: inherited.from,
				value: inherited.value === undefined ? '' : inherited.value,
				unit,
				onReset: () => clearValue( a, set, device, k ),
			},
			control
		);
	}

	/**
	 * The inspector, as in the version 12 layout: the header (the name, the ID and classes, the view), then the
	 * Default and Style tabs. Conditions and Interactions open on their own, in place of the whole panel.
	 */
	function Panel( { a, set, tag, parent, title, duplicateId, device } ) {
		const q = a.query;
		const [ tab, setTab ] = useState( 'default' );
		// null, 'conditions' or 'interactions': a sub-panel that takes the whole view (see the end of this function).
		const [ sub, setSub ] = useState( null );
		const [ classesOpen, setClassesOpen ] = useState( false );
		const [ openQuery, setOpenQuery ] = useState( false );
		const setQ = ( patch ) => set( { query: { ...q, ...patch } } );
		const conditions = Array.isArray( a.conditions ) ? a.conditions : [];
		const interactions = Array.isArray( a.interactions ) ? a.interactions : [];
		const classCount = ( a.cssClasses || '' ).split( /\s+/ ).filter( Boolean ).length;
		const clip = readClip();
		const tabButton = ( id, label ) =>
			h(
				'button',
				{
					type: 'button',
					role: 'tab',
					className: 'snn-tab',
					'aria-selected': tab === id ? 'true' : 'false',
					onClick: () => setTab( id ),
				},
				label
			);

		const header = h(
			'div',
			{ className: 'snn-head' },
			h(
				'div',
				{ className: 'snn-bt-name-row' },
				h( HeadIcons, {
					conditions: conditions.length,
					interactions: interactions.length,
					open: sub,
					onOpen: setSub,
				} )
			),
			h( IdBar, {
				htmlId: a.htmlId,
				onIdChange: ( v ) => set( { htmlId: v } ),
				classCount,
				classesOpen,
				onToggleClasses: () => setClassesOpen( ! classesOpen ),
				onCopyStyles: () => writeClip( { ...styleValues( a, STYLE_KEYS ), responsive: a.responsive || {} } ),
				canPaste: !! clip,
				onPasteStyles: () => set( { ...styleValues( clip.styles, STYLE_KEYS ), responsive: clip.styles.responsive || {} } ),
				duplicate: !! duplicateId,
			} ),
			classesOpen ? h( ClassesEditor, { value: a.cssClasses, onChange: ( v ) => set( { cssClasses: v } ) } ) : null,
			h( ViewSwitch, null )
		);

		// Default: the element, the layout, the query loop, the item, the effects (planned), and the advanced fields.
		const defaultPane = h(
			'div',
			{ className: 'snn-pane' },
			h(
				Group,
				{ title: __( 'Element', 'snn' ), note: __( 'all viewports', 'snn' ) },
				h(
					Row,
					{ label: __( 'HTML tag', 'snn' ), changed: a.tagName !== tag },
					h( Select, {
						label: __( 'HTML tag', 'snn' ),
						value: a.tagName,
						options: TAG_OPTIONS,
						onChange: ( v ) => set( { tagName: v } ),
					} )
				)
			),
			h(
				Group,
				{ title: __( 'Layout', 'snn' ), note: __( 'all viewports', 'snn' ) },
				h( LayoutFields, { a, set, tag } )
			),
			h(
				Group,
				{ title: __( 'Query loop', 'snn' ) },
				h( SwitchRow, {
					label: __( 'Query loop', 'snn' ),
					checked: q.enabled,
					onChange: ( v ) => {
						setQ( { enabled: v } );
						if ( v ) {
							setOpenQuery( true );
						}
					},
				} ),
				h(
					Accordion,
					{
						title: __( 'Query', 'snn' ),
						open: openQuery,
						onToggle: setOpenQuery,
						disabled: ! q.enabled,
						changed: changedQuery( q ),
						hint: __( 'Turn on Query loop first.', 'snn' ),
					},
					h( QueryFields, { q, setQ } )
				)
			),
			h(
				Disclosure,
				{ title: __( 'Item', 'snn' ), note: __( 'all viewports', 'snn' ) },
				h( ItemFields, { a, set, parent } )
			),
			h( Disclosure, { title: __( 'Effects', 'snn' ), note: __( 'all viewports', 'snn' ), planned: true } ),
			h(
				Disclosure,
				{ title: __( 'Advanced', 'snn' ) },
				h(
					Row,
					{ label: __( 'Custom CSS', 'snn' ) },
					h(
						'div',
						{ className: 'snn-planned-row' },
						h( 'button', { type: 'button', className: 'snn-input', disabled: true }, __( 'Edit CSS (admins)', 'snn' ) ),
						h( 'span', { className: 'snn-planned' }, __( 'planned', 'snn' ) )
					)
				)
			)
		);

		// Style: the values each view can set (spacing, size, visibility), then the collapsed groups of the mock.
		const stylePane = h(
			'div',
			{ className: 'snn-pane' },
			h(
				Group,
				{ title: __( 'Spacing', 'snn' ), note: __( 'responsive', 'snn' ) },
				h( ViewValue, { a, set, device, k: 'paddingTop', label: __( 'Padding top', 'snn' ), unit: ' px', kind: 'size', placeholder: '0' } ),
				h( ViewValue, { a, set, device, k: 'paddingBottom', label: __( 'Padding bottom', 'snn' ), unit: ' px', kind: 'size', placeholder: '0' } ),
				h( ViewValue, { a, set, device, k: 'gap', label: __( 'Gap', 'snn' ), unit: ' px', kind: 'size', placeholder: '0' } )
			),
			h(
				Group,
				{ title: __( 'Size', 'snn' ), note: __( 'responsive', 'snn' ) },
				h( ViewValue, { a, set, device, k: 'maxWidth', label: __( 'Max width', 'snn' ), unit: ' px', kind: 'size', placeholder: __( 'none', 'snn' ) } )
			),
			h(
				Group,
				{ title: __( 'Visibility', 'snn' ), note: __( 'responsive', 'snn' ) },
				h( ViewValue, { a, set, device, k: 'opacity', label: __( 'Opacity', 'snn' ), unit: '%', kind: 'number', placeholder: '100' } ),
				h( ViewValue, { a, set, device, k: 'overflow', label: __( 'Overflow', 'snn' ), kind: 'select', options: OVERFLOW_OPTIONS } )
			),
			h( Disclosure, { card: true, title: __( 'Typography', 'snn' ), note: __( 'Inherit', 'snn' ), planned: true } ),
			h(
				Disclosure,
				{ card: true, title: __( 'Background', 'snn' ), note: a.backgroundColor || __( 'None', 'snn' ) },
				h( StyleFields, { a, set } )
			),
			h( Disclosure, { card: true, title: __( 'Border / Box shadow', 'snn' ), note: __( 'None', 'snn' ), planned: true } ),
			h( Disclosure, { card: true, title: __( 'Gradient / Overlay', 'snn' ), note: __( 'None', 'snn' ), planned: true } ),
			h( Disclosure, { card: true, title: __( 'Transform', 'snn' ), note: __( 'Motion effects', 'snn' ), planned: true } ),
			h( Disclosure, { card: true, title: __( 'CSS', 'snn' ), note: __( 'Filters, transition', 'snn' ), planned: true } )
		);

		// Conditions or Interactions open: only that panel shows, under the two icons that open and close it.
		// The name, the ID bar, the view and the tabs are hidden.
		if ( sub ) {
			return h(
				'div',
				{ className: 'snn-panel' },
				h(
					'div',
					{ className: 'snn-head' },
					h(
						'div',
						{ className: 'snn-bt-name-row' },
						h( 'div', { className: 'snn-name' }, sub === 'conditions' ? __( 'Conditions', 'snn' ) : __( 'Interactions', 'snn' ) ),
						h( HeadIcons, { conditions: conditions.length, interactions: interactions.length, open: sub, onOpen: setSub } )
					)
				),
				h(
					'div',
					{ className: 'snn-bt-sub-body' },
					sub === 'conditions'
						? h( ConditionsEditor, { sets: conditions, onChange: ( v ) => set( { conditions: v } ) } )
						: h( InteractionsEditor, { items: interactions, onChange: ( v ) => set( { interactions: v } ) } )
				)
			);
		}

		return h(
			'div',
			{ className: 'snn-panel' },
			header,
			h( 'div', { className: 'snn-tabs', role: 'tablist' }, tabButton( 'default', __( 'Default', 'snn' ) ), tabButton( 'style', __( 'Style', 'snn' ) ) ),
			tab === 'default' ? defaultPane : stylePane
		);
	}


	function badgeText( q ) {
		const type = POST_TYPE_OPTIONS.find( ( o ) => o.value === q.postType );
		return (
			__( 'Query loop', 'snn' ) +
			' · ' +
			( type ? type.label : q.postType ) +
			' · ' +
			( q.perPage || '10' )
		);
	}

	/** The attributes of the layout and item settings: the defaults the PHP side registers too. */
	function layoutAttributes( def ) {
		return {
			tagName: { type: 'string', default: def.tag },
			htmlId: { type: 'string', default: '' },
			cssClasses: { type: 'string', default: '' },
			display: { type: 'string', default: LAYOUT_DEFAULTS.display },
			flexDirection: { type: 'string', default: LAYOUT_DEFAULTS.flexDirection },
			flexWrap: { type: 'string', default: LAYOUT_DEFAULTS.flexWrap },
			justifyContent: { type: 'string', default: LAYOUT_DEFAULTS.justifyContent },
			alignItems: { type: 'string', default: LAYOUT_DEFAULTS.alignItems },
			gap: { type: 'string', default: LAYOUT_DEFAULTS.gap },
			columnGap: { type: 'string', default: LAYOUT_DEFAULTS.columnGap },
			rowGap: { type: 'string', default: LAYOUT_DEFAULTS.rowGap },
			gridColumns: { type: 'string', default: LAYOUT_DEFAULTS.gridColumns },
			gridRows: { type: 'string', default: LAYOUT_DEFAULTS.gridRows },
			gridAutoFlow: { type: 'string', default: LAYOUT_DEFAULTS.gridAutoFlow },
			gridDense: { type: 'boolean', default: LAYOUT_DEFAULTS.gridDense },
			justifyItems: { type: 'string', default: LAYOUT_DEFAULTS.justifyItems },
			alignContent: { type: 'string', default: LAYOUT_DEFAULTS.alignContent },
			alignSelf: { type: 'string', default: ITEM_DEFAULTS.alignSelf },
			justifySelf: { type: 'string', default: ITEM_DEFAULTS.justifySelf },
			flexGrow: { type: 'string', default: ITEM_DEFAULTS.flexGrow },
			flexShrink: { type: 'string', default: ITEM_DEFAULTS.flexShrink },
			flexBasis: { type: 'string', default: ITEM_DEFAULTS.flexBasis },
			columnSpan: { type: 'string', default: ITEM_DEFAULTS.columnSpan },
			rowSpan: { type: 'string', default: ITEM_DEFAULTS.rowSpan },
			backgroundColor: { type: 'string', default: '' },
			paddingTop: { type: 'string', default: '' },
			paddingBottom: { type: 'string', default: '' },
			maxWidth: { type: 'string', default: '' },
			opacity: { type: 'string', default: '' },
			overflow: { type: 'string', default: '' },
			responsive: { type: 'object', default: {} },
			conditions: { type: 'array', default: [] },
			interactions: { type: 'array', default: [] },
			query: { type: 'object', default: QUERY_DEFAULTS },
		};
	}

	/** One block type. def: the block name, title, default tag. */
	function registerLayout( def ) {
		registerBlockType( def.name, {
			apiVersion: 3,
			title: def.title,
			category: 'design',
			icon: def.icon,
			// Our panel carries these settings. The core panels (colour, spacing, dimensions and so on)
			// are off, so the inspector shows only ours.
			supports: {
				html: false,
				anchor: false,
				className: false,
				customClassName: false,
				color: false,
				spacing: false,
				dimensions: false,
				typography: false,
				layout: false,
				background: false,
				border: false,
				shadow: false,
				position: false,
			},
			attributes: layoutAttributes( def ),
			edit: function Edit( { attributes: saved, setAttributes, clientId } ) {
				// WordPress does not merge defaults into an object attribute, so a query saved
				// with some keys missing gets the missing ones here (as the PHP side does).
				const a = { ...saved, query: { ...QUERY_DEFAULTS, ...( saved.query || {} ) } };
				// The parent decides which item settings show: its display and its direction.
				const parentId = useSelect( ( select ) => select( 'core/block-editor' ).getBlockRootClientId( clientId ), [ clientId ] );
				const parentAttrs = useSelect(
					( select ) => ( parentId ? select( 'core/block-editor' ).getBlockAttributes( parentId ) : null ),
					[ parentId ]
				);
				const parent = {
					display: ( parentAttrs && parentAttrs.display ) || '',
					flexDirection: ( parentAttrs && parentAttrs.flexDirection ) || 'row',
				};
				// Another block with the same CSS ID: the panel warns, since the interactions find elements by ID.
				const duplicateId = useSelect(
					( select ) => {
						const id = a.htmlId;
						if ( ! id ) {
							return false;
						}
						const be = select( 'core/block-editor' );
						return be
							.getClientIdsWithDescendants()
							.some( ( cid ) => cid !== clientId && ( be.getBlockAttributes( cid ) || {} ).htmlId === id );
					},
					[ clientId, a.htmlId ]
				);
				// The view the editor shows (Desktop, Tablet or Mobile): the values of that view are drawn on the canvas.
				const device = useSelect( ( select ) => {
					try {
						return select( 'core/editor' ).getDeviceType() || 'Desktop';
					} catch ( e ) {
						return 'Desktop';
					}
				}, [] );
				const blockProps = useBlockProps( {
					id: a.htmlId || undefined,
					className: [ 'wp-block-' + def.name.replace( '/', '-' ), a.cssClasses ].filter( Boolean ).join( ' ' ),
				} );
				// The layout (display, gaps, tracks) goes on the element that holds the children. WordPress
				// puts its own list element between the block wrapper and the children, so a style on the
				// wrapper would not reach them. The layout class names are off: our blocks do not use them.
				const innerProps = useInnerBlocksProps( { style: styleFor( effectiveValues( a, device ) ) }, { __unstableDisableLayoutClassNames: true } );
				const set = ( patch ) => setAttributes( patch );
				return h(
					Fragment,
					null,
					h( InspectorControls, null, h( Panel, { a, set, tag: def.tag, parent, title: def.title, duplicateId, device } ) ),
					h(
						'div',
						blockProps,
						a.query.enabled
							? h( 'div', { className: 'snn-loop-badge', contentEditable: false }, badgeText( a.query ) )
							: null,
						h( 'div', innerProps )
					)
				);
			},
			// The saved markup keeps the inner blocks (a save of null would drop them). The front end
			// is rendered by PHP from those inner blocks (includes/blocks/layout-blocks.php).
			save: function Save() {
				return h( InnerBlocks.Content, null );
			},
		} );
	}

	registerLayout( {
		name: 'snn/section',
		title: __( 'Section', 'snn' ),
		tag: 'section',
		icon: 'editor-table',
	} );
	registerLayout( {
		name: 'snn/container',
		title: __( 'Container', 'snn' ),
		tag: 'div',
		icon: 'editor-expand',
	} );
	registerLayout( {
		name: 'snn/div',
		title: __( 'Div', 'snn' ),
		tag: 'div',
		icon: 'editor-code',
	} );
} )( window.wp, window.snnControls, window.snnLayoutIcons );
