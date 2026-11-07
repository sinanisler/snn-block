/**
 * SNN tooltips: a name and a very short description when the mouse rests on a control of the block panel,
 * or when a control takes the keyboard focus.
 *
 *   data-snn-tip="key"                          the text of the key, from TIPS below
 *   data-snn-tip-name, data-snn-tip-text        a text made on the spot (an option, a variable, a tag)
 *
 * The bubble is drawn in the body, so the panel's scroll and overflow never cut it off. It sits above its control
 * and turns below it when there is no room above; it stays inside the window and below the admin bar.
 *
 * Loaded in the block editor (see includes/block/layout-blocks.php). Exposes window.snnTips.
 * Uses wp.i18n only.
 */
( function ( wp ) {
	const { __ } = wp.i18n;

	/** key: [name, short text]. The name is the label of the control; the text says what it does, in a few words. */
	const TIPS = {
		// Header and tabs
		'view.desktop': [ 'Desktop', 'Base values. Tablet and Mobile inherit from them.' ],
		'view.tablet': [ 'Tablet', 'Values for screens up to 991 px.' ],
		'view.mobile': [ 'Mobile', 'Values for screens up to 478 px.' ],
		'head.conditions': [ 'Conditions', 'Show this element only when rules hold.' ],
		'head.interactions': [ 'Interactions', 'Run an action when a trigger happens, such as a click.' ],
		'head.animations': [ 'Animations', 'Play animations on the front end.' ],
		'tab.content': [ 'Content', 'Tag, layout, query loop and advanced settings.' ],
		'tab.style': [ 'Style', 'Colours, sizes, text, borders and effects.' ],

		// Content tab: groups and element
		'group.element': [ 'Element', 'The HTML tag of this block.' ],
		'tagName': [ 'HTML tag', 'The tag this block is printed as, such as section or div.' ],
		'group.layout': [ 'Layout', 'How the contents are arranged, and the place in the parent.' ],
		'group.query': [ 'Query loop', 'Repeats this block for each post a query finds.' ],
		'group.advanced': [ 'Advanced', 'Classes and extra HTML attributes.' ],

		// Content tab: layout (flex and grid)
		'display': [ 'Display', 'Flex, grid or block: how the contents are laid out.' ],
		'direction': [ 'Direction', 'Which way the flex items run.' ],
		'direction.column': [ 'Column', 'Items stack from top to bottom.' ],
		'direction.row': [ 'Row', 'Items run from left to right.' ],
		'direction.reverse': [ 'Reverse', 'Runs the items the other way round.' ],
		'flexWrap': [ 'Wrap', 'Moves items to a new line when they run out of room.' ],
		'justifyContent': [ 'Justify', 'Spreads the items along the main direction.' ],
		'alignItems': [ 'Align', 'Places the items across the main direction.' ],
		'alignSelf': [ 'Align self', 'Places this block across its parent, overriding Align.' ],
		'alignContent': [ 'Align content', 'Spaces the lines of wrapped items or grid rows.' ],
		'justifyItems': [ 'Justify items', 'Places the grid items along their columns.' ],
		'gridColumns': [ 'Columns', 'How many equal columns the grid has.' ],
		'gridTemplate': [ 'Template', 'Column sizes, such as 1fr 2fr.' ],
		'gridRows': [ 'Rows', 'Sizes of the grid rows, such as auto or 100px.' ],
		'gridAutoColumns': [ 'Auto columns', 'Width of the columns the grid makes by itself.' ],
		'gridAutoRows': [ 'Auto rows', 'Height of the rows the grid makes by itself.' ],
		'gridAreas': [ 'Areas', 'Named grid areas, one row of names per line.' ],
		'gridAutoFlow': [ 'Flow', 'Fills the grid by row or by column.' ],
		'gridDense': [ 'Dense', 'Fills gaps by moving later items back.' ],
		'columnGap': [ 'Column gap', 'Space between the columns.' ],
		'rowGap': [ 'Row gap', 'Space between the rows.' ],
		'order': [ 'Order', 'Position in the parent. Lower numbers come first.' ],
		'flexGrow': [ 'Flex grow', 'How much this block grows into spare room.' ],
		'flexShrink': [ 'Flex shrink', 'How much this block shrinks when room is short.' ],
		'flexBasis': [ 'Flex basis', 'The size before grow and shrink apply.' ],
		'justifySelf': [ 'Justify self', 'Places this block along its grid cell.' ],
		'columnStart': [ 'Column start', 'The grid column this block starts in.' ],
		'columnSpan': [ 'Column span', 'How many grid columns this block covers.' ],
		'rowStart': [ 'Row start', 'The grid row this block starts in.' ],
		'rowSpan': [ 'Row span', 'How many grid rows this block covers.' ],
		'gridArea': [ 'Grid area', 'The name of a grid area from Areas.' ],

		// Content tab: query loop
		'queryLoop': [ 'Query loop', 'Repeats this block for each post the query finds.' ],
		'query': [ 'Query', 'The posts to loop over.' ],
		'queryOff': [ 'Query', 'Turn on Query loop first.' ],
		'postType': [ 'Post type', 'The kind of content to list, such as posts or pages.' ],
		'orderBy': [ 'Order by', 'The field the posts are sorted by.' ],
		'queryOrder': [ 'Order', 'Ascending (low first) or descending (high first).' ],
		'perPage': [ 'Per page', 'How many posts to show.' ],
		'offset': [ 'Offset', 'How many posts to skip at the start.' ],
		'parent': [ 'Child of', 'Only posts under this parent post ID.' ],
		'ignoreSticky': [ 'Ignore sticky', 'Keeps sticky posts in their normal order.' ],
		'include': [ 'Include posts', 'Only these post IDs, separated by commas.' ],
		'exclude': [ 'Exclude posts', 'Leaves out these post IDs.' ],
		'authorsIn': [ 'Include authors', 'Only posts by these user IDs.' ],
		'authorsOut': [ 'Exclude authors', 'Leaves out posts by these user IDs.' ],
		'taxonomy': [ 'Taxonomy', 'The category or tag system to filter by.' ],
		'termsIn': [ 'Include terms', 'Only posts with these term IDs.' ],
		'termsOut': [ 'Exclude terms', 'Leaves out posts with these term IDs.' ],
		'metaAdd': [ 'Meta query', 'Adds a rule on a custom field.' ],
		'metaKey': [ 'Meta key', 'The custom field name to check.' ],
		'metaCompare': [ 'Compare', 'How the field is compared with the value.' ],
		'metaValue': [ 'Meta value', 'The value to compare the field with.' ],
		'metaType': [ 'Value type', 'Compares the values as text, numbers or dates.' ],
		'metaRemove': [ 'Remove rule', 'Deletes this meta rule.' ],
		'metaRelation': [ 'Rules must match', 'All rules must match, or any one of them.' ],
		'excludeCurrent': [ 'Exclude current', 'Leaves out the post being viewed.' ],
		'isMain': [ 'Main query', 'Uses the page\'s own main query.' ],

		// Content tab: advanced
		'classes': [ 'Classes', 'CSS classes. Press Enter or Space after each one.' ],
		'classRemove': [ 'Remove class', 'Takes this class off the block.' ],
		'attributes': [ 'Attributes', 'Extra HTML attributes, such as data-* or aria-*.' ],
		'attrName': [ 'Attribute name', 'Such as data-role. No on*, class, id or style.' ],
		'attrValue': [ 'Attribute value', 'The value of this attribute.' ],
		'attrAdd': [ 'Add attribute', 'Adds a new name and value row.' ],
		'attrRemove': [ 'Remove attribute', 'Deletes this attribute.' ],

		// Style tab: groups (the rail) and their titles
		'style.layout': [ 'Layout', 'Spacing, sizing, position and misc rules.' ],
		'style.typography': [ 'Typography', 'Text colour, font, size, alignment and spacing.' ],
		'style.background': [ 'Background', 'Background colour and image.' ],
		'style.gradient': [ 'Gradient', 'A two-colour blend for the background.' ],
		'style.border': [ 'Border', 'Border, corner radius and box shadow.' ],
		'style.transform': [ 'Transform', 'Moves, turns, scales and slants the block.' ],
		'style.filters': [ 'Filters', 'Colour filters and the transition between states.' ],
		'style.css': [ 'CSS', 'Your own CSS for this block. Admins only.' ],
		'sec.spacing': [ 'Spacing', 'Margin, padding and gap.' ],
		'sec.sizing': [ 'Sizing', 'Width, height and their limits.' ],
		'sec.positioning': [ 'Positioning', 'Where the block sits, and its offsets.' ],
		'sec.misc': [ 'Misc', 'Opacity, overflow, cursor and other rules.' ],
		'sec.text': [ 'Text', 'Colour, font, weight and style.' ],
		'sec.alignment': [ 'Alignment', 'Text align and text transform.' ],
		'sec.textSpacing': [ 'Spacing', 'Line height and letter spacing.' ],
		'sec.more': [ 'More', 'Decoration, wrapping and text shadow.' ],
		'sec.colour': [ 'Colour', 'The background colour.' ],
		'sec.image': [ 'Image', 'Image, size, position and repeat.' ],
		'sec.gradient': [ 'Gradient', 'Type, angle, colours and stops.' ],
		'sec.border': [ 'Border', 'Width, style, colour and corner radius.' ],
		'sec.shadow': [ 'Box shadow', 'Offsets, blur, spread and colour.' ],
		'sec.transform': [ 'Transform', 'Origin, move, turn, scale and slant.' ],
		'sec.filter': [ 'Filter', 'Blur and colour effects.' ],
		'sec.transition': [ 'Transition', 'Which properties animate, and how.' ],

		// Style tab: margin and padding boxes, and the common controls
		'margin': [ 'Margin', 'Space outside the block.' ],
		'padding': [ 'Padding', 'Space inside the block, around its contents.' ],
		'boxLink': [ 'Link the four sides', 'One value sets all four sides.' ],
		'reset': [ 'Reset', 'Removes this view\'s value. It inherits again.' ],
		'customCss': [ 'Custom CSS', 'Your rules for this block. Use %root% for the block.' ],
		'preview': [ 'Preview', 'What the dynamic data shows on this post.' ],

		// Style tab: rows (the property names of the style table)
		'marginTop': [ 'Margin top', 'Space outside the top edge.' ],
		'marginRight': [ 'Margin right', 'Space outside the right edge.' ],
		'marginBottom': [ 'Margin bottom', 'Space outside the bottom edge.' ],
		'marginLeft': [ 'Margin left', 'Space outside the left edge.' ],
		'paddingTop': [ 'Padding top', 'Space inside the top edge.' ],
		'paddingRight': [ 'Padding right', 'Space inside the right edge.' ],
		'paddingBottom': [ 'Padding bottom', 'Space inside the bottom edge.' ],
		'paddingLeft': [ 'Padding left', 'Space inside the left edge.' ],
		'gap': [ 'Gap', 'Space between the items of a flex or grid block.' ],
		'width': [ 'Width', 'How wide the block is.' ],
		'minWidth': [ 'Min. width', 'The narrowest the block can get.' ],
		'maxWidth': [ 'Max. width', 'The widest the block can get.' ],
		'height': [ 'Height', 'How tall the block is.' ],
		'minHeight': [ 'Min. height', 'The shortest the block can get.' ],
		'maxHeight': [ 'Max. height', 'The tallest the block can get.' ],
		'aspectRatio': [ 'Aspect ratio', 'Width to height, such as 16 / 9.' ],
		'position': [ 'Position', 'How the block is placed: static, relative, absolute, fixed or sticky.' ],
		'top': [ 'Top', 'Offset from the top edge of its positioned parent.' ],
		'right': [ 'Right', 'Offset from the right edge of its positioned parent.' ],
		'bottom': [ 'Bottom', 'Offset from the bottom edge of its positioned parent.' ],
		'left': [ 'Left', 'Offset from the left edge of its positioned parent.' ],
		'zIndex': [ 'Z-index', 'Stacking order. Higher shows above lower.' ],
		'scrollSnapAlign': [ 'Scroll snap', 'Where the block snaps when the page scrolls.' ],
		'opacity': [ 'Opacity', 'How see-through the block is, in percent.' ],
		'overflow': [ 'Overflow', 'What happens to contents that do not fit: visible, hidden or clipped.' ],
		'visibility': [ 'Visibility', 'Shows or hides the block. It keeps its space.' ],
		'cursor': [ 'Cursor', 'The mouse pointer shape over the block.' ],
		'isolation': [ 'Isolation', 'Starts a new stacking group for the block.' ],
		'mixBlendMode': [ 'Blend mode', 'How the block mixes with what is behind it.' ],
		'pointerEvents': [ 'Pointer events', 'Whether the block reacts to the mouse.' ],
		'perspective': [ 'Perspective', 'Depth for the 3D transforms of its children.' ],
		'perspectiveOrigin': [ 'Perspective origin', 'The point the perspective looks from.' ],
		'color': [ 'Colour', 'The text colour.' ],
		'fontFamily': [ 'Font family', 'The typeface of the text.' ],
		'fontSize': [ 'Font size', 'How big the text is.' ],
		'fontWeight': [ 'Font weight', 'How thick the text is.' ],
		'fontStyle': [ 'Font style', 'Normal or italic.' ],
		'lineHeight': [ 'Line height', 'Space between lines of text.' ],
		'letterSpacing': [ 'Letter spacing', 'Space between letters.' ],
		'textAlign': [ 'Text align', 'Left, centre, right or justified text.' ],
		'textTransform': [ 'Text transform', 'Capitals, lower case or capitalised words.' ],
		'textDecoration': [ 'Decoration', 'Underline, overline or line through.' ],
		'textWrap': [ 'Text wrap', 'How lines break: balanced, pretty or normal.' ],
		'whiteSpace': [ 'White space', 'Whether text wraps or stays on one line.' ],
		'textShadow': [ 'Text shadow', 'A shadow behind the text.' ],
		'backgroundColor': [ 'Colour', 'The background colour.' ],
		'backgroundImage': [ 'Image URL', 'The address of the background image.' ],
		'backgroundSize': [ 'Size', 'Cover, contain or a fixed size.' ],
		'backgroundPosition': [ 'Position', 'Where the background image sits in the block.' ],
		'backgroundRepeat': [ 'Repeat', 'Whether the image repeats.' ],
		'gradientType': [ 'Type', 'Linear or radial blend.' ],
		'gradientAngle': [ 'Angle', 'Direction of a linear gradient, in degrees.' ],
		'gradientColor1': [ 'Colour 1', 'The first colour of the gradient.' ],
		'gradientStop1': [ 'Stop 1', 'Where the first colour ends, in percent.' ],
		'gradientColor2': [ 'Colour 2', 'The second colour of the gradient.' ],
		'gradientStop2': [ 'Stop 2', 'Where the second colour ends, in percent.' ],
		'borderWidth': [ 'Border width', 'Thickness of the border.' ],
		'borderStyle': [ 'Border style', 'Solid, dashed, dotted and so on.' ],
		'borderColor': [ 'Border colour', 'Colour of the border.' ],
		'borderRadius': [ 'Radius', 'Rounds the corners.' ],
		'boxShadowX': [ 'Shadow x', 'Horizontal offset of the shadow.' ],
		'boxShadowY': [ 'Shadow y', 'Vertical offset of the shadow.' ],
		'boxShadowBlur': [ 'Shadow blur', 'How soft the shadow edge is.' ],
		'boxShadowSpread': [ 'Shadow spread', 'How far the shadow grows beyond the block.' ],
		'boxShadowColor': [ 'Shadow colour', 'Colour of the shadow.' ],
		'transformOrigin': [ 'Origin', 'The point the transform turns and scales around.' ],
		'translateX': [ 'Move x', 'Moves the block sideways.' ],
		'translateY': [ 'Move y', 'Moves the block up or down.' ],
		'rotate': [ 'Rotate', 'Turns the block, in degrees.' ],
		'scale': [ 'Scale', 'Makes the block bigger or smaller. 1 is normal size.' ],
		'skewX': [ 'Skew x', 'Slants the block sideways, in degrees.' ],
		'skewY': [ 'Skew y', 'Slants the block up or down, in degrees.' ],
		'filterBlur': [ 'Blur', 'Blurs the block.' ],
		'filterBrightness': [ 'Brightness', 'Lightens or darkens the block, in percent.' ],
		'filterContrast': [ 'Contrast', 'Strengthens or softens the difference of light and dark.' ],
		'filterGrayscale': [ 'Grayscale', 'Turns the colours grey, in percent.' ],
		'filterHueRotate': [ 'Hue rotate', 'Shifts all colours round the colour wheel, in degrees.' ],
		'filterInvert': [ 'Invert', 'Turns the colours into their opposites, in percent.' ],
		'filterSaturate': [ 'Saturate', 'Makes the colours stronger or weaker, in percent.' ],
		'filterSepia': [ 'Sepia', 'Gives the block an old-photo tint, in percent.' ],
		'transitionProperty': [ 'Property', 'Which CSS properties animate when they change.' ],
		'transitionDuration': [ 'Duration', 'How long the change takes.' ],
		'transitionTiming': [ 'Timing', 'How the change speeds up and slows down.' ],
		'transitionDelay': [ 'Delay', 'Waits before the change starts.' ],

		// Dynamic data, variables and colour
		'dynamic': [ 'Dynamic data', 'Insert a live value, such as the post title.' ],
		'dynamicSearch': [ 'Search', 'Finds a dynamic data tag by its name.' ],
		'variables': [ 'Variables', 'Insert a colour or size variable from the theme.' ],
		'variablesMore': [ 'Colours', 'Colour variables, closed for size fields.' ],
		'swatch': [ 'Colour', 'Pick a colour in the browser\'s colour picker.' ],

		// Block tools: conditions, interactions, GSAP animations
		'conditionAddGroup': [ 'Or group', 'Adds a group. The element shows when any group holds.' ],
		'conditionAdd': [ 'Add condition', 'Adds a rule that must hold within its group.' ],
		'conditionField': [ 'Condition', 'The value to check, such as the post title.' ],
		'conditionCompare': [ 'Compare', 'How the value is checked, such as equals or contains.' ],
		'conditionValue': [ 'Value', 'The value to check against.' ],
		'conditionRemove': [ 'Remove condition', 'Deletes this condition.' ],
		'interactionAdd': [ 'Add interaction', 'Adds a trigger and an action.' ],
		'interactionRemove': [ 'Remove interaction', 'Deletes this interaction.' ],
		'interactionTrigger': [ 'When', 'The event that starts the action, such as a click.' ],
		'interactionAction': [ 'Do', 'What happens, such as show, hide or animate.' ],
		'interactionTarget': [ 'On', 'Which element the action applies to.' ],
		'interactionTargetId': [ 'ID', 'The ID of the element the action applies to.' ],
		'interactionAnimation': [ 'Animation', 'The animation the action plays.' ],
		'interactionDuration': [ 'Duration', 'How long the animation takes, in milliseconds.' ],
		'interactionDelay': [ 'Delay', 'Waits before the animation starts, in milliseconds.' ],
		'interactionClass': [ 'Class', 'A class the action adds or removes.' ],
		'gsapAnimation': [ 'Animation', 'GSAP animations to play on the front end.' ],
		'gsapSearch': [ 'Search', 'Finds an animation by its name.' ],
		'chipRemove': [ 'Remove', 'Takes this animation off.' ],
	};

	/** The name and text of a key, translated. Null when the key has no entry. */
	function textOf( key ) {
		const t = TIPS[ key ];
		return t ? [ __( t[ 0 ], 'snn' ), __( t[ 1 ], 'snn' ) ] : null;
	}

	/** The attributes of a control whose text is a key. */
	function attr( key ) {
		return key ? { 'data-snn-tip': key } : {};
	}

	/** The attributes of an option (one choice of a row): its own label as the name, the row's text as the description. */
	function optionAttr( label, key ) {
		const t = textOf( key );
		return { 'data-snn-tip-name': label, 'data-snn-tip-text': t ? t[ 1 ] : '' };
	}

	const DELAY = 100; // ms the mouse rests on a control before its tip opens (0.1 s, so it shows fast)
	const GAP = 6; // space between the control and its bubble
	const EDGE = 6; // least space kept between the bubble and the window's edges

	let bubble = null;
	let shown = null; // the control the bubble is open for
	let timer = 0;
	let pointerDown = false; // a click moved the focus: a focus then shows no tip

	function ensureBubble() {
		if ( ! bubble ) {
			bubble = document.createElement( 'div' );
			bubble.className = 'snn-tip';
			bubble.setAttribute( 'role', 'tooltip' );
			document.body.appendChild( bubble );
		}
		return bubble;
	}

	/** The control's name and description, or null when it has none. */
	function contentOf( el ) {
		const key = el.getAttribute( 'data-snn-tip' );
		if ( key ) {
			return textOf( key );
		}
		const name = el.getAttribute( 'data-snn-tip-name' );
		return name ? [ name, el.getAttribute( 'data-snn-tip-text' ) || '' ] : null;
	}

	/** The control under a node (or the node itself) that has a tip. */
	function tipOf( node ) {
		return node && node.closest ? node.closest( '[data-snn-tip], [data-snn-tip-name]' ) : null;
	}

	/**
	 * Places the bubble: above the control, centred on it. When there is no room above, below it. Then it moves in from
	 * the window's edges, and never goes under the WordPress admin bar.
	 */
	function place( el ) {
		const r = el.getBoundingClientRect();
		const w = bubble.offsetWidth;
		const h = bubble.offsetHeight;
		const vw = document.documentElement.clientWidth;
		const vh = window.innerHeight;
		const bar = document.getElementById( 'wpadminbar' );
		const topLimit = ( bar ? bar.getBoundingClientRect().bottom : 0 ) + EDGE;
		const roomAbove = r.top - GAP - topLimit;
		const roomBelow = vh - EDGE - ( r.bottom + GAP );
		let y = roomAbove >= h || roomAbove >= roomBelow ? r.top - GAP - h : r.bottom + GAP;
		y = Math.max( topLimit, Math.min( y, vh - EDGE - h ) );
		let x = r.left + r.width / 2 - w / 2;
		x = Math.max( EDGE, Math.min( x, vw - EDGE - w ) );
		bubble.style.left = Math.round( x ) + 'px';
		bubble.style.top = Math.round( y ) + 'px';
		bubble.setAttribute( 'data-side', y >= r.bottom ? 'below' : 'above' );
	}

	function hide() {
		clearTimeout( timer );
		timer = 0;
		shown = null;
		if ( bubble ) {
			bubble.classList.remove( 'is-shown' );
		}
	}

	function show( el ) {
		const content = el && el.isConnected ? contentOf( el ) : null;
		if ( ! content || ! content[ 0 ] ) {
			hide();
			return;
		}
		const b = ensureBubble();
		b.textContent = '';
		const name = document.createElement( 'span' );
		name.className = 'snn-tip-name';
		name.textContent = content[ 0 ];
		b.appendChild( name );
		if ( content[ 1 ] ) {
			const text = document.createElement( 'span' );
			text.className = 'snn-tip-text';
			text.textContent = content[ 1 ];
			b.appendChild( text );
		}
		shown = el;
		place( el );
		b.classList.add( 'is-shown' );
	}

	document.addEventListener(
		'mouseover',
		( e ) => {
			const el = tipOf( e.target );
			if ( el && el === shown ) {
				return;
			}
			hide();
			if ( el ) {
				timer = setTimeout( () => show( el ), DELAY );
			}
		},
		true
	);
	document.documentElement.addEventListener( 'mouseleave', hide );
	document.addEventListener( 'mousedown', () => {
		pointerDown = true;
		hide();
	}, true );
	document.addEventListener( 'keydown', () => {
		pointerDown = false;
		hide();
	}, true );
	document.addEventListener( 'scroll', hide, true );
	document.addEventListener( 'focusout', hide, true );
	document.addEventListener(
		'focusin',
		( e ) => {
			hide();
			const el = tipOf( e.target );
			if ( el && ! pointerDown ) {
				show( el );
			}
		},
		true
	);

	window.snnTips = {
		TIPS,
		has: ( key ) => Object.prototype.hasOwnProperty.call( TIPS, key ),
		text: textOf,
		attr,
		optionAttr,
		hide,
	};
} )( window.wp );
