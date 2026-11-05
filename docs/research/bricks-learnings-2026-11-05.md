# Bricks learnings for our foundation blocks and controls

Date: 2026-11-05. Sources: Bricks 2.4.5 on bricks.local (registry dump, element PHP, builder JS) and seven screenshots of the Section, Container, Heading, Basic Text, Image and Button panels ([screens 01 to 07](screenshots-2026-11-05/)). Every control is listed in the generated reference, [bricks-foundation-controls-2026-11-05.md](bricks-foundation-controls-2026-11-05.md). This file holds the reading and the decisions that follow from it.

Status: research only. No block or control has been built from these notes yet.

## 1. Direction (from the user, 5 Nov 2026)

- We build our own blocks, our own controls, our own global style system and our own defaults. WordPress core controls are too weak to build on, so we do not extend them. The universal panel on core blocks is a prototype only.
- Bricks is the reference: how its builder is organised and what it looks like. Its look is a good default for us. Ours should be more compact, more modern and nicer to look at.
- The first foundation set is Section, Container, Heading, Text (basic), Image and Button, in that order of priority.
- Rich text is not a separate element for us. Inline formatting comes from a toolbar on the text itself, as the paragraph block does in WordPress. "Text is text."
- Heading is a text with heading defaults (tag, size, weight). It is not a separate kind of block.
- The first tab is called **Default**, not Content (the user's suggestion). Bricks' "Content" tab holds the element's defaults and the flex and grid primitives, not only content. The second tab is **Style**.

## 2. The seven screens

| # | Screen | What it shows | What we learn |
|---|---|---|---|
| 01 | Section, Style tab | Nine group cards, each with an icon, an uppercase title and a chevron: Layout, Typography, Background, Border / Box Shadow, Gradient / Overlay, Shape dividers, Transform, CSS, Attributes. Above them: element name, four header icons, the `#brxe-…` id field with a select-element icon and a "b" icon, and a CONTENT / STYLE switch (active tab as a filled pill). | One panel per element. Groups are cards, so the list scans fast. Shape dividers appear only for layout elements. |
| 02 | Section, Content tab | Query loop switch, then one column of rows with labels on the left: HTML tag, Display, Gap, Column gap, Row gap, Flex wrap, Direction (three icon buttons), Align self (five icon buttons), Align main axis (six), Align cross axis (six), Flex grow, Flex shrink, Flex basis, Order, Select Animation. | The flex primitives live in the first tab next to the element's own settings. Direction and alignment are icon-button rows, which saves height. |
| 03 | Container, Content tab | The same rows as Section, with HTML tag div. | Confirms the code: Section extends Container. The only visible difference is the default tag. |
| 04 | Heading, Content tab | Text field with an AI button and a lightning button; HTML tag (h3); Type (None: hero, lead); Style (None: nine named variants); Link to; Select Animation; a collapsible SEPARATOR group with width, height, spacing, style, alignment and colour. | Heading-only settings are type, a colour variant and a separator. The text sits at the top of the first tab. |
| 05 | Basic Text, Content tab | A textarea with a hint: "Select text on canvas to format it. To add headings, paragraphs, and images use the Rich Text element." Then HTML tag (div), Link to, Words limit, Read more (only when Words limit is set), Select Animation. | Basic text is plain. Formatting lives in another element. We merge the two: one text element with a toolbar. |
| 06 | Image, Content tab | Dashed "Select image" drop area, Browse Unsplash button, Dynamic data and Custom URL fields (each with lightning), HTML tag, Sources (add a source per breakpoint), Aspect ratio, Object fit (Fill), Object position (50% 50%), Caption type (Attachment), Loading (lazy), Stretch switch, Image Overlay (two icons and a colour value), then the LINK TO section. | Image needs per-breakpoint sources, an overlay and a link. Uppercase section headers (LINK TO) divide the tab. |
| 07 | Button, Content tab | Text field with AI and lightning buttons; HTML tag (span, typed as text); Size (Default: sm, md, lg, xl); Style (Primary: nine variants, with a clear button); Circle and Outline switches; LINK section (Link type); ICON section (icon picker square). | Variants come from a fixed named list. Separate sections (LINK, ICON) keep the tab readable. |

## 3. How Bricks is built (checked in source or the registry)

- **One base class.** `includes/elements/base.php` gives every element the same nine style groups through `set_common_control_groups()`. Their controls have `_` keys. Shape dividers are added only when `is_layout_element()` is true.
- **Section is a Container.** `Element_Section extends Element_Container` (`section.php`). The class gives the same 88 controls and the same defaults. The diff in the generated reference finds zero control-level differences. The differences are the default tag (section, div), the label and icon, and the child element list (section nests a container).
- **The display controls are shared.** `Element_Container::get_display_grid_controls()` (`container.php`, line 48) builds Display, flex and grid rows once. Other elements can reuse it.
- **Two tabs in the data.** A control with an empty tab takes its group's tab. Controls with no tab and no group are the element's own settings and the flex or grid primitives, shown under Content.
- **Conditions hide controls.** Flex rows show only when Display is flex or inline-flex. Grid rows show only when Display is grid. Masonry rows need `_useMasonry` set. Animation duration needs an animation. This keeps each panel short.
- **Grid item rows are a JS rule.** They appear when the parent is grid. The rule is a builder watcher on the `_gridItem` prefix (`container.php`, the comment above `_gridItemSeparator`), not a registry condition.
- **Inner-container spacing.** Section's Layout group has an inner-container margin and padding. They write to child elements (`> .brxe-container`, `> .brxe-block`, `> .brxe-div`). A section styles its child container from its own panel. This is a pattern worth keeping.
- **Defaults are split.** Most layout controls have no registry default. The element classes set the defaults that matter: heading text "I am a heading" and tag h3; basic text placeholder sentence and tag div; button text "I am a button", style primary and tag span; image tag figure; section tag section; container tag div.
- **Control types.** 38 distinct types across the 77 native elements. The most used: number (1910 controls), text (1118), select (1067), separator (804), info (444), checkbox (376), align-items (251), spacing (244), typography (190), border (161), color (130), repeater (114), justify-content (105), box-shadow (100), transform (100), direction (88), background (87), code (82), filters (77), gradient (76), icon (42), link (15), image (13), dimensions (9). The rest occur once or twice. Full list: `lab/bricks/types.php` output, summarised in the generated reference.
- **Breakpoints.** Bricks keeps a desktop base and overrides per breakpoint (the registry shows four: desktop, tablet portrait, mobile landscape, mobile portrait). Desktop holds the non-CSS settings. Custom breakpoints are supported.

## 4. UI details from the screenshots

- Dark panel. Two tabs as pills. Rows with a label on the left and the field on the right. Style groups as cards with an icon, a title and a chevron.
- Icon-button rows for direction and alignment. Switches for booleans. Uppercase headers (LINK, ICON, SEPARATOR) inside the tab.
- **Lightning** on a field: dynamic data. The text editor's dynamic-data button uses the same icon (`ion-ios-flash`, in `main.min.js`).
- **AI** button on a text field: AI generation for that field. Not checked in source.
- **Yellow dot** at the left of a field: the value is stored on the element (Bricks' `is-changed` state). It shows on the button text and on Style "Primary", which are defaults inserted when the element is created. It does not show on Size "Default", which was never set. So the dot means "stored", not "differs from Bricks' default".
- **Shield icon** on the right of Gap, Column gap, Row gap, Flex grow, Flex shrink, Flex basis, Order, and Aspect ratio. Bricks' variable picker is a `variable-picker-button` in the builder JS, with the tooltip "Variables". The icon name is not confirmed, and the registry flag does not match: Gap shows the shield but has no `hasVariables` flag in the dump. Treat the shield as "variables" until checked in the UI.

## 5. What we take and what we change

Take:
- The same structure: one panel per element, two tabs, style groups as cards.
- Display, flex and grid primitives in the first tab, shown only when they apply.
- Icon-button rows for direction and alignment.
- Dynamic data and variables on any number or text field, once our token system exists.
- Breakpoints and states through the same panel, with desktop as the base.
- The inner-container idea: a section styles its child container from its own panel.
- Bricks' colours and sizes as a starting reference for the default look.

Change:
- **Compact.** Smaller rows and less padding. Groups collapsed by default. Exact sizes to be measured in the UI, not guessed.
- **Modern.** Our own visual style. Bricks is the reference for layout and behaviour, not for looks.
- **Typed where Bricks is free text.** Overflow, pointer events, perspective origin and similar are free text in Bricks. In ours they are selects or typed fields.
- **Our tokens, not named colours.** Bricks gives heading and button a fixed list of nine colour names (primary, secondary, light, dark, muted, info, success, warning, danger). We use our own palette tokens.
- **No separate rich text element.** Text with a formatting toolbar, like the paragraph block.
- **Smaller first set.** Only what the six foundation elements need. The count is decision D3 in the artifact.

## 6. Open questions (check in the live builder before building)

1. Exact meaning of the yellow dot, and which control draws the shield icon. The registry flag does not explain the Gap field.
2. The "b" button in the element id bar, and the four header icons (code, eye, stacked boxes, ribbon).
3. The "Select Animation" row in the Content tab. The registry puts Entry animation in Style > Layout, with 97 presets. The two may be different controls.
4. Where new Section and Container get `display: flex`. It is not in the registry and not in the element classes. The screenshots show it on both.
5. How responsive values are stored on an element, and how the breakpoint switcher writes them.
6. The state UI (hover, focus, and so on) and where its selectors come from.
7. Labels for the select keys. The dump has keys only.

## 7. Next steps (no code yet)

1. Tour the six elements in the Bricks builder with the CDP tools. Open each style group, switch breakpoints, open the variable and dynamic pickers, and close the open questions above. Save screenshots next to these notes.
2. Write our control spec: the control types we need, row height and spacing, which groups start collapsed, and the first control set (the artifact proposes 60 to 80 properties).
3. Build the foundation elements with our own controls, in the order Section, Container, Heading, Text, Image, Button.
