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

	const DISPLAYS       = array( 'block', 'flex', 'grid' );
	const FLEX_DIRECTION = array( 'row', 'row-reverse', 'column', 'column-reverse' );
	const FLEX_WRAP      = array( 'nowrap', 'wrap', 'wrap-reverse' );
	const JUSTIFY        = array( 'flex-start', 'center', 'flex-end', 'space-between', 'space-around', 'space-evenly' );
	const ALIGN          = array( 'stretch', 'flex-start', 'center', 'flex-end', 'baseline' );

	public static function init() {
		add_action( 'init', array( __CLASS__, 'register' ) );
		add_action( 'enqueue_block_editor_assets', array( __CLASS__, 'enqueue_editor' ) );
	}

	public static function register() {
		foreach ( self::BLOCKS as $name => $tag ) {
			register_block_type(
				$name,
				array(
					'attributes'      => self::attributes( $tag ),
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
	public static function attributes( $default_tag ) {
		return array(
			'tagName'        => array( 'type' => 'string', 'default' => $default_tag ),
			'htmlId'         => array( 'type' => 'string', 'default' => '' ),
			'cssClasses'     => array( 'type' => 'string', 'default' => '' ),
			'display'        => array( 'type' => 'string', 'default' => 'block' ),
			'flexDirection'  => array( 'type' => 'string', 'default' => 'row' ),
			'flexWrap'       => array( 'type' => 'string', 'default' => 'nowrap' ),
			'justifyContent' => array( 'type' => 'string', 'default' => '' ),
			'alignItems'     => array( 'type' => 'string', 'default' => '' ),
			'gap'            => array( 'type' => 'string', 'default' => '' ),
			'query'          => array( 'type' => 'object', 'default' => SNN_Query_Loop::defaults() ),
		);
	}

	/* ------------------------------------------------------------------
	 * Rendering
	 * ---------------------------------------------------------------- */

	public static function render( $attributes, $content, $block ) {
		$a   = self::clean( $attributes, $block->name );
		$ctx = is_array( $block->context ) ? $block->context : array();

		if ( empty( $a['query']['enabled'] ) ) {
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

		$extra = array(
			'class' => implode( ' ', $classes ),
		);
		if ( '' !== $id ) {
			$extra['id'] = $id;
		}
		if ( '' !== $style ) {
			$extra['style'] = $style;
		}
		$attrs = get_block_wrapper_attributes( $extra );

		return '<' . $a['tagName'] . ' ' . $attrs . '>' . $inner . '</' . $a['tagName'] . '>';
	}

	/**
	 * The inline layout style. Block display needs none, so it adds nothing and the theme's
	 * own rules apply. Flex and grid add their display, and flex adds its settings. Gap applies
	 * to flex and grid only.
	 */
	public static function style( array $a, array $dyn = array() ) {
		$css = array();
		if ( 'flex' === $a['display'] ) {
			$css[] = 'display:flex';
			$css[] = 'flex-direction:' . self::pick( $a['flexDirection'], self::FLEX_DIRECTION, 'row' );
			$css[] = 'flex-wrap:' . self::pick( $a['flexWrap'], self::FLEX_WRAP, 'nowrap' );
			$justify = self::pick( $a['justifyContent'], self::JUSTIFY, '' );
			if ( '' !== $justify ) {
				$css[] = 'justify-content:' . $justify;
			}
			$align = self::pick( $a['alignItems'], self::ALIGN, '' );
			if ( '' !== $align ) {
				$css[] = 'align-items:' . $align;
			}
		} elseif ( 'grid' === $a['display'] ) {
			$css[] = 'display:grid';
		}
		if ( in_array( $a['display'], array( 'flex', 'grid' ), true ) ) {
			$gap = self::gap( SNN_Dynamic_Data::render( $a['gap'], $dyn, 'plain' ) );
			if ( '' !== $gap ) {
				$css[] = 'gap:' . $gap;
			}
		}
		return implode( ';', $css );
	}

	/**
	 * A gap is a length (16px, 1rem, 0) or a spacing variable (var(--wp--preset--spacing--m)).
	 * Anything else is dropped, so a value cannot write other CSS.
	 */
	public static function gap( $value ) {
		$value = trim( (string) $value );
		if ( preg_match( '/^(var\(--wp--preset--spacing--[a-z0-9-]+\)|-?(\d+|\d*\.\d+)(px|rem|em|%|vw|vh)|0)$/', $value ) ) {
			return $value;
		}
		return '';
	}

	/* ------------------------------------------------------------------
	 * Attributes
	 * ---------------------------------------------------------------- */

	/** The attributes, cleaned: right type, allowed values, defaults for anything missing. */
	public static function clean( $attributes, $name ) {
		$attributes = is_array( $attributes ) ? $attributes : array();
		$default    = self::BLOCKS[ $name ] ?? 'div';
		$defaults   = self::attributes( $default );

		$out = array();
		foreach ( $defaults as $key => $spec ) {
			$out[ $key ] = $attributes[ $key ] ?? $spec['default'];
		}

		$out['tagName']        = in_array( $out['tagName'], self::TAGS, true ) ? $out['tagName'] : $default;
		$out['display']        = self::pick( $out['display'], self::DISPLAYS, 'block' );
		$out['flexDirection']  = self::pick( $out['flexDirection'], self::FLEX_DIRECTION, 'row' );
		$out['flexWrap']       = self::pick( $out['flexWrap'], self::FLEX_WRAP, 'nowrap' );
		$out['justifyContent'] = self::pick( $out['justifyContent'], self::JUSTIFY, '' );
		$out['alignItems']     = self::pick( $out['alignItems'], self::ALIGN, '' );
		foreach ( array( 'htmlId', 'cssClasses', 'gap' ) as $key ) {
			$out[ $key ] = is_scalar( $out[ $key ] ) ? (string) $out[ $key ] : '';
		}
		$out['query'] = SNN_Query_Loop::sanitize( $out['query'] );
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

	/** Spacing variables for the Gap field: the spacing sizes of the theme, from Global Styles. */
	public static function variables() {
		$groups = array();
		$sets   = array(
			'spacing' => array( __( 'Spacing', 'snn' ), array( 'spacing', 'spacingSizes' ), 'spacing--%s' ),
		);
		foreach ( $sets as $key => $set ) {
			list( $label, $path, $format ) = $set;
			$items = array();
			$list  = wp_get_global_settings( $path );
			if ( is_array( $list ) && isset( $list['theme'] ) && is_array( $list['theme'] ) ) {
				$list = $list['theme'];
			}
			foreach ( is_array( $list ) ? $list : array() as $entry ) {
				if ( empty( $entry['slug'] ) ) {
					continue;
				}
				$items[] = array(
					'label' => $entry['name'] ?? $entry['slug'],
					'value' => 'var(--wp--preset--' . sprintf( $format, $entry['slug'] ) . ')',
				);
			}
			if ( $items ) {
				$groups[] = array(
					'key'   => $key,
					'label' => $label,
					'items' => $items,
				);
			}
		}
		return $groups;
	}

	public static function enqueue_editor() {
		if ( ! current_user_can( 'edit_posts' ) ) {
			return;
		}
		$css    = 'includes/blocks/assets/controls.css';
		$js     = 'includes/blocks/assets/controls.js';
		$blocks = 'includes/blocks/assets/layout-blocks.js';

		wp_enqueue_style( 'snn-controls', SNN_URL . $css, array(), self::version( $css ) );
		wp_enqueue_script( 'snn-controls', SNN_URL . $js, array( 'wp-element', 'wp-api-fetch', 'wp-i18n', 'wp-data' ), self::version( $js ), true );
		wp_localize_script(
			'snn-controls',
			'snnControlsData',
			array(
				'dynamic'   => SNN_Dynamic_Data::for_editor(),
				'variables' => self::variables(),
				'postTypes' => SNN_Query_Loop::post_type_options(),
				'orderBy'   => SNN_Query_Loop::order_by_options(),
				'tags'      => self::TAGS,
			)
		);
		wp_enqueue_script( 'snn-layout-blocks', SNN_URL . $blocks, array( 'wp-blocks', 'wp-element', 'wp-block-editor', 'wp-i18n', 'snn-controls' ), self::version( $blocks ), true );
	}

	private static function version( $file ) {
		return file_exists( SNN_PATH . $file ) ? (string) filemtime( SNN_PATH . $file ) : '1';
	}
}

SNN_Layout_Blocks::init();
