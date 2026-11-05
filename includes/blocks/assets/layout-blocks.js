/**
 * SNN layout blocks for the block editor: Section, Container and Div.
 *
 * The settings sit in the block's inspector, in compact rows (see controls.js):
 *   Query loop      a switch. Turned on, the Query section below it can open.
 *   Query           an accordion, disabled while the switch is off. Post type, order, per page,
 *                   offset, child of, sticky, include and exclude, authors, main query.
 *   Layout          HTML tag, display (block, flex, grid), flex direction, wrap, justify, align, gap.
 *   Advanced        CSS ID and CSS classes.
 *
 * Every text-like field has the dynamic data button and every size field can take a variable.
 * The editor shows each block once. On the front end a query loop repeats the block for every
 * post (rendered in includes/blocks/layout-blocks.php).
 */
( function ( wp, C ) {
	const { registerBlockType } = wp.blocks;
	const { InnerBlocks, InspectorControls, useBlockProps } = wp.blockEditor;
	const { createElement: h, Fragment, useState } = wp.element;
	const { __ } = wp.i18n;
	const data = window.snnControlsData || {};

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

	const TAG_OPTIONS = ( data.tags || [ 'section', 'div' ] ).map( ( t ) => ( { value: t, label: t } ) );
	const DISPLAY_OPTIONS = [
		{ value: 'block', label: __( 'Block', 'snn' ) },
		{ value: 'flex', label: __( 'Flex', 'snn' ) },
		{ value: 'grid', label: __( 'Grid', 'snn' ) },
	];
	const DIRECTION_OPTIONS = [
		{ value: 'row', label: __( 'Row', 'snn' ), icon: 'dashicons-arrow-right-alt' },
		{ value: 'row-reverse', label: __( 'Row reverse', 'snn' ), icon: 'dashicons-arrow-left-alt' },
		{ value: 'column', label: __( 'Column', 'snn' ), icon: 'dashicons-arrow-down-alt' },
		{ value: 'column-reverse', label: __( 'Column reverse', 'snn' ), icon: 'dashicons-arrow-up-alt' },
	];
	const JUSTIFY_OPTIONS = [
		{ value: '', label: __( 'Default', 'snn' ) },
		{ value: 'flex-start', label: __( 'Start', 'snn' ) },
		{ value: 'center', label: __( 'Center', 'snn' ) },
		{ value: 'flex-end', label: __( 'End', 'snn' ) },
		{ value: 'space-between', label: __( 'Space between', 'snn' ) },
		{ value: 'space-around', label: __( 'Space around', 'snn' ) },
		{ value: 'space-evenly', label: __( 'Space evenly', 'snn' ) },
	];
	const ALIGN_OPTIONS = [
		{ value: '', label: __( 'Default', 'snn' ) },
		{ value: 'stretch', label: __( 'Stretch', 'snn' ) },
		{ value: 'flex-start', label: __( 'Start', 'snn' ) },
		{ value: 'center', label: __( 'Center', 'snn' ) },
		{ value: 'flex-end', label: __( 'End', 'snn' ) },
		{ value: 'baseline', label: __( 'Baseline', 'snn' ) },
	];
	const ORDER_OPTIONS = [
		{ value: 'DESC', label: __( 'Descending', 'snn' ) },
		{ value: 'ASC', label: __( 'Ascending', 'snn' ) },
	];
	const POST_TYPE_OPTIONS = data.postTypes || [ { value: 'post', label: __( 'Post', 'snn' ) } ];
	const ORDER_BY_OPTIONS = data.orderBy || [ { value: 'date', label: __( 'Date', 'snn' ) } ];
	const VARIABLE_GROUPS = ( data.variables || [] ).filter( ( g ) => g.key === 'spacing' );

	const GAP_OK = /^(var\(--wp--preset--spacing--[a-z0-9-]+\)|-?(\d+|\d*\.\d+)(px|rem|em|%|vw|vh)|0)$/;

	/** The inline style, as the front end writes it (includes/blocks/layout-blocks.php). */
	function styleFor( a ) {
		if ( a.display !== 'flex' && a.display !== 'grid' ) {
			return undefined;
		}
		const css = {};
		if ( a.display === 'flex' ) {
			css.display = 'flex';
			css.flexDirection = a.flexDirection || 'row';
			css.flexWrap = a.flexWrap || 'nowrap';
			if ( a.justifyContent ) {
				css.justifyContent = a.justifyContent;
			}
			if ( a.alignItems ) {
				css.alignItems = a.alignItems;
			}
		} else {
			css.display = 'grid';
		}
		// A gap that still holds a tag is resolved on the front end only.
		if ( a.gap && GAP_OK.test( a.gap ) ) {
			css.gap = a.gap;
		}
		return css;
	}

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
				C.Row,
				{ label: __( 'Post type', 'snn' ), changed: q.postType !== 'post' },
				h( C.Select, {
					label: __( 'Post type', 'snn' ),
					value: q.postType,
					options: POST_TYPE_OPTIONS,
					onChange: ( v ) => setQ( { postType: v } ),
				} )
			),
			h(
				C.Row,
				{ label: __( 'Order by', 'snn' ), changed: q.orderBy !== 'date' },
				h( C.Select, {
					label: __( 'Order by', 'snn' ),
					value: q.orderBy,
					options: ORDER_BY_OPTIONS,
					onChange: ( v ) => setQ( { orderBy: v } ),
				} )
			),
			h(
				C.Row,
				{ label: __( 'Order', 'snn' ), changed: q.order !== 'DESC' },
				h( C.Select, {
					label: __( 'Order', 'snn' ),
					value: q.order,
					options: ORDER_OPTIONS,
					onChange: ( v ) => setQ( { order: v } ),
				} )
			),
			h(
				C.Row,
				{ label: __( 'Per page', 'snn' ), changed: q.perPage !== '10' },
				h( C.TextField, {
					label: __( 'Posts per page', 'snn' ),
					value: q.perPage,
					inputMode: 'numeric',
					onChange: ( v ) => setQ( { perPage: v } ),
				} )
			),
			h(
				C.Row,
				{ label: __( 'Offset', 'snn' ), changed: q.offset !== '0' },
				h( C.TextField, {
					label: __( 'Offset', 'snn' ),
					value: q.offset,
					inputMode: 'numeric',
					onChange: ( v ) => setQ( { offset: v } ),
				} )
			),
			h(
				C.Row,
				{ label: __( 'Child of', 'snn' ), changed: !! q.parent },
				h( C.TextField, {
					label: __( 'Child of', 'snn' ),
					value: q.parent,
					placeholder: __( 'Post ID', 'snn' ),
					onChange: ( v ) => setQ( { parent: v } ),
				} )
			),
			h( C.SwitchRow, {
				label: __( 'Ignore sticky', 'snn' ),
				checked: q.ignoreSticky,
				onChange: ( v ) => setQ( { ignoreSticky: v } ),
			} ),
			h(
				C.Row,
				{ label: __( 'Include', 'snn' ), changed: !! q.include },
				h( C.TextField, {
					label: __( 'Include posts', 'snn' ),
					value: q.include,
					placeholder: __( 'IDs', 'snn' ),
					onChange: ( v ) => setQ( { include: v } ),
				} )
			),
			h(
				C.Row,
				{ label: __( 'Exclude', 'snn' ), changed: !! q.exclude },
				h( C.TextField, {
					label: __( 'Exclude posts', 'snn' ),
					value: q.exclude,
					placeholder: __( 'IDs', 'snn' ),
					onChange: ( v ) => setQ( { exclude: v } ),
				} )
			),
			h(
				C.Row,
				{ label: __( 'Authors', 'snn' ), changed: !! q.includeAuthors },
				h( C.TextField, {
					label: __( 'Include authors', 'snn' ),
					value: q.includeAuthors,
					placeholder: __( 'User IDs', 'snn' ),
					onChange: ( v ) => setQ( { includeAuthors: v } ),
				} )
			),
			h(
				C.Row,
				{ label: __( 'Not authors', 'snn' ), changed: !! q.excludeAuthors },
				h( C.TextField, {
					label: __( 'Exclude authors', 'snn' ),
					value: q.excludeAuthors,
					placeholder: __( 'User IDs', 'snn' ),
					onChange: ( v ) => setQ( { excludeAuthors: v } ),
				} )
			),
			h( C.SwitchRow, {
				label: __( 'Main query', 'snn' ),
				checked: q.isMain,
				onChange: ( v ) => setQ( { isMain: v } ),
			} )
		);
	}

	function layoutChanged( a, tag ) {
		return a.tagName !== tag || a.display !== 'block' || !! a.gap;
	}

	function LayoutFields( { a, set, tag } ) {
		const flex = a.display === 'flex';
		const grid = a.display === 'grid';
		return h(
			Fragment,
			null,
			h(
				C.Row,
				{ label: __( 'HTML tag', 'snn' ), changed: a.tagName !== tag },
				h( C.Select, {
					label: __( 'HTML tag', 'snn' ),
					value: a.tagName,
					options: TAG_OPTIONS,
					onChange: ( v ) => set( { tagName: v } ),
				} )
			),
			h(
				C.Row,
				{ label: __( 'Display', 'snn' ), changed: a.display !== 'block' },
				h( C.Select, {
					label: __( 'Display', 'snn' ),
					value: a.display,
					options: DISPLAY_OPTIONS,
					onChange: ( v ) => set( { display: v } ),
				} )
			),
			flex
				? h(
						C.Row,
						{ label: __( 'Direction', 'snn' ), changed: a.flexDirection !== 'row' },
						h( C.Segmented, {
							label: __( 'Direction', 'snn' ),
							value: a.flexDirection,
							options: DIRECTION_OPTIONS,
							onChange: ( v ) => set( { flexDirection: v } ),
						} )
				  )
				: null,
			flex
				? h( C.SwitchRow, {
						label: __( 'Wrap', 'snn' ),
						checked: a.flexWrap === 'wrap',
						onChange: ( v ) => set( { flexWrap: v ? 'wrap' : 'nowrap' } ),
				  } )
				: null,
			flex
				? h(
						C.Row,
						{ label: __( 'Justify', 'snn' ), changed: !! a.justifyContent },
						h( C.Select, {
							label: __( 'Justify content', 'snn' ),
							value: a.justifyContent,
							options: JUSTIFY_OPTIONS,
							onChange: ( v ) => set( { justifyContent: v } ),
						} )
				  )
				: null,
			flex
				? h(
						C.Row,
						{ label: __( 'Align', 'snn' ), changed: !! a.alignItems },
						h( C.Select, {
							label: __( 'Align items', 'snn' ),
							value: a.alignItems,
							options: ALIGN_OPTIONS,
							onChange: ( v ) => set( { alignItems: v } ),
						} )
				  )
				: null,
			flex || grid
				? h(
						C.Row,
						{ label: __( 'Gap', 'snn' ), changed: !! a.gap },
						h( C.TextField, {
							label: __( 'Gap', 'snn' ),
							value: a.gap,
							placeholder: '0',
							variables: VARIABLE_GROUPS,
							onChange: ( v ) => set( { gap: v } ),
						} )
				  )
				: null
		);
	}

	function AdvancedFields( { a, set } ) {
		return h(
			Fragment,
			null,
			h(
				C.Row,
				{ label: __( 'CSS ID', 'snn' ), changed: !! a.htmlId },
				h( C.TextField, {
					label: __( 'CSS ID', 'snn' ),
					value: a.htmlId,
					placeholder: __( 'my-id', 'snn' ),
					onChange: ( v ) => set( { htmlId: v } ),
				} )
			),
			h(
				C.Row,
				{ label: __( 'CSS classes', 'snn' ), changed: !! a.cssClasses },
				h( C.TextField, {
					label: __( 'CSS classes', 'snn' ),
					value: a.cssClasses,
					placeholder: __( 'class-a class-b', 'snn' ),
					onChange: ( v ) => set( { cssClasses: v } ),
				} )
			)
		);
	}

	/** The inspector: switch, query accordion, layout and advanced sections. */
	function Panel( { a, set, tag } ) {
		const q = a.query;
		const [ openQuery, setOpenQuery ] = useState( false );
		const [ openLayout, setOpenLayout ] = useState( true );
		const [ openAdvanced, setOpenAdvanced ] = useState( false );
		const setQ = ( patch ) => set( { query: { ...q, ...patch } } );

		return h(
			'div',
			{ className: 'snn-panel' },
			h( C.SwitchRow, {
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
				C.Accordion,
				{
					title: __( 'Query', 'snn' ),
					open: openQuery,
					onToggle: setOpenQuery,
					disabled: ! q.enabled,
					changed: changedQuery( q ),
					hint: __( 'Turn on Query loop first.', 'snn' ),
				},
				h( QueryFields, { q, setQ } )
			),
			h(
				C.Accordion,
				{
					title: __( 'Layout', 'snn' ),
					open: openLayout,
					onToggle: setOpenLayout,
					changed: layoutChanged( a, tag ),
				},
				h( LayoutFields, { a, set, tag } )
			),
			h(
				C.Accordion,
				{
					title: __( 'Advanced', 'snn' ),
					open: openAdvanced,
					onToggle: setOpenAdvanced,
					changed: !! ( a.htmlId || a.cssClasses ),
				},
				h( AdvancedFields, { a, set } )
			)
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

	/** One block type. def: the block name, title, default tag and description. */
	function registerLayout( def ) {
		const attributes = {
			tagName: { type: 'string', default: def.tag },
			htmlId: { type: 'string', default: '' },
			cssClasses: { type: 'string', default: '' },
			display: { type: 'string', default: 'block' },
			flexDirection: { type: 'string', default: 'row' },
			flexWrap: { type: 'string', default: 'nowrap' },
			justifyContent: { type: 'string', default: '' },
			alignItems: { type: 'string', default: '' },
			gap: { type: 'string', default: '' },
			query: { type: 'object', default: QUERY_DEFAULTS },
		};

		registerBlockType( def.name, {
			apiVersion: 3,
			title: def.title,
			description: def.description,
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
			attributes,
			edit: function Edit( { attributes: saved, setAttributes } ) {
				// WordPress does not merge defaults into an object attribute, so a query saved
				// with some keys missing gets the missing ones here (as the PHP side does).
				const a = { ...saved, query: { ...QUERY_DEFAULTS, ...( saved.query || {} ) } };
				const blockProps = useBlockProps( {
					id: a.htmlId || undefined,
					className: [ 'wp-block-' + def.name.replace( '/', '-' ), a.cssClasses ].filter( Boolean ).join( ' ' ),
					style: styleFor( a ),
				} );
				const set = ( patch ) => setAttributes( patch );
				return h(
					Fragment,
					null,
					h( InspectorControls, null, h( Panel, { a, set, tag: def.tag } ) ),
					h(
						'div',
						blockProps,
						a.query.enabled
							? h( 'div', { className: 'snn-loop-badge', contentEditable: false }, badgeText( a.query ) )
							: null,
						h( InnerBlocks, null )
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
		description: __( 'A full-width band of the page, with its own layout and an optional query loop.', 'snn' ),
		tag: 'section',
		icon: 'editor-table',
	} );
	registerLayout( {
		name: 'snn/container',
		title: __( 'Container', 'snn' ),
		description: __( 'A wrapper for content, with its own layout and an optional query loop.', 'snn' ),
		tag: 'div',
		icon: 'editor-expand',
	} );
	registerLayout( {
		name: 'snn/div',
		title: __( 'Div', 'snn' ),
		description: __( 'An empty div with layout options. Display is block unless you change it.', 'snn' ),
		tag: 'div',
		icon: 'editor-code',
	} );
} )( window.wp, window.snnControls );
