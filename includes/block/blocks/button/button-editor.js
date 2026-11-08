/**
 * SNN Button block, the editor side: the Content tab (Text, HTML tag, Link and Icon, as the Bricks button) and the
 * button on the canvas, with its text written in place. The front end is ./button.php: keep the two in step.
 *
 * Loaded after controls.js, icon-picker.js and link-fields.js, before layout-blocks.js, which puts Pane in the Content
 * tab and Canvas in the element (window.snnBlockKinds.button).
 */
( function ( wp ) {
	const { createElement: h } = wp.element;
	const { __ } = wp.i18n;
	const { RichText } = wp.blockEditor;
	const { Group, Row, SwitchRow, Select, TextField } = window.snnControls;
	const { IconField, IconGlyph, hasIcon } = window.snnIconPicker;
	const { LinkGroup } = window.snnLinkFields;
	const check = ( type, v ) => window.snnStyleProps.check( type, v );
	const vars = () => ( window.snnControlsData && window.snnControlsData.variables ) || [];

	const TAG_OPTIONS = [ 'span', 'button', 'div' ].map( ( v ) => ( { value: v, label: v } ) );
	const POSITION_OPTIONS = [
		{ value: 'right', label: __( 'Right', 'snn' ) },
		{ value: 'left', label: __( 'Left', 'snn' ) },
	];

	/** The icon's size and colour, as icons.php writes them. */
	function iconStyle( size, color ) {
		const s = check( 'size', size );
		const c = check( 'color', color );
		return { fontSize: s || undefined, color: c || undefined, fill: c || undefined };
	}

	function Pane( { a, set } ) {
		const icon = hasIcon( a.icon );
		return h(
			'div',
			{ className: 'snn-pane' },
			h(
				Group,
				{ title: __( 'Button', 'snn' ) },
				h(
					Row,
					{ label: __( 'Text', 'snn' ), changed: a.text !== 'Button' },
					h( TextField, { value: a.text || '', label: __( 'Text', 'snn' ), onChange: ( v ) => set( { text: v } ) } )
				),
				// With a link the element is an a, so the tag is hidden, as Bricks does.
				a.linkUrl
					? null
					: h(
							Row,
							{ label: __( 'HTML tag', 'snn' ), changed: a.tagName !== 'span' },
							h( Select, { value: a.tagName === 'a' ? 'span' : a.tagName, options: TAG_OPTIONS, label: __( 'HTML tag', 'snn' ), onChange: ( v ) => set( { tagName: v } ) } )
					  )
			),
			h( LinkGroup, { a, set } ),
			h(
				Group,
				{ title: __( 'Icon', 'snn' ) },
				h( Row, { label: __( 'Icon', 'snn' ), changed: icon }, h( IconField, { value: a.icon, onChange: ( v ) => set( { icon: v } ) } ) ),
				icon
					? [
							h(
								Row,
								{ key: 'pos', label: __( 'Position', 'snn' ), changed: a.iconPosition !== 'right' },
								h( Select, { value: a.iconPosition, options: POSITION_OPTIONS, label: __( 'Position', 'snn' ), onChange: ( v ) => set( { iconPosition: v } ) } )
							),
							h(
								Row,
								{ key: 'gap', label: __( 'Gap', 'snn' ), changed: !! a.iconGap },
								h( TextField, { value: a.iconGap || '', label: __( 'Gap', 'snn' ), unit: 'px', kind: 'size', variables: vars(), placeholder: '0.5em', onChange: ( v ) => set( { iconGap: v } ) } )
							),
							h( SwitchRow, { key: 'space', label: __( 'Space between', 'snn' ), checked: !! a.iconSpace, onChange: ( v ) => set( { iconSpace: v } ) } ),
							h(
								Row,
								{ key: 'size', label: __( 'Size', 'snn' ), changed: !! a.iconSize },
								h( TextField, { value: a.iconSize || '', label: __( 'Icon size', 'snn' ), unit: 'px', kind: 'size', variables: vars(), onChange: ( v ) => set( { iconSize: v } ) } )
							),
							h(
								Row,
								{ key: 'color', label: __( 'Colour', 'snn' ), changed: !! a.iconColor },
								h( TextField, { value: a.iconColor || '', label: __( 'Icon colour', 'snn' ), kind: 'color', swatch: true, variables: vars(), onChange: ( v ) => set( { iconColor: v } ) } )
							),
					  ]
					: null
			)
		);
	}

	/**
	 * The button on the canvas: the element (a with a link; a span stands in for button, so the text can be typed in),
	 * the text written in place and the icon on its side. No href: a click on the canvas selects, it does not go away.
	 */
	function Canvas( { a, tag, style, className, set } ) {
		const linked = !! a.linkUrl;
		const shownTag = linked ? 'a' : tag === 'a' || tag === 'button' ? 'span' : tag;
		const own = {};
		if ( hasIcon( a.icon ) ) {
			const gap = check( 'size', a.iconGap );
			if ( gap ) {
				own.gap = gap;
			}
			if ( a.iconSpace ) {
				own.justifyContent = 'space-between';
			}
		}
		const icon = hasIcon( a.icon ) ? h( IconGlyph, { key: 'icon', icon: a.icon, style: iconStyle( a.iconSize, a.iconColor ) } ) : null;
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
			{ style: { ...own, ...style }, className: [ 'snn-button-root', className ].filter( Boolean ).join( ' ' ) },
			a.iconPosition === 'left' ? [ icon, text ] : [ text, icon ]
		);
	}

	window.snnBlockKinds = window.snnBlockKinds || {};
	window.snnBlockKinds.button = { Pane, Canvas };
} )( window.wp );
