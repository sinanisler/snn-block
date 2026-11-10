<?php
/**
 * Translations for the block editor scripts. Run from the theme folder:  php languages/make-js-translations.php
 *
 * 1. Reads the strings of each editor script: every __( '…', 'snn' ) call, and the TIPS table in tooltips.js (its
 *    titles and texts are passed through __() when a tip is shown, so they are read from the table here).
 * 2. Adds the strings that snn.pot does not have yet to the end of snn.pot, so the .po files can be updated from it.
 * 3. Writes languages/snn-<locale>-<handle>.json for each .po file and script, with the strings that .po file
 *    translates. WordPress loads these files for the scripts (wp_set_script_translations in layout-blocks.php).
 *
 * After translating new strings in a .po file, run this again to refresh the JSON files.
 */

if ( 'cli' !== PHP_SAPI ) {
	exit;
}

$root = dirname( __DIR__ ) . '/';
$lang = __DIR__ . '/';

// The editor scripts: handle => file. The same handles as the wp_set_script_translations() list in layout-blocks.php.
$scripts = array(
	'snn-tooltips'             => 'includes/block/controls/tooltips.js',
	'snn-controls'             => 'includes/block/controls/controls.js',
	'snn-block-tools'          => 'includes/block/controls/block-tools.js',
	'snn-animation-pane'       => 'includes/block/controls/animation-pane.js',
	'snn-icon-picker'          => 'includes/block/controls/icon-picker.js',
	'snn-link-fields'          => 'includes/block/controls/link-fields.js',
	'snn-layout-blocks'        => 'includes/block/editor/layout-blocks.js',
	'snn-block-clipboard'      => 'includes/block/editor/block-clipboard.js',
	'snn-featured-image-search' => 'includes/block/editor/featured-image-search.js',
	'snn-list-view-badges'     => 'includes/block/editor/list-view-badges.js',
	'snn-page-title-switch'    => 'includes/block/editor/page-title-switch.js',
);
// The block folders' editor scripts: one handle per folder (snn-block-<folder>-editor), as SNN_Blocks::handle() names them.
foreach ( glob( $root . 'includes/block/blocks/*/editor.js' ) as $file ) {
	$folder = basename( dirname( $file ) );
	$scripts[ 'snn-block-' . $folder . '-editor' ] = 'includes/block/blocks/' . $folder . '/editor.js';
}

/** A JS single-quoted string body as text: \' \\ \n and the other escapes. */
function snn_js_unescape( $s ) {
	return stripcslashes( $s );
}

/** A string as a PO line value: backslash, quote and newline escaped. */
function snn_po_escape( $s ) {
	return str_replace( array( '\\', '"', "\n", "\t" ), array( '\\\\', '\\"', '\\n', '\\t' ), $s );
}

/** The strings of one script, in the order they appear. */
function snn_js_strings( $src ) {
	$found = array();
	$q     = '\'((?:[^\'\\\\]|\\\\.)*)\'';
	preg_match_all( '/\b__\(\s*' . $q . '\s*,\s*\'snn\'\s*\)/', $src, $m );
	foreach ( $m[1] as $s ) {
		$found[] = snn_js_unescape( $s );
	}
	// The tooltip table: 'key': [ 'Title', 'Text' ].
	preg_match_all( '/^\s*\'[^\']+\'\s*:\s*\[\s*' . $q . '\s*,\s*' . $q . '\s*\]/m', $src, $t );
	foreach ( array_keys( $t[0] ) as $i ) {
		$found[] = snn_js_unescape( $t[1][ $i ] );
		$found[] = snn_js_unescape( $t[2][ $i ] );
	}
	return array_values( array_unique( array_filter( $found, 'strlen' ) ) );
}

/** A .po or .pot file as msgid => msgstr (context entries are keyed as context\x04msgid), plus its header. */
function snn_po_read( $file ) {
	$text    = str_replace( "\r", '', file_get_contents( $file ) );
	$entries = array();
	$header  = '';
	foreach ( preg_split( '/\n\s*\n/', $text ) as $block ) {
		$fields = array();
		$key    = null;
		foreach ( explode( "\n", $block ) as $line ) {
			if ( preg_match( '/^(msgctxt|msgid|msgid_plural|msgstr(?:\[\d+\])?)\s+"(.*)"\s*$/', $line, $m ) ) {
				$key            = $m[1];
				$fields[ $key ] = stripcslashes( $m[2] );
			} elseif ( null !== $key && preg_match( '/^"(.*)"\s*$/', $line, $m ) ) {
				$fields[ $key ] .= stripcslashes( $m[1] );
			}
		}
		if ( ! isset( $fields['msgid'] ) ) {
			continue;
		}
		if ( '' === $fields['msgid'] ) {
			$header = $fields['msgstr'] ?? '';
			continue;
		}
		$id             = isset( $fields['msgctxt'] ) ? $fields['msgctxt'] . "\x04" . $fields['msgid'] : $fields['msgid'];
		$entries[ $id ] = $fields['msgstr'] ?? ( $fields['msgstr[0]'] ?? '' );
	}
	return array( $entries, $header );
}

// 1. The strings of each script.
$by_handle = array();
$refs      = array();
foreach ( $scripts as $handle => $file ) {
	$by_handle[ $handle ] = snn_js_strings( file_get_contents( $root . $file ) );
	foreach ( $by_handle[ $handle ] as $s ) {
		$refs[ $s ][ $file ] = true;
	}
}
printf( "%d strings in %d scripts\n", count( $refs ), count( $scripts ) );

// 2. snn.pot: the strings it does not have yet, added at the end.
$pot           = $lang . 'snn.pot';
list( $known ) = snn_po_read( $pot );
$add           = '';
$added         = 0;
foreach ( $refs as $s => $files ) {
	if ( isset( $known[ $s ] ) ) {
		continue;
	}
	$add .= "\n#: " . implode( ' ', array_keys( $files ) ) . "\nmsgid \"" . snn_po_escape( $s ) . "\"\nmsgstr \"\"\n";
	$added++;
}
if ( $added ) {
	$body = rtrim( file_get_contents( $pot ) ) . "\n" . $add;
	file_put_contents( $pot, $body );
}
printf( "snn.pot: %d strings added\n", $added );

// 3. One JSON file per locale and script, with the strings the .po file translates.
foreach ( glob( $lang . '*.po' ) as $po ) {
	$locale                   = basename( $po, '.po' );
	list( $entries, $header ) = snn_po_read( $po );
	$plural                   = preg_match( '/^Plural-Forms:\s*(.+)$/mi', $header, $pm ) ? trim( $pm[1] ) : 'nplurals=2; plural=(n != 1);';
	$total                    = 0;
	foreach ( $by_handle as $handle => $strings ) {
		$messages = array(
			'' => array(
				'domain'       => 'messages',
				'lang'         => $locale,
				'plural-forms' => $plural,
			),
		);
		foreach ( $strings as $s ) {
			if ( isset( $entries[ $s ] ) && '' !== $entries[ $s ] ) {
				$messages[ $s ] = array( $entries[ $s ] );
			}
		}
		$out = $lang . 'snn-' . $locale . '-' . $handle . '.json';
		if ( count( $messages ) < 2 ) {
			if ( file_exists( $out ) ) {
				unlink( $out );
			}
			continue;
		}
		$json = array(
			'domain'      => 'messages',
			'locale_data' => array( 'messages' => $messages ),
		);
		file_put_contents( $out, json_encode( $json, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES ) );
		$total += count( $messages ) - 1;
	}
	printf( "%s: %d translated strings written\n", $locale, $total );
}
