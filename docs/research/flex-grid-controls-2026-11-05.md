# Flex and grid controls: icons, grid settings, presets (5 Nov 2026)

Not committed. Working tree of `d:\WWW\snn-block`, tested on blocks.local.

## What the user asked

1. Flex: the align-items choices had no icons ("flex align items icons doesn't exist").
2. Grid: show the grid settings and their icons, as Bricks does.
3. Easy presets, chosen visually.

## What is built

Layout accordion (open by default), top to bottom:

- **Presets**: ten tiles with a picture and a short name. Five flex (Spread, Center, Stack, Middle, Wrap), five grid (2, 3 and 4 cols, 1 : 2, Auto). A tile sets the whole layout at once; the settings the tile does not name go back to their defaults. The tile that matches the current settings is highlighted.
- **Display**: icons for block, flex and grid (was a select).
- **HTML tag**: unchanged select.
- **Flex**: Direction (four arrow icons), Wrap (switch), Justify (six icons), Align (five icons), Gap, Column gap, Row gap.
- **Grid**: Columns (icons for 1 to 6), Template (free text for a track list such as `1fr 2fr`, lightning), Rows (free text, lightning), Flow (row or column icons), Dense (switch), Justify (six icons), Align (five icons, shared with flex), Justify items (four icons), Align content (seven icons), Gap, Column gap, Row gap.

New accordion **Item** (closed by default), for how the block sits inside its parent. It reads the parent's display and direction in the editor:

- Parent flex: Align self (six icons), Grow, Shrink, Basis (length, with V and lightning).
- Parent grid: Align self, Justify self (four icons), Column span, Row span (1 to 12).
- Any other parent: a hint line says to put the block inside a flex or grid block.

The icons are our own drawings (`includes/blocks/assets/layout-icons.js`). They follow the CSS rule they stand for, and the justify and align pictures turn with the flex direction (row, column, reverse). The justify pictures use two boxes so that centre, space around and space evenly look different.

## Found and fixed while building

- **The editor never laid out flex children.** The layout style sat on the block wrapper, but WordPress puts its own list element between the wrapper and the children. The style now goes on that list element (`useInnerBlocksProps`). This bug was in the earlier flex build too, so the earlier flex preview in the editor was not showing the real layout.
- **WordPress drops `grid-auto-flow` from block inline styles.** Its inline-style filter (`wp-includes/kses.php`, the safe CSS list) does not include the property. The style attribute is now written directly. Every value in it is still checked by our own rules first.
- **A bare number outside 1 to 12 in the column field** would have written invalid CSS. It is now dropped (PHP and editor).

## Output (verified)

Front end (PHP, `includes/blocks/layout-blocks.php`):

- Grid, 4 columns from the preset: `display:grid;grid-template-columns:repeat(4, minmax(0, 1fr));gap:16px`
- Child spanning two columns: `grid-column:span 2`
- Flex, Spread preset: `display:flex;flex-direction:row;flex-wrap:nowrap;justify-content:space-between;align-items:center`
- Child with Align self flex-end: `align-self:end` (grid words are written in place of flex-start and flex-end, as flex-end and end mean the same to a grid)

Editor (headless Chrome on blocks.local):

- Grid container, 3 columns: computed `repeat(3, minmax(0px, 1fr))`, three columns of 317 px, children at x = 0, 341 and 683.
- Flex row, Spread: children at the two ends (`space-between`).
- Parent detection: a grid child shows Align self, Justify self, Column span and Row span; a flex child shows Align self, Grow, Shrink and Basis; a top-level block shows the hint.
- Presets: all ten render; applying one changes the saved settings and the active tile; the front-end markup matches.
- No console errors on the editor page (top window only; the canvas iframe is not covered by that check).

Tests:

- `C:\Users\sinan\.local-server\snn-block-work\tests\layout-blocks-test.php`: 112 of 112 (94 earlier, 18 new: grid columns, templates, rows, flow, dense, justify and align words, gaps, item settings, bad values dropped, clean of the new attributes). The earlier exact flex style string still passes.

## Decisions I took (change them if you want something else)

- A preset sets every layout setting (the ones it does not name reset to default). It does not touch the item settings, the HTML tag, the ID or the classes.
- Preset gaps are fixed pixels (16 and 24 px). Theme spacing variables would need their slugs.
- Column gap and row gap also apply to flex (flex wrap uses the row gap).
- The item settings always stay on the block. They take effect only inside a flex or grid parent.
- Dense is a switch next to Flow, not a fourth flow choice.
- Justify, Align and Align content use the same icon pictures in flex and grid, and the grid versions use start and end.

## Not done

- **Per-view values.** The panel rule (`panel-v2-direction`: every value syncs to Desktop, Tablet and Mobile) is not built for these settings, or for any other block setting yet. All values are base values.
- Grid auto columns and auto rows (Bricks has them).
- Grid item start lines (grid-column start and grid-row start). Only span is in.
- Flex order, and flex wrap as icons (it stays a switch).
- Keyboard and screen-reader checks of the icon rows (they have labels and titles).
- The style tab for these blocks.

## Files

- `includes/blocks/layout-blocks.php`: attributes, style rules, column and template checks, the style write, editor enqueue.
- `includes/blocks/assets/layout-icons.js`: new, the icons.
- `includes/blocks/assets/layout-blocks.js`: the panel (presets, display, flex, grid, item) and the editor style.
- `includes/blocks/assets/controls.js`, `controls.css`: segmented rows take icon elements; preset tiles; hint line.
- Screenshots: `docs/research/flex-grid-screens-2026-11-05/` (grid child with item settings, grid container, flex container, the icon sheet at 56 px, the editor canvas).
- Probes (in tools, outside the repo): `C:\Users\sinan\.local-server\snn-block-work\tools\flexgrid-*.js`.
- Test site: one draft page created by the test run (post 442, "Add title" draft) on blocks.local.

Related: [[block-controls-direction]], [[panel-v2-direction]], [[dynamic-data-and-query-status]].
