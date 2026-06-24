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
    $anchor     = $attributes['anchor'] ?? '';
    $max_width  = $attributes['maxWidth'] ?? '';
    $bg_color   = $attributes['bgColor'] ?? [];
    $bg_image   = $attributes['bgImage'] ?? [];
    $bg_size    = $attributes['bgSize'] ?? 'cover';
    $bg_pos     = $attributes['bgPosition'] ?? 'center center';
    $bg_repeat  = $attributes['bgRepeat'] ?? 'no-repeat';
    $bg_attach  = $attributes['bgAttachment'] ?? 'scroll';
    $bg_overlay = $attributes['bgOverlay'] ?? [];
    $text_color = $attributes['textColor'] ?? [];
    $overflow   = $attributes['overflow'] ?? '';
    $class_name = $attributes['className'] ?? '';
    $custom_css = $attributes['customCSS'] ?? '';

    if (empty($max_width)) {
        $theme_layout = wp_get_global_settings('layout', 'theme');
        $max_width = $theme_layout['contentSize'] ?? '1200px';
    }

    $uid      = 'snn-c-' . uniqid();
    $selector = '.' . $uid;

    $classes = ['snn-container', $uid];
    if ($class_name) $classes[] = $class_name;

    // ── 1. Inline styles (non-responsive only) ──
    $inline_styles = '';
    $inline_styles .= "max-width: {$max_width};";
    $inline_styles .= "margin-left: auto;";
    $inline_styles .= "margin-right: auto;";
    if (!empty($bg_image['url'])) {
        $inline_styles .= 'background-image: url(' . esc_url($bg_image['url']) . ');';
        $inline_styles .= "background-size: {$bg_size};";
        $inline_styles .= "background-position: {$bg_pos};";
        $inline_styles .= "background-repeat: {$bg_repeat};";
        $inline_styles .= "background-attachment: {$bg_attach};";
    }
    if ($overflow) $inline_styles .= "overflow: {$overflow};";

    $has_overlay = !empty($bg_overlay['color']);
    if ($has_overlay) $inline_styles .= 'position: relative;';

    // ── 2. Responsive CSS ──
    $css = '';
    $css .= snn_responsive_style($bg_color, 'background-color', $selector);
    $css .= snn_responsive_style($text_color, 'color', $selector);
    $css .= snn_responsive_style($attributes['display'] ?? [], 'display', $selector);
    $css .= snn_responsive_style($attributes['flexDirection'] ?? [], 'flex-direction', $selector);
    $css .= snn_responsive_style($attributes['flexWrap'] ?? [], 'flex-wrap', $selector);
    $css .= snn_responsive_style($attributes['justifyContent'] ?? [], 'justify-content', $selector);
    $css .= snn_responsive_style($attributes['justifyItems'] ?? [], 'justify-items', $selector);
    $css .= snn_responsive_style($attributes['alignItems'] ?? [], 'align-items', $selector);
    $css .= snn_responsive_style($attributes['alignContent'] ?? [], 'align-content', $selector);
    $css .= snn_responsive_style($attributes['gap'] ?? [], 'gap', $selector);
    $css .= snn_responsive_style($attributes['gridColumns'] ?? [], 'grid-template-columns', $selector);
    $css .= snn_responsive_style($attributes['textAlign'] ?? [], 'text-align', $selector);
    $css .= snn_responsive_style($attributes['width'] ?? [], 'width', $selector);
    $css .= snn_responsive_style($attributes['height'] ?? [], 'height', $selector);
    $css .= snn_responsive_style($attributes['minWidth'] ?? [], 'min-width', $selector);
    $css .= snn_responsive_style($attributes['maxHeight'] ?? [], 'max-height', $selector);
    $css .= snn_responsive_style($attributes['minHeight'] ?? [], 'min-height', $selector);
    $css .= snn_responsive_padding($attributes['padding'] ?? [], $selector);
    $css .= snn_responsive_margin($attributes['margin'] ?? [], $selector);
    $css .= snn_border_css($attributes['border'] ?? [], $selector);
    $css .= snn_border_radius_css($attributes['borderRadius'] ?? [], $selector);
    $css .= snn_box_shadow_css($attributes['boxShadow'] ?? [], $selector);
    $css .= snn_filter_css($attributes['filter'] ?? [], $selector);
    $css .= snn_transform_css($attributes['transform'] ?? [], $selector);
    $css .= snn_opacity_css($attributes['opacity'] ?? '', $selector);
    $css .= snn_blend_mode_css($attributes['blendMode'] ?? '', $selector);
    $css .= snn_position_css(
        $attributes['position'] ?? '',
        $attributes['offsets'] ?? [],
        $attributes['zIndex'] ?? '',
        $selector
    );
    $css .= snn_bg_overlay_css($bg_overlay, $selector);
    $css .= snn_visibility_css($attributes['visibility'] ?? [], $selector);

    // ── 3. Build wrapper attrs ──
    $wrapper_attrs = ['class' => esc_attr(implode(' ', $classes))];
    if ($inline_styles) $wrapper_attrs['style'] = $inline_styles;
    if ($anchor) $wrapper_attrs['id'] = esc_attr($anchor);

    // ── 4. Build HTML ──
    $output = '<div';
    foreach ($wrapper_attrs as $k => $v) $output .= ' ' . $k . '="' . esc_attr($v) . '"';
    $output .= '>';

    $all_css = $css;
    if (!empty($custom_css)) {
        $safe = preg_replace('~<script\s|</style|url\(|expression\s*\(~i', '', $custom_css);
        $all_css .= "{$selector} {\n{$safe}\n}\n";
    }
    if ($all_css) $output .= '<style>' . $all_css . '</style>';
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
