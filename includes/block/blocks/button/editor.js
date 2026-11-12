/**
 * SNN Button block, the editor side: the Content tab (Text, HTML tag, Link and Icon, as the Bricks button) and the
 * button on the canvas, with its text written in place. The front end is block.php in this folder: keep the two in step.
 *
 * Loaded after controls.js, icon-picker.js and link-fields.js, before layout-blocks.js, which puts Pane in the Content
 * tab and Canvas in the element (snn.blocks['snn/button']).
 */
( function ( wp ) {
	const { createElement: h } = wp.element;
	const { __ } = wp.i18n;
	const { RichText } = wp.blockEditor;
	const { Group, Row, SwitchRow, Select, TextField } = snn.controls;
	const { IconField, IconGlyph, hasIcon } = snn.iconPicker;
	const { LinkGroup } = snn.linkFields;
	const POSITION_OPTIONS = [
		{ value: 'right', label: __( 'Right', 'snn' ) },
		{ value: 'left', label: __( 'Left', 'snn' ) },
	];

	function Pane( { a, set, pick, def, base, styleA, styleSet, device, hovering } ) {
		// The icon's gap, size and colour are style values: the hover state while it is on (styleA, styleSet), and per view.
		// pick: a discrete change (one undo step); set: typing. The dots compare with the registered defaults (base).
		const { ViewValue: V, ContentRest: Rest, TagRow, isChanged } = snn.panel;
		const ch = ( k ) => isChanged( a, base, k );
		const sa = styleA || a;
		const sset = styleSet || set;
		const icon = hasIcon( a.icon );
		return h(
			'div',
			{ className: 'snn-pane' },
			h(
				Group,
				{ title: __( 'Button', 'snn' ) },
				h(
					Rest,
					{ hovering },
					h(
						Row,
						{ label: __( 'Text', 'snn' ), changed: ch( 'text' ) },
						h( TextField, { value: a.text || '', label: __( 'Text', 'snn' ), onChange: ( v ) => set( { text: v } ) } )
					)
				),
				// With a link the element is an a, so the tag is hidden, as Bricks does.
				a.linkUrl
					? null
					: h( Rest, { hovering }, h( TagRow, { a, set: pick, def } ) )
			),
			h( Rest, { hovering }, h( LinkGroup, { a, set } ) ),
			h(
				Group,
				{ title: __( 'Icon', 'snn' ) },
				h( Rest, { hovering }, h( Row, { label: __( 'Icon', 'snn' ), changed: icon }, h( IconField, { value: a.icon, onChange: ( v ) => pick( { icon: v } ) } ) ) ),
				icon
					? [
							h(
								Rest,
								{ key: 'pos', hovering },
								h(
									Row,
									{ label: __( 'Position', 'snn' ), changed: ch( 'iconPosition' ) },
									h( Select, { value: a.iconPosition, options: POSITION_OPTIONS, label: __( 'Position', 'snn' ), onChange: ( v ) => pick( { iconPosition: v } ) } )
								)
							),
							h( V, { key: 'gap', a: sa, set: sset, device, k: 'iconGap', label: __( 'Gap', 'snn' ), unit: ' px', kind: 'size', placeholder: '0.5em' } ),
							h(
								Rest,
								{ key: 'space', hovering },
								h( SwitchRow, { label: __( 'Space between', 'snn' ), checked: !! a.iconSpace, onChange: ( v ) => pick( { iconSpace: v } ) } )
							),
							h( V, { key: 'size', a: sa, set: sset, device, k: 'iconSize', label: __( 'Size', 'snn' ), unit: ' px', kind: 'size' } ),
							h( V, { key: 'color', a: sa, set: sset, device, k: 'iconColor', label: __( 'Colour', 'snn' ), kind: 'color' } ),
					  ]
					: null
			)
		);
	}

	/**
	 * The button on the canvas: the element (a with a link; a span stands in for button, so the text can be typed in),
	 * the text written in place and the icon on its side. No href: a click on the canvas selects, it does not go away.
	 */
	function Canvas( { a, tag, rootProps, set } ) {
		const root = rootProps || {};
		const linked = !! a.linkUrl;
		const shownTag = linked ? 'a' : tag === 'a' || tag === 'button' ? 'span' : tag;
		const own = {};
		if ( hasIcon( a.icon ) ) {
			if ( a.iconSpace ) {
				own.justifyContent = 'space-between';
			}
		}
		const icon = hasIcon( a.icon ) ? h( IconGlyph, { key: 'icon', icon: a.icon } ) : null;
		const text = h( RichText, {
			key: 'text',
			tagName: 'span',
			className: 'snn-button-text',
			value: a.text,
			onChange: ( v ) => set( { text: v } ),
			placeholder: __( 'Button', 'snn' ),
			allowedFormats: [ 'core/bold', 'core/italic' ],
			withoutInteractiveFormatting: true,
		} );
		return h(
			shownTag,
			{ ...root, style: { ...own, ...( root.style || {} ) }, className: [ root.className, 'snn-button-root' ].filter( Boolean ).join( ' ' ) },
			a.iconPosition === 'left' ? [ icon, text ] : [ text, icon ]
		);
	}

	snn.registerBlock( 'snn/button', { Pane, Canvas } );
} )( window.wp );
