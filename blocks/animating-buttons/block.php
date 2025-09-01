<?php
/**
 * Render callback for the Animating Buttons block
 */
function snn_animating_buttons_render($attributes) {
    $text = isset($attributes['text']) ? esc_html($attributes['text']) : 'Click Me';
    $url = isset($attributes['url']) ? esc_url($attributes['url']) : '#';
    $target = isset($attributes['target']) ? esc_attr($attributes['target']) : '_self';
    $rel = isset($attributes['rel']) ? esc_attr($attributes['rel']) : '';
    $animationType = isset($attributes['animationType']) ? esc_attr($attributes['animationType']) : 'none';
    $animationDuration = isset($attributes['animationDuration']) ? intval($attributes['animationDuration']) : 1000;
    $animationDelay = isset($attributes['animationDelay']) ? intval($attributes['animationDelay']) : 0;
    $animationEasing = isset($attributes['animationEasing']) ? esc_attr($attributes['animationEasing']) : 'ease';
    $hoverAnimation = isset($attributes['hoverAnimation']) ? esc_attr($attributes['hoverAnimation']) : 'none';
    $backgroundColor = isset($attributes['backgroundColor']) ? esc_attr($attributes['backgroundColor']) : '#007cba';
    $textColor = isset($attributes['textColor']) ? esc_attr($attributes['textColor']) : '#ffffff';
    $borderColor = isset($attributes['borderColor']) ? esc_attr($attributes['borderColor']) : '#007cba';
    $borderWidth = isset($attributes['borderWidth']) ? intval($attributes['borderWidth']) : 0;
    $borderRadius = isset($attributes['borderRadius']) ? intval($attributes['borderRadius']) : 4;
    $borderStyle = isset($attributes['borderStyle']) ? esc_attr($attributes['borderStyle']) : 'solid';
    $paddingTop = isset($attributes['paddingTop']) ? esc_attr($attributes['paddingTop']) : '12px';
    $paddingRight = isset($attributes['paddingRight']) ? esc_attr($attributes['paddingRight']) : '24px';
    $paddingBottom = isset($attributes['paddingBottom']) ? esc_attr($attributes['paddingBottom']) : '12px';
    $paddingLeft = isset($attributes['paddingLeft']) ? esc_attr($attributes['paddingLeft']) : '24px';
    $marginTop = isset($attributes['marginTop']) ? esc_attr($attributes['marginTop']) : '0px';
    $marginRight = isset($attributes['marginRight']) ? esc_attr($attributes['marginRight']) : '0px';
    $marginBottom = isset($attributes['marginBottom']) ? esc_attr($attributes['marginBottom']) : '0px';
    $marginLeft = isset($attributes['marginLeft']) ? esc_attr($attributes['marginLeft']) : '0px';
    $fontSize = isset($attributes['fontSize']) ? esc_attr($attributes['fontSize']) : '16px';
    $fontWeight = isset($attributes['fontWeight']) ? esc_attr($attributes['fontWeight']) : '400';
    $fontFamily = isset($attributes['fontFamily']) ? esc_attr($attributes['fontFamily']) : 'inherit';
    $textTransform = isset($attributes['textTransform']) ? esc_attr($attributes['textTransform']) : 'none';
    $letterSpacing = isset($attributes['letterSpacing']) ? esc_attr($attributes['letterSpacing']) : '0px';
    $lineHeight = isset($attributes['lineHeight']) ? esc_attr($attributes['lineHeight']) : '1.5';
    $shadowColor = isset($attributes['shadowColor']) ? esc_attr($attributes['shadowColor']) : '#000000';
    $shadowOpacity = isset($attributes['shadowOpacity']) ? floatval($attributes['shadowOpacity']) : 0.2;
    $shadowBlur = isset($attributes['shadowBlur']) ? intval($attributes['shadowBlur']) : 4;
    $shadowSpread = isset($attributes['shadowSpread']) ? intval($attributes['shadowSpread']) : 0;
    $shadowHorizontal = isset($attributes['shadowHorizontal']) ? intval($attributes['shadowHorizontal']) : 0;
    $shadowVertical = isset($attributes['shadowVertical']) ? intval($attributes['shadowVertical']) : 2;
    $width = isset($attributes['width']) ? esc_attr($attributes['width']) : 'auto';
    $height = isset($attributes['height']) ? esc_attr($attributes['height']) : 'auto';
    $align = isset($attributes['align']) ? esc_attr($attributes['align']) : 'left';
    $customClass = isset($attributes['customClass']) ? esc_attr($attributes['customClass']) : '';

    $shadowRgba = hex_to_rgba($shadowColor, $shadowOpacity);

    $classes = 'snn-animating-button';
    if ($animationType !== 'none') {
        $classes .= ' animation-' . $animationType;
    }
    if ($hoverAnimation !== 'none') {
        $classes .= ' hover-' . $hoverAnimation;
    }
    if (!empty($customClass)) {
        $classes .= ' ' . $customClass;
    }

    $styles = "background-color: {$backgroundColor}; color: {$textColor}; border-color: {$borderColor}; border-width: {$borderWidth}px; border-radius: {$borderRadius}px; border-style: {$borderStyle}; padding: {$paddingTop} {$paddingRight} {$paddingBottom} {$paddingLeft}; margin: {$marginTop} {$marginRight} {$marginBottom} {$marginLeft}; font-size: {$fontSize}; font-weight: {$fontWeight}; font-family: {$fontFamily}; text-transform: {$textTransform}; letter-spacing: {$letterSpacing}; line-height: {$lineHeight}; box-shadow: {$shadowHorizontal}px {$shadowVertical}px {$shadowBlur}px {$shadowSpread}px {$shadowRgba}; width: {$width}; height: {$height}; text-align: center; display: inline-block; cursor: pointer; transition: all 0.3s ease;";

    ob_start();
    ?>
    <div class="snn-animating-button-wrapper" style="text-align: <?php echo $align; ?>;">
        <a href="<?php echo $url; ?>" target="<?php echo $target; ?>" rel="<?php echo $rel; ?>" class="<?php echo $classes; ?>" style="<?php echo $styles; ?>" data-duration="<?php echo $animationDuration; ?>" data-delay="<?php echo $animationDelay; ?>" data-easing="<?php echo $animationEasing; ?>">
            <?php echo $text; ?>
        </a>
    </div>
    <style>
        .snn-animating-button {
            text-decoration: none;
            display: inline-block;
        }

        /* Entry Animations */
        .animation-fadeIn {
            opacity: 0;
            animation: fadeIn <?php echo $animationDuration; ?>ms <?php echo $animationEasing; ?> <?php echo $animationDelay; ?>ms forwards;
        }

        .animation-slideUp {
            transform: translateY(50px);
            opacity: 0;
            animation: slideUp <?php echo $animationDuration; ?>ms <?php echo $animationEasing; ?> <?php echo $animationDelay; ?>ms forwards;
        }

        .animation-slideDown {
            transform: translateY(-50px);
            opacity: 0;
            animation: slideDown <?php echo $animationDuration; ?>ms <?php echo $animationEasing; ?> <?php echo $animationDelay; ?>ms forwards;
        }

        .animation-slideLeft {
            transform: translateX(50px);
            opacity: 0;
            animation: slideLeft <?php echo $animationDuration; ?>ms <?php echo $animationEasing; ?> <?php echo $animationDelay; ?>ms forwards;
        }

        .animation-slideRight {
            transform: translateX(-50px);
            opacity: 0;
            animation: slideRight <?php echo $animationDuration; ?>ms <?php echo $animationEasing; ?> <?php echo $animationDelay; ?>ms forwards;
        }

        .animation-bounce {
            animation: bounce <?php echo $animationDuration; ?>ms <?php echo $animationEasing; ?> <?php echo $animationDelay; ?>ms forwards;
        }

        .animation-pulse {
            animation: pulse <?php echo $animationDuration; ?>ms <?php echo $animationEasing; ?> <?php echo $animationDelay; ?>ms infinite;
        }

        .animation-shake {
            animation: shake <?php echo $animationDuration; ?>ms <?php echo $animationEasing; ?> <?php echo $animationDelay; ?>ms forwards;
        }

        .animation-rotate {
            transform: rotate(0deg);
            animation: rotate <?php echo $animationDuration; ?>ms <?php echo $animationEasing; ?> <?php echo $animationDelay; ?>ms forwards;
        }

        .animation-scale {
            transform: scale(0);
            animation: scale <?php echo $animationDuration; ?>ms <?php echo $animationEasing; ?> <?php echo $animationDelay; ?>ms forwards;
        }

        /* Hover Animations */
        .hover-grow:hover {
            transform: scale(1.1);
        }

        .hover-shrink:hover {
            transform: scale(0.9);
        }

        .hover-rotateHover:hover {
            transform: rotate(5deg);
        }

        .hover-glow:hover {
            box-shadow: 0 0 20px rgba(255, 255, 255, 0.5);
        }

        .hover-shadow:hover {
            box-shadow: 0 10px 20px rgba(0, 0, 0, 0.2);
        }

        .hover-colorChange:hover {
            background-color: #005a87;
        }

        /* Keyframes */
        @keyframes fadeIn {
            to { opacity: 1; }
        }

        @keyframes slideUp {
            to { transform: translateY(0); opacity: 1; }
        }

        @keyframes slideDown {
            to { transform: translateY(0); opacity: 1; }
        }

        @keyframes slideLeft {
            to { transform: translateX(0); opacity: 1; }
        }

        @keyframes slideRight {
            to { transform: translateX(0); opacity: 1; }
        }

        @keyframes bounce {
            0%, 20%, 53%, 80%, 100% { transform: translate3d(0, 0, 0); }
            40%, 43% { transform: translate3d(0, -30px, 0); }
            70% { transform: translate3d(0, -15px, 0); }
            90% { transform: translate3d(0, -4px, 0); }
        }

        @keyframes pulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.1); }
            100% { transform: scale(1); }
        }

        @keyframes shake {
            0%, 100% { transform: translateX(0); }
            10%, 30%, 50%, 70%, 90% { transform: translateX(-10px); }
            20%, 40%, 60%, 80% { transform: translateX(10px); }
        }

        @keyframes rotate {
            to { transform: rotate(360deg); }
        }

        @keyframes scale {
            to { transform: scale(1); opacity: 1; }
        }
    </style>
    <?php
    return ob_get_clean();
}

/**
 * Helper function to convert hex to rgba
 */
function hex_to_rgba($hex, $opacity = 1) {
    $hex = str_replace("#", "", $hex);
    if (strlen($hex) == 3) {
        $r = hexdec(substr($hex, 0, 1) . substr($hex, 0, 1));
        $g = hexdec(substr($hex, 1, 1) . substr($hex, 1, 1));
        $b = hexdec(substr($hex, 2, 1) . substr($hex, 2, 1));
    } else {
        $r = hexdec(substr($hex, 0, 2));
        $g = hexdec(substr($hex, 2, 2));
        $b = hexdec(substr($hex, 4, 2));
    }
    return "rgba($r, $g, $b, $opacity)";
}

/**
 * Register the block
 */
add_action('init', function() {
    $dir = get_template_directory() . '/blocks/animating-buttons';
    if (function_exists('register_block_type_from_metadata')) {
        register_block_type_from_metadata($dir, array(
            'render_callback' => 'snn_animating_buttons_render'
        ));
    } else {
        register_block_type($dir . '/block.json', array(
            'render_callback' => 'snn_animating_buttons_render'
        ));
    }
});
