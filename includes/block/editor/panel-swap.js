/**
 * Panel swap: a button in the editor's top-right toolbar (after the Global styles button) that swaps the two side
 * panels. On: the List View and the inserter move to the right of the canvas, and Settings (our block panels) moves
 * to the left. Off: WordPress's own order.
 *
 * The swap is CSS only (flex order on the skeleton's three columns, see editor-panel-swap.php), turned on by the
 * body class snn-panels-swapped. WordPress's DOM is not moved, so React keeps working as usual. The choice is saved
 * in localStorage (snn-panels-swapped), so it is the same on the next visit in this browser.
 *
 * Exposes window.snnPanelSwap.isOn() for list-view-resize.js, which puts its handle on the other edge when swapped.
 */
( function ( wp ) {
	const KEY = 'snn-panels-swapped';
	const CLASS = 'snn-panels-swapped';
	const { __ } = wp.i18n;
	const { createElement: h, useState } = wp.element;

	function read() {
		try {
			return window.localStorage.getItem( KEY ) === '1';
		} catch ( e ) {
			return false;
		}
	}
	function write( on ) {
		try {
			window.localStorage.setItem( KEY, on ? '1' : '0' );
		} catch ( e ) {}
	}
	function apply( on ) {
		document.body.classList.toggle( CLASS, on );
	}

	window.snnPanelSwap = { isOn: () => document.body.classList.contains( CLASS ) };
	wp.domReady( () => apply( read() ) );

	function Button() {
		const [ on, setOn ] = useState( read );
		const label = on ? __( 'Panels back to their sides', 'snn' ) : __( 'Swap side panels', 'snn' );
		return h(
			wp.components.Fill,
			{ name: 'PinnedItems/core' },
			h( 'button', {
				type: 'button',
				className: 'components-button has-icon snn-panel-swap-button' + ( on ? ' is-pressed' : '' ),
				'aria-label': label,
				'aria-pressed': on,
				title: label,
				onClick: () => {
					const next = ! on;
					setOn( next );
					write( next );
					apply( next );
				},
			}, h( 'svg', { xmlns: 'http://www.w3.org/2000/svg', width: 24, height: 24, viewBox: '0 0 24 24', 'aria-hidden': 'true', focusable: 'false' },
				// Two arrows pointing at each other's side: left-right swap.
				h( 'path', { fill: 'currentColor', d: 'M7.4 6 3 10.25l4.4 4.25 1.05-1.08-2.6-2.42H15v-1.5H5.85l2.6-2.42L7.4 6zm9.2 3.5-1.05 1.08 2.6 2.42H9v1.5h9.15l-2.6 2.42L16.6 18 21 13.75 16.6 9.5z' } )
			) )
		);
	}

	if ( wp.plugins && wp.plugins.registerPlugin && wp.components && wp.components.Fill ) {
		wp.plugins.registerPlugin( 'snn-panel-swap', { render: Button } );
	}
} )( window.wp );
