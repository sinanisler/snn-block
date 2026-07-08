<?php
/**
 * Global Style Editor — Settings, API, and Editor Integration
 *
 * Handles:
 * 1. Database registration for global styles, variables, and block defaults
 * 2. REST API integration via wp/v2/settings
 * 3. Injecting global color variables into the block editor's color palette
 * 4. Applying block defaults via register_block_type_args filter
 * 5. Enqueuing Global Style Editor assets
 */

if (!defined('ABSPATH')) exit;

/* ═══════════════════════════════════════════════
   1. REGISTER SETTINGS
   ═══════════════════════════════════════════════ */

add_action('init', function () {
    // Global CSS Classes (existing — migrated from localStorage to DB)
    register_setting('snn_global_style_editor', 'snn_global_styles', [
        'type' => 'array',
        'default' => [],
        'description' => __('Global CSS class styles', 'snn-block'),
        'show_in_rest' => [
            'schema' => [
                'type' => 'array',
                'items' => [
                    'type' => 'object',
                    'properties' => [
                        'id'       => ['type' => ['integer', 'number']],
                        'selector' => ['type' => 'string'],
                        'css'      => ['type' => 'string'],
                        'created'  => ['type' => 'string'],
                        'modified' => ['type' => 'string'],
                    ],
                ],
            ],
        ],
    ]);

    // Global CSS Variables (new)
    register_setting('snn_global_style_editor', 'snn_global_variables', [
        'type' => 'array',
        'default' => [],
        'description' => __('Global CSS variables / design tokens', 'snn-block'),
        'show_in_rest' => [
            'schema' => [
                'type' => 'array',
                'items' => [
                    'type' => 'object',
                    'properties' => [
                        'id'    => ['type' => ['integer', 'number']],
                        'name'  => ['type' => 'string'],   // e.g. "--color-primary"
                        'value' => ['type' => 'string'],    // e.g. "#007cba"
                        'type'  => ['type' => 'string', 'enum' => ['color', 'size', 'font', 'number', 'string']],
                        'label' => ['type' => 'string'],
                        'created'  => ['type' => 'string'],
                        'modified' => ['type' => 'string'],
                    ],
                ],
            ],
        ],
    ]);

    // Block Defaults (new) — stores per-block default attribute overrides
    register_setting('snn_global_style_editor', 'snn_block_defaults', [
        'type' => 'object',
        'default' => (object) [],
        'description' => __('Default attribute overrides per block type', 'snn-block'),
        'show_in_rest' => [
            'schema' => [
                'type' => 'object',
                'additionalProperties' => true,
                'description' => 'Object keyed by block name, values are attribute override objects',
            ],
        ],
    ]);
});

/* ═══════════════════════════════════════════════
   2. INJECT GLOBAL COLOR VARIABLES INTO EDITOR
   ═══════════════════════════════════════════════ */

add_filter('block_editor_settings_all', function ($settings, $context) {
    $variables = get_option('snn_global_variables', []);
    if (empty($variables) || !is_array($variables)) {
        return $settings;
    }

    // Extract color variables
    $colorVars = array_filter($variables, function ($v) {
        return isset($v['type']) && $v['type'] === 'color' && !empty($v['value']);
    });

    if (empty($colorVars)) {
        return $settings;
    }

    // Build color palette entries from variables
    $customColors = [];
    foreach ($colorVars as $var) {
        $slug = sanitize_title(preg_replace('/^--snn-/', '', $var['name']));
        $customColors[] = [
            'name'  => !empty($var['label']) ? $var['label'] : $var['name'],
            'slug'  => 'snn-' . $slug,
            'color' => $var['value'],
        ];
    }

    // Inject into the theme color palette so all ColorPalette controls see them
    if (!isset($settings['__experimentalFeatures'])) {
        $settings['__experimentalFeatures'] = [];
    }
    if (!isset($settings['__experimentalFeatures']['color'])) {
        $settings['__experimentalFeatures']['color'] = [];
    }
    if (!isset($settings['__experimentalFeatures']['color']['palette'])) {
        $settings['__experimentalFeatures']['color']['palette'] = [];
    }

    // Add as a "theme" palette so they appear in all ColorPalette components
    $settings['__experimentalFeatures']['color']['palette']['theme'] = array_merge(
        isset($settings['__experimentalFeatures']['color']['palette']['theme'])
            ? $settings['__experimentalFeatures']['color']['palette']['theme']
            : [],
        $customColors
    );

    return $settings;
}, 10, 2);

/* ═══════════════════════════════════════════════
   3. APPLY BLOCK DEFAULTS VIA REGISTRATION FILTER
   ═══════════════════════════════════════════════ */

add_filter('register_block_type_args', function ($args, $block_name) {
    $defaults = get_option('snn_block_defaults', []);
    if (empty($defaults) || !is_array($defaults) || !isset($defaults[$block_name])) {
        return $args;
    }

    $overrides = $defaults[$block_name];
    if (empty($overrides) || !is_array($overrides)) {
        return $args;
    }

    foreach ($overrides as $attr_name => $attr_default) {
        if (isset($args['attributes'][$attr_name])) {
            // Only override if the attribute has a 'default' key
            if (array_key_exists('default', $args['attributes'][$attr_name])) {
                $args['attributes'][$attr_name]['default'] = $attr_default;
            }
        }
    }

    return $args;
}, 20, 2);

/* ═══════════════════════════════════════════════
   4. OUTPUT GLOBAL CSS VARIABLES AS <style> TAG
   ═══════════════════════════════════════════════ */

add_action('wp_head', 'snn_output_global_variables_style', 5);
add_action('admin_head', 'snn_output_global_variables_style', 5);

function snn_output_global_variables_style() {
    $variables = get_option('snn_global_variables', []);
    if (empty($variables) || !is_array($variables)) {
        return;
    }

    $css_vars = [];
    foreach ($variables as $var) {
        if (!empty($var['name']) && isset($var['value'])) {
            $name  = sanitize_text_field($var['name']);
            $value = sanitize_text_field($var['value']);
            // Basic CSS value sanitization
            $value = preg_replace('/[^a-zA-Z0-9#\s\-_.,%()\'"\/:;]/', '', $value);
            $css_vars[] = "{$name}: {$value};";
        }
    }

    if (!empty($css_vars)) {
        echo '<style id="snn-global-variables">' . "\n";
        echo ':root {' . "\n";
        echo '  ' . implode("\n  ", $css_vars) . "\n";
        echo '}' . "\n";
        echo '</style>' . "\n";
    }
}

/* ═══════════════════════════════════════════════
   5. OUTPUT GLOBAL CSS CLASSES AS <style> TAG
   ═══════════════════════════════════════════════ */

add_action('wp_head', 'snn_output_global_classes_style', 10);
add_action('admin_head', 'snn_output_global_classes_style', 10);

function snn_output_global_classes_style() {
    $styles = get_option('snn_global_styles', []);
    if (empty($styles) || !is_array($styles)) {
        return;
    }

    $css_blocks = [];
    foreach ($styles as $style) {
        if (!empty($style['selector']) && !empty($style['css'])) {
            $selector = sanitize_text_field($style['selector']);
            $css      = sanitize_text_field($style['css']);
            // Sanitize CSS content
            $css = preg_replace('/[^a-zA-Z0-9#\s\-_.,%()\'"\/:;!@]/', '', $css);
            $css_blocks[] = "{$selector} {{$css}}";
        }
    }

    if (!empty($css_blocks)) {
        echo '<style id="snn-global-classes">' . "\n";
        echo implode("\n", $css_blocks) . "\n";
        echo '</style>' . "\n";
    }
}

/* ═══════════════════════════════════════════════
   6. ENQUEUE GLOBAL STYLE EDITOR ASSETS
   ═══════════════════════════════════════════════ */

add_action('enqueue_block_editor_assets', function () {
    // Get saved data for initial client-side state
    $global_styles    = get_option('snn_global_styles', []);
    $global_variables = get_option('snn_global_variables', []);
    $block_defaults   = get_option('snn_block_defaults', []);

    // Pass data to JS via wp_add_inline_script
    $inline_data = json_encode([
        'globalStyles'    => $global_styles,
        'globalVariables' => $global_variables,
        'blockDefaults'   => (object) $block_defaults,
    ]);

    // ── Enqueue Global Editor App Styles ──
    $app_css_path = SNN_PATH . 'editor/global-style/snn-global-editor-app.css';
    if (file_exists($app_css_path)) {
        wp_enqueue_style(
            'snn-global-editor-app-styles',
            SNN_URL . 'editor/global-style/snn-global-editor-app.css',
            [],
            wp_get_theme()->get('Version')
        );
    }

    // ── Enqueue Global Editor App ──
    $app_js_path = SNN_PATH . 'editor/global-style/snn-global-editor-app.js';
    if (file_exists($app_js_path)) {
        wp_enqueue_script(
            'snn-global-editor-app',
            SNN_URL . 'editor/global-style/snn-global-editor-app.js',
            [
                'wp-element',
                'wp-components',
                'wp-i18n',
                'wp-data',
                'wp-api-fetch',
                'wp-blocks',
                'wp-block-editor',
                'wp-hooks',
                'wp-compose',
            ],
            wp_get_theme()->get('Version'),
            true
        );

        wp_add_inline_script(
            'snn-global-editor-app',
            'window.SNN_GLOBAL_EDITOR_DATA = ' . $inline_data . ';',
            'before'
        );
    }

    // ── Enqueue Header Button ──
    $header_js_path = SNN_PATH . 'editor/global-style/snn-global-header-button.js';
    if (file_exists($header_js_path)) {
        wp_enqueue_script(
            'snn-global-header-button',
            SNN_URL . 'editor/global-style/snn-global-header-button.js',
            [
                'wp-plugins',
                'wp-edit-post',
                'wp-element',
                'wp-components',
                'wp-i18n',
                'wp-editor',
                'snn-global-editor-app',
            ],
            wp_get_theme()->get('Version'),
            true
        );
    }

    // ── Enqueue Enhanced Control (per-block class selector + defaults) ──
    $control_js_path = SNN_PATH . 'editor/global-style/global-style-control.js';
    if (file_exists($control_js_path)) {
        wp_enqueue_script(
            'snn-core-attributes',
            SNN_URL . 'editor/global-style/global-style-control.js',
            [
                'wp-blocks',
                'wp-hooks',
                'wp-element',
                'wp-components',
                'wp-compose',
                'wp-block-editor',
                'wp-editor',
                'wp-data',
                'snn-global-editor-app',
            ],
            wp_get_theme()->get('Version'),
            true
        );

        wp_add_inline_script(
            'snn-core-attributes',
            'window.SNN_GLOBAL_EDITOR_DATA = window.SNN_GLOBAL_EDITOR_DATA || ' . $inline_data . ';',
            'before'
        );
    }

    // ── Command Palette is now loaded globally (admin + frontend)
    //     via includes/command-palette/command-palette-loader.php — see functions.php.
});
