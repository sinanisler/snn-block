<?php
/**
 * The CSS properties of the layout blocks' Style groups: spacing, sizing, positioning, misc, typography,
 * background, gradient, border, box shadow, transform, filters and transitions.
 *
 * Each property is one flat attribute, named after what it is (marginTop, zIndex, fontWeight). A flat
 * attribute gets the per-view values (Desktop, Tablet, Mobile) the same way gap and max width do. A few
 * properties are built from several attributes (the box shadow, the transform, the filters and the
 * gradient); their parts have no css of their own (css null) and are composed in declarations().
 *
 * The editor reads this table through wp_localize_script (see layout-blocks.php) and mirrors check()
 * and declarations() in assets/layout-blocks.js: keep the two in step.
 *
 * Every value is checked before it is written. A value that is not allowed writes nothing.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class SNN_Style_Props {

	/** Units a length may have. */
	const UNIT = 'px|rem|em|%|vw|vh|vmin|vmax|ch';

	/** Keywords a width or height takes besides a length. */
	const SIZE_WORDS = array( 'auto', 'max-content', 'min-content', 'fit-content' );

	/** attribute => [ css property or null, type, options ]. The order is the order of the declarations. */
	const TABLE = array(
		// Spacing
		'marginTop'         => array( 'margin-top', 'margin' ),
		'marginRight'       => array( 'margin-right', 'margin' ),
		'marginBottom'      => array( 'margin-bottom', 'margin' ),
		'marginLeft'        => array( 'margin-left', 'margin' ),
		'paddingLeft'       => array( 'padding-left', 'size' ),
		'paddingRight'      => array( 'padding-right', 'size' ),
		// Sizing
		'width'             => array( 'width', 'width' ),
		'minWidth'          => array( 'min-width', 'size' ),
		'height'            => array( 'height', 'width' ),
		'minHeight'         => array( 'min-height', 'size' ),
		'maxHeight'         => array( 'max-height', 'sizenone' ),
		'aspectRatio'       => array( 'aspect-ratio', 'ratio' ),
		// Positioning
		'position'          => array( 'position', 'keyword', array( 'static', 'relative', 'absolute', 'fixed', 'sticky' ) ),
		'top'               => array( 'top', 'margin' ),
		'right'             => array( 'right', 'margin' ),
		'bottom'            => array( 'bottom', 'margin' ),
		'left'              => array( 'left', 'margin' ),
		'zIndex'            => array( 'z-index', 'integer' ),
		'scrollSnapAlign'   => array( 'scroll-snap-align', 'keyword', array( 'none', 'start', 'center', 'end' ) ),
		// Misc
		'visibility'        => array( 'visibility', 'keyword', array( 'visible', 'hidden', 'collapse' ) ),
		'cursor'            => array(
			'cursor',
			'keyword',
			array( 'auto', 'default', 'pointer', 'text', 'move', 'not-allowed', 'grab', 'grabbing', 'wait', 'help', 'crosshair', 'zoom-in', 'zoom-out', 'none' ),
		),
		'isolation'         => array( 'isolation', 'keyword', array( 'auto', 'isolate' ) ),
		'mixBlendMode'      => array(
			'mix-blend-mode',
			'keyword',
			array( 'normal', 'multiply', 'screen', 'overlay', 'darken', 'lighten', 'color-dodge', 'color-burn', 'hard-light', 'soft-light', 'difference', 'exclusion', 'hue', 'saturation', 'color', 'luminosity' ),
		),
		'pointerEvents'     => array( 'pointer-events', 'keyword', array( 'auto', 'none' ) ),
		'perspective'       => array( 'perspective', 'sizenone' ),
		'perspectiveOrigin' => array( 'perspective-origin', 'text' ),
		// Typography
		'color'             => array( 'color', 'color' ),
		'fontFamily'        => array( 'font-family', 'family' ),
		'fontSize'          => array( 'font-size', 'size' ),
		'fontWeight'        => array( 'font-weight', 'keyword', array( 'normal', 'bold', '100', '200', '300', '400', '500', '600', '700', '800', '900' ) ),
		'fontStyle'         => array( 'font-style', 'keyword', array( 'normal', 'italic', 'oblique' ) ),
		'lineHeight'        => array( 'line-height', 'lineheight' ),
		'letterSpacing'     => array( 'letter-spacing', 'lengthnormal' ),
		'textAlign'         => array( 'text-align', 'keyword', array( 'left', 'center', 'right', 'justify', 'start', 'end' ) ),
		'textTransform'     => array( 'text-transform', 'keyword', array( 'none', 'capitalize', 'uppercase', 'lowercase' ) ),
		'textDecoration'    => array( 'text-decoration', 'keyword', array( 'none', 'underline', 'line-through', 'overline' ) ),
		'textWrap'          => array( 'text-wrap', 'keyword', array( 'wrap', 'nowrap', 'balance', 'pretty', 'stable' ) ),
		'whiteSpace'        => array( 'white-space', 'keyword', array( 'normal', 'nowrap', 'pre', 'pre-wrap', 'pre-line', 'break-spaces' ) ),
		'textShadow'        => array( 'text-shadow', 'text' ),
		// Background
		'backgroundImage'   => array( 'background-image', 'url' ),
		'backgroundSize'    => array( 'background-size', 'keywordlength', array( 'cover', 'contain', 'auto' ) ),
		'backgroundPosition' => array( 'background-position', 'text' ),
		'backgroundRepeat'  => array( 'background-repeat', 'keyword', array( 'no-repeat', 'repeat', 'repeat-x', 'repeat-y', 'space', 'round' ) ),
		// Gradient (composed into background-image): the type, the angle, two colour stops with their positions
		'gradientType'      => array( null, 'keyword', array( 'linear', 'radial' ) ),
		'gradientAngle'     => array( null, 'number' ),
		'gradientColor1'    => array( null, 'color' ),
		'gradientStop1'     => array( null, 'percent' ),
		'gradientColor2'    => array( null, 'color' ),
		'gradientStop2'     => array( null, 'percent' ),
		// Border
		'borderWidth'       => array( 'border-width', 'size' ),
		'borderStyle'       => array( 'border-style', 'keyword', array( 'none', 'solid', 'dashed', 'dotted', 'double' ) ),
		'borderColor'       => array( 'border-color', 'color' ),
		'borderRadius'      => array( 'border-radius', 'size' ),
		// Box shadow (composed): x, y, blur, spread and colour
		'boxShadowX'        => array( null, 'length' ),
		'boxShadowY'        => array( null, 'length' ),
		'boxShadowBlur'     => array( null, 'size' ),
		'boxShadowSpread'   => array( null, 'length' ),
		'boxShadowColor'    => array( null, 'color' ),
		// Transform: the origin is a longhand, the rest is composed into transform
		'transformOrigin'   => array( 'transform-origin', 'text' ),
		'translateX'        => array( null, 'length' ),
		'translateY'        => array( null, 'length' ),
		'rotate'            => array( null, 'number' ),
		'scale'             => array( null, 'number' ),
		'skewX'             => array( null, 'number' ),
		'skewY'             => array( null, 'number' ),
		// Filters (composed into filter)
		'filterBlur'        => array( null, 'size' ),
		'filterBrightness'  => array( null, 'percentnumber' ),
		'filterContrast'    => array( null, 'percentnumber' ),
		'filterGrayscale'   => array( null, 'percentnumber' ),
		'filterHueRotate'   => array( null, 'number' ),
		'filterInvert'      => array( null, 'percentnumber' ),
		'filterSaturate'    => array( null, 'percentnumber' ),
		'filterSepia'       => array( null, 'percentnumber' ),
		// Transition: four longhands
		'transitionProperty' => array( 'transition-property', 'keyword', array( 'all', 'opacity', 'transform', 'color', 'background-color', 'box-shadow', 'filter', 'border-color' ) ),
		'transitionDuration' => array( 'transition-duration', 'time' ),
		'transitionTiming'   => array( 'transition-timing-function', 'keyword', array( 'ease', 'ease-in', 'ease-out', 'ease-in-out', 'linear' ) ),
		'transitionDelay'    => array( 'transition-delay', 'time' ),
	);

	/** The attributes with no css of their own: composed in declarations(). */
	const COMPOSED = array(
		'gradientType', 'gradientAngle', 'gradientColor1', 'gradientStop1', 'gradientColor2', 'gradientStop2',
		'boxShadowX', 'boxShadowY', 'boxShadowBlur', 'boxShadowSpread', 'boxShadowColor',
		'translateX', 'translateY', 'rotate', 'scale', 'skewX', 'skewY',
		'filterBlur', 'filterBrightness', 'filterContrast', 'filterGrayscale', 'filterHueRotate', 'filterInvert', 'filterSaturate', 'filterSepia',
	);

	/** The attributes, as the blocks register them: text, empty by default. */
	public static function attributes() {
		$out = array();
		foreach ( array_keys( self::TABLE ) as $key ) {
			$out[ $key ] = array( 'type' => 'string', 'default' => '' );
		}
		return $out;
	}

	/** The keys (attributes) of the table: the views may set each of them. */
	public static function keys() {
		return array_keys( self::TABLE );
	}

	/** The table for the editor: a list of [ attribute, css property, type, options ]. */
	public static function for_editor() {
		$out = array();
		foreach ( self::TABLE as $key => $spec ) {
			$out[] = array( $key, $spec[0] ?? null, $spec[1], $spec[2] ?? array() );
		}
		return $out;
	}

	/**
	 * A value checked for its type. Returns the value to write, or '' when it is not allowed.
	 * A plain number for a length gets px, as the other size fields do.
	 */
	public static function check( $type, $value, array $options = array() ) {
		$v = trim( (string) $value );
		if ( '' === $v ) {
			return '';
		}
		switch ( $type ) {
			case 'keyword':
				return in_array( $v, $options, true ) ? $v : '';
			case 'keywordlength':
				return in_array( $v, $options, true ) ? $v : self::length( $v, false );
			case 'length':
				return self::length( $v, true );
			case 'margin':
				return 'auto' === $v ? $v : self::length( $v, true );
			case 'lengthnormal':
				return 'normal' === $v ? $v : self::length( $v, true );
			case 'size':
				return self::length( $v, false );
			case 'sizenone':
				return 'none' === $v ? $v : self::length( $v, false );
			case 'width':
				return in_array( $v, self::SIZE_WORDS, true ) ? $v : self::length( $v, false );
			case 'lineheight':
				if ( 'normal' === $v || self::is_var( $v ) || preg_match( '/^\d+(\.\d+)?$/', $v ) ) {
					return $v;
				}
				return self::length( $v, false );
			case 'integer':
				return preg_match( '/^-?\d{1,4}$/', $v ) || self::is_var( $v ) ? $v : '';
			case 'number':
				return preg_match( '/^-?\d+(\.\d+)?$/', $v ) || self::is_var( $v ) ? $v : '';
			case 'percent':
				return preg_match( '/^\d+(\.\d+)?$/', $v ) && (float) $v <= 100 ? $v : '';
			case 'percentnumber':
				return preg_match( '/^\d+(\.\d+)?$/', $v ) || self::is_var( $v ) ? $v : '';
			case 'ratio':
				return 'auto' === $v || preg_match( '/^\d+(\.\d+)?\s*\/\s*\d+(\.\d+)?$/', $v ) || self::is_var( $v ) ? $v : '';
			case 'time':
				return preg_match( '/^\d+(\.\d+)?m?s$/', $v ) || self::is_var( $v ) ? $v : '';
			case 'color':
				return SNN_Layout_Blocks::color( $v );
			case 'text':
				return preg_match( '/^[A-Za-z0-9 .,()%#+\-*\/]{1,200}$/', $v ) ? $v : '';
			case 'family':
				return preg_match( '/^[A-Za-z0-9 ,\'"\-]{1,120}$/', $v ) ? $v : '';
			case 'url':
				return preg_match( '/^url\(("|\')?(https?:\/\/|\/)[^"\'()\s<>]{1,500}("|\')?\)$/', $v ) ? $v : '';
		}
		return '';
	}

	/** A variable reference: var(--name). Allowed wherever a value is. */
	private static function is_var( $v ) {
		return (bool) preg_match( '/^var\(--[a-z][a-z0-9-]*\)$/', $v );
	}

	/** A length with a unit, or 0, or a variable. A plain number gets px. $signed: negative values allowed. */
	private static function length( $v, $signed ) {
		if ( preg_match( $signed ? '/^-?\d+(\.\d+)?$/' : '/^\d+(\.\d+)?$/', $v ) && '0' !== $v ) {
			$v .= 'px';
		}
		$sign = $signed ? '-?' : '';
		if ( '0' === $v || self::is_var( $v ) || preg_match( '/^' . $sign . '\d+(\.\d+)?(' . self::UNIT . ')$/', $v ) ) {
			return $v;
		}
		return '';
	}

	/**
	 * The declarations the properties write, in the table's order, then the composed ones: the box shadow,
	 * the transform, the filter and the gradient (last, so a gradient wins over a background image).
	 *
	 * @return string[] "property:value" strings.
	 */
	public static function declarations( array $a ) {
		$out = array();
		foreach ( self::TABLE as $key => $spec ) {
			if ( null === $spec[0] ) {
				continue;
			}
			$value = self::check( $spec[1], $a[ $key ] ?? '', $spec[2] ?? array() );
			if ( '' !== $value ) {
				$out[] = $spec[0] . ':' . $value;
			}
		}
		foreach ( array( self::box_shadow( $a ), self::transform( $a ), self::filter( $a ), self::gradient( $a ) ) as $composed ) {
			if ( '' !== $composed ) {
				$out[] = $composed;
			}
		}
		return $out;
	}

	/** box-shadow: x, y, blur, spread and colour, each with a default. Empty when no part is set. */
	private static function box_shadow( array $a ) {
		$x      = self::check( 'length', $a['boxShadowX'] ?? '' );
		$y      = self::check( 'length', $a['boxShadowY'] ?? '' );
		$blur   = self::check( 'size', $a['boxShadowBlur'] ?? '' );
		$spread = self::check( 'length', $a['boxShadowSpread'] ?? '' );
		$colour = self::check( 'color', $a['boxShadowColor'] ?? '' );
		if ( '' === $x && '' === $y && '' === $blur && '' === $spread && '' === $colour ) {
			return '';
		}
		return 'box-shadow:' . implode( ' ', array(
			'' === $x ? '0' : $x,
			'' === $y ? '0' : $y,
			'' === $blur ? '0' : $blur,
			'' === $spread ? '0' : $spread,
			'' === $colour ? 'rgba(0,0,0,0.25)' : $colour,
		) );
	}

	/** transform: translate, rotate, scale and skew, in that order. Empty when no part is set. */
	private static function transform( array $a ) {
		$parts = array();
		$tx    = self::check( 'length', $a['translateX'] ?? '' );
		$ty    = self::check( 'length', $a['translateY'] ?? '' );
		if ( '' !== $tx || '' !== $ty ) {
			$parts[] = 'translate(' . ( '' === $tx ? '0' : $tx ) . ', ' . ( '' === $ty ? '0' : $ty ) . ')';
		}
		$rotate = self::plain_number( $a['rotate'] ?? '' );
		if ( '' !== $rotate ) {
			$parts[] = 'rotate(' . $rotate . 'deg)';
		}
		$scale = self::check( 'number', $a['scale'] ?? '' );
		if ( '' !== $scale ) {
			$parts[] = 'scale(' . $scale . ')';
		}
		$skew_x = self::plain_number( $a['skewX'] ?? '' );
		$skew_y = self::plain_number( $a['skewY'] ?? '' );
		if ( '' !== $skew_x || '' !== $skew_y ) {
			$parts[] = 'skew(' . ( '' === $skew_x ? '0' : $skew_x ) . 'deg, ' . ( '' === $skew_y ? '0' : $skew_y ) . 'deg)';
		}
		return $parts ? 'transform:' . implode( ' ', $parts ) : '';
	}

	/** filter: blur, brightness, contrast, grayscale, hue-rotate, invert, saturate and sepia, in that order. */
	private static function filter( array $a ) {
		$parts = array();
		$blur  = self::check( 'size', $a['filterBlur'] ?? '' );
		if ( '' !== $blur ) {
			$parts[] = 'blur(' . $blur . ')';
		}
		$percent = array(
			'filterBrightness' => 'brightness',
			'filterContrast'   => 'contrast',
			'filterGrayscale'  => 'grayscale',
			'filterInvert'     => 'invert',
			'filterSaturate'   => 'saturate',
			'filterSepia'      => 'sepia',
		);
		foreach ( $percent as $key => $fn ) {
			$v = self::check( 'percentnumber', $a[ $key ] ?? '' );
			if ( '' !== $v ) {
				$parts[] = $fn . '(' . $v . ( self::is_var( $v ) ? '' : '%' ) . ')';
			}
		}
		$hue = self::plain_number( $a['filterHueRotate'] ?? '' );
		if ( '' !== $hue ) {
			$parts[] = 'hue-rotate(' . $hue . 'deg)';
		}
		return $parts ? 'filter:' . implode( ' ', $parts ) : '';
	}

	/** background-image: a gradient from two colour stops. Needs both colours; the stops default to 0% and 100%. */
	private static function gradient( array $a ) {
		$c1 = self::check( 'color', $a['gradientColor1'] ?? '' );
		$c2 = self::check( 'color', $a['gradientColor2'] ?? '' );
		if ( '' === $c1 || '' === $c2 ) {
			return '';
		}
		$s1    = self::check( 'percent', $a['gradientStop1'] ?? '' );
		$s2    = self::check( 'percent', $a['gradientStop2'] ?? '' );
		$stops = $c1 . ' ' . ( '' === $s1 ? '0' : $s1 ) . '%, ' . $c2 . ' ' . ( '' === $s2 ? '100' : $s2 ) . '%';
		if ( 'radial' === ( $a['gradientType'] ?? '' ) ) {
			return 'background-image:radial-gradient(' . $stops . ')';
		}
		$angle = self::plain_number( $a['gradientAngle'] ?? '' );
		return 'background-image:linear-gradient(' . ( '' === $angle ? '180' : $angle ) . 'deg, ' . $stops . ')';
	}

	/** A plain number (no variable, no unit): for the parts that take a unit the composition adds itself. */
	private static function plain_number( $value ) {
		$v = trim( (string) $value );
		return preg_match( '/^-?\d+(\.\d+)?$/', $v ) ? $v : '';
	}
}
