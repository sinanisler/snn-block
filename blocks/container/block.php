<?php
/**
 * Block Name: Container
 * Description: A centered container block with responsive flex/grid and styling controls.
 */

// Register the block
function snn_register_container_block() {
    register_block_type(__DIR__, array(
        'render_callback' => 'snn_render_container_block',
    ));
}
add_action('init', 'snn_register_container_block');

// Shared responsive CSS helpers (centralised in /blocks/block-helpers.php)
require_once __DIR__ . '/../block-helpers.php';

// Render callback
function snn_render_container_block($attributes, $content, $block) {
    $anchor    = $attributes['anchor'] ?? '';
    $max_width = $attributes['maxWidth'] ?? '';
    $bg_color  = $attributes['bgColor'] ?? [];    // responsive object
    $bg_image  = $attributes['bgImage'] ?? [];
    $bg_size   = $attributes['bgSize'] ?? 'cover';
    $bg_pos    = $attributes['bgPosition'] ?? 'center center';
    $bg_repeat = $attributes['bgRepeat'] ?? 'no-repeat';
    $text_color = $attributes['textColor'] ?? []; // responsive object
    $overflow  = $attributes['overflow'] ?? '';
    $class_name = $attributes['className'] ?? '';
    $custom_css = $attributes['customCSS'] ?? '';

    // Get default max-width from theme.json if not set
    if (empty($max_width)) {
        $theme_layout = wp_get_global_settings('layout', 'theme');
        $max_width = $theme_layout['contentSize'] ?? '1200px';
    }

    // Generate a unique class for targeting responsive styles
    $uid = 'snn-c-' . uniqid();
    $selector = '.' . $uid;

    // Build classes
    $classes = ['snn-container', $uid];
    if ($class_name) {
        $classes[] = $class_name;
    }

    // ── 1. Build inline styles (only non-responsive properties) ──
    $inline_styles = '';

    // Container centering (always inline — not responsive)
    $inline_styles .= "max-width: {$max_width};";
    $inline_styles .= "margin-left: auto;";
    $inline_styles .= "margin-right: auto;";

    // Background image (non-responsive — single value)
    if (!empty($bg_image['url'])) {
        $inline_styles .= 'background-image: url(' . esc_url($bg_image['url']) . ');';
        $inline_styles .= "background-size: {$bg_size};";
        $inline_styles .= "background-position: {$bg_pos};";
        $inline_styles .= "background-repeat: {$bg_repeat};";
    }

    // Overflow (non-responsive — single value)
    if ($overflow) {
        $inline_styles .= "overflow: {$overflow};";
    }

    // ── 2. Build all-device CSS for <style> tag ──
    // Desktop values go in as a base rule (no media query).
    // Tablet/mobile values go in media queries so they can properly override.
    $responsive_css = '';
    $responsive_css .= snn_responsive_style($bg_color, 'background-color', $selector);
    $responsive_css .= snn_responsive_style($text_color, 'color', $selector);
    $responsive_css .= snn_responsive_style($attributes['display'] ?? [], 'display', $selector);
    $responsive_css .= snn_responsive_style($attributes['flexDirection'] ?? [], 'flex-direction', $selector);
    $responsive_css .= snn_responsive_style($attributes['flexWrap'] ?? [], 'flex-wrap', $selector);
    $responsive_css .= snn_responsive_style($attributes['justifyContent'] ?? [], 'justify-content', $selector);
    $responsive_css .= snn_responsive_style($attributes['justifyItems'] ?? [], 'justify-items', $selector);
    $responsive_css .= snn_responsive_style($attributes['alignItems'] ?? [], 'align-items', $selector);
    $responsive_css .= snn_responsive_style($attributes['alignContent'] ?? [], 'align-content', $selector);
    $responsive_css .= snn_responsive_style($attributes['gap'] ?? [], 'gap', $selector);
    $responsive_css .= snn_responsive_style($attributes['gridColumns'] ?? [], 'grid-template-columns', $selector);
    $responsive_css .= snn_responsive_style($attributes['textAlign'] ?? [], 'text-align', $selector);
    $responsive_css .= snn_responsive_style($attributes['minHeight'] ?? [], 'min-height', $selector);
    $responsive_css .= snn_responsive_padding($attributes['padding'] ?? [], $selector);

    // ── 3. Build wrapper attributes ──
    $wrapper_attrs = [
        'class' => esc_attr(implode(' ', $classes)),
    ];
    if ($inline_styles) {
        $wrapper_attrs['style'] = $inline_styles;
    }
    if ($anchor) {
        $wrapper_attrs['id'] = esc_attr($anchor);
    }

    // ── 4. Build HTML output ──
    $output = '<div';
    foreach ($wrapper_attrs as $key => $value) {
        $output .= ' ' . $key . '="' . esc_attr($value) . '"';
    }
    $output .= '>';
    // ── 5. Custom CSS ──
    $all_css = $responsive_css;
    if (!empty($custom_css)) {
        // Sanitize: strip dangerous tags/expressions
        $safe_css = preg_replace('~<script\s|</style|url\(|expression\s*\(~i', '', $custom_css);
        $all_css .= "{$selector} {\n{$safe_css}\n}\n";
    }

    if ($all_css) {
        $output .= '<style>' . $all_css . '</style>';
    }
    $output .= $content;
    $output .= '</div>';

    return $output;
}

// Enqueue editor assets (JSX via Babel)
add_action('enqueue_block_editor_assets', function () {
    $current_screen = get_current_screen();
    if ($current_screen && $current_screen->is_block_editor) {
        add_action('admin_footer', function () {
            $jsx_path = __DIR__ . '/editor.jsx';
            if (file_exists($jsx_path)) {
                $jsx_content = file_get_contents($jsx_path);
                echo '<script type="text/babel">' . $jsx_content . '</script>';
            }
        });
    }
});
