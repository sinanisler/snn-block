<?php
/**
 * Block editor: the List View panel (the panel on the left of the editor).
 *
 * Width: WordPress sets this panel to 350px in its own stylesheet (.editor-list-view-sidebar, from a
 * 782px screen up). WordPress has no setting for it, and the panel cannot be resized by
 * dragging. This file sets the width to LIST_VIEW_WIDTH in the block editor only. The front
 * end is not affected. Below 782px the panel fills the screen, so no width is set there.
 *
 * Badges: an icon at the right of a block's row for each feature it uses (enqueue_badges).
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class SNN_Block_Editor_List_View {

	/** Width of the List View panel in pixels. */
	const LIST_VIEW_WIDTH = 300;

	public static function init() {
		add_action( 'enqueue_block_editor_assets', array( __CLASS__, 'enqueue' ) );
		add_action( 'enqueue_block_editor_assets', array( __CLASS__, 'enqueue_badges' ) );
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

	/**
	 * The badges: an icon at the right of a block's row for each feature it uses (Query loop, Conditions, Interactions,
	 * Animations), drawn by assets/list-view-badges.js with the block panel's own icons. It loads after the block tools
	 * and the animation pane, which give it those icons and the animation test.
	 */
	public static function enqueue_badges() {
		if ( ! current_user_can( 'edit_posts' ) ) {
			return;
		}
		$js  = 'includes/block/editor/list-view-badges.js';
		$css = '.snn-lv-badges{display:inline-flex;align-items:center;flex:0 0 auto;gap:2px;margin-inline-start:auto;padding-inline-end:4px;cursor:pointer}'
			. '.snn-lv-badge{display:inline-flex;align-items:center;justify-content:center;width:20px;height:20px;color:inherit}';

		wp_register_style( 'snn-list-view-badges', false, array( 'wp-editor' ) );
		wp_enqueue_style( 'snn-list-view-badges' );
		wp_add_inline_style( 'snn-list-view-badges', $css );
		wp_enqueue_script( 'snn-list-view-badges', SNN_URL . $js, array( 'wp-data', 'wp-element', 'wp-i18n', 'snn-block-tools', 'snn-animation-pane' ), SNN_Block_Tools::version( $js ), true );
		wp_set_script_translations( 'snn-list-view-badges', 'snn', SNN_PATH . 'languages' );
	}
}

SNN_Block_Editor_List_View::init();
