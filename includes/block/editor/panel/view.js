/**
 * SNN block editor: the values per view (Desktop, Tablet, Mobile): the view switch, the value field with its tools.
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
	const { Row, SwitchRow, Accordion, Select, Segmented, TextField, Group, Disclosure, Dot, Switch, ViewRow, ownValue, inheritedValue, setValue, clearValue, effectiveValues, tipAttr, ToolbarPicker } = C;
	const { HeadIcons, ClassesEditor, AttributesEditor, ConditionsEditor, InteractionsEditor } = snn.blockTools;
	const { AnimationsPane, stateOf, canvasDataAnimate } = snn.animationPane;
	const { ColorPalette, MediaUpload, MediaUploadCheck } = wp.blockEditor;
	const { Button, ColorPicker, Fill, Popover, ToolbarButton } = wp.components;
	const { applyFormat, create, getActiveFormat, insert, insertObject, removeFormat, toggleFormat } = wp.richText;
	const data = snn.data.controls || {};
	const { VARIABLE_GROUPS, options } = snn.panel;

	/** The style settings: the background colour, with the colour variables first in its picker. */
	/** The three views of the header. The choice is the editor's own device, so the two move together. */
	// The widths of the Tablet and Mobile views (the Global Styles breakpoints, see data_script()).
	const BP = snn.data.breakpoints || { tablet: 991, mobile: 478 };
	const VIEWS = [
		{ value: 'Desktop', label: __( 'Desktop', 'snn' ), title: __( 'Desktop: base styles', 'snn' ) },
		{ value: 'Tablet', label: __( 'Tablet', 'snn' ), title: sprintf( __( 'Tablet: up to %d px', 'snn' ), BP.tablet ) },
		{ value: 'Mobile', label: __( 'Mobile', 'snn' ), title: sprintf( __( 'Mobile: up to %d px', 'snn' ), BP.mobile ) },
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

	/** The CSS property of a setting: from the table's property (composed rows name theirs here), or the style table's property for a Style row. '' when it is not one property. */
	const COMPOSED_CSS = { gridAutoFlow: 'grid-auto-flow', gridDense: 'grid-auto-flow', columnStart: 'grid-column', columnSpan: 'grid-column', rowStart: 'grid-row', rowSpan: 'grid-row' };
	function cssNameOf( k ) {
		if ( COMPOSED_CSS[ k ] ) {
			return COMPOSED_CSS[ k ];
		}
		const spec = ( snn.data.styleTable || [] ).find( ( row ) => row[ 0 ] === k );
		return spec && spec[ 1 ] ? spec[ 1 ] : '';
	}

	/**
	 * One value a view can set: its field, in a row with the Reset (see ViewRow in controls.js). The dot on the label
	 * shows that the view sets its own value. A value the view inherits shows as the field's placeholder; a switch or an
	 * icon row shows it as its state, as those have no placeholder. dflt is the setting's default (see viewOwn).
	 */
	function ViewValue( { a, set, device, k, label, unit, kind, options, placeholder, dflt = '', fallback, clearDefault, media, variables, inputMode, tip, pick, store } ) {
			// The tooltip key: the setting's own key, unless the row names another (the template is a grid column setting).
			const key = tip || k;
		const own = viewOwn( a, device, k, dflt );
		const value = own !== undefined ? own : inheritedValue( a, device, k ).value;
		const change = ( v ) => setValue( a, set, device, k, v );
		// clearDefault (the Style rows): on Desktop, choosing the CSS default stores nothing, so no dot shows and nothing is written.
		const choose = ( v ) => change( clearDefault && device === 'Desktop' && v === dflt ? '' : v );
		const groups = variables === undefined ? VARIABLE_GROUPS : variables;
		const empty = value === undefined || value === null || value === '';
		let control;
		if ( kind === 'select' ) {
			control = h( Select, { label, tip: key, value: empty ? fallback || options[ 0 ].value : String( value ), options, onChange: choose } );
		} else if ( kind === 'keywordlength' ) {
			control = h( KeywordLength, { label, tip: key, value, options, fallback: fallback || options[ 0 ].value, unit, onKeyword: choose, onLength: change } );
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
				media,
				inputMode,
				onChange: change,
			} );
		}
		return h( ViewRow, { label, device, tip: key, css: cssNameOf( k ), own: own !== undefined, onReset: () => clearValue( a, set, device, k ) }, control );
	}

	function KeywordLength( { value, options, fallback, unit, label, tip, onKeyword, onLength } ) {
		const [ custom, setCustom ] = useState( false );
		const current = value === undefined || value === null ? '' : String( value );
		const isLength = current !== '' && options.every( ( o ) => o.value !== current );
		const open = custom || isLength;
		const shown = open ? 'custom' : current || fallback;
		const choices = options.concat( [ { value: 'custom', label: __( 'Custom', 'snn' ) } ] );
		return h(
			'div',
			{ className: 'snn-keyword-length' },
			h( Select, {
				label,
				tip,
				value: shown,
				options: choices,
				onChange: ( v ) => {
					if ( v === 'custom' ) {
						setCustom( true );
						if ( current !== '' ) {
							onLength( '' );
						}
						return;
					}
					setCustom( false );
					onKeyword( v );
				},
			} ),
			open
				? h( TextField, {
						label: label + ' ' + __( 'length', 'snn' ),
						value: isLength ? current : '',
						placeholder: '50% auto',
						unit,
						onChange: onLength,
				  } )
				: null
		);
	}

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

	/** The views a value can be set on: the rail's dot counts all of them, not only the view on show. */
	const ALL_VIEWS = [ 'Desktop', 'Tablet', 'Mobile' ];


	Object.assign( snn.panel, { ViewSwitch, viewOwn, ViewValue, setHere, setMany, ALL_VIEWS } );
} )( window.wp );
