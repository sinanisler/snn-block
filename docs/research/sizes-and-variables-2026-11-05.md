# Size and colour variables, fluid sizes, and the variable picker (5 Nov 2026, late)

Not committed. Working tree of `d:\WWW\snn-block`, tested on blocks.local.

## What the user asked

1. The V picker should show the right kind first: colour fields show colour variables, size fields show size variables. The other kind stays in a closed section at the bottom, still clickable.
2. Size variables should work everywhere a size is used (padding, margins, gaps, widths, heights, font sizes), not only font sizes.
3. Sizes need a fluid option: a min and a max, between two viewport widths, written as a clamp. Compact, as a simple form.
4. Default names: size-10 and up, not XS to XL or small to xx-large. The user asked why the old names were chosen.
5. Flex wrap as a dropdown, default `nowrap`.
6. The query loop switch and the Query settings move under Layout.
7. Colour defaults stay black and white.

## Why the old names

The spacing names (XS to XL) and font names (small to xx-large) were the first defaults written, not a considered choice. They do not scale: after XXL there is no next name, and a name like "medium" does not say where a step sits in the order. Numbered names leave room (a size-15 can go between size-10 and size-20) and sort themselves.

## What is built

**Size names and values** (`includes/blocks/global-styles.php`, defaults and `spacing_sizes()` replaced):

- Spacing sizes: `size-10` 0.5rem, `size-20` 1rem, `size-30` 1.5rem, `size-40` 2.5rem, `size-50` 4rem. Editable now, in a new **Sizes** tab: rename (the name is the variable name), add (the next `size-N`), remove, up to 12.
- Font size presets: `size-10` 0.875rem, `size-20` 1.125rem, `size-30` 1.375rem, `size-40` 1.75rem, `size-50` 2.25rem. Still five fixed steps, in the Typography tab.
- Heading sizes (h1 to h6): unchanged names, now with the Fluid switch too.

**Fluid sizes**: a switch on each size. On: four fields (min size, max size, min viewport, max viewport, all in px) and the clamp it makes. Example, 16 px at 380 px to 24 px at 1400 px:

`clamp(16px, calc(13.02px + 0.78vw), 24px)`

- The server computes the value from the four numbers (`fluid_css()`), and stores the numbers under a `fluid` map keyed by path. A stored clamp is read back through the numbers, so the two cannot disagree.
- The editor computes the same string (`fluidCss()` in `global-styles.js`), so the preview and the saved value match.
- A falling size uses a minus sign. A zero intercept is written as `0`, never `-0`.
- Off again: the size becomes its minimum as a plain length.

**Theme output**: the names in theme.json are the variable names (`size-10`), not title-cased labels. Variables: `--wp--preset--spacing--size-20`, `--wp--preset--font-size--size-20`.

**Picker** (`includes/blocks/layout-blocks.php` `variables()`, `assets/controls.js` `VariablePicker`):

- Three groups: Colours (palette), Spacing sizes, Font sizes. Each has a kind (`color` or `size`) and a prefix.
- A colour field (Background) lists colours first and "Sizes" closed at the bottom. A size field (gap, column gap, row gap, flex basis) lists the size groups first and "Colours" closed at the bottom. Both are clickable, so an exact name can still be found.
- Colour items show a swatch.

**Layout panel** (`assets/layout-blocks.js`):

- Order now: Layout, Query loop switch, Query, Item, Style, Advanced.
- Wrap is a dropdown: No wrap (default), Wrap, Wrap reverse.
- New Style accordion with a Background colour field (hex, rgb, hsl, a theme colour variable, or transparent). Written as `background-color`.

## Verified

- PHP tests: global styles 103 of 103 (new: fluid maths, the output in theme.json after a save, invalid input dropped, the 12-size limit, the Sizes tab); layout blocks 122 of 122 (new: colour and size groups, the colour check, the background style, the wrap default); functional 56 of 56.
- Browser on blocks.local:
  - Panel order (Layout, Query loop, Query, Item, Style, Advanced); the wrap dropdown with nowrap.
  - The Gap picker: "Spacing sizes" and "Font sizes" open; "Colours" closed at the bottom with two swatches.
  - The Background picker: "Colours" open with black and white; "Sizes" closed at the bottom with ten items.
  - Modal, Sizes tab: five rows; size-20 Fluid on gives `clamp(16px, calc(13.02px + 0.78vw), 24px)` in the editor, the same string the server produces.
  - Save from the modal: stored, read back through the REST route, and the home page stylesheet has `--wp--preset--spacing--size-20: clamp(16px, calc(13.02px + 0.78vw), 24px)`.
  - Modal, Typography tab: every font size and heading has the Fluid switch.
  - No console errors on the editor page.
- Afterwards the test suites restored the defaults on blocks.local (the global styles test ends by saving the defaults).

## Not done

- Font size presets are still five fixed steps. There is no add or remove for them yet.
- The clamp is in px. It does not use the root font size, so it does not scale with a user's font settings. Converting to rem would need the root size (the base size is 15 px on this site).
- Per-view values (Desktop, Tablet, Mobile) for sizes, as for everything else (see `panel-v2-direction`).
- The Background field has no swatch preview beside the text field.
- Spacing and font sizes use the same names but different values, as in WordPress presets. Whether they should be one list is open.
- Keyboard and screen reader checks of the picker's closed section and the size rows.

## Files

- `includes/blocks/global-styles.php`: defaults, sanitiser (fluid first, then sizes), `fluid_css()`, theme output, schema (Sizes tab, size fields), strings.
- `includes/blocks/assets/global-styles.js`, `global-styles.css`: size rows, fluid fields, rename, add and remove, validation.
- `includes/blocks/layout-blocks.php`: variable groups with kinds, the colour check, `backgroundColor`, wrap unchanged.
- `includes/blocks/assets/layout-blocks.js`: panel order, the wrap dropdown, the Style accordion, the kinds on the value fields.
- `includes/blocks/assets/controls.js`, `controls.css`: the picker's kind handling, the closed section, swatches.
- Tests (outside the repo): `global-styles-test.php`, `layout-blocks-test.php`, `functional.php`.
- Screenshots: `docs/research/sizes-screens-2026-11-05/` (the picker, the modal's Sizes tab, Typography).

Related: [[global-styles-status]], [[block-controls-direction]], [[flex-grid-controls-status]].
