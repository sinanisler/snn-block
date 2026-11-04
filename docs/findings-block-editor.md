# Block editor research and findings

Date: 2026-11-04. Test site: blocks.local (WordPress 7.1.4). Branch: `block-editor-sections`.

## The question

Converted design pages looked like plain text in the block editor. The aim was for the editor to look like the front end, and for the text to be easy to edit.

## What we learned (verified on the test site)

- **Custom HTML can hold editable blocks.** The `core/html` block in 7.1.4 keeps its static markup in `innerContent`. Real blocks sit in the `null` slots. The static markup renders as live DOM in the editor, not as raw code.
- **Page CSS reaches the editor canvas.** The `block_editor_settings_all` filter can add a post's CSS to `settings.styles`. WordPress scopes those rules to `.editor-styles-wrapper`.
- **`body` and `html` rules need extra handling.** They do not reach the canvas wrapper. Global styles win, and `var(--bg)` cannot resolve on `<body>`. The fix is to copy those declarations onto the wrapper with a doubled class. The design's `overflow: hidden` on body must be kept off the wrapper, or sticky elements break.
- **Wrapper blocks break flex and absolute layouts.** Each converted element gets its own editor wrapper. Inside a flex or absolutely positioned layout, the wrappers take up space. Keeping the design markup as one static block, with native text blocks only at the text, avoids this.
- **Core heading and paragraph content keeps design spans.** Spans with classes survive as long as the block is not re-serialised by the editor.
- **Scripts do not run in the editor.** Fixed decorative overlays such as the loader and cursor would cover the canvas. The converter marks them with `snn-decor`, and the editor hides that class only.
- **Traps when writing from PHP.** Without a logged-in user, `wp_kses` strips block comment attributes. Slash the post data once with `wp_slash()`, not twice.
- **List View names come from the design.** `metadata.name` is set from the design class (for example `Hero / title`, `Svc / Heading 3`).

## What changed

Commit `b751634` on branch `block-editor-sections`:

- `includes/ai/blocks/html-to-blocks.php`: sections mode is the default. Each design section becomes one Custom HTML block. Headings and paragraphs inside become native, editable blocks. Blocks are named from the design. The old per-element conversion stays as mode `blocks`.
- `includes/ai/blocks/page-code.php`: page CSS and body/html declarations reach the editor canvas. Decorative fixed overlays are hidden in the editor only.
- `includes/ai/blocks/block-edit.php`: server-side section lookup also matches section blocks.

## Results

Heights are CSS pixels at 1440 px wide. "Canvas" is the editor canvas, which includes empty space WordPress adds below the content.

| Page | Design HTML | Front end | Block editor canvas | Blocks | Editable text | Static sections | Invalid |
|---|---|---|---|---|---|---|---|
| Fluxa Motion Studio | 7 695 | 7 791 | 7 877 | 50 | 34 | 16 | 0 |
| Neon Festival | 1 923 | 2 005 | 2 483 | 11 | 6 | 5 | 0 |
| Sunset Bakery | 1 999 | 2 073 | 2 551 | 15 | 11 | 4 | 0 |

- **Editor vs front end:** all 20 sections measured have the same height and vertical position in the editor as on the front end.
- **Front end vs design:** 0 to 36 px per section, from WordPress block spacing.

### Editing test (Fluxa hero)

Real mouse and keyboard input in the editor:

1. Clicked the hero heading. It is editable.
2. Typed ` EDITED`. The block content changed.
3. Saved the draft. The front end showed `We make EDITEDbrands move.`
4. The button label "Start a project" is correctly not editable.
5. Reverted the test text and saved. The front end is back to `We make brands move.`

Functional tests: 42 passed, 0 failed.

## Known gaps

1. **Static parts cannot be edited in place.** Buttons and their labels, nav links, stat numbers and labels in spans, list items, table cells, images and FAQ summaries. Next step: the same leaf approach for links and spans, and `core/image` for images.
2. **Scripted animations do not run in the editor.** Counters, reveals and the loader show their markup state.
3. **Empty space below the canvas.** About 86 px on Fluxa, about 480 px on Neon and Sunset.
4. **The design's fixed header appears in the middle of some editor captures.** It is fixed to the canvas viewport, as it is on a real screen.
5. **Pages 77, 99 and 101 still use the old structure.** The v2 drafts (160, 161, 162) use the new mode. Nothing is published.
6. **Phone width is not checked.** All captures are at 1440 px (the List View captures at 1600 px).

## Screenshots

Each design test has three views: the design HTML, the front end, and the block editor with the List View open on the left.

- Fluxa Motion Studio: [design HTML](screenshots/2026-11-04-fluxa-motion-studio/1-design-html.jpg), [front end](screenshots/2026-11-04-fluxa-motion-studio/2-frontend.jpg), [block editor with List View](screenshots/2026-11-04-fluxa-motion-studio/3-block-editor-list-view.jpg)
- Neon Festival: [design HTML](screenshots/2026-11-04-neon-festival/1-design-html.jpg), [front end](screenshots/2026-11-04-neon-festival/2-frontend.jpg), [block editor with List View](screenshots/2026-11-04-neon-festival/3-block-editor-list-view.jpg)
- Sunset Bakery: [design HTML](screenshots/2026-11-04-sunset-bakery/1-design-html.jpg), [front end](screenshots/2026-11-04-sunset-bakery/2-frontend.jpg), [block editor with List View](screenshots/2026-11-04-sunset-bakery/3-block-editor-list-view.jpg)

A compare page with the full editor canvas, the section table and a split slider is published at https://claude.ai/artifact/UAgCNEKGpCN6KBHPWdWzir (private).

## Method

- Design HTML and front end: full page at 1440 px, reduced motion. On the front end the admin bar and cookie banner are hidden.
- Block editor: the List View is opened and the first sections expanded. Viewport capture at 1600 px.
- Canvas heights and section positions were measured with JavaScript in the editor iframe and the front end.
