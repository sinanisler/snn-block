# Dynamic data, variables and the query loop (5 Nov 2026)

Status: built on blocks.local, in the working tree, not committed. Nothing is pushed.

## The questions

1. **Are dynamic tags and variables exposed on every control that takes a value?**
   Not planned as a rule. The research page listed "dynamic data and variables on fields" under
   "What we take" from Bricks, but no control spec said which fields get them, and nothing was
   built. Now it is a rule (below) and it is built for every value field that exists so far.
2. **Implement every Bricks dynamic tag that can work on our first implementation.** Done for the
   WordPress core tags: 61 tags (list below). Plugin tags and two Bricks tags that run code are left out.
3. **Query loop on Section, Container and Div**, with a new empty Div (display block by default),
   the query in a compact accordion that is disabled while its switch is off, and switches instead of
   checkboxes. Done. The popup is gone.

## How Bricks does it (source, bricks.local 2.4.5)

Read from `includes/integrations/dynamic-data/`: `providers/provider-wp.php` (the tags, lines 34 to 350),
`dynamic-data-parser.php` (the syntax), `providers/base.php` (the arguments). Bricks's live builder was
not toured: `bricks.local` does not resolve on the hosts file (it answers with the Host header only),
so the UI findings come from your screenshots and the source.

- **Syntax:** `{tag}`, arguments after a colon `{post_excerpt:20}`, `{post_date:F j, Y}`, modifiers
  before the brace: `@fallback:'text'`, `@sanitize:false`, `@start-at:1`, `@pad:2`, `@from`, `@to`.
- **Groups:** post, author, site, archive, terms, date, query, queryFilters, misc, userProfile, customFields, advanced.
- **Fields:** the lightning button opens the dynamic data list on text, link, image URL and number fields
  (your screenshots: "Child of", and the lightning on the Query row).
- **Yellow dot:** the value is stored on the element (it is set, not the default). We use a blue dot.

## What is built

| Area | What | Where |
|---|---|---|
| Dynamic tags | 61 tags, Bricks names, parser with arguments and modifiers, one renderer with plain, html and url modes | `includes/blocks/dynamic-data.php` |
| Query | Post type, order by, order, per page, offset, child of, ignore sticky, include, exclude, authors, main query. Dynamic tags in the number and ID fields | `includes/blocks/query-loop.php` |
| Blocks | Section (`section`), Container (`div`, with the Blocks tab defaults), Div (`div`, empty, display block) | `includes/blocks/layout-blocks.php`, `assets/layout-blocks.js` |
| Controls | Switch, accordion (disabled when its switch is off), compact label-left rows, icon-button row, selects, text fields with the lightning and the V (variables) buttons, live preview | `assets/controls.js`, `assets/controls.css` |
| Theme | Spacing scale XS to XL as theme presets (for the Gap variables) | `includes/blocks/global-styles.php` (`spacing_sizes()`) |

### The 61 tags

- **Post (14):** post_title (`:link`), post_id, post_url, post_slug, post_type, post_date, post_modified,
  post_time, post_comments_count, post_comments, post_content, post_excerpt (`:words`), read_more, featured_image (`:size`)
- **Author (8):** author_id, author_name, author_bio, author_email, author_website, author_archive_url,
  author_avatar (`:size`), author_meta (`:key`)
- **Site (6):** site_title, site_tagline, site_url, site_login, site_logout, url_parameter (`:name`)
- **Archive (2):** archive_title, archive_description
- **Terms (10):** term_id, term_name, term_taxonomy_slug, term_slug, term_count, term_url, term_parent,
  term_children, term_description, term_meta (`:key`)
- **Date (3):** current_date (UTC), current_wp_date, format_date (`:date` with `@from` and `@to`)
- **Query loop (2):** query_loop_index (`@start-at`, `@pad`), query_results_count
- **Logged-in user (14):** wp_user_id, wp_user_login, wp_user_email, wp_user_url, wp_user_role,
  wp_user_registered_date, wp_user_nicename, wp_user_nickname, wp_user_description, wp_user_first_name,
  wp_user_last_name, wp_user_display_name, wp_user_picture (`:size`), wp_user_meta (`:key`)
- **Custom fields (any key):** `cf_` plus the field name, for example `{cf_price}`
- **Misc (1):** search_term

**Not built, on purpose or for later:**
- `Output PHP function` and `do_action`: they run code. Left out. Bricks gates them to whitelisted functions; we would need the same gate before adding them.
- Query API, Query Array, and the query filter tags (results count (filter), active filters, search term (filter)): they belong to Bricks's own query filters and API features, which we have not built.
- `featured_image_tag`: deprecated in Bricks.
- Plugin providers (ACF, WooCommerce, Meta Box, CMB2, Pods, Toolset, JetEngine, Polylang, WPML, Yoast, Rank Math). They need the plugin, so they come as separate providers.
- Bricks argument keys `@sanitize`, `@exclude`, `@key`, `@is-array`, `@date`, and the `image`, `tel`, `newTab` and `url` arguments. Only the ones listed above are in.

## The rule for dynamic tags and variables (decided, and built where the fields exist)

- **Every field that takes free text, a number, an ID or a URL gets the lightning** (dynamic data).
  Examples now: per page, offset, child of, include, exclude, author lists, CSS ID, CSS classes.
- **Every size, colour, font, radius or shadow field gets the V** (variables: the theme's presets).
  Now: Gap. Next: colours, sizes and radii as the block controls arrive.
- **Choices with fixed options** (select, switch, icon row) get neither. Their values are already exact.
- **A field can mix both**, because the value is a string. `{cf_gap}px` and `var(--wp--preset--spacing--m)` are both valid.
- **Storage:** the string as typed, tags and variables included. It is resolved at render time (PHP), and
  then checked against the field's own rule. A gap of `url(...)` is dropped, a gap of `{cf_gap}px`
  is kept after it resolves to a length.
- **Editor preview:** a tag shows its resolved value under the field (`→ value`), from
  `POST snn/v1/dynamic-data/preview` with the current post. The Site Editor has no post, so tags
  that need one show nothing there.
- **Variables today:** the spacing scale (XS 0.5rem, S 1rem, M 1.5rem, L 2.5rem, XL 4rem). The list reads the
  theme, so palette, font size and shadow presets appear as soon as a field offers them.
- **Open:** whether variables should be the theme presets only, or also our own named variables (Bricks
  has global variables). Decide with the spacing tokens (D3).

## Decisions taken (mine, to confirm)

- **D34. Tag names follow Bricks** (`post_title`, `author_name`, `cf_`), so the names are familiar.
- **D35. The query has one type for now: posts.** Terms and Users follow.
- **D36. No query editor (PHP)** in the query. It runs code.
- **D37. Main query** is in, and the query merge (Bricks's "Disable query merge") is not: merging only matters on archives, and it needs a design of its own.
- **D38. Layout values are inline styles** for now. Per-view values (Desktop, Tablet, Mobile) come with the panel sync, so they will move to classes then.
- **D39. Core's panels are off** on our three blocks (colour, spacing, dimensions, typography, layout, border, background, shadow, position). Our inspector is the only one, except the old lab plugin's prototype panel on blocks.local (see "The lab plugin" below).
- **D40. A loop repeats the element and its children for each post** (Bricks's behaviour). The editor shows one copy with a badge: `Query loop · Post · 3`.
- **D41. A value that is not valid is dropped, not shown.** A gap that is not a length or a spacing variable writes nothing.

## The panel: how it looks now and how it will look

- The editor panel is the reference. Its look is in `includes/blocks/assets/controls.css`; the label column is 100 px (it was 92 px, which clipped "Padding bottom").
- The mock of the future panel is `docs/research/controls-screens-2026-11-05/lab/panel-v3.html`, with `controls.css` beside it. It shows the built parts and the planned ones (per-view values, the Style tab, Effects, the style cards, custom CSS), marked "planned". Eight states are in `docs/research/controls-screens-2026-11-05/lab/panel-v3-*.png`. The artifact shows them in its Panel v2 section (Version 18).

## Tests

| Suite | Result |
|---|---|
| `layout-blocks-test.php` (new): tags, query, gap, variables, registration, front-end markup, loops, nested loops | **94 of 94** |
| `global-styles-test.php` | 87 of 87 (one check updated: Section and Container are built, Text is still planned) |
| `functional.php` | 56 of 56 (one check updated: the only spacing presets are ours, XS to XL) |
| `smoke-http.ps1` (58 URLs) | 0 problems |
| Debug log after the runs | no new warnings from the new files |
| Editor, in the browser (`blocks.local`) | the panel, switch, query accordion (open, and disabled on the Container), the tag preview, the tag picker (61 tags, 10 groups), the variables list, the loop badge |
| Save round trip, in the browser | changed Per page to 2, saved, 0 invalid blocks, the front end shows 2 loop items |

### Bugs found and fixed during the tests

- **The editor's save dropped the children** of Section, Container and Div (the save returned `null`). Fixed: the
  save returns `InnerBlocks.Content`. Found by the round trip, not by the validity check (a self-closing block is valid).
- **A child block in a loop lost the loop's index.** WordPress passes a block only the context keys it declares.
  Fixed: `uses_context` on the three blocks, and the loop passes `snn/postId`, `snn/queryIndex` and `snn/queryCount`.
  The first test missed it because the query sat on the block itself. A nested test now covers it.
- **Exclude did nothing when include was set.** WordPress ignores `post__not_in` when `post__in` is set. Fixed: excluded IDs are removed from the include list, and an empty include matches nothing.
- **Plain text showed `&hellip;`** from the excerpt. Fixed: text values are decoded once, then escaped once.
- **The generated `wp-block-snn-*` class was missing** because `className` support is off. Fixed: the class is added by the block itself, in PHP and in the editor. The theme's block defaults depend on it.
- **The editor's badge said "undefined"** when a saved query lacked a key. WordPress does not merge defaults into object attributes. Fixed: the editor merges the defaults, as PHP does.
- **Core's Dimensions panel showed** under our controls. Fixed: core panels are off on the three blocks.

## Screenshots (blocks.local, 5 Nov 2026, final build)

- [1-section-panel.jpg](layout-blocks-screens-2026-11-05/1-section-panel.jpg): the Section's inspector, the Query switch on, the Query accordion closed
- [2-query-open.jpg](layout-blocks-screens-2026-11-05/2-query-open.jpg): the Query accordion open (post type, order, per page with the lightning, child of, include, exclude, authors, main query)
- [3-container-query-disabled.jpg](layout-blocks-screens-2026-11-05/3-container-query-disabled.jpg): the Container with its query switch off: the Query accordion is greyed and cannot open
- [4-dynamic-preview.jpg](layout-blocks-screens-2026-11-05/4-dynamic-preview.jpg): a CSS class with tags and the live preview under it
- [5-dynamic-picker.jpg](layout-blocks-screens-2026-11-05/5-dynamic-picker.jpg): the dynamic data list, grouped, with the tag and its hint
- [6-variables.jpg](layout-blocks-screens-2026-11-05/6-variables.jpg): Display Flex, the direction icons, the wrap switch, and the Gap variables (XS to XL)

Test harness, outside the repo: `C:\Users\sinan\.local-server\snn-block-work\tests\layout-blocks-test.php` and
`layout-blocks-demo.php` (demo posts and the page at `http://blocks.local/snn-layout-demo/`). The browser
probes are in the scratchpad (`lb/`). Their steps are `snn-block-work/tools/`-compatible.

## Not verified

- Bricks's live builder (`bricks.local` needs a hosts entry, which is not added).
- Keyboard-only use and screen readers on the switches, accordions and popovers.
- Other browsers. Chromium 156 only.
- The per-view values (Tablet, Mobile) on these controls: not built.
- The Style tab of these blocks: not built.
- A visitor's view of the loops with real content. The three blocks have no text block yet, so the
  loop repeats its structure, and a title only shows inside a text block (next step).

## The lab plugin on blocks.local

The old universal-layer prototype (`snn-lab`) still adds its "SNN style (lab)" panel under our controls on
blocks.local. It is test tooling. It was not touched. Turn it off on blocks.local when the real panel is ready.

## Next

1. The Text block (heading and paragraph) with the lightning on its text, so loops show titles and the
   preview has something to show.
2. Per-view values for the layout fields, with the panel sync (D18 to D22).
3. The Terms and Users query types.
4. Colour, size, radius and shadow fields with the V button, as the block controls arrive.
5. Bricks's live builder tour, once `bricks.local` resolves (a hosts entry is needed; ask first).
