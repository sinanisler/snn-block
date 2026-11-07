<?php
/**
 * Block editor: the width of the List View panel (the panel on the left of the editor).
 *
 * WordPress sets this panel to 350px in its own stylesheet (.editor-list-view-sidebar, from a
 * 782px screen up). WordPress has no setting for it, and the panel cannot be resized by
 * dragging. This file sets the width to LIST_VIEW_WIDTH in the block editor only. The front
 * end is not affected. Below 782px the panel fills the screen, so no width is set there.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class SNN_Block_Editor_List_View {

	/** Width of the List View panel in pixels. */
	const LIST_VIEW_WIDTH = 300;

	public static function init() {
		add_action( 'enqueue_block_editor_assets', array( __CLASS__, 'enqueue' ) );
	}

	/**
	 * Adds the width rule to the editor page. The handle depends on the editor's own stylesheet,
	 * so this rule comes after WordPress's 350px rule and wins.
	 */
	public static function enqueue() {
		$width = (int) self::LIST_VIEW_WIDTH;
		$css   = '@media (min-width: 782px) { .editor-list-view-sidebar { width: ' . $width . 'px; } }';

		wp_register_style( 'snn-editor-list-view', false, array( 'wp-editor' ) );
		wp_enqueue_style( 'snn-editor-list-view' );
		wp_add_inline_style( 'snn-editor-list-view', $css );
	}
}

SNN_Block_Editor_List_View::init();
