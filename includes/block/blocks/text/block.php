<?php
/**
 * Text (snn/text): one element whose content is a rich text, with no inner blocks: a paragraph, a heading, a div or
 * a span. The editor side is editor.js in this folder (the rich text and its toolbar).
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class SNN_Text_Block extends SNN_Block {

	/** The tags a Text block offers: paragraphs and headings, a div and a span. */
	const TAGS = array( 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'div', 'span' );

	public static function definition() {
		return array(
			'name'  => 'snn/text',
			'title' => __( 'Text', 'snn' ),
			'tag'   => 'p',
			'tags'  => self::TAGS,
			'icon'  => 'editor-paragraph',
			'order' => 40,
		);
	}

	public static function attributes() {
		return array(
			'content' => array( 'type' => 'string', 'default' => '' ),
		);
	}

	public static function clean( $raw ) {
		return array(
			'content' => is_array( $raw ) && is_string( $raw['content'] ?? null ) ? $raw['content'] : '',
		);
	}

	/**
	 * The text: the rich text the editor saved, with only the formats wp_kses_post allows (bold, italic, links and so
	 * on). Tags such as {post_title} are filled in when the page is shown (dynamic-data.php, html mode).
	 */
	public static function render( array $a, array $dyn ) {
		return wp_kses_post( SNN_Dynamic_Data::render( $a['content'], $dyn, 'html' ) );
	}
}
