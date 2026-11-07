# Page styles and the global styles tabs: Bricks study, what we built (7 Nov 2026)

Written for: the SNN Block team.

Sources: Bricks 2.4.5 on bricks.local, read from its source:
`includes/settings/settings-page.php` (page settings), `includes/theme-styles/controls/*.php` (the
theme style controls that page settings reuse), `includes/assets.php` (`generate_inline_css_page_settings`)
and `includes/ajax.php` (the page settings are saved as post meta, `BRICKS_DB_PAGE_SETTINGS`).

## 1. What Bricks has

**Global (theme styles).** One theme style with conditions, stored in `bricks_theme_styles`. Its controls
are grouped by file: Colors (`colors.php`), Typography (`typography.php`), Layout (`general.php`: site
layout, site background, element margin, root container margin, padding and width, lightbox), Content
(`content.php`: content background, box shadow, content margin), Links (`links.php`), and one file per element.

**Page settings (per page).** Group General: CSS classes (body), Disable header, Disable footer, Disable
lazy load, Disable popups, Page layout, Page background, Content margin. The layout and background controls
are the theme style's own controls (Site layout and Site background), relabelled for the page. The other
groups: Scroll snap, SEO (title, description, keywords, robots), Social media, One-page navigation, Custom CSS,
Custom scripts (header, body header, body footer).

## 2. What we built

The modal (Global styles button) has these tabs, in this order:

1. **Global styles**: the editor switches, the global site styles (text colour, background colour, font,
   base size, line height), links and headings. Commit d006439 split these out of one tab.
2. **Page styles**: the page's background colour, text colour, font, base size, line height, and the CSS
   classes of the body (the Bricks name). An empty field inherits the global styles. Only in the block editor.
3. **Block styles**: our blocks (Section, Container, Text) and the core block styles (collapsed).
4. **Colours**, **Sizes**, **Typography** (unchanged).

**Shape is removed**: the tab, the shadow presets in theme.json, and the Corner radius and Shadow block
defaults. The planned Image and Video cards went with them (they held only those two fields).

**Storage and output.** One post meta value, `_snn_page_styles`, holds the fields that are set. It is
sanitised against the global palette and font list on every read and write.
- Front end: `<style id="snn-page-styles">` in the head of a single page. The body gets the rules; the base
  size also goes on `html`, as the global base size does. The CSS classes are added to the body.
- Block editor: the same declarations as a canvas style, `:root body.editor-styles-wrapper{...}`.
- REST: `snn/v1/page-styles/{id}`, GET and POST, with `edit_post` for that post.
- Code: `includes/blocks/page-styles.php` (class `SNN_Page_Styles`); `global-styles.php` (tabs, route URL,
  strings); `block-defaults.php` (`clean_value()` is public now, so the page fields reuse the same rules).

## 3. What we did not take from Bricks (yet)

- Header, footer and popup switches: a page has no header or footer in our theme (the minimal template).
- Page layout and content margin: the Section and Container blocks own their widths. No page-wide width yet.
- SEO, social sharing, scroll snap, one-page navigation, custom scripts: not part of the styles work.
- Page-level custom CSS: block CSS exists (the CSS icon of the Style tab). A page-wide CSS box is for the user to decide.

## 4. Checks

- `page-styles-test.php` 38 of 38: sanitising, save and read, declarations, the tab's fields, the canvas
  style, REST for an editor (200) and a visitor (401), the front end over HTTP (head style and body class),
  clean-up.
- `global-styles-test.php` 108 of 108 (tab checks updated, Shape checks replaced).
- `functional.php` 56 of 56. Smoke: 0 of 58 problems.
- Browser, blocks.local, draft T03 (page 1285): the tab order is Global styles, Page styles, Block styles,
  Colours, Sizes, Typography. Saved values: the canvas body is black with white text at 20px after a reload,
  and the preview (`?page_id=1285&preview=true`) has the style element, the body class, and 20px on html
  and body. On a wp-admin screen (no page) the Page styles tab shows the note and no fields.

## 5. Known limits

- The canvas shows the page's colours, font and size on its body. Rem-based sizes follow the global base
  size in the canvas, not the page size; on the front end the page size also sets `html`, so they follow it.
- The canvas picks up a saved change after a reload, as the global styles do.
- Headings keep their own font and colour rules, so a page's font changes body text only.
- Page styles are not in the MCP abilities yet, and there are no Tablet or Mobile values.
- Draft previews need `?page_id=N&preview=true`. `?p=N&preview=true` gives a 404 for a draft on this site.
