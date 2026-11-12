<?php
/**
 * Block editor: the List View panel (the panel on the left of the editor).
 *
 * Width: WordPress sets this panel to 350px in its own stylesheet (.editor-list-view-sidebar, from a
 * 782px screen up) and has no way to resize it. This file sets the width from the CSS variable
 * --snn-lv-width (default LIST_VIEW_WIDTH), and editor/list-view-resize.js adds a drag handle on
 * the panel's right edge that sets it between 200px and 500px, saved per user. Block editor
 * only. Below 782px the panel fills the screen, so no width is set there.
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
		// Priority 20: after the editor scripts (SNN_Block_Editor_Assets::enqueue() at 10), so the joined script is enqueued first.
		add_action( 'enqueue_block_editor_assets', array( __CLASS__, 'enqueue_badges' ), 20 );
	}

	/**
	 * Adds the width rule to the editor page. The handle depends on the editor's own stylesheet,
	 * so this rule comes after WordPress's 350px rule and wins.
	 */
	public static function enqueue() {
		$width = (int) self::LIST_VIEW_WIDTH;
		$css   = '@media (min-width: 782px) {'
			. '.editor-list-view-sidebar{position:relative;width:var(--snn-lv-width,' . $width . 'px);min-width:200px;max-width:500px}'
			. '.snn-lv-resize{position:absolute;top:0;right:-3px;bottom:0;width:6px;z-index:5;cursor:col-resize;touch-action:none}'
			. '.snn-lv-resize::after{content:"";position:absolute;top:0;bottom:0;left:2px;width:2px;background:transparent;transition:background .15s}'
			. '.snn-lv-resize:hover::after,.snn-lv-resize:focus-visible::after,.snn-lv-resizing .snn-lv-resize::after{background:var(--wp-admin-theme-color,#3858e9)}'
			. '.snn-lv-resize:focus{outline:none}'
			. '.snn-lv-resizing{cursor:col-resize;user-select:none}'
			. '.snn-lv-resizing iframe{pointer-events:none}'
			. '}'
			. '@media (max-width: 781px) { .snn-lv-resize { display: none; } }';

		wp_register_style( 'snn-editor-list-view', false, array( 'wp-editor' ) );
		wp_enqueue_style( 'snn-editor-list-view' );
		wp_add_inline_style( 'snn-editor-list-view', $css );

		$js = 'includes/block/editor/list-view-resize.js';
		wp_enqueue_script( 'snn-list-view-resize', SNN_URL . $js, array( 'wp-data', 'wp-dom-ready', 'wp-i18n', 'wp-preferences' ), SNN_Block_Tools::version( $js ), true );
		wp_set_script_translations( 'snn-list-view-resize', 'snn', SNN_PATH . 'languages' );
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
		// The block tools and the animation pane are in the joined editor script when it is enqueued; otherwise they are their own handles.
		$deps = array( 'wp-data', 'wp-element', 'wp-i18n' );
		if ( wp_script_is( SNN_Block_Editor_Assets::BUNDLE, 'enqueued' ) ) {
			$deps[] = SNN_Block_Editor_Assets::BUNDLE;
		} else {
			$deps = array_merge( $deps, array( 'snn-block-tools', 'snn-animation-pane' ) );
		}
		wp_enqueue_script( 'snn-list-view-badges', SNN_URL . $js, $deps, SNN_Block_Tools::version( $js ), true );
		wp_set_script_translations( 'snn-list-view-badges', 'snn', SNN_PATH . 'languages' );
	}
}

SNN_Block_Editor_List_View::init();
