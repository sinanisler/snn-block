<?php
/**
 * Parity test, PHP side: writes the style table and a set of attribute cases with the PHP's own declarations. The
 * JavaScript side (style-parity.js) runs the editor's copy on the same cases and compares the two.
 *
 * Run (WordPress at SNN_WP_LOAD, the cases file at argv[1]):
 *   php includes/block/tests/style-parity.php cases.json
 *   node includes/block/tests/style-parity.js cases.json
 *
 * The cases are reproducible (a fixed seed), and they cover the layout settings, the item settings, the views and the
 * Style properties. Values that the table rejects are in the cases on purpose: the two sides must reject them alike.
 */

$wp_load = getenv( 'SNN_WP_LOAD' ) ?: 'D:\\WWW\\LOCAL_SITES\\blocks.local\\wp-load.php';
$_SERVER['HTTP_HOST']   = 'blocks.local';
$_SERVER['SERVER_NAME'] = 'blocks.local';
$_SERVER['REQUEST_URI'] = '/';
require $wp_load;

$out_file = $argv[1] ?? 'style-cases.json';

// The values each attribute is given (style-pool.php): real ones, ones the table rejects, and the edges of each type.
$pool = require __DIR__ . '/style-pool.php';

mt_srand( 20261110 );
$keys  = array_keys( $pool );
$cases = array();
for ( $i = 0; $i < 2000; $i++ ) {
	$a = array();
	// Each case sets a random handful of attributes, so the rules meet every combination of display and value.
	$count = mt_rand( 1, 9 );
	for ( $j = 0; $j < $count; $j++ ) {
		$key = $keys[ mt_rand( 0, count( $keys ) - 1 ) ];
		$a[ $key ] = $pool[ $key ][ mt_rand( 0, count( $pool[ $key ] ) - 1 ) ];
	}
	// Half the cases give a display, so the flex and grid rows are reached often. A grid or flex case also sets its own
	// settings, several of them, so the grid and flex rows meet their values.
	if ( 0 === $i % 2 ) {
		$a['display'] = array( 'flex', 'grid', 'inline-grid', 'block', 'inline-flex' )[ mt_rand( 0, 4 ) ];
		$own = is_string( $a['display'] ) && false !== strpos( $a['display'], 'grid' ) ? array( 'gridColumns', 'gridRows', 'gridAreas', 'gridAutoColumns', 'gridAutoRows', 'gridAutoFlow', 'gridDense', 'justifyItems', 'justifySelf', 'columnStart', 'columnSpan', 'rowStart', 'rowSpan', 'gridArea', 'alignContent' ) : array( 'flexDirection', 'flexWrap', 'flexGrow', 'flexShrink', 'flexBasis', 'alignContent', 'alignSelf', 'order' );
		$own = array_merge( $own, array( 'justifyContent', 'alignItems', 'gap', 'columnGap', 'rowGap' ) );
		foreach ( $own as $key ) {
			if ( mt_rand( 0, 2 ) ) {
				$a[ $key ] = $pool[ $key ][ mt_rand( 0, count( $pool[ $key ] ) - 1 ) ];
			}
		}
	}
	$view = 0 === $i % 3;
	$cases[] = array(
		'a'      => $a,
		'view'   => $view,
		'expect' => implode( ';', SNN_Style_Props::declarations( $a, array(), $view ) ),
	);
}

// The table as the editor reads it, from the same PHP function the blocks use.
$table = SNN_Style_Props::for_editor();
file_put_contents( $out_file, json_encode( array( 'table' => $table, 'cases' => $cases ), JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE ) );
echo count( $cases ) . " cases written to $out_file" . PHP_EOL;
