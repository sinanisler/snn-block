<?php
/**
 * Generic test: the own settings of every block the registry finds, against the shared and style settings.
 *
 * Run from the command line, with WordPress at SNN_WP_LOAD (the path to wp-load.php):
 *   php includes/block/tests/block-keys-test.php
 *
 * Checks, for every block:
 *   - none of its own attributes is named like a shared or style attribute (SNN_Blocks::reserved_keys()), so a style
 *     value is cleaned once, by the engine, and the clipboard never copies a block's content as a style
 *   - clean() of nothing gives each own scalar setting its registered default (the panel's blue dot and Reset read the
 *     registered default, so the two must agree)
 *   - rendered with its defaults, the element prints no style variable (--snn-...) that nobody set
 *   - its tag list holds its default tag
 *
 * Exit code 0 when every check passes, 1 otherwise. A new block is tested the moment its folder exists.
 */

$wp_load = getenv( 'SNN_WP_LOAD' ) ?: 'D:\\WWW\\LOCAL_SITES\\blocks.local\\wp-load.php';
$_SERVER['HTTP_HOST']   = 'blocks.local';
$_SERVER['SERVER_NAME'] = 'blocks.local';
$_SERVER['REQUEST_URI'] = '/';
require $wp_load;

$pass = 0;
$fail = 0;

function bk_check( $name, $ok, $detail = '' ) {
	global $pass, $fail;
	if ( $ok ) {
		++$pass;
		echo 'PASS ' . $name . "\n";
	} else {
		++$fail;
		echo 'FAIL ' . $name . ( '' !== $detail ? '  [' . $detail . ']' : '' ) . "\n";
	}
}

foreach ( SNN_Blocks::definitions() as $name => $def ) {
	$class    = $def['class'];
	$own      = (array) call_user_func( array( $class, 'attributes' ) );
	$reserved = array_intersect( array_keys( $own ), SNN_Blocks::reserved_keys( $name ) );
	bk_check( $name . ': no own attribute uses a shared or style name', ! $reserved, implode( ',', $reserved ) );

	$registered = SNN_Blocks::attributes( $name );
	$cleaned    = (array) call_user_func( array( $class, 'clean' ), array() );
	$differs    = array();
	foreach ( $own as $key => $spec ) {
		if ( ! array_key_exists( 'default', $spec ) || is_array( $spec['default'] ) ) {
			continue; // Objects and lists are normalised by clean() (an image source gets its keys); scalars must match.
		}
		if ( ! array_key_exists( $key, $cleaned ) || $cleaned[ $key ] !== $registered[ $key ]['default'] ) {
			$differs[] = $key . '=' . var_export( $cleaned[ $key ] ?? null, true ) . ' vs ' . var_export( $registered[ $key ]['default'], true );
		}
	}
	bk_check( $name . ': clean() of nothing gives the registered defaults', ! $differs, implode( '; ', $differs ) );

	$html = render_block(
		array(
			'blockName'    => $name,
			'attrs'        => array(),
			'innerBlocks'  => array(),
			'innerHTML'    => '',
			'innerContent' => array(),
		)
	);
	$style = preg_match( '/^<[a-z0-9]+[^>]*\sstyle="([^"]*)"/i', trim( $html ), $m ) ? $m[1] : '';
	bk_check( $name . ': the untouched element prints no style variable', false === strpos( $style, '--snn-' ), $style );

	bk_check( $name . ': the tag list holds the default tag', in_array( $def['tag'], $def['tags'], true ), $def['tag'] );
}

echo "\n" . $pass . ' passed, ' . $fail . " failed\n";
exit( $fail ? 1 : 0 );
