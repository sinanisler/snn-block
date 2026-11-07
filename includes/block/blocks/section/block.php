<?php
/**
 * Section (snn/section): a section of the page. A flex column by default, with the section tag.
 *
 * The shared engine (../../layout-blocks.php) builds the block from this definition, and the editor script
 * (../../assets/layout-blocks.js) reads the same definition. Settings that only Section has go in this folder.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

return array(
	'name'   => 'snn/section',
	'title'  => __( 'Section', 'snn' ),
	'tag'    => 'section',
	'icon'   => 'editor-table',
	// The display and direction it starts with. Section stacks its children, as Bricks sections do.
	'layout' => array(
		'display'       => 'flex',
		'flexDirection' => 'column',
	),
	// Its content is inner blocks, not a rich text.
	'text'   => false,
);
