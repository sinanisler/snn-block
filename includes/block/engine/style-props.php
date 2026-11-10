<?php
/**
 * The style of our blocks: ONE property table (SNN_Style_Props::TABLE). Every property a block can set is a row:
 *
 *   attribute => array( css property or null, type, options, rules )
 *
 * The type decides how the value is checked (check()). The rules (all optional) say when the row is written:
 *
 *   when      'flex', 'grid' or 'box' (flex or grid): the row is written only for that display. Absent: every display.
 *   default   the value written when the stored one is not allowed (for example the display's block).
 *   skip      a value that is not written on the base rule (display: block), but is written in a view rule.
 *   gridWord  flex-start and flex-end become start and end on a grid (grid has no flex words). 'always': on flex too (align self).
 *   cond      'packs': the row needs a grid, or a flex box that wraps (align content).
 *   extra     declarations written after the row (max width also sets the auto margins).
 *   extraUnless the flag that turns extra off when it is on (max width: maxWidthOff, the Centre the block switch).
 *   compose   a composed row: its css is null and the named composer writes the declarations
 *             ('autoflow', 'placement_column', 'placement_row').
 *
 * The rows are written in the order of the table. Layout rows come first (as the front end always wrote them), then
 * the Style groups' rows, then the composed Style properties (box shadow, transform, filter, gradient).
 *
 * The editor mirrors this file in editor/style-props.js: the same types, rules and composers. The parity test
 * (tests/style-parity.php and tests/style-parity.js) checks that the two agree on the same values.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class SNN_Style_Props {

	/** Keywords a width or height takes besides a length. */
	const SIZE_WORDS = array( 'auto', 'max-content', 'min-content', 'fit-content' );

	/** The most colour stops a gradient takes (the repeater's list). */
	const MAX_STOPS = 12;

	/** The layout choices (the option lists of the rows below). */
	const DISPLAYS       = array( 'block', 'inline-block', 'inline', 'flex', 'inline-flex', 'grid', 'inline-grid', 'none' );
	const FLEX_DIRECTION = array( 'row', 'row-reverse', 'column', 'column-reverse' );
	const FLEX_WRAP      = array( 'nowrap', 'wrap', 'wrap-reverse' );
	const JUSTIFY        = array( 'flex-start', 'center', 'flex-end', 'space-between', 'space-around', 'space-evenly' );
	const ALIGN          = array( 'stretch', 'flex-start', 'center', 'flex-end', 'baseline' );
	const ALIGN_CONTENT  = array( 'flex-start', 'center', 'flex-end', 'stretch', 'space-between', 'space-around', 'space-evenly' );
	const JUSTIFY_ITEMS  = array( 'stretch', 'flex-start', 'center', 'flex-end' );
	const GRID_FLOW      = array( 'row', 'column' );
	const ALIGN_SELF     = array( 'auto', 'stretch', 'flex-start', 'center', 'flex-end', 'baseline' );
	const JUSTIFY_SELF   = array( 'stretch', 'flex-start', 'center', 'flex-end' );
	const OVERFLOW       = array( 'visible', 'hidden', 'clip' );

	/** attribute => [ css property or null, type, options, rules ]. The order is the order of the declarations. */
	const TABLE = array(
		// Layout: the display, the flex and grid settings, the item settings, then spacing, colour, width, opacity and overflow.
		'display'          => array( 'display', 'keyword', self::DISPLAYS, array( 'default' => 'block', 'skip' => 'block' ) ),
		'flexDirection'    => array( 'flex-direction', 'keyword', self::FLEX_DIRECTION, array( 'when' => 'flex', 'default' => 'row' ) ),
		'flexWrap'         => array( 'flex-wrap', 'keyword', self::FLEX_WRAP, array( 'when' => 'flex', 'default' => 'nowrap' ) ),
		'gridColumns'      => array( 'grid-template-columns', 'columns', array(), array( 'when' => 'grid' ) ),
		'gridRows'         => array( 'grid-template-rows', 'template', array(), array( 'when' => 'grid' ) ),
		'gridAreas'        => array( 'grid-template-areas', 'areas', array(), array( 'when' => 'grid' ) ),
		'gridAutoColumns'  => array( 'grid-auto-columns', 'template', array(), array( 'when' => 'grid' ) ),
		'gridAutoRows'     => array( 'grid-auto-rows', 'template', array(), array( 'when' => 'grid' ) ),
		'gridAutoFlow'     => array( null, 'keyword', self::GRID_FLOW, array( 'when' => 'grid', 'compose' => 'autoflow' ) ),
		'gridDense'        => array( null, 'flag', array(), array() ),
		'justifyContent'   => array( 'justify-content', 'keyword', self::JUSTIFY, array( 'when' => 'box', 'gridWord' => true ) ),
		'alignItems'       => array( 'align-items', 'keyword', self::ALIGN, array( 'when' => 'box', 'gridWord' => true ) ),
		'justifyItems'     => array( 'justify-items', 'keyword', self::JUSTIFY_ITEMS, array( 'when' => 'grid', 'gridWord' => true ) ),
		'alignContent'     => array( 'align-content', 'keyword', self::ALIGN_CONTENT, array( 'when' => 'box', 'gridWord' => true, 'cond' => 'packs' ) ),
		'gap'              => array( 'gap', 'length', array(), array( 'when' => 'box' ) ),
		'columnGap'        => array( 'column-gap', 'length', array(), array( 'when' => 'box' ) ),
		'rowGap'           => array( 'row-gap', 'length', array(), array( 'when' => 'box' ) ),
		'alignSelf'        => array( 'align-self', 'keyword', self::ALIGN_SELF, array( 'when' => 'box', 'gridWord' => 'always' ) ),
		'justifySelf'      => array( 'justify-self', 'keyword', self::JUSTIFY_SELF, array( 'when' => 'grid', 'gridWord' => true ) ),
		'order'            => array( 'order', 'order', array(), array() ),
		'flexGrow'         => array( 'flex-grow', 'flexnumber', array(), array( 'when' => 'flex' ) ),
		'flexShrink'       => array( 'flex-shrink', 'flexnumber', array(), array( 'when' => 'flex' ) ),
		'flexBasis'        => array( 'flex-basis', 'lengthauto', array(), array( 'when' => 'flex' ) ),
		'gridArea'         => array( 'grid-area', 'ident', array(), array( 'when' => 'grid' ) ),
		'columnStart'      => array( null, 'line', array(), array( 'when' => 'grid', 'compose' => 'placement_column' ) ),
		'columnSpan'       => array( null, 'span', array(), array() ),
		'rowStart'         => array( null, 'line', array(), array( 'when' => 'grid', 'compose' => 'placement_row' ) ),
		'rowSpan'          => array( null, 'span', array(), array() ),
		'backgroundColor'  => array( 'background-color', 'color', array(), array() ),
		'paddingTop'       => array( 'padding-top', 'size', array(), array() ),
		'paddingBottom'    => array( 'padding-bottom', 'size', array(), array() ),
		'maxWidth'         => array( 'max-width', 'size', array(), array( 'extra' => array( array( 'margin-left', 'auto' ), array( 'margin-right', 'auto' ) ), 'extraUnless' => 'maxWidthOff' ) ),
		// Centre the block (the Sizing group's switch). Empty means centred, so every block that has a max width today is unchanged.
		'maxWidthOff'      => array( null, 'flag', array(), array() ),
		'opacity'          => array( 'opacity', 'opacity', array(), array() ),
		'overflow'         => array( 'overflow', 'keyword', self::OVERFLOW, array() ),
		// Spacing
		'marginTop'         => array( 'margin-top', 'margin', array(), array() ),
		'marginRight'       => array( 'margin-right', 'margin', array(), array() ),
		'marginBottom'      => array( 'margin-bottom', 'margin', array(), array() ),
		'marginLeft'        => array( 'margin-left', 'margin', array(), array() ),
		'paddingLeft'       => array( 'padding-left', 'size', array(), array() ),
		'paddingRight'      => array( 'padding-right', 'size', array(), array() ),
		// Sizing
		'width'             => array( 'width', 'width', array(), array() ),
		'minWidth'          => array( 'min-width', 'size', array(), array() ),
		'height'            => array( 'height', 'width', array(), array() ),
		'minHeight'         => array( 'min-height', 'size', array(), array() ),
		'maxHeight'         => array( 'max-height', 'sizenone', array(), array() ),
		'aspectRatio'       => array( 'aspect-ratio', 'ratio', array(), array() ),
		// Positioning
		'position'          => array( 'position', 'keyword', array( 'static', 'relative', 'absolute', 'fixed', 'sticky' ), array() ),
		'top'               => array( 'top', 'margin', array(), array() ),
		'right'             => array( 'right', 'margin', array(), array() ),
		'bottom'            => array( 'bottom', 'margin', array(), array() ),
		'left'              => array( 'left', 'margin', array(), array() ),
		'zIndex'            => array( 'z-index', 'integer', array(), array() ),
		'scrollSnapAlign'   => array( 'scroll-snap-align', 'keyword', array( 'none', 'start', 'center', 'end' ), array() ),
		// Misc
		'visibility'        => array( 'visibility', 'keyword', array( 'visible', 'hidden', 'collapse' ), array() ),
		'cursor'            => array(
			'cursor',
			'keyword',
			array( 'auto', 'default', 'pointer', 'text', 'move', 'not-allowed', 'grab', 'grabbing', 'wait', 'help', 'crosshair', 'zoom-in', 'zoom-out', 'none' ),
			array(),
		),
		'isolation'         => array( 'isolation', 'keyword', array( 'auto', 'isolate' ), array() ),
		'mixBlendMode'      => array(
			'mix-blend-mode',
			'keyword',
			array( 'normal', 'multiply', 'screen', 'overlay', 'darken', 'lighten', 'color-dodge', 'color-burn', 'hard-light', 'soft-light', 'difference', 'exclusion', 'hue', 'saturation', 'color', 'luminosity' ),
			array(),
		),
		'pointerEvents'     => array( 'pointer-events', 'keyword', array( 'auto', 'none' ), array() ),
		'perspective'       => array( 'perspective', 'sizenone', array(), array() ),
		'perspectiveOrigin' => array( 'perspective-origin', 'text', array(), array() ),
		// Typography
		'color'             => array( 'color', 'color', array(), array() ),
		'fontFamily'        => array( 'font-family', 'family', array(), array() ),
		'fontSize'          => array( 'font-size', 'size', array(), array() ),
		'fontWeight'        => array( 'font-weight', 'keyword', array( 'normal', 'bold', '100', '200', '300', '400', '500', '600', '700', '800', '900' ), array() ),
		'fontStyle'         => array( 'font-style', 'keyword', array( 'normal', 'italic', 'oblique' ), array() ),
		'lineHeight'        => array( 'line-height', 'lineheight', array(), array() ),
		'letterSpacing'     => array( 'letter-spacing', 'lengthnormal', array(), array() ),
		'textAlign'         => array( 'text-align', 'keyword', array( 'left', 'center', 'right', 'justify', 'start', 'end' ), array() ),
		'textTransform'     => array( 'text-transform', 'keyword', array( 'none', 'capitalize', 'uppercase', 'lowercase' ), array() ),
		'textDecoration'    => array( 'text-decoration', 'keyword', array( 'none', 'underline', 'line-through', 'overline' ), array() ),
		'textWrap'          => array( 'text-wrap', 'keyword', array( 'wrap', 'nowrap', 'balance', 'pretty', 'stable' ), array() ),
		'whiteSpace'        => array( 'white-space', 'keyword', array( 'normal', 'nowrap', 'pre', 'pre-wrap', 'pre-line', 'break-spaces' ), array() ),
		'textShadow'        => array( 'text-shadow', 'text', array(), array() ),
		// Background
		'backgroundImage'   => array( 'background-image', 'url', array(), array() ),
		'backgroundSize'    => array( 'background-size', 'keywordlength', array( 'cover', 'contain', 'auto' ), array() ),
		'backgroundPosition' => array( 'background-position', 'text', array(), array() ),
		'backgroundRepeat'  => array( 'background-repeat', 'keyword', array( 'no-repeat', 'repeat', 'repeat-x', 'repeat-y', 'space', 'round' ), array() ),
		// Gradient (composed into background-image): the type, the angle, the colour stops (a JSON list, the repeater), and
		// the two colour stops from before the repeater (kept, so saved blocks render the same)
		'gradientApply'     => array( null, 'keyword', array( 'background', 'overlay', 'text' ), array() ),
		'gradientType'      => array( null, 'keyword', array( 'linear', 'radial' ), array() ),
		'gradientStops'     => array( null, 'stops', array(), array() ),
		'gradientAngle'     => array( null, 'number', array(), array() ),
		'gradientColor1'    => array( null, 'color', array(), array() ),
		'gradientStop1'     => array( null, 'percent', array(), array() ),
		'gradientColor2'    => array( null, 'color', array(), array() ),
		'gradientStop2'     => array( null, 'percent', array(), array() ),
		// Border
		'borderWidth'       => array( 'border-width', 'size', array(), array() ),
		'borderStyle'       => array( 'border-style', 'keyword', array( 'none', 'solid', 'dashed', 'dotted', 'double' ), array() ),
		'borderColor'       => array( 'border-color', 'color', array(), array() ),
		'borderRadius'      => array( 'border-radius', 'size', array(), array() ),
		// Box shadow (composed): x, y, blur, spread and colour
		'boxShadowX'        => array( null, 'length', array(), array() ),
		'boxShadowY'        => array( null, 'length', array(), array() ),
		'boxShadowBlur'     => array( null, 'size', array(), array() ),
		'boxShadowSpread'   => array( null, 'length', array(), array() ),
		'boxShadowColor'    => array( null, 'color', array(), array() ),
		// Transform: the origin is a longhand, the rest is composed into transform
		'transformOrigin'   => array( 'transform-origin', 'text', array(), array() ),
		'translateX'        => array( null, 'length', array(), array() ),
		'translateY'        => array( null, 'length', array(), array() ),
		'rotate'            => array( null, 'number', array(), array() ),
		'scale'             => array( null, 'number', array(), array() ),
		'skewX'             => array( null, 'number', array(), array() ),
		'skewY'             => array( null, 'number', array(), array() ),
		// Filters (composed into filter)
		'filterBlur'        => array( null, 'size', array(), array() ),
		'filterBrightness'  => array( null, 'percentnumber', array(), array() ),
		'filterContrast'    => array( null, 'percentnumber', array(), array() ),
		'filterGrayscale'   => array( null, 'percentnumber', array(), array() ),
		'filterHueRotate'   => array( null, 'number', array(), array() ),
		'filterInvert'      => array( null, 'percentnumber', array(), array() ),
		'filterSaturate'    => array( null, 'percentnumber', array(), array() ),
		'filterSepia'       => array( null, 'percentnumber', array(), array() ),
		// Transition: four longhands
		'transitionProperty' => array( 'transition-property', 'keyword', array( 'all', 'opacity', 'transform', 'color', 'background-color', 'box-shadow', 'filter', 'border-color' ), array() ),
		'transitionDuration' => array( 'transition-duration', 'time', array(), array() ),
		'transitionTiming'   => array( 'transition-timing-function', 'keyword', array( 'ease', 'ease-in', 'ease-out', 'ease-in-out', 'linear' ), array() ),
		'transitionDelay'    => array( 'transition-delay', 'time', array(), array() ),
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

	/** The table for the editor: a list of [ attribute, css property, type, options, rules ]. */
	public static function for_editor() {
		$out = array();
		foreach ( self::TABLE as $key => $spec ) {
			$out[] = array( $key, $spec[0], $spec[1], $spec[2], $spec[3] );
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
			case 'lengthauto':
				return 'auto' === $v ? $v : self::length( $v, true );
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
			case 'order':
				return preg_match( '/^-?\d{1,3}$/', $v ) || self::is_var( $v ) ? $v : '';
			case 'flexnumber':
				return preg_match( '/^\d+(\.\d+)?$/', $v ) || self::is_var( $v ) ? $v : '';
			case 'number':
				return preg_match( '/^-?\d+(\.\d+)?$/', $v ) || self::is_var( $v ) ? $v : '';
			case 'percent':
				return preg_match( '/^\d+(\.\d+)?$/', $v ) && (float) $v <= 100 ? $v : '';
			case 'percentnumber':
				return preg_match( '/^\d+(\.\d+)?$/', $v ) || self::is_var( $v ) ? $v : '';
			case 'opacity':
				if ( self::is_var( $v ) ) {
					return $v;
				}
				return preg_match( '/^\d{1,3}$/', $v ) && (int) $v <= 100 ? (string) ( (int) $v / 100 ) : '';
			case 'ratio':
				return 'auto' === $v || preg_match( '/^\d+(\.\d+)?\s*\/\s*\d+(\.\d+)?$/', $v ) || self::is_var( $v ) ? $v : '';
			case 'time':
				return preg_match( '/^\d+(\.\d+)?m?s$/', $v ) || self::is_var( $v ) ? $v : '';
			case 'color':
				return SNN_Style::color( $v );
			case 'text':
				return preg_match( '/^[A-Za-z0-9 .,()%#+\-*\/]{1,200}$/', $v ) ? $v : '';
			case 'family':
				return preg_match( '/^[A-Za-z0-9 ,\'"\-]{1,120}$/', $v ) ? $v : '';
			case 'url':
				return preg_match( '/^url\(("|\')?(https?:\/\/|\/)[^"\'()\s<>]{1,500}("|\')?\)$/', $v ) ? $v : '';
			case 'template':
				return preg_match( '/^[A-Za-z0-9 .,()%+-]{1,160}$/', $v ) ? $v : '';
			case 'columns':
				// A count from 1 to 12 is that many equal columns; a bare number outside that is not a template.
				if ( preg_match( '/^(1[0-2]|[1-9])$/', $v ) ) {
					return 'repeat(' . $v . ', minmax(0, 1fr))';
				}
				return preg_match( '/^\d+$/', $v ) ? '' : self::check( 'template', $v );
			case 'areas':
				if ( strlen( $v ) > 300 ) {
					return '';
				}
				$row = '"[A-Za-z0-9_.-]+(\s+[A-Za-z0-9_.-]+)*"';
				return preg_match( '/^' . $row . '(\s+' . $row . ')*$/', $v ) ? $v : '';
			case 'ident':
				return preg_match( '/^[A-Za-z][A-Za-z0-9_-]{0,39}$/', $v ) ? $v : '';
			case 'line':
				return preg_match( '/^([1-9]\d?|var\(--[a-z][a-z0-9-]*\))$/', $v ) ? $v : '';
			case 'span':
				return preg_match( '/^((1[0-2]|[1-9])|var\(--[a-z][a-z0-9-]*\))$/', $v ) ? $v : '';
			case 'flag':
				return '1' === $v || 'true' === $v ? '1' : '';
		}
		return '';
	}

	/** A variable reference: var(--name). Allowed wherever a value is. */
	public static function is_var( $v ) {
		return (bool) preg_match( '/^var\(--[a-z][a-z0-9-]*\)$/', $v );
	}

	/**
	 * A length as CSS takes it: a number (px when it has no unit), 0, a variable, or any other CSS value made of
	 * value characters (a unit in any case, calc(), clamp(), min(), max(), vw, dvh...). Whether the browser
	 * takes a value for its property is for the browser to say, so a valid value is not refused here. Refused: a
	 * value that could leave its declaration, a word with no number, and a minus sign on an unsigned length.
	 * $signed: negative values allowed.
	 */
	private static function length( $v, $signed ) {
		if ( preg_match( '/^[+-]?(\d+(\.\d+)?|\.\d+)$/', $v ) && '0' !== $v ) {
			$v .= 'px';
		}
		if ( '0' === $v ) {
			return $v;
		}
		if ( ! $signed && '-' === substr( $v, 0, 1 ) ) {
			return '';
		}
		return self::is_css_value( $v ) ? $v : '';
	}

	/**
	 * A CSS value: only the characters a value is written with (letters, digits, spaces and . , % ( ) + - * /), a digit
	 * or a function (so no plain word), no comment, and brackets that close. Nothing here can end a declaration.
	 */
	private static function is_css_value( $v ) {
		if ( strlen( $v ) > 200 || ! preg_match( '/^[A-Za-z0-9 .,%()+*\/-]+$/', $v ) ) {
			return false;
		}
		if ( ! preg_match( '/[0-9(]/', $v ) || false !== strpos( $v, '/*' ) || false !== strpos( $v, '*/' ) ) {
			return false;
		}
		if ( preg_match( '/(expression|url)\s*\(/i', $v ) ) { // Not a length in any browser, and the old CSS ways to run code or fetch a file.
			return false;
		}
		$depth = 0;
		for ( $i = 0, $n = strlen( $v ); $i < $n; $i++ ) {
			if ( '(' === $v[ $i ] ) {
				++$depth;
			} elseif ( ')' === $v[ $i ] ) {
				--$depth;
				if ( $depth < 0 ) {
					return false;
				}
			}
		}
		return 0 === $depth;
	}

	/**
	 * The declarations the table writes for one block, in the table's order, then the composed Style properties (the box
	 * shadow, the transform, the filter and the gradient: last, so a gradient wins over a background image).
	 *
	 * $dyn: the context the dynamic tags read (null: the tags are not filled in). $view: the declarations of a view rule,
	 * where a value that is the base's default is written too (a view may turn a flex base back into a block).
	 *
	 * @return string[] "property:value" strings.
	 */
	public static function declarations( array $a, $dyn = null, $view = false ) {
		if ( is_array( $dyn ) ) {
			$a = self::with_tags( $a, $dyn );
		}
		$display = self::display_of( $a );
		$out     = array();
		foreach ( self::TABLE as $key => $spec ) {
			$rule = $spec[3];
			if ( ! self::applies( $rule, $display, $a ) ) {
				continue;
			}
			if ( isset( $rule['compose'] ) ) {
				foreach ( self::compose( $rule['compose'], $a ) as $declaration ) {
					$out[] = $declaration;
				}
				continue;
			}
			if ( null === $spec[0] ) {
				continue;
			}
			$value = self::check( $spec[1], $a[ $key ] ?? '', $spec[2] );
			// The default size of an image is cover: an image with no size chosen is drawn at cover (the editor's Size choice shows it).
			if ( '' === $value && 'backgroundSize' === $key && '' !== self::check( 'url', $a['backgroundImage'] ?? '' ) ) {
				$value = 'cover';
			}
			if ( '' === $value && isset( $rule['default'] ) ) {
				$value = $rule['default'];
			}
			if ( '' === $value ) {
				continue;
			}
			if ( ! empty( $rule['gridWord'] ) && ( 'always' === $rule['gridWord'] || self::is_grid( $display ) ) ) {
				$value = self::grid_word( $value );
			}
			if ( isset( $rule['skip'] ) && $rule['skip'] === $value && ! $view ) {
				continue;
			}
			$out[] = $spec[0] . ':' . $value;
			// extra: written with the row, unless the flag named by extraUnless is on (max width's auto margins stop with Centre off).
			$extra_off = isset( $rule['extraUnless'] ) && '1' === self::check( 'flag', $a[ $rule['extraUnless'] ] ?? '' );
			foreach ( $rule['extra'] ?? array() as $extra ) {
				if ( ! $extra_off ) {
					$out[] = $extra[0] . ':' . $extra[1];
				}
			}
		}
		foreach ( array( self::box_shadow( $a ), self::transform( $a ), self::filter( $a ) ) as $composed ) {
			if ( '' !== $composed ) {
				$out[] = $composed;
			}
		}
		// The gradient: the background (Background, or Text, which clips it to the text) or nothing (Overlay, its own rule
		// in overlay()). An overlay needs its box positioned and isolated, so its ::before sits above the background and under the content.
		foreach ( self::gradient( $a ) as $declaration ) {
			$out[] = $declaration;
		}
		if ( array() !== self::overlay( $a ) ) {
			$positioned = false;
			foreach ( $out as $declaration ) {
				if ( 0 === strpos( $declaration, 'position:' ) ) {
					$positioned = true;
				}
			}
			if ( ! $positioned ) {
				$out[] = 'position:relative';
			}
			$out[] = 'isolation:isolate';
		}
		return $out;
	}

	/** The display of the block, as the table reads it: a display choice, or block when none is valid. */
	public static function display_of( array $a ) {
		$display = $a['display'] ?? '';
		return in_array( $display, self::DISPLAYS, true ) ? $display : 'block';
	}

	/** True for a grid display (grid and inline grid). */
	public static function is_grid( $display ) {
		return in_array( $display, array( 'grid', 'inline-grid' ), true );
	}

	/** True for a flex display (flex and inline flex). */
	public static function is_flex( $display ) {
		return in_array( $display, array( 'flex', 'inline-flex' ), true );
	}

	/**
	 * Whether a row applies: its 'when' display, and its 'cond'. A flex box that wraps, or any grid, packs its lines (align
	 * content), so the 'packs' condition needs one of them.
	 */
	private static function applies( array $rule, $display, array $a ) {
		if ( isset( $rule['when'] ) ) {
			$ok = 'box' === $rule['when'] ? ( self::is_flex( $display ) || self::is_grid( $display ) ) : ( 'flex' === $rule['when'] ? self::is_flex( $display ) : self::is_grid( $display ) );
			if ( ! $ok ) {
				return false;
			}
		}
		if ( isset( $rule['cond'] ) && 'packs' === $rule['cond'] ) {
			$wrap = in_array( $a['flexWrap'] ?? '', self::FLEX_WRAP, true ) ? $a['flexWrap'] : 'nowrap';
			return self::is_grid( $display ) || 'nowrap' !== $wrap;
		}
		return true;
	}

	/** A grid has start and end where flex has flex-start and flex-end: the grid words are written. */
	public static function grid_word( $value ) {
		$words = array(
			'flex-start' => 'start',
			'flex-end'   => 'end',
		);
		return $words[ $value ] ?? $value;
	}

	/** The composed rows: the grid's auto flow, and where an item sits on a grid line (column or row). */
	private static function compose( $name, array $a ) {
		if ( 'autoflow' === $name ) {
			$dense = ! empty( $a['gridDense'] );
			$flow  = in_array( $a['gridAutoFlow'] ?? '', self::GRID_FLOW, true ) ? $a['gridAutoFlow'] : 'row';
			return $dense || 'column' === $flow ? array( 'grid-auto-flow:' . $flow . ( $dense ? ' dense' : '' ) ) : array();
		}
		$line = 'placement_column' === $name ? 'column' : 'row';
		$at   = self::placement( $a[ $line . 'Start' ] ?? '', $a[ $line . 'Span' ] ?? '' );
		return '' === $at ? array() : array( 'grid-' . $line . ':' . $at );
	}

	/**
	 * Where an item sits on a grid line: a start line, a span, or both (start / span N). A start alone places the
	 * item at that line; a span alone spans from the automatic place. '' when neither is set.
	 */
	public static function placement( $start, $span ) {
		$start = self::check( 'line', $start );
		$span  = self::check( 'span', $span );
		if ( '' === $start ) {
			return '' === $span ? '' : 'span ' . $span;
		}
		return $start . ( '' === $span ? '' : ' / span ' . $span );
	}

	/**
	 * The values with their dynamic tags filled in ({featured_image}, {cf_colour}), so a Style value can come from the
	 * post, as the layout values do. The colour stops are JSON and are left as they are. A background image whose tag
	 * gives a plain address is written as url(...), the form the image takes.
	 */
	public static function with_tags( array $a, array $dyn ) {
		foreach ( self::TABLE as $key => $spec ) {
			if ( 'stops' === $spec[1] || ! isset( $a[ $key ] ) || ! is_string( $a[ $key ] ) || false === strpos( $a[ $key ], '{' ) ) {
				continue;
			}
			$value = trim( SNN_Dynamic_Data::render( $a[ $key ], $dyn, 'plain' ) );
			if ( 'url' === $spec[1] && preg_match( '#^(https?://|/)[^"\'()\s<>]{1,500}$#', $value ) ) {
				$value = 'url(' . $value . ')';
			}
			$a[ $key ] = $value;
		}
		return $a;
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

	/** filter: blur, brightness, contrast, grayscale, invert, saturate, sepia and hue-rotate, in that order. */
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

	/**
	 * background-image: a gradient. Its colour stops are the repeater's list (gradientStops) when it has two or more valid
	 * stops; otherwise the two colour fields from before the repeater, which need both colours (stops default to 0% and 100%).
	 */
	private static function gradient( array $a ) {
		$value = self::gradient_value( $a );
		$apply = $a['gradientApply'] ?? '';
		if ( '' === $value || 'overlay' === $apply ) {
			return array();
		}
		$out = array( 'background-image:' . $value );
		if ( 'text' === $apply ) {
			// The gradient is clipped to the text, and the text itself is transparent so the gradient shows through it.
			array_push( $out, 'background-clip:text', '-webkit-background-clip:text', 'color:transparent' );
		}
		return $out;
	}

	/**
	 * The overlay: the gradient as the ::before of the block (Apply to: Overlay), drawn above the background and under
	 * the content. Its declarations, or an empty array when the block has no overlay. The block's rule carries position
	 * and isolation (declarations()), so the ::before with z-index -1 sits in the block's own stacking context.
	 */
	public static function overlay( array $a ) {
		$value = self::gradient_value( $a );
		if ( '' === $value || 'overlay' !== ( $a['gradientApply'] ?? '' ) ) {
			return array();
		}
		return array( 'content:""', 'position:absolute', 'inset:0', 'z-index:-1', 'pointer-events:none', 'border-radius:inherit', 'background-image:' . $value );
	}

	/** The gradient as a CSS image (linear or radial), or '' when it has no two colours. The stops come from the repeater. */
	private static function gradient_value( array $a ) {
		$stops = self::gradient_stops( $a );
		if ( ! $stops ) {
			$c1 = self::check( 'color', $a['gradientColor1'] ?? '' );
			$c2 = self::check( 'color', $a['gradientColor2'] ?? '' );
			if ( '' === $c1 || '' === $c2 ) {
				return '';
			}
			$s1    = self::check( 'percent', $a['gradientStop1'] ?? '' );
			$s2    = self::check( 'percent', $a['gradientStop2'] ?? '' );
			$stops = array(
				$c1 . ' ' . ( '' === $s1 ? '0' : $s1 ) . '%',
				$c2 . ' ' . ( '' === $s2 ? '100' : $s2 ) . '%',
			);
		}
		$list = implode( ', ', $stops );
		if ( 'radial' === ( $a['gradientType'] ?? '' ) ) {
			return 'radial-gradient(' . $list . ')';
		}
		$angle = self::plain_number( $a['gradientAngle'] ?? '' );
		return 'linear-gradient(' . ( '' === $angle ? '180' : $angle ) . 'deg, ' . $list . ')';
	}

	/**
	 * The repeater's stops, each a colour with an optional position ("colour" or "colour n%"). An invalid stop is dropped;
	 * fewer than two valid stops give none (a gradient needs two colours).
	 */
	private static function gradient_stops( array $a ) {
		$list = json_decode( (string) ( $a['gradientStops'] ?? '' ), true );
		if ( ! is_array( $list ) ) {
			return array();
		}
		$out = array();
		foreach ( array_slice( $list, 0, self::MAX_STOPS ) as $item ) {
			$colour = is_array( $item ) ? self::check( 'color', $item['color'] ?? '' ) : '';
			if ( '' === $colour ) {
				continue;
			}
			$stop  = self::check( 'percent', $item['stop'] ?? '' );
			$out[] = '' === $stop ? $colour : $colour . ' ' . $stop . '%';
		}
		return count( $out ) >= 2 ? $out : array();
	}

	/** A plain number (no variable, no unit): for the parts that take a unit the composition adds itself. */
	private static function plain_number( $value ) {
		$v = trim( (string) $value );
		return preg_match( '/^-?\d+(\.\d+)?$/', $v ) ? $v : '';
	}
}
