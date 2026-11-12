/**
 * SNN block editor: the panel (the inspector): the header, the Content and Style tabs, and the sub-panels.
 *
 * Part of the editor split of the old layout-blocks.js (see the change notes).
 */
( function ( wp ) {
	const C = snn.controls;
	const I = snn.layoutIcons;
	const { createElement: h, Fragment, useState, useEffect } = wp.element;
	const { __ } = wp.i18n;
	const { Row, SwitchRow, Accordion, Select, Segmented, Group, Disclosure, Switch, effectiveValues, tipAttr, closeStep } = C;
	const { HeadIcons, ClassesEditor, AttributesEditor, ConditionsEditor, InteractionsEditor } = snn.blockTools;
	const { AnimationsPane, stateOf } = snn.animationPane;
	const { Button } = wp.components;
	const { create } = wp.richText;
	const data = snn.data.controls || {};
	const { BoxModel, CssPane, Glyph, LayoutFields, POST_TYPE_OPTIONS, QueryFields, STYLE_PAGES, StyleRow, ViewSwitch, changedQuery, groupChanged, options } = snn.panel;

	/**
	 * The place in the panel: the tab, the sub-panel (null, or conditions, interactions, animations) and the Style group.
	 * The block's Edit unmounts when another block is selected, so the place is kept here instead. The next block opens
	 * where the last one was left. It lasts for the editor session; a reload starts on Content.
	 */
	const panelPlace = { tab: 'default', sub: null, stylePage: 'layout', hover: false };

	/**
	 * A part of the Content tab that the hover state does not change: it is inert while the hover state is on (the wrapper
	 * is dimmed by controls.css). The style rows of the same tab are outside it.
	 */
	function ContentRest( { hovering, children } ) {
		return h(
			'div',
			{
				className: 'snn-content-rest',
				ref: ( el ) => {
					if ( el ) {
						el.inert = !! hovering;
					}
				},
			},
			children
		);
	}

	/**
	 * The layer the Style values are read from while the hover state is on: the block's hover values (base and views),
	 * with the normal values as their inheritance (__inherit, see controls.js effectiveValues()).
	 */
	function hoverLayer( a ) {
		const hs = a.hoverStyle || {};
		return { ...( hs.base || {} ), customCss: hs.css || '', responsive: { tablet: hs.tablet || {}, mobile: hs.mobile || {} }, __inherit: a };
	}

	/**
	 * Writes a Style value to the hover state, in the shape hoverStyle keeps: a base value, or a view's values (the
	 * responsive shape the panel's helpers write). One set is one undo step.
	 */
	function hoverWriter( a, set ) {
		return ( patch ) => {
			const hs = a.hoverStyle || {};
			const next = { base: { ...( hs.base || {} ) }, tablet: { ...( hs.tablet || {} ) }, mobile: { ...( hs.mobile || {} ) }, css: hs.css || '' };
			Object.keys( patch ).forEach( ( k ) => {
				if ( k === 'customCss' ) {
					next.css = patch[ k ] || '';
				} else if ( k === 'responsive' ) {
					const views = patch.responsive || {};
					next.tablet = { ...( views.tablet || {} ) };
					next.mobile = { ...( views.mobile || {} ) };
				} else if ( patch[ k ] === '' || patch[ k ] === undefined ) {
					delete next.base[ k ];
				} else {
					next.base[ k ] = patch[ k ];
				}
			} );
			set( { hoverStyle: next } );
		};
	}

	/** True when the block has a hover value on any level (its H button shows a dot). */
	function hasHover( a ) {
		const hs = a.hoverStyle || {};
		return !! hs.css || [ 'base', 'tablet', 'mobile' ].some( ( v ) => Object.keys( hs[ v ] || {} ).length > 0 );
	}

	/** A panel state kept across blocks (see panelPlace): the same pair as useState, and the new value is saved. */
	function usePlace( key ) {
		const [ value, setNow ] = useState( panelPlace[ key ] );
		return [
			value,
			( next ) => {
				panelPlace[ key ] = next;
				setNow( next );
			},
		];
	}

	/** Advanced: the custom classes and the custom attributes. Every block has them. */
	function AdvancedGroup( { a, set } ) {
		return h(
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
		);
	}

	/**
	 * The Content tab of a block without its own pane: its element (the tag), its link (the a tag), its layout (only the
	 * layout blocks that hold children: Section, Container, Div) and its query loop (only the blocks that offer one).
	 */
	function GenericPane( { a, set, def, parent, device, base, layoutA, layoutSet, hovering } ) {
		const [ openQuery, setOpenQuery ] = useState( false );
		const q = a.query;
		const setQ = ( patch ) => set( { query: { ...q, ...patch } } );
		const LinkGroup = snn.linkFields && snn.linkFields.LinkGroup;
		// The layout settings are style values: while the hover state is on they are its values (layoutA, layoutSet). The
		// other settings here are not part of the hover state, so they are inert until H is off (the wrapper below).
		const layout = def.supports.children
			? h(
					Group,
					{ title: __( 'Layout', 'snn' ), tip: 'group.layout' },
					h( LayoutFields, { a: layoutA || a, set: layoutSet || set, base, device, parent } )
			  )
			: null;
		return h(
			'div',
			{ className: 'snn-pane' },
			hovering ? h( 'p', { className: 'snn-hint' }, __( 'The hover state is on: the layout settings change it. The settings below are not part of it, so they are off until H is turned off.', 'snn' ) ) : null,
			layout,
			h(
				ContentRest,
				{ hovering },
				h(
					Group,
					{ title: __( 'Element', 'snn' ), tip: 'group.element' },
					h(
						Row,
						{ label: __( 'HTML tag', 'snn' ), changed: a.tagName !== def.tag, tip: 'tagName' },
						h( Select, {
							label: __( 'HTML tag', 'snn' ),
							value: a.tagName,
							tip: 'tagName',
							options: def.tags.map( ( t ) => ( { value: t, label: t } ) ),
							onChange: ( v ) => set( { tagName: v } ),
						} )
					)
				),
				// The a tag: the link's URL, new tab, rel and ARIA label (controls/link-fields.js).
				def.supports.link && 'a' === a.tagName && LinkGroup ? h( LinkGroup, { a, set } ) : null,
				def.supports.loop
					? h(
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
					  )
					: null,
				h( AdvancedGroup, { a, set } )
			)
		);
	}

	/**
	 * The inspector, as in the version 12 layout: the header (the Conditions, Interactions and Animations buttons, the
	 * view), then the Content and Style tabs. A block with its own parts (def's editor, see registerBlock) shows its
	 * own Content pane; every other block shows GenericPane. The Style tab is the same for every block, and its Layout
	 * group (flex and grid) is there for every block. Conditions, Interactions and Animations open on their own, in
	 * place of the whole panel.
	 */
	function Panel( { a, set, def, parts, parent, device, base, clientId } ) {
		// The tab, the sub-panel and the Style group are kept across blocks (see panelPlace).
		const [ tab, setTab ] = usePlace( 'tab' );
		const [ sub, setSub ] = usePlace( 'sub' );
		const [ stylePage, setStylePage ] = usePlace( 'stylePage' );
		const [ hoverOn, setHoverOn ] = usePlace( 'hover' );
		// The hover state is for the Style values. A block with supports.hover false has none (its H button is not shown).
		const noHover = def.supports && def.supports.hover === false;
		const hovering = hoverOn && ! noHover;
		// What the Style values are read and written as: the hover layer while the hover state is on, else the block itself.
		const sa = hovering ? hoverLayer( a ) : a;
		const sset = hovering ? hoverWriter( a, set ) : set;
		const tabNow = tab;
		// The canvas draws the hover state of this block while it is on: a class the canvas's hover rule also matches
		// (register.js). Set again when the block's hover values change, since a re-render of the block can reset its class.
		useEffect( () => {
			const frame = document.querySelector( 'iframe[name="editor-canvas"]' );
			const doc = frame && frame.contentDocument ? frame.contentDocument : document;
			const el = doc.getElementById( 'block-' + clientId );
			if ( ! el ) {
				return undefined;
			}
			el.classList.toggle( 'snn-force-hover', !! hovering );
			return () => el.classList.remove( 'snn-force-hover' );
		}, [ hovering, clientId, a.hoverStyle ] );
		const conditions = Array.isArray( a.conditions ) ? a.conditions : [];
		const interactions = Array.isArray( a.interactions ) ? a.interactions : [];
		const gsapCount = stateOf( a ).tweens.length;
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
					'aria-selected': tabNow === id ? 'true' : 'false',
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
				h( 'div', { className: 'snn-name' }, def.title ),
				h( HeadIcons, {
					conditions: conditions.length,
					interactions: interactions.length,
					animations: gsapCount,
					open: sub,
					onOpen: ( v ) => {
						if ( v ) {
							setHoverOn( false );
						}
						setSub( v );
					},
					hover: noHover
						? undefined
						: {
								on: hovering,
								used: hasHover( a ),
								onToggle: () => {
									if ( ! hovering ) {
										setSub( null );
									}
									setHoverOn( ! hovering );
								},
						  },
				} )
			),
			h( ViewSwitch, null )
		);

		// Content: the block's own pane, or the generic one. The advanced group comes after a pane of its own.
		// pick: a discrete change of the block's own settings (a choice, a switch, an icon) is one undo step of its own;
		// set stays for typing, so a run of typing in one field is one step.
		const pick = ( patch ) => {
			closeStep();
			set( patch );
		};
		const own = parts && parts.Pane ? h( parts.Pane, { a, set, pick, def, device, parent, base, clientId, styleA: sa, styleSet: sset, hovering } ) : null;
		const defaultPane = own
			? h( Fragment, null, hovering ? h( 'p', { className: 'snn-hint' }, __( 'The hover state is on: the style settings here change it. The other settings are not part of it, so they are off until H is turned off.', 'snn' ) ) : null, own, h( 'div', { className: 'snn-pane' }, h( AdvancedGroup, { a, set } ) ) )
			: h( GenericPane, { a, set, def, parent, device, base, layoutA: sa, layoutSet: sset, hovering } );

		// Style: one group at a time, chosen on the rail of icons (as Bricks does). The group's sections follow, one
		// under another. Every value is per view: a view shows the value it sets, or the one it inherits.
				const pages = STYLE_PAGES;
		const page = pages.find( ( p ) => p.id === stylePage ) || pages[ 0 ];
		const rowFor = ( row ) => {
			if ( 'LAYOUT' === row ) {
				return h( LayoutFields, { key: 'layout', a: sa, set: sset, base, device, parent } );
			}
			return typeof row === 'string'
				? h( StyleRow, { key: row, a: sa, set: sset, device, k: row } )
				: h( BoxModel, { key: row.box, a: sa, set: sset, device, box: row } );
		};
		const stylePane = h(
			'div',
			{ className: 'snn-pane snn-style' },
			h(
				'div',
				{ className: 'snn-rail' },
				h( Segmented, {
					label: __( 'Style groups', 'snn' ),
					value: page.id,
					options: pages.map( ( p ) => ( {
						value: p.id,
						label: p.label,
						glyph: p.text ? h( 'span', { className: 'snn-glyph-text', 'aria-hidden': 'true' }, p.text ) : h( Glyph, { name: p.glyph } ),
						changed: groupChanged( sa, p ),
						tip: 'style.' + p.id,
					} ) ),
					onChange: setStylePage,
				} )
			),
			h(
				'div',
				{ className: 'snn-page-head' },
				h( 'span', Object.assign( { className: 'snn-page-title' }, tipAttr( 'style.' + page.id ) ), page.label ),
				hovering ? h( 'span', { className: 'snn-hover-badge' }, __( 'Hover state', 'snn' ) ) : null
			),
			page.kind === 'css'
				? h( CssPane, { a: sa, set: sset, editor: data.cssEditor } )
				: page.sections.map( ( s ) => h( Group, { key: s.title, title: s.title, tip: s.tip }, s.rows.map( rowFor ) ) )
		);

		// Conditions, Interactions or Animations open: only that panel shows, under the icons that open and close it.
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
						h( HeadIcons, { conditions: conditions.length, interactions: interactions.length, animations: gsapCount, open: sub, onOpen: setSub } )
					)
				),
				h(
					'div',
					{ className: 'snn-bt-sub-body' },
					sub === 'conditions'
						? h( ConditionsEditor, { sets: conditions, onChange: ( v ) => set( { conditions: v } ) } )
						: sub === 'animations'
							? h( AnimationsPane, { attrs: a, clientId, title: def.title, onChange: ( v ) => set( { gsapTweens: v.tweens, gsapScroll: v.scroll, animation: [] } ) } )
							: h( InteractionsEditor, { items: interactions, onChange: ( v ) => set( { interactions: v } ) } )
				)
			);
		}

		return h(
			'div',
			{ className: 'snn-panel' },
			header,
			h( 'div', { className: 'snn-tabs', role: 'tablist' }, tabButton( 'default', __( 'Content', 'snn' ) ), tabButton( 'style', __( 'Style', 'snn' ) ) ),
			tabNow === 'default' ? defaultPane : stylePane
		);
	}

	/**
	 * True when a block setting differs from its registered default (base: the block's defaults, the Pane's base prop).
	 * Objects and lists are compared by their JSON. This is what the blue dot of a Content row shows.
	 */
	function isChanged( a, base, key ) {
		const v = a[ key ];
		const d = base ? base[ key ] : undefined;
		if ( v !== null && typeof v === 'object' ) {
			return JSON.stringify( v ) !== JSON.stringify( d === undefined ? ( Array.isArray( v ) ? [] : {} ) : d );
		}
		return ( v === undefined ? '' : v ) !== ( d === undefined ? '' : d );
	}

	/**
	 * The HTML tag row of a block's own Pane: the tags of its definition (def.tags, from block.php), without a for a
	 * block that can be a link (its element is an a when a URL is set, see SNN_Block_Link). The dot compares with def.tag.
	 */
	function TagRow( { a, set, def } ) {
		const linkable = def.supports && def.supports.link;
		const tags = def.tags.filter( ( t ) => ! ( linkable && t === 'a' ) );
		const value = tags.indexOf( a.tagName ) !== -1 ? a.tagName : def.tag;
		return h(
			Row,
			{ label: __( 'HTML tag', 'snn' ), changed: value !== def.tag, tip: 'tagName' },
			h( Select, { label: __( 'HTML tag', 'snn' ), tip: 'tagName', value, options: tags.map( ( t ) => ( { value: t, label: t } ) ), onChange: ( v ) => set( { tagName: v } ) } )
		);
	}

	/** The query's badge text on the canvas: its title, its post type and its count. */
	function badgeText( q ) {
		const type = POST_TYPE_OPTIONS.find( ( o ) => o.value === q.postType );
		return __( 'Query loop', 'snn' ) + ' · ' + ( type ? type.label : q.postType ) + ' · ' + ( q.perPage || '10' );
	}


	Object.assign( snn.panel, { Panel, badgeText, ContentRest, TagRow, isChanged } );
} )( window.wp );
