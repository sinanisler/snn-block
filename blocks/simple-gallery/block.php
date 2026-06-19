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
 * Get fully responsive CSS custom property — desktop (base) + tablet/mobile (media queries).
 * Used inside a <style> tag so all breakpoints can override each other properly.
 */
function snn_gallery_all_val($attr, $property, $selector, $prefix = '', $suffix = '') {
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
        if ($value === '' || $value === null) {
            continue;
        }
        if ($device === 'desktop') {
            $css .= "{$selector} {{$property}: {$prefix}{$value}{$suffix};}\n";
        } else {
            $css .= "@media ({$breakpoints[$device]}) {\n";
            $css .= "\t{$selector} {{$property}: {$prefix}{$value}{$suffix};}\n";
            $css .= "}\n";
        }
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
    $custom_css = $attributes['customCSS'] ?? '';

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

    // ── 1. Build all-device CSS for <style> tag ──
    // Desktop values as base rule, tablet/mobile in media queries.
    // No inline styles — they would override the <style> tag's media queries.
    $responsive_css = '';
    $responsive_css .= snn_gallery_all_val($columns, '--snn-gallery-columns', $selector);
    $responsive_css .= snn_gallery_all_val($gap, '--snn-gallery-gap', $selector, '', 'px');
    $responsive_css .= snn_gallery_all_val($aspect_ratio, '--snn-gallery-aspect-ratio', $selector);

    // If no responsive values at all, provide fallback defaults via inline style
    $inline_css = '';
    if (empty($responsive_css)) {
        $inline_css = '--snn-gallery-columns: 3;--snn-gallery-gap: 16px;--snn-gallery-aspect-ratio: 4/3;';
    }

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
    // ── 5. Custom CSS ──
    $all_css = $responsive_css;
    if (!empty($custom_css)) {
        $safe_css = preg_replace('~<script\s|</style|url\(|expression\s*\(~i', '', $custom_css);
        $all_css .= "{$selector} {\n{$safe_css}\n}\n";
    }

    if ($all_css) {
        $output .= '<style>' . $all_css . '</style>';
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
