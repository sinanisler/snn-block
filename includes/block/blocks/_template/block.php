<?php
/**
 * TEMPLATE for a new block. Copy this folder to blocks/<name>/ (no underscore), rename the class to
 * SNN_<Name>_Block (a folder named my-card is SNN_My_Card_Block), and change the definition.
 *
 * The folder starts with an underscore, so the registry skips it: this template is never registered.
 *
 * The files of a block folder, by fixed name:
 *   block.php   this class (definition, attributes, clean, element, render)
 *   editor.js   the editor side: its Content tab (Pane) and its canvas (Canvas). Never loaded for visitors.
 *   style.css   the look, on the front end and on the editor's canvas
 *   front.js    optional: front-end behaviour, only when uses_front() returns true
 *   editor.css  optional: editor-only styling
 *
 * Settings only this block has go in attributes(), read in clean(), and are printed in render() (the inside) or
 * element() (the tag, attributes and declarations of the element around it).
 *
 * A setting that is a style value (a size, a colour, an object fit) is not an own attribute: use the property table's
 * key (engine/style-props.php), so the engine cleans it per view and per hover state. The registry ignores an own
 * attribute named like a shared or style one (SNN_Blocks::reserved_keys()). In clean(), use the shared helpers of
 * SNN_Block: self::pick(), self::str(), self::text(), self::url(), self::flag().
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class SNN_Template_Block extends SNN_Block {

	/** The HTML tags the block's tag field offers. */
	const TAGS = array( 'div', 'section', 'span' );

	public static function definition() {
		return array(
			'name'     => 'snn/template',           // the block name: snn/<folder>
			'title'    => __( 'Template', 'snn' ),  // the name in the inserter
			'tag'      => 'div',                    // the tag it starts with
			'tags'     => self::TAGS,
			'icon'     => 'editor-code',            // a dashicon name
			'order'    => 900,                      // the order in the inserter (lower first)
			'kind'     => '',                       // a kind editor (button, icon, code), or '' for none
			'layout'   => array(
				'display'       => 'block',
				'flexDirection' => 'row',
			),
			'supports' => array(
				'children' => false,               // true: the block holds inner blocks
				'loop'     => false,               // true: the panel offers the Query group
				'link'     => false,               // true: the element can be an a with a URL (the Link group)
				'hover'    => true,                // false: no H button (no hover state for the Style values)
			),
		);
	}

	/** The block's own settings, with their defaults. */
	public static function attributes() {
		return array(
			'exampleText' => array( 'type' => 'string', 'default' => '' ),
		);
	}

	/** The block's own settings, cleaned: the right type and the allowed values. */
	public static function clean( $raw ) {
		$raw = is_array( $raw ) ? $raw : array();
		return array(
			'exampleText' => is_string( $raw['exampleText'] ?? null ) ? sanitize_text_field( $raw['exampleText'] ) : '',
		);
	}

	/**
	 * The inside of the element. Return null for inner blocks (with supports.children), or the HTML string.
	 * Use SNN_Dynamic_Data::render() for any text a user types, so {post_title} and the other tags work.
	 */
	public static function render( array $a, array $dyn ) {
		if ( '' === $a['exampleText'] ) {
			return '';
		}
		return esc_html( SNN_Dynamic_Data::render( $a['exampleText'], $dyn, 'plain' ) );
	}
}
