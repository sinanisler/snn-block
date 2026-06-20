<?php
/**
 * SNN Global Command Palette — Loader
 *
 * Enqueues the command palette CSS + JS on every page
 * (wp-admin AND frontend) for logged-in users.
 *
 * The palette (Ctrl+K) lets users:
 *   - Search & insert blocks (in the block editor)
 *   - Navigate to any admin page (posts, pages, settings, etc.)
 *   - Navigate from frontend to admin sections
 */

defined('ABSPATH') || exit;

/**
 * Enqueue styles — both admin and frontend.
 */
function snn_global_cp_enqueue_styles()
{
    $css_path = SNN_PATH . 'global/command-palette/command-palette.css';
    if (file_exists($css_path)) {
        wp_enqueue_style(
            'snn-global-command-palette',
            SNN_URL . 'global/command-palette/command-palette.css',
            [],
            wp_get_theme()->get('Version')
        );
    }
}
add_action('wp_enqueue_scripts', 'snn_global_cp_enqueue_styles');
add_action('admin_enqueue_scripts', 'snn_global_cp_enqueue_styles');

/**
 * Enqueue script — both admin and frontend.
 *
 * We do NOT list wp-blocks/wp-data as hard dependencies because those
 * aren't available on the frontend. Instead the JS checks for wp.*
 * at runtime and gracefully degrades (no block insertion on frontend,
 * only navigation commands).
 */
function snn_global_cp_enqueue_script()
{
    // Only for logged-in users.
    if (!is_user_logged_in()) {
        return;
    }

    $js_path = SNN_PATH . 'global/command-palette/command-palette.js';
    if (!file_exists($js_path)) {
        return;
    }

    $handle = 'snn-global-command-palette';
    $src    = SNN_URL . 'global/command-palette/command-palette.js';
    $ver    = wp_get_theme()->get('Version');

    // On admin, wp-* scripts are available. On frontend, they aren't.
    // We detect at runtime, so no hard deps needed — but on admin we
    // want our script to load after wp-blocks so getBlockTypes() works.
    $deps = [];
    if (is_admin()) {
        $deps = ['wp-blocks', 'wp-data', 'wp-block-editor'];
    }

    wp_enqueue_script($handle, $src, $deps, $ver, true);

    // Pass site URL and logout URL to the palette JS.
    wp_add_inline_script(
        $handle,
        'window.SNN_SITE_URL = ' . wp_json_encode(home_url()) . ';' .
        'window.SNN_LOGOUT_URL = ' . wp_json_encode(wp_logout_url()) . ';',
        'before'
    );
}
add_action('wp_enqueue_scripts', 'snn_global_cp_enqueue_script');
add_action('admin_enqueue_scripts', 'snn_global_cp_enqueue_script');
