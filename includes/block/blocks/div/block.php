<?php
/**
 * Div (snn/div): a plain block element with no defaults. Its display starts as block, so no flex until it is chosen.
 *
 * The shared engine (../../layout-blocks.php) builds the block from this definition, and the editor script
 * (../../assets/layout-blocks.js) reads the same definition. Settings that only Div has go in this folder.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

return array(
	'name'   => 'snn/div',
	'title'  => __( 'Div', 'snn' ),
	'tag'    => 'div',
	'icon'   => 'editor-code',
	// The display and direction it starts with: a plain block.
	'layout' => array(
		'display'       => 'block',
		'flexDirection' => 'row',
	),
	// Its content is inner blocks, not a rich text.
	'text'   => false,
);
