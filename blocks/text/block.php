<?php
/**
 * Block Name: Text
 * Description: A text block with responsive typography and color controls.
 */

// Register the block
function snn_register_text_block() {
    register_block_type(__DIR__, array(
        'render_callback' => 'snn_render_text_block',
    ));
}
add_action('init', 'snn_register_text_block');

// Shared responsive CSS helpers (centralised in /blocks/block-helpers.php)
require_once __DIR__ . '/../block-helpers.php';

// Render callback
function snn_render_text_block($attributes, $content, $block) {
    $tag            = $attributes['tagName'] ?? 'p';
    $text_content   = $attributes['content'] ?? '';
    $text_color     = $attributes['textColor'] ?? [];
    $bg_color       = $attributes['bgColor'] ?? [];
    $font_size      = $attributes['fontSize'] ?? [];
    $font_weight    = $attributes['fontWeight'] ?? [];
    $text_transform = $attributes['textTransform'] ?? '';
    $text_align     = $attributes['textAlign'] ?? [];
    $padding        = $attributes['padding'] ?? [];
    $class_name     = $attributes['className'] ?? '';
    $custom_css     = $attributes['customCSS'] ?? '';

    // Validate tag
    $allowed_tags = ['p', 'h1', 'h2', 'h3', 'h4', 'div'];
    if (!in_array($tag, $allowed_tags, true)) {
        $tag = 'p';
    }

    // Generate unique class for responsive targeting
    $uid = 'snn-t-' . uniqid();
    $selector = '.' . $uid;

    // Build classes
    $extra_classes = $uid;
    if ($class_name) {
        $extra_classes .= ' ' . $class_name;
    }

    // ── 1. Inline styles (only non-responsive properties) ──
    $inline = '';
    if ($text_transform) {
        $inline .= "text-transform: {$text_transform};";
    }

    // ── 2. All-device CSS for <style> tag ──
    // Desktop values as base rule (no media query), tablet/mobile in media queries.
    $resp = '';
    $resp .= snn_responsive_style($text_color, 'color', $selector);
    $resp .= snn_responsive_style($bg_color, 'background-color', $selector);
    $resp .= snn_responsive_style($font_size, 'font-size', $selector);
    $resp .= snn_responsive_style($font_weight, 'font-weight', $selector);
    $resp .= snn_responsive_style($text_align, 'text-align', $selector);
    $resp .= snn_responsive_padding($padding, $selector);

    // ── 3. Build wrapper attributes ──
    $wrapper_attributes = get_block_wrapper_attributes([
        'class' => $extra_classes,
        'style' => $inline,
    ]);

    // ── Build output ──
    $output = '<' . $tag . ' ' . $wrapper_attributes . '>';
    // ── 5. Custom CSS ──
    if (!empty($custom_css)) {
        $safe_css = preg_replace('~<script\s|</style|url\(|expression\s*\(~i', '', $custom_css);
        $resp .= "{$selector} {\n{$safe_css}\n}\n";
    }

    if ($resp) {
        $output .= '<style>' . $resp . '</style>';
    }
    $output .= wp_kses_post($text_content);
    $output .= '</' . $tag . '>';

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
