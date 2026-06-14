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

// Render callback
function snn_render_simple_gallery_block($attributes, $content, $block) {
    $images = $attributes['images'] ?? [];
    $columns = $attributes['columns'] ?? 3;
    $gap = $attributes['gap'] ?? 16;
    $aspect_ratio = $attributes['aspectRatio'] ?? '4/3';
    $enable_lightbox = $attributes['enableLightbox'] ?? false;
    $anchor = $attributes['anchor'] ?? '';
    $class_name = $attributes['className'] ?? '';
    $align = $attributes['align'] ?? '';

    if (empty($images)) {
        return '';
    }

    $classes = array('snn-simple-gallery');
    if ($class_name) {
        $classes[] = $class_name;
    }
    if ($align) {
        $classes[] = 'align' . $align;
    }
    if ($enable_lightbox) {
        $classes[] = 'has-lightbox';
    }

    $wrapper_attributes = array(
        'class' => esc_attr(implode(' ', $classes)),
        'style' => sprintf(
            '--snn-gallery-columns: %d; --snn-gallery-gap: %dpx; --snn-gallery-aspect-ratio: %s;',
            absint($columns),
            absint($gap),
            esc_attr($aspect_ratio)
        ),
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

    $output = '<div';
    foreach ($wrapper_attributes as $key => $value) {
        $output .= ' ' . $key . '="' . $value . '"';
    }
    $output .= '>';

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

    $output .= '</div>';

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
