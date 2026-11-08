<?php
/**
 * Block: everything that makes, styles or configures the blocks of this theme. New block work
 * goes in this folder or in one of its subfolders (custom blocks, block controls, global styles,
 * block defaults, fonts).
 *
 *   utilities/           PHP helpers and libraries: fonts, style property checks, animation presets, icons
 *   controls/            Shared controls for every block panel: controls.js and .css, tooltips, block tools
 *   assets/              Scripts, stylesheets and icons: the global styles modal, the layout blocks editor script, layout icons, interactions
 *   editor-settings.php  Editor switches shared with the Block Editor Settings page (core blocks, top toolbar)
 *   editor-list-view.php The width of the List View panel in the block editor
 *   block-defaults.php   The blocks and their default styles (the Global Styles and Block Styles tab)
 *   global-styles.php    Global styles: palette, fonts, sizes, block defaults; theme.json; REST
 *   page-styles.php      Page styles: one page's background, text colour, font, size, line height and body classes
 *   dynamic-data.php     Dynamic tags ({post_title} and so on): the tags, the parser, the preview route
 *   query-loop.php       The query of a loop: its settings and the WP_Query arguments
 *   block-tools.php    Conditions (show when) and interactions (when X happens, do Y) of our blocks: the catalogs, checks and front end data
 *   layout-blocks.php    Our blocks: Section, Container, Div, Text, Image, Button, Icon and Code (rendering, attributes, editor assets)
 *
 * Loaded from functions.php. Always on.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

require_once __DIR__ . '/utilities/fonts.php';
require_once __DIR__ . '/editor-settings.php';
require_once __DIR__ . '/editor-list-view.php';
require_once __DIR__ . '/block-defaults.php';
require_once __DIR__ . '/global-styles.php';
require_once __DIR__ . '/page-styles.php';
require_once __DIR__ . '/dynamic-data.php';
require_once __DIR__ . '/query-loop.php';
require_once __DIR__ . '/utilities/style-props.php';
require_once __DIR__ . '/animation.php';
require_once __DIR__ . '/block-tools.php';
require_once __DIR__ . '/blocks/image/image.php';
require_once __DIR__ . '/blocks/image/image-search.php';
require_once __DIR__ . '/utilities/icons.php';
require_once __DIR__ . '/utilities/links.php';
require_once __DIR__ . '/blocks/button/button.php';
require_once __DIR__ . '/blocks/icon/icon.php';
require_once __DIR__ . '/blocks/code/code.php';
require_once __DIR__ . '/layout-blocks.php';
