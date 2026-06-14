<?php
/**
 * Block Name: Section
 * Description: A full-width section block with responsive flex/grid and styling controls.
 */

// Register the block
function snn_register_section_block() {
    register_block_type(__DIR__, array(
        'render_callback' => 'snn_render_section_block',
    ));
}
add_action('init', 'snn_register_section_block');

/**
 * Get fully responsive CSS for a single property — desktop (base) + tablet/mobile (media queries).
 * Used inside a <style> tag so all breakpoints can override each other properly.
 */
function snn_section_all_style($attr, $property, $selector, $unit = '') {
    if (empty($attr) || !is_array($attr)) {
        return '';
    }
    $css = '';
    $devices = ['desktop', 'tablet', 'mobile'];
    $breakpoints = [
        'desktop' => '',
        'tablet'  => 'max-width: 1023px',
        'mobile'  => 'max-width: 767px',
    ];

    foreach ($devices as $device) {
        $value = $attr[$device] ?? '';
        if ($value === '' || $value === null || $value === false) {
            continue;
        }
        if ($device === 'desktop') {
            $css .= "{$selector} {{$property}: {$value}{$unit};}\n";
        } else {
            $css .= "@media ({$breakpoints[$device]}) {\n";
            $css .= "\t{$selector} {{$property}: {$value}{$unit};}\n";
            $css .= "}\n";
        }
    }
    return $css;
}

/**
 * Get fully responsive padding CSS — desktop (base) + tablet/mobile (media queries).
 */
function snn_section_all_padding($padding, $selector) {
    if (empty($padding) || !is_array($padding)) {
        return '';
    }
    $sides = [
        'top'    => 'padding-top',
        'right'  => 'padding-right',
        'bottom' => 'padding-bottom',
        'left'   => 'padding-left',
    ];
    $devices = ['desktop', 'tablet', 'mobile'];
    $breakpoints = [
        'desktop' => '',
        'tablet'  => 'max-width: 1023px',
        'mobile'  => 'max-width: 767px',
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
        if ($device === 'desktop') {
            $css .= "{$selector} {{$rules}}\n";
        } else {
            $css .= "@media ({$breakpoints[$device]}) {\n";
            $css .= "\t{$selector} {{$rules}}\n";
            $css .= "}\n";
        }
    }
    return $css;
}

// Render callback
function snn_render_section_block($attributes, $content, $block) {
    $anchor    = $attributes['anchor'] ?? '';
    $bg_color  = $attributes['bgColor'] ?? [];    // responsive object: { desktop, tablet, mobile }
    $bg_image  = $attributes['bgImage'] ?? [];
    $bg_size   = $attributes['bgSize'] ?? 'cover';
    $bg_pos    = $attributes['bgPosition'] ?? 'center center';
    $bg_repeat = $attributes['bgRepeat'] ?? 'no-repeat';
    $text_color = $attributes['textColor'] ?? []; // responsive object
    $overflow  = $attributes['overflow'] ?? '';
    $class_name = $attributes['className'] ?? '';

    // Generate a unique class for targeting responsive styles
    $uid = 'snn-s-' . uniqid();
    $selector = '.' . $uid;

    // Build classes
    $classes = ['snn-section', $uid];
    if ($class_name) {
        $classes[] = $class_name;
    }

    // ── 1. Build inline styles (only non-responsive properties) ──
    $inline_styles = '';

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
    $responsive_css .= snn_section_all_style($bg_color, 'background-color', $selector);
    $responsive_css .= snn_section_all_style($text_color, 'color', $selector);
    $responsive_css .= snn_section_all_style($attributes['display'] ?? [], 'display', $selector);
    $responsive_css .= snn_section_all_style($attributes['flexDirection'] ?? [], 'flex-direction', $selector);
    $responsive_css .= snn_section_all_style($attributes['flexWrap'] ?? [], 'flex-wrap', $selector);
    $responsive_css .= snn_section_all_style($attributes['justifyContent'] ?? [], 'justify-content', $selector);
    $responsive_css .= snn_section_all_style($attributes['alignItems'] ?? [], 'align-items', $selector);
    $responsive_css .= snn_section_all_style($attributes['gap'] ?? [], 'gap', $selector);
    $responsive_css .= snn_section_all_style($attributes['gridColumns'] ?? [], 'grid-template-columns', $selector);
    $responsive_css .= snn_section_all_style($attributes['textAlign'] ?? [], 'text-align', $selector);
    $responsive_css .= snn_section_all_style($attributes['minHeight'] ?? [], 'min-height', $selector);
    $responsive_css .= snn_section_all_padding($attributes['padding'] ?? [], $selector);

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
    $output = '<section';
    foreach ($wrapper_attrs as $key => $value) {
        $output .= ' ' . $key . '="' . esc_attr($value) . '"';
    }
    $output .= '>';
    if ($responsive_css) {
        $output .= '<style>' . $responsive_css . '</style>';
    }
    $output .= $content;
    $output .= '</section>';

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
