/**
 * SNN block editor: the migrations, the editor's copy of engine/migrations.php. A block saved in an older shape is
 * brought to the current shape when the editor loads it (register.js runs run() through a deprecation that is eligible
 * for every block whose version is older), and the next save writes it in the new shape.
 *
 * Keep the steps equal to the PHP ones: tests/migrations-test.php writes cases that tests/migrations.js runs here.
 * Every step must change nothing on attributes already in the new shape.
 */
( function ( root ) {
	const snn = ( root.snn = root.snn || {} );
	const info = ( snn.data && snn.data.migrations ) || { version: 2, key: 'snnVersion' };
	const VERSION = info.version;
	const KEY = info.key;
	const PAIR = [ 'gradientColor1', 'gradientStop1', 'gradientColor2', 'gradientStop2' ];
	const LEVELS = [ 'base', 'tablet', 'mobile' ];

	/** The attributes of older shapes: the deprecation declares them, so the parser hands them to the steps. */
	const LEGACY_ATTRIBUTES = {
		hoverStyle: { type: 'object' },
		animation: { type: 'array' },
		gradientColor1: { type: 'string' },
		gradientStop1: { type: 'string' },
		gradientColor2: { type: 'string' },
		gradientStop2: { type: 'string' },
	};

	const isObj = ( v ) => !! v && typeof v === 'object' && ! Array.isArray( v );
	const filled = ( v ) => ( typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean' ) && String( v ) !== '';
	const without = ( o, keys ) => Object.fromEntries( Object.entries( o ).filter( ( [ k ] ) => keys.indexOf( k ) === -1 ) );

	/** The version saved attributes were written in: 1 when they have none. */
	function versionOf( raw ) {
		const v = Number( raw && raw[ KEY ] );
		return Number.isFinite( v ) && v > 1 ? Math.floor( v ) : 1;
	}

	/** True when the block needs the steps (its version is older). */
	function needs( raw ) {
		return versionOf( raw || {} ) < VERSION;
	}

	/* Version 2 ------------------------------------------------------------ */

	function hoverIntoStates( a ) {
		if ( ! Object.prototype.hasOwnProperty.call( a, 'hoverStyle' ) ) {
			return a;
		}
		const hover = a.hoverStyle;
		const out = without( a, [ 'hoverStyle' ] );
		// PHP's empty() and a filled array: an object or a list with keys counts.
		if ( hover && typeof hover === 'object' && Object.keys( hover ).length ) {
			const states = isObj( out.states ) ? { ...out.states } : {};
			if ( ! states.hover || ! Object.keys( states.hover ).length ) {
				states.hover = hover;
			}
			out.states = states;
		}
		return out;
	}

	function pairLevel( level, above ) {
		const own = {};
		PAIR.forEach( ( k ) => {
			if ( filled( level[ k ] ) ) {
				own[ k ] = level[ k ];
			}
		} );
		const pair = { ...above, ...own };
		const out = without( level, PAIR );
		if ( ! Object.keys( own ).length ) {
			return { level: out, pair };
		}
		const c1 = String( pair.gradientColor1 === undefined ? '' : pair.gradientColor1 );
		const c2 = String( pair.gradientColor2 === undefined ? '' : pair.gradientColor2 );
		if ( ! out.gradientStops && c1 !== '' && c2 !== '' ) {
			const s1 = String( pair.gradientStop1 === undefined ? '' : pair.gradientStop1 );
			const s2 = String( pair.gradientStop2 === undefined ? '' : pair.gradientStop2 );
			out.gradientStops = JSON.stringify( [
				{ color: c1, stop: s1 === '' ? '0' : s1 },
				{ color: c2, stop: s2 === '' ? '100' : s2 },
			] );
		}
		return { level: out, pair };
	}

	function gradientPairIntoStops( a ) {
		const base = pairLevel( a, {} );
		let out = base.level;
		if ( isObj( out.responsive ) ) {
			const responsive = { ...out.responsive };
			let above = base.pair;
			[ 'tablet', 'mobile' ].forEach( ( view ) => {
				if ( isObj( responsive[ view ] ) ) {
					const done = pairLevel( responsive[ view ], above );
					responsive[ view ] = done.level;
					above = done.pair;
				}
			} );
			out = { ...out, responsive };
		}
		if ( isObj( out.states ) ) {
			const states = {};
			Object.keys( out.states ).forEach( ( id ) => {
				const state = out.states[ id ];
				if ( ! isObj( state ) ) {
					states[ id ] = state;
					return;
				}
				const next = { ...state };
				let above = base.pair;
				LEVELS.forEach( ( level ) => {
					if ( isObj( next[ level ] ) ) {
						const done = pairLevel( next[ level ], above );
						next[ level ] = done.level;
						above = done.pair;
					}
				} );
				states[ id ] = next;
			} );
			out = { ...out, states };
		}
		return out;
	}

	function legacyPosition( v ) {
		if ( /^\d+(\.\d+)?%$/.test( v ) ) {
			return 'top ' + v;
		}
		if ( /^\d+(\.\d+)?(px)?$/i.test( v ) ) {
			return 'top+=' + v;
		}
		return v;
	}

	function animationIntoTweens( a ) {
		if ( ! Object.prototype.hasOwnProperty.call( a, 'animation' ) ) {
			return a;
		}
		const list = a.animation;
		const out = without( a, [ 'animation' ] );
		const tweens = Array.isArray( out.gsapTweens ) ? out.gsapTweens : [];
		if ( tweens.length || ! Array.isArray( list ) || ! list.length ) {
			return out;
		}
		const scroll = { on: true, start: 'top 80%', end: 'bottom 20%', scrub: false, once: true, markers: false, loop: false };
		const presets = [];
		list.forEach( ( token ) => {
			const t = ( typeof token === 'string' || typeof token === 'number' || typeof token === 'boolean' ? String( token ) : '' ).trim();
			if ( t === 'scroll:false' ) {
				scroll.on = false;
			} else if ( t === 'markers:true' ) {
				scroll.markers = true;
			} else if ( t === 'loop:true' ) {
				scroll.loop = true;
			} else if ( t === 'once:true' ) {
				scroll.once = true;
			} else if ( t.indexOf( 'scrub:' ) === 0 ) {
				scroll.scrub = true;
			} else if ( t.indexOf( 'start:' ) === 0 ) {
				scroll.start = legacyPosition( t.slice( 6 ) );
			} else if ( t.indexOf( 'end:' ) === 0 ) {
				scroll.end = legacyPosition( t.slice( 4 ) );
			} else if ( t !== '' && t.indexOf( 'pin:' ) !== 0 ) {
				presets.push( t );
			}
		} );
		out.gsapScroll = scroll;
		if ( presets.length ) {
			out.gsapTweens = [ { presets, start: 0, duration: 1, stagger: 0, ease: 'power1.out', from: {}, to: {} } ];
		}
		return out;
	}

	/** The steps of each version, in order (the same as SNN_Block_Migrations::steps()). */
	const STEPS = {
		2: [ hoverIntoStates, gradientPairIntoStops, animationIntoTweens ],
	};

	/** The attributes in the current shape, with the current version. The block's own migrate (snn.registerBlock) runs last. */
	function run( raw, name ) {
		let a = isObj( raw ) ? { ...raw } : {};
		const from = versionOf( a );
		if ( from >= VERSION ) {
			return a;
		}
		Object.keys( STEPS )
			.map( Number )
			.sort( ( x, y ) => x - y )
			.forEach( ( version ) => {
				if ( from < version ) {
					STEPS[ version ].forEach( ( step ) => {
						a = step( a );
					} );
				}
			} );
		const own = name && snn.blocks && snn.blocks[ name ] && snn.blocks[ name ].migrate;
		if ( typeof own === 'function' ) {
			a = own( a, from ) || a;
		}
		a[ KEY ] = VERSION;
		return a;
	}

	snn.migrations = { VERSION, KEY, LEGACY_ATTRIBUTES, needs, run, versionOf };
} )( typeof window !== 'undefined' ? window : globalThis );
