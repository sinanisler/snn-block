# Viewport sync, effects and the Style tab (5 Nov 2026)

Research on responsive sync and effects. Nothing is built into the theme. Nothing is committed.

Sources: WordPress 7.1.4 on blocks.local (`wp-includes/js/dist/editor.js` and `block-editor.js`), a live probe on blocks.local, and Bricks 2.4.5 on bricks.local (`includes/`, `assets/js/frontend.js`).

## 1. The core store for Desktop, Tablet and Mobile

Verified live on blocks.local (probe run 5 Nov 2026, post 240 editor):

| What | Call | Public API | Result |
|---|---|---|---|
| Current view | `wp.data.select('core/editor').getDeviceType()` | yes | returns `Desktop`, `Tablet` or `Mobile` |
| Switch view | `wp.data.dispatch('core/editor').setDeviceType('Tablet')` | yes | canvas width 1320 px, then 781 px (Tablet), 479 px (Mobile), back to 1320 px (Desktop) |
| Per-viewport style state | `select('core/block-editor').getStyleStateViewport()` and `setStyleStateViewport('@tablet')` | no (private) | `missing` on the public store |
| "Responsive styles" switch | `isResponsiveEditing()` and `setResponsiveEditing()` | no (private) | `missing` on the public store |

How core connects them (read in code):
- `getDeviceType` (`editor.js` ~7383) reads the canvas width and returns Desktop in zoom-out mode.
- `getDeviceTypeByCanvasWidth` and `getCanvasWidthByDeviceType` (`editor.js` ~6849 to 6881): a view's canvas width is its breakpoint minus 1 px.
- `VIEWPORT_STATE_BY_DEVICE_TYPE` (`editor.js` 6844): Desktop maps to `default`, Tablet to `@tablet`, Mobile to `@mobile`.
- `setCanvasWidth` (`editor.js` ~78601) also calls `setStyleStateViewport` when Responsive styles is on.
- The View menu (`editor.js` ~91580 to 91710) shows three items with a "Responsive styles" checkbox: "Style all viewports", "Style tablet only", "Style mobile only".

Breakpoints: core's defaults are mobile 480 px and tablet 782 px (`editor.js` 5150). Those give the canvas widths 479 and 781 measured above. Core has only these two breakpoints, so it represents exactly three views: the three states you asked for.

Storage shape (read in code, `block-editor.js` 55293): a block's style state lives at `style[viewport][pseudo]`, for example `style['@tablet'][':hover']`. Pseudo-states are allowed only on `core/button` and `core/navigation-link` (`block-editor.js` 83550): `:hover`, `:focus`, `:focus-visible`, `:active`. Older keys `mobile` and `tablet` are aliased (`style-state-back-compat`).

Decision for us (D22): the panel reads and writes its own state, and uses the public `core/editor` calls for the device. It keeps core's key names (`@tablet`, `@mobile`) so our values look like core's. It does not use the private Responsive styles store.

Not tested: a click on the core View menu moving our panel. Only the store was tested.

## 2. The three states against Bricks

| | Bricks 2.4.5 (`breakpoints.php` 400 to 427) | Core 7.1.4 (defaults) |
|---|---|---|
| Desktop | base, width 1279 in the breakpoint list | base |
| Tablet | tablet_portrait, 991 px | tablet, 782 px |
| Mobile landscape | 767 px | none |
| Mobile | mobile_portrait, 478 px | mobile, 480 px |

Proposal (D18): Desktop (base), Tablet up to 991 px, Mobile up to 478 px. These are Bricks's values. Set them in our theme.json (`settings.viewport`, which core reads in `getViewportBreakpoints`) so the core canvas and our CSS agree. Mobile landscape (767 px) has no core equivalent and is not one of the three states, so we drop it. Not tested: changing the theme.json values and measuring the canvas.

## 3. Effects and states in Bricks (source)

Entrance animation today:
- `_animation` ("Entry animation", Style > Layout) is deprecated since 1.6 (`elements/base.php` 1699 to 1769; `converter.php` 462 to 488). Bricks converts it into an interaction.
- The new way is Interactions: a trigger, then an action (`interactions.php`).

Triggers (`interactions.php` 46 to 70): click, mouseover (Hover), focus, blur, mouseenter, mouseleave, enterView (Enter viewport), leaveView (Leave viewport), animationEnd, scroll (with scroll offset), contentLoaded (with delay), mouseleaveWindow, plus query, filter, form and WooCommerce triggers.

Enter viewport (`frontend.js` ~10439 to 10460):
- Uses IntersectionObserver with `rootMargin` and a threshold. The threshold is "Element visibility" (`visibilityThreshold`, %).
- "Run only once" (`runOnce`) is a checkbox. It is hidden for contentLoaded.

Actions: 19 options (`interactions.php` ~220 to 245). The animation action is `startAnimation`, with `animationType` (a preset), `animationDuration` (text, for example `1s`) and `animationDelay` (text, s or ms).

Start state (`interactions.php` 722 to 756, `frontend.js` 11317 to 11406):
- A preset whose name contains "In" (fadeIn, slideInUp, zoomIn, bounceIn) gets `data-interaction-hidden-on-load`. The CSS sets `opacity: 0` until the animation class is applied. So "in" presets start hidden.
- "Out" presets do not hide the element on load.
- This is Bricks's implicit start state. Our Start state option (Auto, Visible, Hidden) would make it explicit.

Presets: `setup.php` 1243 to 1358 lists 99 keys. The earlier note said 97; this is the recount. Families: fade 26 (13 in, 13 out), bounce 11, zoom 10, rotate 10, slide 8, back 8, lightSpeed 6, flip 5, roll 2, attention 11 (flash, pulse, rubberBand, shakeX, shakeY, headShake, swing, tada, wobble, jello, heartBeat), hinge, jackInTheBox.

Breakpoints: the Interactions fields have no breakpoint key. Effects are stored per element, not per viewport (D19).

## 4. The Style tab, from source

Nine group cards (`elements/base.php` 274 to 330, matching the screenshot you sent): Layout, Typography, Background, Border / Box Shadow, Gradient / Overlay, Shape dividers (layout elements only), Transform, CSS, Attributes.

- **Layout** (39 controls): margin, padding, width, min and max width, height, min and max height, aspect ratio, position and offsets, z-index, scroll snap (3), visibility, overflow, opacity, cursor, isolation, mix blend mode, pointer events, perspective (2), masonry (6), inner container margin and padding, and the deprecated entry animation (with its duration and delay).
- **Transform** (8): transform, transform origin, element parallax (with speeds), background parallax (with speed), parallax start point.
- **CSS** (5): custom CSS, classes, ID, CSS filters, transition.
- **Typography, Background, Border / Box shadow, Gradient / Overlay**: one rich control each.
- Flex and grid primitives are on the Content (default) tab (`bricks-foundation-controls-2026-11-05.md`): display, direction, wrap, justify, align, row and column gap, grid templates, flex grow, shrink and basis, order.

Responsiveness: `base.php` has no per-control `responsive` flag (0 matches), so the source does not say which controls take breakpoint values. The live builder would show it. Not checked yet, so we do not claim opacity or overflow is per-breakpoint in Bricks.

## 6. Decisions (for you)

- **D18. Three states.** Desktop, Tablet up to 991 px, Mobile up to 478 px (Bricks values), set in theme.json so core agrees. Recommend yes.
- **D19. Effects per element.** Entrance effects are not per viewport (Bricks does this too). A per-viewport "animation off on mobile" can come later. Recommend yes.
- **D20. Start state.** Auto (the Bricks rule), Visible or Hidden. Recommend Auto as the default with the two overrides.
- **D21. Responsive opacity and overflow.** The mock makes them per viewport, as you asked ("sync every control value"). Bricks's behaviour here is not checked yet.
- **D22. Sync approach.** Public `core/editor` calls only. No private Responsive styles store. Recommend yes.
- **D23. Decided (5 Nov 2026).** The Effects group is an accordion, collapsed by default, because most blocks will not need it. The mock uses a native `details` element.

## 7. Not verified

- The Bricks builder UI for Effects and Style. This round used the source and your seven screenshots. A live tour is the next step.
- A click on the core View menu moving our panel.
- A theme.json change to `settings.viewport`, measured on the canvas.
- Per-breakpoint storage for opacity and overflow in Bricks.
- The mock is not connected to WordPress.
