# Bricks Style tab, in detail (6 Nov 2026)

Research only. No block editor changes. Nothing was saved or published in Bricks.

Written for: the project owner, to decide how far our Style tab should follow Bricks.

## 0. Method and limits

- Bricks 2.4.5 on bricks.local, in the builder, on the test draft (page 410). A Section and then a Heading were added to the draft inside the builder. Every group and editor was opened and read from the live panel. Repeater rows (gradient colours, shape dividers, attributes) were added to read their fields. The builder discards these changes on reload, and nothing was saved.
- Field lists come from the panel DOM (control type, label, key, placeholder, options, variable button, tooltips), read with the CDP driver. Two points were checked in the Bricks source: the filter units and the link-toggle labels.
- "Ours" is read from our code (`includes/blocks/assets/layout-blocks.js`, `includes/blocks/style-props.php`), not from a browser run of our panel this round.
- Screenshots: [bricks-style-detail-2026-11-06/](bricks-style-detail-2026-11-06/), numbered as in this note.

## 1. Summary

- **Nine groups on Section, eight on Heading.** Bricks lists its groups as cards: Layout, Typography, Background, Border / Box Shadow, Gradient / Overlay, Shape dividers, Transform, CSS and Attributes. Shape dividers is missing on Heading. A vertical icon rail on the far left of the panel holds the same groups, plus Content. [00](bricks-style-detail-2026-11-06/00-section-rail.png), [13](bricks-style-detail-2026-11-06/13-heading-rail.png)
- **Ours has seven groups** as a row of icons at the top of the tab: Layout, Typography, Background, Gradient, Border, Transform and Filters. CSS, Shape dividers and Attributes are not Style groups for us. Classes, attributes and custom CSS live in Default > Advanced.
- **Five controls open an editor** from a pencil button on their row: Border, Box shadow, Text shadow, Transform and CSS Filters. Each editor opens in place, under its row.
- **Three repeaters** add rows: gradient colour stops, shape dividers (30 shapes) and attributes (name and value).
- **Placeholders are computed from the element.** Bricks shows the element's own value as the grey placeholder, on every breakpoint. Perspective origin shows `530px 45px` on Desktop and `495px 45px` on Tablet, which is half the element's width on each view (consistent with the default `50% 50%`). Ours shows only the value inherited from another view.
- **Link toggles:** Margin and Padding have three link icons: Switch, Opposites linked and All sides linked. Border width has two (Opposites and All sides). Border radius has one (All sides). The active icon turns yellow. Switch made no visible change in the box, so its meaning is not confirmed.
- **Units:** the number fields have no unit picker in the DOM. The unit is typed into the field (not tested).
- **Variables:** length, number and colour fields have a V button, including the transform, border and transition fields. Keyword fields (position, overflow, pointer events) and the two origin fields (transform origin, perspective origin) have none. Text fields with dynamic data also show a lightning button.

## 2. How the panel is built

- Left icon rail (about 25 px from the edge): Section has ten icons (Content, Layout, Typography, Background, Border, Gradient, Shape dividers, Transform, CSS, Attributes). Heading has nine.
- Header: the element name, then three icons (Hide element, Conditions, Interactions). Below it the ID bar, with the element ID, a pointer button and a "b" button (not opened).
- Tabs: Content and Style.
- Under Style: the group cards. Clicking a card opens that group in place. One group is open at a time.
- Inside a group: sections with uppercase headings (Layout has six: Spacing, Sizing, Positioning, Scroll snap, Misc and Masonry). Each row shows its label; the label's tooltip is the CSS property name (for example `min-width`, `scroll-snap-type`).

## 3. Group by group

Bricks column: the control as the panel shows it, with its type, options, placeholder, V button and tooltips. Ours column: what our Style tab has, from our code.

### 3.1 Layout (34 controls) [01](bricks-style-detail-2026-11-06/01-layout.png)

| Bricks control | Detail in Bricks | Ours |
|---|---|---|
| Margin, Padding | Four number fields (top, right, bottom, left), each with V. Link icons: Switch, Opposites linked, All sides linked. | Box with four sides and a link toggle. No Switch. |
| Width, Min width, Max width, Height, Min height, Max height | Number fields with V. | Present, with V. |
| Aspect ratio | Text field with V. | Present. |
| Position | Select: static, relative, absolute, fixed, sticky. | Present, same five. |
| Top, Right, Bottom, Left | Number fields with V. | Present. |
| Z-index | Number field with V, placeholder 0. | Present. |
| Scroll snap: Type | Select: Unset, Mandatory (y-axis), Proximity (y-axis), Mandatory (x-axis), Proximity (x-axis). | Missing. |
| Scroll snap: Align | Select: start, center, end. | Present, with an extra "none". |
| Scroll snap: Stop | Select: normal, always. | Missing. |
| Visibility | Select: visible, hidden, collapse. | Present, same three. |
| Overflow | Text field, placeholder `visible`. | Select: visible, hidden, clip. Differs. |
| Opacity | Number field with V, placeholder 1. | Present. |
| Cursor | Select with 34 values in six groups (General, Link & status, Selection, Drag & drop, Zoom, Resize). | Present, 14 values. |
| Isolation | Select: auto, isolate. | Present. |
| Mix blend mode | Select, 16 values. | Present, same 16. |
| Pointer events | Text field, placeholder `auto`. | Select: auto, none. Differs. |
| Perspective | Number field with V, placeholder `none`. | Present. |
| Perspective origin | Text field; the placeholder is the element's computed value (`530px 45px` on Desktop, `495px 45px` on Tablet). | Present, with no computed placeholder. |
| Masonry layout | Checkbox. Its other fields (columns, gutter, transition) show when it is on; not opened. | Missing. |

### 3.2 Typography (16 rows plus the Text shadow editor) [02](bricks-style-detail-2026-11-06/02-typography.png), [12](bricks-style-detail-2026-11-06/12-text-shadow.png)

| Bricks control | Detail in Bricks | Ours |
|---|---|---|
| Color | Colour field with V, picker, palette, dynamic data. | Present (swatch). |
| Font size | Number field with V. | Present. |
| Text align | Four icons: left, centre, right, justify. | Present, same four. |
| Text transform | Four icons: Aa (capitalise), AA (uppercase), aa (lowercase), x (none). | Present, same four. |
| Font family | Searchable select, Google fonts, with a link to the Font manager. | Present; the font list was not compared. |
| Font weight | Searchable select with **100 to 900 only**. | Present, plus `normal` and `bold`. |
| Font style | Select: Normal, Italic, Oblique. | Present, same three. |
| Font variation settings | Text field with V, placeholder `font-variation-settings`. | Missing. |
| Line height | Number field with V, placeholder `-`. | Present. |
| Letter spacing | Number field with V. | Present. |
| White space | Select: normal, nowrap, pre, pre-wrap, pre-line, break-spaces. | Present, same six. |
| Text wrap | Select: wrap, nowrap, balance, pretty, stable. | Present, same five. |
| Text shadow | **Editor** (pencil): X, Y, Blur (lengths) and Colour with V. | One text field. Differs. |
| Text decoration | Icons, tooltips Underline and None. | Select: none, underline, line-through, overline. |

### 3.3 Background (four rows) [03](bricks-style-detail-2026-11-06/03-background.png)

| Bricks control | Detail in Bricks | Ours |
|---|---|---|
| Background color | Colour field with V, picker, palette, dynamic data. | Present (swatch). |
| Background image | Select image, with Dynamic data and Custom URL fields. Size, position and repeat options were not seen on an empty element. | URL, plus size, position and repeat. |
| Background video | URL field: YouTube or Vimeo URL or ID; dynamic data. | Missing. |

### 3.4 Gradient / Overlay [06](bricks-style-detail-2026-11-06/06-gradient.png)

| Bricks control | Detail in Bricks | Ours |
|---|---|---|
| Apply to | Select: Background, Overlay, Text. | Missing. |
| CSS selector | Text field, placeholder `.bricks-button`. | Missing. |
| Type | Select: Linear, Radial, Conic. | Linear and Radial only. |
| Angle | Number field, degrees. | Present. |
| Repeat | Checkbox. | Missing. |
| Colors (repeater) | Each row: colour with V, picker, palette, dynamic data; stop as a number with V (tooltip "Default: %"); Duplicate and Delete. Rows are added with "Add Color". | Two colours and two stops, fixed. |

### 3.5 Border / Box Shadow [04](bricks-style-detail-2026-11-06/04-border.png), [05](bricks-style-detail-2026-11-06/05-box-shadow.png)

| Bricks control | Detail in Bricks | Ours |
|---|---|---|
| Border (editor): Width | Four sides, with link icons Opposites and All sides. V on each. | One width value. Differs. |
| Border (editor): Style | Select: None, Hidden, Solid, Dotted, Dashed, Double, Groove, Ridge, Inset, Outset. Shows "Default" when empty. | Select: none, solid, dashed, dotted, double. |
| Border (editor): Color | Colour field with V; picker and palette. | Present. |
| Border (editor): Radius | Four corners (top left, top right, bottom left, bottom right), with an All sides link icon. | One radius value. Differs. |
| Box shadow (editor) | X, Y, Blur, Spread (number fields with V), Colour with V, and an **Inset switch**. | X, Y, Blur, Spread, Colour. No Inset. |

### 3.6 Shape dividers (Section) [09](bricks-style-detail-2026-11-06/09-shape-dividers.png)

- "Add Shape" adds a row: a searchable shape select, with Duplicate and Delete.
- The 30 shapes: Custom, Cloud, Drops, Grid (Round), Grid (Square), Round, Square, Stroke, Stroke #2, Tilt, Triangle, Triangle concave, Triangle convex, Triangle double, Wave, Waves, Wave brush, Zigzag, and twelve "Vertical -" variants (Cloud, Drops, Pixels, Stroke, Stroke #2, Tilt, Triangle, Triangle double, Wave, Waves, Wave brush, Zigzag).
- Ours: not built. The fields that appear after a shape is chosen were not checked.

### 3.7 Transform [07](bricks-style-detail-2026-11-06/07-transform.png)

| Bricks control | Detail in Bricks | Ours |
|---|---|---|
| Transform (editor) | Translate X, Translate Y, Scale X, Scale Y, Scale X (3D), Scale Y (3D), Perspective, Rotate X (°), Rotate Y (°), Rotate Z (°), Skew X (°), Skew Y (°). Each with V. | Translate X and Y, one Rotate, one Scale, Skew X and Y. |
| Transform origin | Text field, placeholder `center`. | Present. |
| Parallax | Element parallax and Background parallax (checkboxes); Parallax start point (%), placeholder 0; an info note. | Missing. |

Source note: Bricks' parallax does not run in the builder (its own note on the panel).

### 3.8 CSS [08](bricks-style-detail-2026-11-06/08-css-filters.png)

| Bricks control | Detail in Bricks | Ours |
|---|---|---|
| Custom CSS | Code editor with V; tooltips Fullscreen and Collapse. | Default > Advanced, admin only. Location differs. |
| CSS classes | Text field, dynamic data. | Default > Advanced (chips). Location differs. |
| CSS ID | Text field, dynamic data. | None typed. Every block gets an automatic ID (no typed CSS ID field; see the 5 Nov ID decision in the project memory). |
| CSS Filters (editor) | Eight sliders, each with a number box: Blur (px), Brightness (%), Contrast (%), Hue rotate (deg), Invert (%), Opacity (%), Saturate (%), Sepia (%). Units confirmed in the source (`includes/assets.php`, 3769 to 3785). | Blur, Brightness, Contrast, Grayscale, Hue rotate, Invert, Saturate, Sepia. **Bricks has no Grayscale and has Opacity.** |
| Transition | One text field with V, placeholder `all`. Writes the CSS transition shorthand (`base.php` 1637 to 1655). | Four fields: property, duration, timing function, delay. Differs. |

### 3.9 Attributes [10](bricks-style-detail-2026-11-06/10-attributes.png)

- "Add Attributes" adds a row with Name and Value text fields, both with dynamic data, and Duplicate and Delete.
- Ours: Default > Advanced, name and value rows (the same content, different place).

## 4. Link toggles, tested

- Clicking "All sides linked" turned its icon yellow and left the four fields in place. [11](bricks-style-detail-2026-11-06/11-margin-all-linked.png)
- Clicking "Opposites linked" turned its icon yellow.
- Clicking "Switch" turned no icon yellow and changed nothing visible. Its meaning is not confirmed.

## 5. Heading versus Section

- Heading has eight groups: Layout, Typography, Background, Border / Box Shadow, Gradient / Overlay, Transform, CSS and Attributes. No Shape dividers. [13](bricks-style-detail-2026-11-06/13-heading-rail.png)
- The Heading typography rows were not compared one by one with Section's.

## 6. Decisions for you

Each item has my recommendation.

1. **Which groups we show.** Bricks has nine. Our Filters group covers part of Bricks' CSS group. Options: (a) add Shape dividers as a Style group, on layout elements only (Section, Container, Block); (b) add a CSS group for classes, ID and transition; (c) keep attributes and custom CSS in Advanced. Recommendation: (a), then (b), and keep (c) as it is, because attributes and custom CSS are admin-level.
2. **How the Style tab is laid out.** Bricks: cards that open in place, plus an icon rail. Ours: a row of icons, one group at a time. Our rule is accordions, not popups (block-controls-direction). Recommendation: keep our icon row (it fits a 240 px panel) and open sub-sections in place.
3. **Editors.** Border, Box shadow, Text shadow, Transform and CSS Filters open an editor. Options: flat rows, always visible, or in-place sub-sections. Recommendation: in-place sub-sections, never a popup.
4. **Repeaters.** Gradient colour stops (unlimited, with Duplicate and Delete), shape dividers and attributes. Recommendation: stops as a repeater (we need more than two); shapes after the group work; attributes stay in Advanced.
5. **Missing fields to add**, in priority order: border per side and per corner; box shadow Inset; text shadow (X, Y, Blur, Colour); transform 3D scale, rotate per axis, parallax; scroll snap type and stop; full cursor list; font variation settings; gradient Apply to, CSS selector and Repeat; background video; masonry (only if we want the masonry layout). Also decide: our Grayscale filter is not in Bricks, and Opacity is.
6. **Transition.** One shorthand text field (Bricks) or our four fields. Recommendation: keep our four, because they are easier to read, and note that they write the same CSS.
7. **Placeholders.** Bricks shows the element's computed value as the placeholder. Recommendation: show the computed value of the current view as the placeholder, as we already do for inherited values, and extend it to Desktop. This needs one read of the computed style per field.
8. **Variables on the Style tab.** Bricks puts V on the length, number, colour and transition fields, but not on keyword fields or the two origin fields. Our layout panel already puts V on every number and text field (287aa82). Recommendation: the Bricks rule for the Style tab, so the origin fields and keyword fields stay without V.
9. **Breakpoints.** Bricks has four (the fourth is Mobile landscape at 767 px). This is the open decision D18 from the 5 Nov tour, not new.

## 7. Not checked

- The fields that appear after a shape is chosen in Shape dividers.
- Editor values on Tablet and Mobile (dots and placeholders inside the editors).
- Background options after an image is set (size, position, repeat).
- The Font manager, the Custom CSS fullscreen view, and the list of transition properties.
- Gradient Apply to set to Overlay or Text, and the Conic type.
- Masonry fields when it is on, and parallax behaviour on the front end.
- Container and Block Style rails (only Section and Heading were opened).
- Heading typography rows compared one by one with Section's.

## 8. Files

- Screenshots: [bricks-style-detail-2026-11-06/](bricks-style-detail-2026-11-06/), 15 PNG files, numbered in the order of this note.
- Raw DOM dumps (one file per group and per editor, with summaries): `C:\Users\sinan\.local-server\snn-block-work\bricks-live\style-detail\`.
- Probe scripts (extract, helpers, section setup, summary, screenshot steps): `C:\Users\sinan\.local-server\snn-block-work\tools\bricks-style\`.
- Test draft on bricks.local: page 410. The Section and Heading added in the builder were not saved and are gone after a reload. Nothing was published.

## Related

- [bricks-live-tour-2026-11-05.md](bricks-live-tour-2026-11-05.md): the first tour (groups, labels, the path).
- [style-tab-2026-11-06.md](style-tab-2026-11-06.md): our Style tab as built (a6dd071).
- [bricks-style-controls-2026-11-05.md](bricks-style-controls-2026-11-05.md): the Bricks registry of style controls.
