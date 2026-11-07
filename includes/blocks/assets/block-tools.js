/**
 * SNN block tools for the block editor: the parts of the panel header and of its sub-panels.
 *
 *   HeadIcons           the Conditions and Interactions buttons, and the GSAP animations button when the GSAP
 *                       setting is on: top right of the panel, in that order
 *   ClassesEditor       the custom classes: one text area, names separated by spaces, as in an HTML class attribute
 *   AttributesEditor    the custom attributes: name and value rows, names checked the way the server checks them
 *   (the sub-panels open in place of the tabs: layout-blocks.js shows only the open panel)
 *   ConditionsEditor    sets of conditions: the sets are alternatives (Or), the rows in a set all hold (And)
 *   InteractionsEditor  when a trigger happens, do an action on this element or on the one with an ID
 *                       (Start animation plays a normal animation: fade in, slide, zoom...)
 *   AnimationsEditor    the GSAP animations of the block: one picker, several can be stacked
 *
 * Loaded before layout-blocks.js (see includes/blocks/layout-blocks.php), which uses these parts in its panel.
 * The catalogs (conditions, triggers, actions) come from block-tools.php through snnBlockToolsData.
 * Exposes window.snnBlockTools. Uses wp.element only, so it runs on the editor's own React.
 */
( function ( wp, C ) {
	const { createElement: h, Fragment, useState, useRef, useLayoutEffect } = wp.element;
	const { __ } = wp.i18n;
	const { Row, Select, TextField, AnimationPicker } = C;
	const data = window.snnBlockToolsData || {};
	const CATALOG = data.conditions || [];
	const GROUPS = data.groups || {};
	const CLASS_ACTIONS = data.classActions || [];

	/* ------------------------------------------------------------------
	 * Helpers
	 * ---------------------------------------------------------------- */

	/** A CSS ID: letters, digits, hyphen and underscore only. */
	function sanitizeId( v ) {
		return String( v || '' ).replace( /[^A-Za-z0-9_-]/g, '' );
	}

	/** Class names as typed: letters, digits, hyphen and underscore. A space or a line break separates names. */
	function cleanClassText( v ) {
		return String( v || '' ).replace( /[^A-Za-z0-9_\-\s]/g, '' ).replace( /\s/g, ' ' );
	}

	/** On leaving the classes field: the names in order, one space apart, each name once. */
	function tidyClassText( v ) {
		const names = [];
		cleanClassText( v )
			.split( ' ' )
			.forEach( ( n ) => {
				if ( n && names.indexOf( n ) === -1 ) {
					names.push( n );
				}
			} );
		return names.join( ' ' );
	}

	/** Class names typed in one field: spaces between names are kept. */
	function sanitizeClassList( v ) {
		return String( v || '' ).replace( /[^A-Za-z0-9_\- ]/g, '' );
	}

	/* ------------------------------------------------------------------
	 * Glyphs: 16 px line icons, drawn in the panel's colour
	 * ---------------------------------------------------------------- */

	function glyph( name ) {
		const parts = {
			conditions: [
				h( 'path', { key: 'a', d: 'M8 2.5 13.5 5.2 8 7.9 2.5 5.2Z' } ),
				h( 'path', { key: 'b', d: 'M2.5 8.2 8 10.9l5.5-2.7' } ),
				h( 'path', { key: 'c', d: 'M2.5 11.1 8 13.8l5.5-2.7' } ),
			],
			interactions: [ h( 'path', { key: 'a', d: 'M4.5 2.5v9.9l2.5-2.3 1.8 3.7 1.7-.8-1.8-3.6h3.4z' } ) ],
			// Two sparkles: the GSAP animations
			animations: [
				h( 'path', { key: 'a', d: 'M6 2.5Q6.6 5.6 9.5 6.25Q6.6 6.9 6 10Q5.4 6.9 2.5 6.25Q5.4 5.6 6 2.5Z' } ),
				h( 'path', { key: 'b', d: 'M12 9.2Q12.2 10.8 13.8 11Q12.2 11.2 12 12.8Q11.8 11.2 10.2 11Q11.8 10.8 12 9.2Z' } ),
			],
			back: [ h( 'path', { key: 'a', d: 'M10 3.5 5.5 8l4.5 4.5' } ) ],
			close: [ h( 'path', { key: 'a', d: 'M4 4l8 8M12 4l-8 8' } ) ],
		};
		return h( 'svg', { className: 'snn-bt-icon', viewBox: '0 0 16 16', 'aria-hidden': 'true', focusable: 'false' }, ...( parts[ name ] || [] ) );
	}

	function RemoveButton( { label, onClick } ) {
		return h( 'button', { type: 'button', className: 'snn-bt-x', title: label, 'aria-label': label, onClick }, glyph( 'close' ) );
	}

	/* ------------------------------------------------------------------
	 * Header
	 * ---------------------------------------------------------------- */

	/**
	 * The Conditions and Interactions buttons, and the GSAP animations button when the GSAP setting is on.
	 * open: the sub-panel shown (or null). A dot marks a block that uses them.
	 */
	function HeadIcons( { conditions, interactions, animations, open, onOpen } ) {
		const items = [
			{ key: 'conditions', label: __( 'Conditions', 'snn' ), used: conditions > 0, name: 'conditions' },
			{ key: 'interactions', label: __( 'Interactions', 'snn' ), used: interactions > 0, name: 'interactions' },
			...( data.gsap ? [ { key: 'animations', label: __( 'GSAP animations', 'snn' ), used: animations > 0, name: 'animations' } ] : [] ),
		];
		return h(
			'div',
			{ className: 'snn-bt-head-icons', role: 'group', 'aria-label': __( 'Element settings', 'snn' ) },
			items.map( ( it ) =>
				h(
					'button',
					{
						key: it.key,
						type: 'button',
						className: 'snn-bt-head-btn' + ( open === it.key ? ' is-on' : '' ) + ( it.used ? ' is-used' : '' ),
						title: it.label,
						'aria-label': it.label,
						'aria-pressed': open === it.key ? 'true' : 'false',
						onClick: () => onOpen( open === it.key ? null : it.key ),
					},
					glyph( it.name ),
					it.used ? h( 'span', { className: 'snn-bt-head-dot', 'aria-hidden': 'true' } ) : null
				)
			)
		);
	}

	/** Fit a text area's height to its text. The height is reset first, so the field can also shrink. */
	function fitHeight( node ) {
		if ( ! node ) {
			return;
		}
		node.style.height = 'auto';
		node.style.height = node.scrollHeight + ( node.offsetHeight - node.clientHeight ) + 'px';
	}

	/** The custom classes: one text area, the names separated by spaces, as in an HTML class attribute. It grows with its text. */
	function ClassesEditor( { value, onChange } ) {
		const area = useRef( null );
		const text = String( value || '' );
		// Fit on every change of the text, and again whenever the field's size changes (a closed panel has height 0).
		useLayoutEffect( () => fitHeight( area.current ), [ text ] );
		useLayoutEffect( () => {
			const node = area.current;
			if ( ! node || typeof ResizeObserver === 'undefined' ) {
				return undefined;
			}
			const observer = new ResizeObserver( () => fitHeight( node ) );
			observer.observe( node );
			return () => observer.disconnect();
		}, [] );
		return h( 'textarea', {
			ref: area,
			className: 'snn-input snn-bt-class-text',
			rows: 1,
			value: text,
			placeholder: __( 'Add classes', 'snn' ),
			spellCheck: false,
			'aria-label': __( 'Classes', 'snn' ),
			onChange: ( e ) => onChange( cleanClassText( e.target.value ) ),
			onBlur: ( e ) => {
				const next = tidyClassText( e.target.value );
				if ( next !== text ) {
					onChange( next );
				}
			},
		} );
	}

	/* ------------------------------------------------------------------
	 * Custom attributes
	 * ---------------------------------------------------------------- */

	/** The rule the PHP side applies (SNN_Layout_Blocks::clean_attributes): a plain name, or data- or aria-. */
	const ATTR_NAME = /^(data-|aria-)?[a-z][a-z0-9_-]{0,58}$/;

	function attrNameAllowed( n ) {
		return ATTR_NAME.test( n ) && n.indexOf( 'on' ) !== 0 && [ 'class', 'id', 'style' ].indexOf( n ) === -1;
	}

	/** Name and value rows. A name that the server would drop is marked, and is not written. */
	function AttributesEditor( { value, onChange } ) {
		const rows = Array.isArray( value ) ? value : [];
		const setAt = ( i, patch ) => onChange( rows.map( ( r, j ) => ( j === i ? { ...r, ...patch } : r ) ) );
		const removeAt = ( i ) => onChange( rows.filter( ( r, j ) => j !== i ) );
		const add = () => onChange( rows.concat( [ { name: '', value: '' } ] ) );
		return h(
			'div',
			{ className: 'snn-bt-attrs' },
			rows.map( ( r, i ) => {
				const name = String( r.name || '' );
				const bad = name !== '' && ! attrNameAllowed( name );
				return h(
					'div',
					{ key: i, className: 'snn-bt-attr' + ( bad ? ' is-bad' : '' ) },
					h(
						'div',
						{ className: 'snn-bt-attr-top' },
						h( 'input', {
							type: 'text',
							className: 'snn-input',
							value: name,
							placeholder: __( 'Name', 'snn' ),
							spellCheck: false,
							'aria-label': __( 'Attribute name', 'snn' ),
							title: bad ? __( 'Use data-, aria- or a plain name. Names that start with on, and class, id and style, are not allowed.', 'snn' ) : '',
							onChange: ( e ) => setAt( i, { name: e.target.value.toLowerCase().replace( /[^a-z0-9_-]/g, '' ) } ),
						} ),
						h( RemoveButton, { label: __( 'Remove attribute', 'snn' ), onClick: () => removeAt( i ) } )
					),
					h( 'input', {
						type: 'text',
						className: 'snn-input',
						value: r.value || '',
						placeholder: __( 'Value', 'snn' ),
						spellCheck: false,
						'aria-label': __( 'Attribute value', 'snn' ),
						onChange: ( e ) => setAt( i, { value: e.target.value } ),
					} )
				);
			} ),
			rows.length < 20
				? h( 'button', { type: 'button', className: 'snn-bt-link', onClick: add }, __( 'Add attribute', 'snn' ) )
				: null
		);
	}

	/* ------------------------------------------------------------------
	 * Conditions
	 * ---------------------------------------------------------------- */

	/** The first choice of a condition: its first operator and its first option (or nothing for free text). */
	function freshCondition( def ) {
		return {
			key: def.key,
			compare: def.compare.length ? def.compare[ 0 ].value : '==',
			value: def.options && def.options.length ? def.options[ 0 ].value : '',
		};
	}

	function findCondition( key ) {
		return CATALOG.find( ( c ) => c.key === key ) || CATALOG[ 0 ];
	}

	/** The value field of a condition, by its kind: a date, a choice, or free text with the dynamic data button. */
	function valueField( def, c, onPatch ) {
		if ( def.value === 'date' ) {
			return h( 'input', {
				type: 'date',
				className: 'snn-input',
				value: c.value || '',
				'aria-label': def.label,
				onChange: ( e ) => onPatch( { value: e.target.value } ),
			} );
		}
		if ( def.options && def.options.length ) {
			return h( Select, {
				value: c.value,
				options: def.options,
				label: def.label,
				onChange: ( v ) => onPatch( { value: v } ),
			} );
		}
		return h( TextField, {
			label: def.label,
			value: c.value || '',
			placeholder: __( 'value', 'snn' ),
			onChange: ( v ) => onPatch( { value: v } ),
		} );
	}

	/** One condition: its key on the first line; its dynamic data (if it has one), then operator and value. */
	function ConditionRow( { c, onKey, onPatch, onRemove } ) {
		const def = findCondition( c.key );
		return h(
			'div',
			{ className: 'snn-bt-cond' },
			h(
				'div',
				{ className: 'snn-bt-cond-line' },
				h(
					'select',
					{
						className: 'snn-select',
						value: def.key,
						'aria-label': __( 'Condition', 'snn' ),
						onChange: ( e ) => onKey( e.target.value ),
					},
					Object.keys( GROUPS ).map( ( g ) => {
						const items = CATALOG.filter( ( x ) => x.group === g );
						return items.length
							? h(
									'optgroup',
									{ key: g, label: GROUPS[ g ] },
									items.map( ( x ) => h( 'option', { key: x.key, value: x.key }, x.label ) )
							  )
							: null;
					} )
				),
				h( RemoveButton, { label: __( 'Remove condition', 'snn' ), onClick: onRemove } )
			),
			def.left
				? h(
						'div',
						{ className: 'snn-bt-cond-line' },
						h( TextField, {
							label: __( 'Dynamic data', 'snn' ),
							value: c.dynamic || '',
							placeholder: '{post_title}',
							onChange: ( v ) => onPatch( { dynamic: v } ),
						} )
				  )
				: null,
			h(
				'div',
				{ className: 'snn-bt-cond-line' },
				h(
					'div',
					{ className: 'snn-bt-cond-compare' },
					h( Select, {
						value: c.compare,
						options: def.compare,
						label: __( 'Compare', 'snn' ),
						onChange: ( v ) => onPatch( { compare: v } ),
					} )
				),
				h( 'div', { className: 'snn-bt-cond-value' }, valueField( def, c, onPatch ) )
			)
		);
	}

	/**
	 * The sets of conditions. A set holds when all its rows hold (And); the block shows when any set holds
	 * (Or). With no set, the block always shows, and the hint says so.
	 */
	function ConditionsEditor( { sets, onChange } ) {
		const list = Array.isArray( sets ) ? sets : [];
		const replaceAt = ( si, ci, next ) => onChange( list.map( ( set, i ) => ( i !== si ? set : set.map( ( c, j ) => ( j !== ci ? c : next ) ) ) ) );
		const patchAt = ( si, ci, change ) => replaceAt( si, ci, { ...list[ si ][ ci ], ...change } );
		const removeAt = ( si, ci ) =>
			onChange(
				list
					.map( ( set, i ) => ( i !== si ? set : set.filter( ( _, j ) => j !== ci ) ) )
					.filter( ( set ) => set.length > 0 )
			);
		const addTo = ( si ) => onChange( list.map( ( set, i ) => ( i === si ? [ ...set, freshCondition( findCondition( 'user_logged_in' ) ) ] : set ) ) );
		const addOrGroup = () => onChange( [ ...list, [ freshCondition( findCondition( 'user_logged_in' ) ) ] ] );
		const start = () => onChange( [ [ freshCondition( findCondition( 'user_logged_in' ) ) ] ] );

		const body = [];
		list.forEach( ( set, si ) => {
			if ( si > 0 ) {
				body.push( h( 'div', { key: 'or' + si, className: 'snn-bt-join' }, __( 'Or', 'snn' ) ) );
			}
			body.push(
				h(
					'div',
					{ key: 'set' + si, className: 'snn-bt-set' },
					set.map( ( c, ci ) =>
						h(
							Fragment,
							{ key: 'c' + ci },
							ci > 0 ? h( 'div', { className: 'snn-bt-join' }, __( 'And', 'snn' ) ) : null,
							h( ConditionRow, {
								c,
								onKey: ( key ) => replaceAt( si, ci, freshCondition( findCondition( key ) ) ),
								onPatch: ( change ) => patchAt( si, ci, change ),
								onRemove: () => removeAt( si, ci ),
							} )
						)
					),
					h( 'button', { type: 'button', className: 'snn-bt-link', onClick: () => addTo( si ) }, __( 'Add condition', 'snn' ) )
				)
			);
		} );

		return h(
			'div',
			{ className: 'snn-bt-conds' },
			list.length
				? body
				: h( 'p', { className: 'snn-hint' }, __( 'Shown always. Add a condition to show this element only when it holds.', 'snn' ) ),
			h(
				'div',
				{ className: 'snn-bt-conds-end' },
				list.length
					? h( 'button', { type: 'button', className: 'snn-bt-link', onClick: addOrGroup }, __( 'Add Or group', 'snn' ) )
					: h( 'button', { type: 'button', className: 'snn-bt-link', onClick: start }, __( 'Add condition', 'snn' ) )
			)
		);
	}

	/* ------------------------------------------------------------------
	 * Interactions
	 * ---------------------------------------------------------------- */

	/**
	 * The interactions. Each one: when (the trigger), do (the action), on (this element, or the element with
	 * the ID typed), and the class names for the class actions.
	 */
	function InteractionsEditor( { items, onChange } ) {
		const list = Array.isArray( items ) ? items : [];
		const triggers = data.triggers || [];
		const actions = data.actions || [];
		const animationTypes = data.animationTypes || [];
		const msDefault = ( data.animationMs && data.animationMs.default ) || 1000;
		const setAt = ( i, change ) => onChange( list.map( ( it, j ) => ( j === i ? { ...it, ...change } : it ) ) );
		const removeAt = ( i ) => onChange( list.filter( ( _, j ) => j !== i ) );
		// Changing the action: a class action keeps the class names, anything else starts empty. Start animation
		// also sets the trigger to the viewport and the default times.
		const changeAction = ( i, v ) => {
			const prev = list[ i ] || {};
			const keep = CLASS_ACTIONS.indexOf( v ) !== -1 && CLASS_ACTIONS.indexOf( prev.action ) !== -1;
			const change = { action: v, value: keep ? prev.value : '' };
			if ( v === 'startAnimation' ) {
				change.trigger = 'enterView';
				change.duration = prev.duration !== undefined ? prev.duration : msDefault;
				change.delay = prev.delay !== undefined ? prev.delay : 0;
			}
			setAt( i, change );
		};
		const add = () => onChange( [ ...list, { trigger: 'click', action: 'hide', target: 'self', value: '' } ] );

		return h(
			'div',
			{ className: 'snn-bt-acts' },
			list.length === 0
				? h( 'p', { className: 'snn-hint' }, __( 'Nothing happens yet. When a trigger happens, do an action.', 'snn' ) )
				: null,
			list.map( ( it, i ) => {
				const isClass = CLASS_ACTIONS.indexOf( it.action ) !== -1;
				const custom = it.target !== 'self';
				return h(
					'div',
					{ key: i, className: 'snn-bt-card' },
					h(
						'div',
						{ className: 'snn-bt-card-head' },
						h( 'span', null, __( 'Interaction', 'snn' ) + ' ' + ( i + 1 ) ),
						h( RemoveButton, { label: __( 'Remove interaction', 'snn' ), onClick: () => removeAt( i ) } )
					),
					h( Row, { label: __( 'When', 'snn' ) }, h( Select, { value: it.trigger, options: triggers, label: __( 'Trigger', 'snn' ), onChange: ( v ) => setAt( i, { trigger: v } ) } ) ),
					h( Row, { label: __( 'Do', 'snn' ) }, h( Select, { value: it.action, options: actions, label: __( 'Action', 'snn' ), onChange: ( v ) => changeAction( i, v ) } ) ),
					h(
						Row,
						{ label: __( 'On', 'snn' ) },
						h( Select, {
							value: custom ? 'custom' : 'self',
							options: [
								{ value: 'self', label: __( 'This element', 'snn' ) },
								{ value: 'custom', label: __( 'Element with ID', 'snn' ) },
							],
							label: __( 'Target', 'snn' ),
							onChange: ( v ) => setAt( i, { target: v === 'self' ? 'self' : '' } ),
						} )
					),
					custom
						? h(
								Row,
								{ label: __( 'ID', 'snn' ) },
								h(
									'div',
									{ className: 'snn-bt-idwrap' },
									h( 'span', { className: 'snn-bt-hash', 'aria-hidden': 'true' }, '#' ),
									h( 'input', {
										type: 'text',
										className: 'snn-input',
										value: it.target === 'self' ? '' : it.target || '',
										placeholder: __( 'my-id', 'snn' ),
										spellCheck: false,
										'aria-label': __( 'Target ID', 'snn' ),
										onChange: ( e ) => setAt( i, { target: sanitizeId( e.target.value ) } ),
									} )
								)
						  )
						: null,
					it.action === 'startAnimation'
						? h(
							Fragment,
							{ key: 'anim' },
							h(
								Row,
								{ label: __( 'Animation', 'snn' ) },
								h( Select, {
									value: it.value || '',
									options: [ { value: '', label: __( 'Choose', 'snn' ) } ].concat( animationTypes ),
									label: __( 'Animation', 'snn' ),
									onChange: ( v ) => setAt( i, { value: v } ),
								} )
							),
							h(
								Row,
								{ label: __( 'Duration', 'snn' ) },
								h( MsField, {
									value: it.duration,
									placeholder: String( msDefault ),
									label: __( 'Duration', 'snn' ),
									onChange: ( v ) => setAt( i, { duration: v } ),
								} )
							),
							h(
								Row,
								{ label: __( 'Delay', 'snn' ) },
								h( MsField, {
									value: it.delay,
									placeholder: '0',
									label: __( 'Delay', 'snn' ),
									onChange: ( v ) => setAt( i, { delay: v } ),
								} )
							)
						)
						: null,
					isClass
						? h(
								Row,
								{ label: __( 'Class', 'snn' ) },
								h( 'input', {
									type: 'text',
									className: 'snn-input',
									value: it.value || '',
									placeholder: __( 'class-name', 'snn' ),
									spellCheck: false,
									'aria-label': __( 'Class', 'snn' ),
									onChange: ( e ) => setAt( i, { value: sanitizeClassList( e.target.value ) } ),
								} )
						  )
						: null
				);
			} ),
			h( 'button', { type: 'button', className: 'snn-bt-link', onClick: add }, __( 'Add interaction', 'snn' ) )
		);
	}

	/** A time in milliseconds: a number field with the unit after it. Empty means the default (the placeholder). */
	function MsField( { value, placeholder, label, onChange } ) {
		return h(
			'div',
			{ className: 'snn-bt-idwrap' },
			h( 'input', {
				type: 'number',
				className: 'snn-input',
				min: 0,
				max: data.animationMs && data.animationMs.max ? data.animationMs.max : 10000,
				step: 50,
				value: value === undefined || value === null ? '' : value,
				placeholder,
				'aria-label': label,
				onChange: ( e ) => onChange( e.target.value ),
			} ),
			h( 'span', { className: 'snn-bt-unit' }, 'ms' )
		);
	}

	/**
	 * The GSAP animations of the block (the Animations icon). One picker: the animations stack, each plays in
	 * its turn with its modifiers (the data-animate values, see animation-presets.php).
	 */
	function AnimationsEditor( { value, onChange } ) {
		const list = Array.isArray( value ) ? value : [];
		return h(
			'div',
			{ className: 'snn-bt-anim' },
			h(
				Row,
				{ label: __( 'Animation', 'snn' ), changed: list.length > 0 },
				h( AnimationPicker, { value: list, multiple: true, onChange } )
			),
			h( 'p', { className: 'snn-hint' }, __( 'GSAP animations play on the front end. Add more than one to stack them.', 'snn' ) )
		);
	}

	window.snnBlockTools = {
		AnimationsEditor,
		HeadIcons,
		ClassesEditor,
		AttributesEditor,
		ConditionsEditor,
		InteractionsEditor,
		sanitizeId,
	};
} )( window.wp, window.snnControls );
