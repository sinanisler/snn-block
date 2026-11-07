<?php
/**
 * Editor switches for the blocks. The same switches appear on the Block Editor Settings page
 * (includes/features/block-editor-settings.php) and in the global styles modal. Both read and
 * write one option, snn_block_editor_settings, so they can never disagree.
 *
 * Both switches are on by default. A switch that was never saved takes its default.
 *
 *  disable_core_blocks  Core blocks are not offered in the inserter. Content that already uses
 *                       them still shows and edits. Our own blocks are not affected.
 *  enable_top_toolbar   The top toolbar in the block editor, with all blocks and document tools
 *                       in one place.
 *  disable_fullscreen   Full screen mode is off in the block editor.
 *
 * Always on (not behind the feature toggle), so the switches work whether or not the settings
 * page feature is switched on.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class SNN_Block_Editor_Settings {

	const OPTION   = 'snn_block_editor_settings';
	const SWITCHES = array( 'disable_core_blocks', 'enable_top_toolbar', 'disable_fullscreen' );

	public static function init() {
		add_filter( 'allowed_block_types_all', array( __CLASS__, 'allowed_block_types' ), 30 );
		add_action( 'enqueue_block_editor_assets', array( __CLASS__, 'enqueue_toolbar' ) );
		add_action( 'enqueue_block_editor_assets', array( __CLASS__, 'enqueue_fullscreen' ) );
	}

	/** All switches on. */
	public static function defaults() {
		return array(
			'disable_core_blocks' => true,
			'enable_top_toolbar'  => true,
			'disable_fullscreen'  => true,
		);
	}

	/** Whether a switch is on. A switch that was never saved takes its default. */
	public static function enabled( $key ) {
		$raw = get_option( self::OPTION, array() );
		$raw = is_array( $raw ) ? $raw : array();
		if ( ! array_key_exists( $key, $raw ) ) {
			return ! empty( self::defaults()[ $key ] );
		}
		return ! empty( $raw[ $key ] );
	}

	/** The two switches, as booleans. */
	public static function values() {
		$out = array();
		foreach ( self::SWITCHES as $key ) {
			$out[ $key ] = self::enabled( $key );
		}
		return $out;
	}

	/**
	 * Save the switches. Keys that are not given keep their value, and every other key of the
	 * option (the per-block list of the settings page, for example) is left as it is.
	 */
	public static function save( array $switches ) {
		$raw = get_option( self::OPTION, array() );
		$raw = is_array( $raw ) ? $raw : array();
		foreach ( self::SWITCHES as $key ) {
			if ( array_key_exists( $key, $switches ) ) {
				$raw[ $key ] = $switches[ $key ] ? '1' : '0';
			}
		}
		update_option( self::OPTION, $raw );
	}

	/**
	 * Core blocks are removed from the allowed list, when the switch is on. Blocks from
	 * other plugins and our own blocks stay.
	 */
	public static function allowed_block_types( $allowed ) {
		if ( false === $allowed || ! self::enabled( 'disable_core_blocks' ) ) {
			return $allowed;
		}
		$names = true === $allowed
			? array_keys( WP_Block_Type_Registry::get_instance()->get_all_registered() )
			: (array) $allowed;
		return array_values( array_filter( $names, function ( $name ) {
			return 0 !== strpos( (string) $name, 'core/' );
		} ) );
	}

	/** Full screen mode is turned off in the editor, when the switch is on. */
	public static function enqueue_fullscreen() {
		if ( ! self::enabled( 'disable_fullscreen' ) ) {
			return;
		}
		wp_add_inline_script(
			'wp-blocks',
			'window.addEventListener( "load", function () {' .
			' if ( window.wp && wp.data && wp.data.select( "core/edit-post" ).isFeatureActive( "fullscreenMode" ) ) {' .
			' wp.data.dispatch( "core/edit-post" ).toggleFeature( "fullscreenMode" ); } } );'
		);
	}

	/** The top toolbar is set on in the editor, when the switch is on. */
	public static function enqueue_toolbar() {
		if ( ! self::enabled( 'enable_top_toolbar' ) ) {
			return;
		}
		wp_add_inline_script(
			'wp-blocks',
			'window.addEventListener( "load", function () {' .
			' if ( window.wp && wp.data && ! wp.data.select( "core/preferences" ).get( "core", "fixedToolbar" ) ) {' .
			' wp.data.dispatch( "core/preferences" ).set( "core", "fixedToolbar", true ); } } );'
		);
	}
}

SNN_Block_Editor_Settings::init();
