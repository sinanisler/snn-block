<?php
/**
 * Test of the breakpoints (the widths of the Tablet and Mobile views), a Global Styles setting: the defaults, the
 * checks on a stored value, the view rules that use it, and the field on the Global styles tab.
 *
 * Run from the command line, with WordPress at SNN_WP_LOAD (the path to wp-load.php):
 *   php includes/block/tests/breakpoints-test.php
 *
 * The test stores its own values in the Global Styles option and puts the stored option back at the end.
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
function bp_check( $name, $ok, $detail = '' ) {
	global $pass, $fail;
	if ( $ok ) {
		++$pass;
		echo "PASS $name\n";
	} else {
		++$fail;
		echo "FAIL $name" . ( '' !== $detail ? " — $detail" : '' ) . "\n";
	}
}

/** Whether a key path (such as breakpoints.tablet) is in the schema, as a field's path. */
function bp_has_path( $node, $path ) {
	if ( ! is_array( $node ) ) {
		return false;
	}
	if ( isset( $node['path'] ) && $path === $node['path'] ) {
		return true;
	}
	foreach ( $node as $child ) {
		if ( bp_has_path( $child, $path ) ) {
			return true;
		}
	}
	return false;
}

$dyn = array(
	'post_id' => 0,
	'index'   => null,
	'count'   => null,
);

// The stored option, put back at the end.
$saved = get_option( SNN_Global_Styles::OPTION, null );

// Defaults and the checks on a value.
bp_check( 'no value gives 991 and 478', SNN_Global_Styles::breakpoints_from( null ) === array( 'tablet' => 991, 'mobile' => 478 ) );
bp_check( 'a value that is set is kept', SNN_Global_Styles::breakpoints_from( array( 'tablet' => 1100, 'mobile' => 600 ) ) === array( 'tablet' => 1100, 'mobile' => 600 ) );
bp_check( 'a text number is read', SNN_Global_Styles::breakpoints_from( array( 'tablet' => '900', 'mobile' => '500' ) ) === array( 'tablet' => 900, 'mobile' => 500 ) );
bp_check( 'a text that is not a number is the default', SNN_Global_Styles::breakpoints_from( array( 'tablet' => 'wide', 'mobile' => 'narrow' ) ) === array( 'tablet' => 991, 'mobile' => 478 ) );
bp_check( 'a tablet below 320 is the default', SNN_Global_Styles::breakpoints_from( array( 'tablet' => 200 ) )['tablet'] === 991 );
bp_check( 'a tablet above 1920 is the default', SNN_Global_Styles::breakpoints_from( array( 'tablet' => 2500 ) )['tablet'] === 991 );
bp_check( 'a mobile at or above tablet is one less than tablet', SNN_Global_Styles::breakpoints_from( array( 'tablet' => 700, 'mobile' => 800 ) ) === array( 'tablet' => 700, 'mobile' => 699 ) );
bp_check( 'a fraction rounds to a whole number', SNN_Global_Styles::breakpoints_from( array( 'tablet' => '1000.6' ) )['tablet'] === 1001 );

// The stored value is what the view rules use.
update_option( SNN_Global_Styles::OPTION, array( 'breakpoints' => array( 'tablet' => 1100, 'mobile' => 600 ) ), true );
bp_check( 'the stored widths are read', SNN_Style::view_widths() === array( 'tablet' => 1100, 'mobile' => 600 ), wp_json_encode( SNN_Style::view_widths() ) );
$css = SNN_Style::view_rules(
	array(
		'display'    => 'flex',
		'gap'        => '24',
		'responsive' => array( 'tablet' => array( 'gap' => '16' ), 'mobile' => array( 'gap' => '8' ) ),
	),
	$dyn
);
bp_check( 'the view rules use the stored tablet width', false !== strpos( $css, '@media (max-width:1100px){.%CLASS%{gap:16px}}' ), $css );
bp_check( 'the view rules use the stored mobile width', false !== strpos( $css, '@media (max-width:600px){.%CLASS%{gap:8px}}' ), $css );

// A stored value that is not valid falls back to the defaults in the view rules.
update_option( SNN_Global_Styles::OPTION, array( 'breakpoints' => array( 'tablet' => 'x', 'mobile' => 'y' ) ), true );
bp_check( 'an invalid stored value gives the defaults', SNN_Style::view_widths() === array( 'tablet' => 991, 'mobile' => 478 ) );

// Global styles: the field is on the Responsive group of the Global styles tab.
$schema = SNN_Global_Styles::schema();
bp_check( 'the schema has the tablet field', bp_has_path( $schema, 'breakpoints.tablet' ) );
bp_check( 'the schema has the mobile field', bp_has_path( $schema, 'breakpoints.mobile' ) );

// The saved values keep the breakpoints (a save reads the whole input through sanitize()).
$clean = SNN_Global_Styles::sanitize( array( 'breakpoints' => array( 'tablet' => 1024, 'mobile' => 640 ) ) );
bp_check( 'sanitize keeps the breakpoints', ( $clean['breakpoints'] ?? null ) === array( 'tablet' => 1024, 'mobile' => 640 ) );
bp_check( 'sanitize gives the defaults when there is none', ( SNN_Global_Styles::sanitize( array() )['breakpoints'] ?? null ) === array( 'tablet' => 991, 'mobile' => 478 ) );

// Put the stored option back as it was.
if ( false === $saved ) {
	delete_option( SNN_Global_Styles::OPTION );
} else {
	update_option( SNN_Global_Styles::OPTION, $saved, true );
}
bp_check( 'the stored option is back as it was', get_option( SNN_Global_Styles::OPTION, null ) === $saved );

echo "\n$pass passed, $fail failed\n";
exit( $fail ? 1 : 0 );
