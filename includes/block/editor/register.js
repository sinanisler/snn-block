/**
 * SNN block editor: registers every block of the registry (snn.data.definitions) with the editor: its Edit, its canvas and its save.
 *
 * Part of the editor split of the old layout-blocks.js (see the change notes).
 */
( function ( wp ) {
	const C = snn.controls;
	const I = snn.layoutIcons;
	const { createElement: h, Fragment, useState, useEffect } = wp.element;
	const { __ } = wp.i18n;
	const { registerBlockType } = wp.blocks;
	const { InnerBlocks, InspectorControls, useBlockProps, useInnerBlocksProps } = wp.blockEditor;
	const { useSelect } = wp.data;
	const { Select, effectiveValues } = C;
	const { canvasDataAnimate } = snn.animationPane;
	const { Button } = wp.components;
	const { create } = wp.richText;
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
		// The block itself is selected (the store gives the same object until the block or a child changes); its markup is
		// made only then. Serializing inside the selector ran on every change anywhere in the editor, for every loop block.
		const block = useSelect( ( select ) => select( 'core/block-editor' ).getBlock( clientId ), [ clientId ] );
		const markup = wp.element.useMemo( () => ( block ? wp.blocks.serialize( block ) : '' ), [ block ] );
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
		// Nesting and context from the definition (SNN_Block::definition()): WordPress enforces these in the editor. A key
		// left empty is not passed, so the block may go anywhere and hold any block.
		const nesting = {};
		if ( def.parent && def.parent.length ) {
			nesting.parent = def.parent;
		}
		if ( def.ancestor && def.ancestor.length ) {
			nesting.ancestor = def.ancestor;
		}
		if ( Array.isArray( def.allowedBlocks ) ) {
			nesting.allowedBlocks = def.allowedBlocks;
		}
		if ( def.provides && Object.keys( def.provides ).length ) {
			nesting.providesContext = def.provides;
		}
		if ( def.context && def.context.length ) {
			nesting.usesContext = def.context;
		}
		// The inner blocks settings: the starting children, the lock and the children allowed.
		const innerOptions = { __unstableDisableLayoutClassNames: true };
		if ( def.template && def.template.length ) {
			innerOptions.template = def.template;
		}
		if ( def.templateLock ) {
			innerOptions.templateLock = def.templateLock;
		}
		if ( Array.isArray( def.allowedBlocks ) ) {
			innerOptions.allowedBlocks = def.allowedBlocks;
		}
		const save = def.supports.children
			? function Save() {
					return h( InnerBlocks.Content, null );
			  }
			: () => null;
		registerBlockType( def.name, {
			...nesting,
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
			edit: function Edit( { attributes: saved, setAttributes, clientId, context } ) {
				// WordPress does not merge defaults into an object attribute, so a query saved
				// with some keys missing gets the missing ones here (as the PHP side does).
				const a = { ...saved, query: { ...QUERY_DEFAULTS, ...( saved.query || {} ) } };
					// The block's style.css goes into the canvas the first time this type is drawn there (canvas-styles.js).
					useEffect( () => {
						snn.canvasStyles.use( def.name );
					}, [ def.name ] );
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
				// A new block is written in the current shape: it gets the current version, as an old block does when it is
				// migrated (migrations.js). Not an edit of the author's: no undo step, and the page is not marked as changed.
				useEffect( () => {
					if ( snn.migrations.needs( a ) ) {
						const be = wp.data.dispatch( 'core/block-editor' );
						if ( be.__unstableMarkNextChangeAsNotPersistent ) {
							be.__unstableMarkNextChangeAsNotPersistent();
						}
						setAttributes( { [ snn.migrations.KEY ]: snn.migrations.VERSION } );
					}
				}, [ a[ snn.migrations.KEY ] ] );
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
				// The hover state of this view, as a rule of the canvas (the front end's hover rule, style.php hover_rules()). An inline
				// style would beat it, so while a block has a hover value its normal style moves into a rule too (a class written twice).
				const hoverLevel = device === 'Tablet' ? 'tablet' : device === 'Mobile' ? 'mobile' : 'base';
				// Every element state is drawn the same way, in the order of SNN_Style::STATES (a later state wins), each with
				// its own forced class (snn-force-focus and so on) for the state the panel holds on.
				const hoverKey = cssScope( 'hover' + hoverLevel + JSON.stringify( a.states || {} ) );
				const stateSelectors = ( snn.data && snn.data.states ) || { hover: ':hover' };
				const hoverAll = Object.keys( stateSelectors )
					.map( ( id ) => {
						const own = snn.styleProps.stateValues( a, id );
						const k = '.' + hoverKey + '.' + hoverKey;
						// The state's own CSS: %root% is the block in that state (or the forced one, while the panel holds it).
						const ownCss = own.css ? scopeCss( own.css, ':is(' + k + stateSelectors[ id ] + ',' + k + '.snn-force-' + id + ')' ) : '';
						return snn.styleProps.hoverRules( a, hoverKey + '.' + hoverKey, hoverLevel, true, id ) + ownCss;
					} )
					.join( '' );
				const hoverClass = hoverAll ? hoverKey : '';
				const normalText = Object.keys( ownStyle ).length ? '.' + hoverKey + '.' + hoverKey + '{' + Object.keys( ownStyle ).map( ( k ) => k.replace( /[A-Z]/g, ( m ) => '-' + m.toLowerCase() ) + ':' + ownStyle[ k ] ).join( ';' ) + '}' : '';
				const hoverRule = hoverAll ? h( 'style', null, normalText + hoverAll ) : null;
				const blockProps = useBlockProps( {
					id: cleanId( a.htmlId ) || undefined,
					className: [ 'wp-block-' + def.name.replace( '/', '-' ), cleanClasses( a.cssClasses ), cssScoped, overlayClass, hoverClass ].filter( Boolean ).join( ' ' ),
					style: Object.keys( ownStyle ).length && ! hoverAll ? ownStyle : undefined,
					'data-animate': canvasDataAnimate( a ),
				} );
				// The children of a layout block go straight into the block's element (no list element between).
				// The layout class names are off: our blocks do not use them.
				const innerProps = useInnerBlocksProps( blockProps, innerOptions );
				const set = ( patch ) => setAttributes( patch );
				// With the query loop on, the loop's other items are drawn after the block (see LoopPreview).
				const loopPreview = a.query.enabled ? h( LoopPreview, { clientId } ) : null;
				const inspector = h( InspectorControls, null, h( Panel, { a, set, def, parts, parent, device, base: layoutDefaults( def.name ), clientId, context: context || {} } ) );

				// A block with its own canvas (Text, Image, Button, Icon, Code and the others): the canvas draws the block.
				if ( parts.Canvas ) {
					return h(
						Fragment,
						null,
						inspector,
						cssRules,
						overlayRule,
						hoverRule,
						h( parts.Canvas, { a, tag: a.tagName, rootProps: blockProps, set, def, clientId, device, context: context || {} } ),
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
						hoverRule,
						innerChildren
					),
					loopPreview
				);
			},
			// A block with children keeps them in its saved markup (a save of null would drop them). Every other block saves
			// nothing: its settings are attributes, and PHP renders the block (includes/block/engine/render.php).
			save,
			// An older block is brought to the current shape when the editor loads it (editor/migrations.js, the copy of
			// engine/migrations.php). The entry declares the old attributes so the parser hands them to the steps, and is
			// eligible for every block whose version is older; its save is the current one, so the block stays valid.
			deprecated: [
				{
					attributes: { ...snn.migrations.LEGACY_ATTRIBUTES, ...( def.attributes || {} ) },
					isEligible: ( raw ) => snn.migrations.needs( raw ),
					migrate: ( attrs, innerBlocks ) => [ snn.migrations.run( attrs, def.name ), innerBlocks ],
					save,
				},
			],
		} );
	}

	/** The element a layout block is drawn with on the canvas: the tag it prints. The a tag is drawn as an a without href. */
	function canvasTag( tagName, def ) {
		return def.tags.indexOf( tagName ) !== -1 ? tagName : def.tag;
	}

	// One block for each definition in the registry (PHP order, see SNN_Blocks::definitions()).
	defs.forEach( ( def ) => registerLayout( def ) );
} )( window.wp );
