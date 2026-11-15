<?php
/**
 * Test of the element states (SNN_Style::STATES, state_rules(), clean_states()): each state is written with its own
 * selector, on the base and on a view, in the order of the table, and unknown states or empty values are dropped.
 * Hover is one of the states (it moved there from hoverStyle in version 2, see migrations-test.php).
 *
 * Run from the command line, with WordPress at SNN_WP_LOAD (the path to wp-load.php):
 *   php includes/block/tests/states-test.php
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
function check( $name, $ok, $detail = '' ) {
	global $pass, $fail;
	if ( $ok ) {
		$pass++;
		echo "ok   $name\n";
	} else {
		$fail++;
		echo "FAIL $name $detail\n";
	}
}

// 1. A focus colour is written under :focus-visible.
$css = SNN_Style::all_state_rules( array( 'states' => array( 'focus' => array( 'base' => array( 'color' => '#ff0000' ) ) ) ), array() );
check( 'focus rule', false !== strpos( $css, '.%CLASS%:focus-visible{color:#ff0000}' ), $css );

// 2. A tablet value of a state is in the tablet media rule.
$css = SNN_Style::all_state_rules( array( 'states' => array( 'active' => array( 'tablet' => array( 'color' => '#00ff00' ) ) ) ), array() );
$tab = SNN_Style::view_widths()['tablet'];
check( 'active tablet rule', false !== strpos( $css, '@media (max-width:' . $tab . 'px){.%CLASS%:active{color:#00ff00}}' ), $css );

// 3. Order: first, then hover, then active (a later state wins).
$a   = array(
	'states'     => array(
		'hover'  => array( 'base' => array( 'color' => '#111111' ) ),
		'active' => array( 'base' => array( 'color' => '#222222' ) ),
		'first'  => array( 'base' => array( 'color' => '#333333' ) ),
	),
);
$css = SNN_Style::all_state_rules( $a, array() );
$p1  = strpos( $css, ':first-child{' );
$p2  = strpos( $css, ':hover{' );
$p3  = strpos( $css, ':active{' );
check( 'order first < hover < active', false !== $p1 && false !== $p2 && false !== $p3 && $p1 < $p2 && $p2 < $p3, $css );

// 4. clean_states keeps hover with the other states, and drops unknown states and states with nothing set.
$clean = SNN_Style::clean_states(
	array(
		'hover'   => array( 'base' => array( 'color' => '#000000' ) ),
		'bogus'   => array( 'base' => array( 'color' => '#000000' ) ),
		'focus'   => array( 'base' => array() ),
		'odd'     => array( 'base' => array( 'color' => '#abcdef', 'notAKey' => 'x' ) ),
	)
);
check( 'clean keeps odd and hover, in the order of STATES', array( 'odd', 'hover' ) === array_keys( $clean ), wp_json_encode( $clean ) );
check( 'clean drops unknown keys', array( 'color' => '#abcdef' ) === ( $clean['odd']['base'] ?? null ), wp_json_encode( $clean ) );

// 5. A state's own CSS is scoped to the block in that state.
$css = SNN_Style::all_state_rules( array( 'states' => array( 'focus-within' => array( 'css' => '%root% { outline: 1px solid red; }' ) ) ), array() );
check( 'state css scoped', false !== strpos( $css, '.%CLASS%:focus-within' ), $css );

// 6. The block render prints a state through SNN_Blocks::clean() (the attribute is registered and cleaned).
$html = render_block(
	array(
		'blockName'    => 'snn/div',
		'attrs'        => array(
			'htmlId' => 'state-test',
			'states' => array( 'even' => array( 'base' => array( 'backgroundColor' => '#123456' ) ) ),
		),
		'innerBlocks'  => array(),
		'innerHTML'    => '',
		'innerContent' => array(),
	)
);
$sheet = class_exists( 'SNN_Style_Sheet' ) && method_exists( 'SNN_Style_Sheet', 'css' ) ? SNN_Style_Sheet::css() : '';
check( 'render prints the even rule', false !== strpos( $html . $sheet, ':nth-child(even){background-color:#123456' ), substr( $html, 0, 400 ) );

// 7. No state: no rules.
check( 'no state, no rules', '' === SNN_Style::all_state_rules( array(), array() ) );

echo "\n$pass passed, $fail failed\n";
exit( $fail ? 1 : 0 );
