/**
 * SNN layout blocks for the block editor: Section, Container, Div and Text. Text has the same panel, without the
 * query loop; its text is a rich text in the element, and the element takes the style (see registerLayout).
 *
 * The settings sit in the block's inspector, in compact rows (see controls.js):
 *   Layout          display (a dropdown: flex, block, grid), then the rows of that display only, as Bricks shows them:
 *                   flex: direction (column, row and a reverse toggle, as icons), wrap, justify, align, align self,
 *                   gaps, and the item settings flex grow, shrink and basis. Grid: columns, rows, flow, justify items,
 *                   align content, align self, gaps, and the item settings justify self, column and row start and span,
 *                   grid area. Block: none. Order is for every display. The settings are icons where a choice has a
 *                   picture (layout-icons.js), and the pictures follow the direction. Values of the other display stay
 *                   stored, but the front end does not render them.
 *   Query loop      a switch. Turned on, the Query section below it can open.
 *   Query           an accordion, disabled while the switch is off. Post type, order, per page,
 *                   offset, child of, sticky, include and exclude, authors, main query.
 *   Header          the Conditions, Interactions and (GSAP setting on) GSAP animations buttons at the top right,
 *                   and the view. Each opens as a sub-panel in place of the tabs (block-tools.js).
 *   Content tab     no animation fields: normal animations are Start animation in Interactions, GSAP ones
 *                   are the GSAP animations button.
 *   Advanced        the custom classes (tokens: a space makes each one), then the custom attributes (name and value rows).
 *   CSS (Style tab) the last icon of the rail: the block's own CSS in a code editor (the textarea only for
 *                   an administrator). Core's Additional CSS is off (block-defaults.php).
 *
 * Every block gets its CSS ID by default: a new one when it is created, and a new one when a copy would
 * share an ID with another block (see the Edit function). The ID is not shown in the panel.
 *
 * Every text-like field has the dynamic data button and every size field can take a variable.
 * The editor shows each block once. On the front end a query loop repeats the block for every
 * post (rendered in includes/block/layout-blocks.php, whose style rules this file mirrors).
 */
( function ( wp, C, I ) {
	const { registerBlockType } = wp.blocks;
	const { InnerBlocks, InspectorControls, RichText, useBlockProps, useInnerBlocksProps } = wp.blockEditor;
	const { useSelect } = wp.data;
	const { createElement: h, Fragment, useState, useEffect, useRef } = wp.element;
	const { __ } = wp.i18n;
	const data = window.snnControlsData || {};
	const { main: mainPic, cross: crossPic, direction: directionPic, reverse: reversePic, columns: columnsPic } = I;
	const { Row, SwitchRow, Accordion, Select, Segmented, TextField, Group, Disclosure, Dot, Switch, ViewRow, ownValue, inheritedValue, setValue, clearValue, effectiveValues, tipAttr } = C;
	const { HeadIcons, ClassesEditor, AttributesEditor, ConditionsEditor, InteractionsEditor, AnimationsEditor } = window.snnBlockTools;
	const { BlockFormatControls } = wp.blockEditor;
	const { ToolbarButton, ToolbarGroup } = wp.components;
	const { getActiveFormat, toggleFormat } = wp.richText;

	// The Text block's toolbar. Core's bar keeps Bold, Italic and Link, and puts the other formats in its More
	// dropdown. These five simple formats are buttons in the bar too, and they are left out of core's list
	// (textAllowedFormats). Highlight, Inline image, Language and Math open their own pickers, so they stay in the dropdown.
	const barIcon = ( d ) => h( 'svg', { width: 24, height: 24, viewBox: '0 0 24 24', 'aria-hidden': true, focusable: 'false', fill: 'none', stroke: 'currentColor', strokeWidth: 1.6 }, h( 'path', { d } ) );
	const TEXT_BAR_FORMATS = [
		{ name: 'core/code', label: __( 'Inline code', 'snn' ), icon: barIcon( 'M8.5 7.5 3.5 12l5 4.5M15.5 7.5l5 4.5-5 4.5' ) },
		{ name: 'core/keyboard', label: __( 'Keyboard input', 'snn' ), icon: barIcon( 'M3 6.5h18v11H3zM7 14h10' ) },
		{ name: 'core/strikethrough', label: __( 'Strikethrough', 'snn' ), glyph: h( 's', null, 'S' ) },
		{ name: 'core/subscript', label: __( 'Subscript', 'snn' ), glyph: h( Fragment, null, 'X', h( 'sub', null, '2' ) ) },
		{ name: 'core/superscript', label: __( 'Superscript', 'snn' ), glyph: h( Fragment, null, 'X', h( 'sup', null, '2' ) ) },
	];
	// Every registered format except the five above, so core still draws its dropdown and keeps the shortcuts.
	function textAllowedFormats() {
		return wp.data.select( wp.richText.store ).getFormatTypes().map( ( f ) => f.name ).filter( ( n ) => ! TEXT_BAR_FORMATS.some( ( f ) => f.name === n ) );
	}
	// Core runs a format's markdown input rule only for the formats in that list, so inline code would lose `text`.
	// This runs the code rule itself when one character is typed (the rule only looks at the character before the caret).
	function TextInputRules( { value, onChange } ) {
		const last = useRef( value.text );
		useEffect( () => {
			const before = last.current;
			last.current = value.text;
			if ( value.text.length !== before.length + 1 ) {
				return;
			}
			const code = wp.data.select( wp.richText.store ).getFormatType( 'core/code' );
			const next = code && code.__unstableInputRule ? code.__unstableInputRule( value ) : value;
			if ( next !== value ) {
				onChange( next );
			}
		}, [ value ] );
		return null;
	}

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
		excludeCurrent: false,
		taxonomy: '',
		termsInclude: '',
		termsExclude: '',
		metaRelation: 'AND',
		metaQuery: [],
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
		gridAutoColumns: '',
		gridAutoRows: '',
		gridAreas: '',
	};

	/** The block definitions from PHP (blocks/<name>/block.php, see layout-blocks.php), set before this script runs. */
	const defs = window.snnLayoutBlockDefs || [];

	/**
	 * The display and direction each block starts with, from its definition. Section and Container stack their
	 * children; Div is a plain block.
	 */
	const BLOCK_LAYOUT = Object.fromEntries( defs.map( ( def ) => [ def.name, def.layout ] ) );

	/** The layout defaults of one block: the shared defaults, with the block's own display and direction. */
	function layoutDefaults( name ) {
		return Object.assign( {}, LAYOUT_DEFAULTS, BLOCK_LAYOUT[ name ] || {} );
	}

	/** The block's attributes, with its own display and direction as their defaults. */
	function withBlockLayout( attributes, name ) {
		const own = layoutDefaults( name );
		// The Style properties of the table (style-props.php): each an empty text attribute.
		const style = {};
		( window.snnStyleTable || [] ).forEach( ( row ) => {
			style[ row[ 0 ] ] = { type: 'string', default: '' };
		} );
		return Object.assign( {}, attributes, style, {
			display: { type: 'string', default: own.display },
			flexDirection: { type: 'string', default: own.flexDirection },
		} );
	}

	/** The item settings: how the block sits in its flex or grid parent. */
	const ITEM_DEFAULTS = {
		alignSelf: '',
		justifySelf: '',
		flexGrow: '',
		flexShrink: '',
		flexBasis: '',
		columnSpan: '',
		rowSpan: '',
		columnStart: '',
		rowStart: '',
		gridArea: '',
		order: '',
	};

	const TAG_OPTIONS = ( data.tags || [ 'section', 'div' ] ).map( ( t ) => ( { value: t, label: t } ) );
	const TEXT_TAG_OPTIONS = ( data.textTags || [ 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'div', 'span' ] ).map( ( t ) => ( { value: t, label: t } ) );
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


	const TEMPLATE_OK = /^[A-Za-z0-9 .,()%+-]{1,160}$/;
	const NUMBER_OK = /^(\d+(\.\d+)?|var\(--[a-z][a-z0-9-]*\))$/;
	const OVERFLOW_OK = [ 'visible', 'hidden', 'clip' ];
	/**
	 * A CSS length for a layout setting, checked as the front end checks it (style-props.js): a bare number is px,
	 * and a value that is not a length is ''. signed: negative values allowed (gap, flex basis).
	 */
	function cssSize( v, signed ) {
		return window.snnStyleProps.check( signed ? 'length' : 'size', v );
	}
	/** An opacity from 0 to 100, written as 0 to 1, as the front end writes it. Anything else is empty. */
	function opacityCss( v ) {
		const t = str( v ).trim();
		if ( /^var\(--[a-z][a-z0-9-]*\)$/.test( t ) ) {
			return t;
		}
		return /^\d{1,3}$/.test( t ) && Number( t ) <= 100 ? String( Number( t ) / 100 ) : '';
	}
	const SPAN_OK = /^((1[0-2]|[1-9])|var\(--[a-z][a-z0-9-]*\))$/;
	const LINE_OK = /^([1-9]\d?|var\(--[a-z][a-z0-9-]*\))$/;
	const INT_OK = /^(-?\d{1,3}|var\(--[a-z][a-z0-9-]*\))$/;
	const IDENT_OK = /^[A-Za-z][A-Za-z0-9_-]{0,39}$/;
	/** The rows of a grid's areas: quoted names, one string per row. The same rule as areas() in layout-blocks.php. */
	const AREAS_OK = /^"[A-Za-z0-9_.-]+(\s+[A-Za-z0-9_.-]+)*"(\s+"[A-Za-z0-9_.-]+(\s+[A-Za-z0-9_.-]+)*")*$/;

	/* ------------------------------------------------------------------
	 * Pictures and choices
	 * ---------------------------------------------------------------- */

	/** Options from [value, label] pairs, each with its picture (layout-icons.js). */
	function options( pairs, glyph ) {
		return pairs.map( ( [ value, label ] ) => ( { value, label, glyph: glyph( value ) } ) );
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
	const ALIGN_SELF_PICS = [ 'auto', 'stretch', 'flex-start', 'center', 'flex-end', 'baseline' ];

	const DISPLAY_OPTIONS = [
		{ value: 'block', label: __( 'Block', 'snn' ) },
		{ value: 'flex', label: __( 'Flex', 'snn' ) },
		{ value: 'grid', label: __( 'Grid', 'snn' ) },
		{ value: 'inline-flex', label: __( 'Inline flex', 'snn' ) },
		{ value: 'inline-grid', label: __( 'Inline grid', 'snn' ) },
		{ value: 'inline-block', label: __( 'Inline block', 'snn' ) },
		{ value: 'inline', label: __( 'Inline', 'snn' ) },
		{ value: 'none', label: __( 'None (hidden)', 'snn' ) },
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

	/**
	 * A column count is written as a track template: repeat(4, minmax(0, 1fr)) is four equal columns that do not grow
	 * past their content. The same form as columns() in layout-blocks.php.
	 */
	function columnTemplate( n ) {
		return 'repeat(' + n + ', minmax(0, 1fr))';
	}

	/** The column count a stored value stands for: 4, or the template repeat(4, minmax(0, 1fr)). Any other value is ''. */
	function columnCount( v ) {
		const t = v === undefined || v === null ? '' : String( v ).trim();
		const m = /^repeat\((1[0-2]|[1-9]), minmax\(0, 1fr\)\)$/.exec( t ) || /^(1[0-2]|[1-9])$/.exec( t );
		return m ? m[ 1 ] : '';
	}

	/* ------------------------------------------------------------------
	 * The inline style, as the front end writes it (includes/block/layout-blocks.php)
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
		return cssSize( t, true );
	}

	/** The settings of a block inside its parent (the item settings). They go on the block's wrapper, the grid or flex item. */
	const ITEM_CSS = [ 'alignSelf', 'justifySelf', 'order', 'flexGrow', 'flexShrink', 'flexBasis', 'gridArea', 'gridColumn', 'gridRow' ];

	/**
	 * Splits a style into the item part (for the block's wrapper) and the layout part (for the list that holds the
	 * children). The item part is what the block does inside its parent; the rest is what the block holds.
	 */
	function splitStyle( css ) {
		const item = {};
		const layout = {};
		Object.keys( css || {} ).forEach( ( key ) => {
			( ITEM_CSS.indexOf( key ) !== -1 ? item : layout )[ key ] = css[ key ];
		} );
		return {
			item: Object.keys( item ).length ? item : undefined,
			layout: Object.keys( layout ).length ? layout : undefined,
		};
	}

	/** A grid line for an item: a start line, a span, or both (start / span N). Mirrors placement() in layout-blocks.php. */
	function placementCss( start, span ) {
		const line = str( start ).trim();
		const count = str( span ).trim();
		const lineOk = LINE_OK.test( line ) ? line : '';
		const countOk = SPAN_OK.test( count ) ? count : '';
		if ( ! lineOk ) {
			return countOk ? 'span ' + countOk : '';
		}
		return lineOk + ( countOk ? ' / span ' + countOk : '' );
	}

	function styleFor( a ) {
		const css = {};
		const flex = a.display === 'flex' || a.display === 'inline-flex';
		const grid = a.display === 'grid' || a.display === 'inline-grid';

		// Every display is written, block too: a view may turn a flex base back into a block (the front end does the same in its view rules).
		if ( a.display ) {
			css.display = a.display;
		}

		if ( flex ) {
			css.flexDirection = a.flexDirection || 'row';
			css.flexWrap = a.flexWrap || 'nowrap';
		} else if ( grid ) {
			const cols = columnsCss( a.gridColumns );
			if ( cols ) {
				css.gridTemplateColumns = cols;
			}
			const rows = templateCss( a.gridRows );
			if ( rows ) {
				css.gridTemplateRows = rows;
			}
			const areas = str( a.gridAreas ).trim();
			if ( areas.length <= 300 && AREAS_OK.test( areas ) ) {
				css.gridTemplateAreas = areas;
			}
			const autoColumns = templateCss( a.gridAutoColumns );
			if ( autoColumns ) {
				css.gridAutoColumns = autoColumns;
			}
			const autoRows = templateCss( a.gridAutoRows );
			if ( autoRows ) {
				css.gridAutoRows = autoRows;
			}
			// A view's own off is '0', which is true in JavaScript: only true or '1' means dense.
			const dense = a.gridDense === true || a.gridDense === '1';
			if ( dense || a.gridAutoFlow === 'column' ) {
				css.gridAutoFlow = a.gridAutoFlow + ( dense ? ' dense' : '' );
			}
		}

		if ( flex || grid ) {
			if ( a.justifyContent ) {
				css.justifyContent = grid ? gridWord( a.justifyContent ) : a.justifyContent;
			}
			if ( a.alignItems ) {
				css.alignItems = grid ? gridWord( a.alignItems ) : a.alignItems;
			}
			if ( grid && a.justifyItems ) {
				css.justifyItems = gridWord( a.justifyItems );
			}
			// The lines of a grid, or of a flex box that wraps, are packed by align content.
			if ( a.alignContent && ( grid || a.flexWrap !== 'nowrap' ) ) {
				css.alignContent = grid ? gridWord( a.alignContent ) : a.alignContent;
			}
			if ( cssSize( a.gap, true ) ) {
				css.gap = cssSize( a.gap, true );
			}
			if ( cssSize( a.columnGap, true ) ) {
				css.columnGap = cssSize( a.columnGap, true );
			}
			if ( cssSize( a.rowGap, true ) ) {
				css.rowGap = cssSize( a.rowGap, true );
			}
		}

		// Item settings, each for the display that uses it (the same rules as the front end): align self for flex and grid,
		// justify self for grid, grow, shrink and basis for flex, the lines and the area for grid, and order for every display.
		if ( ( flex || grid ) && a.alignSelf ) {
			css.alignSelf = gridWord( a.alignSelf );
		}
		if ( grid && a.justifySelf ) {
			css.justifySelf = gridWord( a.justifySelf );
		}
		const order = str( a.order ).trim();
		if ( INT_OK.test( order ) ) {
			css.order = order;
		}
		if ( flex && NUMBER_OK.test( str( a.flexGrow ) ) ) {
			css.flexGrow = a.flexGrow;
		}
		if ( flex && NUMBER_OK.test( str( a.flexShrink ) ) ) {
			css.flexShrink = a.flexShrink;
		}
		const basis = flex ? lengthCss( a.flexBasis ) : '';
		if ( basis ) {
			css.flexBasis = basis;
		}
		const area = grid ? str( a.gridArea ).trim() : '';
		if ( IDENT_OK.test( area ) ) {
			css.gridArea = area;
		}
		const column = grid ? placementCss( a.columnStart, a.columnSpan ) : '';
		if ( column ) {
			css.gridColumn = column;
		}
		const row = grid ? placementCss( a.rowStart, a.rowSpan ) : '';
		if ( row ) {
			css.gridRow = row;
		}

		// Spacing, width, opacity and overflow: the same rules as the front end (layout-blocks.php).
		if ( cssSize( a.paddingTop, false ) ) {
			css.paddingTop = cssSize( a.paddingTop, false );
		}
		if ( cssSize( a.paddingBottom, false ) ) {
			css.paddingBottom = cssSize( a.paddingBottom, false );
		}
		if ( cssSize( a.maxWidth, false ) ) {
			css.maxWidth = cssSize( a.maxWidth, false );
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

		// The Style properties (spacing, sizing, typography, background, gradient, border, transform, filters, transitions).
		window.snnStyleProps.declarations( a, window.snnStyleTable || [] ).forEach( ( d ) => {
			css[ window.snnStyleProps.camel( d[ 0 ] ) ] = d[ 1 ];
		} );

		return Object.keys( css ).length ? css : undefined;
	}

	/* ------------------------------------------------------------------
	 * Query (unchanged from the first version)
	 * ---------------------------------------------------------------- */

	/** The meta query's compare operators, value types, and the operators that take no value. */
	const META_COMPARE_OPTIONS = [
		{ value: '=', label: __( 'Equals', 'snn' ) },
		{ value: '!=', label: __( 'Not equal', 'snn' ) },
		{ value: '>', label: __( 'Greater than', 'snn' ) },
		{ value: '>=', label: __( 'Greater or equal', 'snn' ) },
		{ value: '<', label: __( 'Less than', 'snn' ) },
		{ value: '<=', label: __( 'Less or equal', 'snn' ) },
		{ value: 'LIKE', label: __( 'Contains', 'snn' ) },
		{ value: 'NOT LIKE', label: __( 'Does not contain', 'snn' ) },
		{ value: 'IN', label: __( 'One of', 'snn' ) },
		{ value: 'NOT IN', label: __( 'None of', 'snn' ) },
		{ value: 'EXISTS', label: __( 'Exists', 'snn' ) },
		{ value: 'NOT EXISTS', label: __( 'Does not exist', 'snn' ) },
	];
	const META_TYPE_OPTIONS = [
		{ value: 'CHAR', label: __( 'Text', 'snn' ) },
		{ value: 'NUMERIC', label: __( 'Number', 'snn' ) },
		{ value: 'DECIMAL', label: __( 'Decimal', 'snn' ) },
		{ value: 'SIGNED', label: __( 'Signed integer', 'snn' ) },
		{ value: 'UNSIGNED', label: __( 'Unsigned integer', 'snn' ) },
		{ value: 'DATE', label: __( 'Date', 'snn' ) },
		{ value: 'DATETIME', label: __( 'Date and time', 'snn' ) },
	];
	const META_NO_VALUE = [ 'EXISTS', 'NOT EXISTS' ];

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
				q.isMain || !! q.taxonomy || !! q.termsInclude || !! q.termsExclude || !! q.excludeCurrent || ( q.metaQuery || [] ).length > 0 || q.metaRelation === 'OR' )
		);
	}

	function QueryFields( { q, setQ } ) {
		const metaRows = Array.isArray( q.metaQuery ) ? q.metaQuery : [];
		const TAXONOMY_OPTIONS = [ { value: '', label: __( 'None', 'snn' ) } ].concat( data.taxonomies || [] );
		const writeMeta = ( rows ) => setQ( { metaQuery: rows } );
		const updateMeta = ( i, patch ) => writeMeta( metaRows.map( ( r, j ) => ( j === i ? Object.assign( {}, r, patch ) : r ) ) );
		const removeMeta = ( i ) => writeMeta( metaRows.filter( ( r, j ) => j !== i ) );
		const addMeta = () => writeMeta( metaRows.concat( [ { key: '', compare: '=', value: '', type: 'CHAR' } ] ) );
		return h(
			Fragment,
			null,
			h(
				Row,
				{ label: __( 'Post type', 'snn' ), changed: q.postType !== 'post', tip: 'postType' },
				h( Select, {
					label: __( 'Post type', 'snn' ),
					value: q.postType,
						tip: 'postType',
					options: POST_TYPE_OPTIONS,
					onChange: ( v ) => setQ( { postType: v } ),
				} )
			),
			h(
				Row,
				{ label: __( 'Order by', 'snn' ), changed: q.orderBy !== 'date', tip: 'orderBy' },
				h( Select, {
					label: __( 'Order by', 'snn' ),
					value: q.orderBy,
						tip: 'orderBy',
					options: ORDER_BY_OPTIONS,
					onChange: ( v ) => setQ( { orderBy: v } ),
				} )
			),
			h(
				Row,
				{ label: __( 'Order', 'snn' ), changed: q.order !== 'DESC', tip: 'queryOrder' },
				h( Select, {
					label: __( 'Order', 'snn' ),
					value: q.order,
						tip: 'queryOrder',
					options: ORDER_OPTIONS,
					onChange: ( v ) => setQ( { order: v } ),
				} )
			),
			h(
				Row,
				{ label: __( 'Per page', 'snn' ), changed: q.perPage !== '10', tip: 'perPage' },
				h( TextField, {
					label: __( 'Posts per page', 'snn' ),
					value: q.perPage,
						tip: 'perPage',
					inputMode: 'numeric',
					onChange: ( v ) => setQ( { perPage: v } ),
				} )
			),
			h(
				Row,
				{ label: __( 'Offset', 'snn' ), changed: q.offset !== '0', tip: 'offset' },
				h( TextField, {
					label: __( 'Offset', 'snn' ),
					value: q.offset,
						tip: 'offset',
					inputMode: 'numeric',
					onChange: ( v ) => setQ( { offset: v } ),
				} )
			),
			h(
				Row,
				{ label: __( 'Child of', 'snn' ), changed: !! q.parent, tip: 'parent' },
				h( TextField, {
					label: __( 'Child of', 'snn' ),
					value: q.parent,
						tip: 'parent',
					placeholder: __( 'Post ID', 'snn' ),
					onChange: ( v ) => setQ( { parent: v } ),
				} )
			),
			h( SwitchRow, {
				label: __( 'Ignore sticky', 'snn' ), tip: 'ignoreSticky',
				checked: q.ignoreSticky,
				onChange: ( v ) => setQ( { ignoreSticky: v } ),
			} ),
			h(
				Row,
				{ label: __( 'Include', 'snn' ), changed: !! q.include, tip: 'include' },
				h( TextField, {
					label: __( 'Include posts', 'snn' ),
					value: q.include,
						tip: 'include',
					placeholder: __( 'IDs', 'snn' ),
					onChange: ( v ) => setQ( { include: v } ),
				} )
			),
			h(
				Row,
				{ label: __( 'Exclude', 'snn' ), changed: !! q.exclude, tip: 'exclude' },
				h( TextField, {
					label: __( 'Exclude posts', 'snn' ),
					value: q.exclude,
						tip: 'exclude',
					placeholder: __( 'IDs', 'snn' ),
					onChange: ( v ) => setQ( { exclude: v } ),
				} )
			),
			h(
				Row,
				{ label: __( 'Authors', 'snn' ), changed: !! q.includeAuthors, tip: 'authorsIn' },
				h( TextField, {
					label: __( 'Include authors', 'snn' ),
					value: q.includeAuthors,
						tip: 'authorsIn',
					placeholder: __( 'User IDs', 'snn' ),
					onChange: ( v ) => setQ( { includeAuthors: v } ),
				} )
			),
			h(
				Row,
				{ label: __( 'Not authors', 'snn' ), changed: !! q.excludeAuthors, tip: 'authorsOut' },
				h( TextField, {
					label: __( 'Exclude authors', 'snn' ),
					value: q.excludeAuthors,
						tip: 'authorsOut',
					placeholder: __( 'User IDs', 'snn' ),
					onChange: ( v ) => setQ( { excludeAuthors: v } ),
				} )
			),
			h(
				Row,
				{ label: __( 'Taxonomy', 'snn' ), changed: !! q.taxonomy, tip: 'taxonomy' },
				h( Select, {
					label: __( 'Taxonomy', 'snn' ),
					value: q.taxonomy || '',
						tip: 'taxonomy',
					options: TAXONOMY_OPTIONS,
					onChange: ( v ) => setQ( { taxonomy: v } ),
				} )
			),
			h(
				Row,
				{ label: __( 'Terms in', 'snn' ), changed: !! q.termsInclude, tip: 'termsIn' },
				h( TextField, {
					label: __( 'Include terms', 'snn' ),
					value: q.termsInclude,
						tip: 'termsIn',
					placeholder: __( 'Term IDs', 'snn' ),
					onChange: ( v ) => setQ( { termsInclude: v } ),
				} )
			),
			h(
				Row,
				{ label: __( 'Terms out', 'snn' ), changed: !! q.termsExclude, tip: 'termsOut' },
				h( TextField, {
					label: __( 'Exclude terms', 'snn' ),
					value: q.termsExclude,
						tip: 'termsOut',
					placeholder: __( 'Term IDs', 'snn' ),
					onChange: ( v ) => setQ( { termsExclude: v } ),
				} )
			),
			...metaRows.map( ( r, i ) =>
				h(
					Fragment,
					{ key: 'meta-' + i },
					h(
						Row,
						{ label: __( 'Meta key', 'snn' ), changed: !! r.key, tip: 'metaKey' },
						h( TextField, {
							label: __( 'Meta key', 'snn' ),
							value: r.key,
								tip: 'metaKey',
							placeholder: __( 'field_name', 'snn' ),
							onChange: ( v ) => updateMeta( i, { key: v } ),
						} )
					),
					h(
						Row,
						{ label: __( 'Compare', 'snn' ), changed: r.compare !== '=', tip: 'metaCompare' },
						h( Select, {
							label: __( 'Compare', 'snn' ),
							value: r.compare,
								tip: 'metaCompare',
							options: META_COMPARE_OPTIONS,
							onChange: ( v ) => updateMeta( i, { compare: v } ),
						} )
					),
					META_NO_VALUE.indexOf( r.compare ) === -1
						? h(
								Row,
								{ label: __( 'Value', 'snn' ), changed: !! r.value, tip: 'metaValue' },
								h( TextField, {
									label: __( 'Meta value', 'snn' ),
									value: r.value,
									placeholder: __( 'value', 'snn' ),
									onChange: ( v ) => updateMeta( i, { value: v } ),
								} )
						  )
						: null,
					h(
						Row,
						{ label: __( 'Type', 'snn' ), changed: r.type !== 'CHAR', tip: 'metaType' },
						h( Select, {
							label: __( 'Value type', 'snn' ),
							value: r.type,
								tip: 'metaType',
							options: META_TYPE_OPTIONS,
							onChange: ( v ) => updateMeta( i, { type: v } ),
						} )
					),
					h(
						Row,
						{ label: '' },
						h(
							'button',
							{ type: 'button', className: 'snn-reset', onClick: () => removeMeta( i ), ...tipAttr( 'metaRemove' ) },
							__( 'Remove rule', 'snn' )
						)
					)
				)
			),
			h(
				Row,
				{ label: __( 'Meta query', 'snn' ), changed: metaRows.length > 0, tip: 'metaAdd' },
				h(
					'button',
					{ type: 'button', className: 'snn-reset', onClick: addMeta, ...tipAttr( 'metaAdd' ) },
					metaRows.length ? __( 'Add another rule', 'snn' ) : __( 'Add rule', 'snn' )
				)
			),
			metaRows.length > 1
				? h(
						Row,
						{ label: __( 'Rules', 'snn' ), changed: q.metaRelation !== 'AND', tip: 'metaRelation' },
						h( Segmented, {
							label: __( 'Rules must match', 'snn' ), tip: 'metaRelation',
							value: q.metaRelation || 'AND',
							options: [
								{ value: 'AND', label: __( 'All', 'snn' ) },
								{ value: 'OR', label: __( 'Any', 'snn' ) },
							],
							onChange: ( v ) => setQ( { metaRelation: v } ),
						} )
				  )
				: null,
			h( SwitchRow, {
				label: __( 'Exclude current', 'snn' ), tip: 'excludeCurrent',
				checked: !! q.excludeCurrent,
				onChange: ( v ) => setQ( { excludeCurrent: v } ),
			} ),
			h( SwitchRow, {
				label: __( 'Main query', 'snn' ), tip: 'isMain',
				checked: q.isMain,
				onChange: ( v ) => setQ( { isMain: v } ),
			} )
		);
	}

	/* ------------------------------------------------------------------
	 * Layout and item rows
	 * ---------------------------------------------------------------- */

	/**
	 * A row of three icons, as Bricks shows the direction: column, row, and reverse. Column and row choose the flow;
	 * reverse is a toggle that flips it, so it keeps its state when the flow changes.
	 */
	function DirectionRow( { label, flow, reverse, onFlow, onReverse } ) {
		const button = ( key, on, glyph, text, press ) =>
			h(
				'button',
				{
					key,
					type: 'button',
					className: 'snn-seg-btn' + ( on ? ' is-on' : '' ),
					'aria-pressed': on ? 'true' : 'false',
					'aria-label': text,
					...tipAttr( 'direction.' + key ),
					onClick: press,
				},
				glyph
			);
		return h(
			'div',
			{ className: 'snn-seg', role: 'group', 'aria-label': label },
			button( 'column', flow === 'column', directionPic( 'column' ), __( 'Column', 'snn' ), () => onFlow( 'column' ) ),
			button( 'row', flow === 'row', directionPic( 'row' ), __( 'Row', 'snn' ), () => onFlow( 'row' ) ),
			button( 'reverse', reverse, reversePic(), __( 'Reverse', 'snn' ), () => onReverse( ! reverse ) )
		);
	}

	/**
	 * The flex or grid settings of the block's own display (none for block), in the order they are used, then the item settings for that display. Every setting is per view
	 * (ViewValue): Desktop holds the base, and Tablet and Mobile set their own. The rows follow the display the panel's
	 * view shows (effectiveValues), so a Tablet that is block shows no flex rows. Align self sits under Align: it acts on
	 * the parent's cross axis, so its pictures turn with the parent's direction.
	 */
	function LayoutFields( { a, set, base, device, parent } ) {
		const shown = effectiveValues( a, device );
		const flexDirection = shown.flexDirection || 'row';
		const flex = shown.display === 'flex' || shown.display === 'inline-flex';
		const grid = shown.display === 'grid' || shown.display === 'inline-grid';
		const box = flex || grid;
		const wrapped = shown.flexWrap !== 'nowrap';
		const parentFlex = parent.display === 'flex' || parent.display === 'inline-flex';
		const reverse = /reverse$/.test( flexDirection );
		const flow = flexDirection.replace( /-reverse$/, '' );
		const directionOwn = viewOwn( a, device, 'flexDirection', base.flexDirection ) !== undefined;
		// A flex column runs its main axis down the block, so its pictures turn a quarter turn.
		const turned = ! grid && /^column/.test( flexDirection );
		const v = ( key, k, props ) => h( ViewValue, Object.assign( { key, a, set, device, k }, props ) );
		const setDirection = ( patch ) => setValue( a, set, device, 'flexDirection', patch );
		const resetDirection = () => clearValue( a, set, device, 'flexDirection' );
		const rows = [
			v( 'display', 'display', { label: __( 'Display', 'snn' ), kind: 'select', options: DISPLAY_OPTIONS, dflt: base.display } ),
		];

		if ( flex ) {
			rows.push(
				h(
					ViewRow,
					{ key: 'direction', label: __( 'Direction', 'snn' ), tip: 'direction', device, own: directionOwn, onReset: resetDirection },
					h( DirectionRow, {
						label: __( 'Direction', 'snn' ),
						flow,
						reverse,
						onFlow: ( x ) => setDirection( reverse ? x + '-reverse' : x ),
						onReverse: ( on ) => setDirection( flow + ( on ? '-reverse' : '' ) ),
					} )
				),
				v( 'wrap', 'flexWrap', { label: __( 'Wrap', 'snn' ), kind: 'select', options: WRAP_OPTIONS, dflt: 'nowrap' } )
			);
		}

		if ( grid ) {
			rows.push(
				v( 'columns', 'gridColumns', { label: __( 'Columns', 'snn' ), kind: 'icons', options: columnOptions(), pick: columnCount, store: columnTemplate } ),
				v( 'template', 'gridColumns', { label: __( 'Template', 'snn' ), tip: 'gridTemplate', placeholder: __( '1fr 2fr', 'snn' ) } ),
				v( 'rows', 'gridRows', { label: __( 'Rows', 'snn' ), placeholder: __( 'auto', 'snn' ) } ),
				v( 'auto-columns', 'gridAutoColumns', { label: __( 'Auto columns', 'snn' ), placeholder: __( 'auto', 'snn' ) } ),
				v( 'auto-rows', 'gridAutoRows', { label: __( 'Auto rows', 'snn' ), placeholder: __( 'auto', 'snn' ) } ),
				v( 'areas', 'gridAreas', { label: __( 'Areas', 'snn' ), placeholder: '"header header" "main side"', variables: null } ),
				v( 'flow', 'gridAutoFlow', { label: __( 'Flow', 'snn' ), kind: 'icons', options: options( FLOW_PAIRS, ( x ) => directionPic( x ) ), dflt: 'row', fallback: 'row' } ),
				v( 'dense', 'gridDense', { label: __( 'Dense', 'snn' ), kind: 'switch', dflt: false } )
			);
		}

		if ( box ) {
			// In a grid, justify content runs along the columns and align items along the rows.
			rows.push(
				v( 'justify', 'justifyContent', { label: __( 'Justify', 'snn' ), kind: 'icons', options: options( picked( CHOICES.justify, JUSTIFY_PICS ), ( x ) => mainPic( x, turned ) ), fallback: 'flex-start' } ),
				v( 'align', 'alignItems', { label: __( 'Align', 'snn' ), kind: 'icons', options: options( picked( CHOICES.align, ALIGN_PICS ), ( x ) => crossPic( x, turned ) ), fallback: 'stretch' } )
			);
		}

		// Align self is for a flex or grid box. Its pictures turn when the parent is a flex column (the parent's cross axis).
		if ( box ) {
			const turnedSelf = parentFlex && /^column/.test( parent.flexDirection || '' );
			rows.push(
				v( 'align-self', 'alignSelf', { label: __( 'Align self', 'snn' ), kind: 'icons', options: options( picked( CHOICES.alignSelf, ALIGN_SELF_PICS ), ( x ) => crossPic( x, turnedSelf ) ), fallback: 'auto' } )
			);
		}

		if ( flex && wrapped ) {
			rows.push(
				v( 'flex-align-content', 'alignContent', { label: __( 'Align content', 'snn' ), kind: 'icons', options: options( picked( CHOICES.alignContent, ALIGN_CONTENT_PICS ), ( x ) => mainPic( x, ! turned ) ), fallback: 'stretch' } )
			);
		}

		if ( grid ) {
			rows.push(
				v( 'justify-items', 'justifyItems', { label: __( 'Justify items', 'snn' ), kind: 'icons', options: options( picked( CHOICES.cell, ALIGN_PICS ), ( x ) => crossPic( x, true ) ), fallback: 'stretch' } ),
				v( 'align-content', 'alignContent', { label: __( 'Align content', 'snn' ), kind: 'icons', options: options( picked( CHOICES.alignContent, ALIGN_CONTENT_PICS ), ( x ) => mainPic( x, true ) ), fallback: 'stretch' } )
			);
		}

		if ( box ) {
			rows.push(
				v( 'column-gap', 'columnGap', { label: __( 'Column gap', 'snn' ), kind: 'size', placeholder: '0' } ),
				v( 'row-gap', 'rowGap', { label: __( 'Row gap', 'snn' ), kind: 'size', placeholder: '0' } )
			);
		}

		// The item settings follow the display, as the flex and grid settings do: grow, shrink and basis for flex, and the
		// place in the grid for grid. Order is for every display (the front end renders the same rules).
		if ( flex ) {
			rows.push(
				v( 'grow', 'flexGrow', { label: __( 'Flex grow', 'snn' ), placeholder: '0', inputMode: 'decimal' } ),
				v( 'shrink', 'flexShrink', { label: __( 'Flex shrink', 'snn' ), placeholder: '1', inputMode: 'decimal' } ),
				v( 'basis', 'flexBasis', { label: __( 'Flex basis', 'snn' ), placeholder: __( 'auto', 'snn' ), kind: 'size' } )
			);
		}
		if ( grid ) {
			rows.push(
				v( 'justify-self', 'justifySelf', { label: __( 'Justify self', 'snn' ), kind: 'icons', options: options( picked( CHOICES.cell, ALIGN_PICS ), ( x ) => crossPic( x, true ) ), fallback: 'stretch' } ),
				v( 'column-start', 'columnStart', { label: __( 'Column start', 'snn' ), placeholder: __( 'auto', 'snn' ), inputMode: 'numeric' } ),
				v( 'column-span', 'columnSpan', { label: __( 'Column span', 'snn' ), placeholder: '1', inputMode: 'numeric' } ),
				v( 'row-start', 'rowStart', { label: __( 'Row start', 'snn' ), placeholder: __( 'auto', 'snn' ), inputMode: 'numeric' } ),
				v( 'row-span', 'rowSpan', { label: __( 'Row span', 'snn' ), placeholder: '1', inputMode: 'numeric' } ),
				v( 'area', 'gridArea', { label: __( 'Grid area', 'snn' ), placeholder: __( 'name', 'snn' ), variables: null } )
			);
		}
		rows.push( v( 'order', 'order', { label: __( 'Order', 'snn' ), placeholder: '0', inputMode: 'numeric' } ) );

		return h( Fragment, null, rows );
	}

	/** The style settings: the background colour, with the colour variables first in its picker. */
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
						...tipAttr( 'view.' + v.value.toLowerCase() ),
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
	 * The value a view sets for one key. On Desktop that is the base value, unless it is empty or the setting's default
	 * (a default is not a change). On Tablet and Mobile it is the view's own value. Undefined when the view sets none.
	 */
	function viewOwn( a, device, k, dflt ) {
		if ( device === 'Desktop' ) {
			const v = a[ k ];
			return v === undefined || v === '' || v === dflt ? undefined : v;
		}
		return ownValue( a, device, k );
	}

	/**
	 * One value a view can set: its field, in a row with the Reset (see ViewRow in controls.js). The dot on the label
	 * shows that the view sets its own value. A value the view inherits shows as the field's placeholder; a switch or an
	 * icon row shows it as its state, as those have no placeholder. dflt is the setting's default (see viewOwn).
	 */
	function ViewValue( { a, set, device, k, label, unit, kind, options, placeholder, dflt = '', fallback, variables, inputMode, tip, pick, store } ) {
			// The tooltip key: the setting's own key, unless the row names another (the template is a grid column setting).
			const key = tip || k;
		const own = viewOwn( a, device, k, dflt );
		const value = own !== undefined ? own : inheritedValue( a, device, k ).value;
		const change = ( v ) => setValue( a, set, device, k, v );
		const groups = variables === undefined ? VARIABLE_GROUPS : variables;
		const empty = value === undefined || value === null || value === '';
		let control;
		if ( kind === 'select' ) {
			control = h( Select, { label, tip: key, value: empty ? fallback || options[ 0 ].value : String( value ), options, onChange: change } );
		} else if ( kind === 'icons' ) {
			// pick shows the stored value as one of the options (the column icons show the count of a template).
			// store writes the chosen option as the stored value (a count becomes its template).
			control = h( Segmented, { label, tip: key, value: empty ? fallback || '' : String( pick ? pick( value ) : value ), options, onChange: store ? ( x ) => change( store( x ) ) : change } );
		} else if ( kind === 'switch' ) {
			// A view's own off is '0' (an empty value would mean inherit). Desktop keeps the boolean.
			control = h( Switch, { tip: key,
				label,
				checked: value === true || value === '1',
				onChange: ( on ) => change( device === 'Desktop' ? on : on ? '1' : '0' ),
			} );
		} else {
			const inherits = own === undefined && ! empty;
			control = h( TextField, { tip: key,
				label,
				value: own === undefined ? '' : String( own ),
				placeholder: inherits ? String( value ) : placeholder,
				unit,
				variables: groups,
				kind: kind === 'size' ? 'size' : kind === 'color' ? 'color' : undefined,
				swatch: kind === 'color',
				inputMode,
				onChange: change,
			} );
		}
		return h( ViewRow, { label, device, tip: key, own: own !== undefined, onReset: () => clearValue( a, set, device, k ) }, control );
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

	/** The selectors the CSS group's selector list writes: a rule with the selector goes in at the caret. */
	const CSS_SELECTORS = [
		{ value: '%root%', label: __( 'This block (%root%)', 'snn' ) },
		{ value: '%root%:hover', label: __( 'Hover', 'snn' ) },
		{ value: '%root%:focus-visible', label: __( 'Keyboard focus', 'snn' ) },
		{ value: '%root%::before', label: __( 'Before (::before)', 'snn' ) },
		{ value: '%root%::after', label: __( 'After (::after)', 'snn' ) },
		{ value: '%root% > *', label: __( 'Direct children', 'snn' ) },
	];
	/** What an empty CSS editor starts with: the block's own selector, with the caret inside the rule. */
	const CSS_STARTER = '%root% {\n\t\n}';

		/** The custom CSS as the front end prints it (clean_css in layout-blocks.php): no style or script tags, comments or imports, 4000 characters at most. */
		function cleanCss( value ) {
			return String( value || '' )
				.slice( 0, 4000 )
				.replace( /<\/?\s*(style|script)[^>]*>|<!--|-->|@import[^;]*;?/gi, '' )
				.trim();
		}

		/** A class for one CSS text in the editor. The editor scopes the rules with it, as the front end scopes them with snn-c-<md5>. */
		function cssScope( css ) {
			let hash = 2166136261;
			for ( let i = 0; i < css.length; i++ ) {
				hash = Math.imul( hash ^ css.charCodeAt( i ), 16777619 );
			}
			return 'snn-c-' + ( hash >>> 0 ).toString( 16 );
		}

		/**
		 * Where the caret is in a CSS value: inside a rule, after the colon of the current declaration. Also the word
		 * before the caret (var( and the dashes count as part of it) and the place where that word starts.
		 */
		function cssValueAt( cm ) {
			const cur = cm.getCursor();
			const before = cm.getRange( { line: 0, ch: 0 }, cur );
			const open = before.lastIndexOf( '{' );
			const declaration = before.slice( Math.max( open, before.lastIndexOf( ';' ) ) + 1 );
			const line = cm.getLine( cur.line ).slice( 0, cur.ch );
			const word = /(?:var\(\s*)?[\w-]*$/.exec( line )[ 0 ];
			return {
				cur,
				word,
				line,
				from: { line: cur.line, ch: cur.ch - word.length },
				prop: ( /([a-z-]+)\s*:[^:]*$/i.exec( declaration ) || [ '', '' ] )[ 1 ].toLowerCase(),
				inValue: open > before.lastIndexOf( '}' ) && declaration.indexOf( ':' ) !== -1,
			};
		}

		/**
		 * Which kind of variable is listed first for a property (the V picker's rule): sizes for a size property, colours
		 * for everything else. Returns 0 for the kind that comes first and 1 for the other.
		 */
		function kindRank( kind, prop ) {
			const sizeProp = /^(margin|padding|gap|row-gap|column-gap|inset|top|right|bottom|left|width|height|min-width|min-height|max-width|max-height|font-size|line-height|letter-spacing|border-width|border-radius|flex-basis|text-indent|outline-offset)/;
			const sizeFirst = sizeProp.test( prop ) && ! /color|fill|stroke|shadow/.test( prop );
			return ( kind === 'size' ) === sizeFirst ? 0 : 1;
		}

		/** One variable as a completion: its name (--black), a swatch for a colour, and the var() text it writes. */
		function variableCompletion( it ) {
			const name = '--' + it.label;
			return {
				text: it.value,
				displayText: name,
				render: function ( elt ) {
					if ( it.color ) {
						const swatch = document.createElement( 'span' );
						swatch.className = 'snn-swatch';
						swatch.style.background = it.color;
						elt.appendChild( swatch );
					}
					elt.appendChild( document.createTextNode( name ) );
				},
			};
		}

		/**
		 * The autocomplete of the CSS editor. In a value (color: , padding: ) it offers the variables first: the same
		 * colours and sizes the V button lists, filtered by what is typed. Then the CodeMirror keyword list, as before.
		 * Anywhere else it is the keyword list alone.
		 */
		function cssHint( cm, options ) {
			const at = cssValueAt( cm );
			// A lone r at the start of a word is the %root% shortcut (Tab): no list opens for it, so Tab can write %root%.
			if ( /(^|[\s{};,>+~(])r$/.test( at.line ) ) {
				return undefined;
			}
			const helper = cm.getHelper( at.cur, 'hint' );
			const keywords = typeof helper === 'function' ? helper( cm, options ) : null;
			if ( ! at.inValue ) {
				return keywords;
			}
			const typed = at.word.replace( /^var\(\s*/, '' ).replace( /^-+/, '' ).toLowerCase();
			const list = [];
			VARIABLE_GROUPS.slice().sort( ( a, b ) => kindRank( a.kind, at.prop ) - kindRank( b.kind, at.prop ) ).forEach( ( g ) =>
				g.items.forEach( ( it ) => {
					if ( it.label.toLowerCase().indexOf( typed ) !== -1 ) {
						list.push( variableCompletion( it ) );
					}
				} )
			);
			// After var( only variables fit, so the keywords are left out there.
			if ( keywords && keywords.list && ! /^var\(/.test( at.word ) ) {
				keywords.list.forEach( ( word ) => list.push( word ) );
			}
			// The caret is inside an auto-closed var( ): the closing bracket after the caret is replaced with the variable.
			const closes = /^var\(/.test( at.word ) && cm.getRange( at.cur, { line: at.cur.line, ch: at.cur.ch + 1 } ) === ')';
			return { list, from: at.from, to: closes ? { line: at.cur.line, ch: at.cur.ch + 1 } : at.cur };
		}

	/**
	 * The block's CSS in the code editor the code snippets use (wp.codeEditor, CodeMirror). An empty editor starts
	 * with %root% { }. Typing r and pressing Tab writes %root%. The selector list writes a rule at the caret.
	 * Each change is saved as the block's customCss. Without the code editor (syntax highlighting off in the user's
	 * profile) it is a plain textarea.
	 */
	function CssEditor( { value, onChange, editor, label } ) {
		const area = useRef( null );
		const cm = useRef( null );
		const latest = useRef( onChange );
		const quiet = useRef( false );
		latest.current = onChange;
		const useCode = !! ( editor && window.wp && wp.codeEditor );

		useEffect( () => {
			const node = area.current;
			if ( ! useCode || ! node ) {
				return undefined;
			}
			node.value = value || '';
			const ed = wp.codeEditor.initialize( node, editor ).codemirror;
			// The autocomplete: cssHint (variables in a value, then the keywords). Typing - or ( in a value opens it as well.
			ed.setOption( 'hintOptions', Object.assign( {}, ed.getOption( 'hintOptions' ) || {}, { hint: cssHint, completeSingle: false } ) );
			ed.on( 'inputRead', ( c, change ) => {
				const typed = change.text.join( '' );
				if ( change.origin === '+input' && ( typed === '-' || typed === '(' ) && cssValueAt( c ).inValue ) {
					c.showHint( { completeSingle: false } );
				}
			} );
			cm.current = ed;
			if ( ! ed.getValue() ) {
				// The selector is there to write in. Nothing is saved until the author types.
				quiet.current = true;
				ed.setValue( CSS_STARTER );
				quiet.current = false;
				ed.setCursor( { line: 1, ch: 1 } );
			}
			ed.on( 'change', () => {
				if ( ! quiet.current ) {
					latest.current( ed.getValue() );
				}
			} );
			// Tab after a lone r (at the start of a word) writes the block's selector. Any other Tab indents.
			ed.setOption(
				'extraKeys',
				Object.assign( {}, ed.getOption( 'extraKeys' ) || {}, {
					Tab: ( c ) => {
						// A completion left open by the r (no list shows for it) would reopen on the new text: close it first.
						if ( c.state.completionActive ) {
							c.state.completionActive.close();
						}
						const at = c.getCursor();
						if ( /(^|[\s{};,>+~(])r$/.test( c.getLine( at.line ).slice( 0, at.ch ) ) ) {
							c.replaceRange( '%root%', { line: at.line, ch: at.ch - 1 }, at );
						} else {
							c.execCommand( 'defaultTab' );
						}
					},
				} )
			);
			return () => {
				cm.current = null;
				ed.toTextArea();
			};
		}, [] );

		// A value set from outside (another block selected, a copy, an undo) reaches the open editor too. An empty value
		// shows the selector again, as on opening. Clearing the text by hand is not changed here: it is already empty.
		useEffect( () => {
			const ed = cm.current;
			if ( ! ed || ( value || '' ) === ed.getValue() ) {
				return;
			}
			quiet.current = true;
			ed.setValue( value || CSS_STARTER );
			quiet.current = false;
			if ( ! value ) {
				ed.setCursor( { line: 1, ch: 1 } );
			}
		}, [ value ] );

		// Writes a rule at the caret: the selector, a brace pair and an empty middle line with the caret on it.
		// A rule starts on its own line: text before the caret on the same line gets a line break first.
		const insert = ( rule ) => {
			const ed = cm.current;
			if ( ed ) {
				const at = ed.getCursor();
				const lead = ed.getLine( at.line ).slice( 0, at.ch ).trim() ? '\n' : '';
				ed.replaceRange( lead + rule, at );
				ed.setCursor( { line: at.line + ( lead ? 1 : 0 ) + 1, ch: 1 } );
				ed.focus();
				return;
			}
			const node = area.current;
			if ( node ) {
				const start = node.selectionStart || 0;
				const end = node.selectionEnd || start;
				const before = node.value.slice( 0, start );
				const lead = before.split( '\n' ).pop().trim() ? '\n' : '';
				latest.current( before + lead + rule + node.value.slice( end ) );
			}
		};

		const field = useCode
			? h( 'textarea', { ref: area, className: 'snn-input snn-css', rows: 12, spellCheck: false, defaultValue: value || '', 'aria-label': label } )
			: h( 'textarea', {
					ref: area,
					className: 'snn-input snn-css',
					rows: 12,
					spellCheck: false,
					value: value || '',
					placeholder: CSS_STARTER,
					'aria-label': label,
					onChange: ( e ) => latest.current( e.target.value ),
			  } );

		return h(
			'div',
			{ className: 'snn-css-editor' },
			h(
				'select',
				{
					className: 'snn-select snn-css-selector',
					value: '',
					'aria-label': __( 'Insert a selector', 'snn' ),
					onChange: ( e ) => {
						if ( e.target.value ) {
							insert( e.target.value + ' {\n\t\n}' );
						}
					},
				},
				h( 'option', { value: '' }, __( 'Insert a selector', 'snn' ) ),
				CSS_SELECTORS.map( ( o ) => h( 'option', { key: o.value, value: o.value }, o.label ) )
			),
			field,
			h( 'span', { className: 'snn-css-hint' }, __( 'Use %root% for this block. Type r and press Tab to insert it. Scripts and imports are removed.', 'snn' ) )
		);
	}

	/** The CSS group's page: the code editor for an administrator, a note for everyone else. */
	function CssPane( { a, set, canCss, editor } ) {
		return h(
			'div',
			{ className: 'snn-css-pane', ...tipAttr( 'customCss' ) },
			canCss
				? h( CssEditor, { value: a.customCss || '', onChange: ( v ) => set( { customCss: v } ), editor, label: __( 'Custom CSS', 'snn' ) } )
				: h( 'span', { className: 'snn-css-hint' }, __( 'Only administrators can add custom CSS.', 'snn' ) )
		);
	}

	const STYLE_PAGES = [
		{
			id: 'layout',
			label: __( 'Layout', 'snn' ),
			glyph: 'layout',
			sections: [
				{ tip: 'sec.spacing', title: __( 'Spacing', 'snn' ), rows: [ BOX_MARGIN, BOX_PADDING, 'gap' ] },
				{ tip: 'sec.sizing', title: __( 'Sizing', 'snn' ), rows: [ 'width', 'minWidth', 'maxWidth', 'height', 'minHeight', 'maxHeight', 'aspectRatio' ] },
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
			sections: [
				{ tip: 'sec.gradient', title: __( 'Gradient', 'snn' ), rows: [ 'gradientType', 'gradientAngle', 'gradientColor1', 'gradientStop1', 'gradientColor2', 'gradientStop2' ] },
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

	const VIEW_KEY = { Tablet: 'tablet', Mobile: 'mobile' };

	/** The value a view sets for itself. On Desktop that is the base value. Undefined when it sets none. */
	function setHere( a, device, k ) {
		if ( device === 'Desktop' ) {
			return a[ k ] !== undefined && a[ k ] !== '' ? a[ k ] : undefined;
		}
		return ownValue( a, device, k );
	}

	/** Sets several values for the view at once (the four sides of a box, when linked). An empty value clears it. */
	function setMany( a, set, device, pairs ) {
		if ( device === 'Desktop' ) {
			const patch = {};
			pairs.forEach( ( p ) => {
				patch[ p[ 0 ] ] = p[ 1 ];
			} );
			set( patch );
			return;
		}
		const view = VIEW_KEY[ device ];
		const responsive = { ...( a.responsive || {} ) };
		const own = { ...( responsive[ view ] || {} ) };
		pairs.forEach( ( p ) => {
			if ( p[ 1 ] === '' || p[ 1 ] === undefined ) {
				delete own[ p[ 0 ] ];
			} else {
				own[ p[ 0 ] ] = p[ 1 ];
			}
		} );
		if ( Object.keys( own ).length ) {
			responsive[ view ] = own;
		} else {
			delete responsive[ view ];
		}
		set( { responsive } );
	}

	/** The label of each Style row. */
	const STYLE_LABEL = {
		marginTop: __( 'Margin top', 'snn' ), marginRight: __( 'Margin right', 'snn' ), marginBottom: __( 'Margin bottom', 'snn' ), marginLeft: __( 'Margin left', 'snn' ),
		paddingTop: __( 'Padding top', 'snn' ), paddingBottom: __( 'Padding bottom', 'snn' ), paddingLeft: __( 'Padding left', 'snn' ), paddingRight: __( 'Padding right', 'snn' ), gap: __( 'Gap', 'snn' ),
		width: __( 'Width', 'snn' ), minWidth: __( 'Min. width', 'snn' ), maxWidth: __( 'Max. width', 'snn' ), height: __( 'Height', 'snn' ), minHeight: __( 'Min. height', 'snn' ), maxHeight: __( 'Max. height', 'snn' ), aspectRatio: __( 'Aspect ratio', 'snn' ),
		position: __( 'Position', 'snn' ), top: __( 'Top', 'snn' ), right: __( 'Right', 'snn' ), bottom: __( 'Bottom', 'snn' ), left: __( 'Left', 'snn' ), zIndex: __( 'Z-index', 'snn' ), scrollSnapAlign: __( 'Scroll snap', 'snn' ),
		opacity: __( 'Opacity', 'snn' ), overflow: __( 'Overflow', 'snn' ), visibility: __( 'Visibility', 'snn' ), cursor: __( 'Cursor', 'snn' ), isolation: __( 'Isolation', 'snn' ), mixBlendMode: __( 'Blend mode', 'snn' ), pointerEvents: __( 'Pointer events', 'snn' ), perspective: __( 'Perspective', 'snn' ), perspectiveOrigin: __( 'Perspective origin', 'snn' ),
		color: __( 'Colour', 'snn' ), fontFamily: __( 'Font family', 'snn' ), fontSize: __( 'Font size', 'snn' ), fontWeight: __( 'Font weight', 'snn' ), fontStyle: __( 'Font style', 'snn' ), lineHeight: __( 'Line height', 'snn' ), letterSpacing: __( 'Letter spacing', 'snn' ), textAlign: __( 'Text align', 'snn' ), textTransform: __( 'Text transform', 'snn' ), textDecoration: __( 'Decoration', 'snn' ), textWrap: __( 'Text wrap', 'snn' ), whiteSpace: __( 'White space', 'snn' ), textShadow: __( 'Text shadow', 'snn' ),
		backgroundColor: __( 'Colour', 'snn' ), backgroundImage: __( 'Image URL', 'snn' ), backgroundSize: __( 'Size', 'snn' ), backgroundPosition: __( 'Position', 'snn' ), backgroundRepeat: __( 'Repeat', 'snn' ),
		gradientType: __( 'Type', 'snn' ), gradientAngle: __( 'Angle', 'snn' ), gradientColor1: __( 'Colour 1', 'snn' ), gradientStop1: __( 'Stop 1', 'snn' ), gradientColor2: __( 'Colour 2', 'snn' ), gradientStop2: __( 'Stop 2', 'snn' ),
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

	/** The rows the table's types decide: a select for keywords, a colour field, a size field, or a plain field. */
	function StyleRow( { a, set, device, k } ) {
		const label = STYLE_LABEL[ k ] || k;
		if ( k === 'overflow' ) {
			return h( ViewValue, { a, set, device, k, label, kind: 'select', options: OVERFLOW_OPTIONS } );
		}
		if ( k === 'textAlign' ) {
			return h( ViewValue, { a, set, device, k, label, kind: 'icons', options: TEXT_ALIGN_OPTIONS } );
		}
		if ( k === 'textTransform' ) {
			return h( ViewValue, { a, set, device, k, label, kind: 'icons', options: TEXT_TRANSFORM_OPTIONS } );
		}
		const spec = ( window.snnStyleTable || [] ).find( ( row ) => row[ 0 ] === k );
		const type = STYLE_COLOUR.indexOf( k ) !== -1 ? 'color' : spec ? spec[ 2 ] : STYLE_EXTRA[ k ] || 'text';
		// A keyword, or a size that also takes keywords (background size: cover, contain, auto), is a choice.
		// Every row has an options list (empty for the sizes), so the test is for a list with items.
		if ( type === 'keyword' || ( spec && Array.isArray( spec[ 3 ] ) && spec[ 3 ].length > 0 ) ) {
			const options = ( spec ? spec[ 3 ] : [] ).map( ( o ) => ( { value: o, label: o.charAt( 0 ).toUpperCase() + o.slice( 1 ) } ) );
			return h( ViewValue, { a, set, device, k, label, kind: 'select', options } );
		}
		if ( type === 'color' ) {
			return h( ViewValue, { a, set, device, k, label, kind: 'color' } );
		}
		if ( STYLE_SIZE.indexOf( type ) !== -1 || type === 'size' ) {
			return h( ViewValue, { a, set, device, k, label, unit: ' px', kind: 'size', placeholder: '0' } );
		}
		return h( ViewValue, { a, set, device, k, label, unit: STYLE_UNIT[ k ] } );
	}

	/** The property names a Style group shows, boxes included. */
	function pageKeys( page ) {
		return page.sections.reduce( ( all, s ) => all.concat( s.rows.reduce( ( ks, r ) => ks.concat( typeof r === 'string' ? [ r ] : r.keys ), [] ) ), [] );
	}

	/** The views a value can be set on: the rail's dot counts all of them, not only the view on show. */
	const ALL_VIEWS = [ 'Desktop', 'Tablet', 'Mobile' ];

	/** True when a Style group holds a value on any view, so its rail icon shows a dot. The CSS group counts its text. */
	function groupChanged( a, page ) {
		if ( page.kind === 'css' ) {
			return !! a.customCss;
		}
		return pageKeys( page ).some( ( k ) => ALL_VIEWS.some( ( d ) => setHere( a, d, k ) !== undefined ) );
	}

	/**
	 * Margin or padding: the four sides as a 2 by 2 grid. Linked, one edit sets all four. Each side shows the value
	 * the view sets; the value it inherits is its placeholder. A dot marks a side the view sets.
	 */
	function BoxModel( { a, set, device, box } ) {
		const [ linked, setLinked ] = useState( false );
		const keys = box.keys;
		const anyOwn = keys.some( ( k ) => setHere( a, device, k ) !== undefined );
		const change = ( k, v ) => ( linked ? setMany( a, set, device, keys.map( ( key ) => [ key, v ] ) ) : setValue( a, set, device, k, v ) );
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
					anyOwn && device !== 'Desktop'
						? h(
								'button',
								{
									type: 'button',
									className: 'snn-reset',
									onClick: () => setMany( a, set, device, keys.map( ( key ) => [ key, '' ] ) ),
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
				h( 'div', { className: 'snn-box-inner', 'aria-hidden': 'true' } ),
				keys.map( ( k, i ) => {
					const own = setHere( a, device, k );
					const inherited = inheritedValue( a, device, k );
					return h(
						'div',
						{ key: k, className: 'snn-box-cell snn-box-' + BOX_AREA[ i ] },
						own !== undefined ? h( 'span', { className: 'snn-box-mark', 'aria-hidden': 'true' }, h( Dot ) ) : null,
						h( TextField, {
							label: box.label + ' ' + SIDE_LABEL[ i ], tip: k,
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

	/**
	 * The inspector, as in the version 12 layout: the header (the Conditions and Interactions buttons, the view), then
	 * the Default and Style tabs. Conditions and Interactions open on their own, in place of the whole panel.
	 */
	function Panel( { a, set, tag, parent, title, device, base, text } ) {
		const q = a.query;
		const [ tab, setTab ] = useState( 'default' );
		// null, 'conditions', 'interactions' or 'animations': a sub-panel that takes the whole view (see the end of this function).
		const [ sub, setSub ] = useState( null );
		const [ openQuery, setOpenQuery ] = useState( false );
		// The Style group on show (one at a time, chosen on the rail).
		const [ stylePage, setStylePage ] = useState( 'layout' );
		const setQ = ( patch ) => set( { query: { ...q, ...patch } } );
		const conditions = Array.isArray( a.conditions ) ? a.conditions : [];
		const interactions = Array.isArray( a.interactions ) ? a.interactions : [];
		const animation = Array.isArray( a.animation ) ? a.animation : [];
		const SUB_TITLES = {
			conditions: __( 'Conditions', 'snn' ),
			interactions: __( 'Interactions', 'snn' ),
			animations: __( 'Animations', 'snn' ),
		};
		const tabButton = ( id, label ) =>
			h(
				'button',
				{
					type: 'button',
					role: 'tab',
					className: 'snn-tab',
						...tipAttr( id === 'default' ? 'tab.content' : 'tab.style' ),
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
				h( 'div', { className: 'snn-name' }, title ),
				h( HeadIcons, {
					conditions: conditions.length,
					interactions: interactions.length,
					animations: animation.length,
					open: sub,
					onOpen: setSub,
				} )
			),
			h( ViewSwitch, null )
		);

		// Default: the element, the layout, the query loop, the item, the effects (planned), and the advanced fields.
		const defaultPane = h(
			'div',
			{ className: 'snn-pane' },
			h(
				Group,
				{ title: __( 'Element', 'snn' ), tip: 'group.element' },
				h(
					Row,
					{ label: __( 'HTML tag', 'snn' ), changed: a.tagName !== tag, tip: 'tagName' },
					h( Select, {
						label: __( 'HTML tag', 'snn' ),
						value: a.tagName,
							tip: 'tagName',
						options: text ? TEXT_TAG_OPTIONS : TAG_OPTIONS,
						onChange: ( v ) => set( { tagName: v } ),
					} )
				)
			),
			h(
				Group,
				{ title: __( 'Layout', 'snn' ), tip: 'group.layout' },
				h( LayoutFields, { a, set, base, device, parent } )
			),
			// A Text block has no query loop: its panel leaves the group out.
			text
				? null
				: h(
					Group,
					{ title: __( 'Query loop', 'snn' ), tip: 'group.query' },
					h( SwitchRow, {
						label: __( 'Query loop', 'snn' ),
						tip: 'queryLoop',
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
							tip: q.enabled ? 'query' : 'queryOff',
						},
						h( QueryFields, { q, setQ } )
					)
				),
			h(
				Disclosure,
				{ title: __( 'Advanced', 'snn' ), tip: 'group.advanced' },
				h(
					Row,
					{ label: __( 'Classes', 'snn' ), tip: 'classes' },
					h( ClassesEditor, { value: a.cssClasses, onChange: ( v ) => set( { cssClasses: v } ) } )
				),
				h(
						Row,
						{ label: __( 'Attributes', 'snn' ), tip: 'attributes', changed: ( a.customAttributes || [] ).length > 0 },
						h( AttributesEditor, {
							value: Array.isArray( a.customAttributes ) ? a.customAttributes : [],
							onChange: ( v ) => set( { customAttributes: v } ),
						} )
					)
			)
		);

		// Style: one group at a time, chosen on the rail of icons (as Bricks does). The group's sections follow, one
		// under another. Every value is per view: a view shows the value it sets, or the one it inherits.
		const page = STYLE_PAGES.find( ( p ) => p.id === stylePage ) || STYLE_PAGES[ 0 ];
		const rowFor = ( row ) =>
			typeof row === 'string'
				? h( StyleRow, { key: row, a, set, device, k: row } )
				: h( BoxModel, { key: row.box, a, set, device, box: row } );
		const stylePane = h(
			'div',
			{ className: 'snn-pane snn-style' },
			h(
				'div',
				{ className: 'snn-rail' },
				h( Segmented, {
					label: __( 'Style groups', 'snn' ),
					value: page.id,
					options: STYLE_PAGES.map( ( p ) => ( {
							value: p.id,
							label: p.label,
							glyph: p.text ? h( 'span', { className: 'snn-glyph-text', 'aria-hidden': 'true' }, p.text ) : h( Glyph, { name: p.glyph } ),
							changed: groupChanged( a, p ), tip: 'style.' + p.id,
						} ) ),
					onChange: setStylePage,
				} )
			),
			h(
				'div',
				{ className: 'snn-page-head' },
				h( 'span', Object.assign( { className: 'snn-page-title' }, tipAttr( 'style.' + page.id ) ), page.label )
			),
			page.kind === 'css'
				? h( CssPane, { a, set, canCss: data.canCss, editor: data.cssEditor } )
				: page.sections.map( ( s ) => h( Group, { key: s.title, title: s.title, tip: s.tip }, s.rows.map( rowFor ) ) )
		);

		// Conditions or Interactions open: only that panel shows, under the two icons that open and close it.
		// The view and the tabs are hidden.
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
						h( 'div', { className: 'snn-name' }, SUB_TITLES[ sub ] ),
						h( HeadIcons, { conditions: conditions.length, interactions: interactions.length, animations: animation.length, open: sub, onOpen: setSub } )
					)
				),
				h(
					'div',
					{ className: 'snn-bt-sub-body' },
					sub === 'conditions'
						? h( ConditionsEditor, { sets: conditions, onChange: ( v ) => set( { conditions: v } ) } )
						: sub === 'animations'
							? h( AnimationsEditor, { value: animation, onChange: ( v ) => set( { animation: v } ) } )
							: h( InteractionsEditor, { items: interactions, onChange: ( v ) => set( { interactions: v } ) } )
				)
			);
		}

		return h(
			'div',
			{ className: 'snn-panel' },
			header,
			h( 'div', { className: 'snn-tabs', role: 'tablist' }, tabButton( 'default', __( 'Content', 'snn' ) ), tabButton( 'style', __( 'Style', 'snn' ) ) ),
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

	/** A CSS ID for a block: 'snn-' and eight lowercase letters or digits. */
	function newBlockId() {
		const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
		let id = 'snn-';
		for ( let i = 0; i < 8; i++ ) {
			id += chars.charAt( Math.floor( Math.random() * chars.length ) );
		}
		return id;
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
			gridAutoColumns: { type: 'string', default: LAYOUT_DEFAULTS.gridAutoColumns },
			gridAutoRows: { type: 'string', default: LAYOUT_DEFAULTS.gridAutoRows },
			gridAreas: { type: 'string', default: LAYOUT_DEFAULTS.gridAreas },
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
			columnStart: { type: 'string', default: ITEM_DEFAULTS.columnStart },
			rowStart: { type: 'string', default: ITEM_DEFAULTS.rowStart },
			gridArea: { type: 'string', default: ITEM_DEFAULTS.gridArea },
			order: { type: 'string', default: ITEM_DEFAULTS.order },
			backgroundColor: { type: 'string', default: '' },
			paddingTop: { type: 'string', default: '' },
			paddingBottom: { type: 'string', default: '' },
			maxWidth: { type: 'string', default: '' },
			opacity: { type: 'string', default: '' },
			overflow: { type: 'string', default: '' },
			responsive: { type: 'object', default: {} },
			conditions: { type: 'array', default: [] },
			interactions: { type: 'array', default: [] },
			animation: { type: 'array', default: [] },
			customCss: { type: 'string', default: '' },
			customAttributes: { type: 'array', default: [] },
			query: { type: 'object', default: QUERY_DEFAULTS },
		};
	}

	/** One block type. def: the block name, title, default tag, and text (true for a Text block: a rich text, no inner blocks). */
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
				// Core's Additional CSS (the Advanced panel textarea). Our Custom CSS is the CSS group of the Style tab.
				// The server switch (block-defaults.php) does not reach here: the editor takes these supports as they are.
				customCSS: false,
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
			attributes: withBlockLayout( def.text ? { ...layoutAttributes( def ), content: { type: 'string', default: '' } } : layoutAttributes( def ), def.name ),
			edit: function Edit( { attributes: saved, setAttributes, clientId } ) {
				// WordPress does not merge defaults into an object attribute, so a query saved
				// with some keys missing gets the missing ones here (as the PHP side does).
				const a = { ...saved, query: { ...QUERY_DEFAULTS, ...( saved.query || {} ) } };
				// The parent's display and direction: Align self's pictures turn with them.
				const parentId = useSelect( ( select ) => select( 'core/block-editor' ).getBlockRootClientId( clientId ), [ clientId ] );
				const parentAttrs = useSelect(
					( select ) => ( parentId ? select( 'core/block-editor' ).getBlockAttributes( parentId ) : null ),
					[ parentId ]
				);
				// Another block with the same CSS ID (a copied block): this one gets a new ID below.
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
				// Every block gets its CSS ID by default: a new one when it has none, and a new one when another
				// block already has this one. The ID is saved with the block, so the interactions can find it.
				useEffect( () => {
					if ( ! a.htmlId || duplicateId ) {
						setAttributes( { htmlId: newBlockId() } );
					}
				}, [ a.htmlId, duplicateId ] );
				// The view the editor shows (Desktop, Tablet or Mobile): the values of that view are drawn on the canvas.
				const device = useSelect( ( select ) => {
					try {
						return select( 'core/editor' ).getDeviceType() || 'Desktop';
					} catch ( e ) {
						return 'Desktop';
					}
				}, [] );
				// The parent as this view shows it: its display and direction for the device (Align self's pictures follow them).
				const parentShown = effectiveValues( parentAttrs || {}, device );
				const parent = {
					display: parentShown.display || '',
					flexDirection: parentShown.flexDirection || 'row',
				};
				// The item settings go on the wrapper (the grid or flex item); the layout goes on the list below.
				const parts = splitStyle( styleFor( effectiveValues( a, device ) ) );
				// The custom CSS as the front end prints it, scoped to this block: the class goes on the wrapper, the
				// rules in a style element inside it. Only for an administrator (the editor shows the CSS for canCss).
				const cssText = data.canCss ? cleanCss( a.customCss ) : '';
				const cssScoped = cssText ? cssScope( cssText ) : '';
				const cssRules = cssScoped ? h( 'style', null, cssText.split( '%root%' ).join( '.' + cssScoped ) ) : null;
				const blockProps = useBlockProps( {
					id: a.htmlId || undefined,
					className: [ 'wp-block-' + def.name.replace( '/', '-' ), a.cssClasses, cssScoped ].filter( Boolean ).join( ' ' ),
					style: parts.item,
					'data-animate': Array.isArray( a.animation ) && a.animation.length ? a.animation.join( ',' ) : undefined,
				} );
				// The layout (display, gaps, tracks) goes on the element that holds the children. WordPress
				// puts its own list element between the block wrapper and the children, so a style on the
				// wrapper would not reach them. The layout class names are off: our blocks do not use them.
				const innerProps = useInnerBlocksProps( { style: parts.layout }, { __unstableDisableLayoutClassNames: true } );
				const set = ( patch ) => setAttributes( patch );
				// A Text block: its text is a rich text, drawn in the element that takes the layout style (the item
				// settings stay on the wrapper). The query badge shows as it does for a layout block.
				if ( def.text ) {
					return h(
						Fragment,
						null,
						h( InspectorControls, null, h( Panel, { a, set, tag: def.tag, parent, title: def.title, device, base: layoutDefaults( def.name ), text: true } ) ),
						h(
							'div',
							blockProps,
							a.query.enabled
								? h( 'div', { className: 'snn-loop-badge', contentEditable: false }, badgeText( a.query ) )
								: null,
							cssRules,
							h( RichText, {
								tagName: a.tagName,
								value: a.content,
								onChange: ( v ) => set( { content: v } ),
								placeholder: __( 'Type text', 'snn' ),
								style: parts.layout,
								allowedFormats: textAllowedFormats(),
								// The render prop gives the rich text value while the block is selected: the five formats are
								// drawn in the block toolbar, after core's Bold, Italic and Link.
								children: ( { value, onChange } ) => h( Fragment, null,
									h( BlockFormatControls, null, h( ToolbarGroup, null, TEXT_BAR_FORMATS.map( ( f ) => h( ToolbarButton, {
										key: f.name,
										label: f.label,
										icon: f.icon,
										isPressed: !! getActiveFormat( value, f.name ),
										onClick: () => onChange( toggleFormat( value, { type: f.name } ) ),
									}, f.glyph ) ) ) ),
									h( TextInputRules, { value, onChange } )
								),
							} )
						)
					);
				}
				return h(
					Fragment,
					null,
					h( InspectorControls, null, h( Panel, { a, set, tag: def.tag, parent, title: def.title, device, base: layoutDefaults( def.name ) } ) ),
					h(
						'div',
						blockProps,
						a.query.enabled
							? h( 'div', { className: 'snn-loop-badge', contentEditable: false }, badgeText( a.query ) )
							: null,
						cssRules,
						h( 'div', innerProps )
					)
				);
			},
			// The saved markup keeps the inner blocks (a save of null would drop them). The front end
			// is rendered by PHP from those inner blocks (includes/block/layout-blocks.php).
			// A Text block has no inner blocks: it saves nothing, its text is an attribute, and PHP renders it.
			save: def.text
				? () => null
				: function Save() {
					return h( InnerBlocks.Content, null );
				},
		} );
	}

	// One block for each definition (blocks/<name>/block.php, in the order of FOLDERS in layout-blocks.php).
	defs.forEach( ( def ) => registerLayout( def ) );
} )( window.wp, window.snnControls, window.snnLayoutIcons );
