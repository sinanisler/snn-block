# Controls research: build from zero or use a library? (5 Nov 2026)

Written for: the project owner (Sinan), to decide the control approach before the foundation blocks.
Companion review page with the screenshots: `docs/research/controls-screens-2026-11-05/`.

## Question

Every block will get custom controls. Options: build all controls ourselves, use a headless
library (behaviour only, we style it), or use a styled kit (ready-made look). The owner rejected
WordPress core controls earlier (see `own-controls-not-core` in memory). The Bricks panel is the
reference for logic and layout, not for copying code.

## Constraint that decides a lot: the editor's React

- WordPress 7.1.4 (blocks.local) ships **React 18.3.1** for `wp.element`
  (`wp-includes/js/dist/vendor/react.js`, `var ReactVersion = '18.3.1'`).
- Any library we use in the editor must run on React 18 **with WordPress's copy of React**.
  A second React copy breaks hooks in the editor, so we must not bundle one.
- Result: libraries that require React 19 cannot run in the editor. Mantine 9.7.5 requires
  `react ^19.2.0`, so it is out.

## Options

| Option | What we get | What we still write | Look | React 18 ok (npm peer range) |
|---|---|---|---|---|
| **A. Own, zero dependencies** | Native `<input>`, `<select>`, `<input type=range>`, `<input type=color>`, `popover` attribute, CSS anchor positioning | Keyboard model for custom dropdowns, focus, typeahead, colour picker, slider behaviour, tests | Ours, fully | n/a (uses WP React) |
| **B. Own skin + headless engine** | Behaviour and ARIA from the engine (dropdown, slider, tabs, switch) | Every visual part, the Bricks-style layout, tokens | Ours, fully | see below |
| **C. Styled kit** | Ready controls with a full look | Little, but the look is theirs | Theirs (opinionated) | see below |
| **D. WordPress core components** | `@wordpress/components` | Nothing | Core's | Rejected by the owner |

### Headless engines (option B candidates), npm registry on 5 Nov 2026

| Package | Version | License | Peer React | Unpacked size (not bundle size) | Note |
|---|---|---|---|---|---|
| `@radix-ui/react-popover` | 1.3.1 | MIT | ^16.8 to ^19 | 117 KB | Radix Primitives, the base of shadcn/ui |
| `react-aria-components` | 1.22.1 | Apache-2.0 | ^16.8 to ^19 | 6.9 MB | Adobe. Strongest accessibility focus; hooks-first API |
| `@ariakit/react` | 0.4.42 | MIT | ^17 to ^19 | 1.1 MB | Strong ARIA focus, composable |
| `@headlessui/react` | 2.2.10 | MIT | ^18 or ^19 | 1.0 MB | Tailwind Labs |
| `@base-ui/react` | 1.9.0 | MIT | not checked | not checked | MUI team. Old name `@base-ui-components/react` still on npm (1.0.0-rc.0). Check the current name before use |
| Ark UI | (not checked) | MIT | (not checked) | (not checked) | Chakra's headless base (state machines). Docs captured |

### Styled kits (option C candidates)

| Package | Version | License | Peer React | Unpacked size | Note |
|---|---|---|---|---|---|
| `@mantine/core` | 9.7.5 | MIT | **^19.2.0** | 10 MB | Cannot run in the WordPress 7.1 editor (React 18.3.1) |
| `@chakra-ui/react` | 3.38.0 | MIT | >=18 | 2.8 MB | Built on Ark UI. Lists `@emotion/react` as a peer |
| `antd` | (latest tag not parsed) | MIT | >=18 | 49 MB (whole package) | Large; tree-shaking needed |
| `@radix-ui/themes` | 3.3.0 | MIT | 16.8 to 19 | 4.9 MB | Radix's own styled layer |

### Colour picker

- `react-colorful` 5.8.1, MIT, peer React >=16.8, unpacked 408 KB. Renders fine on React 18.3.1
  (test page `controls-screens-2026-11-05/lab/colour-react-colorful.html`, loaded from esm.sh).
- Native alternative: `<input type="color">` (used in the own mock). Its picker UI is the
  browser's, so it looks different on each system.

## Native platform pieces (for option A), status from search, not verified on MDN

- **Popover API:** one source says Baseline since April 2025. Our mock uses it and it works in
  headless Chrome 156 (local test, 5 Nov 2026).
- **CSS anchor positioning:** Chrome 125 is consistent across sources. Firefox and Safari dates
  conflict between sources. Our mock uses `anchor()` and flips to the top when there is no room.
- **Customisable `<select>` (`appearance: base-select`):** strongest in Chromium (about Chrome 135).
  Firefox needs flags according to one source. Safari status is unclear. Do not depend on it yet.
- **Verify before depending:** MDN and Can I Use / web-features data. The sources conflict.

## What the screenshots show (review page)

- Our zero-dependency mock: `controls-screens-2026-11-05/lab/own-panel-closed.png` and
  `own-panel-open.png`. Display dropdown built from the Popover API and anchor positioning.
  Segmented icon buttons, four-side spacing, colour swatch with hex field, range slider,
  switch. Source: `lab/own-panel-mock.html`. It has no keyboard model beyond Tab and Enter.
- Official demo pages (captured with headless Chrome, 5 Nov 2026):
  `official/radix-primitives-select.png`, `official/radix-themes-select.png`,
  `official/react-aria-select.png`, `official/ariakit-select.png`,
  `official/headlessui-listbox.png`, `official/base-ui-select.png`, `official/ark-ui-select.png`,
  `official/shadcn-select.png`, `official/antd-select.png`, `official/mantine-select.png`,
  `official/chakra-select.png`.
- Block plugins in WordPress (WordPress.org listings):
  `wp-plugins/kadence-blocks/screenshot-1.jpg` to `screenshot-6.jpg`.
  Stackable editor GIFs in `wp-plugins/stackable/` (3 to 9 MB each, not in the review page).
  GenerateBlocks and Spectra: no screenshot URLs found on their pages yet.
- Bricks (owner's own screenshots): `docs/research/screenshots-2026-11-05/bricks-01` to `-07`.

### Licence and use of screenshots

- Library code is MIT or Apache-2.0. We may use it, with the licence notice.
- Screenshots of docs sites and WordPress listings belong to their owners. They are for
  internal review here. Do not publish them.
- Bricks is a commercial product (not GPL as far as I know; confirm before any code reuse).
  We use it as a reference for logic and layout only.

## Findings

1. Any headless engine must be React 18 compatible and use WordPress's React. Radix, React Aria,
   Ariakit, Headless UI and Base UI (peer range checked for those with npm data) pass this check.
   Mantine 9 fails it.
2. The hard parts of controls are behaviour, not looks: keyboard model, focus handling, popover
   positioning, typeahead, colour picker maths, slider drag. Option A means writing these.
3. The Bricks-style panel logic (rows, segmented icon buttons, icon rows, conditional rows,
   tabs) is layout code. It is ours in every option.
4. Styled kits decide the look for us. That conflicts with the owner's direction (own look).
5. Platform APIs cover more than they did: popover and anchor positioning work in Chromium today.
   Cross-browser behaviour is still to be tested.

## Open questions (for the owner)

1. Option A (everything ours, native and custom behaviour), option B (ours, plus one headless
   engine for the dropdown and slider), or a mix?
2. Keyboard and screen-reader requirement: WCAG 2.2 AA for the editor panel? (Affects how much of
   option A we must test.)
3. Browser targets for the editor (Chromium only is simplest; Firefox and Safari matter for option A).
4. Colour picker: `<input type="color">`, `react-colorful`, or our own?

## Sources

- npm registry metadata, fetched from `https://registry.npmjs.org/<package>/latest` on 5 Nov 2026
  (versions, licences, peer dependencies, unpacked sizes).
- WordPress 7.1.4 React version: `D:\WWW\LOCAL_SITES\blocks.local\wp-includes\js\dist\vendor\react.js`.
- Comparisons (blog sources, vendors have a stake; check the libraries' own sites):
  - [Base UI vs React Aria, Untitled UI](https://www.untitledui.com/blog/base-ui-vs-react-aria)
  - [React Aria vs Radix Primitives 2026, PkgPulse](https://www.pkgpulse.com/guides/react-aria-vs-radix-primitives-2026)
  - [Top headless UI libraries for React in 2026, GreatFrontend](https://www.greatfrontend.com/blog/top-headless-ui-libraries-for-react-in-2026)
  - [Base UI alternatives, DesignRevision](https://designrevision.com/alternatives/base-ui)
- Native platform support (conflicting, verify):
  - [Delete Your Floating UI Dependency: CSS Anchor Positioning Is Now Baseline](https://www.buildmvpfast.com/blog/css-anchor-positioning-baseline-delete-floating-ui-2026)
  - [CSS anchor positioning for tooltips and popovers, 2026](https://blog.codercops.com/blog/css-anchor-positioning-tooltips-popovers-2026)
  - [A customizable select element, Chrome for Developers](https://developer.chrome.com/blog/a-customizable-select?hl=it)
- Official demo pages: the URLs listed in the review page (captured 5 Nov 2026).
- WordPress.org plugin pages: `https://wordpress.org/plugins/kadence-blocks/`.
