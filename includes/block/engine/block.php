<?php
/**
 * A block: what every block class in blocks/<folder>/block.php extends. A block overrides definition() and, when it
 * has settings or an inside of its own, the other methods. Section, Container and Div override definition() only.
 *
 * The class of a folder is named after it: blocks/button is SNN_Button_Block, blocks/post-title is
 * SNN_Post_Title_Block. The registry (registry.php) finds the folders, so a new block is a new folder and nothing else.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

abstract class SNN_Block {

	/**
	 * What the block is. Keys (all but name and title have a default, see SNN_Blocks::normalise()):
	 *
	 *   name      'snn/button'
	 *   title     the name in the inserter
	 *   tag       the HTML tag it starts with
	 *   tags      the tags the HTML tag field offers
	 *   icon      a dashicon name
	 *   category  the inserter's category
	 *   layout    the display and flexDirection it starts with
	 *   supports  children (inner blocks), loop (a query loop), link (the a tag with the Link group),
	 *             style (true for every Style group, or a list of group names), hover (the H button, default true)
	 *
	 * Nesting (each is optional; WordPress enforces them in the editor):
	 *   parent         the blocks this one may sit directly in, such as array( 'snn/tabs' ). Empty: anywhere.
	 *   ancestor       the blocks this one must sit somewhere inside. Empty: anywhere.
	 *   allowedBlocks  the blocks its children may be (a block with children). Null: any block.
	 *   template       the children a new block starts with: array( array( 'snn/text', array( 'content' => 'Hi' ) ), ... ),
	 *                  each item [ name, attributes, children ], as WordPress writes an inner blocks template.
	 *   templateLock   false, 'all', 'insert' or 'contentOnly', as WordPress takes it.
	 *
	 * Context (values a block hands to the blocks inside it, at any depth):
	 *   provides       context name => attribute name: array( 'snn/tabsId' => 'htmlId' ). Name it snn/<something>.
	 *   context        the context names this block reads (besides the loop's): array( 'snn/tabsId' ). The values are
	 *                  in $dyn['context'] in element() and render(), and in the context prop of the editor's parts.
	 *
	 * @return array
	 */
	abstract public static function definition();

	/** The block's own attributes, with their defaults: name => array( 'type' => ..., 'default' => ... ). */
	public static function attributes() {
		return array();
	}

	/**
	 * The block's own steps from an older shape to the current one: the raw attributes, written in version $from, in the
	 * current shape. The engine's steps have run already (engine/migrations.php). Safe to run on attributes already in the
	 * current shape. The editor's copy goes in the block's editor.js: snn.registerBlock( name, { migrate } ).
	 */
	public static function migrate( array $raw, $from ) {
		return $raw;
	}

	/** The block's own attributes, cleaned: the right type, allowed values, and the defaults for anything missing. */
	public static function clean( $raw ) {
		return array();
	}

	/**
	 * What the block changes on its element: 'tag' (the tag to print), 'attrs' (name => value) and 'style'
	 * (declarations, written before the Style groups' so those win). Any key may be left out.
	 *
	 * @param array $a   The cleaned attributes.
	 * @param array $dyn The context the dynamic tags read (post_id, index, count), and 'context': the block's context
	 *                   values (the names in its definition's context, from the blocks around it).
	 */
	public static function element( array $a, array $dyn ) {
		return array();
	}

	/** The HTML inside the element. Null means the inner blocks (a block with children). */
	public static function render( array $a, array $dyn ) {
		return null;
	}

	/** What the block's editor.js reads: any data, as window.snnBlockData.<folder>. Empty for none. */
	public static function editor_data() {
		return array();
	}

	/** True when this block needs its front.js on the page (the default: whenever it is printed). */
	public static function uses_front( array $a ) {
		return true;
	}

	/* ------------------------------------------------------------------
	 * Cleaning helpers for clean(): one way to read each kind of value, for every block.
	 * ---------------------------------------------------------------- */

	/** The value when it is one of the allowed strings, else the default. */
	protected static function pick( $value, array $allowed, $default ) {
		return is_string( $value ) && in_array( $value, $allowed, true ) ? $value : $default;
	}

	/** Any scalar as a string, kept as typed (a style-like value the property table reads later). '' for anything else. */
	protected static function str( $value ) {
		return is_scalar( $value ) ? (string) $value : '';
	}

	/** A plain text, sanitized, cut to $max characters (0: no limit). */
	protected static function text( $value, $max = 0 ) {
		$out = is_scalar( $value ) ? sanitize_text_field( (string) $value ) : '';
		return $max ? mb_substr( $out, 0, $max ) : $out;
	}

	/** A URL, cleaned with esc_url_raw, at most 2000 characters. */
	protected static function url( $value ) {
		return is_string( $value ) ? mb_substr( esc_url_raw( $value ), 0, 2000 ) : '';
	}

	/** A switch: true for true, 1, '1' and 'true'. */
	protected static function flag( $value ) {
		return true === $value || 1 === $value || '1' === $value || 'true' === $value;
	}

	/** True when the inside is printed with no element around it. */
	public static function bare( array $a ) {
		return false;
	}
}
