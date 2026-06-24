<?php
/**
 * Block Name: Box
 * Description: Universal container block — div, section, header, footer, etc.
 *              Full responsive styling via the shared SNN control suite.
 *
 * @package SNN
 */

// ── Register block ──────────────────────────────────────────────────
function snn_register_box_block() {
    register_block_type(__DIR__, [
        'render_callback' => 'snn_render_box_block',
    ]);
}
add_action('init', 'snn_register_box_block');

// Shared CSS helpers + unified renderer
require_once __DIR__ . '/../block-helpers.php';

// ── Render callback ──────────────────────────────────────────────────
function snn_render_box_block($attributes, $content, $block) {
    $tag        = $attributes['tagName']  ?? 'div';
    $variant    = $attributes['variant']  ?? 'container';
    $anchor     = $attributes['anchor']   ?? '';
    $class_name = $attributes['className'] ?? '';
    $custom_css = $attributes['customCSS'] ?? '';

    // Validate tag
    $allowed_tags = ['div', 'section', 'header', 'footer', 'article', 'aside', 'main', 'nav'];
    if (!in_array($tag, $allowed_tags, true)) {
        $tag = 'div';
    }

    $uid      = 'snn-b-' . uniqid();
    $selector = '.' . $uid;

    // ── Classes ──
    $classes = ['snn-box', "snn-box--{$variant}", $uid];
    if ($class_name) $classes[] = $class_name;

    // ── Inline styles (non-responsive properties only) ──
    $inline = '';

    // Variant defaults
    if ($variant === 'container') {
        $theme_layout = wp_get_global_settings('layout', 'theme');
        $content_size = $theme_layout['contentSize'] ?? '1200px';
        // Use user maxWidth if set (desktop), else theme default
        $mw = $attributes['maxWidth']['desktop'] ?? '';
        $inline .= 'max-width:' . ($mw ?: $content_size) . ';';
        $inline .= 'margin-left:auto;margin-right:auto;';
    } else {
        $inline .= 'width:100%;';
    }

    // Background layers (gradients + image) — non-responsive composite
    $bg_layers = [];
    $bg_gradients = $attributes['bgGradients'] ?? [];
    if (!empty($bg_gradients) && is_array($bg_gradients)) {
        foreach ($bg_gradients as $g) {
            if (!empty($g['css'])) $bg_layers[] = $g['css'];
        }
    } elseif (!empty($attributes['bgGradient'])) {
        $bg_layers[] = $attributes['bgGradient'];
    }
    if (!empty($attributes['bgImage']['url'])) {
        $bg_layers[] = 'url(' . esc_url($attributes['bgImage']['url']) . ')';
    }
    if (!empty($bg_layers)) {
        $inline .= 'background-image:' . implode(', ', $bg_layers) . ';';
    }

    // Overlay requires position:relative
    $overlay = $attributes['bgOverlay'] ?? [];
    if (!empty($overlay['color']) || !empty($overlay['gradient'])) {
        $inline .= 'position:relative;';
    }

    // ── Responsive CSS (delegated to unified renderer) ──
    $all_css = snn_render_box_css($attributes, $selector);

    // Custom CSS
    if (!empty($custom_css)) {
        $safe = preg_replace('~<script\s|</style|url\(|expression\s*\(~i', '', $custom_css);
        $all_css .= "{$selector} {\n{$safe}\n}\n";
    }

    // Collect into global aggregator
    if ($all_css) {
        SNN_CSS_Collector::instance()->collect($all_css);
    }

    // ── Build HTML ──
    $wrapper_attrs = ['class' => esc_attr(implode(' ', $classes))];
    if ($inline) $wrapper_attrs['style'] = $inline;
    if ($anchor) $wrapper_attrs['id']    = esc_attr($anchor);

    $output = '<' . $tag;
    foreach ($wrapper_attrs as $k => $v) {
        $output .= ' ' . $k . '="' . esc_attr($v) . '"';
    }
    $output .= '>';
    $output .= $content;
    $output .= '</' . $tag . '>';

    return $output;
}

// ── Editor: enqueue JSX ──────────────────────────────────────────────
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
