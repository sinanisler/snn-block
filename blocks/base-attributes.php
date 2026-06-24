<?php
/**
 * SNN Base Block Attributes — Shared attribute schema for all box-like blocks.
 *
 * Every block that renders a styled container (Box, Text, etc.) includes this
 * file and merges its attributes via snn_base_attributes().
 *
 * Usage in block.json render callback or block registration:
 *   require_once __DIR__ . '/../base-attributes.php';
 *   $attributes = array_merge(snn_base_attributes(), [ /* block-specific attrs */ ]);
 *
 * @package SNN
 */

defined('ABSPATH') || exit;

/**
 * Return the canonical base attribute definitions shared by all box-like blocks.
 *
 * Every attribute is a responsive object (desktop/tablet/mobile) unless noted.
 * The schema is a plain PHP array compatible with block.json `attributes`.
 *
 * @return array
 */
function snn_base_attributes() {
    return [
        /* ── Tag & Variant (Box block only) ── */
        'tagName'          => ['type' => 'string', 'default' => 'div'],
        'variant'          => ['type' => 'string', 'default' => 'container'],

        /* ── Color ── */
        'bgColor'          => ['type' => 'object', 'default' => []],
        'textColor'        => ['type' => 'object', 'default' => []],

        /* ── Background ── */
        'bgImage'          => ['type' => 'object', 'default' => []],
        'bgSize'           => ['type' => 'object', 'default' => []],
        'bgPosition'       => ['type' => 'object', 'default' => []],
        'bgRepeat'         => ['type' => 'object', 'default' => []],
        'bgAttachment'     => ['type' => 'object', 'default' => []],
        'bgOverlay'        => ['type' => 'object', 'default' => []],
        'bgGradient'       => ['type' => 'string', 'default' => ''],
        'bgGradients'      => ['type' => 'array', 'default' => []],
        'bgBlendMode'      => ['type' => 'object', 'default' => []],

        /* ── Layout ── */
        'display'          => ['type' => 'object', 'default' => []],
        'flexDirection'    => ['type' => 'object', 'default' => []],
        'flexWrap'         => ['type' => 'object', 'default' => []],
        'justifyContent'   => ['type' => 'object', 'default' => []],
        'justifyItems'     => ['type' => 'object', 'default' => []],
        'alignItems'       => ['type' => 'object', 'default' => []],
        'alignContent'     => ['type' => 'object', 'default' => []],
        'gap'              => ['type' => 'object', 'default' => []],
        'rowGap'           => ['type' => 'object', 'default' => []],
        'columnGap'        => ['type' => 'object', 'default' => []],
        'gridColumns'      => ['type' => 'object', 'default' => []],
        'gridRows'         => ['type' => 'object', 'default' => []],
        'gridAutoFlow'     => ['type' => 'object', 'default' => []],

        /* ── Flex child ── */
        'flexGrow'         => ['type' => 'object', 'default' => []],
        'flexShrink'       => ['type' => 'object', 'default' => []],
        'flexBasis'        => ['type' => 'object', 'default' => []],
        'alignSelf'        => ['type' => 'object', 'default' => []],

        /* ── Grid placement ── */
        'gridColumnStart'  => ['type' => 'object', 'default' => []],
        'gridColumnEnd'    => ['type' => 'object', 'default' => []],
        'gridRowStart'     => ['type' => 'object', 'default' => []],
        'gridRowEnd'       => ['type' => 'object', 'default' => []],
        'order'            => ['type' => 'object', 'default' => []],

        /* ── Sizing ── */
        'width'            => ['type' => 'object', 'default' => []],
        'height'           => ['type' => 'object', 'default' => []],
        'minWidth'         => ['type' => 'object', 'default' => []],
        'minHeight'        => ['type' => 'object', 'default' => []],
        'maxWidth'         => ['type' => 'object', 'default' => []],
        'maxHeight'        => ['type' => 'object', 'default' => []],
        'boxSizing'        => ['type' => 'object', 'default' => []],

        /* ── Spacing ── */
        'padding'          => ['type' => 'object', 'default' => []],
        'margin'           => ['type' => 'object', 'default' => []],
        'inset'            => ['type' => 'object', 'default' => []],

        /* ── Border ── */
        'border'           => ['type' => 'object', 'default' => []],
        'borderRadius'     => ['type' => 'object', 'default' => []],
        'outline'          => ['type' => 'object', 'default' => []],

        /* ── Typography ── */
        'fontFamily'       => ['type' => 'object', 'default' => []],
        'fontSize'         => ['type' => 'object', 'default' => []],
        'fontWeight'       => ['type' => 'object', 'default' => []],
        'lineHeight'       => ['type' => 'object', 'default' => []],
        'letterSpacing'    => ['type' => 'object', 'default' => []],
        'textTransform'    => ['type' => 'object', 'default' => []],
        'textAlign'        => ['type' => 'object', 'default' => []],

        /* ── Effects ── */
        'opacity'          => ['type' => 'object', 'default' => []],
        'blendMode'        => ['type' => 'object', 'default' => []],
        'boxShadow'        => ['type' => 'object', 'default' => []],
        'textShadow'       => ['type' => 'object', 'default' => []],
        'filter'           => ['type' => 'object', 'default' => []],
        'backdropFilter'   => ['type' => 'object', 'default' => []],
        'transform'        => ['type' => 'object', 'default' => []],

        /* ── Position ── */
        'position'         => ['type' => 'object', 'default' => []],
        'offsets'          => ['type' => 'object', 'default' => []],
        'zIndex'           => ['type' => 'object', 'default' => []],

        /* ── Misc ── */
        'overflow'         => ['type' => 'object', 'default' => []],
        'visibility'       => ['type' => 'object', 'default' => ['desktop' => true, 'tablet' => true, 'mobile' => true]],
        'clipPath'         => ['type' => 'object', 'default' => []],
        'objectFit'        => ['type' => 'object', 'default' => []],
        'aspectRatio'      => ['type' => 'object', 'default' => []],
        'cursor'           => ['type' => 'object', 'default' => []],
        'pointerEvents'    => ['type' => 'object', 'default' => []],
        'userSelect'       => ['type' => 'object', 'default' => []],
        'resize'           => ['type' => 'object', 'default' => []],
        'scrollBehavior'   => ['type' => 'object', 'default' => []],
        'scrollSnapType'   => ['type' => 'object', 'default' => []],
        'scrollSnapAlign'  => ['type' => 'object', 'default' => []],
        'scrollSnapStop'   => ['type' => 'object', 'default' => []],
        'textOverflow'     => ['type' => 'object', 'default' => []],
        'whiteSpace'       => ['type' => 'object', 'default' => []],
        'wordBreak'        => ['type' => 'object', 'default' => []],
        'verticalAlign'    => ['type' => 'object', 'default' => []],
        'willChange'       => ['type' => 'object', 'default' => []],
        'isolation'        => ['type' => 'object', 'default' => []],
        'listStyle'        => ['type' => 'object', 'default' => []],

        /* ── Animation ── */
        'transitions'      => ['type' => 'object', 'default' => []],
        'animations'       => ['type' => 'object', 'default' => []],

        /* ── Custom ── */
        'customCSS'        => ['type' => 'string', 'default' => ''],
    ];
}
