<?php
/**
 * The style of a block: the layout settings (display, flex, grid, gaps, the item settings, spacing, width, opacity,
 * overflow, background colour), their checks, the values each view sets, and the block's own CSS.
 *
 * Every value is checked before it is written. A value that is not allowed writes nothing. The Style groups'
 * properties are in style-props.php. The editor mirrors these rules in editor/layout-blocks.js and
 * editor/style-props.js: keep them in step.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class SNN_Style {

	/** The display values: block, the inline ones, flex and grid (and their inline forms), and none (hidden). */
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

	/**
	 * The views that can set their own values, and the widest width each one covers (the view menu's
	 * Tablet and Mobile). A value a view does not set comes from the view above it, then from Desktop.
	 */
	const VIEW_WIDTHS = array(
		'tablet' => 991,
		'mobile' => 478,
	);

	/** The settings a view can set for itself. Each is the attribute of the same name. */
	const VIEW_KEYS = array(
		'gap',
		'paddingTop',
		'paddingBottom',
		'maxWidth',
		'opacity',
		'overflow',
		'backgroundColor',
		// The layout: every flex and grid setting, and the item settings, are per view as well.
		'display',
		'flexDirection',
		'flexWrap',
		'justifyContent',
		'alignItems',
		'alignContent',
		'columnGap',
		'rowGap',
		'gridColumns',
		'gridRows',
		'gridAutoColumns',
		'gridAutoRows',
		'gridAreas',
		'gridAutoFlow',
		'gridDense',
		'justifyItems',
		'alignSelf',
		'justifySelf',
		'order',
		'flexGrow',
		'flexShrink',
		'flexBasis',
		'columnSpan',
		'rowSpan',
		'columnStart',
		'rowStart',
		'gridArea',
	);

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
	 * "selector" are left as they are. The editor's copy is scopeCss() in assets/layout-blocks.js: keep the two in step.
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
	 * role check here. The rules go through %root% (see element()).
	 */
	public static function custom_css_text( $css ) {
		return is_string( $css ) ? self::clean_css( $css ) : '';
	}

	/**
	 * The inline layout style. Block display needs none, so it adds nothing and the theme's own
	 * rules apply. Flex and grid add their display and their own settings. Gap, column gap and row
	 * gap apply to flex and grid. Each setting is written only for the display that uses it, as the
	 * panel shows it: the flex settings for flex, the grid settings for grid, and none of the other
	 * display's (its values stay stored, but are not rendered). The item settings act on the block inside
	 * its parent: align self for flex and grid, grow, shrink and basis for flex, justify self, the lines
	 * and the area for grid, and order for every display.
	 */
	public static function style( array $a, array $dyn = array(), $view = false ) {
		$css     = array();
		// A view's own value is not cleaned by clean(), so each one is checked here, as the rest of this function does.
		$display = self::pick( $a['display'], self::DISPLAYS, 'block' );
		$flex    = in_array( $display, array( 'flex', 'inline-flex' ), true );
		$grid    = in_array( $display, array( 'grid', 'inline-grid' ), true );
		$wrap    = self::pick( $a['flexWrap'], self::FLEX_WRAP, 'nowrap' );

		// Every display but block is written: the inline ones, none, and flex and grid with their own settings. A view's
		// rule writes block too, because the view may turn a flex base back into a block.
		if ( 'block' !== $display || $view ) {
			$css[] = 'display:' . $display;
		}

		if ( $flex ) {
			$css[] = 'flex-direction:' . self::pick( $a['flexDirection'], self::FLEX_DIRECTION, 'row' );
			$css[] = 'flex-wrap:' . $wrap;
		} elseif ( $grid ) {
			$columns = self::columns( SNN_Dynamic_Data::render( $a['gridColumns'], $dyn, 'plain' ) );
			if ( '' !== $columns ) {
				$css[] = 'grid-template-columns:' . $columns;
			}
			$rows = self::template( SNN_Dynamic_Data::render( $a['gridRows'], $dyn, 'plain' ) );
			if ( '' !== $rows ) {
				$css[] = 'grid-template-rows:' . $rows;
			}
			$areas = self::areas( SNN_Dynamic_Data::render( $a['gridAreas'], $dyn, 'plain' ) );
			if ( '' !== $areas ) {
				$css[] = 'grid-template-areas:' . $areas;
			}
			$auto_columns = self::template( SNN_Dynamic_Data::render( $a['gridAutoColumns'], $dyn, 'plain' ) );
			if ( '' !== $auto_columns ) {
				$css[] = 'grid-auto-columns:' . $auto_columns;
			}
			$auto_rows = self::template( SNN_Dynamic_Data::render( $a['gridAutoRows'], $dyn, 'plain' ) );
			if ( '' !== $auto_rows ) {
				$css[] = 'grid-auto-rows:' . $auto_rows;
			}
			// A view's own off is '0', which empty() takes as off (as it takes '' and false).
			$dense = ! empty( $a['gridDense'] );
			$flow  = self::pick( $a['gridAutoFlow'], self::GRID_FLOW, 'row' );
			if ( $dense || 'column' === $flow ) {
				$css[] = 'grid-auto-flow:' . $flow . ( $dense ? ' dense' : '' );
			}
		}

		if ( $flex || $grid ) {
			$justify = self::pick( $a['justifyContent'], self::JUSTIFY, '' );
			$align   = self::pick( $a['alignItems'], self::ALIGN, '' );
			if ( $grid ) {
				$justify = self::grid_word( $justify );
				$align   = self::grid_word( $align );
			}
			if ( '' !== $justify ) {
				$css[] = 'justify-content:' . $justify;
			}
			if ( '' !== $align ) {
				$css[] = 'align-items:' . $align;
			}
			if ( $grid ) {
				$items = self::grid_word( self::pick( $a['justifyItems'], self::JUSTIFY_ITEMS, '' ) );
				if ( '' !== $items ) {
					$css[] = 'justify-items:' . $items;
				}
			}
			// The lines of a grid, or of a flex box that wraps, are packed by align content.
			$content = self::pick( $a['alignContent'], self::ALIGN_CONTENT, '' );
			if ( $grid ) {
				$content = self::grid_word( $content );
			}
			if ( '' !== $content && ( $grid || 'nowrap' !== $wrap ) ) {
				$css[] = 'align-content:' . $content;
			}
			$gap = self::gap( SNN_Dynamic_Data::render( $a['gap'], $dyn, 'plain' ) );
			if ( '' !== $gap ) {
				$css[] = 'gap:' . $gap;
			}
			$column_gap = self::gap( SNN_Dynamic_Data::render( $a['columnGap'], $dyn, 'plain' ) );
			if ( '' !== $column_gap ) {
				$css[] = 'column-gap:' . $column_gap;
			}
			$row_gap = self::gap( SNN_Dynamic_Data::render( $a['rowGap'], $dyn, 'plain' ) );
			if ( '' !== $row_gap ) {
				$css[] = 'row-gap:' . $row_gap;
			}
		}

		// Item settings: how this block sits inside its parent, each one for the display that uses it.
		$self = ( $flex || $grid ) ? self::grid_word( self::pick( $a['alignSelf'], self::ALIGN_SELF, '' ) ) : '';
		if ( '' !== $self ) {
			$css[] = 'align-self:' . $self;
		}
		$jself = $grid ? self::grid_word( self::pick( $a['justifySelf'], self::JUSTIFY_SELF, '' ) ) : '';
		if ( '' !== $jself ) {
			$css[] = 'justify-self:' . $jself;
		}
		$order = self::integer( SNN_Dynamic_Data::render( $a['order'], $dyn, 'plain' ) );
		if ( '' !== $order ) {
			$css[] = 'order:' . $order;
		}
		$grow = $flex ? self::number( SNN_Dynamic_Data::render( $a['flexGrow'], $dyn, 'plain' ) ) : '';
		if ( '' !== $grow ) {
			$css[] = 'flex-grow:' . $grow;
		}
		$shrink = $flex ? self::number( SNN_Dynamic_Data::render( $a['flexShrink'], $dyn, 'plain' ) ) : '';
		if ( '' !== $shrink ) {
			$css[] = 'flex-shrink:' . $shrink;
		}
		$basis = $flex ? self::length_or_auto( SNN_Dynamic_Data::render( $a['flexBasis'], $dyn, 'plain' ) ) : '';
		if ( '' !== $basis ) {
			$css[] = 'flex-basis:' . $basis;
		}
		// A named area first, so that a column or row set on the same block wins over it.
		$area = $grid ? self::ident( SNN_Dynamic_Data::render( $a['gridArea'], $dyn, 'plain' ) ) : '';
		if ( '' !== $area ) {
			$css[] = 'grid-area:' . $area;
		}
		$column = $grid ? self::placement( SNN_Dynamic_Data::render( $a['columnStart'], $dyn, 'plain' ), SNN_Dynamic_Data::render( $a['columnSpan'], $dyn, 'plain' ) ) : '';
		if ( '' !== $column ) {
			$css[] = 'grid-column:' . $column;
		}
		$row = $grid ? self::placement( SNN_Dynamic_Data::render( $a['rowStart'], $dyn, 'plain' ), SNN_Dynamic_Data::render( $a['rowSpan'], $dyn, 'plain' ) ) : '';
		if ( '' !== $row ) {
			$css[] = 'grid-row:' . $row;
		}

		$background = self::color( SNN_Dynamic_Data::render( $a['backgroundColor'], $dyn, 'plain' ) );
		if ( '' !== $background ) {
			$css[] = 'background-color:' . $background;
		}

		// Spacing, width, opacity and overflow. A view that sets its own value gets its own rule (see element()).
		$padding_top = self::size_value( SNN_Dynamic_Data::render( $a['paddingTop'], $dyn, 'plain' ) );
		if ( '' !== $padding_top ) {
			$css[] = 'padding-top:' . $padding_top;
		}
		$padding_bottom = self::size_value( SNN_Dynamic_Data::render( $a['paddingBottom'], $dyn, 'plain' ) );
		if ( '' !== $padding_bottom ) {
			$css[] = 'padding-bottom:' . $padding_bottom;
		}
		$max_width = self::size_value( SNN_Dynamic_Data::render( $a['maxWidth'], $dyn, 'plain' ) );
		if ( '' !== $max_width ) {
			// A limited width sits in the middle of its parent.
			$css[] = 'max-width:' . $max_width;
			$css[] = 'margin-left:auto';
			$css[] = 'margin-right:auto';
		}
		$opacity = self::opacity( SNN_Dynamic_Data::render( $a['opacity'], $dyn, 'plain' ) );
		if ( '' !== $opacity ) {
			$css[] = 'opacity:' . $opacity;
		}
		$overflow = self::pick( $a['overflow'], self::OVERFLOW, '' );
		if ( '' !== $overflow ) {
			$css[] = 'overflow:' . $overflow;
		}

		// The Style groups (spacing, sizing, typography, background, border, transform, filters, transitions).
		return implode( ';', array_merge( $css, SNN_Style_Props::declarations( $a, $dyn ) ) );
	}

	/** A length for spacing and width, as the Style groups take it (SNN_Style_Props::check). A bare number is px. Negative values are dropped. */
	public static function size_value( $value ) {
		return SNN_Style_Props::check( 'size', $value );
	}

	/** An opacity from 0 to 100 (a percentage), written as 0 to 1. Anything else is dropped. */
	public static function opacity( $value ) {
		$value = trim( (string) $value );
		// A variable is written as it is: its own value is the opacity (0 to 1).
		if ( preg_match( '/^var\(--[a-z][a-z0-9-]*\)$/', $value ) ) {
			return $value;
		}
		if ( ! preg_match( '/^\d{1,3}$/', $value ) || (int) $value > 100 ) {
			return '';
		}
		return (string) ( (int) $value / 100 );
	}

	/**
	 * The values each view sets: only the keys in VIEW_KEYS, only the views in VIEW_WIDTHS, and only values
	 * that are not empty. The values themselves are checked where they are written (style()).
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
			foreach ( array_merge( self::VIEW_KEYS, SNN_Style_Props::keys() ) as $key ) {
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
	 * The media rules for the views that set their own values. Each rule holds the whole style of that view
	 * (the base, then the views above it, then its own), because a rule for a narrower view must win over the
	 * base. Returns '' when no view sets a value. The class is a placeholder until the caller fills it in.
	 */
	public static function view_rules( array $a, array $dyn ) {
		$own   = is_array( $a['responsive'] ) ? $a['responsive'] : array();
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

	/**
	 * A gap is a CSS length (16px, 1rem, 0, calc(...)) or a spacing variable (var(--wp--preset--spacing--m)), as the
	 * Style groups take it (SNN_Style_Props::check). Anything that is not one is dropped, so a value cannot write other CSS.
	 */
	public static function gap( $value ) {
		return SNN_Style_Props::check( 'length', $value );
	}

	/**
	 * A colour: a hex value, rgb(), rgba(), hsl(), hsla(), a theme colour variable, or transparent.
	 * Anything else is dropped, so a value cannot write other CSS.
	 */
	public static function color( $value ) {
		$value = trim( (string) $value );
		if ( preg_match( '/^(#([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})|(rgba?|hsla?)\([0-9a-z.,%\s\/+-]{1,60}\)|var\(--[a-z][a-z0-9-]*\)|transparent)$/i', $value ) ) {
			return $value;
		}
		return '';
	}

	/** A grid column count (1 to 12) is that many equal columns. Anything else is a track template. */
	public static function columns( $value ) {
		$value = trim( (string) $value );
		if ( preg_match( '/^(1[0-2]|[1-9])$/', $value ) ) {
			return 'repeat(' . $value . ', minmax(0, 1fr))';
		}
		if ( preg_match( '/^\d+$/', $value ) ) {
			return ''; // a bare number outside 1 to 12 is not a template
		}
		return self::template( $value );
	}

	/**
	 * A track template, such as 1fr 2fr or repeat(auto-fill, minmax(240px, 1fr)). Only letters, digits,
	 * spaces, and ( ) , . % + - are kept, so a template cannot write a declaration or a URL.
	 */
	public static function template( $value ) {
		$value = trim( (string) $value );
		return preg_match( '/^[A-Za-z0-9 .,()%+-]{1,160}$/', $value ) ? $value : '';
	}

	/** A span for a grid item: 1 to 12, or nothing. */
	public static function span( $value ) {
		$value = trim( (string) $value );
		return preg_match( '/^((1[0-2]|[1-9])|var\(--[a-z][a-z0-9-]*\))$/', $value ) ? $value : '';
	}

	/** A grid line for an item: 1 to 99, or nothing. */
	public static function line( $value ) {
		$value = trim( (string) $value );
		return preg_match( '/^([1-9]\d?|var\(--[a-z][a-z0-9-]*\))$/', $value ) ? $value : '';
	}

	/**
	 * Where an item sits on a grid line: a start line, a span, or both (start / span N). A start alone places the
	 * item at that line; a span alone spans from the automatic place. Returns '' when neither is set.
	 */
	public static function placement( $start, $span ) {
		$start = self::line( $start );
		$span  = self::span( $span );
		if ( '' === $start ) {
			return '' === $span ? '' : 'span ' . $span;
		}
		return $start . ( '' === $span ? '' : ' / span ' . $span );
	}

	/** An order for a flex or grid item: a whole number, negative or not, up to three digits. */
	public static function integer( $value ) {
		$value = trim( (string) $value );
		return preg_match( '/^(-?\d{1,3}|var\(--[a-z][a-z0-9-]*\))$/', $value ) ? $value : '';
	}

	/** A grid area name: a letter, then letters, digits, underscores or hyphens. */
	public static function ident( $value ) {
		$value = trim( (string) $value );
		return preg_match( '/^[A-Za-z][A-Za-z0-9_-]{0,39}$/', $value ) ? $value : '';
	}

	/**
	 * The rows of a grid's areas: each row a quoted string of names (a dot is an empty cell), such as "a a b" "c c b".
	 * Only letters, digits, dots, hyphens, underscores, spaces and the quotes pass, so a value cannot write a declaration.
	 */
	public static function areas( $value ) {
		$value = trim( (string) $value );
		if ( strlen( $value ) > 300 ) {
			return '';
		}
		$row = '"[A-Za-z0-9_.-]+(\s+[A-Za-z0-9_.-]+)*"';
		return preg_match( '/^' . $row . '(\s+' . $row . ')*$/', $value ) ? $value : '';
	}

	/** A non-negative number, for flex grow and shrink. */
	public static function number( $value ) {
		$value = trim( (string) $value );
		return preg_match( '/^(\d+(\.\d+)?|var\(--[a-z][a-z0-9-]*\))$/', $value ) ? $value : '';
	}

	/** A flex basis: auto, or a length or spacing variable (as for the gap). */
	public static function length_or_auto( $value ) {
		$value = trim( (string) $value );
		return 'auto' === $value ? 'auto' : self::gap( $value );
	}

	/** Grid has start and end, where flex has flex-start and flex-end. The grid words are written. */
	private static function grid_word( $value ) {
		$words = array(
			'flex-start' => 'start',
			'flex-end'   => 'end',
		);
		return $words[ $value ] ?? $value;
	}

	private static function pick( $value, array $allowed, $default ) {
		return is_string( $value ) && in_array( $value, $allowed, true ) ? $value : $default;
	}
}
