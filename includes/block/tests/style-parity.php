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

// The values each attribute is given: real ones, ones the table rejects, and the edges of each type.
$pool = array(
	'display'         => array( 'block', 'flex', 'inline-flex', 'grid', 'inline-grid', 'inline', 'none', 'bogus', '' ),
	'flexDirection'   => array( 'row', 'column', 'row-reverse', 'column-reverse', 'diagonal', '' ),
	'flexWrap'        => array( 'nowrap', 'wrap', 'wrap-reverse', 'bogus', '' ),
	'justifyContent'  => array( 'flex-start', 'center', 'flex-end', 'space-between', 'space-evenly', 'start', '' ),
	'alignItems'      => array( 'stretch', 'flex-start', 'center', 'flex-end', 'baseline', '' ),
	'alignContent'    => array( 'flex-start', 'stretch', 'space-around', 'bogus', '' ),
	'justifyItems'    => array( 'stretch', 'flex-end', 'space-between', '' ),
	'alignSelf'       => array( 'auto', 'flex-start', 'end', 'center', 'bogus', '' ),
	'justifySelf'     => array( 'flex-start', 'center', 'auto', '' ),
	'gap'             => array( '16', '1rem', '0', '-4', 'var(--size-20)', 'calc(1rem + 2px)', 'abc', '' ),
	'columnGap'       => array( '8', '0.5em', '', 'javascript:x' ),
	'rowGap'          => array( '12', 'var(--x)', '' ),
	'gridColumns'     => array( '4', '1', '12', '13', '0', '-2', 'repeat(3, 1fr)', '1fr 2fr', 'var(--cols)', 'auto 1fr', '' ),
	'gridRows'        => array( 'auto 200px', '1fr', 'repeat(2, 1fr)', 'bad;x', '' ),
	'gridAreas'       => array( '"a a" "b c"', '"hdr hdr" "main side"', 'a b', '"x y"', '' ),
	'gridAutoColumns' => array( 'minmax(0, 1fr)', '200px', '' ),
	'gridAutoRows'    => array( 'auto', '5rem', '' ),
	'gridAutoFlow'    => array( 'row', 'column', 'bogus', '' ),
	'gridDense'       => array( '1', '0', true, false, '' ),
	'order'           => array( '3', '-2', '1000', 'var(--o)', 'x', '' ),
	'flexGrow'        => array( '2', '0.5', '-1', '0', '' ),
	'flexShrink'      => array( '0', '1', '2.5', '' ),
	'flexBasis'       => array( 'auto', '10px', 'calc(100% - 2rem)', '-5', '30%', '' ),
	'columnStart'     => array( '2', '0', '100', 'var(--c)', '' ),
	'columnSpan'      => array( '3', '13', '1', '' ),
	'rowStart'        => array( '1', '99', '' ),
	'rowSpan'         => array( '2', '' ),
	'gridArea'        => array( 'main', '1x', 'header-1', '' ),
	'backgroundColor' => array( '#fff', '#ff000080', 'rgba(0, 0, 0, 0.5)', 'red', 'var(--bg)', 'javascript:x', '' ),
	'paddingTop'      => array( '20', '2rem', '-4', '' ),
	'paddingBottom'   => array( '20px', '1em', '' ),
	'maxWidth'        => array( '1200', '60%', 'none', '' ),
	'opacity'         => array( '50', '0', '100', '150', 'var(--o)', 'abc', '' ),
	'overflow'        => array( 'hidden', 'clip', 'bogus', '' ),
	'marginTop'       => array( '10', '-10', 'auto', '' ),
	'marginLeft'      => array( '4rem', '' ),
	'paddingLeft'     => array( '4', '' ),
	'width'           => array( '100%', 'fit-content', '200', '' ),
	'height'          => array( 'auto', '50vh', '' ),
	'position'        => array( 'relative', 'absolute', 'bogus', '' ),
	'zIndex'          => array( '5', '-1', '12345', '' ),
	'color'           => array( '#111', 'rgb(1, 2, 3)', '' ),
	'fontSize'        => array( '40', '2.5rem', '' ),
	'fontWeight'      => array( '700', 'normal', '' ),
	'textAlign'       => array( 'center', 'start', '' ),
	'backgroundImage' => array( 'url(https://example.com/a.jpg)', 'url(javascript:x)', '' ),
	'backgroundSize'  => array( 'cover', 'contain', '200px', '' ),
	'borderRadius'    => array( '8', '50%', '' ),
	'boxShadowX'      => array( '2', '-4px', '' ),
	'boxShadowY'      => array( '6', '' ),
	'boxShadowBlur'   => array( '12', '' ),
	'boxShadowColor'  => array( '#000', 'rgba(0,0,0,0.3)', '' ),
	'translateX'      => array( '10', '2rem', '' ),
	'rotate'          => array( '45', '-10', '' ),
	'scale'           => array( '1.2', '' ),
	'skewX'           => array( '5', '' ),
	'filterBlur'      => array( '4', '' ),
	'filterBrightness' => array( '120', '' ),
	'gradientApply'   => array( 'background', 'overlay', 'text', '' ),
	'gradientType'    => array( 'linear', 'radial', '' ),
	'gradientAngle'   => array( '90', '' ),
	'gradientStops'   => array( '[{"color":"#fff","stop":"0"},{"color":"#000","stop":"100"}]', '[{"color":"#fff"}]', 'not json', '' ),
	'gradientColor1'  => array( '#f00', '' ),
	'gradientColor2'  => array( '#00f', '' ),
	'transitionDuration' => array( '300ms', '0.5s', 'bad', '' ),
);

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
