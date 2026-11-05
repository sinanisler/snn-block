# Global styles: Bricks study, what we built, what comes next (5 Nov 2026)

Written for: the SNN Block team. Sources: Bricks 2.4.5 read from its source on bricks.local
(`includes/theme-styles.php`, `includes/assets/global-variables.php`, `includes/assets/theme-styles.php`,
`includes/assets.php`, `includes/abilities/design*.php`), and WordPress 7.1.4 on blocks.local.

## 1. How Bricks does it

Bricks has no single "global styles" screen. It has five pieces, each in its own option.

| Piece | Stored in | Holds | Reaches the page as |
|---|---|---|---|
| Global variables | `bricks_global_variables` | Named values (name, value, category) | `:root{--name:value}` in `global-variables.min.css` |
| Colour palette | `bricks_color_palette` | Named colours for pickers, and the named colour variants of Heading and Button | Picker swatches (not CSS) |
| Global classes | `bricks_global_classes` | Reusable style sets with custom CSS; categories, lock, trash, load order | A class on each element, compiled to one CSS file |
| Theme styles | `bricks_theme_styles` | Named style sets with **conditions** (whole site, post type, archive, front page, specific IDs) and **per-element defaults** | `theme-style-<name>.min.css`. The most specific matching style applies (or all, with a setting) |
| Breakpoints | `bricks_breakpoints` | Desktop 1279, tablet 991, mobile landscape 767, mobile 478, custom | Media queries |

Also: global pseudo-classes, fonts and font faces (`bricks_fonts`, `bricks_font_faces`), components (`bricks_components`), and global settings.

**The key idea:** variables are values, the palette is the picker's list, classes are reusable styles, and theme styles are defaults for the whole site or part of it, chosen by conditions. Bricks keeps these apart, and so do we.

## 2. Where the code lives

Everything block-related goes in `includes/blocks/` (the rule the user set on 5 Nov 2026):

- `includes/blocks/blocks.php`: the loader, required from `functions.php`.
- `includes/blocks/editor-settings.php`: class `SNN_Block_Editor_Settings`. The two editor switches, shared with the Block Editor Settings page.
- `includes/blocks/block-defaults.php`: class `SNN_Block_Defaults`. The blocks that take defaults, their fields, the defaults, and the sanitising.
- `includes/blocks/global-styles.php`: class `SNN_Global_Styles`. Values, sanitising, theme.json output, the font routes, the REST routes, the modal's schema, the scripts, and the root font size.
- `includes/blocks/fonts.php`: the Google Fonts helpers (moved from `includes/ai/fonts/font-library.php`).
- `includes/blocks/assets/global-styles.js` and `global-styles.css`: the modal and the editor button.

## 3. What is built

**Values:** one option, `snn_global_styles`, sanitised on every save. They go into the theme layer of theme.json (filter `wp_theme_json_data_theme`), so the front end, the block editor and the Site Editor all read them. The editor switches are stored in `snn_block_editor_settings`, the same option as the Block Editor Settings page.

**Defaults:** black and white only. Black text on white, black links, white text on black buttons. Base size **15px**, set on `body` and on `html`, so the rem-based sizes follow it in the front end and in the canvas. All three editor switches are **on**.

**Modal:** one fixed size, 1040 × 820 px (less on small screens), so every tab has the same height and the modal does not jump. The close button is 48 px. Tabs:

- **Colours:** the palette, up to 12 colours. Each colour is a CSS variable, `--wp--preset--color--{slug}`, and a colour-picker swatch.
- **Typography:** the font library, the font size presets (five), and the heading sizes (H1 to H6).
- **Shape:** radius presets (small, medium, large, pill) and shadow presets (small, medium, large).
- **Global Styles and Block Styles:** in this order.
  1. **Editor:** three switches, all on by default. *Disable core blocks* hides core blocks from the inserter. *Top toolbar* turns on the top toolbar with all blocks and document tools in one place. *Disable full screen mode* keeps the editor out of full screen, so the admin menu stays visible. All three are shared with the Block Editor Settings page, which has the same switches and the same defaults.
  2. **Global Site Styles:** text colour, background colour, font, base size (15px, body and html), line height. Nested cards: **Links** and **Headings, all levels**.
  3. **Block Styles:** our own blocks (Section, Container, Text, Image, Video), each a collapsed card. They are not built yet, so each says so, and the defaults apply once the block exists.
  4. **Core Block Styles:** the core blocks we use (Paragraph, List, Quote, Button, Image, Group). Collapsed as a group, at the bottom.

The Layout tab is gone. Sections and containers are our own blocks, and their widths and gaps are set on their cards.

**Font library:** download a Google Font by family name (for example Inter), with the weights and character sets you pick. The files are saved in WordPress's font directory on this site, as WOFF2, with their unicode ranges. Each font becomes a theme.json font family with its `@font-face` files, so every block's font menu can use it, and the page never asks Google for it. Remove deletes the list entry and its files; block defaults that used it fall back to inherit.

**Routes:** `snn/v1/global-styles` (GET and POST, the values), `snn/v1/global-styles/fonts` (POST, download a font), `snn/v1/global-styles/fonts/{slug}` (DELETE, remove a font). All need `edit_theme_options`.

**Editing entry points:**
- Block editor, top right: a palette button in the pinned items area, left of Settings.
- Site Editor canvas (templates, parts): the same button.
- wp-admin pages, including the Site Editor home and Styles screens, which have no header: an admin-bar item, "Global styles".

**Root font size:** the front end prints `html{font-size:…}` from the base size. The block editor's canvas is an iframe with its own `html` element, so the editor sets the same rule inside the canvas.

**Sanitising:** colours must be hex. Lengths need a unit (a bad length falls back to its default). A line height typed with a comma is read as a dot. Font stacks and shadows are restricted to safe characters. A font file must sit under the font directory, and the font list changes only through the font routes, so a palette save cannot add a font. An unknown choice falls back to its default when that is valid, or to inherit.

## 4. Feature list (what we may need next)

**P1, built:** palette, font library (Google Fonts, offline), font size and heading sizes, radius and shadow presets, the editor switches, the block defaults for the whole site, the links and headings, our planned blocks and the core blocks in use, the modal, the entry points and the sanitising.

**P2, next:**
- Our own blocks (Section, Container, Text, Image, Video) built on these defaults, with their own controls. Section and Container take the widths and gaps that the Layout tab used to hold.
- Global classes: named style sets applied to any block (Bricks's model).
- Custom variables for values that are not presets (`settings.custom`): transitions, z-index scale.
- Breakpoints (D18: tablet 991 px, mobile 478 px), also in theme.json `settings.viewport`, so the canvas agrees.
- Live canvas update without a reload (scoped CSS, as core scopes it; see `block-editor-learnings`).
- Custom CSS, site-wide and per block, with the `root` keyword (D24) and the permission rule (D25).
- Fonts: upload a font file (WOFF2, OTF) as well as Google Fonts, and italic faces.
- Import and export of the JSON, and point the MCP abilities `snn/get-global-styles` and `snn/update-global-styles` at this store (they still write the user layer, see section 6).

**P3, later:**
- Theme style conditions: a different set per post type, archive or page (Bricks's conditions).
- Dark palette, and `prefers-color-scheme`.
- Hover and focus states for buttons and links.

## 5. Tests and results (blocks.local, 5 Nov 2026)

- `global-styles-test.php` (harness): 87 of 87. Covers defaults (black and white, 15px, both switches on), sanitising, the font save rules, the tab and section structure, theme.json output, the editor switches and their effect on the allowed blocks, the root size on the front end, REST access, a save that reaches the front end, and a real Google Fonts install, use and removal.
- `functional.php`: 56 of 56.
- `smoke-http.ps1`: 0 of 58 URLs with PHP errors (this includes the Block Editor Settings page).
- Browser (headless Chrome 156), in the post editor:
  - The modal is 1040 × 820 on every tab. The close button is 48 × 48. The tabs are Colours, Typography, Shape and Global Styles and Block Styles.
  - The Blocks tab has four sections in the right order. The core group is collapsed and sits at the bottom. Both switches are checked.
  - Toggling *Disable core blocks* off and on, with a save after each, stores the right value each time (the last one, on, is `"1"`).
  - The canvas `html` computes to 15px. The front end's `html` and `body` both compute to 15px.
  - The allowed blocks in the editor, with the switch on: `snn-lab/card` and `snn-lab/toggle` only (the two lab blocks on this test site; no core block).
  - The top toolbar preference is on.
  - Install and use of Inter, from the earlier round, still hold.

**Bugs found and fixed in this round:**
- **Edits after a save were lost.** Each field kept the draft it was drawn with, and a save replaced it. Fields now read the current draft, and a successful save redraws the tab. This affected any edit made after a save, in every tab.
- **A base size without a unit** fell back to inherit. It now falls back to its default, like every other field.
- **Line height typed with a comma** was dropped to inherit. It is read as a dot, in the modal and on the server.

**Not tested:** Cancel with unsaved changes (the confirm dialog blocks headless Chrome), keyboard-only use, screen readers, other browsers, multisite, and the Reset button in the UI. The editor's top toolbar is checked as a preference value, not by eye.

## 6. Risks and decisions to confirm

- **Disable core blocks is on by default, so the inserter offers no core blocks.** Until our own blocks exist, a post cannot get a paragraph or a heading from the inserter. Existing content still shows and edits. Turn the switch off to get core blocks back.
- **The two editor switches are shared with the Block Editor Settings page.** The page's per-block list ("Disable Individual Blocks", renamed from "Disable Core Blocks") still works on top of the switch.
- **Layout is gone from the modal.** Content width, wide width and the gap between blocks no longer exist as global values. The canvas and the front end have no content width until our Section and Container blocks set one. Core's constrained layouts are full width in the meantime.
- **User layer overrides the theme layer.** Core's Styles panel, the font library and the MCP abilities write the `wp_global_styles` post, which sits above our layer. A value set there wins. Palette lists are replaced, not merged, so a user-layer palette hides ours. Decide: keep the user layer as an override, or point everything at this store (P2).
- **The MCP `install-font` ability** still writes the Font Library records and the user layer. Our Font library writes only our option. Two font paths exist until they are unified (P2).
- **Editors need a reload after a save or a font change** before the canvas, the colour pickers, the font menus and the switches take effect. The modal says so and offers a reload (it asks first if the post has unsaved changes).
- **Always on** for the global styles and the editor switches, not a settings toggle. The Block Editor Settings feature toggle still controls the rest of that page.
- **Admin only.** The modal needs `edit_theme_options`. Editors do not see the button. The admin-bar item is on wp-admin pages only.
- **The colour input is the browser's own** (D17 is still open).
- **Stored values from earlier versions** are not migrated. Only the test site held them, and the tests now start from the defaults.

## 7. Screenshots

In `docs/research/global-styles-screens/`:
- `1-editor-top-right-button.jpg`: the button in the post editor.
- `2-modal-colours.jpg`: the Colours tab.
- `3-modal-typography-fonts.jpg`: the Typography tab, with Inter downloaded.
- `4-modal-blocks-top.jpg`: the Global Styles and Block Styles tab: Editor switches and Global Site Styles.
- `4b-modal-blocks-core-collapsed.jpg`: the same tab, scrolled to the collapsed Core Block Styles group.
- `5-site-editor-canvas-button.jpg`: the button in the Site Editor canvas.
- `6-site-editor-home-admin-bar.jpg`: the modal from the admin bar on the Site Editor home.
