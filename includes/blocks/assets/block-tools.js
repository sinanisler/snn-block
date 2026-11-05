/**
 * SNN block tools for the block editor: the parts of the panel header and of its sub-panels.
 *
 *   HeadIcons           the Conditions and Interactions buttons, top right of the panel
 *   IdBar               the CSS ID (the field is the rename), the classes button, copy ID, copy styles and paste styles
 *   ClassesEditor       the custom classes, as chips, added with Enter
 *   (the sub-panels open in place of the tabs: layout-blocks.js shows only the open panel)
 *   ConditionsEditor    sets of conditions: the sets are alternatives (Or), the rows in a set all hold (And)
 *   InteractionsEditor  when a trigger happens, do an action on this element or on the one with an ID
 *
 * Loaded before layout-blocks.js (see includes/blocks/layout-blocks.php), which uses these parts in its panel.
 * The catalogs (conditions, triggers, actions) come from block-tools.php through snnBlockToolsData.
 * Exposes window.snnBlockTools. Uses wp.element only, so it runs on the editor's own React.
 */
( function ( wp, C ) {
	const { createElement: h, Fragment, useState, useRef } = wp.element;
	const { __ } = wp.i18n;
	const { Row, Select, TextField } = C;
	const data = window.snnBlockToolsData || {};
	const CATALOG = data.conditions || [];
	const GROUPS = data.groups || {};
	const CLASS_ACTIONS = data.classActions || [];
	const CLIP_KEY = 'snn.copiedStyles';

	/* ------------------------------------------------------------------
	 * Helpers
	 * ---------------------------------------------------------------- */

	/** A CSS ID: letters, digits, hyphen and underscore only. */
	function sanitizeId( v ) {
		return String( v || '' ).replace( /[^A-Za-z0-9_-]/g, '' );
	}

	/** One CSS class name, cleaned the same way. */
	function sanitizeClass( v ) {
		return String( v || '' ).replace( /[^A-Za-z0-9_-]/g, '' );
	}

	/** Class names typed in one field: spaces between names are kept. */
	function sanitizeClassList( v ) {
		return String( v || '' ).replace( /[^A-Za-z0-9_\- ]/g, '' );
	}

	/** The values of the given keys that the source holds. Used for copying and pasting styles. */
	function styleValues( source, keys ) {
		const out = {};
		keys.forEach( ( k ) => {
			if ( source && source[ k ] !== undefined ) {
				out[ k ] = source[ k ];
			}
		} );
		return out;
	}

	/** The copied styles, or null. Kept in the browser (a per-user convenience), so a failure is harmless. */
	function readClip() {
		try {
			const raw = window.localStorage.getItem( CLIP_KEY );
			const value = raw ? JSON.parse( raw ) : null;
			return value && value.styles && typeof value.styles === 'object' ? value : null;
		} catch ( e ) {
			return null;
		}
	}

	function writeClip( styles ) {
		try {
			window.localStorage.setItem( CLIP_KEY, JSON.stringify( { source: 'snn', styles } ) );
		} catch ( e ) {
			// Storage is off: the styles cannot be pasted later. The panel still works.
		}
	}

	/** Copies text. The clipboard API needs a secure page, so a hidden text area is the fallback. */
	function copyText( text ) {
		try {
			if ( window.isSecureContext && navigator.clipboard ) {
				navigator.clipboard.writeText( text ).catch( () => legacyCopy( text ) );
				return;
			}
		} catch ( e ) {
			// Fall through to the text area.
		}
		legacyCopy( text );
	}

	function legacyCopy( text ) {
		const area = document.createElement( 'textarea' );
		area.value = text;
		area.setAttribute( 'readonly', '' );
		area.style.position = 'fixed';
		area.style.opacity = '0';
		document.body.appendChild( area );
		area.select();
		try {
			document.execCommand( 'copy' );
		} catch ( e ) {
			// No clipboard here: nothing more to do.
		}
		document.body.removeChild( area );
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
			copy: [
				h( 'rect', { key: 'a', x: 5.5, y: 5.5, width: 8, height: 8, rx: 1 } ),
				h( 'path', { key: 'b', d: 'M10.5 5.5v-2a1 1 0 0 0-1-1h-6a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2' } ),
			],
			styles: [ h( 'path', { key: 'a', d: 'M8 2C8 2 4 6.5 4 9.2a4 4 0 0 0 8 0C12 6.5 8 2 8 2z' } ) ],
			paste: [
				h( 'rect', { key: 'a', x: 3.5, y: 3, width: 9, height: 11, rx: 1 } ),
				h( 'rect', { key: 'b', x: 6, y: 1.5, width: 4, height: 2.5, rx: 0.6 } ),
			],
			check: [ h( 'path', { key: 'a', d: 'M3 8.5l3.2 3L13 4.5' } ) ],
			back: [ h( 'path', { key: 'a', d: 'M10 3.5 5.5 8l4.5 4.5' } ) ],
			close: [ h( 'path', { key: 'a', d: 'M4 4l8 8M12 4l-8 8' } ) ],
		};
		return h( 'svg', { className: 'snn-bt-icon', viewBox: '0 0 16 16', 'aria-hidden': 'true', focusable: 'false' }, ...( parts[ name ] || [] ) );
	}

	/** A small icon button for the ID bar and the sub-panels. */
	function IconButton( { label, name, onClick, disabled, pressed, className } ) {
		return h(
			'button',
			{
				type: 'button',
				className: 'snn-bt-idbtn' + ( className ? ' ' + className : '' ) + ( pressed ? ' is-on' : '' ),
				title: label,
				'aria-label': label,
				'aria-pressed': pressed === undefined ? undefined : pressed ? 'true' : 'false',
				disabled: !! disabled,
				onClick,
			},
			glyph( name )
		);
	}

	function RemoveButton( { label, onClick } ) {
		return h( 'button', { type: 'button', className: 'snn-bt-x', title: label, 'aria-label': label, onClick }, glyph( 'close' ) );
	}

	/* ------------------------------------------------------------------
	 * Header
	 * ---------------------------------------------------------------- */

	/** The Conditions and Interactions buttons. open: the sub-panel shown (or null). A dot marks a block that uses them. */
	function HeadIcons( { conditions, interactions, open, onOpen } ) {
		const items = [
			{ key: 'conditions', label: __( 'Conditions', 'snn' ), used: conditions > 0, name: 'conditions' },
			{ key: 'interactions', label: __( 'Interactions', 'snn' ), used: interactions > 0, name: 'interactions' },
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

	/**
	 * The ID bar: the CSS ID (typing in it is the rename), the classes button, then copy ID, copy styles
	 * and, once something is copied, paste styles. A warning shows when another block has the same ID.
	 */
	function IdBar( { htmlId, onIdChange, classCount, classesOpen, onToggleClasses, onCopyStyles, canPaste, onPasteStyles, duplicate } ) {
		const [ flash, setFlash ] = useState( '' );
		const timer = useRef( null );
		const say = ( what ) => {
			setFlash( what );
			clearTimeout( timer.current );
			timer.current = setTimeout( () => setFlash( '' ), 1200 );
		};
		const id = htmlId || '';
		const classLabel =
			classCount === 0 ? __( 'No classes', 'snn' ) : classCount === 1 ? __( '1 class', 'snn' ) : classCount + ' ' + __( 'classes', 'snn' );

		return h(
			Fragment,
			null,
			h(
				'div',
				{ className: 'snn-bt-idbar' },
				h( 'span', { className: 'snn-bt-hash', 'aria-hidden': 'true' }, '#' ),
				h( 'input', {
					type: 'text',
					className: 'snn-input snn-bt-id',
					value: id,
					placeholder: __( 'no-id', 'snn' ),
					spellCheck: false,
					'aria-label': __( 'CSS ID', 'snn' ),
					onChange: ( e ) => onIdChange( sanitizeId( e.target.value ) ),
				} ),
				h(
					'button',
					{
						type: 'button',
						className: 'snn-bt-chip-btn' + ( classesOpen ? ' is-on' : '' ),
						'aria-expanded': classesOpen ? 'true' : 'false',
						title: __( 'Custom classes', 'snn' ),
						onClick: onToggleClasses,
					},
					classLabel
				),
				h( IconButton, {
					label: flash === 'id' ? __( 'Copied', 'snn' ) : __( 'Copy ID', 'snn' ),
					name: flash === 'id' ? 'check' : 'copy',
					disabled: ! id,
					onClick: () => {
						copyText( '#' + id );
						say( 'id' );
					},
				} ),
				h( IconButton, {
					label: flash === 'styles' ? __( 'Copied', 'snn' ) : __( 'Copy styles', 'snn' ),
					name: flash === 'styles' ? 'check' : 'styles',
					onClick: () => {
						onCopyStyles();
						say( 'styles' );
					},
				} ),
				canPaste ? h( IconButton, { label: __( 'Paste styles', 'snn' ), name: 'paste', onClick: onPasteStyles } ) : null
			),
			duplicate ? h( 'div', { className: 'snn-bt-warn' }, __( 'Another block uses this ID.', 'snn' ) ) : null
		);
	}

	/** The custom classes, as chips. Enter or a comma adds the name typed; a chip's × removes it. */
	function ClassesEditor( { value, onChange } ) {
		const [ draft, setDraft ] = useState( '' );
		const list = String( value || '' ).split( /\s+/ ).filter( Boolean );
		const add = ( raw ) => {
			const names = String( raw )
				.split( /[\s,]+/ )
				.map( sanitizeClass )
				.filter( Boolean );
			setDraft( '' );
			if ( ! names.length ) {
				return;
			}
			const next = list.slice();
			names.forEach( ( n ) => {
				if ( next.indexOf( n ) === -1 ) {
					next.push( n );
				}
			} );
			onChange( next.join( ' ' ) );
		};
		const remove = ( n ) => onChange( list.filter( ( x ) => x !== n ).join( ' ' ) );
		return h(
			'div',
			{ className: 'snn-bt-classes' },
			list.length
				? h(
						'div',
						{ className: 'snn-bt-chips' },
						list.map( ( n ) =>
							h(
								'span',
								{ key: n, className: 'snn-bt-chip' },
								n,
								h( RemoveButton, { label: __( 'Remove class', 'snn' ) + ' ' + n, onClick: () => remove( n ) } )
							)
						)
				  )
				: null,
			h( 'input', {
				type: 'text',
				className: 'snn-input',
				value: draft,
				placeholder: __( 'Add a class, then Enter', 'snn' ),
				spellCheck: false,
				'aria-label': __( 'Add a class', 'snn' ),
				onChange: ( e ) => setDraft( e.target.value ),
				onKeyDown: ( e ) => {
					if ( e.key === 'Enter' || e.key === ',' ) {
						e.preventDefault();
						add( draft );
					}
				},
				onBlur: () => {
					if ( draft.trim() ) {
						add( draft );
					}
				},
			} )
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
		const setAt = ( i, change ) => onChange( list.map( ( it, j ) => ( j === i ? { ...it, ...change } : it ) ) );
		const removeAt = ( i ) => onChange( list.filter( ( _, j ) => j !== i ) );
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
					h( Row, { label: __( 'Do', 'snn' ) }, h( Select, { value: it.action, options: actions, label: __( 'Action', 'snn' ), onChange: ( v ) => setAt( i, { action: v } ) } ) ),
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

	window.snnBlockTools = {
		HeadIcons,
		IdBar,
		ClassesEditor,
		ConditionsEditor,
		InteractionsEditor,
		readClip,
		writeClip,
		styleValues,
		sanitizeId,
	};
} )( window.wp, window.snnControls );
