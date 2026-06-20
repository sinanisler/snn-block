<?php
/**
 * SNN Block Helpers 
 *
 * The PHP equivalent of Controls.jsx: all blocks include this file to get
 * access to the generic `snn_responsive_style()` and `snn_responsive_padding()`
 * helpers, eliminating the duplicated per-block functions.
 *
 * Usage in any block.php:
 *   require_once __DIR__ . '/../block-helpers.php';
 *
 *   $css .= snn_responsive_style($attr, 'property-name', $selector, 'px');
 *   $css .= snn_responsive_padding($padding, $selector);
 *
 * @package SNN
 */

defined('ABSPATH') || exit;

/**
 * Generate fully responsive CSS for a single property.
 *
 * Desktop values become the base rule (no media query).
 * Tablet / mobile values are wrapped in @media queries so they can
 * properly override the desktop rule via CSS cascade.
 *
 * @param array  $attr     Responsive attribute: { desktop, tablet, mobile }.
 * @param string $property CSS property name (e.g. 'background-color', '--custom-prop').
 * @param string $selector CSS selector (e.g. '.snn-s-abc123').
 * @param string $unit     Optional unit suffix appended to the value (e.g. 'px', '%').
 *                         Omit when the value already contains its unit.
 * @return string          CSS rules, or empty string.
 */
function snn_responsive_style($attr, $property, $selector, $unit = '') {
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
            $css .= "{$selector} {{$property}: {$css_value};}\n";
        } else {
            $css .= "@media ({$breakpoints[$device]}) {\n";
            $css .= "\t{$selector} {{$property}: {$css_value};}\n";
            $css .= "}\n";
        }
    }

    return $css;
}

/**
 * Generate fully responsive padding CSS.
 *
 * Padding uses a nested 4-side object { top, right, bottom, left } per device,
 * unlike the flat-string `snn_responsive_style`.
 *
 * @param array  $padding  Responsive padding: { desktop: { top, right, bottom, left }, tablet: {…}, mobile: {…} }.
 * @param string $selector CSS selector.
 * @return string          CSS rules, or empty string.
 */
function snn_responsive_padding($padding, $selector) {
    if (empty($padding) || !is_array($padding)) {
        return '';
    }

    $sides = [
        'top'    => 'padding-top',
        'right'  => 'padding-right',
        'bottom' => 'padding-bottom',
        'left'   => 'padding-left',
    ];

    $devices     = ['desktop', 'tablet', 'mobile'];
    $breakpoints = [
        'desktop' => '',
        'tablet'  => 'max-width: 1023px',
        'mobile'  => 'max-width: 767px',
    ];

    $css = '';

    foreach ($devices as $device) {
        $device_padding = $padding[$device] ?? [];
        if (empty($device_padding) || !is_array($device_padding)) {
            continue;
        }

        $rules = '';
        foreach ($sides as $side => $prop) {
            $val = $device_padding[$side] ?? '';
            if ($val !== '') {
                $rules .= "{$prop}: {$val};";
            }
        }

        if (empty($rules)) {
            continue;
        }

        if ($device === 'desktop') {
            $css .= "{$selector} {{$rules}}\n";
        } else {
            $css .= "@media ({$breakpoints[$device]}) {\n";
            $css .= "\t{$selector} {{$rules}}\n";
            $css .= "}\n";
        }
    }

    return $css;
}
