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

/**
 * Get desktop-only inline style.
 */
function snn_text_inline_style($attr, $property, $unit = '') {
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
 * Get desktop-only inline padding.
 */
function snn_text_inline_padding($padding) {
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
function snn_text_responsive_style($attr, $property, $selector, $unit = '') {
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
 * Get responsive padding CSS for <style> tag.
 */
function snn_text_responsive_padding($padding, $selector) {
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
function snn_render_text_block($attributes, $content, $block) {
    $anchor    = $attributes['anchor'] ?? '';
    $tag       = $attributes['tagName'] ?? 'p';
    $text_content = $attributes['content'] ?? '';
    $text_color   = $attributes['textColor'] ?? [];
    $bg_color     = $attributes['bgColor'] ?? [];
    $font_size    = $attributes['fontSize'] ?? [];
    $line_height  = $attributes['lineHeight'] ?? [];
    $letter_spacing = $attributes['letterSpacing'] ?? [];
    $font_weight  = $attributes['fontWeight'] ?? [];
    $text_transform = $attributes['textTransform'] ?? '';
    $text_align   = $attributes['textAlign'] ?? [];
    $padding      = $attributes['padding'] ?? [];
    $class_name   = $attributes['className'] ?? '';

    // Validate tag
    $allowed_tags = ['p', 'h1', 'h2', 'h3', 'h4', 'div'];
    if (!in_array($tag, $allowed_tags, true)) {
        $tag = 'p';
    }

    // Generate unique class for responsive targeting
    $uid = 'snn-t-' . uniqid();
    $selector = '.' . $uid;

    // Build classes
    $classes = ['snn-text', $uid];
    if ($class_name) {
        $classes[] = $class_name;
    }

    // ── 1. Inline styles (desktop) ──
    $inline = '';
    $inline .= snn_text_inline_style($text_color, 'color');
    $inline .= snn_text_inline_style($bg_color, 'background-color');
    $inline .= snn_text_inline_style($font_size, 'font-size');
    $inline .= snn_text_inline_style($line_height, 'line-height');
    $inline .= snn_text_inline_style($letter_spacing, 'letter-spacing');
    $inline .= snn_text_inline_style($font_weight, 'font-weight');
    $inline .= snn_text_inline_style($text_align, 'text-align');
    if ($text_transform) {
        $inline .= "text-transform: {$text_transform};";
    }
    $inline .= snn_text_inline_padding($padding);

    // ── 2. Responsive CSS ──
    $resp = '';
    $resp .= snn_text_responsive_style($text_color, 'color', $selector);
    $resp .= snn_text_responsive_style($bg_color, 'background-color', $selector);
    $resp .= snn_text_responsive_style($font_size, 'font-size', $selector);
    $resp .= snn_text_responsive_style($line_height, 'line-height', $selector);
    $resp .= snn_text_responsive_style($letter_spacing, 'letter-spacing', $selector);
    $resp .= snn_text_responsive_style($font_weight, 'font-weight', $selector);
    $resp .= snn_text_responsive_style($text_align, 'text-align', $selector);
    $resp .= snn_text_responsive_padding($padding, $selector);

    // ── 3. Build attributes ──
    $wrapper_attrs = [
        'class' => esc_attr(implode(' ', $classes)),
    ];
    if ($inline) {
        $wrapper_attrs['style'] = $inline;
    }
    if ($anchor) {
        $wrapper_attrs['id'] = esc_attr($anchor);
    }

    // ── 4. Build output ──
    $output = '<' . $tag;
    foreach ($wrapper_attrs as $key => $value) {
        $output .= ' ' . $key . '="' . esc_attr($value) . '"';
    }
    $output .= '>';
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
