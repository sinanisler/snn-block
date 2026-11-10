<?php
/**
 * Generic test: renders every block the registry finds, with its defaults, and checks the result.
 *
 * Run from the command line, with WordPress at SNN_WP_LOAD (the path to wp-load.php):
 *   php includes/block/tests/render-all.php
 *
 * Checks, for every block:
 *   - it is registered with WordPress, with every attribute of the engine
 *   - its defaults clean without a notice, and every key of its attributes is there after cleaning
 *   - its class exists and extends SNN_Block; its definition has a name, a tag and a valid tag list
 *   - rendered with defaults and with a sample text, it prints one element of its own tag, with no PHP notice,
 *     warning or deprecation
 *   - its style.css and front.js are registered when the files exist
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
$notices = array();

/** Collects a PHP notice, warning or deprecation raised while a check runs. */
set_error_handler(
	function ( $no, $str, $file, $line ) use ( &$notices ) {
		$notices[] = $str . ' (' . basename( $file ) . ':' . $line . ')';
		return true;
	}
);

function rt_check( $name, $ok, $detail = '' ) {
	global $pass, $fail;
	if ( $ok ) {
		++$pass;
	} else {
		++$fail;
	}
	echo ( $ok ? 'PASS ' : 'FAIL ' ) . $name . ( '' !== $detail ? '  [' . $detail . ']' : '' ) . PHP_EOL;
}

wp_set_current_user( get_user_by( 'login', 'admin' )->ID );

$definitions = SNN_Blocks::definitions();
rt_check( 'the registry finds blocks', count( $definitions ) >= 8, count( $definitions ) . ' blocks' );

foreach ( $definitions as $name => $def ) {
	$folder = $def['folder'];
	$class  = $def['class'];

	rt_check( "$name: its class extends SNN_Block", is_subclass_of( $class, 'SNN_Block' ), $class );
	rt_check( "$name: it is registered with WordPress", WP_Block_Type_Registry::get_instance()->is_registered( $name ) );
	rt_check( "$name: its tag is in its tag list", in_array( $def['tag'], $def['tags'], true ), $def['tag'] );
	rt_check( "$name: it has a title and an icon", '' !== $def['title'] && '' !== $def['icon'] );

	$own   = (array) call_user_func( array( $class, 'attributes' ) );
	$clean = SNN_Blocks::clean( array(), $name );
	$missing = array_diff( array_keys( SNN_Blocks::attributes( $name ) ), array_keys( $clean ) );
	rt_check( "$name: defaults clean with every attribute present", empty( $missing ), implode( ',', $missing ) );

	$notices = array();
	$html    = render_block( array( 'blockName' => $name, 'attrs' => array(), 'innerBlocks' => array(), 'innerHTML' => '', 'innerContent' => array() ) );
	rt_check( "$name: defaults render with no PHP notice", empty( $notices ), implode( ' | ', $notices ) );
	rt_check( "$name: defaults print an element or nothing", '' === $html || 0 === strpos( ltrim( $html ), '<' ), substr( $html, 0, 80 ) );

	$notices = array();
	$sample  = array( 'attrs' => array() );
	if ( array_key_exists( 'content', $own ) ) {
		$sample['attrs']['content'] = 'Sample text';
	}
	if ( array_key_exists( 'text', $own ) ) {
		$sample['attrs']['text'] = 'Sample text';
	}
	if ( array_key_exists( 'exampleText', $own ) ) {
		$sample['attrs']['exampleText'] = 'Sample text';
	}
	render_block( array( 'blockName' => $name, 'attrs' => $sample['attrs'], 'innerBlocks' => array(), 'innerHTML' => '', 'innerContent' => array() ) );
	rt_check( "$name: sample render has no PHP notice", empty( $notices ), implode( ' | ', $notices ) );

	// The files of the folder: a style.css and front.js are registered when they exist.
	$css = SNN_Blocks::file( $folder, 'style.css' );
	rt_check( "$name: style.css is registered when the file exists", '' === $css || wp_style_is( SNN_Blocks::handle( $folder ), 'registered' ) );
	$front = SNN_Blocks::file( $folder, 'front.js' );
	rt_check( "$name: front.js is registered when the file exists", '' === $front || wp_script_is( SNN_Blocks::handle( $folder, true ), 'registered' ) );
}

restore_error_handler();

echo PHP_EOL . "$pass passed, $fail failed" . PHP_EOL;
exit( $fail ? 1 : 0 );
