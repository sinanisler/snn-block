/**
 * SNN block editor: the block styles in the canvas. The canvas is the editor's iframe, so a block's style.css is not
 * in the editor page. A block loads its own style.css into the canvas the first time it is drawn there (register.js calls
 * use()), and never twice. A block that is not on the page never loads its style.
 *
 * Loaded after snn.js, before the panel and the blocks.
 */
( function () {
	/** The canvas document: the editor's iframe, or the page itself when the editor draws without one. */
	function canvasDocument() {
		const frame = document.querySelector( 'iframe[name="editor-canvas"]' );
		return frame && frame.contentDocument ? frame.contentDocument : document;
	}

	/** Loads the style.css of one block type (its name, such as snn/section) into the canvas, once. */
	function use( name ) {
		const def = ( snn.data.definitions || [] ).find( ( d ) => d.name === name );
		if ( ! def || ! def.styleUrl ) {
			return;
		}
		const doc = canvasDocument();
		if ( ! doc.head || doc.querySelector( 'link[data-snn-style="' + name + '"]' ) ) {
			return;
		}
		const link = doc.createElement( 'link' );
		link.rel = 'stylesheet';
		link.href = def.styleUrl;
		link.setAttribute( 'data-snn-style', name );
		doc.head.appendChild( link );
	}

	snn.canvasStyles = { use };
} )();
