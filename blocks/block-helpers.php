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
 */
function snn_responsive_style($attr, $property, $selector, $unit = '') {
    if (empty($attr) || !is_array($attr)) return '';
    $css = '';
    $bps = ['desktop' => '', 'tablet' => 'max-width: 1023px', 'mobile' => 'max-width: 767px'];
    foreach (['desktop', 'tablet', 'mobile'] as $device) {
        $value = $attr[$device] ?? '';
        if ($value === '' || $value === null || $value === false) continue;
        $cv = $value . $unit;
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
    if ($style && $style !== 'none') {
        $css .= "{$selector} {border-style: {$style};}\n";
        if (!empty($border['width']))
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
