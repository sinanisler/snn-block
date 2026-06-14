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

/**
 * Get desktop-only inline style for a responsive attribute.
 */
function snn_container_inline_style($attr, $property, $unit = '') {
    if (empty($attr) || !is_array($attr)) {
        return '';
    }
    $value = $attr['desktop'] ?? '';
    if ($value === '' || $value === null || $value === false) {
        return '';
    }
    return "{$property}: {$value}{$unit};";
}

/**
 * Get desktop-only inline padding styles.
 */
function snn_container_inline_padding($padding) {
    if (empty($padding) || !is_array($padding)) {
        return '';
    }
    $device_padding = $padding['desktop'] ?? [];
    if (empty($device_padding) || !is_array($device_padding)) {
        return '';
    }
    $css = '';
    $sides = [
        'top'    => 'padding-top',
        'right'  => 'padding-right',
        'bottom' => 'padding-bottom',
        'left'   => 'padding-left',
    ];
    foreach ($sides as $side => $prop) {
        $val = $device_padding[$side] ?? '';
        if ($val !== '') {
            $css .= "{$prop}: {$val};";
        }
    }
    return $css;
}

/**
 * Get responsive (tablet/mobile) CSS for <style> tag.
 */
function snn_container_responsive_style($attr, $property, $selector, $unit = '') {
    if (empty($attr) || !is_array($attr)) {
        return '';
    }
    $css = '';
    $devices = ['tablet', 'mobile'];
    $breakpoints = [
        'tablet' => 'max-width: 1023px',
        'mobile' => 'max-width: 767px',
    ];

    foreach ($devices as $device) {
        $value = $attr[$device] ?? '';
        if ($value === '' || $value === null || $value === false) {
            continue;
        }
        $css .= "@media ({$breakpoints[$device]}) {\n";
        $css .= "\t{$selector} {{$property}: {$value}{$unit};}\n";
        $css .= "}\n";
    }
    return $css;
}

/**
 * Get responsive (tablet/mobile) padding CSS for <style> tag.
 */
function snn_container_responsive_padding($padding, $selector) {
    if (empty($padding) || !is_array($padding)) {
        return '';
    }
    $sides = [
        'top'    => 'padding-top',
        'right'  => 'padding-right',
        'bottom' => 'padding-bottom',
        'left'   => 'padding-left',
    ];
    $devices = ['tablet', 'mobile'];
    $breakpoints = [
        'tablet' => 'max-width: 1023px',
        'mobile' => 'max-width: 767px',
    ];
    $css = '';

    foreach ($devices as $device) {
        $device_padding = $padding[$device] ?? [];
        if (empty($device_padding) || !is_array($device_padding)) {
            continue;
        }
        $rules = '';
        foreach ($sides as $side => $prop) {
            $val = $device_padding[$side] ?? '';
            if ($val !== '') {
                $rules .= "{$prop}: {$val};";
            }
        }
        if (empty($rules)) {
            continue;
        }
        $css .= "@media ({$breakpoints[$device]}) {\n";
        $css .= "\t{$selector} {{$rules}}\n";
        $css .= "}\n";
    }
    return $css;
}

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

    // ── 1. Build inline styles (desktop values only) ──
    $inline_styles = '';

    // Container centering (always on inline)
    $inline_styles .= "max-width: {$max_width};";
    $inline_styles .= "margin-left: auto;";
    $inline_styles .= "margin-right: auto;";

    // Background (responsive)
    $inline_styles .= snn_container_inline_style($bg_color, 'background-color');
    if (!empty($bg_image['url'])) {
        $inline_styles .= 'background-image: url(' . esc_url($bg_image['url']) . ');';
        $inline_styles .= "background-size: {$bg_size};";
        $inline_styles .= "background-position: {$bg_pos};";
        $inline_styles .= "background-repeat: {$bg_repeat};";
    }

    // Text color (responsive)
    $inline_styles .= snn_container_inline_style($text_color, 'color');

    // Overflow
    if ($overflow) {
        $inline_styles .= "overflow: {$overflow};";
    }

    // Desktop-only responsive properties
    $inline_styles .= snn_container_inline_style($attributes['display'] ?? [], 'display');
    $inline_styles .= snn_container_inline_style($attributes['flexDirection'] ?? [], 'flex-direction');
    $inline_styles .= snn_container_inline_style($attributes['flexWrap'] ?? [], 'flex-wrap');
    $inline_styles .= snn_container_inline_style($attributes['justifyContent'] ?? [], 'justify-content');
    $inline_styles .= snn_container_inline_style($attributes['alignItems'] ?? [], 'align-items');
    $inline_styles .= snn_container_inline_style($attributes['gap'] ?? [], 'gap');
    $inline_styles .= snn_container_inline_style($attributes['gridColumns'] ?? [], 'grid-template-columns');
    $inline_styles .= snn_container_inline_style($attributes['textAlign'] ?? [], 'text-align');
    $inline_styles .= snn_container_inline_style($attributes['minHeight'] ?? [], 'min-height');
    $inline_styles .= snn_container_inline_padding($attributes['padding'] ?? []);

    // ── 2. Build responsive CSS for <style> tag ──
    $responsive_css = '';
    // Responsive colors
    $responsive_css .= snn_container_responsive_style($bg_color, 'background-color', $selector);
    $responsive_css .= snn_container_responsive_style($text_color, 'color', $selector);
    // Responsive layout
    $responsive_css .= snn_container_responsive_style($attributes['display'] ?? [], 'display', $selector);
    $responsive_css .= snn_container_responsive_style($attributes['flexDirection'] ?? [], 'flex-direction', $selector);
    $responsive_css .= snn_container_responsive_style($attributes['flexWrap'] ?? [], 'flex-wrap', $selector);
    $responsive_css .= snn_container_responsive_style($attributes['justifyContent'] ?? [], 'justify-content', $selector);
    $responsive_css .= snn_container_responsive_style($attributes['alignItems'] ?? [], 'align-items', $selector);
    $responsive_css .= snn_container_responsive_style($attributes['gap'] ?? [], 'gap', $selector);
    $responsive_css .= snn_container_responsive_style($attributes['gridColumns'] ?? [], 'grid-template-columns', $selector);
    $responsive_css .= snn_container_responsive_style($attributes['textAlign'] ?? [], 'text-align', $selector);
    $responsive_css .= snn_container_responsive_style($attributes['minHeight'] ?? [], 'min-height', $selector);
    $responsive_css .= snn_container_responsive_padding($attributes['padding'] ?? [], $selector);

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
    if ($responsive_css) {
        $output .= '<style>' . $responsive_css . '</style>';
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
