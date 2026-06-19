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
    $icon_name   = $attributes['iconName'] ?? '';
    $icon_prefix = $attributes['iconPrefix'] ?? 'fa-solid';
    $size        = $attributes['size'] ?? [];
    $color       = $attributes['color'] ?? [];
    $custom_css  = $attributes['customCSS'] ?? '';

    // Fallback icon
    if (empty($icon_name)) {
        $icon_name   = 'fa-star';
        $icon_prefix = 'fa-solid';
    }

    $uid      = 'snn-i-' . uniqid();
    $selector = '.' . $uid;

    // ── Build responsive CSS ──
    $all_css = '';

    // Size (px)
    if (!empty($size) && is_array($size)) {
        $all_css .= snn_block_responsive_style($size, 'font-size', $selector, 'px');
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

    // ── Output ──
    $class = 'snn-icon ' . esc_attr($uid);
    $icon  = '<i class="' . esc_attr($icon_prefix) . ' ' . esc_attr($icon_name) . '"></i>';

    $output = '<span class="' . $class . '">';
    if ($all_css) {
        $output .= '<style>' . $all_css . '</style>';
    }
    $output .= $icon;
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
