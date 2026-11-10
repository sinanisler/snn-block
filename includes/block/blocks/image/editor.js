/**
 * SNN Image block, the editor side: the Content tab (the Image and Link to groups of the Bricks image element, without its
 * overlay) and the picture on the canvas, and the photo search (Browse Pixabay, Browse Unsplash). The front end is drawn by ./image.php: keep the settings and the
 * picture style in step with it.
 *
 * Loaded after controls.js and before layout-blocks.js (includes/block/layout-blocks.php). Exposes window.snnImageBlock.
 * layout-blocks.js puts ImagePane in the Content tab of this block, and ImageCanvas in its element.
 */
( function ( wp ) {
	const { createElement: h, createPortal, useEffect, useState } = wp.element;
	const { __, sprintf } = wp.i18n;
	const { Group, Row, SwitchRow, Select, TextField } = window.snnControls;
	const PROVIDER_LABEL = { pixabay: 'Pixabay', unsplash: 'Unsplash' };
	const PICK_PATH = '/snn/v1/images/pick';

	const TAG_OPTIONS = [ { value: 'figure', label: 'figure' }, { value: 'div', label: 'div' } ];
	const OBJECT_FIT_OPTIONS = [ 'fill', 'contain', 'cover', 'scale-down', 'none' ].map( ( v ) => ( { value: v, label: v } ) );
	const CAPTION_OPTIONS = [
		{ value: 'none', label: __( 'None', 'snn' ) },
		{ value: 'attachment', label: __( 'Attachment', 'snn' ) },
		{ value: 'custom', label: __( 'Custom', 'snn' ) },
	];
	const LOADING_OPTIONS = [ { value: 'lazy', label: 'lazy' }, { value: 'eager', label: 'eager' } ];
	const LINK_OPTIONS = [
		{ value: 'none', label: __( 'None', 'snn' ) },
		{ value: 'lightbox', label: __( 'Lightbox', 'snn' ) },
		{ value: 'attachment', label: __( 'Attachment page', 'snn' ) },
		{ value: 'media', label: __( 'Media file', 'snn' ) },
		{ value: 'url', label: __( 'Custom URL', 'snn' ) },
	];
	const SOURCE_OPTIONS = [
		{ value: 'tablet', label: __( 'Tablet', 'snn' ) },
		{ value: 'mobile', label: __( 'Mobile', 'snn' ) },
		{ value: 'custom', label: __( 'Custom query', 'snn' ) },
	];

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

	/** The picture's inline style, as the front end writes it (image.php, img_style()). */
	function imageCss( a ) {
		// vertical-align, not display: the accessibility widget clears the inline display of images (image.php).
		const css = a.stretch
			? { verticalAlign: 'top', width: '100%', height: '100%', maxWidth: '100%' }
			: { verticalAlign: 'top', maxWidth: '100%', height: 'auto' };
		if ( a.objectFit ) {
			css.objectFit = a.objectFit;
		}
		if ( a.objectPosition ) {
			css.objectPosition = a.objectPosition;
		}
		if ( a.aspectRatio ) {
			css.aspectRatio = a.aspectRatio;
		}
		return css;
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

		/** What a pick from the photo search sets on the block: the library picture (id and URL), or the Unsplash URL (its source is kept as data, not shown). */
	function fromSearch( pick ) {
		return { imageId: pick.id || 0, imageUrl: pick.url || '', imageAlt: pick.alt || '', imageSource: pick.source || {} };
	}

	/**
	 * The photo search, a simple popup: a search box, the results as thumbnails, and Load more. A result is picked with a
	 * click. The pick goes to the server (blocks/image/image-search.php): a Pixabay photo is imported into the media library,
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

		useEffect( () => {
			const onKey = ( e ) => {
				if ( e.key === 'Escape' ) {
					onClose();
				}
			};
			document.addEventListener( 'keydown', onKey );
			return () => document.removeEventListener( 'keydown', onKey );
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
					{ className: 'snn-img-modal', role: 'dialog', 'aria-modal': 'true', 'aria-label': title },
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

	/** The sources for other breakpoints: a row each, with its breakpoint, a media query for a custom one, and its picture. */
	function SourcesList( { rows, onChange } ) {
		const setAt = ( i, patch ) => onChange( rows.map( ( r, j ) => ( j === i ? { ...r, ...patch } : r ) ) );
		const removeAt = ( i ) => onChange( rows.filter( ( r, j ) => j !== i ) );
		return h(
			'div',
			{ className: 'snn-img-sources' },
			rows.map( ( r, i ) =>
				h(
					'div',
					{ key: i, className: 'snn-img-source' },
					h(
						'div',
						{ className: 'snn-img-source-top' },
						h( Select, { value: r.breakpoint, options: SOURCE_OPTIONS, label: __( 'Breakpoint', 'snn' ), onChange: ( v ) => setAt( i, { breakpoint: v } ) } ),
						h( 'button', { type: 'button', className: 'snn-bt-x', 'aria-label': __( 'Remove source', 'snn' ), onClick: () => removeAt( i ) }, '×' )
					),
					r.breakpoint === 'custom'
						? h( TextField, { value: r.media || '', label: __( 'Media query', 'snn' ), placeholder: '(max-width: 600px)', onChange: ( v ) => setAt( i, { media: v } ) } )
						: null,
					h( ImageSlot, {
						value: { id: r.imageId || 0, url: r.imageUrl || '' },
						label: __( 'Select image', 'snn' ),
						onChange: ( v ) => setAt( i, { imageId: v.id, imageUrl: v.url } ),
					} )
				)
			)
		);
	}

	/**
	 * The Content tab of the Image block: the Image group (the picture, dynamic data, custom URL, HTML tag, sources,
	 * aspect ratio, object fit and position, caption, loading and stretch) and the Link to group.
	 */
	function ImagePane( { a, set } ) {
		const [ browse, setBrowse ] = useState( null );
		const providers = ( ( window.snnBlockData || {} ).image || {} ).providers || {};
		const sources = Array.isArray( a.sources ) ? a.sources : [];
		const hasSources = sources.length > 0;
		return h(
			'div',
			{ className: 'snn-pane' },
			h(
				Group,
				{ title: __( 'Image', 'snn' ) },
				h(
					ImageSlot,
					{
						value: { id: a.imageId || 0, url: a.imageUrl || '' },
						label: __( 'Select image', 'snn' ),
						onChange: ( v ) => set( { imageId: v.id, imageUrl: v.url, imageAlt: '', imageSource: {} } ),
					},
					// The photo search icons, bottom left: P for Pixabay, U for Unsplash, each shown when its key is set.
					providers.pixabay
						? h( 'button', { type: 'button', className: 'snn-img-browse-icon', title: __( 'Browse Pixabay', 'snn' ), 'aria-label': __( 'Browse Pixabay', 'snn' ), onClick: () => setBrowse( 'pixabay' ) }, 'P' )
						: null,
					providers.unsplash
						? h( 'button', { type: 'button', className: 'snn-img-browse-icon', title: __( 'Browse Unsplash', 'snn' ), 'aria-label': __( 'Browse Unsplash', 'snn' ), onClick: () => setBrowse( 'unsplash' ) }, 'U' )
						: null
				),
				browse
					? h( ImageBrowser, {
							provider: browse,
							onClose: () => setBrowse( null ),
							onPick: ( pick ) => {
								set( fromSearch( pick ) );
								setBrowse( null );
							},
					  } )
					: null,
				h(
					Row,
					{ label: __( 'Dynamic data', 'snn' ), changed: !! a.imageDynamic },
					h( TextField, { value: a.imageDynamic || '', label: __( 'Dynamic data', 'snn' ), placeholder: '{featured_image}', onChange: ( v ) => set( { imageDynamic: v } ) } )
				),
				h(
					Row,
					{ label: __( 'Custom URL', 'snn' ), changed: !! a.imageCustomUrl },
					h( TextField, { value: a.imageCustomUrl || '', label: __( 'Custom URL', 'snn' ), placeholder: 'https://', onChange: ( v ) => set( { imageCustomUrl: v } ) } )
				),
				// The tag is for the element itself. With sources, the picture element takes the place of the tag, so it is hidden.
				hasSources
					? null
					: h(
							Row,
							{ label: __( 'HTML tag', 'snn' ), changed: a.tagName !== 'figure' },
							h( Select, { value: a.tagName, options: TAG_OPTIONS, label: __( 'HTML tag', 'snn' ), onChange: ( v ) => set( { tagName: v } ) } )
					  ),
				h(
					Row,
					{ label: __( 'Sources', 'snn' ), changed: hasSources },
					h(
						'button',
						{
							type: 'button',
							className: 'snn-bt-link',
							onClick: () => set( { sources: sources.concat( [ { breakpoint: 'tablet', media: '', imageId: 0, imageUrl: '' } ] ) } ),
						},
						__( 'Add source', 'snn' )
					)
				),
				h( 'div', { className: 'snn-img-hint' }, __( 'Show different images per breakpoint.', 'snn' ) ),
				hasSources ? h( SourcesList, { rows: sources, onChange: ( v ) => set( { sources: v } ) } ) : null,
				h(
					Row,
					{ label: __( 'Aspect ratio', 'snn' ), changed: !! a.aspectRatio },
					h( TextField, { value: a.aspectRatio || '', label: __( 'Aspect ratio', 'snn' ), placeholder: '16 / 9', onChange: ( v ) => set( { aspectRatio: v } ) } )
				),
				h(
					Row,
					{ label: __( 'Object fit', 'snn' ), changed: a.objectFit !== 'fill' },
					h( Select, { value: a.objectFit, options: OBJECT_FIT_OPTIONS, label: __( 'Object fit', 'snn' ), onChange: ( v ) => set( { objectFit: v } ) } )
				),
				h(
					Row,
					{ label: __( 'Object position', 'snn' ), changed: a.objectPosition !== '50% 50%' },
					h( TextField, { value: a.objectPosition || '', label: __( 'Object position', 'snn' ), placeholder: '50% 50%', onChange: ( v ) => set( { objectPosition: v } ) } )
				),
				h(
					Row,
					{ label: __( 'Caption type', 'snn' ), changed: a.captionType !== 'attachment' },
					h( Select, { value: a.captionType, options: CAPTION_OPTIONS, label: __( 'Caption type', 'snn' ), onChange: ( v ) => set( { captionType: v } ) } )
				),
				a.captionType === 'custom'
					? h(
							Row,
							{ label: __( 'Custom caption', 'snn' ), changed: !! a.captionCustom },
							h( TextField, { value: a.captionCustom || '', label: __( 'Custom caption', 'snn' ), onChange: ( v ) => set( { captionCustom: v } ) } )
					  )
					: null,
				h(
					Row,
					{ label: __( 'Loading', 'snn' ), changed: a.loading !== 'lazy' },
					h( Select, { value: a.loading, options: LOADING_OPTIONS, label: __( 'Loading', 'snn' ), onChange: ( v ) => set( { loading: v } ) } )
				),
				h( SwitchRow, { label: __( 'Stretch', 'snn' ), checked: !! a.stretch, onChange: ( v ) => set( { stretch: v } ) } )
			),
			h(
				Group,
				{ title: __( 'Link to', 'snn' ) },
				h(
					Row,
					{ label: __( 'Link to', 'snn' ), changed: a.linkTo !== 'none' },
					h( Select, { value: a.linkTo, options: LINK_OPTIONS, label: __( 'Link to', 'snn' ), onChange: ( v ) => set( { linkTo: v } ) } )
				),
				a.linkTo === 'url'
					? h(
							Row,
							{ label: __( 'Custom URL', 'snn' ), changed: !! a.linkUrl },
							h( TextField, { value: a.linkUrl || '', label: __( 'Link URL', 'snn' ), placeholder: 'https://', onChange: ( v ) => set( { linkUrl: v } ) } )
					  )
					: null,
				[ 'attachment', 'media', 'url' ].includes( a.linkTo )
					? h( SwitchRow, { label: __( 'Open in new tab', 'snn' ), checked: !! a.linkNewTab, onChange: ( v ) => set( { linkNewTab: v } ) } )
					: null
			)
		);
	}

	/**
	 * The picture on the canvas, drawn as the front end draws it: the dynamic value, the custom URL, or the picture
	 * from the library. tag is the element (figure or div) and style its layout, as for the other blocks.
	 */
	function ImageCanvas( { a, tag, rootProps, set } ) {
		const root = rootProps || {};
		const dynamicOut = useResolved( a.imageDynamic || '' );
		const customOut = useResolved( a.imageCustomUrl || '' );
		const captionOut = useResolved( a.captionCustom || '' );
		const media = useMedia( a.imageId || 0 );
		const dynamicUrl = shownOf( a.imageDynamic || '', dynamicOut );
		const customUrl = shownOf( a.imageCustomUrl || '', customOut );
		const src = dynamicUrl || customUrl || ( media && media.source_url ) || a.imageUrl || '';
		const alt = media && src === media.source_url ? media.alt_text || '' : a.imageAlt || '';
		let caption = '';
		if ( a.captionType === 'attachment' && media && media.caption ) {
			caption = plainText( media.caption.rendered );
		}
		if ( a.captionType === 'custom' ) {
			caption = shownOf( a.captionCustom || '', captionOut );
		}
		const picture = src
			? h( 'img', { src, alt, style: imageCss( a ) } )
			: h(
					'button',
					{
						type: 'button',
							className: 'snn-image-empty',
							// A click on the empty picture opens the media library, as the Select image button does.
							onClick: () => pickImage( ( v ) => set( { imageId: v.id, imageUrl: v.url, imageAlt: '', imageSource: {} } ) ),
						style: {
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
							minHeight: 80,
							border: '1px dashed #8c8f94',
							color: '#646970',
							fontSize: 12,
							padding: 12,
							width: '100%',
							background: 'none',
							cursor: 'pointer',
							font: 'inherit',
						},
					},
					__( 'Click to choose an image', 'snn' )
			  );
		return h(
			tag,
			{ ...root, style: { margin: 0, ...( root.style || {} ) }, className: [ root.className, 'snn-image-root' ].filter( Boolean ).join( ' ' ) },
			picture,
			caption ? h( 'figcaption', null, caption ) : null
		);
	}

	window.snnImageBlock = { ImagePane, ImageCanvas, ImageBrowser };
} )( window.wp );
