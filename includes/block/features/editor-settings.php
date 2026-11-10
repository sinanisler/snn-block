<?php
/**
 * Editor switches for the blocks. The same switches appear on the Block Editor Settings page
 * (includes/features/block-editor-settings.php) and in the global styles modal. Both read and
 * write one option, snn_block_editor_settings, so they can never disagree.
 *
 * Both switches are on by default. A switch that was never saved takes its default.
 *
 *  disable_core_blocks  Core blocks are not offered in the inserter. Content that already uses
 *                       them still shows and edits. Our own blocks are not affected. The dynamic
 *                       blocks (DYNAMIC below: template, content, title, archive) are never removed
 *                       by this switch.
 *  enable_top_toolbar   The top toolbar in the block editor, with all blocks and document tools
 *                       in one place.
 *  disable_fullscreen   Full screen mode is off in the block editor.
 *
 * Dynamic blocks have their own checkboxes (dynamic_blocks in the same option). A dynamic block is enabled
 * unless its checkbox was saved off, and it is never listed in the per-block list of the settings page.
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

	/**
	 * The dynamic blocks of templates and pages: the template, content, title and archive blocks, and the query,
	 * term and site blocks they are built from. Name => the title used when the registry has none.
	 */
	const DYNAMIC = array(
		'core/template-part'       => 'Template Part',
		'core/post-template'       => 'Post Template',
		'core/post-content'        => 'Content',
		'core/post-title'          => 'Title',
		'core/post-excerpt'        => 'Excerpt',
		'core/post-featured-image' => 'Featured Image',
		'core/post-date'           => 'Date',
		'core/post-author-name'    => 'Author Name',
		'core/post-terms'          => 'Post Terms',
		'core/query'               => 'Query Loop',
		'core/query-title'         => 'Query Title',
		'core/query-no-results'    => 'No Results',
		'core/query-pagination'    => 'Pagination',
		'core/term-name'           => 'Term Name',
		'core/term-description'    => 'Term Description',
		'core/site-title'          => 'Site Title',
		'core/site-logo'           => 'Site Logo',
		'core/site-tagline'        => 'Site Tagline',
	);

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

	/** The dynamic blocks: name => title (see DYNAMIC). */
	public static function dynamic_blocks() {
		return self::DYNAMIC;
	}

	/** The names of the dynamic blocks. */
	public static function dynamic_names() {
		return array_keys( self::DYNAMIC );
	}

	/**
	 * Whether a dynamic block is enabled. Its checkbox is on unless it was saved off, so a block that was never
	 * saved is enabled.
	 */
	public static function dynamic_enabled( $name ) {
		$raw = get_option( self::OPTION, array() );
		$raw = is_array( $raw ) ? $raw : array();
		$dyn = isset( $raw['dynamic_blocks'] ) && is_array( $raw['dynamic_blocks'] ) ? $raw['dynamic_blocks'] : array();
		return ! array_key_exists( $name, $dyn ) || ! empty( $dyn[ $name ] );
	}

	/**
	 * Core blocks are removed from the allowed list, when the switch is on. Blocks from other plugins and our own
	 * blocks stay. The dynamic blocks are not removed by the switch; a dynamic block is removed only when its own
	 * checkbox is off.
	 */
	public static function allowed_block_types( $allowed ) {
		if ( false === $allowed ) {
			return $allowed;
		}
		$core_off  = self::enabled( 'disable_core_blocks' );
		$dynamic   = self::dynamic_names();
		$unchecked = array_values( array_filter( $dynamic, function ( $name ) {
			return ! self::dynamic_enabled( $name );
		} ) );
		if ( ! $core_off && array() === $unchecked ) {
			return $allowed;
		}
		$names = true === $allowed
			? array_keys( WP_Block_Type_Registry::get_instance()->get_all_registered() )
			: (array) $allowed;
		return array_values( array_filter( $names, function ( $name ) use ( $core_off, $dynamic, $unchecked ) {
			$name = (string) $name;
			if ( in_array( $name, $unchecked, true ) ) {
				return false;
			}
			return ! ( $core_off && 0 === strpos( $name, 'core/' ) && ! in_array( $name, $dynamic, true ) );
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
