/**
 * SNN block editor: the Text block: its rich text on the canvas and the bar above it (formats, highlight, image, dynamic data, variables).
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
	const { VARIABLE_GROUPS } = snn.panel;

	// The Text block's toolbar. Core's bar draws Bold, Italic and Link first, then the named slot "unknown", then its
	// More dropdown. The buttons below are filled into that "unknown" slot, so they sit after Link and before the dropdown.
	// The formats in TEXT_BAR_NAMES are left out of core's list (textAllowedFormats), so core draws no button for them.
	// Inline code, Keyboard input, Language and Math stay in the dropdown.
	const fillIcon = ( d ) => h( 'svg', { width: 24, height: 24, viewBox: '0 0 24 24', 'aria-hidden': true, focusable: 'false', fill: 'currentColor' }, h( 'path', { d } ) );

	const HIGHLIGHT_ICON = fillIcon( 'M12 3.5 6.5 11.2a6 6 0 1 0 11 0z' );

	const BOLT_ICON = fillIcon( 'M13 2 3 14h7l-1 8 10-12h-7z' ); // the dynamic data mark, as on the fields' lightning button

	const IMAGE_ICON = fillIcon( 'M4 18.5h16V17H4v1.5zM16 13v1.5h4V13h-4zM5.1 15h7.8c.6 0 1.1-.5 1.1-1.1V6.1c0-.6-.5-1.1-1.1-1.1H5.1C4.5 5 4 5.5 4 6.1v7.8c0 .6.5 1.1 1.1 1.1zm.4-8.5h7V10l-1-1c-.3-.3-.8-.3-1 0l-1.6 1.5-1.2-.7c-.3-.2-.6-.2-.9 0l-1.3 1V6.5zm0 6.1l1.8-1.3 1.3.8c.3.2.7.2.9-.1l1.5-1.4 1.5 1.4v1.5h-7v-.9z' );

	// Toggle buttons, in the order they appear after Link. Highlight and Inline image are below, they need a picker.
	const TEXT_BAR_FORMATS = [
		{ name: 'core/strikethrough', label: __( 'Strikethrough', 'snn' ), glyph: h( 's', null, 'S' ) },
		{ name: 'core/subscript', label: __( 'Subscript', 'snn' ), glyph: h( Fragment, null, 'X', h( 'sub', null, '2' ) ) },
		{ name: 'core/superscript', label: __( 'Superscript', 'snn' ), glyph: h( Fragment, null, 'X', h( 'sup', null, '2' ) ) },
	];

	const TEXT_BAR_NAMES = [ 'core/strikethrough', 'core/subscript', 'core/superscript', 'core/text-color', 'core/image' ];

	// Every registered format except TEXT_BAR_NAMES, so core still draws its dropdown and keeps the shortcuts.
	function textAllowedFormats() {
		return wp.data.select( wp.richText.store ).getFormatTypes().map( ( f ) => f.name ).filter( ( n ) => ! TEXT_BAR_NAMES.includes( n ) );
	}

	// Highlight is a background colour (core's "Highlight" format, core/text-color, written as style="background-color:…").
	// The palette is the theme's colours; "Remove highlight" clears the selection.
	function HighlightPicker( { value, onChange } ) {
		const colors = useSelect( ( select ) => select( 'core/block-editor' ).getSettings().colors || [], [] );
		const active = getActiveFormat( value, 'core/text-color' );
		const match = active && active.attributes && active.attributes.style ? active.attributes.style.match( /background-color:\s*([^;]+)/ ) : null;
		const current = match ? match[ 1 ].trim() : undefined;
		const pick = ( color ) => onChange( color ? applyFormat( value, { type: 'core/text-color', attributes: { style: 'background-color:' + color } } ) : removeFormat( value, 'core/text-color' ) );
		return h( 'div', { className: 'snn-text-highlight-picker', style: { padding: 8 } },
			// With no theme colours the palette is empty, so the full colour picker (with a hex field) is shown instead.
			colors.length
				? h( ColorPalette, { colors, value: current, onChange: pick } )
				: h( ColorPicker, { color: current, onChange: pick, enableAlpha: true } ),
			h( Button, { variant: 'tertiary', size: 'compact', disabled: ! active, onClick: () => onChange( removeFormat( value, 'core/text-color' ) ) }, __( 'Remove highlight', 'snn' ) )
		);
	}

	// The buttons for the "unknown" slot: the toggles, Highlight (with its palette) and Inline image (with the media library).
	function TextBarButtons( { value, onChange, onFocus } ) {
		const [ highlightOpen, setHighlightOpen ] = useState( false );
		const highlightRef = useRef( null );
		// Puts text in at the cursor: the rich text's selection (value.start and value.end). Selected text is replaced.
		const insertText = ( text ) => {
			onChange( insert( value, create( { text } ) ) );
			onFocus();
		};
		return h( Fragment, null,
			TEXT_BAR_FORMATS.map( ( f ) => h( ToolbarButton, {
				key: f.name,
				label: f.label,
				icon: f.icon,
				isPressed: !! getActiveFormat( value, f.name ),
				onClick: () => {
					onChange( toggleFormat( value, { type: f.name } ) );
					onFocus();
				},
			}, f.glyph ) ),
			// The span is the anchor for the popover (the toolbar button does not pass its ref on).
			h( 'span', { ref: highlightRef, style: { display: 'inline-flex' } },
				h( ToolbarButton, {
					label: __( 'Highlight', 'snn' ),
					icon: HIGHLIGHT_ICON,
					isPressed: !! getActiveFormat( value, 'core/text-color' ),
					onClick: () => setHighlightOpen( ! highlightOpen ),
				} ),
				highlightOpen && h( Popover, {
					anchor: highlightRef.current,
					placement: 'bottom',
					focusOnMount: false,
					onClose: () => setHighlightOpen( false ),
				}, h( HighlightPicker, { value, onChange } ) )
			),
			h( MediaUploadCheck, null, h( MediaUpload, {
				allowedTypes: [ 'image' ],
				onSelect: ( media ) => {
					onChange( insertObject( value, { type: 'core/image', attributes: { className: 'wp-image-' + media.id, style: 'width: ' + Math.min( media.width || 150, 150 ) + 'px;', url: media.url, alt: media.alt } } ) );
					onFocus();
				},
				render: ( { open } ) => h( ToolbarButton, { label: __( 'Inline image', 'snn' ), icon: IMAGE_ICON, onClick: open } ),
			} ) ),
			// The dynamic data list and the variable list. A pick goes in at the cursor. A variable goes in as its var() text.
			h( ToolbarPicker, { kind: 'tags', label: __( 'Dynamic data', 'snn' ), icon: BOLT_ICON, ToolbarButton, onPick: insertText } ),
			h( ToolbarPicker, { kind: 'vars', label: __( 'Variables', 'snn' ), glyph: h( 'span', { className: 'snn-tool-text', 'aria-hidden': 'true' }, 'V' ), groups: VARIABLE_GROUPS, ToolbarButton, onPick: insertText } )
		);
	}

	/**
	 * The canvas of the Text block: the rich text is the block's element, with its tag, and the bar above it (the formats,
	 * the highlight, the image, the dynamic data and the variables) is filled into core's bar (see TextBarButtons).
	 */
	function TextCanvas( { a, set, rootProps } ) {
		return h( RichText, {
			...( rootProps || {} ),
			tagName: a.tagName,
			value: a.content,
			onChange: ( v ) => set( { content: v } ),
			placeholder: __( 'Type text', 'snn' ),
			allowedFormats: textAllowedFormats(),
			// The render prop gives the rich text value while the block is selected. The buttons are filled into
			// core's "unknown" slot (see TextBarButtons), which sits after Bold, Italic and Link.
			children: ( { value, onChange, onFocus } ) => h( Fill, { name: 'RichText.ToolbarControls.unknown' }, h( TextBarButtons, { value, onChange, onFocus } ) ),
		} );
	}

	snn.registerBlock( 'snn/text', { Canvas: TextCanvas } );
} )( window.wp );
