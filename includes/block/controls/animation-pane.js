/**
 * SNN GSAP pane: the Animations sub-panel of a block (the Animations icon). Its side panel edits one animation of the
 * block (the Animation fields and the Properties) and the block's Scroll Trigger.
 *
 * The timeline is a dock under the canvas. It has one lane for the top block of the selected block's tree, one for each
 * block under it that has animations, and one for the selected block itself. Click a lane name to select that block,
 * click a bar to edit that animation on the right, drag a bar to move it, drag its right edge to resize it, drag the
 * ruler to scrub, double-click a lane to add an animation there. Play runs all the lanes on the canvas together, with
 * the runtime the front end uses (assets/js/gsap-data-animate.js, through window.createDataAnimate): a block with
 * Loop timeline on repeats as it does on the front end, and a stagger goes over the child blocks.
 *
 * The data written here is turned into the data-animate value by SNN_Animation::tweens_data_animate (animation.php).
 * toDataAnimate below writes the same text, for the canvas attribute and the preview.
 *
 * Loaded in the block editor (see includes/block/layout-blocks.php). Exposes window.snnAnimationPane.
 * Uses wp.element, wp.data, wp.blocks and wp.components, so it runs on the editor's own React and data store.
 */
( function ( wp, C ) {
	const { createElement: h, createPortal, Fragment, useState, useRef, useEffect, useLayoutEffect } = wp.element;
	const { __ } = wp.i18n;
	const { ResizableBox } = wp.components;
	const { dispatch, useSelect } = wp.data;
	const { getBlockType } = wp.blocks;
	const { Row, Select, Accordion, Switch, AnimationPicker, tipAttr } = C;
	const DATA = window.snnAnimationData || {};
	const EASES = DATA.eases || [ 'power2.out' ];
	const PRESET_GROUPS = ( ( window.snnControlsData || {} ).animations || [] ).filter( ( g ) => g.label !== 'Scroll' );
	// The label of each preset, for the bars.
	const LABEL_OF = {};
	PRESET_GROUPS.forEach( ( g ) => g.items.forEach( ( i ) => {
		LABEL_OF[ i.value ] = i.label;
	} ) );
	// The lane names: the left column of the timeline, in px.
	const LABEL_W = 120;
	const LANE_MAX = 20;
	// The timeline dock: its height in px, kept in the browser between sessions.
	const DOCK_KEY = 'snn-anp-dock-height';
	// About what the dock's head, transport, ruler, one lane and the hint take: nothing is cut off at this height.
	const DOCK_MIN = 220;
	const DOCK_DEFAULT = 260;

	function loadDockHeight() {
		try {
			const v = parseInt( window.localStorage.getItem( DOCK_KEY ), 10 );
			return v >= DOCK_MIN ? v : DOCK_DEFAULT;
		} catch ( e ) {
			return DOCK_DEFAULT;
		}
	}

	function saveDockHeight( v ) {
		try {
			window.localStorage.setItem( DOCK_KEY, String( v ) );
		} catch ( e ) {
			// The height is then kept for this page only.
		}
	}

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

	/**
	 * Whether a block loops. The loop belongs to the Scroll Trigger being off: the runtime loops a block only then, and the
	 * same goes for the preview.
	 */
	function loops( sc ) {
		return !! sc.loop && ! sc.on;
	}

	/** The options that come first in the first segment: the Scroll Trigger, or play when in view (and its loop). */
	function scrollOptions( sc, preview ) {
		if ( preview || ! sc.on ) {
			const off = [ 'scroll:false' ];
			if ( loops( sc ) ) {
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

	/**
	 * A new tween: no presets and no property values, so it plays nothing until a preset is picked or a value is typed.
	 * Its timing starts at the given start, 0.7 s, power2.out.
	 */
	function newTween( start ) {
		return {
			presets: [],
			start: Math.round( Math.max( 0, start ) * 20 ) / 20,
			duration: 0.7,
			stagger: 0,
			ease: 'power2.out',
			from: {},
			to: {},
		};
	}

	/** The name of a tween on its bar: its presets, else the properties it sets. */
	function tweenName( t ) {
		const names = ( t.presets || [] ).map( ( v ) => LABEL_OF[ v ] || v );
		if ( names.length ) {
			return names.join( ' + ' );
		}
		const keys = [ ...new Set( Object.keys( t.from || {} ).concat( Object.keys( t.to || {} ) ) ) ];
		return keys.length ? keys.join( ' ' ) : '–';
	}

	/** The name of a block on its lane: its name in the list view (metadata.name), else the title of its block type. */
	function nameOf( name, attrs ) {
		const meta = attrs && attrs.metadata;
		return ( meta && meta.name ) || ( getBlockType( name ) || {} ).title || name;
	}

	/*
	 * Which animation of a block the fields on the right show (its index in the block's list). The dock sets it when a bar
	 * is picked; the pane of that block re-reads it.
	 */
	const picks = {};
	const pickListeners = new Set();

	function pickTween( clientId, i ) {
		picks[ clientId ] = i;
		pickListeners.forEach( ( fn ) => fn() );
	}

	function usePickedTween( clientId ) {
		const [ , bump ] = useState( 0 );
		useEffect( () => {
			const fn = () => bump( ( n ) => n + 1 );
			pickListeners.add( fn );
			return () => {
				pickListeners.delete( fn );
			};
		}, [] );
		return picks[ clientId ] || 0;
	}

	/* The sections of the pane (Properties, Timeline, Scroll Trigger): open or closed, kept across blocks as the panel is. */
	const sections = { props: true, timeline: true, scroll: true };

	/*
	 * The preview on the canvas: each lane's block, with the runtime's own instance. One clock moves them all (seekPreview
	 * sets every instance to the same time), so the lanes play together, and a looping block keeps going as on the front
	 * end. It is kept here, not in the dock, and the dock takes it down when it unmounts (the dock is remounted when
	 * another block is selected).
	 */
	const preview = { items: [], key: '', pos: 0, playing: false, looping: false, raf: 0, view: null };

	/** The block's element on the canvas (in the editor's iframe), or null. */
	function canvasEl( clientId ) {
		const frame = document.querySelector( 'iframe[name="editor-canvas"]' );
		const doc = frame && frame.contentDocument ? frame.contentDocument : document;
		return doc.querySelector( '[data-block="' + clientId + '"]' );
	}

	/** The inline styles the preview changes, of one element. */
	function styleOf( el ) {
		return { transform: el.style.transform, opacity: el.style.opacity, filter: el.style.filter, visibility: el.style.visibility };
	}

	function setStyle( el, saved ) {
		Object.keys( saved ).forEach( ( prop ) => {
			el.style[ prop ] = saved[ prop ];
		} );
	}

	/** The child blocks of a block on the canvas: on the front end these are the element's children, which a stagger uses. */
	function childBlocks( el ) {
		return [ ...el.querySelectorAll( '[data-block]' ) ].filter( ( c ) => c.parentElement && c.parentElement.closest( '[data-block]' ) === el );
	}

	/** Puts the canvas back as it was before the preview, and drops the runtime's instances. */
	function restorePreview() {
		preview.items.forEach( ( it ) => {
			try {
				it.inst.kill();
			} catch ( e ) {
				// The instance is gone already.
			}
		} );
		preview.items.forEach( ( it ) => {
			const all = [ it.el, ...it.kids.map( ( k ) => k.el ) ];
			it.el._gsapAnimationInstance = null;
			if ( window.gsap && window.gsap.killTweensOf ) {
				all.forEach( ( t ) => window.gsap.killTweensOf( t ) );
			}
			setStyle( it.el, it.saved );
			it.kids.forEach( ( k ) => setStyle( k.el, k.saved ) );
			all.forEach( ( t ) => {
				delete t._gsap;
			} );
		} );
		preview.items = [];
		preview.key = '';
		preview.looping = false;
	}

	/**
	 * Builds the preview from a list of { clientId, str, loop }: the data-animate text of each lane, and whether it loops.
	 * Returns true when at least one block can play. Only a block whose text changed, or whose element was replaced on the
	 * canvas, is built again.
	 */
	function buildPreview( list ) {
		const key = list.map( ( x ) => x.clientId + '|' + x.str ).join( '\n' );
		if ( key === preview.key && preview.items.every( ( it ) => it.el.isConnected ) ) {
			return preview.items.length > 0;
		}
		restorePreview();
		preview.key = key;
		preview.looping = list.some( ( x ) => x.loop );
		if ( ! list.length || ! window.gsap || typeof window.createDataAnimate !== 'function' ) {
			return false;
		}
		list.forEach( ( x ) => {
			const el = canvasEl( x.clientId );
			if ( ! el ) {
				return;
			}
			const saved = styleOf( el );
			const kids = childBlocks( el ).map( ( c ) => ( { el: c, saved: styleOf( c ) } ) );
			// The runtime staggers over the children of an element. On the canvas those are not the child blocks (WordPress
			// puts a wrapper and style tags in between), so the child blocks are handed to the runtime for this one build.
			el._snnStaggerTargets = kids.map( ( k ) => k.el );
			window.createDataAnimate( [ el ], x.str );
			delete el._snnStaggerTargets;
			const inst = el._gsapAnimationInstance;
			if ( ! inst ) {
				setStyle( el, saved );
				kids.forEach( ( k ) => setStyle( k.el, k.saved ) );
				return;
			}
			// The runtime's viewport observer may call play() by itself. The pane's clock moves the blocks instead.
			inst.play = () => inst;
			inst.pause( 0 );
			preview.items.push( { el, saved, kids, inst } );
		} );
		return preview.items.length > 0;
	}

	/*
	 * Sets every block's preview to the same time, and moves the playhead of the dock. A single tween keeps its delay (the
	 * t_start of the timeline) outside its own time, so the time it is set to is t less that delay. A timeline has no delay.
	 */
	function seekPreview( t ) {
		preview.pos = t;
		preview.items.forEach( ( it ) => {
			it.inst.pause();
			it.inst.totalTime( Math.max( 0, t - it.inst.delay() ) );
		} );
		if ( preview.view ) {
			preview.view.onTime( t );
		}
	}

	/** Stops the clock. */
	function stopPreview() {
		if ( preview.raf ) {
			window.cancelAnimationFrame( preview.raf );
		}
		preview.raf = 0;
		if ( ! preview.playing ) {
			return;
		}
		preview.playing = false;
		if ( preview.view ) {
			preview.view.onPlaying( false );
		}
	}

	/**
	 * Plays from the playhead. Without a looping block it stops at the end of the last lane (and starts again from the
	 * start when the playhead is already there). With one, the clock keeps going until Pause, as the block does.
	 */
	function playPreview( end ) {
		if ( preview.playing || end <= 0 ) {
			return;
		}
		if ( ! preview.looping && preview.pos >= end - 1e-6 ) {
			preview.pos = 0;
		}
		preview.playing = true;
		if ( preview.view ) {
			preview.view.onPlaying( true );
		}
		let last = window.performance.now();
		const step = ( now ) => {
			preview.raf = 0;
			const next = preview.pos + Math.max( 0, now - last ) / 1000;
			last = now;
			const t = preview.looping ? next : Math.min( end, next );
			seekPreview( t );
			if ( ! preview.looping && t >= end ) {
				stopPreview();
			} else {
				preview.raf = window.requestAnimationFrame( step );
			}
		};
		preview.raf = window.requestAnimationFrame( step );
	}

	/** Writes a block's animations and Scroll Trigger (the attributes the sub-panel writes for the selected block). */
	function writeTweens( clientId, tweens, scroll ) {
		dispatch( 'core/block-editor' ).updateBlockAttributes( clientId, { gsapTweens: tweens, gsapScroll: scroll, animation: [] } );
	}

	/* ------------------------------------------------------------------
	 * The timeline dock
	 * ---------------------------------------------------------------- */

	/**
	 * The dock under the canvas. Its lanes: the top block of the selected block's tree, every block under it that has
	 * animations, and the selected block itself. One time line for all of them.
	 */
	/** How far a tween's stagger spreads its children past its own duration: the last child starts this much later. */
	function spreadOf( t, kids ) {
		return t.stagger > 0 && kids > 1 ? t.stagger * ( kids - 1 ) : 0;
	}

	/** When a lane ends: its last tween, with the stagger of its children. */
	function laneEnd( l ) {
		return l.st.tweens.reduce( ( m, t ) => Math.max( m, t.start + t.duration + spreadOf( t, l.kids ) ), 0 );
	}

	function TimelineDock( { clientId, onClose } ) {
		// The blocks of the tree, top block first (the store's own block objects, so a change in one re-renders the dock).
		const blocks = useSelect(
			( select ) => {
				const be = select( 'core/block-editor' );
				let top = clientId;
				for ( let p = be.getBlockRootClientId( top ); p; p = be.getBlockRootClientId( top ) ) {
					top = p;
				}
				const out = [];
				const walk = ( b ) => {
					if ( b ) {
						out.push( b );
						( b.innerBlocks || [] ).forEach( walk );
					}
				};
				walk( be.getBlock( top ) );
				return out;
			},
			[ clientId ]
		);
		const picked = usePickedTween( clientId );
		const [ playing, setPlaying ] = useState( preview.playing );
		const [ width, setWidth ] = useState( 600 );
		const [ drag, setDrag ] = useState( null );
		// The page of the ruler: the time it starts at is page * total (see showTime).
		const [ page, setPage ] = useState( 0 );
		const tlRef = useRef( null );
		const rulerRef = useRef( null );
		const phRef = useRef( null );
		const timeRef = useRef( null );
		const latest = useRef( null );

		const lanes = blocks
			.map( ( b ) => ( { clientId: b.clientId, name: b.name, attrs: b.attributes || {}, kids: ( b.innerBlocks || [] ).length, st: stateOf( b.attributes || {} ) } ) )
			.filter( ( l ) => l.st.tweens.length > 0 || l.clientId === clientId );
		// Two blocks of one kind get numbers on their lanes: Text 1, Text 2.
		const names = lanes.map( ( l ) => nameOf( l.name, l.attrs ) );
		const count = {};
		names.forEach( ( n ) => {
			count[ n ] = ( count[ n ] || 0 ) + 1;
		} );
		const seen = {};
		lanes.forEach( ( l, i ) => {
			const n = names[ i ];
			seen[ n ] = ( seen[ n ] || 0 ) + 1;
			l.label = count[ n ] > 1 ? n + ' ' + seen[ n ] : n;
		} );

		const top = blocks[ 0 ];
		const selected = lanes.find( ( l ) => l.clientId === clientId ) || { st: { tweens: [], scroll: DEFAULT_SCROLL } };
		const selCount = selected.st.tweens.length;
		const cur = selCount ? Math.min( picked, selCount - 1 ) : -1;
		const end = lanes.reduce( ( m, l ) => Math.max( m, laneEnd( l ) ), 0 );
		const total = Math.max( 1.5, end ) + 0.2;
		const k = Math.max( 40, width - LABEL_W ) / total;
		const pageStart = page * total;
		const looping = lanes.some( ( l ) => l.st.tweens.length > 0 && loops( l.st.scroll ) );
		latest.current = { lanes, clientId, end, total, k, page, looping };

		const laneOf = ( id ) => latest.current.lanes.find( ( l ) => l.clientId === id );
		const selectBlock = ( id ) => {
			if ( id !== latest.current.clientId ) {
				dispatch( 'core/block-editor' ).selectBlock( id );
			}
		};
		const previewList = () =>
			latest.current.lanes
				.filter( ( l ) => l.st.tweens.length > 0 )
				.map( ( l ) => ( { clientId: l.clientId, str: toDataAnimate( l.st.tweens, l.st.scroll, true ), loop: loops( l.st.scroll ) } ) )
				.filter( ( x ) => x.str );

		/*
		 * The ruler shows one page at a time, a page as long as the ruler (total). The page follows the playhead, so a
		 * looping block keeps moving on past the ruler, and the bars and the playhead stay where their time is.
		 */
		const showTime = ( t ) => {
			const L = latest.current;
			const n = Math.max( 0, Math.floor( t / L.total + 1e-9 ) );
			if ( n !== L.page ) {
				setPage( n );
			}
			if ( phRef.current ) {
				phRef.current.style.left = LABEL_W + ( t - n * L.total ) * L.k + 'px';
			}
			if ( timeRef.current ) {
				timeRef.current.textContent = L.looping ? t.toFixed( 2 ) + ' s, looping' : t.toFixed( 2 ) + ' / ' + L.end.toFixed( 2 ) + 's';
			}
		};
		// The playhead and the time follow the preview; after a change the last position stays.
		useEffect( () => {
			showTime( preview.pos );
		} );

		// This dock is the preview's view while it is mounted. Unmounting takes the preview down.
		useEffect( () => {
			const view = { onTime: showTime, onPlaying: setPlaying };
			preview.view = view;
			return () => {
				if ( preview.view === view ) {
					preview.view = null;
				}
				stopPreview();
				restorePreview();
			};
		}, [] );

		// The timeline's width follows the dock.
		useLayoutEffect( () => {
			const el = tlRef.current;
			if ( ! el ) {
				return undefined;
			}
			const measure = () => setWidth( el.clientWidth || 600 );
			measure();
			if ( typeof ResizeObserver === 'undefined' ) {
				return undefined;
			}
			const ro = new ResizeObserver( measure );
			ro.observe( el );
			return () => ro.disconnect();
		}, [] );

		const seek = ( t ) => {
			stopPreview();
			buildPreview( previewList() );
			seekPreview( Math.max( 0, t ) );
		};
		const onPlay = () => {
			if ( preview.playing ) {
				stopPreview();
				return;
			}
			if ( buildPreview( previewList() ) ) {
				playPreview( latest.current.end );
			}
		};
		const onRewind = () => seek( 0 );

		// Drags on the ruler scrub. A bar moves or resizes; the change is written when the mouse is let go.
		const scrubStart = ( e ) => {
			e.preventDefault();
			const rect = rulerRef.current ? rulerRef.current.getBoundingClientRect() : null;
			const at = ( x ) =>
				latest.current.page * latest.current.total +
				Math.min( latest.current.total, Math.max( 0, ( x - ( rect ? rect.left : 0 ) ) / latest.current.k ) );
			seek( at( e.clientX ) );
			const move = ( m ) => seek( at( m.clientX ) );
			const up = () => {
				window.removeEventListener( 'pointermove', move );
				window.removeEventListener( 'pointerup', up );
			};
			window.addEventListener( 'pointermove', move );
			window.addEventListener( 'pointerup', up );
		};
		const barStart = ( e, id, i, resize ) => {
			e.preventDefault();
			e.stopPropagation();
			const lane = laneOf( id );
			if ( ! lane || ! lane.st.tweens[ i ] ) {
				return;
			}
			const t = lane.st.tweens[ i ];
			const x0 = e.clientX;
			const snap = ( v ) => Math.round( v * 20 ) / 20;
			let next = null;
			let moved = false;
			const move = ( m ) => {
				const dx = m.clientX - x0;
				if ( Math.abs( dx ) > 2 ) {
					moved = true;
				}
				const d = dx / latest.current.k;
				next = resize
					? { start: t.start, duration: Math.max( 0.05, snap( t.duration + d ) ) }
					: { start: Math.max( 0, snap( t.start + d ) ), duration: t.duration };
				setDrag( { clientId: id, i, ...next } );
			};
			const up = () => {
				window.removeEventListener( 'pointermove', move );
				window.removeEventListener( 'pointerup', up );
				setDrag( null );
				if ( ! moved || ! next ) {
					// A click: the animation is picked and its block selected, so the fields on the right show it.
					pickTween( id, i );
					selectBlock( id );
					return;
				}
				const now = laneOf( id );
				if ( now ) {
					writeTweens( id, now.st.tweens.map( ( x, j ) => ( j === i ? { ...x, ...next } : x ) ), now.st.scroll );
				}
			};
			window.addEventListener( 'pointermove', move );
			window.addEventListener( 'pointerup', up );
		};
		const addAt = ( id, start ) => {
			const lane = laneOf( id );
			if ( ! lane || lane.st.tweens.length >= LANE_MAX ) {
				return;
			}
			const at = start === undefined ? lane.st.tweens.reduce( ( m, t ) => Math.max( m, t.start + t.duration ), 0 ) : start;
			writeTweens( id, [ ...lane.st.tweens, newTween( at ) ], lane.st.scroll );
			pickTween( id, lane.st.tweens.length );
			selectBlock( id );
		};

		/* ---------- the transport ---------- */
		const has = lanes.some( ( l ) => l.st.tweens.length > 0 );
		const transport = h(
			'div',
			{ className: 'snn-anp-transport' },
			h(
				'button',
				{ type: 'button', className: 'snn-anp-round', 'aria-label': __( 'Rewind', 'snn' ), ...tipAttr( 'anim.rewind' ), disabled: ! has, onClick: onRewind },
				icon( 'rewind' )
			),
			h(
				'button',
				{
					type: 'button',
					className: 'snn-anp-round is-primary',
					'aria-label': playing ? __( 'Pause', 'snn' ) : __( 'Play', 'snn' ),
					...tipAttr( 'anim.play' ),
					disabled: ! has,
					onClick: onPlay,
				},
				icon( playing ? 'pause' : 'play' )
			),
			h( 'span', { className: 'snn-anp-time', ref: timeRef } ),
			h(
				'button',
				{ type: 'button', className: 'snn-bt-link snn-anp-add', disabled: selCount >= LANE_MAX, onClick: () => addAt( clientId ), ...tipAttr( 'anim.add' ) },
				__( 'Add animation', 'snn' )
			)
		);

		/* ---------- the ruler and the lanes ---------- */
		const ticks = [];
		const step = total > 6 ? 1 : 0.5;
		for ( let n = Math.floor( pageStart / step + 1e-9 ); n * step - pageStart <= total + 1e-6; n++ ) {
			const s = n * step;
			const at = ( s - pageStart ) * k;
			if ( at < -1e-6 ) {
				continue;
			}
			ticks.push( h( 'i', { key: 't' + n, className: 'snn-anp-tick', style: { left: at + 'px' } } ) );
			if ( s % 1 === 0 ) {
				ticks.push( h( 'b', { key: 'l' + n, className: 'snn-anp-tick-label', style: { left: at + 'px' } }, s + 's' ) );
			}
		}
		const laneRow = ( l ) => {
			const isSel = l.clientId === clientId;
			const bars = l.st.tweens.map( ( t, i ) => {
				const v = drag && drag.clientId === l.clientId && drag.i === i ? { ...t, start: drag.start, duration: drag.duration } : t;
				return h(
					'div',
					{
						key: i,
						className: 'snn-anp-bar' + ( isSel && i === cur ? ' is-on' : '' ),
						style: { left: ( v.start - pageStart ) * k + 'px', width: Math.max( 8, v.duration * k ) + 'px' },
						...tipAttr( 'anim.bar' ),
						onPointerDown: ( e ) => barStart( e, l.clientId, i, false ),
					},
					h( 'span', { className: 'snn-anp-bar-text' }, tweenName( t ) ),
					// The stagger's spread: a light tail after the bar, as far as the last child starts later.
					spreadOf( t, l.kids ) > 0 ? h( 'span', { className: 'snn-anp-tail', 'aria-hidden': 'true', style: { width: spreadOf( t, l.kids ) * k + 'px' } } ) : null,
					h( 'span', { className: 'snn-anp-rz', onPointerDown: ( e ) => barStart( e, l.clientId, i, true ) } )
				);
			} );
			return h(
				'div',
				{ key: l.clientId, className: 'snn-anp-row' + ( isSel ? ' is-sel' : '' ) },
				h(
					'button',
					{ type: 'button', className: 'snn-anp-name', ...tipAttr( 'anim.lane' ), onClick: () => selectBlock( l.clientId ) },
					l.label
				),
				h(
					'div',
					{
						className: 'snn-anp-lane',
						onDoubleClick: ( e ) => {
							if ( e.target === e.currentTarget ) {
								addAt( l.clientId, pageStart + e.nativeEvent.offsetX / k );
							}
						},
					},
					bars
				)
			);
		};
		const timeline = h(
			'div',
			{ className: 'snn-anp-tl', ref: tlRef },
			h( 'div', { className: 'snn-anp-ruler', ref: rulerRef, onPointerDown: scrubStart, ...tipAttr( 'anim.ruler' ) }, ticks ),
			h( 'div', { className: 'snn-anp-rows' }, lanes.map( laneRow ) ),
			h( 'div', { className: 'snn-anp-ph', ref: phRef } )
		);
		const hint = h(
			'p',
			{ className: 'snn-anp-hint snn-anp-dock-hint' },
			selCount
				? __( 'Drag a bar to move it, its right edge to resize. Click a bar or a name to edit it on the right. Double-click a lane to add there.', 'snn' )
				: __( 'No animation on this block yet. Double-click its lane, or use Add animation.', 'snn' )
		);

		return h(
			Fragment,
			null,
			h(
				'div',
				{ className: 'snn-anp-dock-head' },
				h( 'span', { className: 'snn-anp-dock-name' }, __( 'Timeline', 'snn' ) ),
				top ? h( 'span', { className: 'snn-anp-dock-block' }, nameOf( top.name, top.attributes ) ) : null,
				h(
					'button',
					{ type: 'button', className: 'snn-anp-dock-close', 'aria-label': __( 'Close the timeline', 'snn' ), onClick: onClose },
					'×'
				)
			),
			h( 'div', { className: 'snn-anp-dock-body' }, transport, timeline, hint )
		);
	}

	/* ------------------------------------------------------------------
	 * The side panel
	 * ---------------------------------------------------------------- */

	/**
	 * The Animations sub-panel. The fields show the animation picked in the timeline (Animation, Properties), and the Scroll
	 * Trigger of the block. attrs: the block's attributes. onChange({ tweens, scroll }) writes them back. clientId: the block.
	 */
	function AnimationsPane( { attrs, clientId, onChange } ) {
		const st = stateOf( attrs || {} );
		const tweens = st.tweens;
		const scroll = st.scroll;
		const picked = usePickedTween( clientId );
		const [ , bump ] = useState( 0 );
		const [ dockHeight, setDockHeight ] = useState( loadDockHeight );
		const [ dockHost, setDockHost ] = useState( null );
		const curveRef = useRef( null );
		const cur = tweens.length ? Math.min( picked, tweens.length - 1 ) : -1;
		const tween = cur >= 0 ? tweens[ cur ] : null;
		const open = sections;
		const setOpen = ( patch ) => {
			Object.assign( sections, patch );
			bump( ( n ) => n + 1 );
		};

		const commit = ( nextTweens, nextScroll ) => onChange( { tweens: nextTweens, scroll: nextScroll || scroll } );
		const setTween = ( i, patch ) => commit( tweens.map( ( t, j ) => ( j === i ? { ...t, ...patch } : t ) ) );
		const setScroll = ( patch ) => commit( tweens, { ...scroll, ...patch } );

		useEffect( () => {
			drawCurve( curveRef.current, tween ? tween.ease : 'none' );
		}, [ tween ? tween.ease : '', cur ] );

		/*
		 * The timeline dock: a box at the bottom of the editor's content column, between the list view and the sidebar,
		 * above the breadcrumb footer. It exists while the Timeline is open. The column gets a class that lets the canvas
		 * give up the room the dock takes.
		 */
		useLayoutEffect( () => {
			if ( ! open.timeline ) {
				return undefined;
			}
			const column = document.querySelector( '.interface-interface-skeleton__content' );
			if ( ! column ) {
				return undefined;
			}
			const node = document.createElement( 'div' );
			node.className = 'snn-anp-host';
			column.appendChild( node );
			column.classList.add( 'snn-anp-docked' );
			setDockHost( node );
			return () => {
				column.classList.remove( 'snn-anp-docked' );
				node.remove();
				setDockHost( null );
			};
		}, [ open.timeline ] );

		const removeTween = () => {
			commit( tweens.filter( ( _, j ) => j !== cur ) );
			pickTween( clientId, Math.max( 0, cur - 1 ) );
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

		/* ---------- the tween ---------- */
		const tweenBody = tween
			? [
					h( Row, { key: 'presets', label: __( 'Presets', 'snn' ), changed: tween.presets.length > 0, tip: 'anim.presets' },
						h( AnimationPicker, {
							value: tween.presets,
							multiple: true,
							groups: PRESET_GROUPS,
							tip: 'anim.presets',
							onChange: ( v ) => setTween( cur, { presets: v } ),
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

		/* The dock's height: at least DOCK_MIN, at most 80% of the content column, which the canvas keeps the rest of. */
		const dockMax = dockHost && dockHost.parentElement ? Math.max( DOCK_MIN, Math.round( dockHost.parentElement.clientHeight * 0.8 ) ) : DOCK_DEFAULT;
		const dockH = Math.min( Math.max( dockHeight, DOCK_MIN ), dockMax );
		const dock =
			dockHost && open.timeline
				? createPortal(
						h(
							ResizableBox,
							{
								className: 'snn-anp-dock',
								size: { width: '100%', height: dockH },
								minHeight: DOCK_MIN,
								maxHeight: dockMax,
								enable: { top: true, right: false, bottom: false, left: false, topLeft: false, topRight: false, bottomLeft: false, bottomRight: false },
								onResizeStop: ( e, dir, el ) => {
									const v = Math.round( el.offsetHeight );
									setDockHeight( v );
									saveDockHeight( v );
								},
							},
							h( TimelineDock, { clientId, onClose: () => setOpen( { timeline: false } ) } )
						),
						dockHost
				  )
				: null;

		// Order: the Animation fields first, always open (no header, no accordion), then Properties, then the Timeline (its
		// dock is under the canvas), then the Scroll Trigger.
		return h(
			'div',
			{ className: 'snn-anp' },
			tween ? h( 'div', { className: 'snn-acc' }, h( 'div', { className: 'snn-acc-body' }, tweenBody ) ) : null,
			tween
				? h( Accordion, { title: __( 'Properties', 'snn' ), open: open.props, changed: tween.from && Object.keys( tween.from ).length > 0, onToggle: ( v ) => setOpen( { props: v } ) }, propsBody )
				: null,
			h(
				Accordion,
				{ title: __( 'Timeline', 'snn' ), open: open.timeline, changed: tweens.length > 0, tip: 'anim.timeline', onToggle: ( v ) => setOpen( { timeline: v } ) },
				h( 'p', { className: 'snn-anp-hint' }, __( 'Shown below the canvas. Close it here or with its × button.', 'snn' ) ),
				dock
			),
			h( Accordion, { title: __( 'Scroll Trigger', 'snn' ), open: open.scroll, changed: scrollChanged, tip: 'scroll.on', onToggle: ( v ) => setOpen( { scroll: v } ) }, scrollBody )
		);
	}

	window.snnAnimationPane = {
		AnimationsPane,
		stateOf,
		canvasDataAnimate,
		toDataAnimate,
	};
} )( window.wp, window.snnControls );
