/**
 * SNN controls: our own panel controls for the SNN blocks. No WordPress core components.
 *
 *   Switch, SwitchRow   on/off switches (not checkboxes), as Bricks has them
 *   Accordion           a section that opens and closes; disabled sections cannot open
 *   Row                 a compact row: label on the left, control on the right
 *   Select, Segmented   a menu, and a row of icon buttons
 *   TextField           a text or number field with the dynamic data button (lightning) and,
 *                       when given, the variables button; a live preview of the tags
 *
 * Loaded in the block editor (see includes/blocks/layout-blocks.php). Exposes window.snnControls.
 * Uses wp.element only, so it runs on the editor's own React.
 */
( function ( wp ) {
	const { createElement: h, Fragment, useState, useEffect, useRef } = wp.element;
	const { __ } = wp.i18n;

	const data = window.snnControlsData || {};
	const dynamic = data.dynamic || { groups: {}, tags: [] };

	/** The post the editor is on, for the preview. 0 when there is none (the Site Editor). */
	function currentPostId() {
		try {
			const editor = wp.data.select( 'core/editor' );
			return ( editor && editor.getCurrentPostId && editor.getCurrentPostId() ) || 0;
		} catch ( e ) {
			return 0;
		}
	}

	/** A small lightning bolt, the dynamic data mark. */
	function Bolt() {
		return h(
			'svg',
			{ className: 'snn-bolt', viewBox: '0 0 24 24', width: 12, height: 12, 'aria-hidden': 'true', focusable: 'false' },
			h( 'path', { d: 'M13 2 3 14h7l-1 8 10-12h-7z', fill: 'currentColor' } )
		);
	}

	/** The value differs from its default: a small dot, as Bricks marks a stored value. */
	function Dot() {
		return h( 'span', { className: 'snn-dot', 'aria-hidden': 'true' } );
	}

	function Switch( { checked, onChange, label } ) {
		return h(
			'button',
			{
				type: 'button',
				role: 'switch',
				className: 'snn-switch' + ( checked ? ' is-on' : '' ),
				'aria-checked': checked ? 'true' : 'false',
				'aria-label': label,
				onClick: () => onChange( ! checked ),
			},
			h( 'span', { className: 'snn-switch-knob', 'aria-hidden': 'true' } )
		);
	}

	function Row( { label, changed, children } ) {
		return h(
			'div',
			{ className: 'snn-row' },
			h( 'span', { className: 'snn-row-label' }, label, changed ? h( Dot ) : null ),
			h( 'div', { className: 'snn-row-control' }, children )
		);
	}

	/** A row with a switch on the right. */
	function SwitchRow( { label, checked, onChange, changed } ) {
		return h(
			Row,
			{ label, changed: changed !== undefined ? changed : checked },
			h( Switch, { checked, onChange, label } )
		);
	}

	/**
	 * A section that opens and closes. When disabled, the header is greyed and cannot open, and
	 * the hint says why (for example: turn on the query loop first).
	 */
	function Accordion( { title, open, onToggle, disabled, changed, hint, children } ) {
		const isOpen = !! open && ! disabled;
		return h(
			'div',
			{ className: 'snn-acc' + ( isOpen ? ' is-open' : '' ) + ( disabled ? ' is-disabled' : '' ) },
			h(
				'button',
				{
					type: 'button',
					className: 'snn-acc-head',
					'aria-expanded': isOpen ? 'true' : 'false',
					'aria-disabled': disabled ? 'true' : 'false',
					title: disabled ? hint : undefined,
					onClick: () => {
						if ( ! disabled ) {
							onToggle( ! open );
						}
					},
				},
				h( 'span', {
					className: 'dashicons ' + ( isOpen ? 'dashicons-arrow-down-alt2' : 'dashicons-arrow-right-alt2' ),
					'aria-hidden': 'true',
				} ),
				h( 'span', { className: 'snn-acc-title' }, title ),
				changed ? h( Dot ) : null
			),
			isOpen ? h( 'div', { className: 'snn-acc-body' }, children ) : null
		);
	}

	function Select( { value, options, onChange, label } ) {
		return h(
			'select',
			{
				className: 'snn-select',
				value,
				'aria-label': label,
				onChange: ( e ) => onChange( e.target.value ),
			},
			options.map( ( o ) => h( 'option', { key: o.value, value: o.value }, o.label ) )
		);
	}

	/** A row of icon buttons, one per option. options: { value, label, icon (dashicon class) }. */
	function Segmented( { value, options, onChange, label } ) {
		return h(
			'div',
			{ className: 'snn-seg', role: 'group', 'aria-label': label },
			options.map( ( o ) =>
				h(
					'button',
					{
						key: o.value,
						type: 'button',
						className: 'snn-seg-btn' + ( o.value === value ? ' is-on' : '' ),
						'aria-pressed': o.value === value ? 'true' : 'false',
						'aria-label': o.label,
						title: o.label,
						onClick: () => onChange( o.value ),
					},
					h( 'span', { className: 'dashicons ' + o.icon, 'aria-hidden': 'true' } )
				)
			)
		);
	}

	/** Closes a popover on an outside click or Escape. */
	function usePopoverClose( open, ref, close ) {
		useEffect( () => {
			if ( ! open ) {
				return undefined;
			}
			const onDown = ( e ) => {
				if ( ref.current && ! ref.current.contains( e.target ) ) {
					close();
				}
			};
			const onKey = ( e ) => {
				if ( e.key === 'Escape' ) {
					close();
				}
			};
			document.addEventListener( 'mousedown', onDown );
			document.addEventListener( 'keydown', onKey );
			return () => {
				document.removeEventListener( 'mousedown', onDown );
				document.removeEventListener( 'keydown', onKey );
			};
		}, [ open ] );
	}

	/** The resolved text of a value with tags, from the server. Empty when there are no tags. */
	function usePreview( text ) {
		const [ out, setOut ] = useState( '' );
		useEffect( () => {
			if ( ! text || text.indexOf( '{' ) === -1 ) {
				setOut( '' );
				return undefined;
			}
			let live = true;
			const timer = setTimeout( () => {
				wp.apiFetch( {
					path: '/snn/v1/dynamic-data/preview',
					method: 'POST',
					data: { text, post_id: currentPostId() },
				} )
					.then( ( r ) => {
						if ( live ) {
							setOut( r && typeof r.text === 'string' ? r.text : '' );
						}
					} )
					.catch( () => {
						if ( live ) {
							setOut( '' );
						}
					} );
			}, 350 );
			return () => {
				live = false;
				clearTimeout( timer );
			};
		}, [ text ] );
		return out;
	}

	/** The list of dynamic data tags. Click one to insert it at the cursor. */
	function TagPicker( { onPick, onClose } ) {
		const [ query, setQuery ] = useState( '' );
		const needle = query.trim().toLowerCase();
		const tags = dynamic.tags.filter(
			( t ) => ! needle || t.key.indexOf( needle ) !== -1 || t.label.toLowerCase().indexOf( needle ) !== -1
		);
		return h(
			'div',
			{ className: 'snn-pop snn-tag-pop', role: 'dialog', 'aria-label': __( 'Dynamic data', 'snn' ) },
			h( 'input', {
				type: 'search',
				className: 'snn-input snn-pop-search',
				placeholder: __( 'Search dynamic data', 'snn' ),
				value: query,
				autoFocus: true,
				onChange: ( e ) => setQuery( e.target.value ),
			} ),
			h(
				'div',
				{ className: 'snn-pop-list' },
				Object.keys( dynamic.groups ).map( ( group ) => {
					const items = tags.filter( ( t ) => t.group === group );
					if ( ! items.length ) {
						return null;
					}
					return h(
						Fragment,
						{ key: group },
						h( 'div', { className: 'snn-pop-group' }, dynamic.groups[ group ] ),
						items.map( ( t ) =>
							h(
								'button',
								{
									key: t.key,
									type: 'button',
									className: 'snn-pop-item',
									onClick: () => {
										onPick( '{' + t.key + '}' );
										onClose();
									},
								},
								h( 'span', { className: 'snn-pop-label' }, t.label ),
								h( 'code', null, '{' + t.key + '}' ),
								t.hint ? h( 'span', { className: 'snn-pop-hint' }, t.hint ) : null
							)
						)
					);
				} ),
				tags.length === 0 ? h( 'div', { className: 'snn-pop-empty' }, __( 'No match.', 'snn' ) ) : null
			)
		);
	}

	/** Variables: the theme's presets. Click one to use it as the value. */
	function VariablePicker( { groups, onPick } ) {
		return h(
			'div',
			{ className: 'snn-pop snn-var-pop', role: 'dialog', 'aria-label': __( 'Variables', 'snn' ) },
			h(
				'div',
				{ className: 'snn-pop-list' },
				groups.map( ( g ) =>
					h(
						Fragment,
						{ key: g.key },
						h( 'div', { className: 'snn-pop-group' }, g.label ),
						g.items.map( ( it ) =>
							h(
								'button',
								{ key: it.value, type: 'button', className: 'snn-pop-item', onClick: () => onPick( it.value ) },
								h( 'span', { className: 'snn-pop-label' }, it.label ),
								h( 'code', null, it.value )
							)
						)
					)
				),
				groups.length === 0 ? h( 'div', { className: 'snn-pop-empty' }, __( 'No variables yet.', 'snn' ) ) : null
			)
		);
	}

	/**
	 * A text or number field. variables: the variable groups it may use (optional). The
	 * lightning opens the dynamic data list; the field then keeps the tag as typed and shows
	 * what it resolves to under the field.
	 */
	function TextField( { value, onChange, label, placeholder, variables, inputMode } ) {
		const [ picker, setPicker ] = useState( null ); // null, 'tags' or 'vars'
		const wrap = useRef( null );
		const input = useRef( null );
		const current = value || '';
		const preview = usePreview( current );
		usePopoverClose( picker !== null, wrap, () => setPicker( null ) );

		const insert = ( text ) => {
			const el = input.current;
			const start = el && typeof el.selectionStart === 'number' ? el.selectionStart : current.length;
			const end = el && typeof el.selectionEnd === 'number' ? el.selectionEnd : start;
			onChange( current.slice( 0, start ) + text + current.slice( end ) );
		};

		return h(
			'div',
			{ className: 'snn-field', ref: wrap },
			h(
				'div',
				{ className: 'snn-input-wrap' },
				h( 'input', {
					ref: input,
					type: 'text',
					className: 'snn-input',
					value: current,
					placeholder,
					inputMode,
					'aria-label': label,
					spellCheck: false,
					onChange: ( e ) => onChange( e.target.value ),
				} ),
				variables && variables.length
					? h(
							'button',
							{
								type: 'button',
								className: 'snn-tool',
								title: __( 'Variables', 'snn' ),
								'aria-label': __( 'Variables', 'snn' ),
								'aria-expanded': picker === 'vars' ? 'true' : 'false',
								onClick: () => setPicker( picker === 'vars' ? null : 'vars' ),
							},
							h( 'span', { className: 'snn-tool-text', 'aria-hidden': 'true' }, 'V' )
					  )
					: null,
				h(
					'button',
					{
						type: 'button',
						className: 'snn-tool snn-tool-dyn' + ( picker === 'tags' ? ' is-on' : '' ),
						title: __( 'Dynamic data', 'snn' ),
						'aria-label': __( 'Dynamic data', 'snn' ),
						'aria-expanded': picker === 'tags' ? 'true' : 'false',
						onClick: () => setPicker( picker === 'tags' ? null : 'tags' ),
					},
					h( Bolt )
				)
			),
			preview ? h( 'div', { className: 'snn-preview', title: preview }, '→ ' + preview ) : null,
			picker === 'tags' ? h( TagPicker, { onPick: insert, onClose: () => setPicker( null ) } ) : null,
			picker === 'vars'
				? h( VariablePicker, {
						groups: variables || [],
						onPick: ( v ) => {
							onChange( v );
							setPicker( null );
						},
				  } )
				: null
		);
	}

	window.snnControls = {
		Bolt,
		Dot,
		Switch,
		Row,
		SwitchRow,
		Accordion,
		Select,
		Segmented,
		TextField,
	};
} )( window.wp );
