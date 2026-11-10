/**
 * SNN block editor: the panel (the inspector): the header, the Content and Style tabs, and the sub-panels.
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
	const { BoxModel, CssPane, Glyph, LayoutFields, POST_TYPE_OPTIONS, QueryFields, STYLE_PAGES, StyleRow, ViewSwitch, changedQuery, groupChanged, options } = snn.panel;

	/**
	 * The place in the panel: the tab, the sub-panel (null, or conditions, interactions, animations) and the Style group.
	 * The block's Edit unmounts when another block is selected, so the place is kept here instead. The next block opens
	 * where the last one was left. It lasts for the editor session; a reload starts on Content.
	 */
	/**
	 * The place in the panel: the tab, the sub-panel (null, or conditions, interactions, animations) and the Style group.
	 * The block's Edit unmounts when another block is selected, so the place is kept here instead. The next block opens
	 * where the last one was left. It lasts for the editor session; a reload starts on Content.
	 */
	const panelPlace = { tab: 'default', sub: null, stylePage: 'layout' };

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
	function GenericPane( { a, set, def, parent, device, base } ) {
		const [ openQuery, setOpenQuery ] = useState( false );
		const q = a.query;
		const setQ = ( patch ) => set( { query: { ...q, ...patch } } );
		const LinkGroup = snn.linkFields && snn.linkFields.LinkGroup;
		return h(
			'div',
			{ className: 'snn-pane' },
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
			def.supports.children
				? h(
						Group,
						{ title: __( 'Layout', 'snn' ), tip: 'group.layout' },
						h( LayoutFields, { a, set, base, device, parent } )
				  )
				: null,
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
				h( 'div', { className: 'snn-name' }, def.title ),
				h( HeadIcons, {
					conditions: conditions.length,
					interactions: interactions.length,
					animations: gsapCount,
					open: sub,
					onOpen: setSub,
				} )
			),
			h( ViewSwitch, null )
		);

		// Content: the block's own pane, or the generic one. The advanced group comes after a pane of its own.
		const own = parts && parts.Pane ? h( parts.Pane, { a, set, def, device, parent, base, clientId } ) : null;
		const defaultPane = own
			? h( Fragment, null, own, h( 'div', { className: 'snn-pane' }, h( AdvancedGroup, { a, set } ) ) )
			: h( GenericPane, { a, set, def, parent, device, base } );

		// Style: one group at a time, chosen on the rail of icons (as Bricks does). The group's sections follow, one
		// under another. Every value is per view: a view shows the value it sets, or the one it inherits.
		const page = STYLE_PAGES.find( ( p ) => p.id === stylePage ) || STYLE_PAGES[ 0 ];
		const rowFor = ( row ) => {
			if ( 'LAYOUT' === row ) {
				return h( LayoutFields, { key: 'layout', a, set, base, device, parent } );
			}
			return typeof row === 'string'
				? h( StyleRow, { key: row, a, set, device, k: row } )
				: h( BoxModel, { key: row.box, a, set, device, box: row } );
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
					options: STYLE_PAGES.map( ( p ) => ( {
						value: p.id,
						label: p.label,
						glyph: p.text ? h( 'span', { className: 'snn-glyph-text', 'aria-hidden': 'true' }, p.text ) : h( Glyph, { name: p.glyph } ),
						changed: groupChanged( a, p ),
						tip: 'style.' + p.id,
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
				? h( CssPane, { a, set, editor: data.cssEditor } )
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
			tab === 'default' ? defaultPane : stylePane
		);
	}

	/** The query's badge text on the canvas: its title, its post type and its count. */
	function badgeText( q ) {
		const type = POST_TYPE_OPTIONS.find( ( o ) => o.value === q.postType );
		return __( 'Query loop', 'snn' ) + ' · ' + ( type ? type.label : q.postType ) + ' · ' + ( q.perPage || '10' );
	}


	Object.assign( snn.panel, { Panel, badgeText } );
} )( window.wp );
