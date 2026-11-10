<?php
/**
 * Section (snn/section): the outer part of a page. It stacks its children, as Bricks sections do.
 *
 * The engine (../../engine) builds the block from this class. Settings that only this block has go in this folder.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class SNN_Section_Block extends SNN_Block {

	public static function definition() {
		return array(
			'name'     => 'snn/section',
			'title'    => __( 'Section', 'snn' ),
			'tag'      => 'section',
			'icon'     => 'editor-table',
			'order'    => 10,
			// The display and direction it starts with.
			'layout'   => array(
				'display'       => 'flex',
				'flexDirection' => 'column',
			),
			'supports' => array(
				'children' => true,
				'loop'     => true,
			),
		);
	}
}
