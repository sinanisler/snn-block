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
	 * The views that can set their own values, and the widest width each one covers (the view menu's Tablet and Mobile).
	 * A value a view does not set comes from the view above it, then from Desktop.
	 */
	const VIEW_WIDTHS = array(
		'tablet' => 991,
		'mobile' => 478,
	);

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
	 * The values each view sets: only the table's keys, only the views in VIEW_WIDTHS, and only values that are not
	 * empty. The values themselves are checked where they are written (declarations()).
	 */
	public static function clean_responsive( $value ) {
		$out = array();
		if ( ! is_array( $value ) ) {
			return $out;
		}
		foreach ( array_keys( self::VIEW_WIDTHS ) as $view ) {
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

	/**
	 * The media rules for the views that set their own values. Each rule holds the whole style of that view (the base,
	 * then the views above it, then its own), because a rule for a narrower view must win over the base. Returns ''
	 * when no view sets a value. The class is a placeholder until the caller fills it in.
	 */
	public static function view_rules( array $a, array $dyn ) {
		$own   = is_array( $a['responsive'] ?? null ) ? $a['responsive'] : array();
		$css   = '';
		$merge = $a;
		foreach ( self::VIEW_WIDTHS as $view => $width ) {
			if ( empty( $own[ $view ] ) ) {
				continue;
			}
			$merge = array_merge( $merge, $own[ $view ] );
			// The view's overlay: its own ::before, or none when this view has no overlay (so a base overlay is off here).
			$before = implode( ';', SNN_Style_Props::overlay( $merge ) );
			$css   .= '@media (max-width:' . $width . 'px){.%CLASS%{' . self::style( $merge, $dyn, true ) . '}.%CLASS%::before{' . ( '' !== $before ? $before : 'content:none' ) . '}}';
		}
		return $css;
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
