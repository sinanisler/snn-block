<?php
/**
 * Blocks: everything that makes, styles or configures the blocks of this theme. New block work
 * goes in this folder (custom blocks, block controls, global styles, block defaults, fonts).
 *
 *   fonts.php            Google Fonts download and the font files (WordPress's font directory)
 *   editor-settings.php  Editor switches shared with the Block Editor Settings page (core blocks, top toolbar)
 *   block-defaults.php   The blocks and their default styles (the Global Styles and Block Styles tab)
 *   global-styles.php    Global styles: palette, fonts, sizes, shapes, block defaults; theme.json; REST
 *   dynamic-data.php     Dynamic tags ({post_title} and so on): the tags, the parser, the preview route
 *   query-loop.php       The query of a loop: its settings and the WP_Query arguments
 *   block-tools.php    Conditions (show when) and interactions (when X happens, do Y) of our blocks: the catalogs, checks and front end data
 *   layout-blocks.php    Our blocks: Section, Container, Div and Text (rendering, attributes, editor assets)
 *   assets/              The modal's script and stylesheet, the editor button, the block controls, the block tools and the interactions script
 *
 * Loaded from functions.php. Always on.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

require_once __DIR__ . '/fonts.php';
require_once __DIR__ . '/editor-settings.php';
require_once __DIR__ . '/block-defaults.php';
require_once __DIR__ . '/global-styles.php';
require_once __DIR__ . '/dynamic-data.php';
require_once __DIR__ . '/query-loop.php';
require_once __DIR__ . '/style-props.php';
require_once __DIR__ . '/animation.php';
require_once __DIR__ . '/block-tools.php';
require_once __DIR__ . '/layout-blocks.php';
