/**
 * SNN block editor: registers every block of the registry (snn.data.definitions) with the editor: its Edit, its canvas and its save.
 *
 * Part of the editor split of the old layout-blocks.js (see the change notes).
 */
( function ( wp ) {
	const C = snn.controls;
	const I = snn.layoutIcons;
	const { createElement: h, Fragment, useState, useEffect, useRef, useLayoutEffect } = wp.element;
	const { __, sprintf } = wp.i18n;
	const { registerBlockType } = wp.blocks;
	const { InnerBlocks, InspectorControls, RichText, useBlockProps, useInnerBlocksProps } = wp.blockEditor;
	const { useSelect } = wp.data;
	const { main: mainPic, cross: crossPic, direction: directionPic, reverse: reversePic, columns: columnsPic } = I;
	const { Row, SwitchRow, Accordion, Select, Segmented, TextField, Group, Disclosure, Dot, Switch, ViewRow, ownValue, inheritedValue, setValue, clearValue, effectiveValues, tipAttr, ToolbarPicker } = C;
	const { HeadIcons, ClassesEditor, AttributesEditor, ConditionsEditor, InteractionsEditor } = snn.blockTools;
	const { AnimationsPane, stateOf, canvasDataAnimate } = snn.animationPane;
	const { ColorPalette, MediaUpload, MediaUploadCheck } = wp.blockEditor;
	const { Button, ColorPicker, Fill, Popover, ToolbarButton } = wp.components;
	const { applyFormat, create, getActiveFormat, insert, insertObject, removeFormat, toggleFormat } = wp.richText;
	const data = snn.data.controls || {};
	const { Panel, QUERY_DEFAULTS, badgeText, cleanClasses, cleanCss, cleanId, cssScope, defs, hasViewRule, layoutDefaults, scopeCss } = snn.panel;

	/**
	 * The loop's other items on the canvas, after the block itself. The block stays the first item, with its tags as
	 * tags, so it is the one to edit. The items after it come from the server (snn/v1/loop/preview), rendered as the
	 * front end renders them, and follow every change to the block or its children after a short pause. They are a
	 * picture: a click on one selects the loop block. The wrapper has display: contents, so each item is a child of
	 * the parent's flex or grid, as on the front end.
	 */
	function LoopPreview( { clientId } ) {
		const markup = useSelect(
			( select ) => {
				const block = select( 'core/block-editor' ).getBlock( clientId );
				return block ? wp.blocks.serialize( block ) : '';
			},
			[ clientId ]
		);
		const postId = useSelect( ( select ) => {
			try {
				return select( 'core/editor' ).getCurrentPostId() || 0;
			} catch ( e ) {
				return 0;
			}
		}, [] );
		const [ result, setResult ] = useState( null );
		useEffect( () => {
			let live = true;
			const timer = setTimeout( () => {
				wp.apiFetch( { path: '/snn/v1/loop/preview', method: 'POST', data: { block: markup, post_id: postId } } )
					.then( ( r ) => live && setResult( r ) )
					.catch( () => live && setResult( null ) );
			}, 400 );
			return () => {
				live = false;
				clearTimeout( timer );
			};
		}, [ markup, postId ] );
		if ( ! result || ! Array.isArray( result.items ) || ! result.items.length ) {
			return null;
		}
		return h( 'div', {
			className: 'snn-loop-preview',
			contentEditable: false,
			'aria-hidden': true,
			// A link or button in an item does nothing here; the click selects the loop block instead.
			onClickCapture: ( e ) => {
				e.preventDefault();
				e.stopPropagation();
				wp.data.dispatch( 'core/block-editor' ).selectBlock( clientId );
			},
			dangerouslySetInnerHTML: { __html: ( result.styles || '' ) + result.items.join( '' ) },
		} );
	}

	/**
	 * Which block holds each CSS ID: "scope|id" => clientId. A block puts its ID here when it is drawn and takes it out
	 * when it goes. One lookup tells a block whether its ID is taken, so no block reads all the others. The scope is the
	 * synced pattern the block is in ('' outside one): the same pattern used twice shares its blocks' attributes, so its
	 * two copies can never have different IDs and are not compared with each other.
	 */
	const idOwners = new Map();

	/** True when that block is still on the page with that ID (an entry can outlive its block by a moment). */
	function holdsId( clientId, id ) {
		const attrs = wp.data.select( 'core/block-editor' ).getBlockAttributes( clientId );
		return !! attrs && attrs.htmlId === id;
	}

	/** A CSS ID for a block: 'snn-' and eight lowercase letters or digits. */
	function newBlockId() {
		const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
		let id = 'snn-';
		for ( let i = 0; i < 8; i++ ) {
			id += chars.charAt( Math.floor( Math.random() * chars.length ) );
		}
		return id;
	}

	/**
	 * Registers one block type. The attributes are the ones PHP registers (def.attributes); the Content pane and the canvas
	 * come from the block's own parts (snn.blocks[name]: Pane, Canvas). A block without a canvas of its own is drawn as its
	 * element with its children, which is the layout blocks (Section, Container, Div).
	 */
	function registerLayout( def ) {
		const parts = snn.blocks[ def.name ] || {};
		registerBlockType( def.name, {
			apiVersion: 3,
			title: def.title,
			category: def.category || 'design',
			icon: def.icon,
			// Our panel carries these settings. The core panels (colour, spacing, dimensions and so on)
			// are off, so the inspector shows only ours.
			supports: {
				html: false,
				anchor: false,
				className: false,
				customClassName: false,
				// Core's Additional CSS (the Advanced panel textarea). Our Custom CSS is the CSS group of the Style tab.
				// The server switch (block-defaults.php) does not reach here: the editor takes these supports as they are.
				customCSS: false,
				color: false,
				spacing: false,
				dimensions: false,
				typography: false,
				layout: false,
				background: false,
				border: false,
				shadow: false,
				position: false,
			},
			attributes: def.attributes || {},
			edit: function Edit( { attributes: saved, setAttributes, clientId } ) {
				// WordPress does not merge defaults into an object attribute, so a query saved
				// with some keys missing gets the missing ones here (as the PHP side does).
				const a = { ...saved, query: { ...QUERY_DEFAULTS, ...( saved.query || {} ) } };
				// The parent's display and direction: Align self's pictures turn with them.
				const parentId = useSelect( ( select ) => select( 'core/block-editor' ).getBlockRootClientId( clientId ), [ clientId ] );
				const parentAttrs = useSelect(
					( select ) => ( parentId ? select( 'core/block-editor' ).getBlockAttributes( parentId ) : null ),
					[ parentId ]
				);
				// Every block gets its CSS ID by default: a new one when it has none, and a new one when another block
				// already holds this one (a copy). The first block to hold an ID keeps it, so the original of a copy keeps
				// its ID and its interactions still find it (see idOwners). The ID is saved with the block.
				const idScope = useSelect( ( select ) => select( 'core/block-editor' ).getBlockParentsByBlockName( clientId, 'core/block', true )[ 0 ] || '', [ clientId ] );
				useEffect( () => {
					const id = a.htmlId;
					const key = idScope + '|' + id;
					const owner = id ? idOwners.get( key ) : undefined;
					if ( ! id || ( owner && owner !== clientId && holdsId( owner, id ) ) ) {
						// Not an edit of the author's: no undo step, and a page that is only opened is not marked as changed.
						const be = wp.data.dispatch( 'core/block-editor' );
						if ( be.__unstableMarkNextChangeAsNotPersistent ) {
							be.__unstableMarkNextChangeAsNotPersistent();
						}
						setAttributes( { htmlId: newBlockId() } );
						return undefined;
					}
					idOwners.set( key, clientId );
					return () => {
						if ( idOwners.get( key ) === clientId ) {
							idOwners.delete( key );
						}
					};
				}, [ a.htmlId, idScope ] );
				// The view the editor shows (Desktop, Tablet or Mobile): the values of that view are drawn on the canvas.
				const device = useSelect( ( select ) => {
					try {
						return select( 'core/editor' ).getDeviceType() || 'Desktop';
					} catch ( e ) {
						return 'Desktop';
					}
				}, [] );
				// The parent as this view shows it: its display and direction for the device (Align self's pictures follow them).
				const parentShown = effectiveValues( parentAttrs || {}, device );
				const parent = {
					display: parentShown.display || '',
					flexDirection: parentShown.flexDirection || 'row',
				};
				// The style of the block: the same table the front end prints (snn.styleProps), for this view. A view that
				// has its own values is drawn with its view rule, as the front end does (the display is written then too).
				const shown = effectiveValues( a, device );
				const ownStyle = snn.styleProps.styleObject( shown, { view: hasViewRule( a, device ) } );
				// The custom CSS as the front end prints it, scoped to this block: the class goes on the element, the
				// rules in a style element (inside the element for a block with children, before it for the others).
				const cssText = cleanCss( a.customCss );
				const cssScoped = cssText ? cssScope( cssText ) : '';
				const cssRules = cssScoped ? h( 'style', null, scopeCss( cssText, '.' + cssScoped ) ) : null;
				// The overlay (Apply to: Overlay) is the ::before of the block's element, as on the front end.
				const overlayPairs = snn.styleProps.overlay( shown );
				const overlayClass = overlayPairs.length ? cssScope( 'overlay' + JSON.stringify( overlayPairs ) ) : '';
				const overlayRule = overlayClass ? h( 'style', null, '.' + overlayClass + '::before{' + overlayPairs.map( ( d ) => d[ 0 ] + ':' + d[ 1 ] ).join( ';' ) + '}' ) : null;
				const blockProps = useBlockProps( {
					id: cleanId( a.htmlId ) || undefined,
					className: [ 'wp-block-' + def.name.replace( '/', '-' ), cleanClasses( a.cssClasses ), cssScoped, overlayClass ].filter( Boolean ).join( ' ' ),
					style: Object.keys( ownStyle ).length ? ownStyle : undefined,
					'data-animate': canvasDataAnimate( a ),
				} );
				// The children of a layout block go straight into the block's element (no list element between).
				// The layout class names are off: our blocks do not use them.
				const innerProps = useInnerBlocksProps( blockProps, { __unstableDisableLayoutClassNames: true } );
				const set = ( patch ) => setAttributes( patch );
				// With the query loop on, the loop's other items are drawn after the block (see LoopPreview).
				const loopPreview = a.query.enabled ? h( LoopPreview, { clientId } ) : null;
				const inspector = h( InspectorControls, null, h( Panel, { a, set, def, parts, parent, device, base: layoutDefaults( def.name ), clientId } ) );

				// A block with its own canvas (Text, Image, Button, Icon, Code and the others): the canvas draws the block.
				if ( parts.Canvas ) {
					return h(
						Fragment,
						null,
						inspector,
						cssRules,
						overlayRule,
						h( parts.Canvas, { a, tag: a.tagName, rootProps: blockProps, set, def, clientId, device } ),
						loopPreview
					);
				}
				// The element itself, as the front end prints it: the block's tag, ID, classes and style, with its children.
				const { children: innerChildren, ...elementProps } = innerProps;
				return h(
					Fragment,
					null,
					inspector,
					h(
						canvasTag( a.tagName, def ),
						elementProps,
						a.query.enabled ? h( 'div', { className: 'snn-loop-badge', contentEditable: false }, badgeText( a.query ) ) : null,
						cssRules,
						overlayRule,
						innerChildren
					),
					loopPreview
				);
			},
			// A block with children keeps them in its saved markup (a save of null would drop them). Every other block saves
			// nothing: its settings are attributes, and PHP renders the block (includes/block/engine/render.php).
			save: def.supports.children
				? function Save() {
						return h( InnerBlocks.Content, null );
				  }
				: () => null,
		} );
	}

	/** The element a layout block is drawn with on the canvas: the tag it prints. The a tag is drawn as an a without href. */
	function canvasTag( tagName, def ) {
		return def.tags.indexOf( tagName ) !== -1 ? tagName : def.tag;
	}

	// One block for each definition in the registry (PHP order, see SNN_Blocks::definitions()).
	defs.forEach( ( def ) => registerLayout( def ) );
} )( window.wp );
