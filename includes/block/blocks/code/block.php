<?php
/**
 * Code (snn/code): any HTML, CSS and JavaScript (SVG, embeds, forms, scripts), printed on the page as written, as the
 * Bricks code element without its PHP. The editor shows the HTML and the CSS; the JavaScript runs on the front end.
 *
 * The settings and the front end are code.php in this folder; the panel and the canvas are code-editor.js.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

return array(
	'name'   => 'snn/code',
	'title'  => __( 'Code', 'snn' ),
	'tag'    => 'div',
	'icon'   => 'editor-code',
	'layout' => array(
		'display'       => 'block',
		'flexDirection' => 'row',
	),
	'text'   => false,
	'kind'   => 'code',
);
