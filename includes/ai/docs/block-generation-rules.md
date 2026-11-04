# Block content rules (snn/create-post, snn/update-post, snn/html-to-blocks)

Send an HTML design, section or page as `content`. The theme converts it to native block editor markup (`convert` is true by default). Block markup can be sent with `convert: false`, and then it is stored as given.

## What becomes which block

| HTML | Block |
| --- | --- |
| `h1`–`h6` | Heading (level from the tag; `h2` is the default) |
| `p`, `div` with text only | Paragraph (class kept) |
| `ul`, `ol`, `li` (nested lists too) | List with List Item blocks |
| `section`, `header`, `footer`, `main`, `article`, `aside`, `div` with blocks inside | Group (the tag is kept through tagName) |
| `a.btn` (text only), buttons in a row | Buttons with Button blocks |
| `img`, `figure` with one `img` and an optional `figcaption` | Image (attachment id when the URL is in the media library) |
| `blockquote` (with `cite`) | Quote |
| `details` / `summary` | Details |
| `table` (no colspan or rowspan) | Table |
| `pre` / `code` | Code |
| `hr` | Separator |

Rich text inside paragraphs, headings and list items: `strong`, `em`, `s`, `sub`, `sup`, `code`, `br`, `a` (href, target, rel) and `span`. An element with a class or inline style becomes a `span` so the class survives.

## What stays as Custom HTML

Everything a core block cannot hold is kept exactly as written, in a Custom HTML block: `svg`, `nav`, `form`, `button`, `input`, `iframe`, `video`, `audio`, `canvas`, anything with a `data-*` or `on*` attribute, empty decorative elements, and a box that holds several inline elements (for example a number and its label). `snn/html-to-blocks` reports how many parts fell back.

## Styles and code

- Inline `style=""` attributes become a generated class (`snn-xxxxxxxx`) and a rule in the page CSS. The block keeps its look and stays valid.
- `<style>` blocks become page CSS. Google Fonts `<link>` tags become a font request (see snn/install-font).
- `<script src>` (https only) becomes a page script file. Inline `<script>` becomes page JavaScript. Both need unfiltered_html.
- Page code is stored per post and printed on that post only: CSS in the head, scripts and JavaScript in the footer.
- Pages that use the `snn-canvas` template get a layout reset (no theme spacing, width or text wrapping) ahead of the page CSS, so a design's own CSS controls the layout. Set `template` to `snn-canvas` for a full-width page with no theme header or footer.

## Writing rules

- Use real URLs; `javascript:` links are dropped.
- Give every image an `alt` (empty for decoration).
- Class names: plain names only (letters, digits, `-` and `_`). Classes WordPress writes itself (`wp-block-*`) are left out.
- The conversion never fails on a design. Read `conversion.html_fallbacks` and `conversion.warnings` after a save.

## Editing an existing post

- `snn/get-post-content` reads the blocks.
- `snn/edit-block-content` and `snn/generate-block-pattern` change one part of a post. Through MCP they save on the server at once.
- `snn/update-post` replaces the whole content, or changes page code with `custom_css`, `custom_js`, `script_urls` and `template`.
