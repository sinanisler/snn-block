<?php
/**
 * Div (snn/div): a plain block element with no defaults. Its display starts as block, so no flex until it is chosen.
 *
 * The engine (../../engine) builds the block from this class. Settings that only this block has go in this folder.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class SNN_Div_Block extends SNN_Block {

	public static function definition() {
		return array(
			'name'     => 'snn/div',
			'title'    => __( 'Div', 'snn' ),
			'tag'      => 'div',
			'icon'     => 'editor-code',
			'order'    => 30,
			// The display and direction it starts with.
			'layout'   => array(
				'display'       => 'block',
				'flexDirection' => 'row',
			),
			'supports' => array(
				'children' => true,
				'loop'     => true,
				// It can be a link: the a tag, with the Link group (a whole card as one link). Without a URL it is a div.
				'link'     => true,
			),
		);
	}
}
