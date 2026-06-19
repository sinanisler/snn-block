<?php
/**
 * Icon Block — SNN
 *
 * Renders a Font Awesome 6 icon with responsive size/color + custom CSS.
 *
 * @package SNN
 */

// ── Register block ──────────────────────────────────────────────────
add_action('init', function () {
    register_block_type(__DIR__, [
        'render_callback' => 'snn_icon_block_render',
    ]);
});

// ── Frontend: enqueue Font Awesome if this block is present ────────
add_action('wp_enqueue_scripts', function () {
    if (has_block('snn/icon')) {
        wp_enqueue_style(
            'snn-fontawesome',
            SNN_URL . 'assets/fonts/fontawesome/all.min.css',
            [],
            '6.7.2'
        );
    }
});

// ── Editor: load JSX + icons data ──────────────────────────────────
add_action('enqueue_block_editor_assets', function () {
    $current_screen = get_current_screen();
    if ($current_screen && $current_screen->is_block_editor) {
        add_action('admin_footer', function () {
            // 1. Pass FA icons list to the browser
            $icons_path = SNN_PATH_ASSETS . 'fa-icons.json';
            if (file_exists($icons_path)) {
                $icons_json = file_get_contents($icons_path);
                echo '<script>window.snnFAIcons = ' . $icons_json . ';</script>';
            }

            // 2. JSX (compiled by in-browser Babel)
            $jsx_path = __DIR__ . '/editor.jsx';
            if (file_exists($jsx_path)) {
                $jsx_content = file_get_contents($jsx_path);
                echo '<script type="text/babel">' . $jsx_content . '</script>';
            }
        });
    }
});

// ── Render callback ─────────────────────────────────────────────────
function snn_icon_block_render($attributes) {
    $icon_type       = $attributes['iconType'] ?? 'fontawesome';
    $icon_name       = $attributes['iconName'] ?? '';
    $icon_prefix     = $attributes['iconPrefix'] ?? 'fa-solid';
    $custom_svg      = $attributes['customSvg'] ?? '';
    $custom_image_id = $attributes['customImageId'] ?? 0;
    $custom_image_url = $attributes['customImageUrl'] ?? '';
    $custom_image_alt = $attributes['customImageAlt'] ?? '';
    $size            = $attributes['size'] ?? [];
    $color           = $attributes['color'] ?? [];
    $custom_css      = $attributes['customCSS'] ?? '';

    $uid      = 'snn-i-' . uniqid();
    $selector = '.' . $uid;

    // ── Build responsive CSS ──
    $all_css = '';

    // Size (px) — use width/height for images, font-size for FA & SVGs
    if (!empty($size) && is_array($size)) {
        if ($icon_type === 'custom' && !empty($custom_image_url) && empty($custom_svg)) {
            $all_css .= snn_block_responsive_style($size, 'width', $selector, 'px');
            $all_css .= snn_block_responsive_style($size, 'height', $selector, 'px');
        } else {
            $all_css .= snn_block_responsive_style($size, 'font-size', $selector, 'px');
        }
    }

    // Color
    if (!empty($color) && is_array($color)) {
        $all_css .= snn_block_responsive_style($color, 'color', $selector);
    }

    // Custom CSS
    if (!empty($custom_css)) {
        $safe_css = preg_replace(
            '~<script\s|</style|url\(|expression\s*\(~i',
            '',
            $custom_css
        );
        $all_css .= "{$selector} {\n{$safe_css}\n}\n";
    }

    // ── Build icon HTML ──
    $icon_html = '';

    if ($icon_type === 'custom') {
        // Custom SVG takes priority over image
        if (!empty($custom_svg)) {
            // Sanitize SVG: strip script tags, event handlers, etc.
            $safe_svg = preg_replace(
                '~<script\b[^>]*>.*?</script>|<[^>]*\s+on\w+\s*=\s*["\'][^"\']*["\']~is',
                '',
                $custom_svg
            );
            // Remove javascript: URLs
            $safe_svg = preg_replace(
                '~\b(?:xlink:)?href\s*=\s*["\']\s*javascript\s*:[^"\']*["\']~i',
                '',
                $safe_svg
            );
            $icon_html = '<span class="snn-icon__custom snn-icon__svg">' . $safe_svg . '</span>';
        } elseif (!empty($custom_image_url)) {
            $alt = !empty($custom_image_alt) ? esc_attr($custom_image_alt) : '';
            $img = '<img src="' . esc_url($custom_image_url) . '" alt="' . $alt . '" class="snn-icon__custom snn-icon__img" loading="lazy" />';
            $icon_html = $img;
        } else {
            // Fallback for custom mode with nothing set
            $icon_name   = 'fa-star';
            $icon_prefix = 'fa-solid';
            $icon_html   = '<i class="' . esc_attr($icon_prefix) . ' ' . esc_attr($icon_name) . '"></i>';
        }
    } else {
        // Font Awesome mode (default)
        if (empty($icon_name)) {
            $icon_name   = 'fa-star';
            $icon_prefix = 'fa-solid';
        }
        $icon_html = '<i class="' . esc_attr($icon_prefix) . ' ' . esc_attr($icon_name) . '"></i>';
    }

    // ── Output ──
    $class = 'snn-icon ' . esc_attr($uid);
    $output = '<span class="' . $class . '">';
    if ($all_css) {
        $output .= '<style>' . $all_css . '</style>';
    }
    $output .= $icon_html;
    $output .= '</span>';

    return $output;
}

/**
 * Generate responsive CSS for a single property.
 *
 * @param array  $attr     Responsive attribute { desktop, tablet, mobile }.
 * @param string $property CSS property name.
 * @param string $selector CSS selector.
 * @param string $unit     CSS unit suffix (e.g. 'px').
 * @return string
 */
function snn_block_responsive_style($attr, $property, $selector, $unit = '') {
    if (empty($attr) || !is_array($attr)) {
        return '';
    }

    $css         = '';
    $devices     = ['desktop', 'tablet', 'mobile'];
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

        $css_value = $value . $unit;

        if ($device === 'desktop') {
            $css .= "{$selector}{{$property}:{$css_value}}\n";
        } else {
            $css .= '@media(' . $breakpoints[$device] . "){\n";
            $css .= "\t{$selector}{{$property}:{$css_value}}\n";
            $css .= "}\n";
        }
    }

    return $css;
}
