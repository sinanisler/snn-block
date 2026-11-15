<?php
/**
 * Migrations: a saved block in an older shape is brought to the current shape before anything reads it, so the rest of
 * the engine knows only one shape and old keys can be removed from the code.
 *
 * Every block carries snnVersion, the engine version its attributes were written in (1 when it has none: written before
 * versions existed). SNN_Blocks::clean() runs run() first, on the front end and in REST; the editor runs the same steps
 * (editor/migrations.js) when it loads the block, and saves the block in the new shape with the next save.
 *
 * A step is a function of the raw attributes that returns them in the new shape. Every step must be safe to run on
 * attributes that are already in the new shape (it changes nothing then), because a block with no version runs every
 * step. A block class can add its own steps in migrate() (see SNN_Block). The editor's copy must do the same:
 * editor/migrations.js, checked by tests/migrations-test.php and tests/migrations.js.
 *
 * To change a shape: raise VERSION, add the step under the new version in steps(), add its copy to migrations.js,
 * then remove the old key from the code.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class SNN_Block_Migrations {

	/** The engine version of the attribute shape. */
	const VERSION = 2;

	/** The attribute that holds a block's version. */
	const KEY = 'snnVersion';

	/** The gradient's two colour fields from before the stops list (version 1). */
	const GRADIENT_PAIR = array( 'gradientColor1', 'gradientStop1', 'gradientColor2', 'gradientStop2' );

	/** The steps of each version, in order: version => method names of this class. */
	public static function steps() {
		return array(
			2 => array( 'hover_into_states', 'gradient_pair_into_stops', 'animation_into_tweens' ),
		);
	}

	/** The version saved attributes were written in: 1 when they have none. */
	public static function version_of( array $raw ) {
		$v = $raw[ self::KEY ] ?? 1;
		return is_numeric( $v ) ? max( 1, (int) $v ) : 1;
	}

	/** The attributes in the current shape, with the current version. */
	public static function run( array $raw, $class ) {
		$from = self::version_of( $raw );
		if ( $from >= self::VERSION ) {
			return $raw;
		}
		foreach ( self::steps() as $version => $steps ) {
			if ( $from < $version ) {
				foreach ( $steps as $step ) {
					$raw = call_user_func( array( __CLASS__, $step ), $raw );
				}
			}
		}
		if ( $class && method_exists( $class, 'migrate' ) ) {
			$raw = (array) call_user_func( array( $class, 'migrate' ), $raw, $from );
		}
		$raw[ self::KEY ] = self::VERSION;
		return $raw;
	}

	/* ------------------------------------------------------------------
	 * Version 2
	 * ---------------------------------------------------------------- */

	/** The hover state moves from hoverStyle into the states attribute, beside the other states. */
	public static function hover_into_states( array $a ) {
		if ( ! array_key_exists( 'hoverStyle', $a ) ) {
			return $a;
		}
		$hover = $a['hoverStyle'];
		unset( $a['hoverStyle'] );
		if ( is_array( $hover ) && $hover ) {
			$states = isset( $a['states'] ) && is_array( $a['states'] ) ? $a['states'] : array();
			if ( empty( $states['hover'] ) ) {
				$states['hover'] = $hover;
			}
			$a['states'] = $states;
		}
		return $a;
	}

	/**
	 * The two colour fields of the gradient become its stops list, on the base, on each view and in each state level.
	 * A level that sets one of the four fields gets the list of the pair as it applied there (the level above filled
	 * in), and only when both colours are set: before, a gradient with one colour printed nothing.
	 */
	public static function gradient_pair_into_stops( array $a ) {
		$base = self::pair_level( $a, array() );
		$a    = $base['level'];
		if ( isset( $a['responsive'] ) && is_array( $a['responsive'] ) ) {
			$above = $base['pair'];
			foreach ( array( 'tablet', 'mobile' ) as $view ) {
				if ( isset( $a['responsive'][ $view ] ) && is_array( $a['responsive'][ $view ] ) ) {
					$done                      = self::pair_level( $a['responsive'][ $view ], $above );
					$a['responsive'][ $view ] = $done['level'];
					$above                     = $done['pair'];
				}
			}
		}
		if ( isset( $a['states'] ) && is_array( $a['states'] ) ) {
			foreach ( $a['states'] as $id => $state ) {
				if ( ! is_array( $state ) ) {
					continue;
				}
				$above = $base['pair'];
				foreach ( array( 'base', 'tablet', 'mobile' ) as $level ) {
					if ( isset( $state[ $level ] ) && is_array( $state[ $level ] ) ) {
						$done            = self::pair_level( $state[ $level ], $above );
						$state[ $level ] = $done['level'];
						$above           = $done['pair'];
					}
				}
				$a['states'][ $id ] = $state;
			}
		}
		return $a;
	}

	/**
	 * One level of values: its pair (merged over the pair of the level above), and the level without the pair, with the
	 * stops list written when it set part of the pair and has no list of its own.
	 */
	private static function pair_level( array $level, array $above ) {
		$own = array_intersect_key( $level, array_flip( self::GRADIENT_PAIR ) );
		$own = array_filter(
			$own,
			function ( $v ) {
				return is_scalar( $v ) && '' !== (string) $v;
			}
		);
		$pair = array_merge( $above, $own );
		if ( ! $own ) {
			return array( 'level' => array_diff_key( $level, array_flip( self::GRADIENT_PAIR ) ), 'pair' => $pair );
		}
		$level = array_diff_key( $level, array_flip( self::GRADIENT_PAIR ) );
		$c1    = (string) ( $pair['gradientColor1'] ?? '' );
		$c2    = (string) ( $pair['gradientColor2'] ?? '' );
		if ( empty( $level['gradientStops'] ) && '' !== $c1 && '' !== $c2 ) {
			$s1                     = (string) ( $pair['gradientStop1'] ?? '' );
			$s2                     = (string) ( $pair['gradientStop2'] ?? '' );
			$level['gradientStops'] = (string) wp_json_encode(
				array(
					array( 'color' => $c1, 'stop' => '' === $s1 ? '0' : $s1 ),
					array( 'color' => $c2, 'stop' => '' === $s2 ? '100' : $s2 ),
				)
			);
		}
		return array( 'level' => $level, 'pair' => $pair );
	}

	/**
	 * The older animation list becomes one GSAP tween, exactly as the Animations pane has shown it since the tweens came
	 * (fromLegacy() in controls/animation-pane.js): the Scroll Trigger tokens set the Scroll Trigger, pin is dropped, and
	 * the other tokens are the tween's presets (start 0, 1 s, power1.out). A block that has tweens keeps them; the list
	 * goes either way.
	 */
	public static function animation_into_tweens( array $a ) {
		if ( ! array_key_exists( 'animation', $a ) ) {
			return $a;
		}
		$list = $a['animation'];
		unset( $a['animation'] );
		$tweens = isset( $a['gsapTweens'] ) && is_array( $a['gsapTweens'] ) ? $a['gsapTweens'] : array();
		if ( $tweens || ! is_array( $list ) || ! $list ) {
			return $a;
		}
		$scroll  = array( 'on' => true, 'start' => 'top 80%', 'end' => 'bottom 20%', 'scrub' => false, 'once' => true, 'markers' => false, 'loop' => false );
		$presets = array();
		foreach ( $list as $token ) {
			$t = trim( (string) ( is_scalar( $token ) ? $token : '' ) );
			if ( 'scroll:false' === $t ) {
				$scroll['on'] = false;
			} elseif ( 'markers:true' === $t ) {
				$scroll['markers'] = true;
			} elseif ( 'loop:true' === $t ) {
				$scroll['loop'] = true;
			} elseif ( 'once:true' === $t ) {
				$scroll['once'] = true;
			} elseif ( 0 === strpos( $t, 'scrub:' ) ) {
				$scroll['scrub'] = true;
			} elseif ( 0 === strpos( $t, 'start:' ) ) {
				$scroll['start'] = self::legacy_position( substr( $t, 6 ) );
			} elseif ( 0 === strpos( $t, 'end:' ) ) {
				$scroll['end'] = self::legacy_position( substr( $t, 4 ) );
			} elseif ( '' !== $t && 0 !== strpos( $t, 'pin:' ) ) {
				$presets[] = $t;
			}
		}
		$a['gsapScroll'] = $scroll;
		if ( $presets ) {
			$a['gsapTweens'] = array(
				array(
					'presets'  => $presets,
					'start'    => 0,
					'duration' => 1,
					'stagger'  => 0,
					'ease'     => 'power1.out',
					'from'     => array(),
					'to'       => array(),
				),
			);
		}
		return $a;
	}

	/** An old start or end: a percent is "top N%", a number "top+=N", anything else as written (legacyPosition()). */
	private static function legacy_position( $v ) {
		if ( preg_match( '/^\d+(\.\d+)?%$/', $v ) ) {
			return 'top ' . $v;
		}
		if ( preg_match( '/^\d+(\.\d+)?(px)?$/i', $v ) ) {
			return 'top+=' . $v;
		}
		return $v;
	}
}
