<?php
/**
 * Icon (snn/icon): one icon from a library (Font Awesome, Ionicons, Themify) or an SVG, with its colour, size and an
 * optional link, as the Bricks icon element. The picker is shared with the Button block (../../controls/icon-picker.js).
 *
 * The settings and the front end are icon.php in this folder; the panel and the canvas are icon-editor.js.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

return array(
	'name'   => 'snn/icon',
	'title'  => __( 'Icon', 'snn' ),
	'tag'    => 'span',
	'icon'   => 'star-filled',
	'layout' => array(
		'display'       => 'inline-flex',
		'flexDirection' => 'row',
	),
	'text'   => false,
	'kind'   => 'icon',
);
