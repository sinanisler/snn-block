# Bricks live tour (5 Nov 2026): what we learn, and the path

Date: 2026-11-05. Source: Bricks 2.4.5 on bricks.local, logged in as admin, builder open on a draft page (ID 410, "Bricks tour (test draft)"). Nothing was published. The draft is left in place; delete it if you do not want it. Screenshots are in [bricks-live-2026-11-05/](bricks-live-2026-11-05/) (35 files, numbered in the order below). Every label list is a text dump of the panel, kept outside the repo in `C:\Users\sinan\.local-server\snn-block-work\bricks-live\raw\`.

Compared with: [bricks-learnings-2026-11-05.md](bricks-learnings-2026-11-05.md), [bricks-foundation-controls-2026-11-05.md](bricks-foundation-controls-2026-11-05.md), and our panel as it stands after commits dd167fc, c45499b and 11a782c.

## 1. Big picture

- Bricks is a full builder with one left panel per element, a Structure panel on the right, a canvas in the middle, and a top bar that opens the global tools. Our panel covers the same parts for the foundations. Our gaps are in breadth (style groups, positioning, backgrounds, transforms, custom CSS, attributes), in global tools (classes, variables, scales, theme styles) and in a few fine controls.
- The biggest finding is about structure, not styling. Bricks has one panel model: each element has a Content tab and a Style tab, and the Style tab is a rail of nine groups. Every element shares the same nine style groups. Shape dividers appear only on layout elements. We have the same model, but our Style tab holds fewer groups.
- Three points in our notes need correcting. Entry animation is not in Style > Layout (it moved to Interactions). "Select Animation" is not in the Content tab of any element we dumped, though the user's screenshot 02 shows it, so it may come from another build. The notes say four header icons; Bricks has three.
- Bricks has four breakpoints. We have three. The fourth is Mobile landscape (767 px), which we dropped on 5 Nov.
- Bricks shows the state of a value with a yellow dot, and the breakpoint with a dot on its button. We use a dot too, so the rule is the same. Bricks also shows the value inherited from another breakpoint as a placeholder. We do not.

## 2. What is in the builder (inventory)

Top bar, left to right: site link, Styles (Ctrl+.), Browser (Ctrl+Shift+.), Pages, Manage, Command palette, Elements/Components, reload canvas, breakpoints (Desktop base, Tablet portrait up to 991 px, Mobile landscape up to 767 px, Mobile portrait up to 478 px), preview width, height and scale, undo, redo, publish, edit in WordPress, view on frontend, preview mode, save draft. Screenshot: [01](bricks-live-2026-11-05/01-builder-start.jpg).

Element library, by category, as the dump lists it: Layout (Section, Container, Block, Div); Basic (Heading, Basic Text, Rich text, Text link, Button, Icon, Image, Video); General (about 30: nav, dropdown, offcanvas, toggle, divider, icon box, icon list, list, accordion, tabs, form, maps, alert, animated text, countdown, counter, pricing, progress, pie chart, team, testimonials, code, template, logo, breadcrumbs, rating, back to top, multi-step form); Media (image gallery, audio, file, carousel, slider, SVG, Instagram feed); Query (Query, Pagination, Query results summary); WordPress (about 19: posts, nav menu, sidebar, search, shortcode, single, post title, excerpt, meta data, post content, social sharing, related posts, author, comments, taxonomy, post navigation, reading time, table of contents); and a child-theme group named "snn" (about 25: code HTML/JS/CSS, OpenStreetMap, advanced image, smoke text, timeline, flipbox, consent cookie block and others).

Structure panel: a row per element, with Copy (All), Paste (All), Remove (All) and Collapse (All) in its header. Adding a Section creates a Container inside it. A query shows an infinity icon next to its row; an interaction shows another icon.

## 3. The Content tab, per element

Dumped from the live panel. Labels in order.

| Element | Content tab (live, 2.4.5) |
|---|---|
| Section | Query loop; HTML tag (section, div, a, article, nav, ol, ul, li, aside, address, figure, Custom); Display (flex by default; inline-flex, grid, block, inline-block, inline, none); Gap; Column gap; Row gap; Flex wrap (No wrap, Wrap, Wrap reverse); Direction (three icons); Align self (five icons and Auto); Align main axis (six icons); Align cross axis (six icons and Auto); Flex grow; Flex shrink; Flex basis; Order. [02](bricks-live-2026-11-05/02-section-content.jpg) |
| Container | The same rows as Section. HTML tag defaults to div. Display defaults to flex. [14](bricks-live-2026-11-05/14-container-content.jpg) |
| Block | The same rows as Container, with Display flex. [15](bricks-live-2026-11-05/15-block-content.jpg) |
| Div | Query loop; HTML tag; Display (block by default); Order. No flex rows. [16](bricks-live-2026-11-05/16-div-content.jpg) |
| Heading | HTML tag (h3); Type (None; hero and lead options); Link to; Separator. [17](bricks-live-2026-11-05/17-heading-content.jpg) |
| Basic Text | A hint that rich text is a separate element; HTML tag (div); Link to; Words limit. [19](bricks-live-2026-11-05/19-basic-text-content.jpg) |
| Button | HTML tag; Size (Default); Style (Primary and others); Circle; Outline; Link; Link type; Icon. [20](bricks-live-2026-11-05/20-button-content.jpg) |
| Image | Select image; Sources (add a source per breakpoint); HTML tag; Aspect ratio; Object fit; Object position; Caption type; Loading; Stretch; Image overlay; Link to; Icon; Mask. [21](bricks-live-2026-11-05/21-image-content.jpg) |

Points to take from this:

- Bricks puts the flex rows on Section, Container and Block, and only Order on Div (grid rows appear once Display is grid; the dump was taken on the default). That matches our split: our Section, Container and Div are the three, and Div is a plain block. Bricks also has Block, which is a flex container like Container.
- Display is a select with seven values. We have eight: we added inline-grid.
- Bricks Gap is one row, and Column gap and Row gap are two more. We show only the two.
- Align self, Align main axis and Align cross axis are icon rows with six icons each (the tooltips give the names: Start, Center, End, Space between, Space around, Space evenly; Start, Center, End, Stretch, Baseline, Auto). Our Align self is a select, and our Justify and Align rows show four icons each. We left out Space around, Space evenly and Baseline because they had no picture.
- Bricks puts the flex item settings (grow, shrink, basis, order, align self) on the element's own Content tab, shown whatever the parent. Ours show them in the Item group, only when the parent is flex or grid. Both work; Bricks' version is simpler to find, ours is shorter.
- Variables (the shield button) appear on Gap, Column gap, Row gap, Flex grow, Flex shrink, Flex basis and Order. Our rule gives the V button only to size and colour fields. Bricks gives it to any number that can hold a variable. This is a rule to decide (see section 9).

## 4. The Style tab: the nine groups (and Content makes ten)

The Style tab is a rail of icons on the left edge: Content, then nine groups. Layout elements have all ten. Heading, Button and Image have nine (no Shape dividers). The groups are the same on every element. The labels below are from the Section dump.

| Group | Labels in Bricks (live) | Ours (5 Nov, from our notes and the panel) |
|---|---|---|
| Layout | Spacing (margin and padding, each with a box model and link toggles); Sizing (width, min and max width, height, min and max height, aspect ratio); Positioning (position, top, right, bottom, left, z-index, scroll snap); Misc (visibility, overflow, opacity, cursor, isolation, mix blend mode, pointer events, perspective, perspective origin, masonry). 41 labels. [03](bricks-live-2026-11-05/03-section-style-layout.jpg), [04](bricks-live-2026-11-05/04-section-style-layout-sizing.jpg), [05](bricks-live-2026-11-05/05-section-style-layout-misc.jpg) | Spacing and Size built (Size has max width only, per the attribute list); Visibility and overflow planned. No positioning, no width, height, min or max height, no aspect ratio, no cursor, blend mode, pointer events, perspective or masonry. |
| Typography | Color, font size, text align, text transform, font family, font weight, font style, font variation settings, line height, letter spacing, white space, text wrap, text shadow, text decoration. 19 labels. [06](bricks-live-2026-11-05/06-section-style-typography.jpg) | Built. Check its keys against Bricks' list; text transform, text shadow, text decoration, letter spacing and text wrap are not in our notes. |
| Background | Background color; background image (select image, file or URL); background video (file, YouTube, Vimeo). [07](bricks-live-2026-11-05/07-section-style-background.jpg) | Colour only. Missing: image and video. |
| Border / Box shadow | Border; Box shadow. [08](bricks-live-2026-11-05/08-section-style-border.jpg) | Built. |
| Gradient / Overlay | Apply to (background or CSS selector); type; linear and other types; angle; repeat; colour stops (add colour). [09](bricks-live-2026-11-05/09-section-style-gradient.jpg) | Not built. |
| Shape dividers | Add shape (layout elements only). [10](bricks-live-2026-11-05/10-section-style-shape-dividers.jpg) | Not built. |
| Transform | Transform origin; element parallax (with its note that parallax does not run in the builder); background parallax; parallax start point (%). [11](bricks-live-2026-11-05/11-section-style-transform-parallax.jpg) | Transform planned; parallax not in our notes. |
| CSS | Custom CSS (with the %root% alias and the keyboard shortcut r + Tab); CSS classes; CSS ID; CSS filters; transition. [12](bricks-live-2026-11-05/12-section-style-css.jpg) | Custom CSS planned (Advanced); filters planned. No classes or ID field in the panel. |
| Attributes | Custom attributes (name and value rows). [13](bricks-live-2026-11-05/13-section-style-attributes.jpg) | Not built. |

Note the group order: Layout, Typography, Background, Border, Gradient, Shape dividers, Transform, CSS, Attributes. We can use that order as the build order.

## 5. Popups and sub-panels

- **Variable picker (shield).** The picker opens under the field with a "Search variable" box and groups by variable group (Uncategorized, Default with its Colors kind). The shield turns yellow while the picker is open. [22](bricks-live-2026-11-05/22-variable-picker.jpg). Our picker shows the kind first (colours or sizes), which is a better fit for our rule.
- **Query loop.** The switch sits at the top of the Content tab. When it is on, a yellow dot shows beside its label, and a row "Query" with an infinity button appears. [23](bricks-live-2026-11-05/23-query-loop-on.jpg). The button opens a long sub-panel: Type (Posts), Post type, Order by, Order, Posts per page, Offset, Child of, Ignore sticky posts, Disable query merge, Is main query, Include, Exclude, Include and exclude authors, Exclude current post, Terms include and exclude, Meta query, Taxonomy query, and a Performance group (skip total row count, disable post meta cache, and more). [24](bricks-live-2026-11-05/24-query-settings.jpg). Ours is an accordion with post type, order, per page, offset, child of, sticky, include and exclude, authors, and main query. It has no Terms, Meta, Taxonomy, merge or Performance settings.
- **Conditions** (stacked-boxes icon in the element header). A sub-panel with a + to add a condition and an X to close. Note: "Conditions don't run in the builder." [25](bricks-live-2026-11-05/25-conditions.jpg)
- **Interactions** (ribbon icon). The same shape. Note: "Interactions don't run in the builder." [26](bricks-live-2026-11-05/26-interactions.jpg). The add form has ID, Trigger, Select (the trigger), Action, Target, Self, Run only once, Conditions with Add Condition, and a relation (And). [27](bricks-live-2026-11-05/27-interaction-form.jpg). Our Interactions use trigger, action and target too; to compare field by field.
- **Element header.** Three icons: Hide element (eye), Conditions (stacked boxes), Interactions (ribbon). Above them the element name; below, the ID bar with the element ID (for example `#brxe-twvgzn`), a select-element pointer, and a "b" button whose meaning we did not confirm (the click failed).

## 6. Responsive values

- Breakpoints (top bar): Desktop (base), Tablet portrait (up to 991 px), Mobile landscape (up to 767 px), Mobile portrait (up to 478 px). Custom breakpoints are on in the settings (see section 7).
- Setting Gap in the tablet view gives the Gap field a yellow dot and a small device icon beside its label. Column gap and Row gap then show the inherited 20 px as a grey placeholder. [28](bricks-live-2026-11-05/28-tablet-gap-set.jpg)
- Back on Desktop, Gap is empty, with no dot. The tablet button in the top bar carries a dot, which says that the tablet view has a value. [36](bricks-live-2026-11-05/36-desktop-after-tablet-gap.jpg)
- So the rule is: a value is stored for one breakpoint, the breakpoint button shows that it holds values, the field shows the device icon, and inherited values show as placeholders. Ours stores per view too (the responsive attribute), and our view rows show a dot and a Reset. We do not show the inherited value as a placeholder, and we do not show a dot on the breakpoint buttons.
- Not verified: the stored keys (for example a suffix per breakpoint). To check, save the draft and read its post content.

## 7. The Style Manager (Styles, Ctrl+.) and the Manage menu

The Style Manager is a full-screen modal with nine sections on the left. [29](bricks-live-2026-11-05/29-style-manager-colors.jpg)

1. **Theme styles.** A dropdown of theme styles (the default is "Default"). Several theme styles can be made and selected, and each can have its own conditions (not checked).
2. **Classes.** The global class list. 468 classes on this site (the names start with lf-, the prefix of this demo site). Sort, filter and categories. [31](bricks-live-2026-11-05/31-style-manager-classes.jpg)
3. **Variables.** 31 variables in the Uncategorized and Default groups. [32](bricks-live-2026-11-05/32-style-manager-variables.jpg)
4. **Colors.** A list of colour variables: swatch, the variable name (for example var(--lf-ink)), the hex value, edit and duplicate. Also a dark mode generator and shades (from the Colors text). [29](bricks-live-2026-11-05/29-style-manager-colors.jpg)
5. **Typography.** Scales. "No scales found." Each scale makes font sizes and line heights that follow a ratio, and the generated scales become variables. [30](bricks-live-2026-11-05/30-style-manager-typography.jpg)
6. **Spacing.** Scales in the same way. "We recommended creating at least one spacing scale."
7. **Framework.** Not captured (the tab opened the element library).
8. **Settings** and **Browser.** Not captured in detail.

The Manage menu lists: Settings (Theme style, Page settings, History, Revisions, Style manager, Font manager, Icon manager, Query manager, Builder interface, Bricks settings, Element manager), Import and Export. [33](bricks-live-2026-11-05/33-manage-menu.jpg)

Pages opens a list of the site's pages with a Builder flag and the date. [34](bricks-live-2026-11-05/34-pages-panel.jpg)

Bricks settings (WordPress admin, Bricks > Settings): tabs General, Builder access, Templates and components, Builder, Performance, Maintenance mode, API keys, Custom code. Items that matter to us: post types edited with Bricks (post and page); Block editor integration (load Block editor data into Bricks, save Bricks data as Block editor data, Bricks components in the block editor (experimental), disable Bricks theme styles in the block editor); disable the global class manager; disable the CSS variables manager; custom breakpoints; a converter ("convert Container to new Section and Block elements", "entry animation to interaction"); custom login and registration pages. [35](bricks-live-2026-11-05/35-bricks-settings-admin.jpg)

## 8. Comparison with our notes

| Topic | Our notes said | Live Bricks 2.4.5 | Gap or change |
|---|---|---|---|
| Yellow dot | "stored, probably" | Confirmed: a value is set on this breakpoint (query switch, tablet gap) | Same meaning; we use the dot too |
| Shield | "probably variables" | Confirmed: tooltip "Variables" | Bricks puts it on numbers too |
| Header icons | four (code, eye, stacked, ribbon) | three: Hide element, Conditions, Interactions | No code icon; we have no Hide element |
| Select Animation | in Content | not in any Content dump of 2.4.5 | Check the user's screenshot 02; it may come from another build |
| Entry animation | Style > Layout (97 presets) | not in Layout; the converter moves it to Interactions | Our Effects go on Default; Bricks' Interactions hold triggers and actions |
| Section and Container flex | not in the registry | flex by default, observed on insert (also Block) | We made Section and Container flex (11a782c) |
| Shape dividers | layout elements only | confirmed (10 groups on Section, Container, Block; 9 on the others) | Not built |
| Responsive storage | unknown | per breakpoint, shown with a dot and a device icon, inherited values as placeholders | We have the store; not the indicators or placeholders |
| Breakpoints | four in the registry | four in the builder, Mobile landscape at 767 px | We have three (decision D18) |
| Labels for select keys | keys only | labels now dumped (for example Display, Flex wrap, Align self) | Copy the label list for each select |
| Four header icons, id bar "b" | open | three icons; "b" not confirmed | Still open |
| State UI (hover, focus) | open | not checked | Still open |
| Dynamic data (lightning) | open | not opened in this tour | Still open |

## 9. Which path

Our foundations are built: the layout blocks, the global styles, the query, the panel with its tabs and the per-view values. The gap is breadth: the Style groups, the controls and the global tools. The path I recommend:

1. **Decide four things first.** Each one changes the work.
   - Breakpoints: keep three (991 and 478), or add Mobile landscape at 767 px as Bricks does. Bricks has four; we decided three on 5 Nov (D18).
   - Variables on numbers: keep our rule (size and colour fields only), or follow Bricks (Gap, Order, grow, shrink and basis too).
   - Block: add a Block element (a flex container with the same rows as Container), or keep three elements (Section, Container, Div).
   - Query: keep our accordion with the current subset, or add Terms, Meta, Taxonomy and Performance.
2. **Build the Style groups in Bricks' order**, one group at a time, each with our compact rows and the variable and dynamic-data tools: Layout (spacing, sizing with min and max height, aspect ratio, positioning, misc), Typography (the full list), Background (colour, image, video), Border and shadow, Gradient and overlay, Transform (with parallax later), CSS (custom CSS, classes, ID, filters, transitions), Attributes. Shape dividers come after the layout set, for the three layout elements only.
3. **Fix the controls** that Bricks does better. Align self, Align main axis and Align cross axis as icon rows with all six options (we add Space around, Space evenly and Baseline icons). Direction as three icons. A Gap row next to Column gap and Row gap. The inherited value as a placeholder for each breakpoint, and a dot on the breakpoint button.
4. **Global tools after the foundations:** the global class list (classes are where Bricks gets its reuse), the variable list, the typography and spacing scales, and theme style sets. Our global styles modal already covers colours, sizes and fonts; the scales and classes are new.
5. **A quick rail for the Style tab.** Bricks lets you jump between groups with a rail of icons. Our Style tab is a long list. A rail would help on a long panel. This is a design choice for you (the approved version 12 uses tabs).

What I would not copy: the Query sub-panel with every option shown at once. Our accordion, with the common settings first, is the better first screen.

## 10. Not checked yet

- Dynamic data popup (lightning) and the variables for text fields.
- The Components tab, the Framework tab (it opened the element library), the Settings and Browser sections of the Style Manager.
- The ID bar "b" button; the Hide element behaviour.
- Hover, focus and other states; the Effects, parallax and transition settings in detail.
- The keys used to store responsive values (needs a save of the draft and a read of the post content).
- Templates (the list was empty) and the Bricks Components library.
- Keyboard shortcuts and the command palette.

## 11. Files

- Screenshots: [docs/research/bricks-live-2026-11-05/](bricks-live-2026-11-05/), numbered 01 to 35 in the order of this file.
- Raw dumps and every screenshot taken (about 100 files): `C:\Users\sinan\.local-server\snn-block-work\bricks-live\raw\`. The tour scripts are in the scratchpad (`gen-tour.js`, `bricks-lib.js`) and the test draft is ID 410 on bricks.local.
