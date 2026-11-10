<?php
/**
 * Page styles: the styles of one page or post, set in the Page styles tab of the global styles modal
 * (in the block editor). The fields are the site's own style fields (background, text colour, font,
 * base size, line height) and the CSS classes of the body. They apply to that page only: on its front
 * end page and in its block editor canvas. Bricks has the same idea in its page settings (General:
 * page background and the body CSS classes); see docs/research/page-styles-2026-11-07.md.
 *
 * How it works
 * - One post meta value, _snn_page_styles, holds the fields that are set. A field that is not set
 *   inherits the global styles. Every save is sanitised against the palette and the font list of
 *   the global styles (global-styles.php).
 * - Front end: one style element in the head of a single page, after the global styles. The body
 *   rules come from the page's fields; the base size also goes on html, as the global base size does.
 *   The body classes are added to the body (body_class).
 * - Editor: the same declarations as a style of the canvas (its :root is the canvas wrapper).
 * - REST: snn/v1/page-styles/{id}, GET and POST. Capability: edit_post for that post.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class SNN_Page_Styles {

	const META        = '_snn_page_styles';
	const REST_NS    = 'snn/v1';
	/** The style fields of the tab, in order. They are the site's own fields (see SNN_Block_Defaults). */
	const FIELDS      = array( 'color_background', 'color_text', 'font', 'base_size', 'line_height' );
	const MAX_CLASSES = 12;

	public static function init() {
		add_action( 'rest_api_init', array( __CLASS__, 'register_routes' ) );
		add_action( 'wp_head', array( __CLASS__, 'front_styles' ), 20 );
		add_filter( 'block_editor_settings_all', array( __CLASS__, 'editor_styles' ), 10, 2 );
		add_filter( 'body_class', array( __CLASS__, 'body_class' ) );
	}

	/* ------------------------------------------------------------------
	 * Values
	 * ---------------------------------------------------------------- */

	/** The values of a post: the fields that are set, sanitised. */
	public static function get( $post_id ) {
		$stored = $post_id > 0 ? get_post_meta( (int) $post_id, self::META, true ) : array();
		return self::sanitize( is_array( $stored ) ? $stored : array() );
	}

	/**
	 * Sanitise a set of values. A colour or font that is not in the global lists is dropped (the field
	 * inherits), and so is an unknown key. Empty fields are left out.
	 */
	public static function sanitize( $input ) {
		$input = is_array( $input ) ? $input : array();
		$global = SNN_Global_Styles::get_values();
		$refs   = array(
			'colors' => array_column( $global['colors'], 'slug' ),
			'fonts'  => array_merge( array( 'system' ), array_column( $global['fonts'], 'slug' ) ),
			'sizes'  => array(),
		);
		$fields = SNN_Block_Defaults::fields();
		$out    = array();
		foreach ( self::FIELDS as $name ) {
			$raw   = isset( $input[ $name ] ) && is_scalar( $input[ $name ] ) ? $input[ $name ] : '';
			$value = SNN_Block_Defaults::clean_value( $fields[ $name ]['type'], $raw, '', $refs );
			if ( '' !== $value ) {
				$out[ $name ] = $value;
			}
		}
		$classes = self::classes( $input['body_class'] ?? '' );
		if ( '' !== $classes ) {
			$out['body_class'] = $classes;
		}
		return $out;
	}

	/** Body class names: letters, digits, dashes and underscores, each once, at most MAX_CLASSES. */
	private static function classes( $value ) {
		$names = array();
		foreach ( preg_split( '/\s+/', trim( (string) $value ) ) as $name ) {
			$name = sanitize_html_class( $name );
			if ( '' !== $name && ! in_array( $name, $names, true ) ) {
				$names[] = $name;
			}
		}
		return implode( ' ', array_slice( $names, 0, self::MAX_CLASSES ) );
	}

	/** Save the values of a post. Empty values remove the meta. Returns what was stored. */
	public static function save( $post_id, $input ) {
		$clean = self::sanitize( $input );
		if ( $clean ) {
			update_post_meta( (int) $post_id, self::META, wp_slash( $clean ) );
		} else {
			delete_post_meta( (int) $post_id, self::META );
		}
		return $clean;
	}

	/* ------------------------------------------------------------------
	 * CSS
	 * ---------------------------------------------------------------- */

	/** The declarations of a set of values: colours, font, base size and line height. */
	public static function declarations( array $v ) {
		$out = array();
		if ( isset( $v['color_background'] ) ) {
			$out[] = 'background-color:var(--' . $v['color_background'] . ')';
		}
		if ( isset( $v['color_text'] ) ) {
			$out[] = 'color:var(--' . $v['color_text'] . ')';
		}
		if ( isset( $v['font'] ) ) {
			$out[] = 'font-family:' . self::font_stack( $v['font'] );
		}
		if ( isset( $v['base_size'] ) ) {
			$out[] = 'font-size:' . $v['base_size'];
		}
		if ( isset( $v['line_height'] ) ) {
			$out[] = 'line-height:' . $v['line_height'];
		}
		return implode( ';', $out );
	}

	/** The CSS font stack of a font slug: the system font, or an installed family with a generic fallback. */
	private static function font_stack( $slug ) {
		if ( 'system' !== $slug ) {
			foreach ( SNN_Global_Styles::get_values()['fonts'] as $font ) {
				if ( $font['slug'] === $slug ) {
					return '"' . $font['name'] . '", sans-serif';
				}
			}
		}
		return SNN_Block_Defaults::SYSTEM_FONT;
	}

	/* ------------------------------------------------------------------
	 * Front end and editor
	 * ---------------------------------------------------------------- */

	/** The front end: the page's rules in the head of a single page (after the global styles). */
	public static function front_styles() {
		if ( ! is_singular() ) {
			return;
		}
		$v    = self::get( get_queried_object_id() );
		$body = self::declarations( $v );
		if ( '' === $body ) {
			return;
		}
		$css = 'body{' . $body . '}';
		if ( isset( $v['base_size'] ) ) {
			$css = 'html{font-size:' . $v['base_size'] . '}' . $css;
		}
		echo '<style id="snn-page-styles">' . $css . "</style>\n"; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
	}

	/** The block editor: the page's declarations as a style of the canvas, for the post being edited. */
	public static function editor_styles( $settings, $context = null ) {
		$post = is_object( $context ) && isset( $context->post ) ? $context->post : null;
		if ( ! $post || ! is_array( $settings ) || ! isset( $settings['styles'] ) || ! is_array( $settings['styles'] ) ) {
			return $settings;
		}
		$declarations = self::declarations( self::get( (int) $post->ID ) );
		if ( '' !== $declarations ) {
			$settings['styles'][] = array(
				// The canvas is an iframe: its body is the wrapper, and :root alone only reaches the html element.
				'css'            => ':root body.editor-styles-wrapper{' . $declarations . '}',
				'__unstableType' => 'snn-page-styles',
				'isGlobalStyles' => false,
			);
		}
		return $settings;
	}

	/** The body classes of the page (the CSS classes field of the Page styles tab). */
	public static function body_class( $classes ) {
		if ( ! is_singular() ) {
			return $classes;
		}
		$v = self::get( get_queried_object_id() );
		if ( ! empty( $v['body_class'] ) ) {
			$classes = array_merge( (array) $classes, explode( ' ', $v['body_class'] ) );
		}
		return $classes;
	}

	/* ------------------------------------------------------------------
	 * REST
	 * ---------------------------------------------------------------- */

	public static function register_routes() {
		register_rest_route(
			self::REST_NS,
			'/page-styles/(?P<id>\d+)',
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( __CLASS__, 'rest_read' ),
					'permission_callback' => array( __CLASS__, 'can_edit' ),
				),
				array(
					'methods'             => WP_REST_Server::EDITABLE,
					'callback'            => array( __CLASS__, 'rest_save' ),
					'permission_callback' => array( __CLASS__, 'can_edit' ),
					'args'                => array(
						'values' => array( 'required' => true ),
					),
				),
			)
		);
	}

	public static function can_edit( WP_REST_Request $request ) {
		return current_user_can( 'edit_post', (int) $request['id'] );
	}

	public static function rest_read( WP_REST_Request $request ) {
		return rest_ensure_response( array( 'values' => (object) self::get( (int) $request['id'] ) ) );
	}

	public static function rest_save( WP_REST_Request $request ) {
		$input = $request->get_param( 'values' );
		$saved = self::save( (int) $request['id'], is_array( $input ) ? $input : array() );
		return rest_ensure_response( array( 'values' => (object) $saved ) );
	}

	/* ------------------------------------------------------------------
	 * The modal's tab (read by global-styles.js)
	 * ---------------------------------------------------------------- */

	/** The Page styles tab: the page's fields, with the same choices as the global fields. */
	public static function tab( array $weights ) {
		$items   = SNN_Global_Styles::field_items( 'page', self::FIELDS, $weights );
		$items[] = array(
			'path'  => 'page.body_class',
			'label' => __( 'CSS classes (body)', 'snn' ),
			'type'  => 'text',
		);
		return array(
			'id'     => 'page',
			'label'  => __( 'Page styles', 'snn' ),
			'page'   => true,
			'groups' => array(
				array(
					'title'  => __( 'This page', 'snn' ),
					'note'   => __( 'These styles apply to this page only. An empty field inherits the global styles.', 'snn' ),
					'fields' => $items,
				),
			),
		);
	}
}

SNN_Page_Styles::init();
