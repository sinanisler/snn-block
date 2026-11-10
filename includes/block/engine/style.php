<?php
/**
 * The style of a block as the front end prints it: the declarations of the property table (style-props.php), the media
 * rules of the views that set their own values, and the block's custom CSS.
 *
 * The old helper names (gap, size_value, color and so on) stay here as wrappers over the table's checks, so the callers
 * that use them (the MCP report, the tests) keep working. The editor mirrors this file in editor/style-props.js.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class SNN_Style {

	/** The layout choices: the table's option lists (style-props.php). */
	const DISPLAYS       = SNN_Style_Props::DISPLAYS;
	const FLEX_DIRECTION = SNN_Style_Props::FLEX_DIRECTION;
	const FLEX_WRAP      = SNN_Style_Props::FLEX_WRAP;
	const JUSTIFY        = SNN_Style_Props::JUSTIFY;
	const ALIGN          = SNN_Style_Props::ALIGN;
	const ALIGN_CONTENT  = SNN_Style_Props::ALIGN_CONTENT;
	const JUSTIFY_ITEMS  = SNN_Style_Props::JUSTIFY_ITEMS;
	const GRID_FLOW      = SNN_Style_Props::GRID_FLOW;
	const ALIGN_SELF     = SNN_Style_Props::ALIGN_SELF;
	const JUSTIFY_SELF   = SNN_Style_Props::JUSTIFY_SELF;
	const OVERFLOW       = SNN_Style_Props::OVERFLOW;

	/**
	 * The Tablet and Mobile widths in px, from the Global Styles breakpoints (SNN_Global_Styles::breakpoints()). A value a view
	 * sets applies up to its width: Tablet to 991 px, Mobile to 478 px by default.
	 */
	public static function view_widths() {
		return SNN_Global_Styles::breakpoints();
	}

	/** The keys a view may set are the table's keys (SNN_Style_Props::keys()); nothing else is listed here. */
	const VIEW_KEYS = array();

	/** The declarations of a block's style: the table's, with the view flag (see SNN_Style_Props::declarations()). */
	public static function style( array $a, array $dyn = array(), $view = false ) {
		return implode( ';', SNN_Style_Props::declarations( $a, $dyn, $view ) );
	}

	/* ------------------------------------------------------------------
	 * Helper names kept for the callers that use them: each is the table's check for that type.
	 * ---------------------------------------------------------------- */

	/** A length for spacing and width (SNN_Style_Props::check). A bare number is px. Negative values are dropped. */
	public static function size_value( $value ) {
		return SNN_Style_Props::check( 'size', $value );
	}

	/** An opacity from 0 to 100 (a percentage), written as 0 to 1. Anything else is dropped. */
	public static function opacity( $value ) {
		return SNN_Style_Props::check( 'opacity', $value );
	}

	/** A gap is a length or a spacing variable. */
	public static function gap( $value ) {
		return SNN_Style_Props::check( 'length', $value );
	}

	/** A colour: a hex value, rgb(), rgba(), hsl(), hsla(), a theme colour variable, or transparent. Anything else is dropped. */
	public static function color( $value ) {
		$value = trim( (string) $value );
		if ( preg_match( '/^(#([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})|(rgba?|hsla?)\([0-9a-z.,%\s\/+-]{1,60}\)|var\(--[a-z][a-z0-9-]*\)|transparent)$/i', $value ) ) {
			return $value;
		}
		return '';
	}

	/** A grid column count (1 to 12) is that many equal columns. Anything else is a track template. */
	public static function columns( $value ) {
		return SNN_Style_Props::check( 'columns', $value );
	}

	/** A track template, such as 1fr 2fr or repeat(auto-fill, minmax(240px, 1fr)). */
	public static function template( $value ) {
		return SNN_Style_Props::check( 'template', $value );
	}

	/** A span for a grid item: 1 to 12, or nothing. */
	public static function span( $value ) {
		return SNN_Style_Props::check( 'span', $value );
	}

	/** A grid line for an item: 1 to 99, or nothing. */
	public static function line( $value ) {
		return SNN_Style_Props::check( 'line', $value );
	}

	/** Where an item sits on a grid line (start, span, or both). */
	public static function placement( $start, $span ) {
		return SNN_Style_Props::placement( $start, $span );
	}

	/** An order for a flex or grid item: a whole number, up to three digits. */
	public static function integer( $value ) {
		return SNN_Style_Props::check( 'order', $value );
	}

	/** A grid area name: a letter, then letters, digits, underscores or hyphens. */
	public static function ident( $value ) {
		return SNN_Style_Props::check( 'ident', $value );
	}

	/** The rows of a grid's areas: quoted names, one string per row. */
	public static function areas( $value ) {
		return SNN_Style_Props::check( 'areas', $value );
	}

	/** A non-negative number, for flex grow and shrink. */
	public static function number( $value ) {
		return SNN_Style_Props::check( 'flexnumber', $value );
	}

	/** A flex basis: auto, or a length or spacing variable. */
	public static function length_or_auto( $value ) {
		return SNN_Style_Props::check( 'lengthauto', $value );
	}

	/* ------------------------------------------------------------------
	 * Views
	 * ---------------------------------------------------------------- */

	/**
	 * The values each view sets: only the table's keys, only the views in view_widths(), and only values that are not
	 * empty. The values themselves are checked where they are written (declarations()).
	 */
	public static function clean_responsive( $value ) {
		$out = array();
		if ( ! is_array( $value ) ) {
			return $out;
		}
		foreach ( array_keys( self::view_widths() ) as $view ) {
			if ( ! isset( $value[ $view ] ) || ! is_array( $value[ $view ] ) ) {
				continue;
			}
			$own = array();
			foreach ( SNN_Style_Props::keys() as $key ) {
				if ( isset( $value[ $view ][ $key ] ) && is_scalar( $value[ $view ][ $key ] ) && '' !== (string) $value[ $view ][ $key ] ) {
					$own[ $key ] = mb_substr( (string) $value[ $view ][ $key ], 0, 300 );
				}
			}
			if ( $own ) {
				$out[ $view ] = $own;
			}
		}
		return $out;
	}

	/** The declarations as a property => value map, the last value of a property winning, as the browser reads them. */
	private static function last_values( array $decls ) {
		$map = array();
		foreach ( $decls as $decl ) {
			$colon = strpos( $decl, ':' );
			if ( false !== $colon ) {
				$map[ substr( $decl, 0, $colon ) ] = substr( $decl, $colon + 1 );
			}
		}
		return $map;
	}

	/**
	 * The media rules for the views that set their own values. Each view's rule holds only the declarations that change
	 * from the layer above it: the base rule for the first view, the view before it for the next. A value the layer above
	 * already gives is left out. Returns '' when no view changes a value. The class is a placeholder until the caller
	 * fills it in.
	 */
	public static function view_rules( array $a, array $dyn ) {
		$own    = is_array( $a['responsive'] ?? null ) ? $a['responsive'] : array();
		$css    = '';
		$merge  = $a;
		// What the layer above prints: the base rule (no view flag), then each view's rule (with the view flag).
		$above  = SNN_Style_Props::declarations( $a, $dyn, false );
		$before = SNN_Style_Props::overlay( $a );
		foreach ( self::view_widths() as $view => $width ) {
			if ( empty( $own[ $view ] ) ) {
				continue;
			}
			$merge = array_merge( $merge, $own[ $view ] );
			$now   = SNN_Style_Props::declarations( $merge, $dyn, true );
			$body  = '';
			// A property is written when its last value differs from the layer above. A property can be written twice in one
			// style (a fixed max-width sets the side margins, and an explicit margin after them); the last one counts, as in
			// the browser, so the comparison is per property, not per declaration.
			$above_values = self::last_values( $above );
			$diff         = array();
			foreach ( self::last_values( $now ) as $prop => $value ) {
				if ( ! isset( $above_values[ $prop ] ) || $above_values[ $prop ] !== $value ) {
					$diff[] = $prop . ':' . $value;
				}
			}
			if ( $diff ) {
				$body .= '.%CLASS%{' . implode( ';', $diff ) . '}';
			}
			// The view's overlay: its own ::before, or none when this view has no overlay but the layer above had one.
			$overlay = SNN_Style_Props::overlay( $merge );
			if ( $overlay !== $before ) {
				$body .= '.%CLASS%::before{' . ( $overlay ? implode( ';', $overlay ) : 'content:none' ) . '}';
			}
			if ( '' !== $body ) {
				$css .= '@media (max-width:' . $width . 'px){' . $body . '}';
			}
			$above  = $now;
			$before = $overlay;
		}
		return $css;
	}

	/* ------------------------------------------------------------------
	 * Hover state
	 * ---------------------------------------------------------------- */

	/** The levels a hover value can be set on: the base, and the views (the same widths as the views). */
	const HOVER_LEVELS = array( 'base', 'tablet', 'mobile' );

	/**
	 * The values a hover state sets: hoverStyle = array( 'base' => array( key => value ), 'tablet' => ..., 'mobile' => ... ).
	 * Only the table's keys, and only values that are not empty. The values are checked where they are written.
	 */
	public static function clean_hover( $value ) {
		$out = array();
		if ( ! is_array( $value ) ) {
			return $out;
		}
		foreach ( self::HOVER_LEVELS as $level ) {
			if ( ! isset( $value[ $level ] ) || ! is_array( $value[ $level ] ) ) {
				continue;
			}
			$own = array();
			foreach ( SNN_Style_Props::keys() as $key ) {
				if ( isset( $value[ $level ][ $key ] ) && is_scalar( $value[ $level ][ $key ] ) && '' !== (string) $value[ $level ][ $key ] ) {
					$own[ $key ] = mb_substr( (string) $value[ $level ][ $key ], 0, 300 );
				}
			}
			if ( $own ) {
				$out[ $level ] = $own;
			}
		}
		// The hover state's custom CSS: its rules, with %root% the block in its hover state (see hover_rules()).
		$css = isset( $value['css'] ) && is_string( $value['css'] ) ? self::clean_css( $value['css'] ) : '';
		if ( '' !== $css ) {
			$out['css'] = $css;
		}
		return $out;
	}

	/**
	 * The hover rules: what a block's hover state changes, on the base and on each view. A hover value wins over the
	 * normal value of its level, and a hover of a view wins over the base hover. The rule for a level holds only the
	 * declarations that differ from the normal style of that level (the same comparison as view_rules()). Written with
	 * the placeholder %CLASS% for the block's class, as view_rules() is. Returns '' when no hover value is set.
	 */
	public static function hover_rules( array $a, array $dyn ) {
		$hover = self::clean_hover( $a['hoverStyle'] ?? array() );
		if ( ! $hover ) {
			return '';
		}
		$own   = is_array( $a['responsive'] ?? null ) ? $a['responsive'] : array();
		$views = self::view_widths();
		$css   = '';
		$base  = $hover['base'] ?? array();
		$tab   = $hover['tablet'] ?? array();
		$mob   = $hover['mobile'] ?? array();
		// Each level is compared with the layers that apply below it at the same width, in the browser's order: the normal
		// values of the level, then the base hover (a hover rule is more specific than the normal rules), then the hover of
		// the views above. The rule of a level holds what it changes on those.
		$normal_tablet = array_merge( $a, $own['tablet'] ?? array() );
		$normal_mobile = array_merge( $normal_tablet, $own['mobile'] ?? array() );
		$lower_tablet  = array_merge( $normal_tablet, $base );
		$lower_mobile  = array_merge( $normal_mobile, $base, $tab );
		$levels        = array(
			array( null, $a, array_merge( $a, $base ), false ),
			array( 'tablet', $lower_tablet, array_merge( $lower_tablet, $tab ), true ),
			array( 'mobile', $lower_mobile, array_merge( $lower_mobile, $mob ), true ),
		);
		foreach ( $levels as $level ) {
			list( $view, $normal, $hovered, $is_view ) = $level;
			list( $decls, $before ) = self::hover_parts( $normal, $hovered, $dyn, $is_view );
			$body = '';
			if ( '' !== $decls ) {
				$body .= '.%CLASS%:hover{' . $decls . '}';
			}
			if ( '' !== $before ) {
				$body .= '.%CLASS%:hover::before{' . $before . '}';
			}
			if ( '' === $body ) {
				continue;
			}
			$css .= null === $view ? $body : '@media (max-width:' . $views[ $view ] . 'px){' . $body . '}';
		}
		// The hover's own CSS: the rules of the state, with the block in its hover state for %root%.
		if ( ! empty( $hover['css'] ) ) {
			$css .= self::scope_css( $hover['css'], '.%CLASS%:hover' );
		}
		return $css;
	}

	/**
	 * What a hover changes on one level, as two parts: the declarations of the block, and the declarations of its ::before
	 * (the overlay). A property is written when its last value differs from the normal level's last value. Both are ''
	 * when the hover changes nothing there.
	 *
	 * @return string[] The declarations, then the overlay's declarations.
	 */
	private static function hover_parts( array $normal, array $hovered, $dyn, $view ) {
		$normal_values = self::last_values( SNN_Style_Props::declarations( $normal, $dyn, $view ) );
		$diff          = array();
		foreach ( self::last_values( SNN_Style_Props::declarations( $hovered, $dyn, $view ) ) as $prop => $value ) {
			if ( ! isset( $normal_values[ $prop ] ) || $normal_values[ $prop ] !== $value ) {
				$diff[] = $prop . ':' . $value;
			}
		}
		// The overlay (Apply to: Overlay): the hover's ::before, or none when the hover takes the overlay away.
		$overlay_normal = SNN_Style_Props::overlay( $normal );
		$overlay_hover  = SNN_Style_Props::overlay( $hovered );
		$before         = '';
		if ( $overlay_normal !== $overlay_hover ) {
			$before = $overlay_hover ? implode( ';', $overlay_hover ) : 'content:none';
		}
		return array( implode( ';', $diff ), $before );
	}

	/* ------------------------------------------------------------------
	 * Custom CSS
	 * ---------------------------------------------------------------- */

	/**
	 * Custom CSS: text of up to 4000 characters. Markup that would end the style element, and imports, are removed.
	 * The rules use %root% for the block.
	 */
	public static function clean_css( $value ) {
		$value = is_string( $value ) ? substr( $value, 0, 4000 ) : '';
		// Removed until nothing is left to remove: one pass would leave the tag that </st</style>yle> closes up into.
		do {
			$before = $value;
			$value  = (string) preg_replace( '/<\/?\s*(style|script)[^>]*>|<!--|-->|@import[^;]*;?/i', '', $value );
		} while ( $value !== $before );
		// No markup at all: a < that could open or close a tag is written as its CSS escape, so nothing in the text
		// can end the style element. A comparison in a media query (width < 600px) is followed by a space and stays.
		$value = (string) preg_replace( '/<(?=[A-Za-z\/!?])/', '\\\\3c ', $value );
		return trim( $value );
	}

	/**
	 * The custom CSS with the block's class in place of its name. %root% and selector both mean the block. selector
	 * counts only where a rule names its selector (the text before a {), so .selector, #selector and a value such as
	 * "selector" are left as they are. The editor's copy is scopeCss() in editor/layout-blocks.js: keep the two in step.
	 */
	public static function scope_css( $css, $selector ) {
		$parts = preg_split( '/([{};])/', $css, -1, PREG_SPLIT_DELIM_CAPTURE );
		$out   = '';
		foreach ( $parts as $i => $part ) {
			if ( 0 === $i % 2 && isset( $parts[ $i + 1 ] ) && '{' === $parts[ $i + 1 ] ) {
				$part = preg_replace( '/(^|[\s,>+~(])selector(?![\w-])/i', '$1' . $selector, $part );
			}
			$out .= $part;
		}
		return str_replace( '%root%', $selector, $out );
	}

	/**
	 * The custom CSS a block writes, cleaned by clean_css(). Anyone who can edit the block may write it, so there is no
	 * role check here. The rules go through %root% (see SNN_Block_Render::element()).
	 */
	public static function custom_css_text( $css ) {
		return is_string( $css ) ? self::clean_css( $css ) : '';
	}
}
