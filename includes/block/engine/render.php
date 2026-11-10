<?php
/**
 * Rendering: every block of ours is printed here, so a saved page never depends on the editor.
 *
 * A block is one element: its tag, ID, classes, style, custom attributes, animations and interactions, with its
 * inside (the inner blocks, or what the block's class prints). A block with a query loop is printed once for each
 * post. The block's class (blocks/<folder>/block.php) can change the tag, add attributes and declarations, and
 * print the inside.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class SNN_Block_Render {

	/**
	 * What the outermost query loop has printed so far: its style rules (by class name) and its IDs (with a count).
	 * Null outside a loop. A loop repeats the same blocks for each post, so a rule is printed once (its class name
	 * is the hash of its text) and a repeated ID gets a number (card, card-2, card-3). It lives only while the loop
	 * renders, so a block rendered on its own (the post content tag, the MCP post content) keeps its own styles.
	 */
	private static $loop_printed = null;

	/** The render callback of every block (see SNN_Blocks::register()). */
	public static function render( $attributes, $content, $block ) {
		$a   = SNN_Blocks::clean( $attributes, $block->name );
		$ctx = is_array( $block->context ) ? $block->context : array();

		if ( empty( $a['query']['enabled'] ) ) {
			// The conditions are checked for a block outside a loop here, and for each loop item below.
			if ( ! SNN_Block_Tools::passes( $a['conditions'], self::dynamic_context( $ctx ) ) ) {
				return '';
			}
			return self::element( $a, $block->name, $ctx, self::inner( $block, $a, $ctx ) );
		}

		// The query loop: the element, with its children, once for each post.
		$found = SNN_Query_Loop::posts( $a['query'], self::dynamic_context( $ctx ) );
		return implode( '', self::in_loop(
			function () use ( $a, $block, $ctx, $found ) {
				return self::loop_items( $a, $block, $ctx, $found );
			}
		) );
	}

	/**
	 * Runs a callback as a loop: the outermost loop owns the record of what is printed, and a loop inside it adds to
	 * the same record.
	 */
	public static function in_loop( callable $callback ) {
		$owner = null === self::$loop_printed;
		if ( $owner ) {
			self::$loop_printed = array(
				'styles' => array(),
				'ids'    => array(),
			);
		}
		try {
			return $callback();
		} finally {
			if ( $owner ) {
				self::$loop_printed = null;
			}
		}
	}

	/**
	 * The loop's element, with its children, once for each post found: one HTML string per post (empty when the
	 * post fails the conditions). $limit stops after that many posts (0: all of them); the editor's preview uses it.
	 */
	public static function loop_items( array $a, $block, array $ctx, array $found, $limit = 0 ) {
		$items = array();
		foreach ( $found['posts'] as $index => $post ) {
			if ( $limit && $index >= $limit ) {
				break;
			}
			$loop_ctx = array_merge(
				$ctx,
				array(
					SNN_Blocks::CONTEXT_POST  => $post->ID,
					SNN_Blocks::CONTEXT_INDEX => $index,
					SNN_Blocks::CONTEXT_COUNT => $found['found'],
				)
			);
			$items[] = (string) SNN_Dynamic_Data::with_post(
				$post,
				function () use ( $a, $block, $loop_ctx ) {
					if ( ! SNN_Block_Tools::passes( $a['conditions'], self::dynamic_context( $loop_ctx ) ) ) {
						return '';
					}
					return self::element( $a, $block->name, $loop_ctx, self::inner( $block, $a, $loop_ctx ) );
				}
			);
		}
		return $items;
	}

	/** The inner blocks, rendered with the given context (the loop's post, index and count). */
	private static function children( $block, array $ctx ) {
		$html = '';
		foreach ( $block->inner_blocks as $inner ) {
			$html .= ( new WP_Block( $inner->parsed_block, $ctx ) )->render();
		}
		return $html;
	}

	/** What goes inside the element: what the block's class prints, or the inner blocks when it prints none (null). */
	private static function inner( $block, array $a, array $ctx ) {
		$html = call_user_func( array( SNN_Blocks::class_of( $block->name ), 'render' ), $a, self::dynamic_context( $ctx ) );
		return null === $html ? self::children( $block, $ctx ) : (string) $html;
	}

	/** A style element, or nothing when the loop being rendered has printed the rule of this class already. */
	private static function loop_once( $class, $html ) {
		if ( null === self::$loop_printed ) {
			return $html;
		}
		if ( isset( self::$loop_printed['styles'][ $class ] ) ) {
			return '';
		}
		self::$loop_printed['styles'][ $class ] = true;
		return $html;
	}

	/** The ID as written, or with a number (-2, -3) when the loop being rendered has used it already. */
	private static function loop_id( $id ) {
		if ( '' === $id || null === self::$loop_printed ) {
			return $id;
		}
		$seen                             = self::$loop_printed['ids'][ $id ] ?? 0;
		self::$loop_printed['ids'][ $id ] = $seen + 1;
		return $seen ? $id . '-' . ( $seen + 1 ) : $id;
	}

	/** The element itself: tag, ID, classes and the style. */
	private static function element( array $a, $name, array $ctx, $inner ) {
		$dyn   = self::dynamic_context( $ctx );
		$def   = SNN_Blocks::definition( $name );
		$class = $def['class'];

		if ( call_user_func( array( $class, 'bare' ), $a ) ) {
			return $inner;
		}
		// What the block's class changes on the element: the tag (a for a link), attributes and declarations.
		$own = (array) call_user_func( array( $class, 'element' ), $a, $dyn ) + array(
			'tag'   => $a['tagName'],
			'attrs' => array(),
			'style' => array(),
		);
		// The a tag of a block that can be a link (Div, Container): a link with its settings, or a div when there is
		// no URL (an a without href is not a link).
		if ( 'a' === $a['tagName'] && $def['supports']['link'] ) {
			$link         = SNN_Block_Link::element_attrs( $a, $dyn );
			$own['tag']   = $link ? 'a' : 'div';
			$own['attrs'] = $link ? $link : array();
		}

		// The block's files: its look, and its front-end script when this block uses it.
		$folder = $def['folder'];
		if ( wp_style_is( SNN_Blocks::handle( $folder ), 'registered' ) ) {
			wp_enqueue_style( SNN_Blocks::handle( $folder ) );
		}
		if ( wp_script_is( SNN_Blocks::handle( $folder, true ), 'registered' ) && call_user_func( array( $class, 'uses_front' ), $a ) ) {
			wp_enqueue_script( SNN_Blocks::handle( $folder, true ) );
		}

		$id     = self::loop_id( preg_replace( '/[^A-Za-z0-9_-]/', '', SNN_Dynamic_Data::render( $a['htmlId'], $dyn, 'plain' ) ) );
		$custom = array_filter( array_map( 'sanitize_html_class', preg_split( '/\s+/', trim( SNN_Dynamic_Data::render( $a['cssClasses'], $dyn, 'plain' ) ) ) ) );
		$style  = SNN_Style::style( $a, $dyn );
		// The class's own declarations come first, so the Style groups win where both set a property.
		if ( $own['style'] ) {
			$style = implode( ';', array_filter( $own['style'] ) ) . ( '' !== $style ? ';' . $style : '' );
		}

		// The block's own class (wp-block-snn-section and so on) first, then the author's classes.
		$classes = array_merge( array( SNN_Blocks::block_class( $name ) ), $custom );

		// A view that sets its own values needs media rules, and an inline style would beat them. So the whole
		// style goes into a class rule, followed by the media rules. Without per-view values the style stays inline.
		$prefix = '';
		$views  = SNN_Style::view_rules( $a, $dyn );
		$before = implode( ';', SNN_Style_Props::overlay( $a ) );
		if ( '' !== $views || '' !== $before ) {
			$rule      = 'snn-r-' . substr( md5( $style . $views . $before ), 0, 10 );
			$classes[] = $rule;
			// The overlay is the block's ::before (Apply to: Overlay). Its rule sits beside the block's own rule.
			$overlay   = '' !== $before ? '.' . $rule . '::before{' . $before . '}' : '';
			$prefix    = self::loop_once( $rule, '<style>.' . $rule . '{' . $style . '}' . $overlay . str_replace( '%CLASS%', $rule, $views ) . '</style>' );
			$style     = '';
		}

		$extra = array(
			'class' => implode( ' ', $classes ),
		);
		if ( '' !== $id ) {
			$extra['id'] = $id;
		}
		// Custom CSS: %root% is the block. The block gets a class of its own, so the rule reaches only this block.
		$custom_css = SNN_Style::custom_css_text( $a['customCss'] );
		if ( '' !== $custom_css ) {
			$custom_class    = 'snn-c-' . substr( md5( $custom_css ), 0, 10 );
			$extra['class'] .= ' ' . $custom_class;
			$prefix         .= self::loop_once( $custom_class, '<style>' . SNN_Style::scope_css( $custom_css, '.' . $custom_class ) . '</style>' );
		}
		// The class's attributes (a link's href, target and rel) come before the custom ones, which may change them.
		// get_block_wrapper_attributes escapes them.
		foreach ( $own['attrs'] as $attr_name => $attr_value ) {
			$extra[ $attr_name ] = $attr_value;
		}
		foreach ( $a['customAttributes'] as $row ) {
			$extra[ $row['name'] ] = $row['value'];
		}

		// GSAP animations (the Animations icon): the presets and modifiers the block plays. Written only while the
		// GSAP setting is on; the runtime is loaded site-wide by that setting (assets/js/gsap-data-animate.js).
		$animation = SNN_Animation::enabled() ? SNN_Animation::block_data_animate( $a ) : '';
		if ( '' !== $animation ) {
			$extra['data-animate'] = $animation;
		}
		// The interactions travel on the element as JSON; the front end script (front/interactions.js) runs them.
		// Start animation runs the Web Animations API there, so it needs no GSAP.
		$interactions = SNN_Block_Tools::interactions_attribute( $a['interactions'] );
		if ( '' !== $interactions ) {
			$extra['data-snn-interactions'] = $interactions;
			SNN_Block_Tools::enqueue_front();
		}
		$attrs = get_block_wrapper_attributes( $extra );
		// The style is written here, not through the wrapper: WordPress passes inline styles through its
		// own list of CSS properties, which has no grid-auto-flow, so that declaration would be dropped.
		// Every value in $style has already been checked by SNN_Style::style().
		if ( '' !== $style ) {
			$attrs .= ' style="' . esc_attr( $style ) . '"';
		}

		$tag = $own['tag'];
		return $prefix . '<' . $tag . ' ' . $attrs . '>' . $inner . '</' . $tag . '>';
	}

	/** The context the dynamic tags read: the loop's post, index and count. */
	public static function dynamic_context( array $ctx ) {
		return array(
			'post_id' => (int) ( $ctx[ SNN_Blocks::CONTEXT_POST ] ?? 0 ),
			'index'   => $ctx[ SNN_Blocks::CONTEXT_INDEX ] ?? null,
			'count'   => $ctx[ SNN_Blocks::CONTEXT_COUNT ] ?? null,
		);
	}
}
