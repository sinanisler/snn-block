<?php
/**
 * Test of the migrations (engine/migrations.php): each step of version 2 on its own cases, the steps on blocks that are
 * already in the new shape (nothing changes), a second run (nothing changes), the version key, and the cleaning that
 * follows. Then it writes every case with the PHP result to a file, for the editor's copy:
 *
 *   php includes/block/tests/migrations-test.php        (writes migration-cases.json in the system temp folder)
 *   node includes/block/tests/migrations.js <that file>  (runs editor/migrations.js on the same cases and compares)
 *
 * Run with WordPress at SNN_WP_LOAD (the path to wp-load.php). Exit code 0 when every check passes, 1 otherwise.
 */

$wp_load = getenv( 'SNN_WP_LOAD' ) ?: 'D:\\WWW\\LOCAL_SITES\\blocks.local\\wp-load.php';
$_SERVER['HTTP_HOST']   = 'blocks.local';
$_SERVER['SERVER_NAME'] = 'blocks.local';
$_SERVER['REQUEST_URI'] = '/';
require $wp_load;

$pass = 0;
$fail = 0;

function mig_check( $ok, $label, $detail = '' ) {
	global $pass, $fail;
	if ( $ok ) {
		++$pass;
		return;
	}
	++$fail;
	echo 'FAIL ' . $label . ( '' !== $detail ? '  [' . $detail . ']' : '' ) . "\n";
}

$run = function ( array $raw ) {
	return SNN_Block_Migrations::run( $raw, 'SNN_Div_Block' );
};

$v    = SNN_Block_Migrations::VERSION;
$key  = SNN_Block_Migrations::KEY;
$pair = array( 'gradientColor1' => '#ff0000', 'gradientStop1' => '10', 'gradientColor2' => '#0000ff', 'gradientStop2' => '' );

$cases = array(
	'hover moves into states'          => array( 'hoverStyle' => array( 'base' => array( 'color' => '#111111' ), 'css' => '%root% { outline: 0; }' ) ),
	'hover keeps a states hover'       => array( 'hoverStyle' => array( 'base' => array( 'color' => '#111111' ) ), 'states' => array( 'hover' => array( 'base' => array( 'color' => '#222222' ) ), 'focus' => array( 'base' => array( 'color' => '#333333' ) ) ) ),
	'empty hover goes'                 => array( 'hoverStyle' => array( 'base' => array(), 'tablet' => array(), 'mobile' => array(), 'css' => '' ) ),
	'hover as an empty list goes'      => array( 'hoverStyle' => array() ),
	'pair becomes stops'               => $pair,
	'pair with one colour goes'        => array( 'gradientColor1' => '#ff0000', 'gradientStop1' => '20' ),
	'pair keeps existing stops'        => $pair + array( 'gradientStops' => '[{"color":"#000","stop":"0"},{"color":"#fff","stop":"100"}]' ),
	'pair on a view, base filled in'   => $pair + array( 'responsive' => array( 'tablet' => array( 'gradientColor1' => '#00ff00' ), 'mobile' => array( 'gap' => '4' ) ) ),
	'pair in a state level'            => array( 'gradientColor1' => '#ff0000', 'gradientColor2' => '#0000ff', 'states' => array( 'hover' => array( 'base' => array( 'gradientColor2' => '#ffffff' ) ) ) ),
	'animation becomes a tween'        => array( 'animation' => array( 'style_start-opacity:0, style_end-opacity:1', 'scroll:false' ) ),
	'animation scroll tokens'          => array( 'animation' => array( 'fade-in', 'start:50%', 'end:100', 'scrub:true', 'markers:true', 'pin:true' ) ),
	'animation keeps existing tweens'  => array( 'animation' => array( 'fade-in' ), 'gsapTweens' => array( array( 'presets' => array( 'zoom-in' ), 'start' => 0.5 ) ) ),
	'empty animation goes'             => array( 'animation' => array() ),
	'already new: nothing changes'     => array( 'states' => array( 'hover' => array( 'base' => array( 'color' => '#111111' ) ) ), 'gradientStops' => '[{"color":"#000"},{"color":"#fff"}]', 'gsapTweens' => array( array( 'presets' => array( 'fade-in' ) ) ) ),
	'current version is left as it is' => array( 'hoverStyle' => array( 'base' => array( 'color' => '#111111' ) ), $key => $v ),
	'all three at once'                => $pair + array( 'hoverStyle' => array( 'base' => array( 'gap' => '9' ) ), 'animation' => array( 'fade-in' ), 'htmlId' => 'snn-abc', 'paddingTop' => '20' ),
);

$out = array();
foreach ( $cases as $label => $raw ) {
	$out[ $label ] = $run( $raw );
}

// The steps.
$r = $out['hover moves into states'];
mig_check( ! isset( $r['hoverStyle'] ) && '#111111' === ( $r['states']['hover']['base']['color'] ?? '' ) && '%root% { outline: 0; }' === ( $r['states']['hover']['css'] ?? '' ), 'hover moves into states', wp_json_encode( $r ) );
$r = $out['hover keeps a states hover'];
mig_check( '#222222' === $r['states']['hover']['base']['color'] && '#333333' === $r['states']['focus']['base']['color'] && ! isset( $r['hoverStyle'] ), 'a states hover wins over hoverStyle', wp_json_encode( $r ) );
mig_check( array() === SNN_Style::clean_states( $out['empty hover goes']['states'] ?? array() ), 'an empty hover leaves no state after cleaning' );
mig_check( ! isset( $out['hover as an empty list goes']['hoverStyle'] ) && ! isset( $out['hover as an empty list goes']['states'] ), 'an empty hover list goes' );
mig_check( '[{"color":"#ff0000","stop":"10"},{"color":"#0000ff","stop":"100"}]' === ( $out['pair becomes stops']['gradientStops'] ?? '' ), 'the pair becomes stops (empty stop is 100)', wp_json_encode( $out['pair becomes stops'] ) );
mig_check( ! isset( $out['pair with one colour goes']['gradientStops'] ) && ! isset( $out['pair with one colour goes']['gradientColor1'] ), 'one colour gives no stops (it printed nothing before)' );
mig_check( '[{"color":"#000","stop":"0"},{"color":"#fff","stop":"100"}]' === $out['pair keeps existing stops']['gradientStops'] && ! isset( $out['pair keeps existing stops']['gradientColor2'] ), 'existing stops win over the pair' );
$r = $out['pair on a view, base filled in'];
mig_check( '[{"color":"#00ff00","stop":"10"},{"color":"#0000ff","stop":"100"}]' === ( $r['responsive']['tablet']['gradientStops'] ?? '' ) && ! isset( $r['responsive']['mobile']['gradientStops'] ) && '4' === $r['responsive']['mobile']['gap'], 'a view gets the pair as it applied there', wp_json_encode( $r ) );
$r = $out['pair in a state level'];
mig_check( '[{"color":"#ff0000","stop":"0"},{"color":"#ffffff","stop":"100"}]' === ( $r['states']['hover']['base']['gradientStops'] ?? '' ), 'a state level gets the pair as it applied there', wp_json_encode( $r ) );
foreach ( $out as $label => $r ) {
	foreach ( SNN_Block_Migrations::GRADIENT_PAIR as $k ) {
		if ( false !== strpos( wp_json_encode( $r ), '"' . $k . '"' ) && 'current version is left as it is' !== $label ) {
			mig_check( false, $label . ': no ' . $k . ' left', wp_json_encode( $r ) );
		}
	}
}
$r = $out['animation becomes a tween'];
mig_check( array( 'style_start-opacity:0, style_end-opacity:1' ) === $r['gsapTweens'][0]['presets'] && false === $r['gsapScroll']['on'] && 'power1.out' === $r['gsapTweens'][0]['ease'] && ! isset( $r['animation'] ), 'the list becomes one tween and its Scroll Trigger', wp_json_encode( $r ) );
$r = $out['animation scroll tokens'];
mig_check( array( 'fade-in' ) === $r['gsapTweens'][0]['presets'] && 'top 50%' === $r['gsapScroll']['start'] && 'top+=100' === $r['gsapScroll']['end'] && $r['gsapScroll']['scrub'] && $r['gsapScroll']['markers'], 'scroll tokens set the Scroll Trigger; pin goes', wp_json_encode( $r ) );
mig_check( array( 'zoom-in' ) === $out['animation keeps existing tweens']['gsapTweens'][0]['presets'] && ! isset( $out['animation keeps existing tweens']['animation'] ), 'existing tweens win over the list' );
mig_check( ! isset( $out['empty animation goes']['animation'] ) && ! isset( $out['empty animation goes']['gsapTweens'] ), 'an empty list goes' );

// New shape, versions, a second run.
$same = $cases['already new: nothing changes'];
$same[ $key ] = $v;
mig_check( $same === $out['already new: nothing changes'], 'attributes in the new shape only get the version', wp_json_encode( $out['already new: nothing changes'] ) );
mig_check( $cases['current version is left as it is'] === $out['current version is left as it is'], 'a block of the current version is not touched' );
foreach ( $out as $label => $r ) {
	mig_check( $v === $r[ $key ], $label . ': version set' );
	if ( 'current version is left as it is' === $label ) {
		continue; // Without its version this one is an old block: the steps run, as they should.
	}
	$again = $r;
	unset( $again[ $key ] );
	$twice = $run( $again );
	mig_check( $twice === $r, $label . ': a second run changes nothing', wp_json_encode( $twice ) );
}
mig_check( 1 === SNN_Block_Migrations::version_of( array() ) && 1 === SNN_Block_Migrations::version_of( array( $key => 'x' ) ), 'no version or a bad one is version 1' );

// Cleaning: an old block cleans to the new shape, and the old keys are not attributes any more.
$clean = SNN_Blocks::clean( $cases['all three at once'], 'snn/div' );
mig_check( '9' === ( $clean['states']['hover']['base']['gap'] ?? '' ) && ! isset( $clean['hoverStyle'] ) && ! isset( $clean['animation'] ) && ! isset( $clean['gradientColor1'] ), 'clean() gives the new shape', wp_json_encode( array_intersect_key( $clean, array_flip( array( 'states', 'gsapTweens', 'gradientStops' ) ) ) ) );
mig_check( $v === $clean[ $key ], 'clean() sets the version' );
$attrs = SNN_Blocks::attributes( 'snn/div' );
foreach ( array( 'hoverStyle', 'animation', 'gradientColor1', 'gradientStop1', 'gradientColor2', 'gradientStop2' ) as $old ) {
	mig_check( ! isset( $attrs[ $old ] ), $old . ' is not an attribute' );
}
mig_check( isset( $attrs[ $key ] ) && 1 === $attrs[ $key ]['default'], 'the version is an attribute, default 1' );

// The cases for the editor's copy.
$file = getenv( 'SNN_MIGRATION_CASES' ) ?: rtrim( sys_get_temp_dir(), '/\\' ) . DIRECTORY_SEPARATOR . 'migration-cases.json';
$list = array();
foreach ( $cases as $label => $raw ) {
	$list[] = array( 'label' => $label, 'raw' => $raw, 'php' => $out[ $label ] );
}
file_put_contents( $file, wp_json_encode( array( 'version' => $v, 'key' => $key, 'cases' => $list ) ) );

echo $pass . ' passed, ' . $fail . " failed\ncases: " . $file . "\n";
exit( $fail ? 1 : 0 );
