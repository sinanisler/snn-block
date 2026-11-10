<?php
/**
 * The style sheet of a page: the style rules of the blocks on it, printed once in the footer.
 *
 * A block's style is one rule of a class of its own (snn-s-<hash>, see SNN_Block_Render::element()). The rule's name is a
 * hash of its text, so every block with the same style shares one rule: a query loop prints its rule once, and the
 * declarations are not repeated in the HTML of each element. While the page renders, the rules are kept; the footer
 * prints them as one style element (print_sheet()).
 *
 * A render that is not a page cannot wait for the footer: a REST answer (the editor's loop preview), an AJAX answer, a
 * feed, a render outside the front end (a command-line run), or a render after the footer. Its rules go in a style
 * element before the block (add()).
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class SNN_Style_Sheet {

	/** The rules kept for the footer: class => CSS text. */
	private static $rules = array();

	/** True once the sheet is printed. A rule added after that is printed where it is used (see add()). */
	private static $printed = false;

	public static function init() {
		add_action( 'wp_footer', array( __CLASS__, 'print_sheet' ), 1 );
		// A theme that prints no footer still gets its rules: the sheet goes at the end of the page then.
		add_action( 'shutdown', array( __CLASS__, 'print_leftover' ) );
	}

	/**
	 * Whether a render now is part of a front-end page that prints the footer after it. The page starts at
	 * template_redirect, which runs before any template renders, in classic and block themes alike (a block theme prints
	 * its post content before wp_head has run, so the head is no marker). Feeds, AJAX, REST, XML-RPC and the admin are not pages.
	 */
	public static function in_page() {
		if ( self::$printed || is_admin() || is_feed() || wp_doing_ajax() || wp_is_json_request() ) {
			return false;
		}
		if ( ( defined( 'REST_REQUEST' ) && REST_REQUEST ) || ( defined( 'XMLRPC_REQUEST' ) && XMLRPC_REQUEST ) ) {
			return false;
		}
		return did_action( 'template_redirect' ) > 0;
	}

	/**
	 * The rule for a class. In a page the rule is kept for the footer and the return value is ''. Elsewhere the rule is
	 * returned as a style element, to print before the block. '' for an empty rule.
	 */
	public static function add( $class, $css ) {
		if ( '' === $css ) {
			return '';
		}
		if ( self::in_page() ) {
			self::$rules[ $class ] = $css;
			return '';
		}
		return '<style>' . $css . '</style>';
	}

	/** Prints the kept rules as one style element. Called in the footer, once. */
	public static function print_sheet() {
		if ( self::$printed ) {
			return;
		}
		self::$printed = true;
		if ( ! self::$rules ) {
			return;
		}
		echo "<style id=\"snn-styles\">\n" . implode( "\n", self::$rules ) . "\n</style>\n"; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- CSS made by the engine (see SNN_Style).
		self::$rules = array();
	}

	/** At the end of the request, for a page whose footer was never printed. */
	public static function print_leftover() {
		if ( ! self::$printed && self::$rules ) {
			self::print_sheet();
		}
	}

	/** The rules kept so far (for the tests). */
	public static function pending() {
		return self::$rules;
	}
}
