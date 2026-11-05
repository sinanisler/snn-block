<?php
/**
 * Blocks: everything that makes, styles or configures the blocks of this theme. New block work
 * goes in this folder (custom blocks, block controls, global styles, block defaults, fonts).
 *
 *   fonts.php           Google Fonts download and the font files (WordPress's font directory)
 *   block-defaults.php  The blocks and their default styles (the Blocks tab of the global styles)
 *   global-styles.php   Global styles: palette, fonts, sizes, widths, shapes; theme.json; REST
 *   assets/             The modal's script and stylesheet, and the editor button
 *
 * Loaded from functions.php. Always on.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

require_once __DIR__ . '/fonts.php';
require_once __DIR__ . '/block-defaults.php';
require_once __DIR__ . '/global-styles.php';
