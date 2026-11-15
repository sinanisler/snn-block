/**
 * TEMPLATE editor script for a new block (copy to blocks/<name>/editor.js). It is loaded in the block editor only.
 *
 * It registers two parts with snn.registerBlock( 'snn/template', { Pane, Canvas } ):
 *   Pane    the Content tab of the panel (the block's own settings, as rows)
 *   Canvas  the block on the canvas: the element, with the text written in place if it has any
 *
 * The shared controls come from snn.controls (controls/controls.js): Group, Row, TextField, Select, SwitchRow.
 * The shared panel parts come from snn.panel: TagRow (the HTML tag, from the definition's tags), isChanged (the blue dot,
 * against the registered default), ViewValue (a style value per view) and ContentRest (inert while the hover state is on).
 * The media parts (picture slot, media library, photo search) come from snn.media (controls/media.js).
 *
 * The Pane gets: a (the attributes), set (typing), pick (a discrete change: a choice, a switch, an icon; one undo step),
 * def (the definition), base (the registered defaults), context (the values of the definition's context names, from the
 * blocks around it), and for style values styleA, styleSet, device and hovering. The Canvas gets context too.
 *
 * Keep the canvas in step with block.php (the front end).
 */
( function ( wp ) {
	const { createElement: h } = wp.element;
	const { __ } = wp.i18n;
	const { Group, Row, TextField } = snn.controls;

	function Pane( { a, set, pick, def, base, hovering } ) {
		const { TagRow, isChanged, ContentRest: Rest } = snn.panel;
		return h(
			'div',
			{ className: 'snn-pane' },
			h(
				Rest,
				{ hovering },
				h(
					Group,
					{ title: __( 'Template', 'snn' ) },
					h(
						Row,
						{ label: __( 'Text', 'snn' ), changed: isChanged( a, base, 'exampleText' ) },
						h( TextField, { value: a.exampleText || '', label: __( 'Text', 'snn' ), onChange: ( v ) => set( { exampleText: v } ) } )
					),
					h( TagRow, { a, set: pick, def } )
				)
			)
		);
	}

	/** The canvas: the element with the block's props (id, classes, style), and the text in it. */
	function Canvas( { a, tag, rootProps } ) {
		return wp.element.createElement( tag || 'div', rootProps || {}, a.exampleText || __( 'Template text', 'snn' ) );
	}

	snn.registerBlock( 'snn/template', { Pane, Canvas } );
} )( window.wp );
