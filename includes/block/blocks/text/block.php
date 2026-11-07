<?php
/**
 * Text (snn/text): one element whose content is a rich text, with no inner blocks. The tags it offers are the text
 * tags (TEXT_TAGS in ../../layout-blocks.php).
 *
 * The shared engine (../../layout-blocks.php) builds the block from this definition, and the editor script
 * (../../assets/layout-blocks.js) reads the same definition. Settings that only Text has go in this folder.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

return array(
	'name'   => 'snn/text',
	'title'  => __( 'Text', 'snn' ),
	'tag'    => 'p',
	'icon'   => 'editor-paragraph',
	// The display and direction it starts with: a plain block.
	'layout' => array(
		'display'       => 'block',
		'flexDirection' => 'row',
	),
	// Its content is a rich text: the Text block's own flag.
	'text'   => true,
);
