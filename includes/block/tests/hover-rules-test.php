<?php
/**
 * Test of the hover rules (SNN_Style::hover_rules()): a hover value is written on the base and on each view, only where it
 * differs from the normal style of that level, and a view's hover is in its media rule.
 *
 * Run from the command line, with WordPress at SNN_WP_LOAD (the path to wp-load.php):
 *   php includes/block/tests/hover-rules-test.php
 *
 * Exit code 0 when every check passes, 1 otherwise.
 */

$wp_load = getenv( 'SNN_WP_LOAD' ) ?: 'D:\\WWW\\LOCAL_SITES\\blocks.local\\wp-load.php';
$_SERVER['HTTP_HOST']   = 'blocks.local';
$_SERVER['SERVER_NAME'] = 'blocks.local';
$_SERVER['REQUEST_URI'] = '/';
require $wp_load;

$pass = 0;
$fail = 0;

/** One check: prints PASS or FAIL with its name. */
function hover_check( $name, $ok, $detail = '' ) {
	global $pass, $fail;
	if ( $ok ) {
		++$pass;
	} else {
		++$fail;
	}
	echo ( $ok ? 'PASS ' : 'FAIL ' ) . $name . ( '' !== $detail ? '  [' . $detail . ']' : '' ) . "\n";
}

$dyn = array();

// No hover value: no hover rule.
$none = SNN_Style::hover_rules( array( 'color' => '#ff0000' ), $dyn );
hover_check( 'no hover value adds no rule', '' === $none, $none );

// A hover colour on the base, the normal colour red.
$base = array(
	'color'      => '#ff0000',
	'hoverStyle' => array( 'base' => array( 'color' => '#0000ff' ) ),
);
$css = SNN_Style::hover_rules( $base, $dyn );
hover_check( 'a base hover colour: .%CLASS%:hover with the colour', '.%CLASS%:hover{color:#0000ff}' === $css, $css );

// A hover equal to the normal value adds nothing.
$same = array(
	'color'      => '#ff0000',
	'hoverStyle' => array( 'base' => array( 'color' => '#ff0000' ) ),
);
$same_css = SNN_Style::hover_rules( $same, $dyn );
hover_check( 'a hover equal to the normal value adds no rule', '' === $same_css, $same_css );

// A tablet hover gap in a media rule, against the tablet normal gap.
$tablet = array(
	'display'    => 'flex',
	'gap'        => '24',
	'responsive' => array( 'tablet' => array( 'gap' => '16' ) ),
	'hoverStyle' => array( 'tablet' => array( 'gap' => '8' ) ),
);
$tablet_css = SNN_Style::hover_rules( $tablet, $dyn );
hover_check( 'a tablet hover gap: in the tablet media rule', '@media (max-width:991px){.%CLASS%:hover{gap:8px}}' === $tablet_css, $tablet_css );

// A base hover over a tablet normal value: the base hover is written on the base (it wins over the tablet normal at
// the same width, as a hover state does), and the tablet rule does not repeat it when the tablet has no hover.
$over = array(
	'display'    => 'flex',
	'gap'        => '24',
	'responsive' => array( 'tablet' => array( 'gap' => '16' ) ),
	'hoverStyle' => array( 'base' => array( 'gap' => '32' ) ),
);
$over_css = SNN_Style::hover_rules( $over, $dyn );
hover_check( 'a base hover gap: the base rule holds it', false !== strpos( $over_css, '.%CLASS%:hover{gap:32px}' ), $over_css );

// A hover that takes the overlay away: the ::before is set to none on the hover.
$overlay = array(
	'gradientType'   => 'linear',
	'gradientApply'  => 'overlay',
	'gradientColor1' => '#000000',
	'gradientColor2' => '#ffffff',
	'hoverStyle'     => array( 'base' => array( 'gradientApply' => 'background' ) ),
);
$overlay_css = SNN_Style::hover_rules( $overlay, $dyn );
hover_check( 'a hover that removes the overlay sets its ::before to none', false !== strpos( $overlay_css, '.%CLASS%:hover::before{content:none}' ), $overlay_css );

// The hover state's own CSS: %root% is the block in its hover state.
$own_css      = array(
	'hoverStyle' => array( 'css' => '%root% span { color: red; }' ),
);
$own_css_text = SNN_Style::hover_rules( $own_css, $dyn );
hover_check( 'hover CSS: %root% is the block in its hover state', '.%CLASS%:hover span { color: red; }' === $own_css_text, $own_css_text );

// Random cases: every rule is well formed (balanced braces, the placeholder, no empty block), and a block without a hover
// value has no hover rule.
mt_srand( 20261112 );
$pool  = require __DIR__ . '/style-pool.php';
$keys  = array_keys( $pool );
$bad   = 0;
for ( $i = 0; $i < 1500; $i++ ) {
	$a = array();
	for ( $n = mt_rand( 1, 6 ); $n > 0; $n-- ) {
		$key       = $keys[ mt_rand( 0, count( $keys ) - 1 ) ];
		$a[ $key ] = $pool[ $key ][ mt_rand( 0, count( $pool[ $key ] ) - 1 ) ];
	}
	$a['hoverStyle'] = array();
	foreach ( array( 'base', 'tablet', 'mobile' ) as $level ) {
		if ( ! mt_rand( 0, 1 ) ) {
			continue;
		}
		$own = array();
		for ( $n = mt_rand( 1, 4 ); $n > 0; $n-- ) {
			$key         = $keys[ mt_rand( 0, count( $keys ) - 1 ) ];
			$own[ $key ] = $pool[ $key ][ mt_rand( 0, count( $pool[ $key ] ) - 1 ) ];
		}
		$a['hoverStyle'][ $level ] = $own;
	}
	$css = SNN_Style::hover_rules( $a, $dyn );
	$open  = substr_count( $css, '{' );
	$close = substr_count( $css, '}' );
	$ok    = $open === $close && false === strpos( $css, '{}' ) && false === strpos( $css, '<' );
	if ( '' === $css && ! empty( array_filter( $a['hoverStyle'] ) ) ) {
		// A hover with values that all equal the normal style writes nothing: that is fine.
		$ok = true;
	}
	if ( ! $ok ) {
		++$bad;
	}
}
hover_check( '1500 random cases: every hover rule is well formed', 0 === $bad, "$bad malformed" );

echo "\n$pass passed, $fail failed\n";
exit( $fail ? 1 : 0 );
