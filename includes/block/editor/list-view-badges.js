/**
 * List View badges: an icon at the right of a block's row in the List View for each feature the block uses. The icons
 * are the block panel's own glyphs (controls/block-tools.js):
 *   loop            Query loop is on (the panel has the switch, not an icon, so this is the loop arrows)
 *   conditions      the block has conditions (the layers icon)
 *   interactions    the block has interactions (the pointer icon)
 *   animations      the block has GSAP animations (the sparkles), when the GSAP setting is on
 *
 * The List View has no place for extra content on a row, so this script adds one span to each row, after the block's
 * name, and keeps it in step with the block store. React does not draw the span, so the List View can redraw its rows
 * without removing it. Only rows with a badge get one. A click on the badges selects the block.
 *
 * Loaded in the block editor after block-tools.js and animation-pane.js (see editor-list-view.php).
 * Exposes nothing. Uses wp.element only, so it runs on the editor's own React.
 */
( function ( wp, tools, pane ) {
	if ( ! tools || ! pane ) {
		return;
	}
	const { createElement: h, renderToString } = wp.element;
	const { __ } = wp.i18n;
	const { select, dispatch, subscribe } = wp.data;

	const ROW = '.block-editor-list-view-leaf[data-block]';
	const CELL = '.block-editor-list-view-block__contents-container';
	const BOX = 'snn-lv-badges';

	const LABELS = {
		loop: __( 'Query loop', 'snn' ),
		conditions: __( 'Conditions', 'snn' ),
		interactions: __( 'Interactions', 'snn' ),
		animations: __( 'Animations', 'snn' ),
	};

	/** The badges of a block, in the order they show. Each test is the one the panel header uses for its dot. */
	function badgesOf( a ) {
		const kinds = [];
		if ( a.query && a.query.enabled ) {
			kinds.push( 'loop' );
		}
		if ( Array.isArray( a.conditions ) && a.conditions.length ) {
			kinds.push( 'conditions' );
		}
		if ( Array.isArray( a.interactions ) && a.interactions.length ) {
			kinds.push( 'interactions' );
		}
		if ( ( snn.data.blockTools || {} ).gsap && pane.stateOf( a ).tweens.length ) {
			kinds.push( 'animations' );
		}
		return kinds;
	}

	/** One badge: the panel's glyph in a span, with its name as the tip. */
	function badgeHtml( kind ) {
		return renderToString( h( 'span', { className: 'snn-lv-badge', title: LABELS[ kind ] }, tools.glyph( kind ) ) );
	}

	/** Gives each List View row its badges, or takes its badges away when the block has none. */
	function paint() {
		document.querySelectorAll( ROW ).forEach( ( row ) => {
			const cell = row.querySelector( CELL );
			if ( ! cell ) {
				return;
			}
			const clientId = row.getAttribute( 'data-block' );
			const block = select( 'core/block-editor' ).getBlock( clientId );
			const kinds = block ? badgesOf( block.attributes ) : [];
			const key = kinds.join( ' ' );
			let box = cell.querySelector( ':scope > .' + BOX );
			if ( ! key ) {
				if ( box ) {
					box.remove();
				}
				return;
			}
			if ( ! box ) {
				box = document.createElement( 'span' );
				box.className = BOX;
				box.setAttribute( 'aria-hidden', 'true' );
				// After the name and the hidden description, so the badges sit at the right of the row, before the ⋮ menu.
				box.addEventListener( 'click', ( e ) => {
					e.preventDefault();
					e.stopPropagation();
					dispatch( 'core/block-editor' ).selectBlock( e.currentTarget.dataset.clientId );
				} );
				cell.appendChild( box );
			}
			if ( box.dataset.clientId !== clientId ) {
				box.dataset.clientId = clientId;
			}
			if ( box.dataset.kinds !== key ) {
				box.dataset.kinds = key;
				box.innerHTML = kinds.map( badgeHtml ).join( '' );
			}
		} );
	}

	// One paint per frame at most. The store and the DOM both change while the editor works, so both schedule one.
	let queued = false;
	function schedule() {
		if ( queued ) {
			return;
		}
		queued = true;
		window.requestAnimationFrame( () => {
			queued = false;
			paint();
		} );
	}

	subscribe( schedule );
	new MutationObserver( schedule ).observe( document.body, { childList: true, subtree: true } );
	schedule();
} )( window.wp, snn.blockTools, snn.animationPane );
