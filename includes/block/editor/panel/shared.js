/**
 * SNN block editor: the panel shared by every block: the defaults, the option lists and the helpers of the values. Loaded first of the panel.
 *
 * Part of the editor split of the old layout-blocks.js (see the change notes).
 */
( function ( wp ) {
	const C = snn.controls;
	const I = snn.layoutIcons;
	const { createElement: h } = wp.element;
	const { __ } = wp.i18n;
	const { create } = wp.richText;
	const data = snn.data.controls || {};
	snn.panel = snn.panel || {};

	/** The block definitions from PHP (blocks/<name>/block.php, see SNN_Blocks), set before this script runs. */
	const defs = snn.data.definitions || [];

	// The query defaults are PHP's (SNN_Query_Loop::defaults(), the registered default of every block's query); the list
	// below is only the fallback for a page without definitions.
	const QUERY_FALLBACK = {
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
	const phpQuery = defs[ 0 ] && defs[ 0 ].attributes && defs[ 0 ].attributes.query ? defs[ 0 ].attributes.query.default : null;
	const QUERY_DEFAULTS = { ...QUERY_FALLBACK, ...( phpQuery && typeof phpQuery === 'object' ? phpQuery : {} ) };

	/** The defaults of one block's attributes: the values PHP registers (the definition's attributes, snn.data.definitions). */
	function attrDefaults( name ) {
		const def = defs.find( ( d ) => d.name === name ) || {};
		return Object.fromEntries( Object.entries( def.attributes || {} ).map( ( [ k, spec ] ) => [ k, spec.default ] ) );
	}

	/** The layout defaults of one block (its display and direction, what the Layout rows compare with). */
	function layoutDefaults( name ) {
		return attrDefaults( name );
	}

	const POST_TYPE_OPTIONS = data.postTypes || [ { value: 'post', label: __( 'Post', 'snn' ) } ];

	const ORDER_BY_OPTIONS = data.orderBy || [ { value: 'date', label: __( 'Date', 'snn' ) } ];

	const ORDER_OPTIONS = [
		{ value: 'DESC', label: __( 'Descending', 'snn' ) },
		{ value: 'ASC', label: __( 'Ascending', 'snn' ) },
	];

	// All the variable groups: colours and sizes. Each group has a kind, which the picker uses (controls.js).
	const VARIABLE_GROUPS = data.variables || [];

	const COLOR_OK = /^(#([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})|(rgba?|hsla?)\([0-9a-z.,%\s\/+-]{1,60}\)|var\(--[a-z][a-z0-9-]*\)|transparent)$/i;

	/** Options from [value, label] pairs, each with its picture (layout-icons.js). */
	function options( pairs, glyph ) {
		return pairs.map( ( [ value, label ] ) => ( { value, label, glyph: glyph( value ) } ) );
	}

	/** The pairs whose value has a picture in the version 12 mock, in the order of the pairs. */
	function picked( pairs, keys ) {
		return pairs.filter( ( [ value ] ) => keys.indexOf( value ) !== -1 );
	}

	const str = ( v ) => ( v === undefined || v === null ? '' : String( v ) );

	/**
	 * True when the front end has a view rule for this device: Tablet with its own values, Mobile with its own or
	 * Tablet's (the Tablet rule reaches Mobile widths too). Mirrors the empty() check in view_rules() in engine/style.php.
	 */
	function hasViewRule( a, device ) {
		const layers = device === 'Mobile' ? [ 'tablet', 'mobile' ] : device === 'Tablet' ? [ 'tablet' ] : [];
		return layers.some( ( v ) => {
			const own = a.responsive && a.responsive[ v ];
			return !! own && Object.keys( own ).some( ( k ) => own[ k ] !== undefined && own[ k ] !== '' );
		} );
	}

	/** The ID as the front end writes it: letters, digits, hyphen and underscore. Mirrors element() in engine/render.php. */
	function cleanId( v ) {
		return String( v || '' ).replace( /[^A-Za-z0-9_-]/g, '' );
	}

	/** The custom classes as the front end writes them: each name through sanitize_html_class (octets and other characters dropped). */
	function cleanClasses( v ) {
		return String( v || '' ).trim().split( /\s+/ )
			.map( ( c ) => c.replace( /%[a-fA-F0-9][a-fA-F0-9]/g, '' ).replace( /[^A-Za-z0-9_-]/g, '' ) )
			.filter( Boolean )
			.join( ' ' );
	}



	Object.assign( snn.panel, { QUERY_DEFAULTS, defs, layoutDefaults, POST_TYPE_OPTIONS, ORDER_BY_OPTIONS, ORDER_OPTIONS, VARIABLE_GROUPS, options, picked, str, hasViewRule, cleanId, cleanClasses } );
} )( window.wp );
