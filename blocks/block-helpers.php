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
   CSS COLLECTOR — aggregates all block CSS into a single <style> tag
   ═══════════════════════════════════════════════ */

/**
 * Singleton CSS collector. Instead of each block emitting its own <style> tag
 * inline (which can produce 50+ style tags on a page), all block CSS is
 * collected here and rendered once in wp_footer.
 *
 * Usage in any block render callback:
 *   SNN_CSS_Collector::instance()->collect($css);
 */
class SNN_CSS_Collector {
    private static $instance = null;
    private $css = '';

    public static function instance() {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    /**
     * Append a CSS snippet to the global collector.
     * @param string $css Raw CSS to collect.
     */
    public function collect($css) {
        if (is_string($css) && $css !== '') {
            $this->css .= $css;
        }
    }

    /**
     * Output the aggregated CSS in a single <style> tag.
     * Must be static because WordPress hooks call it statically.
     */
    public static function render() {
        $instance = self::instance();
        if ($instance->css === '') return;
        echo "\n<!-- SNN Block Styles (aggregated) -->\n";
        echo '<style id="snn-block-styles">' . "\n" . $instance->css . '</style>' . "\n";
    }
}

// Hook the collector output into the footer on both frontend and editor.
add_action('wp_footer',    ['SNN_CSS_Collector', 'render'], 9999);
add_action('admin_footer', ['SNN_CSS_Collector', 'render'], 9999);

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

/* ─── Box Shadow (responsive) ─── */
function snn_box_shadow_css($shadows, $selector) {
    if (empty($shadows) || !is_array($shadows)) return '';
    $bps = ['desktop' => '', 'tablet' => 'max-width: 1023px', 'mobile' => 'max-width: 767px'];
    $css = '';
    foreach (['desktop', 'tablet', 'mobile'] as $device) {
        $dv = $shadows[$device] ?? null;
        if (empty($dv) || !is_array($dv)) continue;
        $values = [];
        foreach ($dv as $s) {
            if (empty($s) || !is_array($s)) continue;
            $inset = ($s['type'] ?? 'drop') === 'inner' ? 'inset ' : '';
            $sx = $s['x'] ?? '0'; $sy = $s['y'] ?? '0'; $sblur = $s['blur'] ?? '0';
            $sspread = $s['spread'] ?? '0'; $scolor = $s['color'] ?? 'rgba(0,0,0,0.2)';
            $values[] = "{$inset}{$sx} {$sy} {$sblur} {$sspread} {$scolor}";
        }
        if (empty($values)) continue;
        if ($device === 'desktop') $css .= "{$selector} {box-shadow: " . implode(', ', $values) . ";}\n";
        else $css .= "@media ({$bps[$device]}) {\n\t{$selector} {box-shadow: " . implode(', ', $values) . ";}\n}\n";
    }
    return $css;
}

/* ─── CSS Filter (responsive) ─── */
function snn_filter_css($filters, $selector) {
    if (empty($filters) || !is_array($filters)) return '';
    $bps = ['desktop' => '', 'tablet' => 'max-width: 1023px', 'mobile' => 'max-width: 767px'];
    $map = ['blur'=>'blur(%spx)','brightness'=>'brightness(%s%%)','contrast'=>'contrast(%s%%)','grayscale'=>'grayscale(%s%%)','hueRotate'=>'hue-rotate(%sdeg)','invert'=>'invert(%s%%)','saturate'=>'saturate(%s%%)','sepia'=>'sepia(%s%%)'];
    $css = '';
    foreach (['desktop', 'tablet', 'mobile'] as $device) {
        $dv = $filters[$device] ?? null;
        if (empty($dv) || !is_array($dv)) continue;
        $parts = [];
        foreach ($map as $k => $f) { $v = $dv[$k] ?? ''; if ($v !== '' && $v !== null) $parts[] = sprintf($f, $v); }
        if (empty($parts)) continue;
        if ($device === 'desktop') $css .= "{$selector} {filter: " . implode(' ', $parts) . ";}\n";
        else $css .= "@media ({$bps[$device]}) {\n\t{$selector} {filter: " . implode(' ', $parts) . ";}\n}\n";
    }
    return $css;
}

/* ─── Transform (responsive) ─── */
function snn_transform_css($transform, $selector) {
    if (empty($transform) || !is_array($transform)) return '';
    $bps = ['desktop' => '', 'tablet' => 'max-width: 1023px', 'mobile' => 'max-width: 767px'];
    $css = '';
    foreach (['desktop', 'tablet', 'mobile'] as $device) {
        $dv = $transform[$device] ?? null;
        if (empty($dv) || !is_array($dv)) continue;
        $parts = [];
        $tx = $dv['translateX'] ?? ''; $ty = $dv['translateY'] ?? '';
        if ($tx !== '' || $ty !== '') $parts[] = 'translate(' . ($tx ?: '0') . ', ' . ($ty ?: '0') . ')';
        $sx = $dv['scaleX'] ?? ''; $sy = $dv['scaleY'] ?? '';
        if ($sx !== '' || $sy !== '') $parts[] = 'scale(' . ($sx ?: '1') . ', ' . ($sy ?: '1') . ')';
        if (!empty($dv['rotate'])) $parts[] = 'rotate(' . $dv['rotate'] . ')';
        $kx = $dv['skewX'] ?? ''; $ky = $dv['skewY'] ?? '';
        if ($kx !== '' || $ky !== '') $parts[] = 'skew(' . ($kx ?: '0') . ', ' . ($ky ?: '0') . ')';
        if (empty($parts)) continue;
        if ($device === 'desktop') $css .= "{$selector} {transform: " . implode(' ', $parts) . ";}\n";
        else $css .= "@media ({$bps[$device]}) {\n\t{$selector} {transform: " . implode(' ', $parts) . ";}\n}\n";
    }
    return $css;
}

/* ─── Opacity (responsive) ─── */
function snn_opacity_css($opacity, $selector) {
    return snn_responsive_style($opacity, 'opacity', $selector);
}

/* ─── Blend Mode (responsive) ─── */
function snn_blend_mode_css($bm, $selector) {
    return snn_responsive_style($bm, 'mix-blend-mode', $selector);
}

/* ─── Background Overlay (responsive — color or gradient per device) ─── */
function snn_bg_overlay_css($overlay, $selector) {
    if (empty($overlay) || !is_array($overlay)) return '';
    $bps = ['desktop' => '', 'tablet' => 'max-width: 1023px', 'mobile' => 'max-width: 767px'];
    $css = '';
    foreach (['desktop', 'tablet', 'mobile'] as $device) {
        $dv = $overlay[$device] ?? null;
        if (empty($dv) || !is_array($dv)) continue;
        $color    = $dv['color'] ?? '';
        $gradient = $dv['gradient'] ?? '';
        $opacity  = $dv['opacity'] ?? '';
        if (!$color && !$gradient) continue;
        $o = $opacity !== '' ? floatval($opacity) : 0.5;
        $rule = "{$selector}::before {content: ''; position: absolute; inset: 0; ";
        if ($gradient) { $rule .= "background-image: {$gradient}; "; }
        else { $rule .= "background-color: {$color}; "; }
        $rule .= "opacity: {$o}; z-index: 0; pointer-events: none;}";
        if ($device === 'desktop') $css .= $rule . "\n";
        else $css .= "@media ({$bps[$device]}) {\n\t{$rule}\n}\n";
    }
    return $css;
}

/* ─── Background Size / Position / Repeat / Attachment (responsive) ─── */
function snn_bg_size_css($v, $s) { return snn_responsive_style($v, 'background-size', $s); }
function snn_bg_position_css($v, $s) { return snn_responsive_style($v, 'background-position', $s); }
function snn_bg_repeat_css($v, $s) { return snn_responsive_style($v, 'background-repeat', $s); }
function snn_bg_attachment_css($v, $s) { return snn_responsive_style($v, 'background-attachment', $s); }

/* ─── Device Visibility ─── */
function snn_visibility_css($visibility, $selector) {
    if (empty($visibility) || !is_array($visibility)) return '';
    $css = '';
    if (empty($visibility['desktop'])) $css .= "{$selector} {display: none;}\n";
    if (!empty($visibility['desktop']) && empty($visibility['tablet'])) $css .= "@media (max-width: 1023px) {\n\t{$selector} {display: none;}\n}\n";
    if (!empty($visibility['desktop']) && empty($visibility['mobile'])) $css .= "@media (max-width: 767px) {\n\t{$selector} {display: none;}\n}\n";
    return $css;
}

/* ─── Position, Offsets, Z-Index (responsive) ─── */
function snn_position_css($position, $offsets, $z_index, $selector) {
    $css = '';
    $css .= snn_responsive_style($position, 'position', $selector);
    if (!empty($offsets) && is_array($offsets)) {
        $css .= snn_responsive_sides($offsets, ['top'=>'top','right'=>'right','bottom'=>'bottom','left'=>'left'], $selector);
    }
    $css .= snn_responsive_style($z_index, 'z-index', $selector);
    return $css;
}

/* ═══════════════════════════════════════════════
   NEW CONTROLS — ADDED 2026-06-24
   ═══════════════════════════════════════════════ */

/* ─── Background Gradient (supports new bgGradients array + legacy bgGradient string) ─── */
function snn_bg_gradient_css($gradients, $selector) {
    if (empty($gradients)) return '';
    // New multi-gradient array format: [{css:'...'}, ...]
    if (is_array($gradients) && isset($gradients[0]) && is_array($gradients[0])) {
        $parts = [];
        foreach ($gradients as $g) {
            $css = $g['css'] ?? '';
            if (is_string($css) && $css !== '') $parts[] = $css;
        }
        return empty($parts) ? '' : "{$selector} {background-image: " . implode(', ', $parts) . ";}\n";
    }
    // Legacy single string format
    if (is_string($gradients) && $gradients !== '') {
        return "{$selector} {background-image: {$gradients};}\n";
    }
    return '';
}

/* ─── Background Blend Mode ─── */
function snn_bg_blend_mode_css($bm, $selector) {
    return snn_responsive_style($bm, 'background-blend-mode', $selector);
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

/* ─── Backdrop Filter (responsive) ─── */
function snn_backdrop_filter_css($filters, $selector) {
    if (empty($filters) || !is_array($filters)) return '';
    $bps = ['desktop' => '', 'tablet' => 'max-width: 1023px', 'mobile' => 'max-width: 767px'];
    $map = ['blur'=>'blur(%spx)','brightness'=>'brightness(%s%%)','contrast'=>'contrast(%s%%)','grayscale'=>'grayscale(%s%%)','hueRotate'=>'hue-rotate(%sdeg)','invert'=>'invert(%s%%)','saturate'=>'saturate(%s%%)','sepia'=>'sepia(%s%%)'];
    $css = '';
    foreach (['desktop', 'tablet', 'mobile'] as $device) {
        $dv = $filters[$device] ?? null;
        if (empty($dv) || !is_array($dv)) continue;
        $parts = [];
        foreach ($map as $k => $f) { $v = $dv[$k] ?? ''; if ($v !== '' && $v !== null) $parts[] = sprintf($f, $v); }
        if (empty($parts)) continue;
        if ($device === 'desktop') $css .= "{$selector} {backdrop-filter: " . implode(' ', $parts) . ";}\n";
        else $css .= "@media ({$bps[$device]}) {\n\t{$selector} {backdrop-filter: " . implode(' ', $parts) . ";}\n}\n";
    }
    return $css;
}

/* ─── Text Shadow (responsive) ─── */
function snn_text_shadow_css($shadows, $selector) {
    if (empty($shadows) || !is_array($shadows)) return '';
    $bps = ['desktop' => '', 'tablet' => 'max-width: 1023px', 'mobile' => 'max-width: 767px'];
    $css = '';
    foreach (['desktop', 'tablet', 'mobile'] as $device) {
        $dv = $shadows[$device] ?? null;
        if (empty($dv) || !is_array($dv)) continue;
        $values = [];
        foreach ($dv as $s) {
            if (empty($s) || !is_array($s)) continue;
            $sx = $s['x'] ?? '0'; $sy = $s['y'] ?? '0'; $sblur = $s['blur'] ?? '0'; $scolor = $s['color'] ?? 'rgba(0,0,0,0.2)';
            $values[] = "{$sx} {$sy} {$sblur} {$scolor}";
        }
        if (empty($values)) continue;
        if ($device === 'desktop') $css .= "{$selector} {text-shadow: " . implode(', ', $values) . ";}\n";
        else $css .= "@media ({$bps[$device]}) {\n\t{$selector} {text-shadow: " . implode(', ', $values) . ";}\n}\n";
    }
    return $css;
}

/* ─── Outline (responsive) ─── */
function snn_outline_css($outline, $selector) {
    if (empty($outline) || !is_array($outline)) return '';
    $bps = ['desktop' => '', 'tablet' => 'max-width: 1023px', 'mobile' => 'max-width: 767px'];
    $css = '';
    foreach (['desktop', 'tablet', 'mobile'] as $device) {
        $dv = $outline[$device] ?? null;
        if (empty($dv) || !is_array($dv)) continue;
        $style = $dv['style'] ?? ''; $width = $dv['width'] ?? ''; $color = $dv['color'] ?? '';
        if (!$style && !$width && !$color) continue;
        $rule = ($style === 'none') ? 'none' : trim(($width ? $width . ' ' : '') . $style . ($color ? ' ' . $color : ''));
        if (empty($rule)) continue;
        if ($device === 'desktop') $css .= "{$selector} {outline: {$rule};}\n";
        else $css .= "@media ({$bps[$device]}) {\n\t{$selector} {outline: {$rule};}\n}\n";
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

/* ─── List Style (responsive) ─── */
function snn_list_style_css($list_style, $selector) {
    if (empty($list_style) || !is_array($list_style)) return '';
    $bps = ['desktop' => '', 'tablet' => 'max-width: 1023px', 'mobile' => 'max-width: 767px'];
    $css = '';
    foreach (['desktop', 'tablet', 'mobile'] as $device) {
        $dv = $list_style[$device] ?? null;
        if (empty($dv) || !is_array($dv)) continue;
        $type = $dv['type'] ?? ''; $pos = $dv['position'] ?? '';
        $rules = '';
        if ($type) $rules .= "list-style-type: {$type};";
        if ($pos)  $rules .= "list-style-position: {$pos};";
        if (empty($rules)) continue;
        if ($device === 'desktop') $css .= "{$selector} {{$rules}}\n";
        else $css .= "@media ({$bps[$device]}) {\n\t{$selector} {{$rules}}\n}\n";
    }
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

/* ─── Transition (responsive) ─── */
function snn_transition_css($transitions, $selector) {
    if (empty($transitions) || !is_array($transitions)) return '';
    $bps = ['desktop' => '', 'tablet' => 'max-width: 1023px', 'mobile' => 'max-width: 767px'];
    $css = '';
    foreach (['desktop', 'tablet', 'mobile'] as $device) {
        $dv = $transitions[$device] ?? null;
        if (empty($dv) || !is_array($dv)) continue;
        $values = [];
        foreach ($dv as $t) {
            if (empty($t) || !is_array($t)) continue;
            $prop = $t['property'] ?? 'all'; $dur = $t['duration'] ?? '0.3s';
            $tim = $t['timing'] ?? 'ease'; $del = $t['delay'] ?? '0s';
            $values[] = "{$prop} {$dur} {$tim} {$del}";
        }
        if (empty($values)) continue;
        if ($device === 'desktop') $css .= "{$selector} {transition: " . implode(', ', $values) . ";}\n";
        else $css .= "@media ({$bps[$device]}) {\n\t{$selector} {transition: " . implode(', ', $values) . ";}\n}\n";
    }
    return $css;
}

/* ─── Animation (responsive) ─── */
function snn_animation_css($animations, $selector) {
    if (empty($animations) || !is_array($animations)) return '';
    $bps = ['desktop' => '', 'tablet' => 'max-width: 1023px', 'mobile' => 'max-width: 767px'];
    $css = '';
    foreach (['desktop', 'tablet', 'mobile'] as $device) {
        $dv = $animations[$device] ?? null;
        if (empty($dv) || !is_array($dv)) continue;
        $values = [];
        foreach ($dv as $a) {
            if (empty($a) || !is_array($a)) continue;
            $name = $a['name'] ?? 'fadeIn'; $dur = $a['duration'] ?? '0.5s';
            $tim = $a['timing'] ?? 'ease'; $del = $a['delay'] ?? '0s';
            $count = $a['iterationCount'] ?? '1'; $dir = $a['direction'] ?? 'normal'; $fill = $a['fillMode'] ?? 'forwards';
            $values[] = "{$name} {$dur} {$tim} {$del} {$count} {$dir} {$fill}";
        }
        if (empty($values)) continue;
        if ($device === 'desktop') $css .= "{$selector} {animation: " . implode(', ', $values) . ";}\n";
        else $css .= "@media ({$bps[$device]}) {\n\t{$selector} {animation: " . implode(', ', $values) . ";}\n}\n";
    }
    return $css;
}

/* ═══════════════════════════════════════════════
   UNIFIED BOX CSS RENDERER
   One function to generate ALL responsive CSS for any box-like block.
   Used by: Box, Text, and any future styled-container blocks.
   ═══════════════════════════════════════════════ */

/**
 * Generate the complete responsive CSS for a box-like block from its attributes.
 *
 * @param array  $attrs    The block attributes array.
 * @param string $selector CSS selector (e.g. '.snn-b-abc123').
 * @return string Complete CSS with media queries.
 */
function snn_render_box_css($attrs, $selector) {
    $css = '';

    // Color
    $css .= snn_responsive_style($attrs['bgColor']       ?? [], 'background-color', $selector);
    $css .= snn_responsive_style($attrs['textColor']     ?? [], 'color',            $selector);

    // Background
    $css .= snn_bg_size_css(       $attrs['bgSize']       ?? [], $selector);
    $css .= snn_bg_position_css(   $attrs['bgPosition']   ?? [], $selector);
    $css .= snn_bg_repeat_css(     $attrs['bgRepeat']     ?? [], $selector);
    $css .= snn_bg_attachment_css( $attrs['bgAttachment'] ?? [], $selector);
    $css .= snn_bg_blend_mode_css( $attrs['bgBlendMode']  ?? [], $selector);
    $css .= snn_bg_gradient_css(
        !empty($attrs['bgGradients']) ? $attrs['bgGradients'] : ($attrs['bgGradient'] ?? ''),
        $selector
    );

    // Overlay
    $css .= snn_bg_overlay_css($attrs['bgOverlay'] ?? [], $selector);

    // Layout
    $css .= snn_responsive_style($attrs['display']        ?? [], 'display',              $selector);
    $css .= snn_responsive_style($attrs['flexDirection']  ?? [], 'flex-direction',       $selector);
    $css .= snn_responsive_style($attrs['flexWrap']       ?? [], 'flex-wrap',            $selector);
    $css .= snn_responsive_style($attrs['justifyContent'] ?? [], 'justify-content',      $selector);
    $css .= snn_responsive_style($attrs['justifyItems']   ?? [], 'justify-items',        $selector);
    $css .= snn_responsive_style($attrs['alignItems']     ?? [], 'align-items',          $selector);
    $css .= snn_responsive_style($attrs['alignContent']   ?? [], 'align-content',        $selector);
    $css .= snn_responsive_style($attrs['gap']            ?? [], 'gap',                  $selector);
    $css .= snn_responsive_style($attrs['gridColumns']    ?? [], 'grid-template-columns',$selector);
    $css .= snn_grid_rows_css(     $attrs['gridRows']     ?? [], $selector);
    $css .= snn_grid_auto_flow_css($attrs['gridAutoFlow'] ?? [], $selector);
    $css .= snn_row_gap_css(       $attrs['rowGap']       ?? [], $selector);
    $css .= snn_column_gap_css(    $attrs['columnGap']    ?? [], $selector);

    // Flex child
    $css .= snn_flex_grow_css(   $attrs['flexGrow']   ?? [], $selector);
    $css .= snn_flex_shrink_css( $attrs['flexShrink'] ?? [], $selector);
    $css .= snn_flex_basis_css(  $attrs['flexBasis']  ?? [], $selector);
    $css .= snn_align_self_css(  $attrs['alignSelf']  ?? [], $selector);

    // Grid placement
    $css .= snn_grid_column_start_css($attrs['gridColumnStart'] ?? [], $selector);
    $css .= snn_grid_column_end_css(  $attrs['gridColumnEnd']   ?? [], $selector);
    $css .= snn_grid_row_start_css(   $attrs['gridRowStart']    ?? [], $selector);
    $css .= snn_grid_row_end_css(     $attrs['gridRowEnd']      ?? [], $selector);
    $css .= snn_order_css(            $attrs['order']           ?? [], $selector);

    // Sizing
    $css .= snn_responsive_style($attrs['width']      ?? [], 'width',       $selector);
    $css .= snn_responsive_style($attrs['height']     ?? [], 'height',      $selector);
    $css .= snn_responsive_style($attrs['minWidth']   ?? [], 'min-width',   $selector);
    $css .= snn_responsive_style($attrs['minHeight']  ?? [], 'min-height',  $selector);
    $css .= snn_responsive_style($attrs['maxWidth']   ?? [], 'max-width',   $selector);
    $css .= snn_responsive_style($attrs['maxHeight']  ?? [], 'max-height',  $selector);
    $css .= snn_box_sizing_css( $attrs['boxSizing']   ?? [], $selector);

    // Spacing
    $css .= snn_responsive_padding($attrs['padding'] ?? [], $selector);
    $css .= snn_responsive_margin( $attrs['margin']  ?? [], $selector);
    $css .= snn_inset_css(         $attrs['inset']   ?? [], $selector);

    // Border
    $css .= snn_border_css(        $attrs['border']       ?? [], $selector);
    $css .= snn_border_radius_css( $attrs['borderRadius'] ?? [], $selector);
    $css .= snn_outline_css(       $attrs['outline']      ?? [], $selector);

    // Typography
    $css .= snn_responsive_style($attrs['fontFamily']    ?? [], 'font-family',     $selector);
    $css .= snn_responsive_style($attrs['fontSize']      ?? [], 'font-size',       $selector);
    $css .= snn_responsive_style($attrs['fontWeight']    ?? [], 'font-weight',     $selector);
    $css .= snn_responsive_style($attrs['lineHeight']    ?? [], 'line-height',     $selector);
    $css .= snn_responsive_style($attrs['letterSpacing'] ?? [], 'letter-spacing',  $selector);
    $css .= snn_responsive_style($attrs['textTransform'] ?? [], 'text-transform',  $selector);
    $css .= snn_responsive_style($attrs['textAlign']     ?? [], 'text-align',      $selector);

    // Effects
    $css .= snn_opacity_css(        $attrs['opacity']        ?? [], $selector);
    $css .= snn_blend_mode_css(     $attrs['blendMode']      ?? [], $selector);
    $css .= snn_box_shadow_css(     $attrs['boxShadow']      ?? [], $selector);
    $css .= snn_text_shadow_css(    $attrs['textShadow']     ?? [], $selector);
    $css .= snn_filter_css(         $attrs['filter']         ?? [], $selector);
    $css .= snn_backdrop_filter_css($attrs['backdropFilter'] ?? [], $selector);
    $css .= snn_transform_css(      $attrs['transform']      ?? [], $selector);

    // Position
    $css .= snn_position_css(
        $attrs['position'] ?? [],
        $attrs['offsets']  ?? [],
        $attrs['zIndex']   ?? [],
        $selector
    );

    // Misc
    $css .= snn_responsive_style($attrs['overflow']        ?? [], 'overflow',           $selector);
    $css .= snn_visibility_css(    $attrs['visibility']    ?? [], $selector);
    $css .= snn_clip_path_css(     $attrs['clipPath']      ?? [], $selector);
    $css .= snn_object_fit_css(    $attrs['objectFit']     ?? [], $selector);
    $css .= snn_aspect_ratio_css(  $attrs['aspectRatio']   ?? [], $selector);
    $css .= snn_cursor_css(        $attrs['cursor']        ?? [], $selector);
    $css .= snn_pointer_events_css($attrs['pointerEvents'] ?? [], $selector);
    $css .= snn_user_select_css(   $attrs['userSelect']    ?? [], $selector);
    $css .= snn_resize_css(        $attrs['resize']        ?? [], $selector);
    $css .= snn_scroll_behavior_css($attrs['scrollBehavior'] ?? [], $selector);
    $css .= snn_scroll_snap_css(
        $attrs['scrollSnapType']  ?? [],
        $attrs['scrollSnapAlign'] ?? [],
        $attrs['scrollSnapStop']  ?? [],
        $selector
    );
    $css .= snn_text_overflow_css( $attrs['textOverflow']  ?? [], $selector);
    $css .= snn_white_space_css(   $attrs['whiteSpace']    ?? [], $selector);
    $css .= snn_word_break_css(    $attrs['wordBreak']     ?? [], $selector);
    $css .= snn_vertical_align_css($attrs['verticalAlign'] ?? [], $selector);
    $css .= snn_will_change_css(   $attrs['willChange']    ?? [], $selector);
    $css .= snn_isolation_css(     $attrs['isolation']     ?? [], $selector);
    $css .= snn_list_style_css(    $attrs['listStyle']     ?? [], $selector);

    // Animation
    $css .= snn_transition_css($attrs['transitions'] ?? [], $selector);
    $css .= snn_animation_css($attrs['animations']  ?? [], $selector);

    return $css;
}
