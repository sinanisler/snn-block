<?php
/**
 * Test of the joined editor script (engine/editor-assets.php): one file for every editor script, its data, and the
 * translations of all the scripts in one file.
 *
 * Run from the command line, with WordPress at SNN_WP_LOAD (the path to wp-load.php):
 *   php includes/block/tests/editor-bundle-test.php
 *
 * Checks:
 *   - the editor enqueues one joined script (snn-editor) and no other script of the editor's list
 *   - the joined file exists in the uploads cache, holds every script in order, and is named by its key
 *   - the data script is attached to the joined script, before it runs
 *   - the translations of the joined script hold the messages of each script's own translation file
 *   - a second enqueue reuses the same file (no rewrite)
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
function bundle_check( $name, $ok, $detail = '' ) {
	global $pass, $fail;
	if ( $ok ) {
		++$pass;
		echo 'PASS ' . $name . "\n";
	} else {
		++$fail;
		echo 'FAIL ' . $name . ( '' !== $detail ? ' — ' . $detail : '' ) . "\n";
	}
}

// The enqueue checks the user who edits posts.
$admins = get_users( array( 'role' => 'administrator', 'number' => 1, 'fields' => 'ID' ) );
if ( ! $admins ) {
	echo "FAIL no administrator user\n";
	exit( 1 );
}
wp_set_current_user( (int) $admins[0] );

// The editor's own enqueue, as the block editor runs it.
SNN_Block_Editor_Assets::enqueue();

$wp_scripts = wp_scripts();
$handle     = SNN_Block_Editor_Assets::BUNDLE;
bundle_check( 'the joined script is enqueued', in_array( $handle, $wp_scripts->queue, true ) || isset( $wp_scripts->registered[ $handle ] ) );
bundle_check( 'the joined script is registered', isset( $wp_scripts->registered[ $handle ] ) );

// The separate handles are not enqueued when the bundle is written.
$separate = array( 'snn-core', 'snn-controls', 'snn-panel-panel', 'snn-layout-blocks' );
$leaked   = array_filter( $separate, function ( $h ) use ( $wp_scripts ) {
	return in_array( $h, $wp_scripts->queue, true );
} );
bundle_check( 'no separate editor script is enqueued', ! $leaked, implode( ', ', $leaked ) );

// The file: its URL names a file in the uploads cache, and the file holds each script in order.
$src = (string) $wp_scripts->registered[ $handle ]->src;
bundle_check( 'the URL is in the uploads cache', false !== strpos( $src, '/' . SNN_Block_Editor_Assets::CACHE_DIR . '/editor-' ), $src );
$upload = wp_upload_dir( null, false );
$name   = basename( parse_url( $src, PHP_URL_PATH ) );
$path   = trailingslashit( $upload['basedir'] ) . SNN_Block_Editor_Assets::CACHE_DIR . '/' . $name;
bundle_check( 'the joined file exists', is_file( $path ), $path );

$code    = is_file( $path ) ? (string) file_get_contents( $path ) : '';
$missing = array();
$starts  = array();
foreach ( SNN_Block_Editor_Assets::script_files() as $file ) {
	$at = strpos( $code, '/* ' . $file . " */\n" );
	if ( false === $at ) {
		$missing[] = $file;
	} else {
		$starts[] = $at;
	}
}
$in_order = true;
for ( $i = 1; $i < count( $starts ); $i++ ) {
	$in_order = $in_order && $starts[ $i ] > $starts[ $i - 1 ];
}
bundle_check( 'every editor script is in the file', ! $missing, implode( '; ', $missing ) );
bundle_check( 'the scripts are in the order of the list', ! $missing && $in_order );

// The name is the key of the file versions: the same files give the same name.
$key = substr( md5( implode( '|', array_map( function ( $file ) {
	return $file . '@' . SNN_Block_Tools::version( $file );
}, SNN_Block_Editor_Assets::script_files() ) ) ), 0, 12 );
bundle_check( 'the file name is the key of the versions', $name === 'editor-' . $key . '.js', $name . ' vs editor-' . $key . '.js' );

// The data script is attached to the joined script, before it.
$before = $wp_scripts->get_data( $handle, 'before' );
$before = is_array( $before ) ? implode( "\n", $before ) : (string) $before;
bundle_check( 'the data script is attached before the joined script', false !== strpos( $before, 'window.snn.data = ' ) );

// The second enqueue reuses the file: its modification time does not change.
$mtime = filemtime( $path );
clearstatcache();
SNN_Block_Editor_Assets::enqueue();
clearstatcache();
bundle_check( 'a second enqueue reuses the file', filemtime( $path ) === $mtime );

// Translations: the joined handle gets the messages of each script's own file.
$force_de = static function () { return 'de_DE'; };
add_filter( 'determine_locale', $force_de ); // the site has no German core files; the snn strings are read for de_DE.
$json = SNN_Block_Editor_Assets::bundle_translations( null, false, $handle, 'snn' );
$data = json_decode( (string) $json, true );
$messages = $data['locale_data']['messages'] ?? array();
bundle_check( 'the joined translations hold messages', count( $messages ) > 50, 'count ' . count( $messages ) );
$expected = 0;
$own      =json_decode( (string) file_get_contents( SNN_PATH . 'languages/snn-de_DE-snn-controls.json' ), true );
$hit = 0;
foreach ( (array) ( $own['locale_data']['messages'] ?? array() ) as $msgid => $translated ) {
	if ( '' === $msgid ) {
		continue;
	}
	++$expected;
	if ( isset( $messages[ $msgid ] ) && $messages[ $msgid ] === $translated ) {
		++$hit;
	}
}
bundle_check( 'the strings of snn-controls are in the joined translations', $expected > 0 && $hit === $expected, "$hit of $expected" );
remove_filter( 'determine_locale', $force_de );

// A handle that is not the joined one is left as it is.
bundle_check( 'other handles pass through unchanged', SNN_Block_Editor_Assets::bundle_translations( 'keep', false, 'snn-core', 'snn' ) === 'keep' );

echo "\n$pass passed, $fail failed\n";
exit( $fail ? 1 : 0 );
