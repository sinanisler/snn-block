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
	 *             style (true for every Style group, or a list of group names)
	 *
	 * @return array
	 */
	abstract public static function definition();

	/** The block's own attributes, with their defaults: name => array( 'type' => ..., 'default' => ... ). */
	public static function attributes() {
		return array();
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
	 * @param array $dyn The context the dynamic tags read (post_id, index, count).
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

	/** True when the inside is printed with no element around it. */
	public static function bare( array $a ) {
		return false;
	}
}
