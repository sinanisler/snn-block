<?php
/**
 * Image (snn/image): one picture, with its own panel (Image and Link to, as the Bricks image element has them). It has
 * no inner blocks and no rich text: the picture is set in the panel, and image.php in this folder draws it.
 *
 * The shared engine (../../layout-blocks.php) builds the block from this definition, and the editor script
 * (../../assets/layout-blocks.js) reads the same definition. Settings that only Image has go in this folder.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

return array(
	'name'   => 'snn/image',
	'title'  => __( 'Image', 'snn' ),
	'tag'    => 'figure',
	'icon'   => 'format-image',
	// The display and direction it starts with: a plain block, as the figure is.
	'layout' => array(
		'display'       => 'block',
		'flexDirection' => 'row',
	),
	// Its content is inner blocks, not a rich text: it has neither.
	'text'   => false,
	// Its picture comes from its own settings (image.php), so the engine draws it from those.
	'image'  => true,
);
