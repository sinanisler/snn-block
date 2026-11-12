/**
 * SNN block editor: the media helpers every block can use (snn.media): the media library pick, the picture slot,
 * a media record, a text with its tags filled in, and the photo search (Browse Pixabay, Browse Unsplash).
 *
 * Moved out of the Image block so other blocks (and the featured image, editor/featured-image-search.js) use the same
 * parts. snn.imageBrowser stays as a name for the photo search.
 */
( function ( wp ) {
	const { createElement: h, createPortal, useEffect, useRef, useState } = wp.element;
	const { __, sprintf } = wp.i18n;
	const PROVIDER_LABEL = { pixabay: 'Pixabay', unsplash: 'Unsplash' };
	const PICK_PATH = '/snn/v1/images/pick';

	/** The post the editor is on, for the tags' preview. 0 when there is none. */
	function currentPostId() {
		try {
			const editor = wp.data.select( 'core/editor' );
			return ( editor && editor.getCurrentPostId && editor.getCurrentPostId() ) || 0;
		} catch ( e ) {
			return 0;
		}
	}

	/** The text with its tags filled in, from the server (as the fields' preview does). A text without a tag is not sent. */
	function useResolved( text ) {
		const [ out, setOut ] = useState( '' );
		useEffect( () => {
			if ( ! text || text.indexOf( '{' ) === -1 ) {
				setOut( '' );
				return undefined;
			}
			let live = true;
			const timer = setTimeout( () => {
				wp.apiFetch( { path: '/snn/v1/dynamic-data/preview', method: 'POST', data: { text, post_id: currentPostId() } } )
					.then( ( r ) => {
						if ( live ) {
							setOut( r && typeof r.text === 'string' ? r.text : '' );
						}
					} )
					.catch( () => {
						if ( live ) {
							setOut( '' );
						}
					} );
			}, 350 );
			return () => {
				live = false;
				clearTimeout( timer );
			};
		}, [ text ] );
		return out;
	}

	/** What a value shows: the value itself when it has no tag, or its resolved text (see useResolved). */
	function shownOf( text, resolved ) {
		return text && text.indexOf( '{' ) === -1 ? text : resolved;
	}

	/** The media record of an attachment (its URL, alt text and caption), read once for the editor session. */
	const mediaCache = {};
	function useMedia( id ) {
		const [ rec, setRec ] = useState( id && mediaCache[ id ] ? mediaCache[ id ] : null );
		useEffect( () => {
			if ( ! id ) {
				setRec( null );
				return undefined;
			}
			if ( mediaCache[ id ] ) {
				setRec( mediaCache[ id ] );
				return undefined;
			}
			let live = true;
			wp.apiFetch( { path: '/wp/v2/media/' + id } )
				.then( ( m ) => {
					mediaCache[ id ] = m;
					if ( live ) {
						setRec( m );
					}
				} )
				.catch( () => {
					if ( live ) {
						setRec( null );
					}
				} );
			return () => {
				live = false;
			};
		}, [ id ] );
		return rec;
	}

	/** The text of an HTML string, read in an inert document, so no markup runs. */
	function plainText( html ) {
		return new DOMParser().parseFromString( String( html || '' ), 'text/html' ).body.textContent || '';
	}

	/** The WordPress media library: one image, handed to onChange as its id and URL. Nothing happens without the library. */
	function pickImage( onChange ) {
		if ( ! window.wp || ! window.wp.media ) {
			return;
		}
		const frame = window.wp.media( { title: __( 'Choose an image', 'snn' ), library: { type: 'image' }, button: { text: __( 'Use this image', 'snn' ) }, multiple: false } );
		frame.on( 'select', () => {
			const picked = frame.state().get( 'selection' ).first();
			const m = picked && picked.toJSON ? picked.toJSON() : null;
			if ( m && m.id ) {
				onChange( { id: m.id, url: m.url || '' } );
			}
		} );
		frame.open();
	}

	/**
	 * The picture slot: a dashed box until an image is set. Once an image is set, the picture fills the box, and a click on
	 * it opens the media library to replace it. Under the box: the children (the photo search icons, bottom left) and the
	 * Remove link (bottom right).
	 */
	function ImageSlot( { value, label, onChange, children } ) {
		const media = useMedia( value.id );
		const shown = value.url || ( media && media.source_url ) || '';
		return h(
			'div',
			{ className: 'snn-img-slot' },
			h(
				'button',
				{
					type: 'button',
					className: 'snn-img-pick' + ( shown ? ' has-image' : '' ),
					title: shown ? __( 'Replace image', 'snn' ) : label,
					'aria-label': shown ? __( 'Replace image', 'snn' ) : label,
					onClick: () => pickImage( onChange ),
				},
				shown ? h( 'img', { src: shown, alt: '' } ) : label
			),
			h(
				'div',
				{ className: 'snn-img-actions' },
				h( 'div', { className: 'snn-img-actions-left' }, children ),
				shown ? h( 'button', { type: 'button', className: 'snn-img-remove', onClick: () => onChange( { id: 0, url: '' } ) }, __( 'Remove', 'snn' ) ) : null
			)
		);
	}

	/**
	 * The photo search, a simple popup: a search box, the results as thumbnails, and Load more. A result is picked with a
	 * click. The pick goes to the server (features/image-search.php): a Pixabay photo is imported into the media library,
	 * and an Unsplash photo is hotlinked, with the download request Unsplash asks for. With importAll (the featured image),
	 * an Unsplash photo is imported too. Escape or a click outside closes it.
	 */
	function ImageBrowser( { provider, onClose, onPick, importAll } ) {
		const [ typed, setTyped ] = useState( '' );
		const [ term, setTerm ] = useState( '' );
		const [ items, setItems ] = useState( [] );
		const [ page, setPage ] = useState( 1 );
		const [ more, setMore ] = useState( false );
		const [ busy, setBusy ] = useState( false );
		const [ error, setError ] = useState( '' );
		const [ searched, setSearched ] = useState( false );
		const dialog = useRef( null );

		// Escape closes; Tab stays inside the dialog; on close, focus goes back to the button that opened it.
		useEffect( () => {
			const opener = document.activeElement;
			const onKey = ( e ) => {
				if ( e.key === 'Escape' ) {
					onClose();
					return;
				}
				if ( e.key !== 'Tab' || ! dialog.current ) {
					return;
				}
				const items = Array.from( dialog.current.querySelectorAll( 'button:not([disabled]), input, [tabindex]:not([tabindex="-1"])' ) );
				if ( ! items.length ) {
					return;
				}
				const first = items[ 0 ];
				const last = items[ items.length - 1 ];
				if ( e.shiftKey && document.activeElement === first ) {
					e.preventDefault();
					last.focus();
				} else if ( ! e.shiftKey && document.activeElement === last ) {
					e.preventDefault();
					first.focus();
				}
			};
			document.addEventListener( 'keydown', onKey );
			return () => {
				document.removeEventListener( 'keydown', onKey );
				if ( opener && opener.focus && document.contains( opener ) ) {
					opener.focus();
				}
			};
		}, [ onClose ] );

		const search = ( q, p, append ) => {
			const query = String( q || '' ).trim();
			if ( ! query ) {
				setError( __( 'Type words to search.', 'snn' ) );
				return;
			}
			setBusy( true );
			setError( '' );
			wp.apiFetch( { path: '/snn/v1/images/search?provider=' + provider + '&q=' + encodeURIComponent( query ) + '&page=' + p } )
				.then( ( r ) => {
					const list = Array.isArray( r.items ) ? r.items : [];
					setItems( ( prev ) => ( append ? prev.concat( list ) : list ) );
					setMore( !! r.more );
					setPage( p );
					setTerm( query );
					setSearched( true );
					setBusy( false );
				} )
				.catch( ( e ) => {
					setError( e && e.message ? e.message : __( 'The search failed.', 'snn' ) );
					setBusy( false );
				} );
		};

		const choose = ( item ) => {
			setError( '' );
			if ( provider === 'unsplash' && ! importAll ) {
				// The download request Unsplash asks for. If it fails, the photo is still the hotlinked one, so the pick goes on.
				wp.apiFetch( { path: PICK_PATH, method: 'POST', data: { provider, download: item.download || '' } } ).catch( ( e ) => {
					console.warn( 'Unsplash download request failed', e );
				} );
				onPick( { id: 0, url: item.url, alt: item.alt, source: { provider: 'unsplash', author: item.author || '', authorUrl: item.author_url || '', photoUrl: item.photo_url || '' } } );
				return;
			}
			setBusy( true );
			const data = provider === 'unsplash' ? { provider, unsplash_id: String( item.id ), alt: item.alt || '', import: true } : { provider, pixabay_id: item.id, alt: item.alt || '' };
			wp.apiFetch( { path: PICK_PATH, method: 'POST', data } )
				.then( ( r ) => onPick( { id: r.id, url: r.url, alt: '', source: {} } ) )
				.catch( ( e ) => {
					setBusy( false );
					setError( e && e.message ? e.message : __( 'The image could not be chosen.', 'snn' ) );
				} );
		};

		const title = sprintf( __( 'Choose a photo from %s', 'snn' ), PROVIDER_LABEL[ provider ] || provider );
		return createPortal(
			h(
				'div',
				{
					className: 'snn-img-modal-back',
					onMouseDown: ( e ) => {
						if ( e.target === e.currentTarget ) {
							onClose();
						}
					},
				},
				h(
					'div',
					{ className: 'snn-img-modal', role: 'dialog', 'aria-modal': 'true', 'aria-label': title, ref: dialog },
					h(
						'div',
						{ className: 'snn-img-modal-head' },
						h( 'strong', null, title ),
						h( 'button', { type: 'button', className: 'snn-bt-x', 'aria-label': __( 'Close', 'snn' ), onClick: onClose }, '×' )
					),
					h(
						'form',
						{
							className: 'snn-img-modal-search',
							onSubmit: ( e ) => {
								e.preventDefault();
								search( typed, 1, false );
							},
						},
						h( 'input', {
							type: 'search',
							className: 'snn-input',
							value: typed,
							placeholder: __( 'Search for photos', 'snn' ),
							'aria-label': __( 'Search for photos', 'snn' ),
							autoFocus: true,
							onChange: ( e ) => setTyped( e.target.value ),
						} ),
						h( 'button', { type: 'submit', className: 'button button-primary', disabled: busy }, __( 'Search', 'snn' ) )
					),
					error ? h( 'div', { className: 'snn-img-modal-error', role: 'alert' }, error ) : null,
					h(
						'div',
						{ className: 'snn-img-grid' },
						items.map( ( item ) =>
							h(
								'button',
								{
									type: 'button',
									key: String( item.id ),
									className: 'snn-img-tile',
									disabled: busy,
									title: item.alt || '',
									onClick: () => choose( item ),
								},
								h( 'img', { src: item.thumb, alt: item.alt || '', loading: 'lazy' } ),
								item.author ? h( 'span', { className: 'snn-img-tile-author' }, item.author ) : null
							)
						)
					),
					searched && items.length === 0 && ! busy ? h( 'p', { className: 'snn-img-hint' }, __( 'No photos found.', 'snn' ) ) : null,
					more
						? h( 'button', { type: 'button', className: 'snn-bt-link snn-img-more', disabled: busy, onClick: () => search( term, page + 1, true ) }, __( 'Load more', 'snn' ) )
						: null,
					h(
						'div',
						{ className: 'snn-img-modal-foot' },
						provider === 'unsplash' && importAll
							? __( 'Photos from Unsplash. The chosen photo is saved to the media library.', 'snn' )
							: provider === 'unsplash'
							? __( 'Photos from Unsplash.', 'snn' )
							: __( 'Photos from Pixabay. The chosen photo is saved to the media library.', 'snn' )
					)
				)
			),
			document.body
		);
	}

	snn.media = { currentPostId, useResolved, shownOf, useMedia, plainText, pickImage, ImageSlot, ImageBrowser };
	snn.imageBrowser = ImageBrowser;
} )( window.wp );
