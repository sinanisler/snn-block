/**
 * SNN Image block, the editor side: the Content tab (the Image and Link to groups of the Bricks image element, without its
 * overlay) and the picture on the canvas. The front end is block.php in this folder: keep the settings and the picture
 * style in step with it. The media helpers and the photo search are shared (controls/media.js, snn.media).
 *
 * Registers snn.blocks['snn/image']; editor/register.js puts ImagePane in the Content tab and ImageCanvas in the element.
 */
( function ( wp ) {
	const { createElement: h, useState } = wp.element;
	const { __ } = wp.i18n;
	const { useResolved, shownOf, useMedia, plainText, pickImage, ImageSlot, ImageBrowser } = snn.media;
	const { Group, Row, SwitchRow, Select, TextField } = snn.controls;

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

	/** The picture's inline style, as the front end writes it (image.php, img_style()). */
	function imageCss( a ) {
		// vertical-align, not display: the accessibility widget clears the inline display of images (image.php).
		const css = a.stretch
			? { verticalAlign: 'top', width: '100%', height: '100%', maxWidth: '100%' }
			: { verticalAlign: 'top', maxWidth: '100%', height: 'auto' };
		return css;
	}

	/** What a pick from the photo search sets on the block: the library picture (id and URL), or the Unsplash URL (its source is kept as data, not shown). */
	function fromSearch( pick ) {
		return { imageId: pick.id || 0, imageUrl: pick.url || '', imageAlt: pick.alt || '', imageSource: pick.source || {} };
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
	function ImagePane( { a, set, pick, def, base, styleA, styleSet, device, hovering } ) {
		// The picture settings (aspect ratio, object fit and position) are style values: the hover state while it is on, and per view.
		const V = snn.panel.ViewValue;
		const Rest = snn.panel.ContentRest;
		const sa = styleA || a;
		const sset = styleSet || set;
		const [ browse, setBrowse ] = useState( null );
		const providers = ( ( snn.data.blocks || {} ).image || {} ).providers || {};
		const { TagRow, isChanged } = snn.panel;
		const ch = ( k ) => isChanged( a, base, k );
		const sources = Array.isArray( a.sources ) ? a.sources : [];
		const hasSources = sources.length > 0;
		return h(
			'div',
			{ className: 'snn-pane' },
			h(
				Rest,
				{ hovering },
				h(
				Group,
				{ title: __( 'Image', 'snn' ) },
				h(
					ImageSlot,
					{
						value: { id: a.imageId || 0, url: a.imageUrl || '' },
						label: __( 'Select image', 'snn' ),
						onChange: ( v ) => pick( { imageId: v.id, imageUrl: v.url, imageAlt: '', imageSource: {} } ),
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
							onPick: ( found ) => {
								pick( fromSearch( found ) );
								setBrowse( null );
							},
					  } )
					: null,
				h(
					Row,
					{ label: __( 'Dynamic data', 'snn' ), changed: ch( 'imageDynamic' ) },
					h( TextField, { value: a.imageDynamic || '', label: __( 'Dynamic data', 'snn' ), placeholder: '{featured_image}', onChange: ( v ) => set( { imageDynamic: v } ) } )
				),
				h(
					Row,
					{ label: __( 'Custom URL', 'snn' ), changed: ch( 'imageCustomUrl' ) },
					h( TextField, { value: a.imageCustomUrl || '', label: __( 'Custom URL', 'snn' ), placeholder: 'https://', onChange: ( v ) => set( { imageCustomUrl: v } ) } )
				),
				// The tag of the element. With sources the picture element goes inside it, so the tag stays (block.php render()).
				h( TagRow, { a, set: pick, def } ),
				h(
					Row,
					{ label: __( 'Sources', 'snn' ), changed: hasSources },
					h(
						'button',
						{
							type: 'button',
							className: 'snn-bt-link',
							onClick: () => pick( { sources: sources.concat( [ { breakpoint: 'tablet', media: '', imageId: 0, imageUrl: '' } ] ) } ),
						},
						__( 'Add source', 'snn' )
					)
				),
				h( 'div', { className: 'snn-img-hint' }, __( 'Show different images per breakpoint.', 'snn' ) ),
				hasSources ? h( SourcesList, { rows: sources, onChange: ( v ) => set( { sources: v } ) } ) : null,
				h(
					Row,
					{ label: __( 'Caption type', 'snn' ), changed: ch( 'captionType' ) },
					h( Select, { value: a.captionType, options: CAPTION_OPTIONS, label: __( 'Caption type', 'snn' ), onChange: ( v ) => pick( { captionType: v } ) } )
				),
				a.captionType === 'custom'
					? h(
							Row,
							{ label: __( 'Custom caption', 'snn' ), changed: ch( 'captionCustom' ) },
							h( TextField, { value: a.captionCustom || '', label: __( 'Custom caption', 'snn' ), onChange: ( v ) => set( { captionCustom: v } ) } )
					  )
					: null,
				h(
					Row,
					{ label: __( 'Loading', 'snn' ), changed: ch( 'loading' ) },
					h( Select, { value: a.loading, options: LOADING_OPTIONS, label: __( 'Loading', 'snn' ), onChange: ( v ) => pick( { loading: v } ) } )
				),
				h( SwitchRow, { label: __( 'Stretch', 'snn' ), checked: !! a.stretch, onChange: ( v ) => pick( { stretch: v } ) } )
			),
			),
			h(
				Group,
				{ title: __( 'Picture', 'snn' ) },
				h( V, { a: sa, set: sset, device, k: 'pictureAspectRatio', label: __( 'Aspect ratio', 'snn' ), placeholder: '16 / 9' } ),
				h( V, { a: sa, set: sset, device, k: 'objectFit', label: __( 'Object fit', 'snn' ), kind: 'select', options: OBJECT_FIT_OPTIONS } ),
				h( V, { a: sa, set: sset, device, k: 'objectPosition', label: __( 'Object position', 'snn' ), placeholder: '50% 50%' } )
			),
			h(
				Group,
				{ title: __( 'Link to', 'snn' ) },
				h(
					Row,
					{ label: __( 'Link to', 'snn' ), changed: ch( 'linkTo' ) },
					h( Select, { value: a.linkTo, options: LINK_OPTIONS, label: __( 'Link to', 'snn' ), onChange: ( v ) => pick( { linkTo: v } ) } )
				),
				a.linkTo === 'url'
					? h(
							Row,
							{ label: __( 'Custom URL', 'snn' ), changed: ch( 'linkUrl' ) },
							h( TextField, { value: a.linkUrl || '', label: __( 'Link URL', 'snn' ), placeholder: 'https://', onChange: ( v ) => set( { linkUrl: v } ) } )
					  )
					: null,
				[ 'attachment', 'media', 'url' ].includes( a.linkTo )
					? h( SwitchRow, { label: __( 'Open in new tab', 'snn' ), checked: !! a.linkNewTab, onChange: ( v ) => pick( { linkNewTab: v } ) } )
					: null
			)
		);
	}

	/**
	 * One source of the picture on the canvas, as sources_html() in block.php writes it: a named breakpoint is a
	 * max-width query of that view's width, a custom one its own query. The canvas is as wide as the view on show, so the
	 * browser picks the same source as on the front end. Nothing when the row has no picture yet.
	 */
	function CanvasSource( { row } ) {
		const media = useMedia( row.imageId || 0 );
		const url = ( media && media.source_url ) || row.imageUrl || '';
		const bp = snn.data.breakpoints || { tablet: 991, mobile: 478 };
		const query = row.breakpoint === 'custom' ? row.media || '' : '(max-width: ' + ( bp[ row.breakpoint ] || 0 ) + 'px)';
		return url && query ? h( 'source', { media: query, srcSet: url } ) : null;
	}

	/** The sources in the front end's order: the named ones narrowest first, then the custom ones as listed. */
	function sortedSources( rows ) {
		const bp = snn.data.breakpoints || { tablet: 991, mobile: 478 };
		const named = rows.filter( ( r ) => r.breakpoint !== 'custom' ).sort( ( x, y ) => ( bp[ x.breakpoint ] || 0 ) - ( bp[ y.breakpoint ] || 0 ) );
		return named.concat( rows.filter( ( r ) => r.breakpoint === 'custom' ) );
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
		const sources = Array.isArray( a.sources ) ? sortedSources( a.sources ) : [];
		const shownPicture = src && sources.length ? h( 'picture', null, sources.map( ( r, i ) => h( CanvasSource, { key: i, row: r } ) ), picture ) : picture;
		return h(
			tag,
			{ ...root, style: { margin: 0, ...( root.style || {} ) }, className: [ root.className, 'snn-image-root' ].filter( Boolean ).join( ' ' ) },
			shownPicture,
			caption ? h( 'figcaption', null, caption ) : null
		);
	}

	snn.registerBlock( 'snn/image', { Pane: ImagePane, Canvas: ImageCanvas } );
} )( window.wp );
