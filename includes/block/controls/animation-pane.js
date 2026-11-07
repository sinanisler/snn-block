/**
 * SNN GSAP pane: the Animations sub-panel of a block (the Animations icon). It edits the block's tweens and its
 * Scroll Trigger as a timeline: a ruler and bars (drag a bar to move it, drag its right edge to resize, drag the
 * ruler to scrub), the presets of the selected tween, its start, duration, stagger and ease, the from and to values,
 * and the Scroll Trigger switches. Play, rewind and scrubbing preview the block on the canvas, with the runtime the
 * front end uses (assets/js/gsap-data-animate.js, through window.createDataAnimate).
 *
 * The data written here is turned into the data-animate value by SNN_Animation::tweens_data_animate (animation.php).
 * toDataAnimate below writes the same text, for the canvas attribute and the preview.
 *
 * Loaded in the block editor (see includes/block/layout-blocks.php). Exposes window.snnAnimationPane.
 * Uses wp.element only, so it runs on the editor's own React.
 */
( function ( wp, C ) {
	const { createElement: h, Fragment, useState, useRef, useEffect, useLayoutEffect } = wp.element;
	const { __ } = wp.i18n;
	const { Row, Select, Accordion, Switch, AnimationPicker, tipAttr } = C;
	const DATA = window.snnAnimationData || {};
	const EASES = DATA.eases || [ 'power2.out' ];
	const PRESET_GROUPS = ( ( window.snnControlsData || {} ).animations || [] ).filter( ( g ) => g.label !== 'Scroll' );
	const LABEL_W = 56;
	const LANE_MAX = 20;

	/** The properties of a tween: the key, the CSS name the runtime reads, the unit, and the value a new tween starts with. */
	const PROPS = [
		{ key: 'x', css: 'x', unit: 'px', def: 0 },
		{ key: 'y', css: 'y', unit: 'px', def: 0 },
		{ key: 'opacity', css: 'opacity', unit: '', def: 1 },
		{ key: 'scale', css: 'scale', unit: '', def: 1 },
		{ key: 'rotation', css: 'rotate', unit: 'deg', def: 0 },
		{ key: 'blur', css: 'filter', unit: 'px', def: 0 },
	];

	/** The Scroll Trigger of a block that has none set: the same as SNN_Animation::clean_scroll. */
	const DEFAULT_SCROLL = { on: true, start: 'top 80%', end: 'bottom 20%', scrub: false, once: true, markers: false, loop: false };

	/* ------------------------------------------------------------------
	 * The data: the same text as the server writes (SNN_Animation::tweens_data_animate)
	 * ---------------------------------------------------------------- */

	/** A number as the option text: no trailing zeros, no minus zero. */
	function num( n ) {
		const s = Number( n ).toFixed( 3 ).replace( /\.?0+$/, '' );
		return s === '' || s === '-0' ? '0' : s;
	}

	function valueText( p, v ) {
		return p.key === 'blur' ? 'blur(' + num( v ) + 'px)' : num( v ) + p.unit;
	}

	/** The options that come first in the first segment: the Scroll Trigger, or play when in view (and its loop). */
	function scrollOptions( sc, preview ) {
		if ( preview || ! sc.on ) {
			const off = [ 'scroll:false' ];
			if ( sc.loop && ! preview ) {
				off.push( 'loop:true' );
			}
			return off;
		}
		// Scrub and once are written both ways: the runtime scrubs a trigger that has no scrub option.
		const out = [
			'start:' + sc.start,
			'end:' + sc.end,
			sc.scrub ? 'scrub:true' : 'scrub:false',
			sc.once ? 'once:true' : 'once:false',
		];
		if ( sc.markers ) {
			out.push( 'markers:true' );
		}
		return out;
	}

	function hasMotion( t ) {
		return ( t.presets && t.presets.length > 0 ) || ( t.from && Object.keys( t.from ).length > 0 ) || ( t.to && Object.keys( t.to ).length > 0 );
	}

	/** The data-animate value of the tweens: one segment per tween, in the order of their start, joined by ';'. */
	function toDataAnimate( tweens, scroll, preview ) {
		const sc = { ...DEFAULT_SCROLL, ...( scroll || {} ) };
		const list = ( tweens || [] ).filter( hasMotion );
		const order = list.map( ( t, i ) => i ).sort( ( a, b ) => list[ a ].start - list[ b ].start || a - b );
		return order
			.map( ( i, n ) => {
				const t = list[ i ];
				const parts = n === 0 ? scrollOptions( sc, preview ) : [];
				if ( t.presets && t.presets.length ) {
					parts.push( t.presets.join( ', ' ) );
				}
				parts.push( 't_start:' + num( t.start ), 'duration:' + num( t.duration ), 'ease:' + t.ease );
				if ( t.stagger > 0 ) {
					parts.push( 'stagger:' + num( t.stagger ) );
				}
				[ [ 'from', 'style_start' ], [ 'to', 'style_end' ] ].forEach( ( [ side, prefix ] ) => {
					PROPS.forEach( ( p ) => {
						const v = t[ side ] ? t[ side ][ p.key ] : undefined;
						if ( v !== undefined && v !== null ) {
							parts.push( prefix + '-' + p.css + ':' + valueText( p, v ) );
						}
					} );
				} );
				return parts.join( ', ' );
			} )
			.join( ';' );
	}

	/** An old start or end value (50%, 100px) as the runtime's own text (top 50%, top+=100px). */
	function legacyPosition( v ) {
		if ( /^\d+(\.\d+)?%$/.test( v ) ) {
			return 'top ' + v;
		}
		if ( /^\d+(\.\d+)?(px)?$/i.test( v ) ) {
			return 'top+=' + v;
		}
		return v;
	}

	/**
	 * The older list of presets (block attribute animation) as tweens: the Scroll Trigger options move into the
	 * Scroll Trigger switches, the other presets become one tween that starts at 0 and lasts 1 s, as before.
	 */
	function fromLegacy( tokens ) {
		const scroll = { ...DEFAULT_SCROLL };
		const presets = [];
		( tokens || [] ).forEach( ( tok ) => {
			const t = String( tok ).trim();
			if ( t === 'scroll:false' ) {
				scroll.on = false;
			} else if ( t === 'markers:true' ) {
				scroll.markers = true;
			} else if ( t === 'loop:true' ) {
				scroll.loop = true;
			} else if ( t === 'once:true' ) {
				scroll.once = true;
			} else if ( /^scrub:/.test( t ) ) {
				scroll.scrub = true;
			} else if ( /^start:/.test( t ) ) {
				scroll.start = legacyPosition( t.slice( 6 ) );
			} else if ( /^end:/.test( t ) ) {
				scroll.end = legacyPosition( t.slice( 4 ) );
			} else if ( ! /^pin:/.test( t ) ) {
				presets.push( t );
			}
		} );
		const tweens = presets.length ? [ { presets, start: 0, duration: 1, stagger: 0, ease: 'power1.out', from: {}, to: {} } ] : [];
		return { tweens, scroll };
	}

	/** What the pane shows for a block: its tweens and Scroll Trigger, or the older presets converted to them. */
	function stateOf( a ) {
		const scroll = { ...DEFAULT_SCROLL, ...( a.gsapScroll && typeof a.gsapScroll === 'object' ? a.gsapScroll : {} ) };
		const tweens = Array.isArray( a.gsapTweens ) ? a.gsapTweens : [];
		if ( tweens.length || ! Array.isArray( a.animation ) || ! a.animation.length ) {
			return { tweens, scroll, legacy: false };
		}
		return { ...fromLegacy( a.animation ), legacy: true };
	}

	/** The data-animate of the canvas element (the editor's copy of the front end attribute). */
	function canvasDataAnimate( a ) {
		const st = stateOf( a );
		if ( st.legacy ) {
			return a.animation.join( ',' );
		}
		return toDataAnimate( st.tweens, st.scroll ) || undefined;
	}

	/* ------------------------------------------------------------------
	 * Small parts
	 * ---------------------------------------------------------------- */

	function icon( name ) {
		const paths = {
			rewind: [ 'M3 3h1.6v10H3z', 'M13 3 6.5 8l6.5 5z' ],
			play: [ 'M5 3l8 5-8 5z' ],
			pause: [ 'M4.5 3h2.4v10H4.5z', 'M9.1 3h2.4v10H9.1z' ],
		};
		return h(
			'svg',
			{ className: 'snn-anp-icon', viewBox: '0 0 16 16', 'aria-hidden': 'true', focusable: 'false' },
			( paths[ name ] || [] ).map( ( d, i ) => h( 'path', { key: i, d, fill: 'currentColor' } ) )
		);
	}

	/**
	 * A number typed in a text field. The text stays as typed ("0.", "-") while the field has the focus; it takes
	 * the value again on leaving. onCommit gets the number, or null when the field is cleared.
	 */
	function NumField( { value, label, placeholder, tip, onCommit } ) {
		const shown = value === undefined || value === null ? '' : String( value );
		const [ text, setText ] = useState( shown );
		const [ focused, setFocused ] = useState( false );
		useEffect( () => {
			if ( ! focused ) {
				setText( shown );
			}
		}, [ shown, focused ] );
		return h( 'input', {
			type: 'text',
			inputMode: 'decimal',
			className: 'snn-input snn-anp-num',
			value: text,
			placeholder: placeholder || '',
			spellCheck: false,
			autoComplete: 'off',
			'aria-label': label,
			...( tip ? tipAttr( tip ) : {} ),
			onFocus: () => setFocused( true ),
			onBlur: () => {
				setFocused( false );
				setText( shown );
			},
			onChange: ( e ) => {
				const v = e.target.value.trim();
				setText( e.target.value );
				if ( v === '' ) {
					onCommit( null );
				} else if ( /^-?(\d+\.?\d*|\.\d+)$/.test( v ) ) {
					onCommit( parseFloat( v ) );
				}
			},
		} );
	}

	/** The curve of an ease, drawn on the canvas: the same look as the timeline's lines. */
	function drawCurve( canvas, ease ) {
		if ( ! canvas || ! window.gsap || ! window.gsap.parseEase ) {
			return;
		}
		const x = canvas.getContext( '2d' );
		const W = canvas.width;
		const H = canvas.height;
		x.clearRect( 0, 0, W, H );
		x.strokeStyle = '#e0e0e0';
		x.lineWidth = 1;
		x.beginPath();
		x.moveTo( 0, H - 6 );
		x.lineTo( W, H - 6 );
		x.moveTo( 0, 6 );
		x.lineTo( W, 6 );
		x.stroke();
		const f = window.gsap.parseEase( ease );
		x.strokeStyle = '#3858e9';
		x.lineWidth = 2;
		x.beginPath();
		for ( let i = 0; i <= W; i++ ) {
			const y = H - 6 - f( i / W ) * ( H - 12 );
			if ( i ) {
				x.lineTo( i, y );
			} else {
				x.moveTo( i, y );
			}
		}
		x.stroke();
	}

	/** A new tween: fades up over 0.7 s, like the prototype's Fade up. */
	function newTween( start ) {
		return {
			presets: [],
			start: Math.round( Math.max( 0, start ) * 20 ) / 20,
			duration: 0.7,
			stagger: 0,
			ease: 'power2.out',
			from: { ...NEW_FROM },
			to: { ...NEW_TO },
		};
	}

	const NEW_FROM = { y: 40, opacity: 0 };
const NEW_TO = { y: 0, opacity: 1 };

/** Two sets of property values are the same. */
function sameValues( a, b ) {
	const ka = Object.keys( a || {} );
	return ka.length === Object.keys( b || {} ).length && ka.every( ( k ) => a[ k ] === b[ k ] );
}

/**
 * The change for a tween's presets. A new tween starts with the Fade up values in Properties. Choosing its first preset
 * takes those untouched values out, so the preset is the only motion; values the user typed are kept.
 */
function presetPatch( t, presets ) {
	const patch = { presets };
	const untouched = sameValues( t.from, NEW_FROM ) && sameValues( t.to, NEW_TO );
	if ( untouched && presets.length && ! ( t.presets || [] ).length ) {
		patch.from = {};
		patch.to = {};
	}
	return patch;
}

/** The name of a tween on its bar: its presets, else the properties it sets. */
	function tweenName( t, labelOf ) {
		const names = ( t.presets || [] ).map( ( v ) => labelOf[ v ] || v );
		if ( names.length ) {
			return names.join( ' + ' );
		}
		const keys = [ ...new Set( Object.keys( t.from || {} ).concat( Object.keys( t.to || {} ) ) ) ];
		return keys.length ? keys.join(' ') : '–';
	}

	/* ------------------------------------------------------------------
	 * The pane
	 * ---------------------------------------------------------------- */

	/**
	 * The Animations sub-panel. attrs: the block's attributes. onChange({ tweens, scroll }) writes them back. title: the
	 * block's name, shown on the lane. clientId: the block, to find it on the canvas for the preview.
	 */
	function AnimationsPane( { attrs, clientId, title, onChange } ) {
		const st = stateOf( attrs || {} );
		const tweens = st.tweens;
		const scroll = st.scroll;
		const [ selected, setSelected ] = useState( 0 );
		const [ open, setOpen ] = useState( { timeline: true, props: true, scroll: true } );
		const [ playing, setPlaying ] = useState( false );
		const [ drag, setDrag ] = useState( null );
		const [ width, setWidth ] = useState( 240 );
		const tlRef = useRef( null );
		const rulerRef = useRef( null );
		const phRef = useRef( null );
		const timeRef = useRef( null );
		const curveRef = useRef( null );
		const preview = useRef( null );
		const pos = useRef( 0 );
		const cur = tweens.length ? Math.min( selected, tweens.length - 1 ) : -1;
		const tween = cur >= 0 ? tweens[ cur ] : null;
		// The ruler runs a little past the last bar; the time readout shows where the animation really ends.
		const end = Math.max( 0, ...tweens.map( ( t ) => t.start + t.duration ) );
		const total = Math.max( 1.5, end ) + 0.2;
		const lane = Math.max( 40, width - LABEL_W );
		const k = lane / total;
		const kRef = useRef( k );
		const endRef = useRef( end );
		kRef.current = k;
		endRef.current = end;

		const commit = ( nextTweens, nextScroll ) => onChange( { tweens: nextTweens, scroll: nextScroll || scroll } );
		const setTween = ( i, patch ) => commit( tweens.map( ( t, j ) => ( j === i ? { ...t, ...patch } : t ) ) );
		const setScroll = ( patch ) => commit( tweens, { ...scroll, ...patch } );

		/* The timeline's width follows the panel. */
		useLayoutEffect( () => {
			const el = tlRef.current;
			if ( ! el ) {
				return undefined;
			}
			const measure = () => setWidth( el.clientWidth || 240 );
			measure();
			if ( typeof ResizeObserver === 'undefined' ) {
				return undefined;
			}
			const ro = new ResizeObserver( measure );
			ro.observe( el );
			return () => ro.disconnect();
		}, [ open.timeline ] );

		/* The playhead and the time follow the preview, and the last position stays after a change. */
		const showTime = ( t ) => {
			pos.current = t;
			if ( phRef.current ) {
				phRef.current.style.left = LABEL_W + t * kRef.current + 'px';
			}
			if ( timeRef.current ) {
				timeRef.current.textContent = t.toFixed( 2 ) + ' / ' + endRef.current.toFixed( 2 ) + 's';
			}
		};
		useEffect( () => {
			showTime( Math.min( pos.current, total ) );
		} );
		useEffect( () => {
			drawCurve( curveRef.current, tween ? tween.ease : 'none' );
		}, [ tween ? tween.ease : '', cur ] );

		/* The preview: the block on the canvas, with the runtime the front end uses. */
		const canvasEl = () => {
			if ( ! clientId ) {
				return null;
			}
			const frame = document.querySelector( 'iframe[name="editor-canvas"]' );
			const doc = frame && frame.contentDocument ? frame.contentDocument : document;
			return doc.querySelector( '[data-block="' + clientId + '"]' );
		};
		const restorePreview = () => {
			const p = preview.current;
			if ( ! p ) {
				return;
			}
			const inst = p.el._gsapAnimationInstance;
			if ( inst && typeof inst.kill === 'function' ) {
				inst.kill();
			}
			p.el._gsapAnimationInstance = null;
			if ( window.gsap && window.gsap.killTweensOf ) {
				window.gsap.killTweensOf( p.el );
			}
			Object.keys( p.saved ).forEach( ( key ) => {
				p.el.style[ key ] = p.saved[ key ];
			} );
			delete p.el._gsap;
			preview.current = null;
		};
		const ensurePreview = () => {
			const el = canvasEl();
			if ( ! el || ! window.gsap || typeof window.createDataAnimate !== 'function' ) {
				return null;
			}
			const str = toDataAnimate( tweens, scroll, true );
			if ( ! str ) {
				return null;
			}
			const p = preview.current;
			if ( p && p.el === el && p.key === str && el._gsapAnimationInstance ) {
				return el._gsapAnimationInstance;
			}
			restorePreview();
			const saved = { transform: el.style.transform, opacity: el.style.opacity, filter: el.style.filter };
			window.createDataAnimate( [ el ], str );
			const inst = el._gsapAnimationInstance;
			if ( ! inst ) {
				return null;
			}
			// The runtime starts a paused timeline when the scroll trigger is off, and its observer may play it when
			// the block comes into view. Only the pane's own play starts it.
			const realPlay = inst.play;
			inst.play = function ( ...args ) {
				return inst._snnUserPlay ? realPlay.apply( inst, args ) : inst;
			};
			inst.eventCallback( 'onUpdate', () => showTime( inst.time() ) );
			inst.eventCallback( 'onComplete', () => setPlaying( false ) );
			preview.current = { el, key: str, saved };
			return inst;
		};
		useEffect( () => () => restorePreview(), [] );

		const playOn = ( inst, fn ) => {
			inst._snnUserPlay = true;
			try {
				fn();
			} finally {
				inst._snnUserPlay = false;
			}
		};
		const onPlay = () => {
			const inst = ensurePreview();
			if ( ! inst ) {
				return;
			}
			if ( inst.isActive() ) {
				inst.pause();
				setPlaying( false );
				return;
			}
			playOn( inst, () => ( inst.progress() >= 1 ? inst.restart() : inst.play() ) );
			setPlaying( true );
		};
		const onRewind = () => {
			const inst = ensurePreview();
			setPlaying( false );
			if ( inst ) {
				inst.pause( 0 );
			}
			showTime( 0 );
		};
		const seek = ( t ) => {
			const inst = ensurePreview();
			if ( inst ) {
				inst.pause();
				inst.time( t );
			}
			setPlaying( false );
			showTime( t );
		};

		/* Drags: the ruler scrubs, a bar moves or resizes. The change is written when the mouse is let go. */
		const scrubStart = ( e ) => {
			e.preventDefault();
			const left = rulerRef.current ? rulerRef.current.getBoundingClientRect().left : 0;
			const at = ( x ) => Math.min( total, Math.max( 0, ( x - left ) / k ) );
			seek( at( e.clientX ) );
			const move = ( m ) => seek( at( m.clientX ) );
			const up = () => {
				window.removeEventListener( 'pointermove', move );
				window.removeEventListener( 'pointerup', up );
			};
			window.addEventListener( 'pointermove', move );
			window.addEventListener( 'pointerup', up );
		};
		const barStart = ( e, i, resize ) => {
			e.preventDefault();
			e.stopPropagation();
			setSelected( i );
			const t = tweens[ i ];
			const x0 = e.clientX;
			const snap = ( v ) => Math.round( v * 20 ) / 20;
			let last = null;
			let moved = false;
			const move = ( m ) => {
				const dx = m.clientX - x0;
				if ( Math.abs( dx ) > 2 ) {
					moved = true;
				}
				const d = dx / k;
				last = resize
					? { start: t.start, duration: Math.max( 0.05, snap( t.duration + d ) ) }
					: { start: Math.max( 0, snap( t.start + d ) ), duration: t.duration };
				setDrag( { i, ...last } );
			};
			const up = () => {
				window.removeEventListener( 'pointermove', move );
				window.removeEventListener( 'pointerup', up );
				setDrag( null );
				if ( moved && last ) {
					setTween( i, last );
				}
			};
			window.addEventListener( 'pointermove', move );
			window.addEventListener( 'pointerup', up );
		};

		const addTween = ( start ) => {
			if ( tweens.length >= LANE_MAX ) {
				return;
			}
			const end = tweens.reduce( ( m, t ) => Math.max( m, t.start + t.duration ), 0 );
			commit( [ ...tweens, newTween( start === undefined ? end : start ) ] );
			setSelected( tweens.length );
		};
		const removeTween = () => {
			commit( tweens.filter( ( _, j ) => j !== cur ) );
			setSelected( Math.max( 0, cur - 1 ) );
		};

		/* A property: its from or to value. The other side takes the default when it has none, as the prototype does. */
		const setProp = ( side, p, v ) => {
			const mine = { ...( tween[ side ] || {} ) };
			const other = { ...( tween[ side === 'from' ? 'to' : 'from' ] || {} ) };
			if ( v === null ) {
				delete mine[ p.key ];
			} else {
				mine[ p.key ] = v;
				if ( other[ p.key ] === undefined ) {
					other[ p.key ] = p.def;
				}
			}
			setTween( cur, side === 'from' ? { from: mine, to: other } : { to: mine, from: other } );
		};

		/* ---------- the transport ---------- */
		const hasTweens = tweens.length > 0;
		const transport = h(
			'div',
			{ className: 'snn-anp-transport' },
			h(
				'button',
				{ type: 'button', className: 'snn-anp-round', 'aria-label': __( 'Rewind', 'snn' ), ...tipAttr( 'anim.rewind' ), disabled: ! hasTweens, onClick: onRewind },
				icon( 'rewind' )
			),
			h(
				'button',
				{
					type: 'button',
					className: 'snn-anp-round is-primary',
					'aria-label': playing ? __( 'Pause', 'snn' ) : __( 'Play', 'snn' ),
					...tipAttr( 'anim.play' ),
					disabled: ! hasTweens,
					onClick: onPlay,
				},
				icon( playing ? 'pause' : 'play' )
			),
			h( 'span', { className: 'snn-anp-time', ref: timeRef } )
		);

		/* ---------- the timeline ---------- */
		const labelOf = {};
		PRESET_GROUPS.forEach( ( g ) => g.items.forEach( ( i ) => {
			labelOf[ i.value ] = i.label;
		} ) );
		const ticks = [];
		const step = total > 6 ? 1 : 0.5;
		for ( let n = 0; n * step <= total + 1e-6; n++ ) {
			const s = n * step;
			ticks.push( h( 'i', { key: 't' + n, className: 'snn-anp-tick', style: { left: s * k + 'px' } } ) );
			if ( s % 1 === 0 ) {
				ticks.push( h( 'b', { key: 'l' + n, className: 'snn-anp-tick-label', style: { left: s * k + 'px' } }, s + 's' ) );
			}
		}
		const bars = tweens.map( ( t, i ) => {
			const v = drag && drag.i === i ? { ...t, start: drag.start, duration: drag.duration } : t;
			return h(
				'div',
				{
					key: i,
					className: 'snn-anp-bar' + ( i === cur ? ' is-on' : '' ),
					style: { left: v.start * k + 'px', width: Math.max( 8, v.duration * k ) + 'px' },
					...tipAttr( 'anim.bar' ),
					onPointerDown: ( e ) => barStart( e, i, false ),
				},
				h( 'span', { className: 'snn-anp-bar-text' }, tweenName( t, labelOf ) ),
				h( 'span', { className: 'snn-anp-rz', onPointerDown: ( e ) => barStart( e, i, true ) } )
			);
		} );
		const timelineBody = h(
			Fragment,
			null,
			transport,
			h(
				'div',
				{ className: 'snn-anp-tl', ref: tlRef },
				h( 'div', { className: 'snn-anp-ruler', ref: rulerRef, onPointerDown: scrubStart, ...tipAttr( 'anim.ruler' ) }, ticks ),
				h(
					'div',
					{ className: 'snn-anp-lanes' },
					h( 'div', { className: 'snn-anp-name' }, title || '' ),
					h(
						'div',
						{
							className: 'snn-anp-lane',
							onDoubleClick: ( e ) => {
								if ( e.target === e.currentTarget ) {
									addTween( e.nativeEvent.offsetX / k );
								}
							},
						},
						bars
					)
				),
				h( 'div', { className: 'snn-anp-ph', ref: phRef } )
			),
			hasTweens
				? h( 'p', { className: 'snn-anp-hint' }, __( 'Drag a bar to move it, its right edge to resize. Double-click the lane to add here.', 'snn' ) )
				: h( 'p', { className: 'snn-anp-hint' }, __( 'No animation yet. Add one, then choose its presets.', 'snn' ) ),
			h(
				'button',
				{ type: 'button', className: 'snn-bt-link', disabled: tweens.length >= LANE_MAX, onClick: () => addTween(), ...tipAttr( 'anim.add' ) },
				__( 'Add animation', 'snn' )
			)
		);

		/* ---------- the tween ---------- */
		const tweenBody = tween
			? [
					h( Row, { key: 'presets', label: __( 'Presets', 'snn' ), changed: tween.presets.length > 0, tip: 'anim.presets' },
						h( AnimationPicker, {
							value: tween.presets,
							multiple: true,
							groups: PRESET_GROUPS,
							tip: 'anim.presets',
							onChange: ( v ) => setTween( cur, presetPatch( tween, v ) ),
						} )
					),
					h( Row, { key: 'start', label: __( 'Start', 'snn' ), tip: 'anim.start' },
						h( NumField, { value: tween.start, label: __( 'Start', 'snn' ), tip: 'anim.start', onCommit: ( v ) => v !== null && setTween( cur, { start: Math.max( 0, v ) } ) } )
					),
					h( Row, { key: 'duration', label: __( 'Duration', 'snn' ), tip: 'anim.duration' },
						h( NumField, { value: tween.duration, label: __( 'Duration', 'snn' ), tip: 'anim.duration', onCommit: ( v ) => v !== null && setTween( cur, { duration: Math.max( 0.05, v ) } ) } )
					),
					h( Row, { key: 'stagger', label: __( 'Stagger', 'snn' ), tip: 'anim.stagger' },
						h( NumField, { value: tween.stagger, label: __( 'Stagger', 'snn' ), tip: 'anim.stagger', onCommit: ( v ) => v !== null && setTween( cur, { stagger: Math.max( 0, v ) } ) } )
					),
					h( Row, { key: 'ease', label: __( 'Ease', 'snn' ), tip: 'anim.ease' },
						h( Select, {
							value: tween.ease,
							options: EASES.map( ( e ) => ( { value: e, label: e } ) ),
							label: __( 'Ease', 'snn' ),
							tip: 'anim.ease',
							onChange: ( v ) => setTween( cur, { ease: v } ),
						} )
					),
					h( 'canvas', { key: 'curve', ref: curveRef, className: 'snn-anp-curve', width: 240, height: 36, 'aria-hidden': 'true' } ),
					h(
						'button',
						{ key: 'remove', type: 'button', className: 'snn-bt-link snn-anp-danger', onClick: removeTween, ...tipAttr( 'anim.remove' ) },
						__( 'Remove animation', 'snn' )
					),
			  ]
			: null;

		/* ---------- the properties ---------- */
		const propsBody = tween
			? h(
					'div',
					{ className: 'snn-anp-grid' },
					h( 'span', { className: 'snn-anp-h' }, __( 'Property', 'snn' ) ),
					h( 'span', { className: 'snn-anp-h' }, __( 'From', 'snn' ) ),
					h( 'span', { className: 'snn-anp-h' }, __( 'To', 'snn' ) ),
					PROPS.map( ( p ) =>
						h(
							Fragment,
							{ key: p.key },
							h( 'span', { className: 'snn-anp-prop' }, p.key ),
							h( NumField, {
								value: tween.from ? tween.from[ p.key ] : undefined,
								label: p.key + ' ' + __( 'from', 'snn' ),
								placeholder: '–',
								tip: 'anim.from',
								onCommit: ( v ) => setProp( 'from', p, v ),
							} ),
							h( NumField, {
								value: tween.to ? tween.to[ p.key ] : undefined,
								label: p.key + ' ' + __( 'to', 'snn' ),
								placeholder: '–',
								tip: 'anim.to',
								onCommit: ( v ) => setProp( 'to', p, v ),
							} )
						)
					)
			  )
			: null;

		/* ---------- the Scroll Trigger (one for the block) ---------- */
		const scrollChanged = JSON.stringify( scroll ) !== JSON.stringify( DEFAULT_SCROLL );
		const scrollBody = h(
			Fragment,
			null,
			h( Row, { label: __( 'Scroll Trigger', 'snn' ), changed: ! scroll.on, tip: 'scroll.on' },
				h( Switch, { checked: scroll.on, label: __( 'Scroll Trigger', 'snn' ), tip: 'scroll.on', onChange: ( v ) => setScroll( { on: v } ) } )
			),
			h(
				'div',
				{ className: 'snn-anp-two' + ( scroll.on ? '' : ' snn-anp-off' ) },
				h( 'label', { className: 'snn-anp-field' }, h( 'span', { className: 'snn-row-label', ...tipAttr( 'scroll.start' ) }, __( 'Start', 'snn' ) ),
					h( 'input', { type: 'text', className: 'snn-input', value: scroll.start, maxLength: 40, spellCheck: false, 'aria-label': __( 'Start', 'snn' ), onChange: ( e ) => setScroll( { start: e.target.value.replace( /[^a-z0-9 %+\-.=]/gi, '' ) } ) } )
				),
				h( 'label', { className: 'snn-anp-field' }, h( 'span', { className: 'snn-row-label', ...tipAttr( 'scroll.end' ) }, __( 'End', 'snn' ) ),
					h( 'input', { type: 'text', className: 'snn-input', value: scroll.end, maxLength: 40, spellCheck: false, 'aria-label': __( 'End', 'snn' ), onChange: ( e ) => setScroll( { end: e.target.value.replace( /[^a-z0-9 %+\-.=]/gi, '' ) } ) } )
				)
			),
			h(
				'div',
				{ className: scroll.on ? '' : 'snn-anp-off' },
				h( Row, { label: __( 'Scrub with scroll', 'snn' ), changed: scroll.scrub, tip: 'scroll.scrub' },
					h( Switch, { checked: scroll.scrub, label: __( 'Scrub with scroll', 'snn' ), tip: 'scroll.scrub', onChange: ( v ) => setScroll( { scrub: v } ) } )
				),
				h( Row, { label: __( 'Play once', 'snn' ), changed: scroll.once, tip: 'scroll.once' },
					h( Switch, { checked: scroll.once, label: __( 'Play once', 'snn' ), tip: 'scroll.once', onChange: ( v ) => setScroll( { once: v } ) } )
				),
				h( Row, { label: __( 'Show markers', 'snn' ), changed: scroll.markers, tip: 'scroll.markers' },
					h( Switch, { checked: scroll.markers, label: __( 'Show markers', 'snn' ), tip: 'scroll.markers', onChange: ( v ) => setScroll( { markers: v } ) } )
				)
			),
			h(
				'div',
				{ className: scroll.on ? 'snn-anp-off' : '' },
				h( Row, { label: __( 'Loop timeline', 'snn' ), changed: scroll.loop, tip: 'scroll.loop' },
					h( Switch, { checked: scroll.loop, label: __( 'Loop timeline', 'snn' ), tip: 'scroll.loop', onChange: ( v ) => setScroll( { loop: v } ) } )
				)
			),
			h( 'p', { className: 'snn-anp-hint' }, scroll.on ? __( 'Plays as the block scrolls into view, between the start and the end.', 'snn' ) : __( 'Plays once the block is in view. Loop repeats it.', 'snn' ) )
		);

		// Order: the Animation fields first, always open (no header, no accordion), then Properties, then the Timeline
		// (its transport is at the top of it), then the Scroll Trigger.
		return h(
			'div',
			{ className: 'snn-anp' },
			tween ? h( 'div', { className: 'snn-acc' }, h( 'div', { className: 'snn-acc-body' }, tweenBody ) ) : null,
			tween
				? h( Accordion, { title: __( 'Properties', 'snn' ), open: open.props, changed: tween.from && Object.keys( tween.from ).length > 0, onToggle: ( v ) => setOpen( { ...open, props: v } ) }, propsBody )
				: null,
			h( Accordion, { title: __( 'Timeline', 'snn' ), open: open.timeline, changed: hasTweens, tip: 'anim.timeline', onToggle: ( v ) => setOpen( { ...open, timeline: v } ) }, timelineBody ),
			h( Accordion, { title: __( 'Scroll Trigger', 'snn' ), open: open.scroll, changed: scrollChanged, tip: 'scroll.on', onToggle: ( v ) => setOpen( { ...open, scroll: v } ) }, scrollBody )
		);
	}

	window.snnAnimationPane = {
		AnimationsPane,
		stateOf,
		canvasDataAnimate,
		toDataAnimate,
	};
} )( window.wp, window.snnControls );
