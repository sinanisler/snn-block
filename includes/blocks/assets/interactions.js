/**
 * SNN interactions: the front end script for the interactions set on the SNN layout blocks.
 *
 * Each block that has interactions carries them in data-snn-interactions (written by
 * includes/blocks/block-tools.php). A trigger (a click, the mouse entering or leaving, the element
 * entering the viewport once, or the page loading) runs an action on the block itself or on the element
 * with the CSS ID given: show, hide, toggle, add or remove classes, or scroll to it.
 *
 * Hidden elements get the class snn-is-hidden. The rule is added here, so no stylesheet is needed.
 */
( function () {
	'use strict';

	var HIDDEN = 'snn-is-hidden';

	function addRule() {
		var style = document.createElement( 'style' );
		style.textContent = '.' + HIDDEN + '{display:none!important}';
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
			case 'animate':
				// The entrance preset: the GSAP runtime plays it once, when the element is in view (scroll:false).
				if ( spec.value && window.createDataAnimate ) {
					window.createDataAnimate( t, spec.value + ',scroll:false' );
				}
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
