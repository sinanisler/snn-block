<?php
/**
 * Our layout blocks: Section, Container and Div. Each is one element with a tag, a display, the
 * flex settings, a gap, an ID and classes, and an optional query loop. They differ only in their
 * default tag and in the theme defaults the Blocks tab gives them (Section and Container have
 * defaults; Div has none, so it is a plain block element).
 *
 * The editor side is assets/layout-blocks.js. Keep the attribute names and the style rules in step
 * with it. The front end is rendered here, so a saved page never depends on the editor.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class SNN_Layout_Blocks {

	/** Block name => default HTML tag. */
	const BLOCKS = array(
		'snn/section'   => 'section',
		'snn/container' => 'div',
		'snn/div'       => 'div',
	);

	/** The tags the HTML tag field offers. */
	const TAGS = array( 'section', 'div', 'header', 'footer', 'main', 'article', 'aside', 'nav' );

	/** The context keys a query loop passes down: the post, its index and the total found. */
	const CONTEXT_POST  = 'snn/postId';
	const CONTEXT_INDEX = 'snn/queryIndex';
	const CONTEXT_COUNT = 'snn/queryCount';

	/** The display values: block, the inline ones, flex and grid (and their inline forms), and none (hidden). */
	const DISPLAYS       = array( 'block', 'inline-block', 'inline', 'flex', 'inline-flex', 'grid', 'inline-grid', 'none' );

	/**
	 * The display and direction each block starts with. Section and Container stack their children (a flex column,
	 * as Bricks's sections and containers do); Div is a plain block. The editor reads the same table (BLOCK_LAYOUT).
	 */
	const LAYOUT = array(
		'snn/section'   => array( 'display' => 'flex', 'flexDirection' => 'column' ),
		'snn/container' => array( 'display' => 'flex', 'flexDirection' => 'column' ),
		'snn/div'       => array( 'display' => 'block', 'flexDirection' => 'row' ),
	);
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
	const VIEW_KEYS = array( 'gap', 'paddingTop', 'paddingBottom', 'maxWidth', 'opacity', 'overflow', 'backgroundColor' );

	public static function init() {
		add_action( 'init', array( __CLASS__, 'register' ) );
		add_action( 'enqueue_block_editor_assets', array( __CLASS__, 'enqueue_editor' ) );
	}

	public static function register() {
		foreach ( self::BLOCKS as $name => $tag ) {
			register_block_type(
				$name,
				array(
					'attributes'      => self::attributes( $name ),
					'render_callback' => array( __CLASS__, 'render' ),
					// A loop passes its post and index to the blocks inside it, down the tree.
					'uses_context'    => array( self::CONTEXT_POST, self::CONTEXT_INDEX, self::CONTEXT_COUNT ),
					// The core panels are off: our own inspector has these settings.
					'supports'        => array(
						'html'            => false,
						'anchor'          => false,
						'className'       => false,
						'customClassName' => false,
						'color'           => false,
						'spacing'         => false,
						'dimensions'      => false,
						'typography'      => false,
						'layout'          => false,
						'background'      => false,
						'border'          => false,
						'shadow'          => false,
						'position'        => false,
					),
				)
			);
		}
	}

	/** The attributes of one block. The editor reads the same names and defaults. */
	public static function attributes( $name ) {
		$default_tag = self::BLOCKS[ $name ] ?? 'div';
		$layout      = self::LAYOUT[ $name ] ?? self::LAYOUT['snn/div'];
		return array(
			'tagName'        => array( 'type' => 'string', 'default' => $default_tag ),
			'htmlId'         => array( 'type' => 'string', 'default' => '' ),
			'cssClasses'     => array( 'type' => 'string', 'default' => '' ),
			'display'        => array( 'type' => 'string', 'default' => $layout['display'] ),
			'flexDirection'  => array( 'type' => 'string', 'default' => $layout['flexDirection'] ),
			'flexWrap'       => array( 'type' => 'string', 'default' => 'nowrap' ),
			'justifyContent' => array( 'type' => 'string', 'default' => '' ),
			'alignItems'     => array( 'type' => 'string', 'default' => '' ),
			'gap'            => array( 'type' => 'string', 'default' => '' ),
			'columnGap'      => array( 'type' => 'string', 'default' => '' ),
			'rowGap'         => array( 'type' => 'string', 'default' => '' ),
			'gridColumns'    => array( 'type' => 'string', 'default' => '' ),
			'gridRows'       => array( 'type' => 'string', 'default' => '' ),
			'gridAutoFlow'   => array( 'type' => 'string', 'default' => 'row' ),
			'gridDense'      => array( 'type' => 'boolean', 'default' => false ),
			'justifyItems'   => array( 'type' => 'string', 'default' => '' ),
			'alignContent'   => array( 'type' => 'string', 'default' => '' ),
			'alignSelf'      => array( 'type' => 'string', 'default' => '' ),
			'justifySelf'    => array( 'type' => 'string', 'default' => '' ),
			'flexGrow'       => array( 'type' => 'string', 'default' => '' ),
			'flexShrink'     => array( 'type' => 'string', 'default' => '' ),
			'flexBasis'      => array( 'type' => 'string', 'default' => '' ),
			'columnSpan'     => array( 'type' => 'string', 'default' => '' ),
			'rowSpan'        => array( 'type' => 'string', 'default' => '' ),
			'columnStart'    => array( 'type' => 'string', 'default' => '' ),
			'rowStart'       => array( 'type' => 'string', 'default' => '' ),
			'gridArea'       => array( 'type' => 'string', 'default' => '' ),
			'gridAreas'      => array( 'type' => 'string', 'default' => '' ),
			'gridAutoColumns' => array( 'type' => 'string', 'default' => '' ),
			'gridAutoRows'   => array( 'type' => 'string', 'default' => '' ),
			'order'          => array( 'type' => 'string', 'default' => '' ),
			'backgroundColor' => array( 'type' => 'string', 'default' => '' ),
			'paddingTop'      => array( 'type' => 'string', 'default' => '' ),
			'paddingBottom'   => array( 'type' => 'string', 'default' => '' ),
			'maxWidth'        => array( 'type' => 'string', 'default' => '' ),
			'opacity'         => array( 'type' => 'string', 'default' => '' ),
			'overflow'        => array( 'type' => 'string', 'default' => '' ),
			// The values a view sets for itself: responsive = array( 'tablet' => array( 'gap' => '16' ), 'mobile' => ... ).
			'responsive'      => array( 'type' => 'object', 'default' => array() ),
			'query'          => array( 'type' => 'object', 'default' => SNN_Query_Loop::defaults() ),
			'conditions'      => array( 'type' => 'array', 'default' => array() ),
			'interactions'    => array( 'type' => 'array', 'default' => array() ),
			'animation'       => array( 'type' => 'array', 'default' => array() ),
		) + SNN_Style_Props::attributes();
	}

	/* ------------------------------------------------------------------
	 * Rendering
	 * ---------------------------------------------------------------- */

	public static function render( $attributes, $content, $block ) {
		$a   = self::clean( $attributes, $block->name );
		$ctx = is_array( $block->context ) ? $block->context : array();

		if ( empty( $a['query']['enabled'] ) ) {
			// The conditions are checked for a block outside a loop here, and for each loop item below.
			if ( ! SNN_Block_Tools::passes( $a['conditions'], self::dynamic_context( $ctx ) ) ) {
				return '';
			}
			return self::element( $a, $block->name, $ctx, self::children( $block, $ctx ) );
		}

		// The query loop: the element, with its children, once for each post.
		$found = SNN_Query_Loop::posts( $a['query'], self::dynamic_context( $ctx ) );
		$html  = '';
		foreach ( $found['posts'] as $index => $post ) {
			$loop_ctx = array_merge(
				$ctx,
				array(
					self::CONTEXT_POST  => $post->ID,
					self::CONTEXT_INDEX => $index,
					self::CONTEXT_COUNT => $found['found'],
				)
			);
			$html .= SNN_Dynamic_Data::with_post(
				$post,
				function () use ( $a, $block, $loop_ctx ) {
					if ( ! SNN_Block_Tools::passes( $a['conditions'], self::dynamic_context( $loop_ctx ) ) ) {
						return '';
					}
					return self::element( $a, $block->name, $loop_ctx, self::children( $block, $loop_ctx ) );
				}
			);
		}
		return $html;
	}

	/** wp-block-snn-section for snn/section. The theme's block defaults are written against it. */
	public static function block_class( $name ) {
		return 'wp-block-' . str_replace( '/', '-', $name );
	}

	/** The inner blocks, rendered with the given context (the loop's post, index and count). */
	private static function children( $block, array $ctx ) {
		$html = '';
		foreach ( $block->inner_blocks as $inner ) {
			$html .= ( new WP_Block( $inner->parsed_block, $ctx ) )->render();
		}
		return $html;
	}

	/** The element itself: tag, ID, classes and the inline layout style. */
	private static function element( array $a, $name, array $ctx, $inner ) {
		$dyn = self::dynamic_context( $ctx );

		$id      = preg_replace( '/[^A-Za-z0-9_-]/', '', SNN_Dynamic_Data::render( $a['htmlId'], $dyn, 'plain' ) );
		$custom  = array_filter( array_map( 'sanitize_html_class', preg_split( '/\s+/', trim( SNN_Dynamic_Data::render( $a['cssClasses'], $dyn, 'plain' ) ) ) ) );
		$style   = self::style( $a, $dyn );

		// The block's own class (wp-block-snn-section and so on) first, then the author's classes.
		$classes = array_merge( array( self::block_class( $name ) ), $custom );

		// A view that sets its own values needs media rules, and an inline style would beat them. So the whole
		// style goes into a class rule, followed by the media rules. Without per-view values the style stays inline.
		$prefix = '';
		$views  = self::view_rules( $a, $dyn );
		if ( '' !== $views ) {
			$class     = 'snn-r-' . substr( md5( $style . $views ), 0, 10 );
			$classes[] = $class;
			$prefix    = '<style>.' . $class . '{' . $style . '}' . str_replace( '%CLASS%', $class, $views ) . '</style>';
			$style     = '';
		}

		$extra = array(
			'class' => implode( ' ', $classes ),
		);
		if ( '' !== $id ) {
			$extra['id'] = $id;
		}
		// Select Animation: the presets and modifiers the block plays (assets/js/gsap-data-animate.js reads them).
		$animation = SNN_Animation::data_animate( $a['animation'] );
		if ( '' !== $animation ) {
			$extra['data-animate'] = $animation;
			SNN_Animation::enqueue_front();
		}
		// The interactions travel on the element as JSON; the front end script (assets/interactions.js) runs them.
		$interactions = SNN_Block_Tools::interactions_attribute( $a['interactions'] );
		if ( '' !== $interactions ) {
			$extra['data-snn-interactions'] = $interactions;
			SNN_Block_Tools::enqueue_front();
			// An entrance animation runs the GSAP runtime, so the runtime loads with it.
			foreach ( $a['interactions'] as $item ) {
				if ( isset( $item['action'] ) && 'animate' === $item['action'] ) {
					SNN_Animation::enqueue_front();
					break;
				}
			}
		}
		$attrs = get_block_wrapper_attributes( $extra );
		// The style is written here, not through the wrapper: WordPress passes inline styles through its
		// own list of CSS properties, which has no grid-auto-flow, so that declaration would be dropped.
		// Every value in $style has already been checked by style().
		if ( '' !== $style ) {
			$attrs .= ' style="' . esc_attr( $style ) . '"';
		}

		return $prefix . '<' . $a['tagName'] . ' ' . $attrs . '>' . $inner . '</' . $a['tagName'] . '>';
	}

	/**
	 * The inline layout style. Block display needs none, so it adds nothing and the theme's own
	 * rules apply. Flex and grid add their display and their own settings. Gap, column gap and row
	 * gap apply to flex and grid. The item settings (align self, grow, span and so on) act on the
	 * block inside a flex or grid parent, so they are written whatever the block's own display is.
	 */
	public static function style( array $a, array $dyn = array() ) {
		$css     = array();
		$display = $a['display'];
		$flex    = in_array( $display, array( 'flex', 'inline-flex' ), true );
		$grid    = in_array( $display, array( 'grid', 'inline-grid' ), true );
		$wrap    = self::pick( $a['flexWrap'], self::FLEX_WRAP, 'nowrap' );

		// Every display but block is written: the inline ones, none, and flex and grid with their own settings.
		if ( 'block' !== $display ) {
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
			if ( $a['gridDense'] || 'column' === $a['gridAutoFlow'] ) {
				$css[] = 'grid-auto-flow:' . $a['gridAutoFlow'] . ( $a['gridDense'] ? ' dense' : '' );
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

		// Item settings: how this block sits inside its flex or grid parent.
		$self = self::grid_word( self::pick( $a['alignSelf'], self::ALIGN_SELF, '' ) );
		if ( '' !== $self ) {
			$css[] = 'align-self:' . $self;
		}
		$jself = self::grid_word( self::pick( $a['justifySelf'], self::JUSTIFY_SELF, '' ) );
		if ( '' !== $jself ) {
			$css[] = 'justify-self:' . $jself;
		}
		$order = self::integer( SNN_Dynamic_Data::render( $a['order'], $dyn, 'plain' ) );
		if ( '' !== $order ) {
			$css[] = 'order:' . $order;
		}
		$grow = self::number( SNN_Dynamic_Data::render( $a['flexGrow'], $dyn, 'plain' ) );
		if ( '' !== $grow ) {
			$css[] = 'flex-grow:' . $grow;
		}
		$shrink = self::number( SNN_Dynamic_Data::render( $a['flexShrink'], $dyn, 'plain' ) );
		if ( '' !== $shrink ) {
			$css[] = 'flex-shrink:' . $shrink;
		}
		$basis = self::length_or_auto( SNN_Dynamic_Data::render( $a['flexBasis'], $dyn, 'plain' ) );
		if ( '' !== $basis ) {
			$css[] = 'flex-basis:' . $basis;
		}
		// A named area first, so that a column or row set on the same block wins over it.
		$area = self::ident( SNN_Dynamic_Data::render( $a['gridArea'], $dyn, 'plain' ) );
		if ( '' !== $area ) {
			$css[] = 'grid-area:' . $area;
		}
		$column = self::placement( SNN_Dynamic_Data::render( $a['columnStart'], $dyn, 'plain' ), SNN_Dynamic_Data::render( $a['columnSpan'], $dyn, 'plain' ) );
		if ( '' !== $column ) {
			$css[] = 'grid-column:' . $column;
		}
		$row = self::placement( SNN_Dynamic_Data::render( $a['rowStart'], $dyn, 'plain' ), SNN_Dynamic_Data::render( $a['rowSpan'], $dyn, 'plain' ) );
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
		return implode( ';', array_merge( $css, SNN_Style_Props::declarations( $a ) ) );
	}

	/** A length for spacing and width: px, rem, em, %, vw or vh, zero, or a spacing variable. Negative values are dropped. */
	public static function size_value( $value ) {
		$value = trim( (string) $value );
		if ( preg_match( '/^\d+(\.\d+)?$/', $value ) && '0' !== $value ) {
			$value .= 'px'; // A bare number is pixels, as the panel's unit says.
		}
		if ( preg_match( '/^(var\(--[a-z][a-z0-9-]*\)|\d+(\.\d+)?(px|rem|em|%|vw|vh)|0)$/', $value ) ) {
			return $value;
		}
		return '';
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
	private static function view_rules( array $a, array $dyn ) {
		$own   = is_array( $a['responsive'] ) ? $a['responsive'] : array();
		$css   = '';
		$merge = $a;
		foreach ( self::VIEW_WIDTHS as $view => $width ) {
			if ( empty( $own[ $view ] ) ) {
				continue;
			}
			$merge = array_merge( $merge, $own[ $view ] );
			$css  .= '@media (max-width:' . $width . 'px){.%CLASS%{' . self::style( $merge, $dyn ) . '}}';
		}
		return $css;
	}

	/**
	 * A gap is a length (16px, 1rem, 0) or a spacing variable (var(--wp--preset--spacing--m)).
	 * Anything else is dropped, so a value cannot write other CSS.
	 */
	public static function gap( $value ) {
		$value = trim( (string) $value );
		if ( preg_match( '/^\d+(\.\d+)?$/', $value ) && '0' !== $value ) {
			$value .= 'px'; // A bare number is pixels, as the panel's unit says.
		}
		if ( preg_match( '/^(var\(--[a-z][a-z0-9-]*\)|-?(\d+|\d*\.\d+)(px|rem|em|%|vw|vh)|0)$/', $value ) ) {
			return $value;
		}
		return '';
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

	/* ------------------------------------------------------------------
	 * Attributes
	 * ---------------------------------------------------------------- */

	/** The attributes, cleaned: right type, allowed values, defaults for anything missing. */
	public static function clean( $attributes, $name ) {
		$attributes = is_array( $attributes ) ? $attributes : array();
		$block    = isset( self::BLOCKS[ $name ] ) ? $name : 'snn/div';
		$default  = self::BLOCKS[ $block ];
		$defaults = self::attributes( $block );

		$out = array();
		foreach ( $defaults as $key => $spec ) {
			$out[ $key ] = $attributes[ $key ] ?? $spec['default'];
		}

		$out['tagName']        = in_array( $out['tagName'], self::TAGS, true ) ? $out['tagName'] : $default;
		$out['display']        = self::pick( $out['display'], self::DISPLAYS, self::LAYOUT[ $block ]['display'] );
		$out['flexDirection']  = self::pick( $out['flexDirection'], self::FLEX_DIRECTION, self::LAYOUT[ $block ]['flexDirection'] );
		$out['flexWrap']       = self::pick( $out['flexWrap'], self::FLEX_WRAP, 'nowrap' );
		$out['justifyContent'] = self::pick( $out['justifyContent'], self::JUSTIFY, '' );
		$out['alignItems']     = self::pick( $out['alignItems'], self::ALIGN, '' );
		$out['gridAutoFlow']   = self::pick( $out['gridAutoFlow'], self::GRID_FLOW, 'row' );
		$out['gridDense']      = true === $out['gridDense'] || 1 === $out['gridDense'] || 'true' === $out['gridDense'];
		$out['justifyItems']   = self::pick( $out['justifyItems'], self::JUSTIFY_ITEMS, '' );
		$out['alignContent']   = self::pick( $out['alignContent'], self::ALIGN_CONTENT, '' );
		$out['alignSelf']      = self::pick( $out['alignSelf'], self::ALIGN_SELF, '' );
		$out['justifySelf']    = self::pick( $out['justifySelf'], self::JUSTIFY_SELF, '' );
		foreach ( array( 'htmlId', 'cssClasses', 'gap', 'columnGap', 'rowGap', 'gridColumns', 'gridRows', 'gridAreas', 'gridAutoColumns', 'gridAutoRows', 'flexGrow', 'flexShrink', 'flexBasis', 'columnSpan', 'rowSpan', 'columnStart', 'rowStart', 'gridArea', 'order', 'backgroundColor', 'paddingTop', 'paddingBottom', 'maxWidth', 'opacity' ) as $key ) {
			$out[ $key ] = is_scalar( $out[ $key ] ) ? (string) $out[ $key ] : '';
		}
		foreach ( SNN_Style_Props::keys() as $key ) {
			$out[ $key ] = is_scalar( $out[ $key ] ) ? (string) $out[ $key ] : '';
		}
		$out['animation'] = SNN_Animation::clean_tokens( $out['animation'] );
		$out['query'] = SNN_Query_Loop::sanitize( $out['query'] );
		$out['overflow']     = self::pick( $out['overflow'], self::OVERFLOW, '' );
		$out['responsive']   = self::clean_responsive( $out['responsive'] );
		$out['conditions']   = SNN_Block_Tools::sanitize_conditions( $out['conditions'] );
		$out['interactions'] = SNN_Block_Tools::sanitize_interactions( $out['interactions'] );
		return $out;
	}

	private static function pick( $value, array $allowed, $default ) {
		return is_string( $value ) && in_array( $value, $allowed, true ) ? $value : $default;
	}

	/** The context the dynamic tags read: the loop's post, index and count. */
	private static function dynamic_context( array $ctx ) {
		return array(
			'post_id' => (int) ( $ctx[ self::CONTEXT_POST ] ?? 0 ),
			'index'   => $ctx[ self::CONTEXT_INDEX ] ?? null,
			'count'   => $ctx[ self::CONTEXT_COUNT ] ?? null,
		);
	}

	/* ------------------------------------------------------------------
	 * Editor
	 * ---------------------------------------------------------------- */

	/**
	 * The variables the V button offers, from Global Styles: colours and sizes, as plain variables (--black, --size-20).
	 * Each group has a kind, 'color' or 'size', so the picker can show the groups of the field's kind first (see controls.js).
	 */
	public static function variables() {
		$v      = SNN_Global_Styles::get_values();
		$colors = array();
		foreach ( $v['colors'] as $c ) {
			$colors[] = array(
				'label' => $c['slug'],
				'value' => 'var(--' . $c['slug'] . ')',
				'color' => $c['color'], // a swatch in the picker
			);
		}
		$sizes = array();
		foreach ( $v['sizes'] as $slug => $size ) {
			$sizes[] = array(
				'label' => $slug,
				'value' => 'var(--' . $slug . ')',
			);
		}
		$groups = array();
		if ( $colors ) {
			$groups[] = array(
				'key'   => 'color',
				'label' => __( 'Colours', 'snn' ),
				'kind'  => 'color',
				'items' => $colors,
			);
		}
		if ( $sizes ) {
			$groups[] = array(
				'key'   => 'size',
				'label' => __( 'Sizes', 'snn' ),
				'kind'  => 'size',
				'items' => $sizes,
			);
		}
		return $groups;
	}

	public static function enqueue_editor() {
		if ( ! current_user_can( 'edit_posts' ) ) {
			return;
		}
		$css    = 'includes/blocks/assets/controls.css';
		$js     = 'includes/blocks/assets/controls.js';
		$icons  = 'includes/blocks/assets/layout-icons.js';
		$blocks = 'includes/blocks/assets/layout-blocks.js';
		$tools  = 'includes/blocks/assets/block-tools.js';
		$style  = 'includes/blocks/assets/style-props.js';

		wp_enqueue_style( 'snn-controls', SNN_URL . $css, array(), self::version( $css ) );
		wp_enqueue_script( 'snn-controls', SNN_URL . $js, array( 'wp-element', 'wp-api-fetch', 'wp-i18n', 'wp-data' ), self::version( $js ), true );
		wp_enqueue_script( 'snn-layout-icons', SNN_URL . $icons, array( 'wp-element' ), self::version( $icons ), true );
		wp_enqueue_script( 'snn-block-tools', SNN_URL . $tools, array( 'wp-element', 'wp-i18n', 'snn-controls' ), self::version( $tools ), true );
		wp_localize_script( 'snn-block-tools', 'snnBlockToolsData', SNN_Block_Tools::editor_data() );
		wp_localize_script(
			'snn-controls',
			'snnControlsData',
			array(
				'dynamic'   => SNN_Dynamic_Data::for_editor(),
				'variables' => self::variables(),
				'postTypes' => SNN_Query_Loop::post_type_options(),
					'taxonomies' => SNN_Query_Loop::taxonomy_options(),
					'animations' => SNN_Animation::options(),
				'orderBy'   => SNN_Query_Loop::order_by_options(),
				'tags'      => self::TAGS,
			)
		);
		wp_enqueue_script( 'snn-style-props', SNN_URL . $style, array(), self::version( $style ), true );
		wp_localize_script( 'snn-style-props', 'snnStyleTable', SNN_Style_Props::for_editor() );
		wp_enqueue_script( 'snn-layout-blocks', SNN_URL . $blocks, array( 'wp-blocks', 'wp-element', 'wp-block-editor', 'wp-data', 'wp-i18n', 'snn-controls', 'snn-layout-icons', 'snn-block-tools', 'snn-style-props' ), self::version( $blocks ), true );
	}

	private static function version( $file ) {
		return file_exists( SNN_PATH . $file ) ? (string) filemtime( SNN_PATH . $file ) : '1';
	}
}

SNN_Layout_Blocks::init();
