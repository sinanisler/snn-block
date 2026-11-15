<?php
/**
 * Test: inner blocks render once, with the context of every block around them, inside and outside a query loop; and the
 * nesting and context keys of a definition reach the block type.
 *
 * Run from the command line, with WordPress at SNN_WP_LOAD (the path to wp-load.php):
 *   php includes/block/tests/context-test.php
 *
 * Two block types exist only in this test: snn-test/provider (provides snn-test/value from its attribute) and
 * snn-test/probe (prints the context it receives). Posts it makes are removed at the end. Exit code 0 when every check
 * passes, 1 otherwise.
 */

$wp_load = getenv( 'SNN_WP_LOAD' ) ?: 'D:\\WWW\\LOCAL_SITES\\blocks.local\\wp-load.php';
$_SERVER['HTTP_HOST']   = 'blocks.local';
$_SERVER['SERVER_NAME'] = 'blocks.local';
$_SERVER['REQUEST_URI'] = '/';
require $wp_load;

$pass = 0;
$fail = 0;

function snn_ctx_check( $ok, $label, $detail = '' ) {
	global $pass, $fail;
	if ( $ok ) {
		++$pass;
		return;
	}
	++$fail;
	echo 'FAIL ' . $label . ( '' !== $detail ? '  [' . $detail . ']' : '' ) . "\n";
}

/** A tree of our blocks around some markup: the names from the outside in. */
function snn_ctx_wrap( $markup, array $names ) {
	foreach ( array_reverse( $names ) as $name ) {
		$markup = '<!-- wp:' . $name . ' -->' . $markup . '<!-- /wp:' . $name . ' -->';
	}
	return $markup;
}

register_block_type(
	'snn-test/provider',
	array(
		'attributes'       => array( 'value' => array( 'type' => 'string', 'default' => '' ) ),
		'provides_context' => array( 'snn-test/value' => 'value' ),
		'render_callback'  => function ( $attributes, $content ) {
			return '<div class="provider">' . $content . '</div>';
		},
	)
);
register_block_type(
	'snn-test/probe',
	array(
		'uses_context'    => array( 'snn-test/value', 'postId' ),
		'render_callback' => function ( $attributes, $content, $block ) {
			return '<i data-value="' . esc_attr( $block->context['snn-test/value'] ?? '' ) . '" data-post="' . esc_attr( $block->context['postId'] ?? '' ) . '"></i>';
		},
	)
);

// 1. One render per block, however deep.
$renders = 0;
$count   = function ( $html, $parsed ) use ( &$renders ) {
	if ( 'snn/text' === $parsed['blockName'] ) {
		++$renders;
	}
	return $html;
};
add_filter( 'render_block', $count, 10, 2 );
$deep = snn_ctx_wrap( '<!-- wp:snn/text {"content":"Deep"} /-->', array( 'snn/section', 'snn/container', 'snn/div', 'snn/div', 'snn/div', 'snn/div', 'snn/div' ) );
$html = do_blocks( $deep );
remove_filter( 'render_block', $count, 10 );
snn_ctx_check( 1 === $renders, 'a Text block eight levels deep renders once', 'rendered ' . $renders . ' times' );
snn_ctx_check( 1 === substr_count( $html, 'Deep' ), 'its text is printed once' );
snn_ctx_check( 7 === substr_count( $html, 'wp-block-snn-div' ) + substr_count( $html, 'wp-block-snn-container' ) + substr_count( $html, 'wp-block-snn-section' ), 'every level prints its element' );

// 2. Context from a block around ours reaches a block inside ours, outside a loop.
$html = do_blocks( '<!-- wp:snn-test/provider {"value":"outer"} -->' . snn_ctx_wrap( '<!-- wp:snn-test/probe /-->', array( 'snn/section', 'snn/div' ) ) . '<!-- /wp:snn-test/provider -->' );
snn_ctx_check( false !== strpos( $html, 'data-value="outer"' ), 'context crosses our blocks', $html );

// 3. The same inside a loop item, with the item's post as core's postId.
$ids = array();
foreach ( array( 'Ctx A', 'Ctx B', 'Ctx C' ) as $i => $title ) {
	$ids[] = wp_insert_post( array( 'post_title' => $title, 'post_status' => 'publish', 'post_type' => 'post', 'post_date' => gmdate( 'Y-m-d H:i:s', time() - 3600 * ( $i + 1 ) ) ) );
}
$query = wp_json_encode( array( 'query' => array( 'enabled' => true, 'postType' => 'post', 'include' => implode( ',', $ids ), 'orderBy' => 'title', 'order' => 'ASC' ) ) );
$loop  = '<!-- wp:snn/container ' . $query . ' --><!-- wp:snn/div --><!-- wp:snn-test/probe /--><!-- wp:post-title /--><!-- /wp:snn/div --><!-- /wp:snn/container -->';
$html  = do_blocks( '<!-- wp:snn-test/provider {"value":"looped"} -->' . $loop . '<!-- /wp:snn-test/provider -->' );
snn_ctx_check( 3 === substr_count( $html, 'data-value="looped"' ), 'context reaches every loop item', $html );
foreach ( $ids as $i => $id ) {
	snn_ctx_check( false !== strpos( $html, 'data-post="' . $id . '"' ), 'loop item ' . ( $i + 1 ) . ' gets its postId' );
}
foreach ( array( 'Ctx A', 'Ctx B', 'Ctx C' ) as $title ) {
	snn_ctx_check( 1 === substr_count( $html, $title ), 'core Post Title shows ' . $title . ' once in the loop', $html );
}

// 4. The filters core runs on inner blocks run once per child, per loop item.
$seen   = 0;
$filter = function ( $parsed ) use ( &$seen ) {
	if ( 'snn-test/probe' === $parsed['blockName'] ) {
		++$seen;
	}
	return $parsed;
};
add_filter( 'render_block_data', $filter );
do_blocks( $loop );
remove_filter( 'render_block_data', $filter );
snn_ctx_check( 3 === $seen, 'render_block_data sees the probe once per item', 'seen ' . $seen . ' times' );

// 5. A block's own provided context reaches the children of each loop item.
$type                   = WP_Block_Type_Registry::get_instance()->get_registered( 'snn/container' );
$saved                  = $type->provides_context;
$type->provides_context = array( 'snn-test/value' => 'htmlId' );
$html                   = do_blocks( str_replace( '{"query"', '{"htmlId":"own-id","query"', $loop ) );
$type->provides_context = $saved;
snn_ctx_check( 3 === substr_count( $html, 'data-value="own-id"' ), 'a loop block provides its own context to its items', $html );

// 6. Outside our loop, our blocks read core's postId (a template, the core query loop).
$tag  = '<!-- wp:snn/text {"content":"{post_title}"} /-->';
$html = ( new WP_Block( parse_blocks( $tag )[0], array( 'postId' => $ids[1] ) ) )->render();
snn_ctx_check( false !== strpos( $html, 'Ctx B' ), 'a Text block reads core postId for its tags', $html );

// 7. The definition keys and the block type.
$def = SNN_Blocks::definition( 'snn/div' );
foreach ( array( 'parent' => array(), 'ancestor' => array(), 'allowedBlocks' => null, 'template' => array(), 'templateLock' => false, 'provides' => array(), 'context' => array() ) as $key => $default ) {
	snn_ctx_check( array_key_exists( $key, $def ) && $default === $def[ $key ], 'definition has ' . $key . ' with its default' );
}
foreach ( array_keys( SNN_Blocks::definitions() ) as $name ) {
	$registered = WP_Block_Type_Registry::get_instance()->get_registered( $name );
	snn_ctx_check( ! empty( $registered->skip_inner_blocks ), $name . ' skips WordPress\'s own inner pass' );
	snn_ctx_check( in_array( 'postId', (array) $registered->uses_context, true ) && in_array( SNN_Blocks::CONTEXT_POST, (array) $registered->uses_context, true ), $name . ' uses the loop and core post context' );
}

foreach ( $ids as $id ) {
	wp_delete_post( $id, true );
}
echo $pass . ' passed, ' . $fail . " failed\n";
exit( $fail ? 1 : 0 );
