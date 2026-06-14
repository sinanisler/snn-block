<?php
/**
 * Block Name: Simple Gallery
 * Description: A responsive image gallery block with multi-image selection and configurable columns.
 */

// Register the block
function snn_register_simple_gallery_block() {
    register_block_type(__DIR__, array(
        'render_callback' => 'snn_render_simple_gallery_block',
    ));
}
add_action('init', 'snn_register_simple_gallery_block');

/**
 * Get desktop-only inline style for a responsive attribute.
 */
function snn_gallery_inline_val($attr, $property, $prefix = '', $suffix = '') {
    if (empty($attr) || !is_array($attr)) {
        return '';
    }
    $value = $attr['desktop'] ?? '';
    if ($value === '' || $value === null) {
        return '';
    }
    return "{$prefix}{$value}{$suffix}";
}

/**
 * Get responsive (tablet/mobile) CSS for <style> tag.
 */
function snn_gallery_responsive_val($attr, $property, $selector, $prefix = '', $suffix = '') {
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
        if ($value === '' || $value === null) {
            continue;
        }
        $css .= "@media ({$breakpoints[$device]}) {\n";
        $css .= "\t{$selector} {{$property}: {$prefix}{$value}{$suffix};}\n";
        $css .= "}\n";
    }
    return $css;
}

// Render callback
function snn_render_simple_gallery_block($attributes, $content, $block) {
    $images = $attributes['images'] ?? [];
    $columns = $attributes['columns'] ?? [];
    $gap = $attributes['gap'] ?? [];
    $aspect_ratio = $attributes['aspectRatio'] ?? [];
    $enable_lightbox = $attributes['enableLightbox'] ?? false;
    $anchor = $attributes['anchor'] ?? '';
    $class_name = $attributes['className'] ?? '';
    $align = $attributes['align'] ?? '';

    if (empty($images)) {
        return '';
    }

    // Generate unique class for responsive CSS targeting
    $uid = 'snn-ssl-' . uniqid();
    $selector = '.' . $uid;

    $classes = array('snn-simple-gallery', $uid);
    if ($class_name) {
        $classes[] = $class_name;
    }
    if ($align) {
        $classes[] = 'align' . $align;
    }
    if ($enable_lightbox) {
        $classes[] = 'has-lightbox';
    }

    // ── 1. Build inline CSS custom properties (desktop values) ──
    $inline_css = '';

    $col_val = snn_gallery_inline_val($columns, '--snn-gallery-columns');
    if ($col_val) {
        $inline_css .= "--snn-gallery-columns: {$col_val};";
    }
    $gap_val = snn_gallery_inline_val($gap, '--snn-gallery-gap', '', 'px');
    if ($gap_val) {
        $inline_css .= "--snn-gallery-gap: {$gap_val};";
    }
    $ar_val = snn_gallery_inline_val($aspect_ratio, '--snn-gallery-aspect-ratio');
    if ($ar_val) {
        $inline_css .= "--snn-gallery-aspect-ratio: {$ar_val};";
    }

    // Fallback defaults if nothing set on desktop
    if (empty($inline_css)) {
        $inline_css = '--snn-gallery-columns: 3;--snn-gallery-gap: 16px;--snn-gallery-aspect-ratio: 4/3;';
    }

    // ── 2. Build responsive CSS for <style> tag ──
    $responsive_css = '';
    $responsive_css .= snn_gallery_responsive_val($columns, '--snn-gallery-columns', $selector);
    $responsive_css .= snn_gallery_responsive_val($gap, '--snn-gallery-gap', $selector, '', 'px');
    $responsive_css .= snn_gallery_responsive_val($aspect_ratio, '--snn-gallery-aspect-ratio', $selector);

    // ── 3. Build attributes ──
    $wrapper_attributes = array(
        'class' => esc_attr(implode(' ', $classes)),
        'style' => $inline_css,
    );

    if ($anchor) {
        $wrapper_attributes['id'] = esc_attr($anchor);
    }

    if ($enable_lightbox) {
        $wrapper_attributes['data-enable-lightbox'] = '1';
        $wrapper_attributes['data-images'] = esc_attr(wp_json_encode(array_map(function ($img) {
            return array(
                'url' => $img['url'] ?? '',
                'alt' => $img['alt'] ?? '',
                'caption' => $img['caption'] ?? '',
            );
        }, $images)));

        // Enqueue lightbox assets when block is present
        wp_enqueue_script('snn-simple-gallery-lightbox');
        wp_enqueue_style('snn-simple-gallery-lightbox');
    }

    // ── 4. Build output ──
    $output = '<div';
    foreach ($wrapper_attributes as $key => $value) {
        $output .= ' ' . $key . '="' . esc_attr($value) . '"';
    }
    $output .= '>';
    if ($responsive_css) {
        $output .= '<style>' . $responsive_css . '</style>';
    }
    $output .= '<div class="snn-gallery-grid">';

    foreach ($images as $index => $image) {
        $url = $image['url'] ?? '';
        $alt = $image['alt'] ?? '';
        $caption = $image['caption'] ?? '';
        $id = $image['id'] ?? 0;

        if (!$url) {
            continue;
        }

        $output .= '<div class="snn-gallery-item" data-index="' . esc_attr($index) . '">';

        if ($enable_lightbox) {
            $output .= '<a href="' . esc_url($url) . '" class="snn-gallery-link" tabindex="0">';
        }

        $output .= '<img src="' . esc_url($url) . '" alt="' . esc_attr($alt) . '"';
        if ($id) {
            $output .= ' data-id="' . esc_attr($id) . '"';
        }
        $output .= ' />';

        if ($enable_lightbox) {
            $output .= '</a>';
        }

        if ($caption) {
            $output .= '<div class="snn-gallery-caption">' . esc_html($caption) . '</div>';
        }
        $output .= '</div>';
    }

    $output .= '</div>'; // .snn-gallery-grid
    $output .= '</div>'; // .snn-simple-gallery

    return $output;
}

// Enqueue lightbox assets on the frontend
add_action('wp_enqueue_scripts', function () {
    $lightbox_js_path = __DIR__ . '/lightbox.js';
    $lightbox_css_path = __DIR__ . '/block.css';

    if (file_exists($lightbox_js_path)) {
        wp_register_script(
            'snn-simple-gallery-lightbox',
            SNN_URL . 'blocks/simple-gallery/lightbox.js',
            array(),
            filemtime($lightbox_js_path),
            true
        );
    }

    if (file_exists($lightbox_css_path)) {
        wp_register_style(
            'snn-simple-gallery-lightbox',
            SNN_URL . 'blocks/simple-gallery/block.css',
            array(),
            filemtime($lightbox_css_path)
        );
    }
});

// Enqueue editor assets (JSX via Babel)
add_action('enqueue_block_editor_assets', function () {
    // Only for this block
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
