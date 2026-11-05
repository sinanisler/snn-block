# Bricks foundation controls: generated reference

Generated 2026-11-05 from the Bricks 2.4.5 registry dump (`lab/bricks/elements2.json`, read from bricks.local). Six elements: Section, Container, Heading, Basic Text, Image, Button. This file records what Bricks ships. It makes no design decisions.

**How to read the tables**

- **Default tab**: the controls Bricks shows under CONTENT. Bricks calls it "content", but most of it is the element's own defaults (tag, text, style) plus the flex and grid primitives. Their registry tab is empty.
- **Style tab**: the controls under STYLE, grouped (Layout, Typography, Background and so on). The `_` groups are shared by every element.
- **Options**: the select keys in the registry. Labels are not in the dump. "(+N)" means more keys exist.
- **Flags**: units (number with a unit), responsive (per breakpoint), var() (accepts a global variable), dynamic (accepts dynamic data), repeater (sub-fields).
- **Shows when**: the registry condition. Grid item controls are shown by builder JS (see the `_gridItem` note in includes/elements/container.php), not by a registry condition.

## Element summary

| Element | Label | Tag (default) | Nestable | Controls | Default tab | Style tab | Style groups |
|---|---|---|---|---|---|---|---|
| `section` | Section | `section` | yes | 88 | 29 | 59 | Layout, Typography, Background, Border / Box Shadow, Gradient / Overlay, Shape dividers, Transform, CSS, Attributes |
| `container` | Container | `div` | yes | 88 | 29 | 59 | Layout, Typography, Background, Border / Box Shadow, Gradient / Overlay, Shape dividers, Transform, CSS, Attributes |
| `heading` | Heading | `h3` | no | 75 | 14 | 61 | Layout, Typography, Background, Border / Box Shadow, Gradient / Overlay, Transform, CSS, Attributes |
| `text-basic` | Basic Text | `div` | no | 68 | 7 | 61 | Layout, Typography, Background, Border / Box Shadow, Gradient / Overlay, Transform, CSS, Attributes |
| `image` | Image | `figure` | no | 103 | 43 | 60 | Layout, Typography, Background, Border / Box Shadow, Gradient / Overlay, Transform, CSS, Attributes |
| `button` | Button | `span` | no | 74 | 13 | 61 | Layout, Typography, Background, Border / Box Shadow, Gradient / Overlay, Transform, CSS, Attributes |

**Section and Container share one PHP class.** `Element_Section extends Element_Container` (includes/elements/section.php). Only the default tag, the label, the icon, and the child element list differ. The registry gives both 88 rows, and the diff at the end confirms it.

## Section (`section`)

Class `Bricks\Element_Section`. Default tag `section`. Nestable: yes.

### Default tab (29 controls)

| Control | Key | Type | Options | CSS (property @ selector) | Flags | Shows when |
|---|---|---|---|---|---|---|
| Content | `_content` | text |  | content |  |  |
| Grid column | `_gridItemColumnSpan` | text |  | grid-column |  |  |
| Grid row | `_gridItemRowSpan` | text |  | grid-row |  |  |
| Justify self | `_gridItemJustifySelf` | align-items |  | justify-self |  |  |
| Link | `link` | link |  |  |  | tag = a |
| HTML tag | `tag` | select | div, section, a, article, nav, ol, ul, li, aside, address, figure, custom |  |  |  |
| Custom tag | `customTag` | text |  |  |  | tag = custom |
| Display | `_display` | select | flex, inline-flex, grid, block, inline-block, inline, none | display, align-items |  |  |
| Gap | `_gridGap` | number |  | gap | units | _display = flex or inline-flex or grid |
| Column gap | `_columnGap` | number |  | column-gap | units | _display = flex or inline-flex or grid |
| Row gap | `_rowGap` | number |  | row-gap | units | _display = flex or inline-flex or grid |
| Grid template columns | `_gridTemplateColumns` | text |  | grid-template-columns | var() | _display = grid |
| Grid template rows | `_gridTemplateRows` | text |  | grid-template-rows | var() | _display = grid |
| Grid auto columns | `_gridAutoColumns` | text |  | grid-auto-columns | var() | _display = grid |
| Grid auto rows | `_gridAutoRows` | text |  | grid-auto-rows | var() | _display = grid |
| Grid auto flow | `_gridAutoFlow` | select | row, column, dense | grid-auto-flow |  | _display = grid |
| Justify items | `_justifyItemsGrid` | justify-content |  | justify-items |  | _display = grid |
| Align items | `_alignItemsGrid` | align-items |  | align-items |  | _display = grid |
| Justify content | `_justifyContentGrid` | justify-content |  | justify-content |  | _display = grid |
| Align content | `_alignContentGrid` | align-items |  | align-content |  | _display = grid |
| Flex wrap | `_flexWrap` | select | nowrap, wrap, wrap-reverse | flex-wrap |  | _display = flex or inline-flex |
| Direction | `_direction` | direction |  | flex-direction |  | _display = flex or inline-flex |
| Align self | `_alignSelf` | align-items |  | align-self, width |  | _display = flex or inline-flex |
| Align main axis | `_justifyContent` | justify-content |  | justify-content |  | _display = flex or inline-flex |
| Align cross axis | `_alignItems` | align-items |  | align-items |  | _display = flex or inline-flex |
| Flex grow | `_flexGrow` | number |  | flex-grow |  | _display = flex or inline-flex |
| Flex shrink | `_flexShrink` | number |  | flex-shrink |  | _display = flex or inline-flex |
| Flex basis | `_flexBasis` | text |  | flex-basis | var() | _display = flex or inline-flex |
| Order | `_order` | number |  | order |  | _display != none |

### Style: Layout (`_layout`, 39 controls)

| Control | Key | Type | Options | CSS (property @ selector) | Flags | Shows when |
|---|---|---|---|---|---|---|
| Margin | `_margin` | spacing |  | margin |  |  |
| Padding | `_padding` | spacing |  | padding |  |  |
| Width | `_width` | number |  | width | units |  |
| Min. width | `_widthMin` | number |  | min-width | units |  |
| Max. width | `_widthMax` | number |  | max-width | units |  |
| Height | `_height` | number |  | height | units |  |
| Min. height | `_heightMin` | number |  | min-height | units |  |
| Max. height | `_heightMax` | number |  | max-height | units |  |
| Aspect ratio | `_aspectRatio` | text |  | aspect-ratio | var() |  |
| Position | `_position` | select | static, relative, absolute, fixed, sticky | position |  |  |
| Top | `_top` | number |  | top | units |  |
| Right | `_right` | number |  | right | units |  |
| Bottom | `_bottom` | number |  | bottom | units |  |
| Left | `_left` | number |  | left | units |  |
| Z-index | `_zIndex` | number |  | z-index |  |  |
| Type | `_scrollSnapType` | select | unset, y mandatory, y proximity, x mandatory, x proximity | scroll-snap-type |  |  |
| Align | `_scrollSnapAlign` | select | start, center, end | scroll-snap-align |  |  |
| Stop | `_scrollSnapStop` | select | normal, always | scroll-snap-stop |  |  |
| Visibility | `_visibility` | select | visible, hidden, collapse | visibility |  |  |
| Overflow | `_overflow` | text |  | overflow |  |  |
| Opacity | `_opacity` | number |  | opacity |  |  |
| Cursor | `_cursor` | select | generalGroupTitle, auto, default, none, linkGroupTitle, pointer, context-menu, help, progress, wait, selectionGroupTitle, cell (+30) | cursor |  |  |
| Isolation | `_isolation` | select | auto, isolate | isolation |  |  |
| Mix blend mode | `_mixBlendMode` | select | normal, multiply, screen, overlay, darken, lighten, color-dodge, color-burn, hard-light, soft-light, difference, exclusion (+4) | mix-blend-mode |  |  |
| Pointer events | `_pointerEvents` | text |  | pointer-events |  |  |
| Perspective | `_perspective` | number |  | perspective | units |  |
| Perspective origin | `_perspectiveOrigin` | text |  | perspective-origin |  |  |
| Masonry layout | `_useMasonry` | checkbox |  |  |  |  |
| Columns | `_masonryColumn` | number |  | --columns |  | _useMasonry = true |
| Spacing | `_masonryGutter` | number |  | --gutter | units | _useMasonry = true |
| Horizontal order | `_masonryHorizontalOrder` | checkbox |  |  |  | _useMasonry = true |
| Transition: Duration | `_masonryTransitionDuration` | number |  |  | units | _useMasonry = true |
| Reveal animation | `_masonryTransitionMode` | select | scale, fade, slideLeft, slideRight, skew |  |  | _useMasonry = true AND _masonryTransitionDuration != 0 or 0s |
| Margin | `_innerContainerMargin` | spacing |  | margin @ > .brxe-container, margin @ > .brxe-block, margin @ > .brxe-div |  |  |
| Padding | `_innerContainerPadding` | spacing |  | padding @ > .brxe-container, padding @ > .brxe-block, padding @ > .brxe-div |  |  |
| Entry animation | `_animation` | select | bounce, flash, pulse, rubberBand, shakeX, shakeY, headShake, swing, tada, wobble, jello, heartBeat (+85) |  |  |  |
| Animation duration | `_animationDuration` | select | very-slow, slow, normal, fast, very-fast, custom |  |  | _animation !=  |
| Animation duration (Custom) | `_animationDurationCustom` | text |  |  |  | _animationDuration = custom |
| Animation delay | `_animationDelay` | text |  |  |  | _animation !=  |

### Style: Typography (`_typography`, 1 controls)

| Control | Key | Type | Options | CSS (property @ selector) | Flags | Shows when |
|---|---|---|---|---|---|---|
| (no label) | `_typography` | typography |  | font |  |  |

### Style: Background (`_background`, 1 controls)

| Control | Key | Type | Options | CSS (property @ selector) | Flags | Shows when |
|---|---|---|---|---|---|---|
| (no label) | `_background` | background |  | background |  |  |

### Style: Border / Box Shadow (`_border`, 2 controls)

| Control | Key | Type | Options | CSS (property @ selector) | Flags | Shows when |
|---|---|---|---|---|---|---|
| Border | `_border` | border |  | border |  |  |
| Box shadow | `_boxShadow` | box-shadow |  | box-shadow |  |  |

### Style: Gradient / Overlay (`_gradient`, 1 controls)

| Control | Key | Type | Options | CSS (property @ selector) | Flags | Shows when |
|---|---|---|---|---|---|---|
| (no label) | `_gradient` | gradient |  | background-image |  |  |

### Style: Shape dividers (`_shapes`, 1 controls)

| Control | Key | Type | Options | CSS (property @ selector) | Flags | Shows when |
|---|---|---|---|---|---|---|
| (no label) | `_shapeDividers` | repeater |  |  | repeater: Custom shape (SVG), Fill color, Front, Flip x-axis, Flip y-axis, Overflow, Height, Width, Rotate °, Horizontal align, Vertical align, Top, Right, Bottom, Left |  |

### Style: Transform (`_transform`, 8 controls)

| Control | Key | Type | Options | CSS (property @ selector) | Flags | Shows when |
|---|---|---|---|---|---|---|
| Transform | `_transform` | transform |  | transform |  |  |
| Transform origin | `_transformOrigin` | text |  | transform-origin |  |  |
| Element parallax | `_motionElementParallax` | checkbox |  |  |  |  |
| Horizontal speed  (%) | `_motionElementParallaxSpeedX` | number |  | --brx-motion-parallax-speed-x |  | _motionElementParallax = true |
| Vertical speed  (%) | `_motionElementParallaxSpeedY` | number |  | --brx-motion-parallax-speed-y |  | _motionElementParallax = true |
| Background parallax | `_motionBackgroundParallax` | checkbox |  |  |  |  |
| Background speed  (%) | `_motionBackgroundParallaxSpeed` | number |  | --brx-motion-background-speed |  | _motionBackgroundParallax = true |
| Parallax start point  (%) | `_motionStartVisiblePercent` | number |  |  |  |  |

### Style: CSS (`_css`, 5 controls)

| Control | Key | Type | Options | CSS (property @ selector) | Flags | Shows when |
|---|---|---|---|---|---|---|
| Custom CSS | `_cssCustom` | code |  |  | var() |  |
| CSS classes | `_cssClasses` | text |  |  |  |  |
| CSS ID | `_cssId` | text |  |  |  |  |
| CSS Filters | `_cssFilters` | filters |  | filter |  |  |
| Transition | `_cssTransition` | text |  | transition | var() |  |

### Style: Attributes (`_attributes`, 1 controls)

| Control | Key | Type | Options | CSS (property @ selector) | Flags | Shows when |
|---|---|---|---|---|---|---|
| (no label) | `_attributes` | repeater |  |  | repeater: Name, Value |  |

## Container (`container`)

Class `Bricks\Element_Container`. Default tag `div`. Nestable: yes.

Same control list as Section. See the Section table above and the diff at the end.

## Heading (`heading`)

Class `Bricks\Element_Heading`. Default tag `h3`. Nestable: no.

### Default tab (14 controls)

| Control | Key | Type | Options | CSS (property @ selector) | Flags | Shows when |
|---|---|---|---|---|---|---|
| Content | `_content` | text |  | content |  |  |
| (no label) | `text` | text |  |  |  |  |
| HTML tag | `tag` | select | h1, h2, h3, h4, h5, h6, custom |  |  |  |
| Custom tag | `customTag` | text |  |  |  | tag = custom |
| Type | `type` | select | hero, lead |  |  |  |
| Style | `style` | select | primary, secondary, light, dark, muted, info, success, warning, danger |  |  |  |
| Link to | `link` | link |  |  |  |  |
| Separator | `separator` | select | right, left, both, none |  |  |  |
| Width | `separatorWidth` | number |  | width @ .separator, flex-grow @ .separator, width | units |  |
| Height | `separatorHeight` | number |  | border-top-width @ .separator, height @ .separator | units |  |
| Spacing | `separatorSpacing` | number |  | gap @ &.has-separator | units |  |
| Style | `separatorStyle` | select | none, hidden, solid, dotted, dashed, double, groove, ridge, inset, outset | border-top-style @ .separator |  |  |
| Align | `separatorAlignItems` | align-items |  | align-items @ &.has-separator |  |  |
| Color | `separatorColor` | color |  | border-top-color @ .separator |  |  |

### Style: Layout (`_layout`, 42 controls)

| Control | Key | Type | Options | CSS (property @ selector) | Flags | Shows when |
|---|---|---|---|---|---|---|
| Margin | `_margin` | spacing |  | margin |  |  |
| Padding | `_padding` | spacing |  | padding |  |  |
| Width | `_width` | number |  | width | units |  |
| Min. width | `_widthMin` | number |  | min-width | units |  |
| Max. width | `_widthMax` | number |  | max-width | units |  |
| Height | `_height` | number |  | height | units |  |
| Min. height | `_heightMin` | number |  | min-height | units |  |
| Max. height | `_heightMax` | number |  | max-height | units |  |
| Aspect ratio | `_aspectRatio` | text |  | aspect-ratio | var() |  |
| Position | `_position` | select | static, relative, absolute, fixed, sticky | position |  |  |
| Top | `_top` | number |  | top | units |  |
| Right | `_right` | number |  | right | units |  |
| Bottom | `_bottom` | number |  | bottom | units |  |
| Left | `_left` | number |  | left | units |  |
| Z-index | `_zIndex` | number |  | z-index |  |  |
| Order | `_order` | number |  | order |  |  |
| Type | `_scrollSnapType` | select | unset, y mandatory, y proximity, x mandatory, x proximity | scroll-snap-type |  |  |
| Align | `_scrollSnapAlign` | select | start, center, end | scroll-snap-align |  |  |
| Stop | `_scrollSnapStop` | select | normal, always | scroll-snap-stop |  |  |
| Display | `_display` | select | flex, inline-flex, block, inline-block, inline, none | display, align-items |  |  |
| Visibility | `_visibility` | select | visible, hidden, collapse | visibility |  |  |
| Overflow | `_overflow` | text |  | overflow |  |  |
| Opacity | `_opacity` | number |  | opacity |  |  |
| Cursor | `_cursor` | select | generalGroupTitle, auto, default, none, linkGroupTitle, pointer, context-menu, help, progress, wait, selectionGroupTitle, cell (+30) | cursor |  |  |
| Isolation | `_isolation` | select | auto, isolate | isolation |  |  |
| Mix blend mode | `_mixBlendMode` | select | normal, multiply, screen, overlay, darken, lighten, color-dodge, color-burn, hard-light, soft-light, difference, exclusion (+4) | mix-blend-mode |  |  |
| Pointer events | `_pointerEvents` | text |  | pointer-events |  |  |
| Perspective | `_perspective` | number |  | perspective | units |  |
| Perspective origin | `_perspectiveOrigin` | text |  | perspective-origin |  |  |
| Justify self | `_gridItemJustifySelf` | align-items |  | justify-self |  |  |
| Direction | `_flexDirection` | direction |  | flex-direction |  | _display = flex |
| Align self | `_alignSelf` | align-items |  | align-self |  |  |
| Align main axis | `_justifyContent` | justify-content |  | justify-content |  | _display = flex or inline-flex |
| Align cross axis | `_alignItems` | align-items |  | align-items |  | _display = flex or inline-flex |
| Gap | `_gap` | number |  | gap | units | _display = flex or inline-flex |
| Flex grow | `_flexGrow` | number |  | flex-grow |  |  |
| Flex shrink | `_flexShrink` | number |  | flex-shrink |  |  |
| Flex basis | `_flexBasis` | text |  | flex-basis | var() |  |
| Entry animation | `_animation` | select | bounce, flash, pulse, rubberBand, shakeX, shakeY, headShake, swing, tada, wobble, jello, heartBeat (+85) |  |  |  |
| Animation duration | `_animationDuration` | select | very-slow, slow, normal, fast, very-fast, custom |  |  | _animation !=  |
| Animation duration (Custom) | `_animationDurationCustom` | text |  |  |  | _animationDuration = custom |
| Animation delay | `_animationDelay` | text |  |  |  | _animation !=  |

### Style: Typography (`_typography`, 1 controls)

| Control | Key | Type | Options | CSS (property @ selector) | Flags | Shows when |
|---|---|---|---|---|---|---|
| (no label) | `_typography` | typography |  | font |  |  |

### Style: Background (`_background`, 1 controls)

| Control | Key | Type | Options | CSS (property @ selector) | Flags | Shows when |
|---|---|---|---|---|---|---|
| (no label) | `_background` | background |  | background |  |  |

### Style: Border / Box Shadow (`_border`, 2 controls)

| Control | Key | Type | Options | CSS (property @ selector) | Flags | Shows when |
|---|---|---|---|---|---|---|
| Border | `_border` | border |  | border |  |  |
| Box shadow | `_boxShadow` | box-shadow |  | box-shadow |  |  |

### Style: Gradient / Overlay (`_gradient`, 1 controls)

| Control | Key | Type | Options | CSS (property @ selector) | Flags | Shows when |
|---|---|---|---|---|---|---|
| (no label) | `_gradient` | gradient |  | background-image |  |  |

### Style: Transform (`_transform`, 8 controls)

| Control | Key | Type | Options | CSS (property @ selector) | Flags | Shows when |
|---|---|---|---|---|---|---|
| Transform | `_transform` | transform |  | transform |  |  |
| Transform origin | `_transformOrigin` | text |  | transform-origin |  |  |
| Element parallax | `_motionElementParallax` | checkbox |  |  |  |  |
| Horizontal speed  (%) | `_motionElementParallaxSpeedX` | number |  | --brx-motion-parallax-speed-x |  | _motionElementParallax = true |
| Vertical speed  (%) | `_motionElementParallaxSpeedY` | number |  | --brx-motion-parallax-speed-y |  | _motionElementParallax = true |
| Background parallax | `_motionBackgroundParallax` | checkbox |  |  |  |  |
| Background speed  (%) | `_motionBackgroundParallaxSpeed` | number |  | --brx-motion-background-speed |  | _motionBackgroundParallax = true |
| Parallax start point  (%) | `_motionStartVisiblePercent` | number |  |  |  |  |

### Style: CSS (`_css`, 5 controls)

| Control | Key | Type | Options | CSS (property @ selector) | Flags | Shows when |
|---|---|---|---|---|---|---|
| Custom CSS | `_cssCustom` | code |  |  | var() |  |
| CSS classes | `_cssClasses` | text |  |  |  |  |
| CSS ID | `_cssId` | text |  |  |  |  |
| CSS Filters | `_cssFilters` | filters |  | filter |  |  |
| Transition | `_cssTransition` | text |  | transition | var() |  |

### Style: Attributes (`_attributes`, 1 controls)

| Control | Key | Type | Options | CSS (property @ selector) | Flags | Shows when |
|---|---|---|---|---|---|---|
| (no label) | `_attributes` | repeater |  |  | repeater: Name, Value |  |

## Basic Text (`text-basic`)

Class `Bricks\Element_Text_Basic`. Default tag `div`. Nestable: no.

### Default tab (7 controls)

| Control | Key | Type | Options | CSS (property @ selector) | Flags | Shows when |
|---|---|---|---|---|---|---|
| Content | `_content` | text |  | content |  |  |
| (no label) | `text` | textarea |  |  |  |  |
| HTML tag | `tag` | select | div, p, span, figcaption, address, figure, custom |  |  |  |
| Custom tag | `customTag` | text |  |  |  | tag = custom |
| Link to | `link` | link |  |  |  |  |
| Words limit | `wordsLimit` | number |  |  |  |  |
| Read more | `readMore` | text |  |  |  | wordsLimit !=  |

### Style: Layout (`_layout`, 42 controls)

| Control | Key | Type | Options | CSS (property @ selector) | Flags | Shows when |
|---|---|---|---|---|---|---|
| Margin | `_margin` | spacing |  | margin |  |  |
| Padding | `_padding` | spacing |  | padding |  |  |
| Width | `_width` | number |  | width | units |  |
| Min. width | `_widthMin` | number |  | min-width | units |  |
| Max. width | `_widthMax` | number |  | max-width | units |  |
| Height | `_height` | number |  | height | units |  |
| Min. height | `_heightMin` | number |  | min-height | units |  |
| Max. height | `_heightMax` | number |  | max-height | units |  |
| Aspect ratio | `_aspectRatio` | text |  | aspect-ratio | var() |  |
| Position | `_position` | select | static, relative, absolute, fixed, sticky | position |  |  |
| Top | `_top` | number |  | top | units |  |
| Right | `_right` | number |  | right | units |  |
| Bottom | `_bottom` | number |  | bottom | units |  |
| Left | `_left` | number |  | left | units |  |
| Z-index | `_zIndex` | number |  | z-index |  |  |
| Order | `_order` | number |  | order |  |  |
| Type | `_scrollSnapType` | select | unset, y mandatory, y proximity, x mandatory, x proximity | scroll-snap-type |  |  |
| Align | `_scrollSnapAlign` | select | start, center, end | scroll-snap-align |  |  |
| Stop | `_scrollSnapStop` | select | normal, always | scroll-snap-stop |  |  |
| Display | `_display` | select | flex, inline-flex, block, inline-block, inline, none | display, align-items |  |  |
| Visibility | `_visibility` | select | visible, hidden, collapse | visibility |  |  |
| Overflow | `_overflow` | text |  | overflow |  |  |
| Opacity | `_opacity` | number |  | opacity |  |  |
| Cursor | `_cursor` | select | generalGroupTitle, auto, default, none, linkGroupTitle, pointer, context-menu, help, progress, wait, selectionGroupTitle, cell (+30) | cursor |  |  |
| Isolation | `_isolation` | select | auto, isolate | isolation |  |  |
| Mix blend mode | `_mixBlendMode` | select | normal, multiply, screen, overlay, darken, lighten, color-dodge, color-burn, hard-light, soft-light, difference, exclusion (+4) | mix-blend-mode |  |  |
| Pointer events | `_pointerEvents` | text |  | pointer-events |  |  |
| Perspective | `_perspective` | number |  | perspective | units |  |
| Perspective origin | `_perspectiveOrigin` | text |  | perspective-origin |  |  |
| Justify self | `_gridItemJustifySelf` | align-items |  | justify-self |  |  |
| Direction | `_flexDirection` | direction |  | flex-direction |  | _display = flex |
| Align self | `_alignSelf` | align-items |  | align-self |  |  |
| Align main axis | `_justifyContent` | justify-content |  | justify-content |  | _display = flex or inline-flex |
| Align cross axis | `_alignItems` | align-items |  | align-items |  | _display = flex or inline-flex |
| Gap | `_gap` | number |  | gap | units | _display = flex or inline-flex |
| Flex grow | `_flexGrow` | number |  | flex-grow |  |  |
| Flex shrink | `_flexShrink` | number |  | flex-shrink |  |  |
| Flex basis | `_flexBasis` | text |  | flex-basis | var() |  |
| Entry animation | `_animation` | select | bounce, flash, pulse, rubberBand, shakeX, shakeY, headShake, swing, tada, wobble, jello, heartBeat (+85) |  |  |  |
| Animation duration | `_animationDuration` | select | very-slow, slow, normal, fast, very-fast, custom |  |  | _animation !=  |
| Animation duration (Custom) | `_animationDurationCustom` | text |  |  |  | _animationDuration = custom |
| Animation delay | `_animationDelay` | text |  |  |  | _animation !=  |

### Style: Typography (`_typography`, 1 controls)

| Control | Key | Type | Options | CSS (property @ selector) | Flags | Shows when |
|---|---|---|---|---|---|---|
| (no label) | `_typography` | typography |  | font |  |  |

### Style: Background (`_background`, 1 controls)

| Control | Key | Type | Options | CSS (property @ selector) | Flags | Shows when |
|---|---|---|---|---|---|---|
| (no label) | `_background` | background |  | background |  |  |

### Style: Border / Box Shadow (`_border`, 2 controls)

| Control | Key | Type | Options | CSS (property @ selector) | Flags | Shows when |
|---|---|---|---|---|---|---|
| Border | `_border` | border |  | border |  |  |
| Box shadow | `_boxShadow` | box-shadow |  | box-shadow |  |  |

### Style: Gradient / Overlay (`_gradient`, 1 controls)

| Control | Key | Type | Options | CSS (property @ selector) | Flags | Shows when |
|---|---|---|---|---|---|---|
| (no label) | `_gradient` | gradient |  | background-image |  |  |

### Style: Transform (`_transform`, 8 controls)

| Control | Key | Type | Options | CSS (property @ selector) | Flags | Shows when |
|---|---|---|---|---|---|---|
| Transform | `_transform` | transform |  | transform |  |  |
| Transform origin | `_transformOrigin` | text |  | transform-origin |  |  |
| Element parallax | `_motionElementParallax` | checkbox |  |  |  |  |
| Horizontal speed  (%) | `_motionElementParallaxSpeedX` | number |  | --brx-motion-parallax-speed-x |  | _motionElementParallax = true |
| Vertical speed  (%) | `_motionElementParallaxSpeedY` | number |  | --brx-motion-parallax-speed-y |  | _motionElementParallax = true |
| Background parallax | `_motionBackgroundParallax` | checkbox |  |  |  |  |
| Background speed  (%) | `_motionBackgroundParallaxSpeed` | number |  | --brx-motion-background-speed |  | _motionBackgroundParallax = true |
| Parallax start point  (%) | `_motionStartVisiblePercent` | number |  |  |  |  |

### Style: CSS (`_css`, 5 controls)

| Control | Key | Type | Options | CSS (property @ selector) | Flags | Shows when |
|---|---|---|---|---|---|---|
| Custom CSS | `_cssCustom` | code |  |  | var() |  |
| CSS classes | `_cssClasses` | text |  |  |  |  |
| CSS ID | `_cssId` | text |  |  |  |  |
| CSS Filters | `_cssFilters` | filters |  | filter |  |  |
| Transition | `_cssTransition` | text |  | transition | var() |  |

### Style: Attributes (`_attributes`, 1 controls)

| Control | Key | Type | Options | CSS (property @ selector) | Flags | Shows when |
|---|---|---|---|---|---|---|
| (no label) | `_attributes` | repeater |  |  | repeater: Name, Value |  |

## Image (`image`)

Class `Bricks\Element_Image`. Default tag `figure`. Nestable: no.

### Default tab (43 controls)

| Control | Key | Type | Options | CSS (property @ selector) | Flags | Shows when |
|---|---|---|---|---|---|---|
| Content | `_content` | text |  | content |  |  |
| Image | `image` | image |  |  |  |  |
| HTML tag | `tag` | select | figure, div, custom |  |  | sources =  |
| Custom tag | `customTag` | text |  |  |  | tag = custom AND sources =  |
| Sources | `sources` | repeater |  |  | repeater: Breakpoint, Media query, Image |  |
| Aspect ratio | `_aspectRatio` | text |  | aspect-ratio @ &:not(.tag), img | var() |  |
| Object fit | `_objectFit` | select | contain, cover, fill, scale-down, none | object-fit @ &:not(.tag), img |  |  |
| Object position | `_objectPosition` | text |  | object-position @ &:not(.tag), img |  |  |
| Custom alt text | `altText` | text |  |  |  | image !=  |
| Caption type | `caption` | select | none, attachment, custom |  |  |  |
| Custom caption | `captionCustom` | text |  |  |  | caption = custom |
| Loading | `loading` | select | eager, lazy |  |  |  |
| Show title | `showTitle` | checkbox |  |  |  | image !=  |
| Stretch | `stretch` | checkbox |  | width |  |  |
| Image Overlay | `popupOverlay` | color |  | background-color @ &{pseudo}.overlay::before |  |  |
| (no label) | `link` | select | lightbox, attachment, media, url |  |  |  |
| Image size | `lightboxImageSize` | select |  |  |  | link = lightbox AND image.size !=  |
| Width (px) | `lightboxWidth` | number |  |  |  | link = lightbox |
| Height (px) | `lightboxHeight` | number |  |  |  | link = lightbox |
| Animation | `lightboxAnimationType` | select | none, fade, zoom |  |  | link = lightbox |
| Caption | `lightboxCaption` | checkbox |  |  |  | link = lightbox |
| ID | `lightboxId` | text |  |  |  | link = lightbox |
| Cropped | `lightboxCropped` | checkbox |  |  |  | link = lightbox |
| Padding (px) | `lightboxPadding` | dimensions |  |  |  | link = lightbox |
| Open in new tab | `newTab` | checkbox |  |  |  | link = attachment or media |
| (no label) | `url` | link |  |  |  | link = url |
| aria-label | `lightboxAriaLabel` | text |  |  | dynamic | link = lightbox |
| title | `lightboxTitle` | text |  |  | dynamic | link = lightbox |
| Disable icon | `popupIconDisable` | checkbox |  |  |  |  |
| Icon | `popupIcon` | icon |  |  |  |  |
| Icon background color | `popupIconBackgroundColor` | color |  | background-color @ &{pseudo} .icon |  | popupIcon !=  |
| Icon border | `popupIconBorder` | border |  | border @ &{pseudo} .icon |  | popupIcon !=  |
| Icon box shadow | `popupIconBoxShadow` | box-shadow |  | box-shadow @ &{pseudo} .icon |  | popupIcon !=  |
| Icon typography | `popupIconTypography` | typography |  | font @ &{pseudo} .icon |  | popupIcon.icon !=  |
| Icon height | `popupIconHeight` | number |  | line-height @ &{pseudo} .icon | units | popupIcon !=  |
| Icon width | `popupIconWidth` | number |  | width @ &{pseudo} .icon | units | popupIcon !=  |
| Icon transition | `popupIconTransition` | text |  | transition @ &{pseudo} .icon | var() | popupIcon !=  |
| Mask | `mask` | select | custom, mask-boom, mask-box, mask-bubbles, mask-cirlce-dots, mask-circle-line, mask-circle-waves, mask-circle, mask-drop-2, mask-drop, mask-fire, mask-grid-circles (+25) |  |  |  |
| (no label) | `maskCustom` | image |  |  |  | mask = custom |
| Size | `maskSize` | select | auto, cover, contain, custom |  |  | mask !=  |
| Custom size | `maskSizeCustom` | number |  |  | units | maskSize = custom |
| Position | `maskPosition` | select | center center, center left, center right, top center, top left, top right, bottom center, bottom left, bottom right |  |  | mask !=  |
| Repeat | `maskRepeat` | select | no-repeat, repeat, repeat-x, repeat-y, round, space |  |  | mask !=  |

### Style: Layout (`_layout`, 41 controls)

| Control | Key | Type | Options | CSS (property @ selector) | Flags | Shows when |
|---|---|---|---|---|---|---|
| Margin | `_margin` | spacing |  | margin |  |  |
| Padding | `_padding` | spacing |  | padding |  |  |
| Width | `_width` | number |  | width | units |  |
| Min. width | `_widthMin` | number |  | min-width | units |  |
| Max. width | `_widthMax` | number |  | max-width | units |  |
| Height | `_height` | number |  | height | units |  |
| Min. height | `_heightMin` | number |  | min-height | units |  |
| Max. height | `_heightMax` | number |  | max-height | units |  |
| Position | `_position` | select | static, relative, absolute, fixed, sticky | position |  |  |
| Top | `_top` | number |  | top | units |  |
| Right | `_right` | number |  | right | units |  |
| Bottom | `_bottom` | number |  | bottom | units |  |
| Left | `_left` | number |  | left | units |  |
| Z-index | `_zIndex` | number |  | z-index |  |  |
| Order | `_order` | number |  | order |  |  |
| Type | `_scrollSnapType` | select | unset, y mandatory, y proximity, x mandatory, x proximity | scroll-snap-type |  |  |
| Align | `_scrollSnapAlign` | select | start, center, end | scroll-snap-align |  |  |
| Stop | `_scrollSnapStop` | select | normal, always | scroll-snap-stop |  |  |
| Display | `_display` | select | flex, inline-flex, block, inline-block, inline, none | display, align-items |  |  |
| Visibility | `_visibility` | select | visible, hidden, collapse | visibility |  |  |
| Overflow | `_overflow` | text |  | overflow |  |  |
| Opacity | `_opacity` | number |  | opacity |  |  |
| Cursor | `_cursor` | select | generalGroupTitle, auto, default, none, linkGroupTitle, pointer, context-menu, help, progress, wait, selectionGroupTitle, cell (+30) | cursor |  |  |
| Isolation | `_isolation` | select | auto, isolate | isolation |  |  |
| Mix blend mode | `_mixBlendMode` | select | normal, multiply, screen, overlay, darken, lighten, color-dodge, color-burn, hard-light, soft-light, difference, exclusion (+4) | mix-blend-mode |  |  |
| Pointer events | `_pointerEvents` | text |  | pointer-events |  |  |
| Perspective | `_perspective` | number |  | perspective | units |  |
| Perspective origin | `_perspectiveOrigin` | text |  | perspective-origin |  |  |
| Justify self | `_gridItemJustifySelf` | align-items |  | justify-self |  |  |
| Direction | `_flexDirection` | direction |  | flex-direction |  | _display = flex |
| Align self | `_alignSelf` | align-items |  | align-self |  |  |
| Align main axis | `_justifyContent` | justify-content |  | justify-content |  | _display = flex or inline-flex |
| Align cross axis | `_alignItems` | align-items |  | align-items |  | _display = flex or inline-flex |
| Gap | `_gap` | number |  | gap | units | _display = flex or inline-flex |
| Flex grow | `_flexGrow` | number |  | flex-grow |  |  |
| Flex shrink | `_flexShrink` | number |  | flex-shrink |  |  |
| Flex basis | `_flexBasis` | text |  | flex-basis | var() |  |
| Entry animation | `_animation` | select | bounce, flash, pulse, rubberBand, shakeX, shakeY, headShake, swing, tada, wobble, jello, heartBeat (+85) |  |  |  |
| Animation duration | `_animationDuration` | select | very-slow, slow, normal, fast, very-fast, custom |  |  | _animation !=  |
| Animation duration (Custom) | `_animationDurationCustom` | text |  |  |  | _animationDuration = custom |
| Animation delay | `_animationDelay` | text |  |  |  | _animation !=  |

### Style: Typography (`_typography`, 1 controls)

| Control | Key | Type | Options | CSS (property @ selector) | Flags | Shows when |
|---|---|---|---|---|---|---|
| (no label) | `_typography` | typography |  | font @ figcaption |  |  |

### Style: Background (`_background`, 1 controls)

| Control | Key | Type | Options | CSS (property @ selector) | Flags | Shows when |
|---|---|---|---|---|---|---|
| (no label) | `_background` | background |  | background |  |  |

### Style: Border / Box Shadow (`_border`, 2 controls)

| Control | Key | Type | Options | CSS (property @ selector) | Flags | Shows when |
|---|---|---|---|---|---|---|
| Border | `_border` | border |  | border |  |  |
| Box shadow | `_boxShadow` | box-shadow |  | box-shadow |  |  |

### Style: Gradient / Overlay (`_gradient`, 1 controls)

| Control | Key | Type | Options | CSS (property @ selector) | Flags | Shows when |
|---|---|---|---|---|---|---|
| (no label) | `_gradient` | gradient |  | background-image |  |  |

### Style: Transform (`_transform`, 8 controls)

| Control | Key | Type | Options | CSS (property @ selector) | Flags | Shows when |
|---|---|---|---|---|---|---|
| Transform | `_transform` | transform |  | transform |  |  |
| Transform origin | `_transformOrigin` | text |  | transform-origin |  |  |
| Element parallax | `_motionElementParallax` | checkbox |  |  |  |  |
| Horizontal speed  (%) | `_motionElementParallaxSpeedX` | number |  | --brx-motion-parallax-speed-x |  | _motionElementParallax = true |
| Vertical speed  (%) | `_motionElementParallaxSpeedY` | number |  | --brx-motion-parallax-speed-y |  | _motionElementParallax = true |
| Background parallax | `_motionBackgroundParallax` | checkbox |  |  |  |  |
| Background speed  (%) | `_motionBackgroundParallaxSpeed` | number |  | --brx-motion-background-speed |  | _motionBackgroundParallax = true |
| Parallax start point  (%) | `_motionStartVisiblePercent` | number |  |  |  |  |

### Style: CSS (`_css`, 5 controls)

| Control | Key | Type | Options | CSS (property @ selector) | Flags | Shows when |
|---|---|---|---|---|---|---|
| Custom CSS | `_cssCustom` | code |  |  | var() |  |
| CSS classes | `_cssClasses` | text |  |  |  |  |
| CSS ID | `_cssId` | text |  |  |  |  |
| CSS Filters | `_cssFilters` | filters |  | filter @ &:not(.tag), img |  |  |
| Transition | `_cssTransition` | text |  | transition | var() |  |

### Style: Attributes (`_attributes`, 1 controls)

| Control | Key | Type | Options | CSS (property @ selector) | Flags | Shows when |
|---|---|---|---|---|---|---|
| (no label) | `_attributes` | repeater |  |  | repeater: Name, Value |  |

## Button (`button`)

Class `Bricks\Element_Button`. Default tag `span`. Nestable: no.

### Default tab (13 controls)

| Control | Key | Type | Options | CSS (property @ selector) | Flags | Shows when |
|---|---|---|---|---|---|---|
| Content | `_content` | text |  | content |  |  |
| (no label) | `text` | text |  |  |  |  |
| HTML tag | `tag` | text |  |  |  | link =  |
| Size | `size` | select | sm, md, lg, xl |  |  |  |
| Style | `style` | select | primary, secondary, light, dark, muted, info, success, warning, danger |  |  |  |
| Circle | `circle` | checkbox |  |  |  |  |
| Outline | `outline` | checkbox |  |  |  |  |
| Link type | `link` | link |  |  |  |  |
| Icon | `icon` | icon |  |  |  |  |
| Typography | `iconTypography` | typography |  | font @ i |  | icon.icon !=  |
| Position | `iconPosition` | select | left, right |  |  | icon !=  |
| Gap | `iconGap` | number |  | gap | units | icon !=  |
| Space between | `iconSpace` | checkbox |  | justify-content |  | icon !=  |

### Style: Layout (`_layout`, 42 controls)

| Control | Key | Type | Options | CSS (property @ selector) | Flags | Shows when |
|---|---|---|---|---|---|---|
| Margin | `_margin` | spacing |  | margin |  |  |
| Padding | `_padding` | spacing |  | padding |  |  |
| Width | `_width` | number |  | width | units |  |
| Min. width | `_widthMin` | number |  | min-width | units |  |
| Max. width | `_widthMax` | number |  | max-width | units |  |
| Height | `_height` | number |  | height | units |  |
| Min. height | `_heightMin` | number |  | min-height | units |  |
| Max. height | `_heightMax` | number |  | max-height | units |  |
| Aspect ratio | `_aspectRatio` | text |  | aspect-ratio | var() |  |
| Position | `_position` | select | static, relative, absolute, fixed, sticky | position |  |  |
| Top | `_top` | number |  | top | units |  |
| Right | `_right` | number |  | right | units |  |
| Bottom | `_bottom` | number |  | bottom | units |  |
| Left | `_left` | number |  | left | units |  |
| Z-index | `_zIndex` | number |  | z-index |  |  |
| Order | `_order` | number |  | order |  |  |
| Type | `_scrollSnapType` | select | unset, y mandatory, y proximity, x mandatory, x proximity | scroll-snap-type |  |  |
| Align | `_scrollSnapAlign` | select | start, center, end | scroll-snap-align |  |  |
| Stop | `_scrollSnapStop` | select | normal, always | scroll-snap-stop |  |  |
| Display | `_display` | select | flex, inline-flex, block, inline-block, inline, none | display, align-items |  |  |
| Visibility | `_visibility` | select | visible, hidden, collapse | visibility |  |  |
| Overflow | `_overflow` | text |  | overflow |  |  |
| Opacity | `_opacity` | number |  | opacity |  |  |
| Cursor | `_cursor` | select | generalGroupTitle, auto, default, none, linkGroupTitle, pointer, context-menu, help, progress, wait, selectionGroupTitle, cell (+30) | cursor |  |  |
| Isolation | `_isolation` | select | auto, isolate | isolation |  |  |
| Mix blend mode | `_mixBlendMode` | select | normal, multiply, screen, overlay, darken, lighten, color-dodge, color-burn, hard-light, soft-light, difference, exclusion (+4) | mix-blend-mode |  |  |
| Pointer events | `_pointerEvents` | text |  | pointer-events |  |  |
| Perspective | `_perspective` | number |  | perspective | units |  |
| Perspective origin | `_perspectiveOrigin` | text |  | perspective-origin |  |  |
| Justify self | `_gridItemJustifySelf` | align-items |  | justify-self |  |  |
| Direction | `_flexDirection` | direction |  | flex-direction |  | _display = flex |
| Align self | `_alignSelf` | align-items |  | align-self |  |  |
| Align main axis | `_justifyContent` | justify-content |  | justify-content |  | _display = flex or inline-flex |
| Align cross axis | `_alignItems` | align-items |  | align-items |  | _display = flex or inline-flex |
| Gap | `_gap` | number |  | gap | units | _display = flex or inline-flex |
| Flex grow | `_flexGrow` | number |  | flex-grow |  |  |
| Flex shrink | `_flexShrink` | number |  | flex-shrink |  |  |
| Flex basis | `_flexBasis` | text |  | flex-basis | var() |  |
| Entry animation | `_animation` | select | bounce, flash, pulse, rubberBand, shakeX, shakeY, headShake, swing, tada, wobble, jello, heartBeat (+85) |  |  |  |
| Animation duration | `_animationDuration` | select | very-slow, slow, normal, fast, very-fast, custom |  |  | _animation !=  |
| Animation duration (Custom) | `_animationDurationCustom` | text |  |  |  | _animationDuration = custom |
| Animation delay | `_animationDelay` | text |  |  |  | _animation !=  |

### Style: Typography (`_typography`, 1 controls)

| Control | Key | Type | Options | CSS (property @ selector) | Flags | Shows when |
|---|---|---|---|---|---|---|
| (no label) | `_typography` | typography |  | font |  |  |

### Style: Background (`_background`, 1 controls)

| Control | Key | Type | Options | CSS (property @ selector) | Flags | Shows when |
|---|---|---|---|---|---|---|
| (no label) | `_background` | background |  | background |  |  |

### Style: Border / Box Shadow (`_border`, 2 controls)

| Control | Key | Type | Options | CSS (property @ selector) | Flags | Shows when |
|---|---|---|---|---|---|---|
| Border | `_border` | border |  | border |  |  |
| Box shadow | `_boxShadow` | box-shadow |  | box-shadow |  |  |

### Style: Gradient / Overlay (`_gradient`, 1 controls)

| Control | Key | Type | Options | CSS (property @ selector) | Flags | Shows when |
|---|---|---|---|---|---|---|
| (no label) | `_gradient` | gradient |  | background-image |  |  |

### Style: Transform (`_transform`, 8 controls)

| Control | Key | Type | Options | CSS (property @ selector) | Flags | Shows when |
|---|---|---|---|---|---|---|
| Transform | `_transform` | transform |  | transform |  |  |
| Transform origin | `_transformOrigin` | text |  | transform-origin |  |  |
| Element parallax | `_motionElementParallax` | checkbox |  |  |  |  |
| Horizontal speed  (%) | `_motionElementParallaxSpeedX` | number |  | --brx-motion-parallax-speed-x |  | _motionElementParallax = true |
| Vertical speed  (%) | `_motionElementParallaxSpeedY` | number |  | --brx-motion-parallax-speed-y |  | _motionElementParallax = true |
| Background parallax | `_motionBackgroundParallax` | checkbox |  |  |  |  |
| Background speed  (%) | `_motionBackgroundParallaxSpeed` | number |  | --brx-motion-background-speed |  | _motionBackgroundParallax = true |
| Parallax start point  (%) | `_motionStartVisiblePercent` | number |  |  |  |  |

### Style: CSS (`_css`, 5 controls)

| Control | Key | Type | Options | CSS (property @ selector) | Flags | Shows when |
|---|---|---|---|---|---|---|
| Custom CSS | `_cssCustom` | code |  |  | var() |  |
| CSS classes | `_cssClasses` | text |  |  |  |  |
| CSS ID | `_cssId` | text |  |  |  |  |
| CSS Filters | `_cssFilters` | filters |  | filter |  |  |
| Transition | `_cssTransition` | text |  | transition | var() |  |

### Style: Attributes (`_attributes`, 1 controls)

| Control | Key | Type | Options | CSS (property @ selector) | Flags | Shows when |
|---|---|---|---|---|---|---|
| (no label) | `_attributes` | repeater |  |  | repeater: Name, Value |  |

## Section vs Container: control diff

No control-level differences: same keys, types, labels, groups, tabs, defaults, options, CSS and conditions.

