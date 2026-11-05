# Bricks style-tab controls

Generated 2026-11-05 from the Bricks 2.4.5 registry on bricks.local. Each row is one control that the shared style layer (underscore keys) gives to the native elements.

- Uses: how many of the 77 native elements have the control.
- CSS: the CSS properties the control writes. Bricks maps each control to one or more properties.
- Conditional on: the control only shows when another control has a value (for example grid settings show only when display is grid).
- Vars: the control accepts global variables (var() values).

Distinct style-tab control keys: 109.

| Control key | Group | Type | CSS properties | Uses | Conditional on | Vars |
|---|---|---|---|---|---|---|
| `_addedClasses` | mobile-menu | checkbox |  | 2 |  |  |
| `_alignContentGrid` |  | align-items | `align-content` | 4 | _display = grid |  |
| `_alignItems` |  | align-items | `align-items` | 76 | _display = flex,inline-flex |  |
| `_alignItemsGrid` |  | align-items | `align-items` | 4 | _display = grid |  |
| `_alignSelf` |  | align-items | `align-self`, `width` | 75 | _display = flex,inline-flex |  |
| `_animation` | _layout | select |  | 76 |  |  |
| `_animationDelay` | _layout | text |  | 76 | _animation !=  |  |
| `_animationDuration` | _layout | select |  | 76 | _animation !=  |  |
| `_animationDurationCustom` | _layout | text |  | 76 | _animationDuration = custom |  |
| `_animationInfo` | _layout | info |  | 76 | _animation !=  |  |
| `_animationSeparator` | _layout | separator |  | 76 |  |  |
| `_aspectRatio` | _layout | text | `aspect-ratio` | 76 |  | yes |
| `_attributes` | _attributes | repeater |  | 76 |  |  |
| `_background` | _background | background | `background` | 76 |  |  |
| `_border` | _border | border | `border` | 76 |  |  |
| `_bottom` | _layout | number | `bottom` | 76 |  |  |
| `_boxShadow` | _border | box-shadow | `box-shadow` | 76 |  |  |
| `_children` |  | repeater |  | 2 |  |  |
| `_columnGap` |  | number | `column-gap` | 4 | _display = flex,inline-flex,grid |  |
| `_content` |  | text | `content` | 76 |  |  |
| `_cssClasses` | _css | text |  | 76 |  |  |
| `_cssCustom` | _css | code |  | 76 |  | yes |
| `_cssFilters` | _css | filters | `filter` | 76 |  |  |
| `_cssId` | _css | text |  | 76 |  |  |
| `_cssIdComponentInfo` | _css | info |  | 76 | _cssId,!=, id,!=,,activeComponent |  |
| `_cssTransition` | _css | text | `transition` | 76 |  | yes |
| `_cursor` | _layout | select | `cursor` | 76 |  |  |
| `_direction` |  | direction | `flex-direction` | 5 | _display = flex,inline-flex |  |
| `_display` |  | select | `display`, `align-items` | 76 |  |  |
| `_flexBasis` |  | text | `flex-basis` | 76 | _display = flex,inline-flex | yes |
| `_flexDirection` | _layout | direction | `flex-direction` | 72 | _display = flex |  |
| `_flexGrow` |  | number | `flex-grow` | 76 | _display = flex,inline-flex |  |
| `_flexSeparator` | _layout | separator |  | 72 |  |  |
| `_flexShrink` |  | number | `flex-shrink` | 76 | _display = flex,inline-flex |  |
| `_flexWrap` |  | select | `flex-wrap` | 4 | _display = flex,inline-flex |  |
| `_gap` | _layout | number | `gap` | 72 | _display = flex,inline-flex |  |
| `_gradient` | _gradient | gradient | `background-image` | 76 |  |  |
| `_gridAutoColumns` |  | text | `grid-auto-columns` | 4 | _display = grid | yes |
| `_gridAutoFlow` |  | select | `grid-auto-flow` | 4 | _display = grid |  |
| `_gridAutoRows` |  | text | `grid-auto-rows` | 4 | _display = grid | yes |
| `_gridGap` |  | number | `gap` | 4 | _display = flex,inline-flex,grid |  |
| `_gridItemColumnSpan` |  | text | `grid-column` | 4 |  |  |
| `_gridItemJustifySelf` |  | align-items | `justify-self` | 76 |  |  |
| `_gridItemRowSpan` |  | text | `grid-row` | 4 |  |  |
| `_gridItemSeparator` |  | separator |  | 76 |  |  |
| `_gridItemSeparatorAfter` |  | separator |  | 4 |  |  |
| `_gridTemplateColumns` |  | text | `grid-template-columns` | 4 | _display = grid | yes |
| `_gridTemplateRows` |  | text | `grid-template-rows` | 4 | _display = grid | yes |
| `_height` | _layout | number | `height` | 76 |  |  |
| `_heightMax` | _layout | number | `max-height` | 76 |  |  |
| `_heightMin` | _layout | number | `min-height` | 76 |  |  |
| `_innerContainerMargin` | _layout | spacing | `margin` | 4 |  |  |
| `_innerContainerPadding` | _layout | spacing | `padding` | 4 |  |  |
| `_innerContainerSeparator` | _layout | separator |  | 4 |  |  |
| `_isolation` | _layout | select | `isolation` | 76 |  |  |
| `_justifyContent` |  | justify-content | `justify-content` | 76 | _display = flex,inline-flex |  |
| `_justifyContentGrid` |  | justify-content | `justify-content` | 4 | _display = grid |  |
| `_justifyItemsGrid` |  | justify-content | `justify-items` | 4 | _display = grid |  |
| `_left` | _layout | number | `left` | 76 |  |  |
| `_margin` | _layout | spacing | `margin` | 76 |  |  |
| `_masonryColumn` | _layout | number | `--columns` | 4 | _useMasonry = 1 |  |
| `_masonryGutter` | _layout | number | `--gutter` | 4 | _useMasonry = 1 |  |
| `_masonryHorizontalOrder` | _layout | checkbox |  | 4 | _useMasonry = 1 |  |
| `_masonrySep` | _layout | separator |  | 4 |  |  |
| `_masonryTransitionDuration` | _layout | number |  | 4 | _useMasonry = 1 |  |
| `_masonryTransitionMode` | _layout | select |  | 4 | _useMasonry,=,1 _masonryTransitionDuration,!= (list) |  |
| `_miscSeparator` | _layout | separator |  | 76 |  |  |
| `_mixBlendMode` | _layout | select | `mix-blend-mode` | 76 |  |  |
| `_motionBackgroundParallax` | _transform | checkbox |  | 76 |  |  |
| `_motionBackgroundParallaxSpeed` | _transform | number | `--brx-motion-background-speed` | 76 | _motionBackgroundParallax = 1 |  |
| `_motionElementParallax` | _transform | checkbox |  | 76 |  |  |
| `_motionElementParallaxSpeedX` | _transform | number | `--brx-motion-parallax-speed-x` | 76 | _motionElementParallax = 1 |  |
| `_motionElementParallaxSpeedY` | _transform | number | `--brx-motion-parallax-speed-y` | 76 | _motionElementParallax = 1 |  |
| `_motionParallaxBuilderInfo` | _transform | info |  | 76 |  |  |
| `_motionParallaxSeparator` | _transform | separator |  | 76 |  |  |
| `_motionStartVisiblePercent` | _transform | number |  | 76 |  |  |
| `_objectFit` |  | select | `object-fit` | 1 |  |  |
| `_objectPosition` |  | text | `object-position` | 1 |  |  |
| `_opacity` | _layout | number | `opacity` | 76 |  |  |
| `_order` |  | number | `order` | 76 | _display != none |  |
| `_overflow` | _layout | text | `overflow` | 76 |  |  |
| `_padding` | _layout | spacing | `padding` | 76 |  |  |
| `_perspective` | _layout | number | `perspective` | 76 |  |  |
| `_perspectiveOrigin` | _layout | text | `perspective-origin` | 76 |  |  |
| `_pointerEvents` | _layout | text | `pointer-events` | 76 |  |  |
| `_position` | _layout | select | `position` | 76 |  |  |
| `_positionInfo` | _layout | info |  | 76 | _position = sticky |  |
| `_positionSeparator` | _layout | separator |  | 76 |  |  |
| `_right` | _layout | number | `right` | 76 |  |  |
| `_rowGap` |  | number | `row-gap` | 4 | _display = flex,inline-flex,grid |  |
| `_scrollSnapAlign` | _layout | select | `scroll-snap-align` | 76 |  |  |
| `_scrollSnapSep` | _layout | separator |  | 76 |  |  |
| `_scrollSnapStop` | _layout | select | `scroll-snap-stop` | 76 |  |  |
| `_scrollSnapType` | _layout | select | `scroll-snap-type` | 76 |  |  |
| `_shapeDividers` | _shapes | repeater |  | 4 |  |  |
| `_sizingSeparator` | _layout | separator |  | 76 |  |  |
| `_spacingSeparator` | _layout | separator |  | 76 |  |  |
| `_top` | _layout | number | `top` | 76 |  |  |
| `_transform` | _transform | transform | `transform` | 76 |  |  |
| `_transformOrigin` | _transform | text | `transform-origin` | 76 |  |  |
| `_typography` | _typography | typography | `font` | 74 |  |  |
| `_useMasonry` | _layout | checkbox |  | 4 |  |  |
| `_useMasonryInfo` |  | info |  | 4 | _useMasonry = 1 |  |
| `_useMasonryInfo2` | _layout | info |  | 4 | _useMasonry = 1 |  |
| `_visibility` | _layout | select | `visibility` | 76 |  |  |
| `_width` | _layout | number | `width` | 76 |  |  |
| `_widthMax` | _layout | number | `max-width` | 76 |  |  |
| `_widthMin` | _layout | number | `min-width` | 76 |  |  |
| `_zIndex` | _layout | number | `z-index` | 76 |  |  |
