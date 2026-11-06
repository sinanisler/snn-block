/**
 * SNN interactions: the front end script for the interactions set on the SNN layout blocks.
 *
 * Each block that has interactions carries them in data-snn-interactions (written by
 * includes/blocks/block-tools.php). A trigger (a click, the mouse entering or leaving, the element
 * entering the viewport once, or the page loading) runs an action on the block itself or on the element
 * with the CSS ID given: show, hide, toggle, add or remove classes, scroll to it, or start an animation.
 *
 * Start animation plays one of the normal animations (fade in, slide, zoom, bounce and so on) with the Web
 * Animations API, so it needs no GSAP. The names follow Bricks. A name with "In" in it starts hidden
 * (data-snn-hidden-on-load) and shows when it runs, as Bricks does. The GSAP animations are a separate
 * system (assets/js/gsap-data-animate.js).
 *
 * Hidden elements get the class snn-is-hidden. The rules are added here, so no stylesheet is needed.
 */
( function () {
	'use strict';

	var HIDDEN = 'snn-is-hidden';
	var HIDDEN_ON_LOAD = 'data-snn-hidden-on-load';

	/* ------------------------------------------------------------------
	 * The normal animations: keyframes for element.animate(). The keys are the values
	 * of block-tools.php (animation_types). A key with no keyframes here does nothing.
	 * ---------------------------------------------------------------- */

	/** Where a slide or fade comes from (In) and where it goes (Out), as percentages of the element's size. */
	var IN = { Up: [ 0, 100 ], Down: [ 0, -100 ], Left: [ -100, 0 ], Right: [ 100, 0 ] };
	var OUT = { Up: [ 0, -100 ], Down: [ 0, 100 ], Left: [ -100, 0 ], Right: [ 100, 0 ] };

	function move( p ) {
		return 'translate3d(' + p[ 0 ] + '%,' + p[ 1 ] + '%,0)';
	}

	/** A flip around the X or Y axis: In turns from 90 degrees to flat, Out turns from flat to 90 degrees. */
	function flip( axis, inward ) {
		var flat = { opacity: 1, transform: 'perspective(400px) rotate' + axis + '(0deg)' };
		var turned = { opacity: 0, transform: 'perspective(400px) rotate' + axis + '(90deg)' };
		return inward ? [ turned, flat ] : [ flat, turned ];
	}

	/** Shakes 10 steps along one axis, 10 px each way, as Bricks' shake presets do. */
	function shake( axis ) {
		var out = [];
		for ( var i = 0; i <= 10; i++ ) {
			var v = i === 0 || i === 10 ? 0 : i % 2 ? -10 : 10;
			out.push( { transform: axis === 'x' ? 'translate3d(' + v + 'px,0,0)' : 'translate3d(0,' + v + 'px,0)', offset: i / 10 } );
		}
		return out;
	}

	/** Keyframes from a list of values, each placed at its offset (0 to 1). */
	function steps( values, offsets, css, origin ) {
		return values.map( function ( v, i ) {
			var frame = { transform: css( v ), offset: offsets[ i ] };
			if ( origin ) {
				frame.transformOrigin = origin;
			}
			return frame;
		} );
	}

	var PRESETS = {
		fadeIn: [ { opacity: 0 }, { opacity: 1 } ],
		fadeOut: [ { opacity: 1 }, { opacity: 0 } ],
		zoomIn: [ { opacity: 0, transform: 'scale3d(.3,.3,.3)' }, { opacity: 1, transform: 'none' } ],
		zoomOut: [ { opacity: 1, transform: 'none' }, { opacity: 0, transform: 'scale3d(.3,.3,.3)' } ],
		rotateIn: [ { opacity: 0, transform: 'rotate(-200deg)' }, { opacity: 1, transform: 'rotate(0deg)' } ],
		rotateOut: [ { opacity: 1, transform: 'rotate(0deg)' }, { opacity: 0, transform: 'rotate(200deg)' } ],
		flipInX: flip( 'X', true ),
		flipInY: flip( 'Y', true ),
		flipOutX: flip( 'X', false ),
		flipOutY: flip( 'Y', false ),
		bounce: steps( [ 0, 0, -30, -15, -8, -4, -2, 0 ], [ 0, 0.2, 0.4, 0.53, 0.7, 0.8, 0.9, 1 ], function ( y ) {
			return 'translate3d(0,' + y + 'px,0)';
		} ),
		pulse: [ { transform: 'scale3d(1,1,1)' }, { transform: 'scale3d(1.05,1.05,1.05)', offset: 0.5 }, { transform: 'scale3d(1,1,1)' } ],
		flash: [ { opacity: 1 }, { opacity: 0, offset: 0.25 }, { opacity: 1, offset: 0.5 }, { opacity: 0, offset: 0.75 }, { opacity: 1 } ],
		shakeX: shake( 'x' ),
		shakeY: shake( 'y' ),
		swing: steps( [ 0, 15, -10, 5, -5, 0 ], [ 0, 0.2, 0.4, 0.6, 0.8, 1 ], function ( d ) {
			return 'rotate(' + d + 'deg)';
		}, 'top center' ),
		wobble: [
			{ transform: 'none' },
			{ transform: 'translate3d(-25%,0,0) rotate(-5deg)', offset: 0.15 },
			{ transform: 'translate3d(20%,0,0) rotate(3deg)', offset: 0.3 },
			{ transform: 'translate3d(-15%,0,0) rotate(-3deg)', offset: 0.45 },
			{ transform: 'translate3d(10%,0,0) rotate(2deg)', offset: 0.6 },
			{ transform: 'translate3d(-5%,0,0) rotate(-1deg)', offset: 0.75 },
			{ transform: 'none' },
		],
		heartBeat: [
			{ transform: 'scale3d(1,1,1)' },
			{ transform: 'scale3d(1.3,1.3,1.3)', offset: 0.14 },
			{ transform: 'scale3d(1,1,1)', offset: 0.28 },
			{ transform: 'scale3d(1.3,1.3,1.3)', offset: 0.42 },
			{ transform: 'scale3d(1,1,1)', offset: 0.7 },
			{ transform: 'scale3d(1,1,1)' },
		],
	};
	[ 'Up', 'Down', 'Left', 'Right' ].forEach( function ( d ) {
		PRESETS[ 'fadeIn' + d ] = [ { opacity: 0, transform: move( IN[ d ] ) }, { opacity: 1, transform: 'none' } ];
		PRESETS[ 'fadeOut' + d ] = [ { opacity: 1, transform: 'none' }, { opacity: 0, transform: move( OUT[ d ] ) } ];
		PRESETS[ 'slideIn' + d ] = [ { transform: move( IN[ d ] ) }, { transform: 'none' } ];
		PRESETS[ 'slideOut' + d ] = [ { transform: 'none' }, { transform: move( OUT[ d ] ) } ];
	} );

	/* ------------------------------------------------------------------
	 * Running an action
	 * ---------------------------------------------------------------- */

	function addRule() {
		var style = document.createElement( 'style' );
		style.textContent = '.' + HIDDEN + '{display:none!important}[' + HIDDEN_ON_LOAD + ']{opacity:0}';
		document.head.appendChild( style );
	}

	/** The element an action acts on: the block itself, or the element with the given ID. */
	function targetOf( el, spec ) {
		if ( ! spec.target || spec.target === 'self' ) {
			return el;
		}
		return document.getElementById( spec.target );
	}

	function names( value ) {
		return String( value || '' ).split( /\s+/ ).filter( Boolean );
	}

	/** Start animation: plays the animation once on the target, after its delay, for its duration (both in ms). */
	function play( t, spec ) {
		t.removeAttribute( HIDDEN_ON_LOAD );
		var frames = PRESETS[ spec.value ];
		if ( ! frames || typeof t.animate !== 'function' ) {
			return;
		}
		t.animate( frames, {
			duration: typeof spec.duration === 'number' ? spec.duration : 1000,
			delay: typeof spec.delay === 'number' ? spec.delay : 0,
			easing: 'ease',
			fill: 'both',
		} );
	}

	function run( el, spec ) {
		var t = targetOf( el, spec );
		if ( ! t ) {
			return;
		}
		var list = names( spec.value );
		switch ( spec.action ) {
			case 'show':
				t.classList.remove( HIDDEN );
				break;
			case 'hide':
				t.classList.add( HIDDEN );
				break;
			case 'toggleClass':
				list.forEach( function ( n ) {
					t.classList.toggle( n );
				} );
				break;
			case 'addClass':
				list.forEach( function ( n ) {
					t.classList.add( n );
				} );
				break;
			case 'startAnimation':
				play( t, spec );
				break;
			case 'removeClass':
				list.forEach( function ( n ) {
					t.classList.remove( n );
				} );
				break;
			case 'scrollTo':
				t.scrollIntoView( { behavior: 'smooth', block: 'start' } );
				break;
		}
	}

	/** An In animation on the block itself starts hidden, so it does not show before its trigger (Bricks' rule). */
	function markHidden( el, spec ) {
		if ( spec.action === 'startAnimation' && ( ! spec.target || spec.target === 'self' ) && String( spec.value || '' ).indexOf( 'In' ) !== -1 ) {
			el.setAttribute( HIDDEN_ON_LOAD, '' );
		}
	}

	function arm( el, spec ) {
		var go = function () {
			run( el, spec );
		};
		switch ( spec.trigger ) {
			case 'click':
				el.addEventListener( 'click', go );
				break;
			case 'mouseenter':
				el.addEventListener( 'mouseenter', go );
				break;
			case 'mouseleave':
				el.addEventListener( 'mouseleave', go );
				break;
			case 'pageLoad':
				go();
				break;
			case 'enterView':
				if ( 'IntersectionObserver' in window ) {
					var observer = new IntersectionObserver(
						function ( entries, obs ) {
							entries.forEach( function ( entry ) {
								if ( entry.isIntersecting ) {
									obs.unobserve( entry.target );
									go();
								}
							} );
						},
						{ threshold: 0.1 }
					);
					observer.observe( el );
				} else {
					go();
				}
				break;
		}
	}

	function init() {
		addRule();
		document.querySelectorAll( '[data-snn-interactions]' ).forEach( function ( el ) {
			var list;
			try {
				list = JSON.parse( el.getAttribute( 'data-snn-interactions' ) );
			} catch ( e ) {
				return;
			}
			if ( ! Array.isArray( list ) ) {
				return;
			}
			list.forEach( function ( spec ) {
				markHidden( el, spec );
				arm( el, spec );
			} );
		} );
	}

	if ( document.readyState === 'loading' ) {
		document.addEventListener( 'DOMContentLoaded', init );
	} else {
		init();
	}
} )();
