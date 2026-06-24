<?php
/**
 * SNN Block Helpers — PHP CSS generators for all Penpot-inspired controls.
 *
 * All blocks include this file to get access to responsive CSS generation helpers.
 *
 * Usage in any block.php:
 *   require_once __DIR__ . '/../block-helpers.php';
 *
 * @package SNN
 */

defined('ABSPATH') || exit;

/* ═══════════════════════════════════════════════
   CORE RESPONSIVE ENGINE
   ═══════════════════════════════════════════════ */

/**
 * Generate fully responsive CSS for a single property.
 * If $unit is provided, it is appended ONLY if the value doesn't already end with that unit.
 */
function snn_responsive_style($attr, $property, $selector, $unit = '') {
    if (empty($attr) || !is_array($attr)) return '';
    $css = '';
    $bps = ['desktop' => '', 'tablet' => 'max-width: 1023px', 'mobile' => 'max-width: 767px'];
    foreach (['desktop', 'tablet', 'mobile'] as $device) {
        $value = $attr[$device] ?? '';
        if ($value === '' || $value === null || $value === false) continue;
        // If unit is specified and value doesn't already end with it, append it
        if ($unit && is_string($value) && !preg_match('/' . preg_quote($unit, '/') . '$/', $value)) {
            $value .= $unit;
        }
        $cv = $value;
        if ($device === 'desktop') $css .= "{$selector} {{$property}: {$cv};}\n";
        else $css .= "@media ({$bps[$device]}) {\n\t{$selector} {{$property}: {$cv};}\n}\n";
    }
    return $css;
}

/* ─── 4-side responsive ─── */
function snn_responsive_sides($sides_data, $css_map, $selector) {
    if (empty($sides_data) || !is_array($sides_data)) return '';
    $bps = ['desktop' => '', 'tablet' => 'max-width: 1023px', 'mobile' => 'max-width: 767px'];
    $css = '';
    foreach (['desktop', 'tablet', 'mobile'] as $device) {
        $dv = $sides_data[$device] ?? [];
        if (empty($dv) || !is_array($dv)) continue;
        $rules = '';
        foreach ($css_map as $sk => $cp) {
            $val = $dv[$sk] ?? '';
            if ($val !== '') $rules .= "{$cp}: {$val};";
        }
        if (empty($rules)) continue;
        if ($device === 'desktop') $css .= "{$selector} {{$rules}}\n";
        else $css .= "@media ({$bps[$device]}) {\n\t{$selector} {{$rules}}\n}\n";
    }
    return $css;
}

/* ─── Padding ─── */
function snn_responsive_padding($padding, $selector) {
    return snn_responsive_sides($padding, [
        'top' => 'padding-top', 'right' => 'padding-right',
        'bottom' => 'padding-bottom', 'left' => 'padding-left',
    ], $selector);
}

/* ─── Margin ─── */
function snn_responsive_margin($margin, $selector) {
    return snn_responsive_sides($margin, [
        'top' => 'margin-top', 'right' => 'margin-right',
        'bottom' => 'margin-bottom', 'left' => 'margin-left',
    ], $selector);
}

/* ─── Border ─── */
function snn_border_css($border, $selector) {
    if (empty($border) || !is_array($border)) return '';
    $css = '';
    $style = $border['style'] ?? '';
    $has_width = !empty($border['width']);
    // Default to solid when width is set but no style defined
    if (!$style && $has_width) $style = 'solid';
    if ($style && $style !== 'none') {
        $css .= "{$selector} {border-style: {$style};}\n";
        if ($has_width)
            $css .= snn_responsive_sides($border['width'], [
                'top' => 'border-top-width', 'right' => 'border-right-width',
                'bottom' => 'border-bottom-width', 'left' => 'border-left-width',
            ], $selector);
        $color = $border['color'] ?? '';
        if ($color) $css .= "{$selector} {border-color: {$color};}\n";
    }
    return $css;
}

/* ─── Border Radius ─── */
function snn_border_radius_css($radius, $selector) {
    return snn_responsive_sides($radius, [
        'topLeft' => 'border-top-left-radius', 'topRight' => 'border-top-right-radius',
        'bottomRight' => 'border-bottom-right-radius', 'bottomLeft' => 'border-bottom-left-radius',
    ], $selector);
}

/* ─── Box Shadow ─── */
function snn_box_shadow_css($shadows, $selector) {
    if (empty($shadows) || !is_array($shadows)) return '';
    $values = [];
    foreach ($shadows as $s) {
        if (empty($s) || !is_array($s)) continue;
        $inset = ($s['type'] ?? 'drop') === 'inner' ? 'inset ' : '';
        $sx = $s['x'] ?? '0'; $sy = $s['y'] ?? '0'; $sblur = $s['blur'] ?? '0';
        $sspread = $s['spread'] ?? '0'; $scolor = $s['color'] ?? 'rgba(0,0,0,0.2)';
        $values[] = "{$inset}{$sx} {$sy} {$sblur} {$sspread} {$scolor}";
    }
    return empty($values) ? '' : "{$selector} {box-shadow: " . implode(', ', $values) . ";}\n";
}

/* ─── CSS Filter ─── */
function snn_filter_css($filters, $selector) {
    if (empty($filters) || !is_array($filters)) return '';
    $map = ['blur'=>'blur(%spx)','brightness'=>'brightness(%s%%)','contrast'=>'contrast(%s%%)','grayscale'=>'grayscale(%s%%)','hueRotate'=>'hue-rotate(%sdeg)','invert'=>'invert(%s%%)','saturate'=>'saturate(%s%%)','sepia'=>'sepia(%s%%)'];
    $parts = [];
    foreach ($map as $k => $f) { $v = $filters[$k] ?? ''; if ($v !== '' && $v !== null) $parts[] = sprintf($f, $v); }
    return empty($parts) ? '' : "{$selector} {filter: " . implode(' ', $parts) . ";}\n";
}

/* ─── Transform ─── */
function snn_transform_css($transform, $selector) {
    if (empty($transform) || !is_array($transform)) return '';
    $parts = [];
    $tx = $transform['translateX'] ?? ''; $ty = $transform['translateY'] ?? '';
    if ($tx !== '' || $ty !== '') $parts[] = 'translate(' . ($tx ?: '0') . ', ' . ($ty ?: '0') . ')';
    $sx = $transform['scaleX'] ?? ''; $sy = $transform['scaleY'] ?? '';
    if ($sx !== '' || $sy !== '') $parts[] = 'scale(' . ($sx ?: '1') . ', ' . ($sy ?: '1') . ')';
    if (!empty($transform['rotate'])) $parts[] = 'rotate(' . $transform['rotate'] . ')';
    $kx = $transform['skewX'] ?? ''; $ky = $transform['skewY'] ?? '';
    if ($kx !== '' || $ky !== '') $parts[] = 'skew(' . ($kx ?: '0') . ', ' . ($ky ?: '0') . ')';
    return empty($parts) ? '' : "{$selector} {transform: " . implode(' ', $parts) . ";}\n";
}

/* ─── Opacity ─── */
function snn_opacity_css($opacity, $selector) { return ($opacity === '' || $opacity === null) ? '' : "{$selector} {opacity: {$opacity};}\n"; }

/* ─── Blend Mode ─── */
function snn_blend_mode_css($bm, $selector) { return (empty($bm) || $bm === 'normal') ? '' : "{$selector} {mix-blend-mode: {$bm};}\n"; }

/* ─── Background Overlay ─── */
function snn_bg_overlay_css($overlay, $selector) {
    if (empty($overlay) || !is_array($overlay)) return '';
    $color = $overlay['color'] ?? ''; $opacity = $overlay['opacity'] ?? '';
    if (!$color) return '';
    $o = $opacity !== '' ? floatval($opacity) : 0.5;
    return "{$selector}::before {content: ''; position: absolute; inset: 0; background-color: {$color}; opacity: {$o}; z-index: 0; pointer-events: none;}\n";
}

/* ─── Device Visibility ─── */
function snn_visibility_css($visibility, $selector) {
    if (empty($visibility) || !is_array($visibility)) return '';
    $css = '';
    if (empty($visibility['desktop'])) $css .= "{$selector} {display: none;}\n";
    if (!empty($visibility['desktop']) && empty($visibility['tablet'])) $css .= "@media (max-width: 1023px) {\n\t{$selector} {display: none;}\n}\n";
    if (!empty($visibility['desktop']) && empty($visibility['mobile'])) $css .= "@media (max-width: 767px) {\n\t{$selector} {display: none;}\n}\n";
    return $css;
}

/* ─── Position, Offsets, Z-Index ─── */
function snn_position_css($position, $offsets, $z_index, $selector) {
    $css = '';
    if ($position && $position !== 'static') $css .= "{$selector} {position: {$position};}\n";
    if (!empty($offsets) && is_array($offsets)) {
        $rules = '';
        foreach (['top','right','bottom','left'] as $s) { $v = $offsets[$s] ?? ''; if ($v !== '') $rules .= "{$s}: {$v};"; }
        if ($rules) $css .= "{$selector} {{$rules}}\n";
    }
    if ($z_index !== '' && $z_index !== null) $css .= "{$selector} {z-index: {$z_index};}\n";
    return $css;
}

/* ═══════════════════════════════════════════════
   NEW CONTROLS — ADDED 2026-06-24
   ═══════════════════════════════════════════════ */

/* ─── Background Gradient ─── */
function snn_bg_gradient_css($gradient, $selector) {
    return ($gradient && is_string($gradient)) ? "{$selector} {background-image: {$gradient};}\n" : '';
}

/* ─── Background Blend Mode ─── */
function snn_bg_blend_mode_css($bm, $selector) {
    return (empty($bm) || $bm === 'normal') ? '' : "{$selector} {background-blend-mode: {$bm};}\n";
}

/* ─── Box Sizing ─── */
function snn_box_sizing_css($box_sizing, $selector) {
    return snn_responsive_style($box_sizing, 'box-sizing', $selector);
}

/* ─── Grid Template Rows ─── */
function snn_grid_rows_css($grid_rows, $selector) {
    return snn_responsive_style($grid_rows, 'grid-template-rows', $selector);
}

/* ─── Grid Auto Flow ─── */
function snn_grid_auto_flow_css($grid_auto_flow, $selector) {
    return snn_responsive_style($grid_auto_flow, 'grid-auto-flow', $selector);
}

/* ─── Row Gap ─── */
function snn_row_gap_css($row_gap, $selector) {
    return snn_responsive_style($row_gap, 'row-gap', $selector);
}

/* ─── Column Gap ─── */
function snn_column_gap_css($column_gap, $selector) {
    return snn_responsive_style($column_gap, 'column-gap', $selector);
}

/* ─── Flex Child: Grow, Shrink, Basis, Align Self ─── */
function snn_flex_grow_css($flex_grow, $selector) {
    return snn_responsive_style($flex_grow, 'flex-grow', $selector);
}
function snn_flex_shrink_css($flex_shrink, $selector) {
    return snn_responsive_style($flex_shrink, 'flex-shrink', $selector);
}
function snn_flex_basis_css($flex_basis, $selector) {
    return snn_responsive_style($flex_basis, 'flex-basis', $selector);
}
function snn_align_self_css($align_self, $selector) {
    return snn_responsive_style($align_self, 'align-self', $selector);
}

/* ─── Order ─── */
function snn_order_css($order, $selector) {
    return snn_responsive_style($order, 'order', $selector);
}

/* ─── Grid Placement ─── */
function snn_grid_column_start_css($val, $selector) { return snn_responsive_style($val, 'grid-column-start', $selector); }
function snn_grid_column_end_css($val, $selector)   { return snn_responsive_style($val, 'grid-column-end', $selector); }
function snn_grid_row_start_css($val, $selector)    { return snn_responsive_style($val, 'grid-row-start', $selector); }
function snn_grid_row_end_css($val, $selector)      { return snn_responsive_style($val, 'grid-row-end', $selector); }

/* ─── Backdrop Filter ─── */
function snn_backdrop_filter_css($filters, $selector) {
    if (empty($filters) || !is_array($filters)) return '';
    $map = ['blur'=>'blur(%spx)','brightness'=>'brightness(%s%%)','contrast'=>'contrast(%s%%)','grayscale'=>'grayscale(%s%%)','hueRotate'=>'hue-rotate(%sdeg)','invert'=>'invert(%s%%)','saturate'=>'saturate(%s%%)','sepia'=>'sepia(%s%%)'];
    $parts = [];
    foreach ($map as $k => $f) { $v = $filters[$k] ?? ''; if ($v !== '' && $v !== null) $parts[] = sprintf($f, $v); }
    return empty($parts) ? '' : "{$selector} {backdrop-filter: " . implode(' ', $parts) . ";}\n";
}

/* ─── Text Shadow ─── */
function snn_text_shadow_css($shadows, $selector) {
    if (empty($shadows) || !is_array($shadows)) return '';
    $values = [];
    foreach ($shadows as $s) {
        if (empty($s) || !is_array($s)) continue;
        $sx = $s['x'] ?? '0'; $sy = $s['y'] ?? '0'; $sblur = $s['blur'] ?? '0'; $scolor = $s['color'] ?? 'rgba(0,0,0,0.2)';
        $values[] = "{$sx} {$sy} {$sblur} {$scolor}";
    }
    return empty($values) ? '' : "{$selector} {text-shadow: " . implode(', ', $values) . ";}\n";
}

/* ─── Outline ─── */
function snn_outline_css($outline, $selector) {
    if (empty($outline) || !is_array($outline)) return '';
    $css = '';
    $style = $outline['style'] ?? '';
    $width = $outline['width'] ?? '';
    $color = $outline['color'] ?? '';
    if ($style && $style !== 'none') {
        $parts = [];
        if ($width) $parts[] = $width;
        $parts[] = $style;
        if ($color) $parts[] = $color;
        if (!empty($parts)) $css .= "{$selector} {outline: " . implode(' ', $parts) . ";}\n";
    } elseif ($style === 'none') {
        $css .= "{$selector} {outline: none;}\n";
    }
    return $css;
}

/* ─── Object Fit ─── */
function snn_object_fit_css($object_fit, $selector) {
    return snn_responsive_style($object_fit, 'object-fit', $selector);
}

/* ─── Aspect Ratio ─── */
function snn_aspect_ratio_css($aspect_ratio, $selector) {
    return snn_responsive_style($aspect_ratio, 'aspect-ratio', $selector);
}

/* ─── Clip Path ─── */
function snn_clip_path_css($clip_path, $selector) {
    return snn_responsive_style($clip_path, 'clip-path', $selector);
}

/* ─── Cursor ─── */
function snn_cursor_css($cursor, $selector) {
    return snn_responsive_style($cursor, 'cursor', $selector);
}

/* ─── Pointer Events ─── */
function snn_pointer_events_css($pointer_events, $selector) {
    return snn_responsive_style($pointer_events, 'pointer-events', $selector);
}

/* ─── User Select ─── */
function snn_user_select_css($user_select, $selector) {
    return snn_responsive_style($user_select, 'user-select', $selector);
}

/* ─── Resize ─── */
function snn_resize_css($resize, $selector) {
    return snn_responsive_style($resize, 'resize', $selector);
}

/* ─── Scroll Behavior ─── */
function snn_scroll_behavior_css($scroll_behavior, $selector) {
    return snn_responsive_style($scroll_behavior, 'scroll-behavior', $selector);
}

/* ─── Scroll Snap ─── */
function snn_scroll_snap_css($snap_type, $snap_align, $snap_stop, $selector) {
    $css = '';
    $css .= snn_responsive_style($snap_type, 'scroll-snap-type', $selector);
    $css .= snn_responsive_style($snap_align, 'scroll-snap-align', $selector);
    $css .= snn_responsive_style($snap_stop, 'scroll-snap-stop', $selector);
    return $css;
}

/* ─── Text Overflow ─── */
function snn_text_overflow_css($text_overflow, $selector) {
    return snn_responsive_style($text_overflow, 'text-overflow', $selector);
}

/* ─── White Space ─── */
function snn_white_space_css($white_space, $selector) {
    return snn_responsive_style($white_space, 'white-space', $selector);
}

/* ─── Word Break ─── */
function snn_word_break_css($word_break, $selector) {
    return snn_responsive_style($word_break, 'word-break', $selector);
}

/* ─── Vertical Align ─── */
function snn_vertical_align_css($vertical_align, $selector) {
    return snn_responsive_style($vertical_align, 'vertical-align', $selector);
}

/* ─── Will Change ─── */
function snn_will_change_css($will_change, $selector) {
    return snn_responsive_style($will_change, 'will-change', $selector);
}

/* ─── Isolation ─── */
function snn_isolation_css($isolation, $selector) {
    return snn_responsive_style($isolation, 'isolation', $selector);
}

/* ─── List Style ─── */
function snn_list_style_css($list_style, $selector) {
    if (empty($list_style) || !is_array($list_style)) return '';
    $css = '';
    $type = $list_style['type'] ?? '';
    $pos  = $list_style['position'] ?? '';
    if ($type) $css .= "{$selector} {list-style-type: {$type};}\n";
    if ($pos)  $css .= "{$selector} {list-style-position: {$pos};}\n";
    return $css;
}

/* ─── Inset (positioned shorthand) ─── */
function snn_inset_css($inset, $selector) {
    if (empty($inset) || !is_array($inset)) return '';
    return snn_responsive_sides($inset, [
        'top' => 'top', 'right' => 'right',
        'bottom' => 'bottom', 'left' => 'left',
    ], $selector);
}

/* ─── Transition ─── */
function snn_transition_css($transitions, $selector) {
    if (empty($transitions) || !is_array($transitions)) return '';
    $values = [];
    foreach ($transitions as $t) {
        if (empty($t) || !is_array($t)) continue;
        $prop = $t['property'] ?? 'all';
        $dur  = $t['duration'] ?? '0.3s';
        $tim  = $t['timing'] ?? 'ease';
        $del  = $t['delay'] ?? '0s';
        $values[] = "{$prop} {$dur} {$tim} {$del}";
    }
    return empty($values) ? '' : "{$selector} {transition: " . implode(', ', $values) . ";}\n";
}

/* ─── Animation ─── */
function snn_animation_css($animations, $selector) {
    if (empty($animations) || !is_array($animations)) return '';
    $values = [];
    foreach ($animations as $a) {
        if (empty($a) || !is_array($a)) continue;
        $name  = $a['name'] ?? 'fadeIn';
        $dur   = $a['duration'] ?? '0.5s';
        $tim   = $a['timing'] ?? 'ease';
        $del   = $a['delay'] ?? '0s';
        $count = $a['iterationCount'] ?? '1';
        $dir   = $a['direction'] ?? 'normal';
        $fill  = $a['fillMode'] ?? 'forwards';
        $values[] = "{$name} {$dur} {$tim} {$del} {$count} {$dir} {$fill}";
    }
    return empty($values) ? '' : "{$selector} {animation: " . implode(', ', $values) . ";}\n";
}
