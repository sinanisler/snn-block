<?php
/**
 * Block Name: Text
 * Description: Rich text block with full responsive styling controls.
 */

// Register the block
function snn_register_text_block() {
    register_block_type(__DIR__, array(
        'render_callback' => 'snn_render_text_block',
    ));
}
add_action('init', 'snn_register_text_block');

// Shared responsive CSS helpers (centralised in /blocks/block-helpers.php)
require_once __DIR__ . '/../block-helpers.php';

// Render callback
function snn_render_text_block($attributes, $content, $block) {
    $tag            = $attributes['tagName'] ?? 'p';
    $text_content   = $attributes['content'] ?? '';
    $class_name     = $attributes['className'] ?? '';
    $custom_css     = $attributes['customCSS'] ?? '';

    // Validate tag
    $allowed_tags = ['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'div', 'span', 'blockquote', 'pre'];
    if (!in_array($tag, $allowed_tags, true)) {
        $tag = 'p';
    }

    // Generate unique class for responsive targeting
    $uid = 'snn-t-' . uniqid();
    $selector = '.' . $uid;

    // Build classes
    $extra_classes = 'snn-text ' . $uid;
    if ($class_name) {
        $extra_classes .= ' ' . $class_name;
    }

    // ── Inline styles (non-responsive bg layers + overlay trigger) ──
    $inline = '';
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
    $overlay = $attributes['bgOverlay'] ?? [];
    if (!empty($overlay['color']) || !empty($overlay['gradient'])) {
        $inline .= 'position:relative;';
    }

    // ── Responsive CSS (unified renderer — all ~70 properties) ──
    $all_css = snn_render_box_css($attributes, $selector);

    // Custom CSS
    if (!empty($custom_css)) {
        $safe_css = preg_replace('~<script\s|</style|url\(|expression\s*\(~i', '', $custom_css);
        $all_css .= "{$selector} {\n{$safe_css}\n}\n";
    }

    // Collect into global aggregator
    if ($all_css) {
        SNN_CSS_Collector::instance()->collect($all_css);
    }

    // ── Build wrapper attributes ──
    $wrapper_attributes = get_block_wrapper_attributes([
        'class' => $extra_classes,
        'style' => $inline,
    ]);

    // ── Build output ──
    $output = '<' . $tag . ' ' . $wrapper_attributes . '>';
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
