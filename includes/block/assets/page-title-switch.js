/*
 * Hide Title: a switch in the Page tab of the block editor, between Parent and Move to trash. When it is on,
 * the post title above the canvas is hidden, so the whole design can be reviewed without the big title.
 *
 * The choice is kept in this browser only, per post (localStorage key snn-hide-title-<post ID>). Nothing is
 * saved to the database. The hiding is a style rule in the canvas document (the iframe) and in the main
 * document, and it is set again on every store change, so it follows the canvas when the editor redraws it.
 *
 * Loaded by includes/block/page-title.php in the post editor only.
 */
( function () {
	'use strict';

	var STYLE_ID = 'snn-hide-title-style';
	var RULE     = '.editor-visual-editor__post-title-wrapper { display: none !important; }';
	var KEY      = 'snn-hide-title-';

	if ( ! window.wp || ! wp.data || ! wp.element ) {
		return;
	}

	var h   = wp.element.createElement;
	var __  = wp.i18n.__;

	function postId() {
		try {
			return wp.data.select( 'core/editor' ).getCurrentPostId();
		} catch ( e ) {
			return null;
		}
	}

	function read( id ) {
		try {
			return !! id && window.localStorage.getItem( KEY + id ) === '1';
		} catch ( e ) {
			return false;
		}
	}

	function write( id, on ) {
		try {
			if ( ! id ) {
				return;
			}
			if ( on ) {
				window.localStorage.setItem( KEY + id, '1' );
			} else {
				window.localStorage.removeItem( KEY + id );
			}
		} catch ( e ) {
			// Storage can be blocked. The switch still works for this view.
		}
	}

	/** The main document, and the canvas document when the canvas is an iframe. */
	function documents() {
		var list  = [ document ];
		var frame = document.querySelector( 'iframe[name="editor-canvas"]' );
		try {
			if ( frame && frame.contentDocument ) {
				list.push( frame.contentDocument );
			}
		} catch ( e ) {
			// Not ready yet: the next store change tries again.
		}
		return list;
	}

	/*
	 * A new canvas iframe is a blank document at first (no html or head yet). Such a document is skipped here, and
	 * the next store change tries again. Errors are caught: a failure here must never stop the editor.
	 */
	function apply( on ) {
		documents().forEach( function ( doc ) {
			try {
				var root = doc.head || doc.documentElement;
				if ( ! root ) {
					return;
				}
				var style = doc.getElementById( STYLE_ID );
				if ( on && ! style ) {
					style    = doc.createElement( 'style' );
					style.id = STYLE_ID;
					style.textContent = RULE;
					root.appendChild( style );
				} else if ( ! on && style ) {
					style.parentNode.removeChild( style );
				}
			} catch ( e ) {
				// Not ready or not reachable: the next store change tries again.
			}
		} );
	}

	/** Bring the canvas in step with the saved choice of the open post. */
	function sync() {
		apply( read( postId() ) );
	}

	/** The row: the label on the left, the switch on the right. */
	function HideTitleRow() {
		var id = wp.data.useSelect( function ( select ) {
			return select( 'core/editor' ).getCurrentPostId();
		}, [] );

		var state = wp.element.useState( false );
		var on    = state[ 0 ];
		var setOn = state[ 1 ];

		wp.element.useEffect( function () {
			setOn( read( id ) );
		}, [ id ] );

		function change( value ) {
			setOn( value );
			write( id, value );
			apply( value );
		}

		return h(
			wp.editor.PluginPostStatusInfo,
			{ className: 'snn-hide-title-row' },
			h( 'label', { htmlFor: 'snn-hide-title', className: 'snn-hide-title-row__label' }, __( 'Hide Title', 'snn' ) ),
			h( wp.components.FormToggle, {
				id: 'snn-hide-title',
				checked: on,
				onChange: function ( event ) {
					change( event.target.checked );
				},
			} )
		);
	}

	function register() {
		if ( ! wp.plugins || ! wp.plugins.registerPlugin || ! wp.editor || ! wp.editor.PluginPostStatusInfo || ! wp.components || ! wp.components.FormToggle ) {
			return;
		}
		// No scope: the default scope is the one the post editor renders (scope names take only a-z, 0-9 and dashes).
		wp.plugins.registerPlugin( 'snn-hide-title', {
			render: HideTitleRow,
		} );
	}

	register();
	sync();
	wp.data.subscribe( sync );
} )();
