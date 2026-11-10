/**
 * SNN Image block, the front end: a Lightbox link opens its picture in a dialog on the page. The script is loaded only
 * on pages that have such a link (image.php). Without it, or in a browser with no dialog, the link opens the picture.
 */
( function () {
	let dialog = null;

	function build() {
		dialog = document.createElement( 'dialog' );
		dialog.className = 'snn-lightbox';
		dialog.style.cssText = 'border:0;padding:0;background:transparent;max-width:92vw;max-height:92vh;';
		const img = document.createElement( 'img' );
		img.style.cssText = 'display:block;max-width:92vw;max-height:92vh;width:auto;height:auto;';
		dialog.appendChild( img );
		// A click on the picture or on the backdrop closes the dialog; Escape closes it natively.
		dialog.addEventListener( 'click', function ( e ) {
			if ( e.target === dialog || e.target === img ) {
				dialog.close();
			}
		} );
		document.body.appendChild( dialog );
	}

	document.addEventListener( 'click', function ( e ) {
		// Modified clicks (new tab, new window) keep the link's own behaviour.
		if ( e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey ) {
			return;
		}
		const link = e.target && e.target.closest ? e.target.closest( 'a[data-snn-lightbox]' ) : null;
		if ( ! link || typeof HTMLDialogElement !== 'function' ) {
			return;
		}
		e.preventDefault();
		if ( ! dialog ) {
			build();
		}
		const img = dialog.querySelector( 'img' );
		const inner = link.querySelector( 'img' );
		img.src = link.getAttribute( 'href' );
		img.alt = inner ? inner.alt : '';
		if ( ! dialog.open ) {
			dialog.showModal();
		}
	} );
} )();
