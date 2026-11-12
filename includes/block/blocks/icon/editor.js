/**
 * SNN Icon block, the editor side: the Content tab (Icon, Colour, Size and Link, as the Bricks icon element) and the
 * icon on the canvas. The front end is block.php in this folder: keep the two in step. The picker is shared (controls/icon-picker.js).
 * Registers snn.blocks['snn/icon'] for register.js.
 */
( function ( wp ) {
	const { createElement: h } = wp.element;
	const { __ } = wp.i18n;
	const { Group, Row } = snn.controls;
	const { IconField, IconGlyph, hasIcon } = snn.iconPicker;
	const { LinkGroup } = snn.linkFields;
	// The empty box on the canvas (an iframe, so its look is written here).
	const EMPTY = { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', minHeight: 40, padding: '8px 12px', border: '1px dashed #8c8f94', color: '#646970', fontSize: 12, fontFamily: 'system-ui, sans-serif' };

	function Pane( { a, set, pick, def, base, styleA, styleSet, device, hovering } ) {
		// The colour and size are style values: on the hover state while it is on (styleA, styleSet), and per view like the others.
		// The dot of the icon compares with the registered default icon (the star), so a new block shows none.
		const { ViewValue: V, ContentRest: Rest, TagRow, isChanged } = snn.panel;
		const sa = styleA || a;
		const sset = styleSet || set;
		return h(
			'div',
			{ className: 'snn-pane' },
			h(
				Group,
				{ title: __( 'Icon', 'snn' ) },
				h( Rest, { hovering }, h( Row, { label: __( 'Icon', 'snn' ), changed: isChanged( a, base, 'icon' ) }, h( IconField, { value: a.icon, onChange: ( v ) => pick( { icon: v } ) } ) ) ),
				h( V, { a: sa, set: sset, device, k: 'iconColor', label: __( 'Colour', 'snn' ), kind: 'color' } ),
				h( V, { a: sa, set: sset, device, k: 'iconSize', label: __( 'Size', 'snn' ), unit: ' px', kind: 'size' } ),
				a.linkUrl
					? null
					: h( Rest, { hovering }, h( TagRow, { a, set: pick, def } ) )
			),
			h( Rest, { hovering }, h( LinkGroup, { a, set } ) )
		);
	}

	/** The icon on the canvas: its size and colour are the block's variables (see the table), the icon inside it. Empty: a dashed box to click. */
	function Canvas( { a, tag, rootProps } ) {
		const root = rootProps || {};
		const shownTag = a.linkUrl ? 'a' : tag === 'a' ? 'span' : tag;
		return h(
			shownTag,
			{ ...root, style: root.style, className: [ root.className, 'snn-icon-root' ].filter( Boolean ).join( ' ' ) },
			hasIcon( a.icon )
				? h( IconGlyph, { icon: a.icon } )
				: h( 'span', { className: 'snn-icon-empty', style: EMPTY }, __( 'Choose an icon in the panel', 'snn' ) )
		);
	}

	snn.registerBlock( 'snn/icon', { Pane, Canvas } );
} )( window.wp );
