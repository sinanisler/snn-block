/**
 * List View resize: a grab handle on the right edge of the List View panel. Dragging it sets the panel width between
 * MIN and MAX pixels; a double-click puts it back to DEF. The width is a CSS variable (--snn-lv-width) read by the
 * rule in editor-list-view.php, and it is saved per user in WordPress's preferences store (scope snn, key
 * listViewWidth), so it follows the user across browsers.
 *
 * WordPress draws the panel with React and removes it when the List View closes, so a MutationObserver adds the handle
 * each time the panel appears. React does not draw the handle, so a redraw of the panel keeps it.
 *
 * Wide screens only (782px and up): below that the panel fills the screen. Exposes nothing.
 */
( function ( wp ) {
	const MIN = 200;
	const MAX = 500;
	const DEF = 300;
	const SCOPE = 'snn';
	const KEY = 'listViewWidth';
	const PANEL = '.editor-list-view-sidebar';
	const HANDLE = 'snn-lv-resize';
	const { __ } = wp.i18n;

	const clamp =( n ) => Math.min( MAX, Math.max( MIN, Math.round( n ) ) );

	function saved() {
		try {
			const v = wp.data.select( 'core/preferences' ).get( SCOPE, KEY );
			return typeof v === 'number' ? clamp( v ) : DEF;
		} catch ( e ) {
			return DEF;
		}
	}

	function apply( w ) {
		document.documentElement.style.setProperty( '--snn-lv-width', w + 'px' );
	}

	function save( w ) {
		try {
			wp.data.dispatch( 'core/preferences' ).set( SCOPE, KEY, w );
		} catch ( e ) {}
	}

	function attach( panel ) {
		if ( panel.querySelector( ':scope > .' + HANDLE ) ) {
			return;
		}
		const handle = document.createElement( 'div' );
		handle.className = HANDLE;
		handle.setAttribute( 'role', 'separator' );
		handle.setAttribute( 'aria-orientation', 'vertical' );
		handle.setAttribute( 'aria-label', __( 'Resize List View', 'snn' ) );
		handle.setAttribute( 'aria-valuemin', MIN );
		handle.setAttribute( 'aria-valuemax', MAX );
		handle.tabIndex = 0;
		handle.title = __( 'Drag to resize, double-click to reset', 'snn' );

		const set = ( w, keep ) => {
			w = clamp( w );
			apply( w );
			handle.setAttribute( 'aria-valuenow', w );
			if ( keep ) {
				save( w );
			}
			return w;
		};
		set( saved(), false );

		handle.addEventListener( 'pointerdown', ( e ) => {
			if ( e.button !== 0 ) {
				return;
			}
			e.preventDefault();
			const rect = panel.getBoundingClientRect();
			let w = panel.offsetWidth;
			try {
				handle.setPointerCapture( e.pointerId );
			} catch ( err ) {}
			document.body.classList.add( 'snn-lv-resizing' );
			const move = ( ev ) => {
				w = set( ev.clientX - rect.left, false );
			};
			const up = () => {
				handle.removeEventListener( 'pointermove', move );
				handle.removeEventListener( 'pointerup', up );
				handle.removeEventListener( 'pointercancel', up );
				document.body.classList.remove( 'snn-lv-resizing' );
				set( w, true );
			};
			handle.addEventListener( 'pointermove', move );
			handle.addEventListener( 'pointerup', up );
			handle.addEventListener( 'pointercancel', up );
		} );
		handle.addEventListener( 'dblclick', () => set( DEF, true ) );
		handle.addEventListener( 'keydown', ( e ) => {
			const step = e.shiftKey ? 50 : 10;
			if ( e.key === 'ArrowLeft' ) {
				set( panel.offsetWidth - step, true );
			} else if ( e.key === 'ArrowRight' ) {
				set( panel.offsetWidth + step, true );
			} else if ( e.key === 'Home' ) {
				set( MIN, true );
			} else if ( e.key === 'End' ) {
				set( MAX, true );
			} else {
				return;
			}
			e.preventDefault();
		} );
		panel.appendChild( handle );
	}

	function scan() {
		document.querySelectorAll( PANEL ).forEach( attach );
	}

	wp.domReady( () => {
		apply( saved() );
		scan();
		new MutationObserver( scan ).observe( document.body, { childList: true, subtree: true } );
		// The preferences store may load after this script runs; take the saved width once it does.
		let last = saved();
		wp.data.subscribe( () => {
			const now = saved();
			if ( now !== last ) {
				last = now;
				apply( now );
			}
		} );
	} );
} )( window.wp );
