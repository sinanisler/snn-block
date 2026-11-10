/**
 * The photo search under the featured image (Post panel): P for Pixabay and U for Unsplash, the same icons and popup as
 * the Image block (blocks/image/image-editor.js, snn.imageBrowser). A featured image must be a media
 * library item, so both providers import the chosen photo (the caption stays empty), and the post's
 * featured_media is set to it. Each icon shows when its key is saved and the user can upload files
 * (snn.data.blocks.image.featured, from the Image block's editor_data()).
 */
( function ( wp ) {
	const { createElement: h, Fragment, useState } = wp.element;
	const { __ } = wp.i18n;

	function SearchIcons( { onUpdateImage } ) {
		const [ browse, setBrowse ] = useState( null );
		const on = ( ( snn.data.blocks || {} ).image || {} ).featured || {};
		const Browser = snn.imageBrowser;
		if ( ! Browser || ( ! on.pixabay && ! on.unsplash ) ) {
			return null;
		}
		return h(
			'div',
			{ className: 'snn-featured-search' },
			on.pixabay
				? h( 'button', { type: 'button', className: 'snn-img-browse-icon', title: __( 'Browse Pixabay', 'snn' ), 'aria-label': __( 'Browse Pixabay', 'snn' ), onClick: () => setBrowse( 'pixabay' ) }, 'P' )
				: null,
			on.unsplash
				? h( 'button', { type: 'button', className: 'snn-img-browse-icon', title: __( 'Browse Unsplash', 'snn' ), 'aria-label': __( 'Browse Unsplash', 'snn' ), onClick: () => setBrowse( 'unsplash' ) }, 'U' )
				: null,
			browse
				? h( Browser, {
						provider: browse,
						importAll: true,
						onClose: () => setBrowse( null ),
						onPick: ( pick ) => {
							if ( pick && pick.id ) {
								onUpdateImage( { id: pick.id } );
							}
							setBrowse( null );
						},
				  } )
				: null
		);
	}

	wp.hooks.addFilter( 'editor.PostFeaturedImage', 'snn/featured-image-search', ( Original ) => ( props ) =>
		h( Fragment, null, h( Original, props ), h( SearchIcons, { onUpdateImage: props.onUpdateImage } ) )
	);
} )( window.wp );
