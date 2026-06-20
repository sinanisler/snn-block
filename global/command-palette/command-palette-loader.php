<?php
/**
 * SNN Global Command Palette — Loader
 *
 * Enqueues CSS + JS on every page (admin + frontend) for logged-in users.
 *
 * The admin menu is output as a <script> tag in wp_footer / admin_footer:
 *   - On admin: reads $GLOBALS['menu']/$GLOBALS['submenu'] directly
 *   - On frontend: reads from cached option snn_admin_menu_structure
 *
 * Uses the existing snn_build_admin_menu_data() from other-settings.php.
 * Menu is cached to the DB on EVERY admin page load (late, in admin_footer).
 */

defined('ABSPATH') || exit;

/* ═══════════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════════ */

function snn_cp_flatten_menu(array $menu_data): array
{
    $items = [];
    foreach ($menu_data as $item) {
        $items[] = [
            'title'  => $item['title'],
            'href'   => $item['url'],
            'parent' => '',
            'icon'   => '',
        ];
        foreach (($item['submenus'] ?? []) as $sub) {
            $items[] = [
                'title'  => $sub['title'],
                'href'   => $sub['url'],
                'parent' => $item['title'],
                'icon'   => '',
            ];
        }
    }
    return $items;
}

/* ═══════════════════════════════════════════════
   OUTPUT MENU JSON IN THE FOOTER
   ═══════════════════════════════════════════════ */

/**
 * On admin: read real $menu/$submenu, cache it, output as JSON.
 */
function snn_cp_admin_footer_menu()
{
    if (!is_user_logged_in()) return;

    global $menu, $submenu;
    if (!isset($menu) || !is_array($menu)) return;

    $data = snn_build_admin_menu_data($menu, $submenu ?? []);
    if (empty($data)) return;

    // Cache for frontend use.
    update_option('snn_admin_menu_structure', $data, 'no');

    $flat = snn_cp_flatten_menu($data);
    $flat[] = ['title' => __('View Site'), 'href' => home_url(),       'parent' => '', 'icon' => 'external'];
    $flat[] = ['title' => __('Log Out'),   'href' => wp_logout_url(), 'parent' => '', 'icon' => 'logout'];

    echo '<script>window.SNN_ADMIN_MENU = ' . wp_json_encode($flat) . ';</script>';
}
add_action('admin_footer', 'snn_cp_admin_footer_menu');

/**
 * On frontend: read cached menu, output as JSON.
 */
function snn_cp_frontend_footer_menu()
{
    if (!is_user_logged_in()) return;

    $cached = get_option('snn_admin_menu_structure', []);
    if (empty($cached)) return; // nothing cached yet — silent, no menu shown

    $flat = snn_cp_flatten_menu($cached);
    $flat[] = ['title' => __('View Site'), 'href' => home_url(),       'parent' => '', 'icon' => 'external'];
    $flat[] = ['title' => __('Log Out'),   'href' => wp_logout_url(), 'parent' => '', 'icon' => 'logout'];

    echo '<script>window.SNN_ADMIN_MENU = ' . wp_json_encode($flat) . ';</script>';
}
add_action('wp_footer', 'snn_cp_frontend_footer_menu');

/* ═══════════════════════════════════════════════
   ENQUEUE CSS + JS
   ═══════════════════════════════════════════════ */

function snn_global_cp_enqueue_styles()
{
    $path = SNN_PATH . 'global/command-palette/command-palette.css';
    if (file_exists($path)) {
        wp_enqueue_style('snn-global-command-palette', SNN_URL . 'global/command-palette/command-palette.css', [], wp_get_theme()->get('Version'));
    }
}
add_action('wp_enqueue_scripts', 'snn_global_cp_enqueue_styles');
add_action('admin_enqueue_scripts', 'snn_global_cp_enqueue_styles');

function snn_global_cp_enqueue_script()
{
    if (!is_user_logged_in()) return;

    $path = SNN_PATH . 'global/command-palette/command-palette.js';
    if (!file_exists($path)) return;

    $handle = 'snn-global-command-palette';
    $deps   = is_admin() ? ['wp-blocks', 'wp-data', 'wp-block-editor'] : [];

    wp_enqueue_script($handle, SNN_URL . 'global/command-palette/command-palette.js', $deps, wp_get_theme()->get('Version'), true);

    // Pass site config (menu is set separately in the footer).
    wp_add_inline_script($handle,
        'window.SNN_SITE_URL   = ' . wp_json_encode(home_url()) . ';' .
        'window.SNN_ADMIN_URL  = ' . wp_json_encode(admin_url()) . ';' .
        'window.SNN_LOGOUT_URL = ' . wp_json_encode(wp_logout_url()) . ';',
        'before'
    );
}
add_action('wp_enqueue_scripts', 'snn_global_cp_enqueue_script');
add_action('admin_enqueue_scripts', 'snn_global_cp_enqueue_script');
