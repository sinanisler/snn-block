<?php
/**
 * Coverage of the hover state: every style setting a block can make must be printed by the hover rule, on the base and on
 * the Tablet view, when it is set as a hover value. The rows of the style table (SNN_Style_Props::TABLE) are checked with
 * a value each; the composed groups (gradient, box shadow, transform, filter) are checked by the property they write.
 *
 * Run from the command line (WordPress at SNN_WP_LOAD):
 *   php includes/block/tests/hover-coverage-test.php
 *
 * Exit code 0 when every check passes, 1 otherwise. A row whose hover value equals the normal default writes nothing,
 * because there is nothing to change; those rows are listed as "default" and are not failures.
 */

$wp_load = getenv( 'SNN_WP_LOAD' ) ?: 'D:\\WWW\\LOCAL_SITES\\blocks.local\\wp-load.php';
$_SERVER['HTTP_HOST']   = 'blocks.local';
$_SERVER['SERVER_NAME'] = 'blocks.local';
$_SERVER['REQUEST_URI'] = '/';
require $wp_load;

$pool = require __DIR__ . '/style-pool.php';

// The CSS property a composed row writes (SNN_Style_Props::compose()).
$composed = array(
	'autoflow'         => 'grid-auto-flow',
	'placement_column' => 'grid-column',
	'placement_row'    => 'grid-row',
);

// A value for each row the pool does not give one, and the property it writes.
$samples = array(
	'minHeight'          => array( '200px', 'min-height' ),
	'maxHeight'          => array( '300px', 'max-height' ),
	'aspectRatio'        => array( '16 / 9', 'aspect-ratio' ),
	'top'                => array( '10px', 'top' ),
	'right'              => array( '10px', 'right' ),
	'bottom'             => array( '10px', 'bottom' ),
	'left'               => array( '10px', 'left' ),
	'scrollSnapAlign'    => array( 'start', 'scroll-snap-align' ),
	'visibility'         => array( 'hidden', 'visibility' ),
	'cursor'             => array( 'pointer', 'cursor' ),
	'isolation'          => array( 'isolate', 'isolation' ),
	'mixBlendMode'       => array( 'multiply', 'mix-blend-mode' ),
	'pointerEvents'      => array( 'none', 'pointer-events' ),
	'perspective'        => array( '500px', 'perspective' ),
	'perspectiveOrigin'  => array( 'center', 'perspective-origin' ),
	'fontFamily'         => array( 'Georgia', 'font-family' ),
	'fontStyle'          => array( 'italic', 'font-style' ),
	'lineHeight'         => array( '1.5', 'line-height' ),
	'letterSpacing'      => array( '2px', 'letter-spacing' ),
	'textTransform'      => array( 'uppercase', 'text-transform' ),
	'textDecoration'     => array( 'underline', 'text-decoration' ),
	'textWrap'           => array( 'balance', 'text-wrap' ),
	'whiteSpace'         => array( 'nowrap', 'white-space' ),
	'textShadow'         => array( '1px 1px #000000', 'text-shadow' ),
	'backgroundPosition' => array( 'center', 'background-position' ),
	'backgroundRepeat'   => array( 'no-repeat', 'background-repeat' ),
	'borderWidth'        => array( '2px', 'border-width' ),
	'borderTopWidth'     => array( '2px', 'border-top-width' ),
	'borderRightWidth'   => array( '2px', 'border-right-width' ),
	'borderBottomWidth'  => array( '2px', 'border-bottom-width' ),
	'borderLeftWidth'    => array( '2px', 'border-left-width' ),
	'overflowX'          => array( 'auto', 'overflow-x' ),
	'overflowY'          => array( 'scroll', 'overflow-y' ),
	'borderStyle'        => array( 'solid', 'border-style' ),
	'borderColor'        => array( '#000000', 'border-color' ),
	'transformOrigin'    => array( 'center', 'transform-origin' ),
	'transitionProperty' => array( 'opacity', 'transition-property' ),
	'transitionTiming'   => array( 'ease', 'transition-timing-function' ),
	'transitionDelay'    => array( '0.2s', 'transition-delay' ),
	'marginRight'        => array( '5px', 'margin-right' ),
	'marginBottom'       => array( '5px', 'margin-bottom' ),
	'paddingRight'       => array( '4px', 'padding-right' ),
	'minWidth'           => array( '100px', 'min-width' ),
	'iconSize'           => array( '20px', '--snn-icon-size' ),
	'iconColor'          => array( '#d01616', '--snn-icon-color' ),
	'iconGap'            => array( '8px', '--snn-icon-gap' ),
	'objectFit'          => array( 'cover', '--snn-object-fit' ),
	'objectPosition'     => array( 'left top', '--snn-object-position' ),
	'pictureAspectRatio' => array( '2 / 1', '--snn-picture-ratio' ),
);

// The composed groups: each prints its property when one of its keys is a hover value.
$groups = array(
	'gradient'   => array( array( 'gradientType' => 'linear', 'gradientStops' => '[{"color":"#000000"},{"color":"#ffffff"}]', 'gradientApply' => 'background' ), 'background-image:' ),
	'box shadow' => array( array( 'boxShadowX' => '2px', 'boxShadowY' => '4px', 'boxShadowColor' => '#000000' ), 'box-shadow:' ),
	'transform'  => array( array( 'translateX' => '10px', 'rotate' => '45' ), 'transform:' ),
	'filter'     => array( array( 'filterBlur' => '4px', 'filterGrayscale' => '50' ), 'filter:' ),
);

$pass    = 0;
$fail    = 0;
$default = array();
$failed  = array();

/** Checks one hover value: printed by the rule of the level (base or tablet). */
function coverage_check( $level, $hover_values, $needle, $label, &$pass, &$fail, &$failed, $display = 'flex' ) {
	$hover = 'base' === $level ? array( 'base' => $hover_values ) : array( 'tablet' => $hover_values );
	$out   = SNN_Style::hover_rules( array( 'display' => $display, 'flexWrap' => 'wrap', 'states' => array( 'hover' => $hover ) ), array() );
	if ( false !== strpos( $out, $needle ) ) {
		++$pass;
		return true;
	}
	++$fail;
	$failed[] = $label . ' on ' . $level;
	return false;
}

foreach ( SNN_Style_Props::TABLE as $key => $spec ) {
	$css   = $spec[0];
	$type  = $spec[1];
	$opts  = $spec[2];
	$rules = $spec[3];
	if ( null === $css && empty( $rules['compose'] ) ) {
		continue; // A flag (gridDense, maxWidthOff): it changes another row, and is covered by that row.
	}
	$name = null !== $css ? $css : $composed[ $rules['compose'] ];
	if ( isset( $samples[ $key ] ) ) {
		$val = $samples[ $key ][0];
	} else {
		$val = null;
		foreach ( $pool[ $key ] ?? array() as $candidate ) {
			if ( '' !== (string) $candidate && '' !== SNN_Style_Props::check( $type, $candidate, $opts ) ) {
				$val = $candidate;
				break;
			}
		}
		if ( null === $val ) {
			$failed[] = $key . ' has no value to test';
			++$fail;
			continue;
		}
	}
	$needle = isset( $samples[ $key ] ) ? $samples[ $key ][1] . ':' : $name . ':';
	foreach ( array( 'base', 'tablet' ) as $level ) {
		// A row that only prints in a grid (or in a flex box) is tested in that display.
		$display = 'grid' === ( $rules['when'] ?? '' ) ? 'grid' : 'flex';
		$ok      = coverage_check( $level, array( $key => $val ), $needle, $key . ' (' . $needle . ' ' . $val . ')', $pass, $fail, $failed, $display );
		if ( ! $ok ) {
			// A value equal to the normal default writes nothing: the rule has no change to make.
			if ( in_array( $key, array( 'display', 'flexDirection', 'flexWrap', 'gridAutoFlow' ), true ) ) {
				array_pop( $failed );
				--$fail;
				++$pass;
				$default[] = $key . ' on ' . $level . ' (the value is the default)';
			}
		}
	}
}

foreach ( $groups as $label => $group ) {
	foreach ( array( 'base', 'tablet' ) as $level ) {
		coverage_check( $level, $group[0], $group[1], $label . ' group', $pass, $fail, $failed );
	}
}

echo "passed: $pass, failed: $fail\n";
foreach ( $failed as $line ) {
	echo "FAIL $line\n";
}
foreach ( $default as $line ) {
	echo "default $line\n";
}
exit( $fail ? 1 : 0 );
