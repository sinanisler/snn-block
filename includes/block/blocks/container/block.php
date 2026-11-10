<?php
/**
 * Container (snn/container): the box inside a section that holds the content. It stacks its children.
 *
 * The engine (../../engine) builds the block from this class. Settings that only this block has go in this folder.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class SNN_Container_Block extends SNN_Block {

	public static function definition() {
		return array(
			'name'     => 'snn/container',
			'title'    => __( 'Container', 'snn' ),
			'tag'      => 'div',
			'icon'     => 'editor-expand',
			'order'    => 20,
			// The display and direction it starts with.
			'layout'   => array(
				'display'       => 'flex',
				'flexDirection' => 'column',
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
