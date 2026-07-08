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

// Shared responsive CSS helpers (centralised in /blocks/block-helpers.php)
require_once __DIR__ . '/../block-helpers.php';

// Render callback
function snn_render_section_block($attributes, $content, $block) {
    $anchor     = $attributes['anchor'] ?? '';
    $bg_color   = $attributes['bgColor'] ?? [];
    $bg_image   = $attributes['bgImage'] ?? [];
    $bg_size    = $attributes['bgSize'] ?? 'cover';
    $bg_pos     = $attributes['bgPosition'] ?? 'center center';
    $bg_repeat  = $attributes['bgRepeat'] ?? 'no-repeat';
    $bg_attach  = $attributes['bgAttachment'] ?? 'scroll';
    $bg_gradient = $attributes['bgGradient'] ?? '';
    $bg_gradients = $attributes['bgGradients'] ?? [];
    $bg_overlay = $attributes['bgOverlay'] ?? [];
    $text_color = $attributes['textColor'] ?? [];
    $font_family   = $attributes['fontFamily'] ?? '';
    $font_size     = $attributes['fontSize'] ?? [];
    $font_weight   = $attributes['fontWeight'] ?? [];
    $line_height   = $attributes['lineHeight'] ?? [];
    $letter_spacing = $attributes['letterSpacing'] ?? [];
    $text_transform = $attributes['textTransform'] ?? '';
    $overflow   = $attributes['overflow'] ?? '';
    $class_name = $attributes['className'] ?? '';
    $custom_css = $attributes['customCSS'] ?? '';

    $uid      = 'snn-s-' . uniqid();
    $selector = '.' . $uid;

    $classes = ['snn-section', $uid];
    if ($class_name) $classes[] = $class_name;

    // ── 1. Inline styles (non-responsive only) ──
    $inline_styles = '';
    $bg_layers = [];
    if (!empty($bg_gradients) && is_array($bg_gradients)) {
        foreach ($bg_gradients as $g) { if (!empty($g['css'])) $bg_layers[] = $g['css']; }
    } elseif ($bg_gradient) { $bg_layers[] = $bg_gradient; }
    if (!empty($bg_image['url'])) { $bg_layers[] = 'url(' . esc_url($bg_image['url']) . ')'; }
    if (!empty($bg_layers)) {
        $inline_styles .= 'background-image: ' . implode(', ', $bg_layers) . ';';
    }
    if ($overflow) $inline_styles .= "overflow: {$overflow};";
    // fontFamily + textTransform now handled by responsive CSS

    // Need position:relative if using bgOverlay
    $has_overlay = !empty($bg_overlay['color']) || !empty($bg_overlay['gradient']);
    if ($has_overlay) $inline_styles .= 'position: relative;';

    // ── 2. Responsive CSS ──
    $css = '';
    $css .= snn_responsive_style($bg_color, 'background-color', $selector);
    $css .= snn_responsive_style($text_color, 'color', $selector);
    $css .= snn_bg_size_css($attributes['bgSize'] ?? [], $selector);
    $css .= snn_bg_position_css($attributes['bgPosition'] ?? [], $selector);
    $css .= snn_bg_repeat_css($attributes['bgRepeat'] ?? [], $selector);
    $css .= snn_bg_attachment_css($attributes['bgAttachment'] ?? [], $selector);
    $css .= snn_responsive_style($attributes['overflow'] ?? [], 'overflow', $selector);
    $css .= snn_responsive_style($attributes['fontFamily'] ?? [], 'font-family', $selector);
    $css .= snn_responsive_style($font_size, 'font-size', $selector);
    $css .= snn_responsive_style($font_weight, 'font-weight', $selector);
    $css .= snn_responsive_style($line_height, 'line-height', $selector);
    $css .= snn_responsive_style($letter_spacing, 'letter-spacing', $selector);
    $css .= snn_responsive_style($attributes['textTransform'] ?? [], 'text-transform', $selector);
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
    $css .= snn_responsive_style($attributes['maxWidth'] ?? [], 'max-width', $selector);
    $css .= snn_responsive_style($attributes['minHeight'] ?? [], 'min-height', $selector);
    $css .= snn_responsive_style($attributes['maxHeight'] ?? [], 'max-height', $selector);
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

    // ── NEW: Additional CSS generators ──
    $css .= snn_bg_gradient_css(!empty($bg_gradients) ? $bg_gradients : $bg_gradient, $selector);
    $css .= snn_bg_blend_mode_css($attributes['bgBlendMode'] ?? [], $selector);
    $css .= snn_box_sizing_css($attributes['boxSizing'] ?? [], $selector);
    $css .= snn_grid_rows_css($attributes['gridRows'] ?? [], $selector);
    $css .= snn_grid_auto_flow_css($attributes['gridAutoFlow'] ?? [], $selector);
    $css .= snn_row_gap_css($attributes['rowGap'] ?? [], $selector);
    $css .= snn_column_gap_css($attributes['columnGap'] ?? [], $selector);
    $css .= snn_flex_grow_css($attributes['flexGrow'] ?? [], $selector);
    $css .= snn_flex_shrink_css($attributes['flexShrink'] ?? [], $selector);
    $css .= snn_flex_basis_css($attributes['flexBasis'] ?? [], $selector);
    $css .= snn_align_self_css($attributes['alignSelf'] ?? [], $selector);
    $css .= snn_order_css($attributes['order'] ?? [], $selector);
    $css .= snn_grid_column_start_css($attributes['gridColumnStart'] ?? [], $selector);
    $css .= snn_grid_column_end_css($attributes['gridColumnEnd'] ?? [], $selector);
    $css .= snn_grid_row_start_css($attributes['gridRowStart'] ?? [], $selector);
    $css .= snn_grid_row_end_css($attributes['gridRowEnd'] ?? [], $selector);
    $css .= snn_backdrop_filter_css($attributes['backdropFilter'] ?? [], $selector);
    $css .= snn_text_shadow_css($attributes['textShadow'] ?? [], $selector);
    $css .= snn_outline_css($attributes['outline'] ?? [], $selector);
    $css .= snn_object_fit_css($attributes['objectFit'] ?? [], $selector);
    $css .= snn_aspect_ratio_css($attributes['aspectRatio'] ?? [], $selector);
    $css .= snn_clip_path_css($attributes['clipPath'] ?? [], $selector);
    $css .= snn_cursor_css($attributes['cursor'] ?? [], $selector);
    $css .= snn_pointer_events_css($attributes['pointerEvents'] ?? [], $selector);
    $css .= snn_user_select_css($attributes['userSelect'] ?? [], $selector);
    $css .= snn_resize_css($attributes['resize'] ?? [], $selector);
    $css .= snn_scroll_behavior_css($attributes['scrollBehavior'] ?? [], $selector);
    $css .= snn_scroll_snap_css($attributes['scrollSnapType'] ?? [], $attributes['scrollSnapAlign'] ?? [], $attributes['scrollSnapStop'] ?? [], $selector);
    $css .= snn_text_overflow_css($attributes['textOverflow'] ?? [], $selector);
    $css .= snn_white_space_css($attributes['whiteSpace'] ?? [], $selector);
    $css .= snn_word_break_css($attributes['wordBreak'] ?? [], $selector);
    $css .= snn_vertical_align_css($attributes['verticalAlign'] ?? [], $selector);
    $css .= snn_will_change_css($attributes['willChange'] ?? [], $selector);
    $css .= snn_isolation_css($attributes['isolation'] ?? [], $selector);
    $css .= snn_list_style_css($attributes['listStyle'] ?? [], $selector);
    $css .= snn_inset_css($attributes['inset'] ?? [], $selector);
    $css .= snn_transition_css($attributes['transitions'] ?? [], $selector);
    $css .= snn_animation_css($attributes['animations'] ?? [], $selector);

    // ── 3. Build wrapper attrs ──
    $wrapper_attrs = ['class' => esc_attr(implode(' ', $classes))];
    if ($inline_styles) $wrapper_attrs['style'] = $inline_styles;
    if ($anchor) $wrapper_attrs['id'] = esc_attr($anchor);

    // ── 4. Build HTML ──
    $output = '<section';
    foreach ($wrapper_attrs as $k => $v) $output .= ' ' . $k . '="' . esc_attr($v) . '"';
    $output .= '>';

    $all_css = $css;
    if (!empty($custom_css)) {
        $safe = preg_replace('~<script\s|</style|url\(|expression\s*\(~i', '', $custom_css);
        if (str_contains($safe, 'selector')) {
            $all_css .= str_replace('selector', $selector, $safe) . "\n";
        } else {
            $all_css .= "{$selector} {\n{$safe}\n}\n";
        }
    }
    if ($all_css) SNN_CSS_Collector::instance()->collect($all_css);
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
