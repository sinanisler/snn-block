/**
 * TEMPLATE editor script for a new block (copy to blocks/<name>/editor.js). It is loaded in the block editor only.
 *
 * It registers two parts with window.snnBlockKinds (the model the editor uses now; Phase 2 moves it to snn.registerBlock):
 *   Pane    the Content tab of the panel (the block's own settings, as rows)
 *   Canvas  the block on the canvas: the element, with the text written in place if it has any
 *
 * The shared controls come from window.snnControls (controls/controls.js): Group, Row, TextField, Select, SwitchRow.
 * Keep the canvas in step with block.php (the front end).
 */
( function ( wp ) {
	const { createElement: h } = wp.element;
	const { __ } = wp.i18n;
	const { Group, Row, TextField } = window.snnControls;

	function Pane( { a, set } ) {
		return h(
			'div',
			{ className: 'snn-pane' },
			h(
				Group,
				{ title: __( 'Template', 'snn' ) },
				h(
					Row,
					{ label: __( 'Text', 'snn' ), changed: !! a.exampleText },
					h( TextField, { value: a.exampleText || '', label: __( 'Text', 'snn' ), onChange: ( v ) => set( { exampleText: v } ) } )
				)
			)
		);
	}

	/** The canvas: the element with the block's props (id, classes, style), and the text in it. */
	function Canvas( { a, tag, rootProps } ) {
		return wp.element.createElement( tag || 'div', rootProps || {}, a.exampleText || __( 'Template text', 'snn' ) );
	}

	window.snnBlockKinds = window.snnBlockKinds || {};
	window.snnBlockKinds.template = { Pane, Canvas };
} )( window.wp );
