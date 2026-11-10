<?php
/**
 * Test of the view rules (SNN_Style::view_rules()): the media rules hold only the values that change from the layer
 * above, and the page shows the same values at every width as the rules they replaced (the whole style of each view).
 *
 * Run from the command line, with WordPress at SNN_WP_LOAD (the path to wp-load.php):
 *   php includes/block/tests/view-rules-test.php
 *
 * The cases are random but reproducible (a fixed seed; the values come from style-pool.php). For each case the test
 * works out the effective declarations at a desktop, a tablet and a mobile width, under the old rules (copied here) and
 * under the current rules, and checks that they are the same. It also checks three fixed cases.
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
function view_check( $name, $ok, $detail = '' ) {
	global $pass, $fail;
	if ( $ok ) {
		++$pass;
	} else {
		++$fail;
		echo 'FAIL ' . $name . ( '' !== $detail ? ' — ' . $detail : '' ) . "\n";
	}
}

/** The view rules as they were before: each view's rule holds the whole style of that view (copied from the old code). */
function old_view_rules( array $a, array $dyn ) {
	$own   = is_array( $a['responsive'] ?? null ) ? $a['responsive'] : array();
	$css   = '';
	$merge = $a;
	foreach ( SNN_Style::VIEW_WIDTHS as $view => $width ) {
		if ( empty( $own[ $view ] ) ) {
			continue;
		}
		$merge  = array_merge( $merge, $own[ $view ] );
		$before = implode( ';', SNN_Style_Props::overlay( $merge ) );
		$css   .= '@media (max-width:' . $width . 'px){.%CLASS%{' . SNN_Style::style( $merge, $dyn, true ) . '}.%CLASS%::before{' . ( '' !== $before ? $before : 'content:none' ) . '}}';
	}
	return $css;
}

/** Declarations of a "a:b;c:d" text, as a map. */
function decl_map( $text ) {
	$map = array();
	foreach ( explode( ';', (string) $text ) as $d ) {
		if ( '' === $d ) {
			continue;
		}
		$parts = explode( ':', $d, 2 );
		if ( 2 === count( $parts ) ) {
			$map[ $parts[0] ] = $parts[1];
		}
	}
	return $map;
}

/**
 * The effective style at one width: the base declarations, then each media rule that applies to that width (a rule
 * for a wider view applies at every narrower width too), in the order the rules come. Returns the declarations and the
 * overlay (the ::before text, with content:none read as no overlay).
 */
function effective( $base, $base_before, $views, $width ) {
	$map    = decl_map( $base );
	$before = $base_before;
	preg_match_all( '/@media \(max-width:(\d+)px\)\{((?:\.%CLASS%(?:::before)?\{[^}]*\})*)\}/', $views, $media, PREG_SET_ORDER );
	foreach ( $media as $rule ) {
		if ( $width > (int) $rule[1] ) {
			continue;
		}
		preg_match_all( '/\.%CLASS%(::before)?\{([^}]*)\}/', $rule[2], $parts, PREG_SET_ORDER );
		foreach ( $parts as $part ) {
			if ( '' === $part[1] ) {
				$map = array_merge( $map, decl_map( $part[2] ) );
			} else {
				$before = $part[2];
			}
		}
	}
	if ( 'content:none' === $before ) {
		$before = '';
	}
	ksort( $map );
	return array( $map, $before );
}

/** The effective style of a case at the three widths, as the old rules and as the current rules give it. */
function compare_case( array $a, array $dyn ) {
	$base        = SNN_Style::style( $a, $dyn );
	$base_before = implode( ';', SNN_Style_Props::overlay( $a ) );
	$old         = old_view_rules( $a, $dyn );
	$new         = SNN_Style::view_rules( $a, $dyn );
	$widths      = array( 1600, 900, 400 );
	foreach ( $widths as $w ) {
		$was = effective( $base, $base_before, $old, $w );
		$now = effective( $base, $base_before, $new, $w );
		if ( $was !== $now ) {
			return array( false, "width $w\n  base: $base | before: $base_before\n  old: $old\n  new: $new\n  was: " . json_encode( $was ) . "\n  now: " . json_encode( $now ), $old, $new );
		}
	}
	return array( true, '', $old, $new );
}

$dyn = array(
	'post_id' => 0,
	'index'   => null,
	'count'   => null,
);

// Fixed cases first.
$gap_only = array(
	'display'    => 'flex',
	'gap'        => '24',
	'responsive' => array( 'tablet' => array( 'gap' => '16' ) ),
);
// Only the values that change are written. A block with no display is a block; the view flag writes display:block only in
// a view whose display differs from the layer above (SNN_Style_Props::declarations()).
$new = SNN_Style::view_rules( $gap_only, $dyn );
view_check( 'a tablet gap: the rule holds the tablet gap only (the display is the same)', '@media (max-width:991px){.%CLASS%{gap:16px}}' === $new, $new );

$same = array(
	'display'    => 'flex',
	'gap'        => '24',
	'responsive' => array( 'tablet' => array( 'gap' => '24' ) ),
);
$same_css = SNN_Style::view_rules( $same, $dyn );
view_check( 'a tablet value equal to the base adds no rule', '' === $same_css, $same_css );

$back = array(
	'display'    => 'flex',
	'gap'        => '24',
	'responsive' => array(
		'tablet' => array( 'gap' => '16' ),
		'mobile' => array( 'gap' => '24' ),
	),
);
$back_css = SNN_Style::view_rules( $back, $dyn );
view_check( 'mobile back to the base value is written (the tablet rule is above it)', '@media (max-width:991px){.%CLASS%{gap:16px}}@media (max-width:478px){.%CLASS%{gap:24px}}' === $back_css, $back_css );

// A property written twice (a fixed max-width sets the side margins): the last value decides, in the rule too.
$twice = array(
	'maxWidth'   => '60',
	'marginLeft' => '4rem',
	'responsive' => array( 'tablet' => array( 'marginLeft' => '4rem' ) ),
);
$twice_css = SNN_Style::view_rules( $twice, $dyn );
view_check( 'a margin set after the side margins of max-width is the tablet value', false === strpos( $twice_css, 'margin-left:auto' ), $twice_css );

// Random cases: the effective style at each width is the same as before.
mt_srand( 20261111 );
$pool  = require __DIR__ . '/style-pool.php';
$keys  = array_keys( $pool );
$cases = 1500;
$bad   = 0;
$old_bytes = 0;
$new_bytes = 0;
for ( $i = 0; $i < $cases; $i++ ) {
	$a = array();
	for ( $n = mt_rand( 1, 6 ); $n > 0; $n-- ) {
		$key = $keys[ mt_rand( 0, count( $keys ) - 1 ) ];
		$a[ $key ] = $pool[ $key ][ mt_rand( 0, count( $pool[ $key ] ) - 1 ) ];
	}
	$a['responsive'] = array();
	foreach ( array( 'tablet', 'mobile' ) as $view ) {
		if ( ! mt_rand( 0, 2 ) ) {
			continue;
		}
		$own = array();
		for ( $n = mt_rand( 1, 5 ); $n > 0; $n-- ) {
			$key = $keys[ mt_rand( 0, count( $keys ) - 1 ) ];
			$own[ $key ] = $pool[ $key ][ mt_rand( 0, count( $pool[ $key ] ) - 1 ) ];
		}
		$a['responsive'][ $view ] = $own;
	}
	list( $ok, $where, $old, $now ) = compare_case( $a, $dyn );
	$old_bytes += strlen( $old );
	$new_bytes += strlen( $now );
	if ( ! $ok ) {
		++$bad;
		if ( $bad <= 1 ) {
			echo "case $i differs at $where\n";
		}
	}
}
view_check( "$cases random cases: the same effective style at every width", 0 === $bad, "$bad differ" );

// The rules are shorter than before: the sum of the rule texts over the random cases.
view_check( 'the view rules are shorter than the whole-style rules', $new_bytes < $old_bytes, "new $new_bytes bytes, old $old_bytes bytes" );

echo "\n$pass passed, $fail failed\n";
echo "random cases: view text " . $new_bytes . " bytes now, " . $old_bytes . " bytes before\n";
exit( $fail ? 1 : 0 );
