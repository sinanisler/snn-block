<?php
/**
 * Clean slate: removes the WordPress core defaults that the block theme and the
 * block editor add on their own. Always on (not a feature toggle), because the
 * point is a predictable base for the SNN foundation blocks.
 *
 * Removed, block editor and front end:
 * - Core theme.json defaults: the default palette, gradients, duotone, font sizes,
 *   spacing sizes, shadow presets, aspect ratios, button and element colours, block
 *   settings and styles, and the spacing scale.
 * - Core block style variations (outline button, rounded image, plain quote, dots
 *   separator, and so on).
 * - The core block pattern directory and the remote pattern lookup.
 *
 * Removed, front end:
 * - The emoji detection script and emoji styles.
 * - Speculative loading (the prefetch script for same-site links).
 *
 * Kept on purpose: the CSS of each core block in use, the shared block-library CSS
 * (utility classes such as .screen-reader-text), core's skip link (accessibility;
 * core manages it), the font library's @font-face output, and the site's own global
 * styles (the wp_global_styles post, which holds the font library's fonts). Our own
 * global style system replaces the defaults later.
 *
 * Decisions and measurements: docs/research/clean-slate-2026-11-05.md
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

// Core theme.json defaults: the theme's base data starts empty, so no core palette,
// font sizes, spacing, shadows, duotone, aspect ratios, or element and block styles.
add_filter( 'wp_theme_json_data_default', 'snn_clean_slate_core_theme_json' );
function snn_clean_slate_core_theme_json( $theme_json ) {
	return new WP_Theme_JSON_Data( array( 'version' => 3 ), 'default' );
}

// Core block style variations (the Styles panel in the inserter and the sidebar).
add_action( 'init', 'snn_clean_slate_core_block_styles', 100 );
function snn_clean_slate_core_block_styles() {
	foreach ( WP_Block_Type_Registry::get_instance()->get_all_registered() as $name => $block_type ) {
		if ( 0 !== strpos( $name, 'core/' ) ) {
			continue;
		}
		foreach ( (array) $block_type->styles as $style ) {
			$style_name = is_array( $style ) ? ( $style['name'] ?? '' ) : (string) $style;
			if ( '' !== $style_name && WP_Block_Styles_Registry::get_instance()->is_registered( $name, $style_name ) ) {
				unregister_block_style( $name, $style_name );
			}
		}
		$block_type->styles = array();
	}
}

// Block editor: the editor's JavaScript store starts with legacy palette, gradient and
// font size lists (kept for backward compatibility). Send empty lists unless the server
// has already set them, so the store default cannot fill them back in.
add_filter( 'block_editor_settings_all', 'snn_clean_slate_editor_settings', 20 );
function snn_clean_slate_editor_settings( $settings ) {
	foreach ( array( 'colors', 'gradients', 'fontSizes' ) as $key ) {
		if ( ! isset( $settings[ $key ] ) ) {
			$settings[ $key ] = array();
		}
	}
	return $settings;
}

// Core block patterns, and the remote pattern directory that the inserter loads.
remove_theme_support( 'core-block-patterns' );
add_filter( 'should_load_remote_block_patterns', '__return_false' );

// Front end: emoji detection script and styles.
remove_action( 'wp_head', 'print_emoji_detection_script', 7 );
remove_action( 'wp_enqueue_scripts', 'wp_enqueue_emoji_styles' );
remove_action( 'wp_print_styles', 'print_emoji_styles' );

// Front end: speculative loading (the speculationrules prefetch script).
add_filter( 'wp_speculation_rules_configuration', '__return_null' );
