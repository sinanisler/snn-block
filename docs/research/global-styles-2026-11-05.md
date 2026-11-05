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
| Theme styles | `bricks_theme_styles` | Named style sets with **conditions** (whole site, post type, archive, front page, specific IDs) and **per-element defaults** (general, colours, links, typography, content margin, contextual spacing, popup, each element type, custom CSS) | `theme-style-<name>.min.css`. The most specific matching style applies (or all, with a setting) |
| Breakpoints | `bricks_breakpoints` | Desktop 1279, tablet 991, mobile landscape 767, mobile 478, custom | Media queries |

Also: global pseudo-classes, fonts and font faces (`bricks_fonts`, `bricks_font_faces`), components (`bricks_components`), and global settings.

**The key idea:** variables are values, the palette is the picker's list, classes are reusable styles, and theme styles are defaults for the whole site or part of it, chosen by conditions. Bricks keeps these apart, and so do we.

## 2. Where the code lives

Everything block-related goes in `includes/blocks/` (the rule the user set on 5 Nov 2026):

- `includes/blocks/blocks.php`: the loader, required from `functions.php`.
- `includes/blocks/global-styles.php`: class `SNN_Global_Styles`. Values, sanitising, theme.json output, the font routes, the REST routes, the modal's schema, and the scripts.
- `includes/blocks/block-defaults.php`: class `SNN_Block_Defaults`. The blocks that take defaults, their fields, the defaults, and the sanitising.
- `includes/blocks/fonts.php`: the Google Fonts helpers (moved from `includes/ai/fonts/font-library.php`, so they load without the AI features).
- `includes/blocks/assets/global-styles.js` and `global-styles.css`: the modal and the editor button.

## 3. What is built

**Values**, one option `snn_global_styles`, sanitised on every save. They go into the theme layer of theme.json (filter `wp_theme_json_data_theme`), so the front end, the block editor and the Site Editor all read them.

**Defaults:** only black and white. The palette is `black` (#000000) and `white` (#ffffff). Black text on white, black links, white text on black buttons. Everything else starts as inherit.

**Colours tab:** the palette, up to 12 colours. Each colour is a CSS variable, `--wp--preset--color--{slug}`, and a colour-picker swatch.

**Typography tab:**
- **Font library:** download a Google Font by family name (for example Inter), with the weights (300 to 900) and character sets (latin, latin-ext, cyrillic, and so on) you pick. The files are saved in WordPress's font directory on this site, as WOFF2, with their unicode ranges. Each font becomes a theme.json font family with its `@font-face` files, so every block's font menu can use it. The page never asks Google for the font, so it works offline. Remove deletes the list entry and its files; block defaults that used it fall back to inherit.
- Font size presets (five) and heading sizes (H1 to H6).

**Layout tab:** content width, wide width, gap between blocks.

**Shape tab:** radius presets (small, medium, large, pill) and shadow presets (small, medium, large).

**Blocks tab:** one collapsible card per block. Each card shows only the fields that block supports, and each field is a default: text colour, background colour, font, size, weight, line height, corner radius, shadow, padding, gap, maximum width. The cards:
- Whole site, Links, Headings (all levels): the element defaults.
- Paragraph, List, Quote, Button, Image, Group: the core blocks we use.
- Section, Container, Text, Image, Video (our own, marked "Not built yet"): their defaults are in place, and apply as soon as the blocks exist.

Each block's own settings still override its default, as usual. Core's block controls stay as they are.

**Editing:** one modal with five tabs. Entry points:
- Block editor, top right: a palette button in the pinned items area, left of Settings.
- Site Editor canvas (templates, parts): the same button.
- wp-admin pages, including the Site Editor home and Styles screens, which have no header: an admin-bar item, "Global styles".

**Routes:** `snn/v1/global-styles` (GET and POST, the values), `snn/v1/global-styles/fonts` (POST, download a font), `snn/v1/global-styles/fonts/{slug}` (DELETE, remove a font). All need `edit_theme_options`.

**Sanitising:** colours must be hex. Lengths need a unit. Font stacks and shadows are restricted to safe characters. A font file must sit under the font directory, and the font list can only change through the font routes, so a palette save cannot add a font. An unknown choice falls back to its default when that is valid, or to inherit.

## 4. Feature list (what we may need next)

**P1, built:** palette, font library (Google Fonts, offline), font size and heading sizes, widths and gap, radius and shadow presets, block defaults for the whole site, the links and headings, and the core blocks in use, plus the modal, the entry points and the sanitising.

**P2, next:**
- Global classes: named style sets applied to any block (Bricks's model).
- Custom variables for values that are not presets (`settings.custom`): transitions, z-index scale.
- Breakpoints (D18: tablet 991 px, mobile 478 px), also in theme.json `settings.viewport`, so the canvas agrees.
- Live canvas update without a reload (scoped CSS, as core scopes it; see `block-editor-learnings`).
- Custom CSS, site-wide and per block, with the `root` keyword (D24) and the permission rule (D25).
- Our own blocks (Section, Container, Text, Image, Video) built on the defaults above, with their own controls.
- Fonts: upload a font file (WOFF2, OFF) as well as Google Fonts, and italic faces.
- Import and export of the JSON, and point the MCP abilities `snn/get-global-styles` and `snn/update-global-styles` at this store (they still write the user layer, see section 6).

**P3, later:**
- Theme style conditions: a different set per post type, archive or page (Bricks's conditions).
- Dark palette, and `prefers-color-scheme`.
- Hover and focus states for buttons and links.

## 5. Tests and results (blocks.local, 5 Nov 2026)

- `global-styles-test.php` (harness): 66 of 66. Defaults (black and white), sanitising, the font save rules, the schema and the defaults, the theme.json output, the save reaching the front end and the editor palette, REST access, and a real Google Fonts install (WOFF2 on this site, `@font-face` in theme.json and on the front end), a block using it, the removal (files deleted, the block falls back), and the restore.
- `functional.php`: 56 of 56.
- `smoke-http.ps1`: 0 of 58 URLs with PHP errors.
- Browser (headless Chrome 156), post editor:
  - The button sits at the top right (x 1239, Settings at 1283). Site Editor canvas: x 1215, Settings at 1259. The Site Editor home opens the modal from the admin bar.
  - Install from the modal: Inter 400 and 700 downloaded, listed, and in the Paragraph font menu after a reload. Remove from the modal: list empty again.
  - Front end, with Inter as the Paragraph default: computed family `Inter, sans-serif`, the Inter WOFF2 loaded from this site, zero requests to Google.
  - Save, reload: the editor's palette and canvas show the new colour.
  - Validation: an unitless size is refused with a message.
- A Google Fonts answer with no faces for a moment caused one failed click in the browser. The install now retries once after a second. The same request then succeeded.

**Not tested:** Cancel with unsaved changes (the confirm dialog blocks headless Chrome), keyboard-only use, screen readers, other browsers, multisite, and the reset button in the UI. `document.fonts.check('16px Inter')` returned false on the front end, although the font file loaded and the family computes; the glyphs look like Inter in the screenshot, but the font-load event was not checked.

## 6. Risks and decisions to confirm

- **User layer overrides the theme layer.** Core's Styles panel, the font library and the MCP abilities write the `wp_global_styles` post, which sits above our layer. A value set there wins. Palette lists are replaced, not merged, so a user-layer palette hides ours. Decide: keep the user layer as an override, or point everything at this store (P2).
- **The MCP `install-font` ability** still writes the Font Library records and the user layer. Our Font library writes only our option. Two font paths exist until they are unified (P2).
- **Editors need a reload after a save or a font change** before the canvas, the colour pickers and the font menus show the new values. The modal says so and offers a reload (it asks first if the post has unsaved changes).
- **Always on**, like the clean slate, not a settings toggle.
- **Admin only.** The modal needs `edit_theme_options`. Editors do not see the button. The admin-bar item is on wp-admin pages only, not on the front end.
- **The colour input is the browser's own** (D17 is still open).
- **Stored values from the first version** of this work (five colours, old block keys) are not migrated. Only the test site held them, and the tests now start from the defaults.

## 7. Screenshots

In `docs/research/global-styles-screens/`:
- `1-editor-top-right-button.jpg`: the button in the post editor.
- `2-modal-colours.jpg`: the Colours tab.
- `3-modal-typography-fonts.jpg`: the Typography tab, with Inter downloaded.
- `4-modal-blocks-button.jpg`: the Blocks tab, Button card.
- `4b-modal-blocks-paragraph.jpg`: the Blocks tab, Paragraph card, with Inter in its font menu.
- `5-site-editor-canvas-button.jpg`: the button in the Site Editor canvas.
- `6-site-editor-home-admin-bar.jpg`: the modal from the admin bar on the Site Editor home.
