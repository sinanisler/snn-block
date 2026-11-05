# Block editor capabilities: lab results (version 4)

Date: 2026-11-05. Site: blocks.local (WordPress 7.1.4). Reference: Bricks 2.4.5 on bricks.local. Scope: what core blocks, Custom HTML, custom blocks and theme.json can do, what Bricks gives its users, and the best path for SNN. Everything is tested on blocks.local unless marked "not tested". The repo has no code changes; the only addition is `docs/research/`, not committed.

## Big picture

- **Controllability is the real gap.** A user who wants to change a font size from 20 px to 30 px, a max width, a max height, or a flex or grid layout needs a control. Core blocks give a fixed subset. Bricks gives a control for almost every CSS property on every element.
- **The fix is a universal style layer, not more core blocks.** We built a working prototype on blocks.local. Any block (core, SNN, or converted section) gets one "SNN style" panel. Values are stored per block and compiled to CSS, with breakpoints and a hover state. The font-size change from 30 px to 40 px saved and rendered on the front end.
- **Design fidelity still matters, but it is not enough.** The earlier results (native rebuild, converter bug, Additional CSS limits) remain true and are listed below.
- **The converter's Custom HTML sections are the blocker for control.** Each section has no controls at all. The universal layer fixes this by letting a section carry the same panel.

## 0. Priorities from your notes (5 Nov 2026)

Your points, recorded as you gave them:

0. Before anything else: a clean slate. Eliminate every core and theme default, on the front end and in the block editor, so that we develop on a simple, predictable base. Everything after is built on it.
1. The absolute basics come first: the layout foundation, meaning the **section** and **container** blocks, with their default behaviours.
2. Then the content blocks: **text**, **image** and **video**.
3. A **global style system of our own**. theme.json is useful but nowhere near enough. The global system must be reachable from **every block editor** and from the **Site Editor**.
4. Controllability is part of each foundation block, not something added later.

### Clean slate first: eliminate every core and theme default

Your note: WordPress block themes add too many defaults, on the front end and in the block editor. We must first eliminate every possible default, so that there is a simple, working environment to develop on. Everything after this is built on it.

**What a blank page loads today (measured on blocks.local, published sample page, which includes the default navigation):**

| Source | Measured |
|---|---|
| Inline style blocks | 21, totalling 58,942 bytes |
| Largest | `wp-block-navigation-inline-css` 20,859 bytes; `global-styles-inline-css` 19,968; `wp-block-library-inline-css` 4,273; `wp-block-columns-inline-css` 1,664; SNN dynamic styles 2,159; view transitions 852; block supports 839 |
| External stylesheets | 1 (SNN `style.css`) |
| Script tags | 11 |

One of the 21 blocks is our own lab test style (`snn-lab-css`), which will go with the lab plugin.

**Where the defaults come from (hooks confirmed in `wp-includes/default-filters.php`):**

- `wp_enqueue_global_styles` on `wp_enqueue_scripts` and `wp_footer`: the global styles CSS (theme presets and layout rules).
- `wp_enqueue_stored_styles`: the stored global style CSS.
- `wp_enqueue_classic_theme_styles` on `wp_enqueue_scripts` and `enqueue_block_assets`.
- `wp_enqueue_global_styles_css_custom_properties` on `enqueue_block_editor_assets`: the editor's copy of the presets.
- `print_emoji_detection_script` on `wp_head`.
- Core's own `wp-includes/theme.json` (9.5 KB) is loaded under every theme.

**Inherited from the parent theme:** `style.css` declares `Template: twentytwentyfive`, so SNN Block inherits that theme's theme.json, templates and styles. Its layout widths are `contentSize` 645 px and `wideSize` 1340 px (`twentytwentyfive/theme.json`, lines 54 and 55). The 645 px paragraph width we saw in the editor canvas (test U10) comes from here.

**Block editor defaults:** the canvas gets the theme's editor styles, the default layout widths, default block supports, and core's registered block-style variants (for example the heading variants Default, Display, Subtitle and Annotation, seen in the editor screenshot).

**Core CSS rules seen on the front end during the tests:** `:root :where(.is-layout-flex){gap:1.2rem}`, `:root :where(p.has-background){padding:1.25em 2.375em}`, `body .is-layout-flex{display:flex}`, and padding rules for `has-background` headings and columns. None of these is ours.

**Acceptance: what a clean base means (proposed):**

- A1. A blank front-end page loads only our CSS and our JavaScript. No core block CSS, no global styles CSS, no classic theme styles, no emoji script, no block-support CSS, unless a block we use asks for it, explicitly listed.
- A2. The block editor canvas starts with no theme or core default styling: no default content width, no default spacing, no default block-style variants.
- A3. Only our scripts on the front end. Core's editor scripts stay, because the editor needs them.
- A4. Every removed default is listed with a reason, and every kept default is listed with a reason.
- A5. Before and after numbers on the same page: bytes, stylesheets, scripts and requests.

**Method (proposed):**

- M1. Finish the inventory: the editor screens and the admin, not only the front end.
- M2. Decide the base theme (decision D6). A standalone block theme with an empty theme.json is the likely answer.
- M3. Remove each source with its hook, one at a time, measuring after each step.
- M4. Add back only what our blocks need, written as our own CSS.

**Risks:** core blocks rely on core CSS for their layout (navigation and columns, for example). Removing it breaks those blocks until our CSS covers them. Block validity does not depend on CSS, so validity tests still hold.

### Foundation blocks and their default behaviours (proposed, not built)

The numbers below are proposals to agree before building. None of them has been measured.

| Block | Default behaviour | Controls (from the style layer) | Tokens used |
|---|---|---|---|
| Section | Full width. Vertical padding from the section token (about 96 px desktop, 64 px phone). No max width; the container limits content. Children stack with the block gap. | Background, colour, image, padding, min height, overflow | Section padding, block gap, background |
| Container | Max width from the container token (1200 px), centred with automatic inline margins. Inline padding 24 px desktop, 16 px phone. Children stack in a column with the gap. | Flex and grid, justify, align, gap, max and min width, order | Container width, inline padding, gap |
| Text (heading, paragraph) | Heading levels map to the type scale (h1 to h6). Paragraph measure about 68 characters. Line height from a token. | Font family, size, weight, line height, letter spacing, colour, alignment | Type scale, measure, palette |
| Image | Width 100%, height auto. Object-fit cover when an aspect ratio is set. Corner radius from a token. Alt text required (warn when empty). | Aspect ratio, object-fit, radius, border, shadow, width and max width | Radius, aspect ratio presets |
| Video | 16:9 by default, object-fit cover, controls on, optional poster. YouTube, Vimeo or self-hosted source. | Aspect ratio, object-fit, radius, width and max width | Aspect ratio, radius |

### Global style system: requirements from your notes

- **G1. Our own store, separate from theme.json.** The theme ships a default set, and the site can override it.
- **G2. Reachable from every block editor** (posts, pages and custom post types) **and from the Site Editor.**
- **G3. Token set:** palette, type scale (families, sizes, weights, line heights), spacing scale, radius, shadows, container widths, breakpoints, transitions.
- **G4. Blocks use tokens.** A control can pick a token, so changing a token changes every block that uses it.
- **G5. Global classes** (named style sets reused across blocks). A later step.
- **G6. theme.json stays as a compatibility layer,** generated from our tokens, so core's palette and typography controls still work.

### Why theme.json is not enough (checked on the test site)

- The SNN Block theme has no theme.json of its own. It inherits twentytwentyfive's, which gives 8 colours, 5 font sizes, 2 font families and styles for 29 blocks.
- Core has two breakpoints (mobile and tablet). Theme.json can change their values, but it has no set of tokens beyond the presets above.
- `settings.custom` writes CSS variables (`--wp--custom--*`). Core 7.1.4 has it, but I have not tested it in an editor.
- There are no global classes and no per-token UI in core. (The second point comes from reading core; not tested.)

### What core 7.1.4 gives the global system (read in code, not yet run)

- The Site Editor builds its settings with `get_block_editor_settings()` (`wp-admin/site-editor.php`, line 165). That function applies the `block_editor_settings_all` filter (`wp-includes/block-editor.php`, line 645). So one filter can add global CSS to the **post editor and the Site Editor**.
- The Site Editor accepts plugin sidebars: the `edit-site` bundle contains the `PluginSidebar` component. So our own panel can live in the Site Editor.

### Proposed architecture (draft)

- **Store:** one versioned JSON option (`snn_global_styles`), with defaults shipped in the theme. A REST route for the editors. No per-post rows.
- **Output:** CSS custom properties on `:root` for the front end (through `wp_head`). The same CSS goes to the post editor and the Site Editor through `block_editor_settings_all`.
- **Editing:** one panel in the block editor sidebar and one plugin sidebar in the Site Editor, both writing the same store.
- **Use:** a block control stores a token as a value (for example `var(--snn-space-section)`), so a token change needs no republishing of content.
- **Open choice:** option, custom post type, or theme file only (decision D2).

### Test plan for the global system (not yet run)

- **TG1.** Change a token in the Site Editor panel. The front end shows the new value.
- **TG2.** The same change shows in the post editor canvas after save.
- **TG3.** The Site Editor shows the same value.
- **TG4.** A block control that uses `var()` follows the token change.
- **TG5.** The change shows in the canvas before save (the live injection problem from U9).

### Build order

0. Clean slate: remove every core and theme default (front end and editor), measured before and after (A1 to A5).
1. Global style store and output (front end, post editor, Site Editor), with the default token set. Run TG1 to TG5.
2. Style layer on the five blocks, with token pickers (the prototype already exists).
3. Section and container blocks with the defaults above.
4. Text, image and video blocks, after decision D1.
5. The Site Editor panel for the global system.
6. Global classes.
7. The converter writes section and container blocks instead of Custom HTML sections. This needs the T1 fix first.

### Decisions I need

- **D1.** Core blocks with the style layer for text and image (my recommendation), or our own blocks for them? Own blocks for section, container and video (my recommendation).
- **D2.** Global store: option (my recommendation), custom post type, or theme file only.
- **D3.** Token set v1: confirm the list in G3.
- **D4.** Default numbers (section padding, container width, inline padding, measure, video ratio): confirm or give your own.
- **D5.** Order: fix T1 before the foundations (small, my recommendation), or after?
- **D6.** Base theme: a standalone block theme with an empty theme.json (my recommendation), or stay a child of twentytwentyfive?
- **D7.** Core block CSS: keep it for each block we use (my recommendation for now), or remove it all and write our own?
- **D8.** Block editor canvas: keep the theme's editor styles, or start from a blank canvas with only our tokens (my recommendation)?
- **D9.** Remove our lab test CSS (`snn-lab-css`) before the baseline measurement? Yes, I'd recommend that.

None of section 0 has been built or tested yet.

## 1. What Bricks gives its users (read from its registry)

Source: `bricks.local/wp-content/themes/bricks` (2.4.5), read through the loaded WordPress environment. Full tables: [element catalogue](bricks-element-catalogue-2026-11-05.md) and [style controls](bricks-style-controls-2026-11-05.md).

| Area | Bricks 2.4.5 | Count and detail |
|---|---|---|
| Elements | 111 registered | 77 native to Bricks, 34 `snn-*` added by the child theme (not in SNN Block) |
| Native element groups | Layout, Basic, General, Media, Query, WordPress, Single | Layout 4, Basic 8, General 35, Media 8, Query 2, WordPress 6, Single 13 (slot excluded) |
| Shared style controls | Every element | About 62 per element, 85 on layout elements (container, section, block, div) |
| Style-tab controls | One shared set | 109 keys, including separators and info rows (about 90 real settings) |
| CSS properties written | Through the controls | 98 distinct properties (71 from the shared style controls) |
| Element-specific controls | Per element | From 0 to 122: form 122, map 60, video 55, nav 53, testimonials 48, dropdown 43, image 39, list 38, accordion 30 |
| Breakpoints | Desktop base plus 3 | Desktop 1279 px (base), tablet portrait 991, mobile landscape 767, mobile portrait 478; custom breakpoints allowed |
| Pseudo-states | Any element | 18 selectors: hover, focus, active, focus-visible, visited, focus-within, disabled, checked, valid, invalid, required, placeholder, target, empty, first-child, last-child, before, after |
| Interactions | Triggers and actions | 17 triggers (click, mouseover, focus, blur, mouseenter, mouseleave, enter and leave viewport, animation end, scroll, query AJAX start and end, filter submit start and end, form submit, success and error), plus WooCommerce events; 19 actions (show, hide, toggle, scroll to, start animation, set attribute, JavaScript and others); 97 animation presets |
| Global layer | Classes, variables, theme styles | Global classes (`bricks_global_classes`), global variables (`bricks_global_variables`), theme styles with conditions (about 40 control files), global custom CSS |
| Storage | One settings object per element | Responsive values as suffixed keys, for example `_background:tablet_portrait`; states follow the same pattern |

How a control works in Bricks: each control declares a type, a label, a group and a tab, plus the CSS property and selector it writes. Some controls are conditional (grid settings show only when display is grid) and accept global variables. The CSS is generated from those declarations per breakpoint and per state.

### Core WordPress, same measurement

| Area | Core 7.1.4 |
|---|---|
| Leaf controls per block (supports) | Group 49, button 47, quote 43, columns 42, paragraph 34, heading 32, list 28, table 27, image 19, Custom HTML 7 |
| Layout | Group layouts constrained, flex and grid; child layout (flex size, self stretch, grid column and row start and span) |
| Breakpoints | Two (mobile 480 px, tablet 782 px), changeable through theme.json |
| Pseudo-states | Button and Navigation Link only (hard-coded allowlist `VALID_BLOCK_PSEUDO_SELECTORS`) |
| Custom CSS per block | Yes, on most blocks (off for Custom HTML, freeform, block, missing, more, next page, shortcode) |
| Interactions | No no-code trigger and action layer; Interactivity API needs code |
| Global classes | No (only named block-style variations) |
| Element coverage | 26 of the 76 Bricks native elements have a core equivalent, 21 partly, 29 none (judgement; [catalogue](bricks-element-catalogue-2026-11-05.md)) |

### CSS property coverage

Bricks writes 98 distinct CSS properties. Core's style vocabulary (theme.json property metadata plus layout and position support) covers about 55 of them, so about **43 have no core equivalent** (approximate; transform and transform-origin included). The missing ones:

`align-content`, `align-self`, `cursor`, `flex-basis`, `flex-grow`, `flex-shrink`, `grid-auto-columns`, `grid-auto-flow`, `grid-auto-rows`, `grid-column`, `grid-row`, `grid-template-rows`, `isolation`, `justify-items`, `justify-self`, `max-height`, `mix-blend-mode`, `object-position`, `opacity`, `order`, `overflow`, `perspective`, `perspective-origin`, `pointer-events`, `resize`, `scroll-snap-align`, `scroll-snap-stop`, `scroll-snap-type`, `stroke`, `stroke-width`, `fill`, `transform`, `transform-origin`, `transition`, `transition-duration`, `transition-timing-function`, `visibility`, `z-index`, `content`, `font`, `border` (shorthand), `object-fit` (not in the core vocabulary we read), `typography` (a Bricks control, not a property).

### The 34 `snn-*` elements (what this site already needed)

The child theme adds 34 elements to Bricks. Their own controls: `snn-query-nestable` 44, `snn-video-player` 26, `snn-consent-cookie-block` 16, `conditions` 15, `frontend-post-form` 15, `animated-headline` 15, `snn-audio-player` 15, `snn-marquee-slider` 14, `comment-form` 14, `openstreetmap` 11, `snn-custom-cursor` 11, and others (flipbox, timeline, compare-image, matrix-rain, lottie, consent). Built-in Bricks elements were not enough for this site, and these 34 are the list SNN Block would need as blocks, not as a Bricks-only feature.

## 2. The universal style layer: prototype results

Prototype on blocks.local (lab plugin, not in the repo). Every block gets `snnStyle`: a per-block object with a stable id, base CSS values, and `tablet`, `mobile` and `hover` sub-objects. An "SNN style (lab)" panel in the sidebar sets the values. The PHP compiles them to one scoped class per block, adds the class to the block's first element on the front end (for static and dynamic blocks), and gives the editor the same CSS for saved content. Ten properties in the panel: font size, text colour, max width, max height, display, flex direction, justify content, gap, padding, opacity.

| ID | Test | Result |
|---|---|---|
| U1 | Panel on core paragraph, core group, and Custom HTML (converter section) | Works. Paragraph and group show the panel in the default tab; Custom HTML shows it on the Settings tab (its Content tab is empty). [screenshot](screenshots-2026-11-05/universal-editor-html-settings.jpg) |
| U2 | Front end, desktop: paragraph font size and max width | 30 px and 600 px. Verified. |
| U3 | Front end, desktop: group layout and spacing | Display flex, row, gap 20 px, padding 24 px, max width 720 px. Verified. |
| U4 | Front end, desktop: Custom HTML section | Padding 40 px, background colour, max height 300 px. Verified (a section that core cannot style). |
| U5 | Responsive, tablet (700 px) and phone (400 px) | Paragraph 24 px at tablet and 18 px at phone. Group flex direction changes to column at 400 px. Verified. |
| U6 | Hover state in the generated CSS | The rule is generated (`.class:hover`). Core cannot do this for a paragraph (T20). Not checked by hovering. |
| U7 | Change font size 30 px to 40 px through the panel's data path, then save | Front end shows 40 px after save. Verified. |
| U8 | Editor canvas after save and reload | Paragraph 30 px and then 40 px after reload, group flex, Custom HTML padding and max height. Verified. [screenshot](screenshots-2026-11-05/universal-editor-canvas.jpg) |
| U9 | Editor canvas, live (before save) | **Does not update.** The canvas CSS comes from saved content. A live update needs JavaScript that injects the compiled CSS into the canvas document. Not built. |
| U10 | Editor canvas, max width | **Not applied:** the canvas shows 645 px, not 600 px, because the editor's own layout rule wins on specificity. A doubled selector or `!important` in the editor CSS should fix it. Not tested. |
| U11 | Grid template columns | Same code path as the other properties. Not separately tested. |

Prototype size, as a cost indicator: about 110 lines of editor JavaScript and about 120 lines of PHP, for ten properties, two breakpoints and one state.

What the prototype proves: any block can carry a Bricks-style control, the values survive save and the front end, responsive and state CSS can be generated for blocks that core would not allow, and Custom HTML sections can be styled. What it does not prove yet: the full control set, live preview in the editor, the editor specificity fix in general, global classes and variables, and interactions.

## 3. Verified results (earlier tests, still valid)

| ID | Test | Result | Evidence |
|---|---|---|---|
| T1 | `find_and_replace_section`, sections mode | **Bug.** Replacing "About" also deleted "Cta". The end-of-section loop never finds a top-level heading in sections mode. | lab/e1-bug.out |
| T2 | `find_and_replace_section`, blocks mode | Fails safely with an error; sections are groups, so no heading is found. | lab/e1-bug.out |
| T3 | `find_and_replace_text`, sections mode | Works inside Custom HTML and nested text blocks. | lab/e1-bug.out |
| T4 | Span round trip (Fluxa hero copy), typed edit, formats off | Spans kept (`mask`, `reveal`, `grad`). 50 blocks, 0 invalid. | copy 207 |
| T5 | Same, lab formats on | Same result, 0 invalid. | copy 208 |
| T6 | Page 142 (older note: a `grad` span makes a heading invalid) | Not reproduced: 0 invalid. | valid-142 |
| T7 | Sidebar on a converter heading | Panels present, values empty: the design's colour and size are in page CSS, not block attributes. | [screenshot](screenshots-2026-11-05/ed-160-heading-sidebar2.jpg) |
| T8 | Sidebar on a converter section (Custom HTML), Content tab | Empty on the Content tab (the universal panel is on the Settings tab, see U1). | [screenshot](screenshots-2026-11-05/ed-160-section-sidebar.jpg) |
| T9 | Custom card block (dynamic, supports set) | Panels: Typography, Background, Layout, Dimensions, Shadow, Position, Advanced. | [screenshot](screenshots-2026-11-05/ed-card-sidebar.jpg) |
| T10 | Custom reveal attribute on core paragraph | Panel and front-end marker work. | [screenshot](screenshots-2026-11-05/ed-reveal-sidebar.jpg) |
| T11 | Block style on core group | Registered. | registry probe |
| T12 | Additional CSS kept on save, admin | Kept. | e12-stock.out |
| T13 | Additional CSS on save, stock editor (no `unfiltered_html`) | **Stripped.** | e12-stock.out |
| T14 | Editor role on blocks.local | Has `unfiltered_html` here, which is this site's setup, not a WordPress default. | caps.out |
| T15 | Additional CSS `& h2 { }` | Applies. | front probe |
| T16 | Additional CSS `&::before { }` (no space) | Applies. A space before `::before` makes it a descendant pseudo-element. | v2 probe |
| T17 | `@keyframes` in Additional CSS | **Dropped**, alone or with other rules. | v2 probe |
| T18 | Specificity of Additional CSS | Core emits `:root :where(.cls td)`, specificity (0,1,0). Core's own table styles win; `!important` is needed. | table probes |
| T19 | Core Button hover state from its attribute (7.1) | Works. | button probe |
| T20 | Hover state on a custom block (core style path) | Not applied: the allowlist has only core/button and core/navigation-link. The universal layer generates it instead (U6). | front probe |
| T21 | Responsive `@mobile` on a custom block (core style path) | Works. | front probe |
| T22 | theme.json `settings.viewport` from code (mobile 600 px) | Works. | tj probe |
| T23 | theme.json palette from code | Works. | tj probe |
| T24 | Interactivity toggle block (front end) | Works. | toggle probe |
| T25 | Custom support via the block supports API, dynamic block | Works. | support-api.php |
| T26 | Same support on a static core paragraph | **Not applied.** Static block support classes come from the editor's save. | support-api.php |
| T27 | Block binding: paragraph bound to post meta | Renders (meta must be registered with `show_in_rest`). | e12-stock.php |
| T28 | Edit code, comments kept | Keeps the 3 native text blocks. | eck probe |
| T29 | Edit code, comments removed | **Flattens** the 3 native text blocks. | ec-5 probe |
| T30 | Native rebuild of Neon Schedule: padding and heading | Exact (0 px) at 1440 and 390 px. | rects probe |
| T31 | Native rebuild: table | +4 px after moving the table rules into Additional CSS with `!important`. | rects probe |
| T32 | Native rebuild: editor validity | Heading and table flagged invalid. The editor expects `has-text-color`, `has-fixed-layout` and `has-custom-css`. | diff-222 |
| T33 | Coverage of 25 converter sections | Native as is: 8. Native plus Additional CSS: 16. Custom HTML needed: 1 (Fluxa counters). | coverage2.out |

Corrections to earlier notes: the 20 sections measured earlier are 25 across the three designs. The "span makes a heading invalid" note is not reproduced (T6).

## 4. What each route can do, and what it costs

| Route | Controllability | Verified | Main risk |
|---|---|---|---|
| A. Converter as now (Custom HTML sections) | None on sections | T7, T8 | No controls where users need them; T1 bug |
| B. Native blocks plus Additional CSS | Core's fixed controls, plus free CSS | T15, T16, T18, T30, T31 | Specificity; no keyframes; limited control set |
| C. Native markup from the editor's save | As B | T32 (hand-written markup fails) | Needs a markup generator |
| D. Dynamic PHP blocks with supports | Core controls on SNN blocks | T9, T25 | Editor UI and PHP to maintain |
| E. SNN custom blocks with InnerBlocks | Full control of what the block offers | T9 | Each element is work |
| F. Universal style layer (`snnStyle`) on every block | Bricks-style controls on core, SNN and converter sections | U1 to U8 | Editor live preview (U9), editor specificity (U10), control set size |
| G. Inline formats for spans | Editors can create spans | T4, T5 | Registration only; toolbar not tested |
| H. theme.json from code | Global tokens | T22, T23 | Database global styles can still override |
| I. Block styles | Named variants | T11 | Limited to the variant |
| J. Interactivity presets | Behaviour on the front end | T24 | Not visible in the editor; no no-code UI yet |
| K. Bindings to post meta | Dynamic text | T27 | Meta registration |

## 5. Recommendation (agency-first)

Priority order, from your notes (section 0): the foundations first (section, container, text, image, video, and the global style system), then the rest of this list. The universal style layer is part of each foundation block, not a separate later step.

1. **Build the universal style layer for every block.** Bricks-style controls on core blocks, SNN blocks and converted sections. Start with a declarative control list: a control has a type, a label, a group, a CSS property, and an optional condition. The same list drives the panel and the compiler, as in Bricks.
2. **Convert sections to SNN containers, not Custom HTML.** A container carries the layer and holds inner blocks. The design's own CSS stays as the page's base layer, and the controls sit on top.
3. **Keep core blocks where they fit** (heading, paragraph, button, image, list, table, query, navigation). The layer adds controls to them rather than replacing them.
4. **Match Bricks' breakpoints and states at the API level.** Four breakpoints (Bricks defaults, configurable) and a set of states (hover, focus, active, focus-visible, disabled, first and last child), instead of core's two breakpoints and two-state allowlist.
5. **Fix the editor preview.** Inject the compiled CSS into the canvas on every change (U9), and use a doubled selector or equivalent in the editor so the layout rules do not win (U10).
6. **Add the global layer after the panel works:** global classes, variables and theme styles, the parts of Bricks that make a site consistent. Store them in theme.json so they ship with the theme.
7. **Interactions last.** Use the Interactivity API with a curated set of the 17 triggers and 19 actions, and a few animation presets, not all 97.
8. **Elements come from the child theme's list.** Prioritise the 34 `snn-*` elements by how many controls they need and how often they are used. Build as SNN blocks on the same layer.

Immediate next step, if you agree: fix T1 (small, needs approval), then turn the prototype into a control schema of about 60 to 80 properties, with four breakpoints and the states above, and test it against the native rebuild of Neon Schedule.

## 6. Not tested

- The full control set (about 60 to 80 properties) and grid templates (U11).
- States other than hover, custom breakpoints, the Bricks builder UI (no screenshot of it was taken).
- Global classes and variables in the SNN layer.
- Interactions in the SNN layer, Bricks interactions at runtime.
- Live editor preview (U9) and the specificity fix (U10).
- Accessibility, performance with many controls, pattern overrides, the rich-text toolbar, `&:hover` in Additional CSS on non-buttons, `styles.blocks`, Interactivity on core blocks.

## 7. Environment changes on blocks.local

- Drafts created: 193 to 240 (lab copies, tests and rebuilds). Page 213 was corrupted by my own edit; treat it as unusable. Page 240 is the universal-layer test page (drafts only).
- Users: `lab-editor` (id 2, Editor role) and `lab-stock` (role `snn_lab_stock_editor`, Editor without `unfiltered_html`).
- Plugin `snn-lab` (wp-content/plugins/snn-lab): active for the universal-layer tests. Its options (`snn_lab_formats`, `snn_lab_theme_json`) are 0.
- Lab scripts, raw Bricks data (`bricks/elements2.json`, about 7 MB) and results: `C:\Users\sinan\.local-server\snn-block-work\lab\`.
- Repo: no code changes. `docs/research/` only, not committed.

## 8. Versions and sources

- Bricks 2.4.5 on bricks.local: read from the registry (`Elements`, `Interactions`, `Breakpoints`, control definitions in `includes/elements/container.php` and others).
- WordPress 7.1.4 on blocks.local: core block supports, `class-wp-theme-json.php` property metadata, `block-supports/states.php`, `block-supports/custom-css.php`, `block-supports/layout.php`.
- WordPress 7.1 release page: published August 13, 2026 ([wordpress.org](https://wordpress.org/download/releases/7-1/)). It confirms responsive styling, theme.json breakpoints, and Button and Navigation Link states. It does not mention Interactivity, bindings or the Site Editor.
- Bricks Academy, global classes and theme styles: [Global classes](https://academy.bricksbuilder.io/getting-started/global-classes/), [Theme styles](https://academy.bricksbuilder.io/builder/styling/theme-styles/).
