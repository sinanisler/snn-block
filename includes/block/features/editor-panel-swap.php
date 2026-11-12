<?php
/**
 * Block editor: swap the side panels.
 *
 * A button in the top-right toolbar, after the Global styles button (editor/panel-swap.js), puts the
 * List View and the inserter on the right of the canvas and Settings on the left. The swap is CSS only:
 * the editor body is one flex row (left panel, canvas, right panel), and the rules below set the flex
 * order of the two panels and flip their inner borders while the body has the class snn-panels-swapped.
 * The DOM is not moved. The choice is saved per browser in localStorage. Block editor only.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class SNN_Block_Editor_Panel_Swap {

	public static function init() {
		// Priority 20: after the Global styles script (priority 10), so this button is drawn after its button.
		add_action( 'enqueue_block_editor_assets', array( __CLASS__, 'enqueue' ), 20 );
	}

	public static function enqueue() {
		$on  = 'body.snn-panels-swapped ';
		$css = $on . '.interface-interface-skeleton__secondary-sidebar{order:3;border-right:0;border-left:1px solid #e0e0e0}'
			. $on . '.interface-interface-skeleton__content{order:2}'
			. $on . '.interface-interface-skeleton__sidebar{order:1;border-left:0;border-right:1px solid #e0e0e0}'
			. $on . '.editor-list-view-sidebar,' . $on . '.block-editor-inserter__menu{border:0}'
			. $on . '.snn-lv-resize{right:auto;left:-3px}'
			. '.snn-panel-swap-button.is-pressed{color:var(--wp-admin-theme-color,#3858e9)}';

		wp_register_style( 'snn-panel-swap', false, array( 'wp-editor' ) );
		wp_enqueue_style( 'snn-panel-swap' );
		wp_add_inline_style( 'snn-panel-swap', $css );

		$js   = 'includes/block/editor/panel-swap.js';
		$deps = array( 'wp-components', 'wp-dom-ready', 'wp-element', 'wp-i18n', 'wp-plugins' );
		if ( wp_script_is( 'snn-global-styles', 'enqueued' ) ) {
			$deps[] = 'snn-global-styles';
		}
		wp_enqueue_script( 'snn-panel-swap', SNN_URL . $js, $deps, SNN_Block_Tools::version( $js ), true );
		wp_set_script_translations( 'snn-panel-swap', 'snn', SNN_PATH . 'languages' );
	}
}

SNN_Block_Editor_Panel_Swap::init();
