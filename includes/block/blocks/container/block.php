<?php
/**
 * Container (snn/container): a box inside a section. A flex column by default, with a div.
 *
 * The shared engine (../../layout-blocks.php) builds the block from this definition, and the editor script
 * (../../assets/layout-blocks.js) reads the same definition. Settings that only Container has go in this folder.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

return array(
	'name'   => 'snn/container',
	'title'  => __( 'Container', 'snn' ),
	'tag'    => 'div',
	'icon'   => 'editor-expand',
	// The display and direction it starts with. Container stacks its children, as Bricks containers do.
	'layout' => array(
		'display'       => 'flex',
		'flexDirection' => 'column',
	),
	// Its content is inner blocks, not a rich text.
	'text'   => false,
);
