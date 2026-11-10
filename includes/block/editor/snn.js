/**
 * The SNN editor namespace: the one global of the block editor, window.snn. It loads first (engine/editor-assets.php),
 * and every editor script of the blocks adds to it.
 *
 *   snn.data            what PHP sends (set by the inline script before this file runs):
 *                       controls, blockTools, animation, styleTable, icon, blocks (by folder), definitions (the block list)
 *   snn.controls        the shared controls (controls/controls.js)
 *   snn.tips            the tooltips (controls/tooltips.js)
 *   snn.blockTools      the Conditions, Interactions and Classes editors (controls/block-tools.js)
 *   snn.animationPane   the GSAP pane (controls/animation-pane.js)
 *   snn.iconPicker      the icon picker (controls/icon-picker.js)
 *   snn.linkFields      the Link group (controls/link-fields.js)
 *   snn.styleProps      the Style property checks and declarations (editor/style-props.js)
 *   snn.layoutIcons     the pictures of the layout choices (editor/layout-icons.js)
 *   snn.blocks          each block's editor parts, by block name: snn.registerBlock( 'snn/button', { Pane, Canvas } )
 */
( function ( root ) {
	const snn = ( root.snn = root.snn || {} );
	snn.data = snn.data || {};
	snn.blocks = snn.blocks || {};
	/** Adds a block's editor parts (Pane: the Content tab, Canvas: the block on the canvas). Parts given later are added to. */
	snn.registerBlock = function ( name, parts ) {
		snn.blocks[ name ] = Object.assign( {}, snn.blocks[ name ] || {}, parts );
	};
} )( typeof window !== 'undefined' ? window : globalThis );
