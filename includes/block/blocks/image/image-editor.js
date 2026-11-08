/**
 * SNN Image block, the editor side: the Content tab (the Image and Link to groups of the Bricks image element, without its
 * overlay and Unsplash) and the picture on the canvas. The front end is drawn by ./image.php: keep the settings and the
 * picture style in step with it.
 *
 * Loaded after controls.js and before layout-blocks.js (includes/block/layout-blocks.php). Exposes window.snnImageBlock.
 * layout-blocks.js puts ImagePane in the Content tab of this block, and ImageCanvas in its element.
 */
( function ( wp ) {
	const { createElement: h, useEffect, useState } = wp.element;
	const { __ } = wp.i18n;
	const { Group, Row, SwitchRow, Select, TextField } = window.snnControls;

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

	/** A picture button: a dashed box, with its thumbnail and a remove button once an image is set. */
	function ImageSlot( { value, label, onChange } ) {
		const media = useMedia( value.id );
		const shown = value.url || ( media && media.source_url ) || '';
		return h(
			'div',
			{ className: 'snn-img-slot' },
			shown ? h( 'img', { className: 'snn-img-thumb', src: shown, alt: '' } ) : null,
			h( 'button', { type: 'button', className: 'snn-img-pick', onClick: () => pickImage( onChange ) }, shown ? __( 'Replace image', 'snn' ) : label ),
			shown ? h( 'button', { type: 'button', className: 'snn-bt-link', onClick: () => onChange( { id: 0, url: '' } ) }, __( 'Remove', 'snn' ) ) : null
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
		const sources = Array.isArray( a.sources ) ? a.sources : [];
		const hasSources = sources.length > 0;
		return h(
			'div',
			{ className: 'snn-pane' },
			h(
				Group,
				{ title: __( 'Image', 'snn' ) },
				h( ImageSlot, {
					value: { id: a.imageId || 0, url: a.imageUrl || '' },
					label: __( 'Select image', 'snn' ),
					onChange: ( v ) => set( { imageId: v.id, imageUrl: v.url } ),
				} ),
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
	function ImageCanvas( { a, tag, style, className } ) {
		const dynamicOut = useResolved( a.imageDynamic || '' );
		const customOut = useResolved( a.imageCustomUrl || '' );
		const captionOut = useResolved( a.captionCustom || '' );
		const media = useMedia( a.imageId || 0 );
		const dynamicUrl = shownOf( a.imageDynamic || '', dynamicOut );
		const customUrl = shownOf( a.imageCustomUrl || '', customOut );
		const src = dynamicUrl || customUrl || ( media && media.source_url ) || a.imageUrl || '';
		const alt = media && src === media.source_url ? media.alt_text || '' : '';
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
					'span',
					{
						className: 'snn-image-empty',
						style: {
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
							minHeight: 80,
							border: '1px dashed #8c8f94',
							color: '#646970',
							fontSize: 12,
							padding: 12,
						},
					},
					__( 'Choose an image in the Image panel', 'snn' )
			  );
		return h(
			tag,
			{ style, className: [ 'snn-image-root', className ].filter( Boolean ).join( ' ' ) || undefined },
			picture,
			caption ? h( 'figcaption', null, caption ) : null
		);
	}

	window.snnImageBlock = { ImagePane, ImageCanvas };
} )( window.wp );
