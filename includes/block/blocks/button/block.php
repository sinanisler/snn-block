<?php
/**
 * Button (snn/button): a button or a link, with a text and an optional icon, as the Bricks button element. With a
 * link URL the element is an a; without one it is the tag chosen (span, button or div).
 *
 * The shared engine (../../layout-blocks.php) draws the element with its Style groups. The settings and the front end
 * are button.php in this folder; the panel and the canvas are button-editor.js.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

return array(
	'name'   => 'snn/button',
	'title'  => __( 'Button', 'snn' ),
	'tag'    => 'span',
	'icon'   => 'button',
	// The text and the icon sit in a row, centred on each other.
	'layout' => array(
		'display'       => 'inline-flex',
		'flexDirection' => 'row',
	),
	'text'   => false,
	// Its settings and its inside come from its own class (button.php), as the Image block's do.
	'kind'   => 'button',
);
