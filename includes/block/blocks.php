<?php
/**
 * Block: everything that makes, styles or configures the blocks of this theme. All block work goes in this folder.
 *
 *   engine/     The engine every block runs on: the registry (finds the blocks), rendering, the style rules and
 *               their checks, the editor's scripts, the loop preview route
 *   blocks/     One folder per block: block.php (its class), editor.js, style.css, and when needed front.js and
 *               editor.css. A new block is a new folder; nothing else lists it (see engine/registry.php)
 *   features/   What the blocks use and the editor offers: dynamic data, the query loop, conditions and
 *               interactions, animations, icons, links, fonts, global styles, page styles, editor settings
 *   controls/   The shared controls of every block panel
 *   editor/     The editor's own scripts: the panel, the block registration, the global styles screen
 *   front/      Scripts for visitors that no single block owns (interactions)
 *   icons/      The icon libraries
 *
 * Loaded from functions.php. Always on.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

// Features: each is on its own, so the order only follows what a file uses at load time.
foreach ( array( 'fonts', 'editor-settings', 'editor-list-view', 'block-defaults', 'global-styles', 'page-styles', 'page-title', 'dynamic-data', 'query-loop', 'animation', 'block-tools', 'image-search', 'icons', 'links' ) as $snn_feature ) {
	require_once __DIR__ . '/features/' . $snn_feature . '.php';
}
unset( $snn_feature );

// The engine. The registry loads every blocks/<folder>/block.php.
require_once __DIR__ . '/engine/style-props.php';
require_once __DIR__ . '/engine/style.php';
require_once __DIR__ . '/engine/block.php';
require_once __DIR__ . '/engine/registry.php';
require_once __DIR__ . '/engine/render.php';
require_once __DIR__ . '/engine/rest-preview.php';
require_once __DIR__ . '/engine/editor-assets.php';

SNN_Blocks::init();
SNN_Block_Preview::init();
SNN_Block_Editor_Assets::init();
