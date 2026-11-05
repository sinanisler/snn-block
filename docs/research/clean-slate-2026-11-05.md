# Clean slate: core and theme defaults (5 Nov 2026)

Status: working tree only, not committed. Test site: blocks.local (WordPress 7.1.4). First step of the build order in the Block Editor Capabilities Lab (v6): clean slate, then the global style system, then the foundation blocks.

## Result

| Measure | Before | After | Change |
|---|---|---|---|
| Blank front-end page, visitor (`/sample-page/`), bytes | 55,506 | 46,107 | −9,399 (−17%) |
| Global styles inline block, bytes | 10,586 | 1,608 | −8,978 |
| Speculation rules script (prefetch) | 1 script, 421 bytes | none | removed |
| Editor palette colours (legacy store list) | 12 | 0 | removed |
| Editor gradients (legacy store list) | 12 | 0 | removed |
| Editor font size presets (S, M, L, XL) | 4 | 0 | removed |
| Core block style variations (blocks with any) | 8 | 0 | removed |
| Core block patterns (WordPress directory) | not counted | 0 | removed |
| Remote pattern lookup from the inserter | on | off | removed |
| Global stylesheet, PHP (all parts) | 11,395 | 2,371 | −9,024 |

What the editor shows now, in the paragraph's Styles tab (screenshots below): the text colour and background controls, the palette and the four font size presets are gone. Only a font size input remains.

- Before: [editor-styles-tab-before.jpg](clean-slate-screens/editor-styles-tab-before.jpg)
- After: [editor-styles-tab-after.jpg](clean-slate-screens/editor-styles-tab-after.jpg)

## What was removed, and where it came from

| Default | Source in WordPress 7.1.4 | How it is removed |
|---|---|---|
| Palette, gradients, duotone, font sizes, spacing sizes, shadow presets, aspect ratios | `wp-includes/theme.json` (core data, origin `default`) | Filter `wp_theme_json_data_default` returns empty core data |
| Button colour (#32373c) and padding, body and block spacing, block settings (core/button, core/image lightbox, core/pullquote) | `wp-includes/theme.json` (`styles`, `settings.blocks`) | Same filter |
| Legacy palette, gradient and font size lists in the editor store | `wp-includes/js/dist/block-editor.js`, `SETTINGS_DEFAULTS` (comment: kept for backward compatibility) | Filter `block_editor_settings_all` sends empty lists when the server has not set them |
| Block style variations: image rounded, quote plain, button fill and outline, separator wide and dots, social links, table stripes, tag cloud outline, site logo rounded | Block types (`styles`) | Cleared on `init` (priority 100) for `core/*` blocks |
| WordPress block pattern directory | `core-block-patterns` theme support | `remove_theme_support` |
| Remote pattern lookup (wordpress.org) | filter `should_load_remote_block_patterns` | returns false |
| Emoji detection script and styles | `wp_head` 7, `wp_enqueue_scripts` | removed on every request (before this, only the security toggle did it) |
| Speculative loading (prefetch) | filter `wp_speculation_rules_configuration` | returns null (core already disables it for logged-in users) |

Code: [includes/features/clean-slate.php](../../includes/features/clean-slate.php), loaded from [functions.php](../../functions.php).

## What stays, and why

- **Core CSS for each block in use** (paragraph 788 bytes, quote 824, post content 180). Decision D7 in the lab: keep for now.
- **Shared block-library CSS** (4,322 bytes): utility classes such as `.screen-reader-text` and `.aligncenter`, and the admin colour variables. Candidate to trim later.
- **Core layout helpers** inside the global styles block (1,608 bytes): `body` margin, `.alignleft` and `.alignright`, flex and grid gap helpers, and the font family variables from the font library.
- **Core's skip link** (CSS 599 bytes). Core manages it, and it is left exactly as core runs it. See decision 1 below.
- **Core image sizing** (`wp-img-auto-sizes`, 197 bytes).
- **Font library** `@font-face` output (2,998 bytes): ours.
- **Our features**: accessibility widget, view transitions, cookie banner CSS, GSAP and Lenis. Not core defaults, and unchanged.
- **Head metadata**: REST and oEmbed discovery links, RSD, shortlink, feed links. Not visual; kept.
- **The site's own global styles** (the `wp_global_styles` post, which holds the font families): kept.

## Consequences for the editor

- Core blocks lose the text colour, background colour and gradient controls, and the preset font sizes. Until our style layer exists, there is no colour control on core blocks.
- Core blocks lose the WordPress pattern directory and the block style variations (outline button, rounded image, and so on).
- Core's button fill is gone. Page 77 is the only converted page with core buttons (three). Their computed background colours are the same before and after, so the page's own CSS already covers them.

## Verification

- Functional PHP: 56 of 56 (45 existing checks, plus 11 new clean-slate checks in `snn-block-work/tests/functional.php`, section 14).
- Smoke, 58 admin and front-end URLs: 0 problems.
- HTTP checks: 16 of 18. The same two known source bugs (XML-RPC refusal, comment form when comments are off).
- Editor block validity: 0 invalid blocks on pages 77 (152 blocks), 99 (22), 101 (19), 142 (4), 160 (50), 161 (11) and 162 (15).
- Converted pages (logged-in preview, compared before and after): the page 77 DOM is identical after the skip-link revert. The computed-style fingerprint matched on pages 99, 101 and 160. On page 77 it differed only by the skip link, which the revert restores. Not compared pixel by pixel.
- Debug log: the only warnings after the change are the existing cookie-banner warnings (`includes/features/cookie-banner.php`, lines 1322 and 1472). No new notices.

## Problems found while doing it, and how they were fixed

1. **Skip link (regression, reverted).** Removing core's enqueue hook also removed the unhook it performs, so visitors got a "Skip to content" script. The skip-link lines are gone from the module, so core runs its skip link as it did before. The DOM diff confirmed the fix.
2. **Editor palette still showed 12 colours** after the theme.json change. The reason is core's legacy JavaScript store defaults. The server now sends empty lists for those keys.
3. **Notices in the debug log.** `unregister_block_style` was called with numeric keys. The loop now reads the real style names and checks the registry first.
4. **Test harness state.** During the test runs, two features (accessibility widget and page transitions) were switched off in the options. `setup.php` (step 1 of the run order) turned them back on before the final measurement, so the numbers above compare like with like. No code change caused this.

## Decisions for you

1. **Skip link.** Core gives a "Skip to content" link only to logged-in users on this theme, so visitors get none (in both before and after). WCAG 2.4.1 expects a way to skip repeated blocks. Recommendation: add our own skip link for everyone in the foundations step.
2. **Text and background colour on core blocks** are gone until our style layer arrives. Recommendation: accept this for the foundation phase, and bring our palette in with the global style system (step 2).
3. **Core block CSS (D7)**: keep for each block in use, as recommended in the lab. Confirm.
4. **Editor content width.** The editor store still holds a legacy `maxWidth` of 580. It has no visible effect on this theme (the canvas is full width). Decide the width with the container foundation (1200 px token).
5. **Shared block-library CSS** (4.3 KB): keep for now, trim later. Confirm.
6. **Head metadata** (REST, oEmbed, shortlink, feeds): keep. Confirm, or strip the non-functional ones (shortlink) for a leaner head.

## Notes

- The Styles tab's "SNN style (lab)" and "SNN reveal (lab)" panels on blocks.local come from the `snn-lab` test plugin, not from this repo.
- Site Editor: opens with no error notices (Design panel and the index template canvas). Its Styles panel was not opened. Not checked: logged-in visitors on pages other than the preview; a pixel comparison of the converted pages.
- Changed files: `functions.php` (one require line, with a comment), `includes/features/clean-slate.php` (new), `docs/research/clean-slate-2026-11-05.md` (this note), `docs/research/clean-slate-screens/` (two screenshots). Nothing committed.
