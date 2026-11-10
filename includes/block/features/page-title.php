<?php
/**
 * Hide Title: a switch in the Page tab of the post editor (between Parent and Move to trash) that hides the
 * post title in the canvas, so a design can be reviewed in full. The editor side is assets/page-title-switch.js.
 *
 * The choice is kept in the browser's localStorage, per post. It is not saved to the database.
 * Loaded from blocks.php. Always on.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class SNN_Page_Title {

	public static function init() {
		add_action( 'enqueue_block_editor_assets', array( __CLASS__, 'enqueue' ) );
	}

	/** The post editor only (post.php and post-new.php), not the Site Editor. */
	public static function enqueue() {
		global $pagenow;
		if ( ! in_array( $pagenow, array( 'post.php', 'post-new.php' ), true ) ) {
			return;
		}
		$js = 'includes/block/editor/page-title-switch.js';
		wp_enqueue_script(
			'snn-page-title-switch',
			SNN_URL . $js,
			array( 'wp-plugins', 'wp-edit-post', 'wp-editor', 'wp-element', 'wp-components', 'wp-data', 'wp-i18n' ),
			SNN_Block_Tools::version( $js ),
			true
		);
		wp_set_script_translations( 'snn-page-title-switch', 'snn', SNN_PATH . 'languages' );
	}
}

SNN_Page_Title::init();
