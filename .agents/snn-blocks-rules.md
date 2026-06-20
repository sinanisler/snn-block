# 🤖 AI Agent System Prompt & Reference for WordPress Block Development

**ATTENTION AI AGENT:** You are assisting a developer in building custom WordPress Gutenberg Blocks.
Read this document carefully before generating any code. It dictates the exact architecture, constraints, security practices, and coding style required for this project.

---

## 🛑 1. CORE ARCHITECTURAL RULES (NON-NEGOTIABLE)

1. **NO BUILD PROCESS:** We do **NOT** use Webpack, Babel build steps, `@wordpress/scripts`, or `npm run build`.
2. **JSX COMPILATION:** JSX is written in an `editor.jsx` file and loaded directly in the WordPress admin footer using `<script type="text/babel">`. It relies on an in-browser Babel compiler.
3. **NO IMPORTS:** Because there is no build process, you **CANNOT** use `import` statements. All React and WordPress dependencies must be destructured from the global `wp` object (e.g., `const { useBlockProps } = wp.blockEditor;`).
4. **DYNAMIC RENDERING (SSR):** We rely entirely on Server-Side Rendering via PHP for the frontend output (`render_callback`).
5. **THE `SAVE` FUNCTION:** Because we use PHP for the frontend, the `save` function in JS must ONLY return `<InnerBlocks.Content />` (if using inner blocks) or `null` (if it's a closed/standalone block). Do not write JSX frontend markup in the `save` function.
6. **NO WRAPPER DIV SOUP:** Use `useInnerBlocksProps(useBlockProps({ ... }))` on the main semantic tag to avoid unnecessary nested `div`s in the editor.

---

## 📁 2. STANDARD BLOCK STRUCTURE

Every block lives inside the `/blocks` folder. Each block directory contains these files:

| # | File | Purpose |
|---|---|---|
| 1 | `block.json` | Metadata, attributes, and native block supports |
| 2 | `block.php` | Self-registering PHP. Calls `register_block_type(__DIR__, ...)` on `init`. Contains the SSR `render_callback` and asset enqueuing |
| 3 | `editor.jsx` | The block's visual interface in the Gutenberg editor (JSX compiled by in-browser Babel) |
| 4 | `block.css` | Styles applied to both the editor and frontend |
| *(5)* | `*.js` | *(Optional)* Additional frontend-only vanilla JS files (e.g., `lightbox.js`). Registered in `block.php` via `wp_register_script()` using the `SNN_URL` constant |

**Current blocks:** `section`, `container`, `text`, `icon`, `simple-gallery`

> **Shared files:**
> - `/blocks/Controls.jsx` — shared editor components (loaded once by `functions.php` before block JSX), exposed on `window.SNNControls`
> - `/blocks/block-helpers.php` — shared PHP CSS helpers (`snn_responsive_style`, `snn_responsive_padding`), included by each `block.php` via `require_once`

### Block Registration Flow

Each `block.php` is **self-registering** — it hooks into `init` and calls `register_block_type(__DIR__, ...)`. The `functions.php` only **includes** the block files:

```php
// functions.php — just require the block files
require_once SNN_PATH . 'blocks/section/block.php';
require_once SNN_PATH . 'blocks/container/block.php';
require_once SNN_PATH . 'blocks/text/block.php';
require_once SNN_PATH . 'blocks/icon/block.php';
require_once SNN_PATH . 'blocks/simple-gallery/block.php';
```

### Theme Constants

These are defined in `functions.php` and available everywhere:

```php
define('SNN_PATH', trailingslashit(get_stylesheet_directory()));
define('SNN_PATH_ASSETS', trailingslashit(SNN_PATH . 'assets'));
define('SNN_URL', trailingslashit(get_stylesheet_directory_uri()));
define('SNN_URL_ASSETS', trailingslashit(SNN_URL . 'assets'));
```

Use `SNN_URL` for enqueuing frontend assets (e.g., `SNN_URL . 'blocks/my-block/some-file.js'`).

---

## 🛡️ 3. DATA FLOW & SECURITY (PHP OUTPUT)

When writing the PHP `render_callback`, you must strictly follow WordPress security standards:

1. **Escape HTML Attributes:** Any dynamic value used inside an HTML attribute must be escaped using `esc_attr()`. (e.g., `style="<?php echo esc_attr($style); ?>"`, `class="<?php echo esc_attr($classes); ?>"`)
2. **Escape URLs:** Any URL must be escaped using `esc_url()`.
3. **Escape Text:** Any dynamic text node must be escaped using `esc_html()`.
4. **Rich Text:** If the attribute contains HTML (like from a `RichText` component), output it using `wp_kses_post()`.
5. **Default Values:** Always provide fallback values when extracting attributes in PHP: `$myVar = $attributes['myVar'] ?? 'default_value';`
6. **CSS Output in `<style>` Tags:** When injecting user-controlled attribute values into `<style>` tags, the values flow through CSS property context — not HTML context. Use `esc_attr()` if placing them in a style *attribute*, but for `<style>` tag content, **sanitize CSS values** by stripping dangerous characters (e.g. allow only CSS-safe tokens: alphanumerics, `#`, spaces, `-`, `_`, `.`, `%`, `px`, `em`, `rem`, `vh`, `vw`, `fr`, parentheses, commas). Never echo raw user input into a `<style>` tag without stripping `<script`, `</style`, `url(`, and `expression(`.
7. **SVG Sanitization (Icon Block):** When rendering user-supplied SVG markup via `customSvg`, strip dangerous elements before output:
   ```php
   // Strip <script> tags and inline event handlers (onclick, onload, etc.)
   $safe_svg = preg_replace(
       '~<script\b[^>]*>.*?</script>|<[^>]*\s+on\w+\s*=\s*["\'][^"\']*["\']~is',
       '',
       $custom_svg
   );
   // Remove javascript: URLs in href/xlink:href attributes
   $safe_svg = preg_replace(
       '~\b(?:xlink:)?href\s*=\s*["\']\s*javascript\s*:[^"\']*["\']~i',
       '',
       $safe_svg
   );
   ```
   Then output the sanitized SVG wrapped in a `<span>` — do NOT use `wp_kses_post()` on raw SVG as it will strip valid SVG elements.

---

## 🏗 4. NATIVE BLOCK SUPPORTS (`block.json`)

**AI RULE:** Before building custom UI controls for margins, padding, colors, or typography, **ALWAYS** check if native block supports can handle it.

```json
"supports": {
  "html": false,
  "align": ["wide", "full", "center"],
  "anchor": true,
  "color": { "background": true, "text": true },
  "spacing": { "margin": true, "padding": true, "blockGap": true },
  "typography": { "fontSize": true, "lineHeight": true },
  "borders": { "color": true, "radius": true, "style": true, "width": true }
}
```

### When to Use Custom Controls Instead

Native block supports are **not responsive** — they set a single value for all devices. Most blocks in this project use **custom responsive controls** instead, which allow per-device (desktop, tablet, mobile) values. Use native supports only when:

- The property doesn't need to change across breakpoints (e.g., image borders, rounded corners)
- The block is a simple display block like `simple-gallery`

**Example — Simple Gallery uses native supports:**
```json
"supports": {
    "html": false,
    "align": ["wide", "full", "center"],
    "anchor": true,
    "spacing": { "margin": true, "padding": true },
    "color": { "background": true, "text": false },
    "borders": { "color": true, "radius": true, "style": true, "width": true }
}
```

For layout blocks (Section, Container) and text blocks, use custom responsive controls so users can set different values per device. These blocks set `"align": false` in their `block.json` and handle all layout via custom responsive attributes.

---

## 🎛 5. EXHAUSTIVE UI COMPONENTS CHEAT SHEET

When building custom Inspector panels, destructure components from the global `wp` object. **DO NOT INVENT COMPONENTS.**

### A. Complete Destructuring Map

```jsx
// React Hooks & Elements
const { Fragment, useState, useEffect, useRef } = wp.element;

// Block Editor Core
const { InspectorControls, BlockControls, useBlockProps, useInnerBlocksProps, InnerBlocks, RichText, MediaUpload, MediaUploadCheck } = wp.blockEditor;

// Standard Components
const { PanelBody, TextControl, TextareaControl, ToggleControl, SelectControl, RangeControl, ColorPalette, Button, BaseControl, Modal, SearchControl, __experimentalToggleGroupControl, __experimentalToggleGroupControlOption } = wp.components;

// Data & i18n (MUST destructure — used in every block)
const { useSelect } = wp.data;
const { __, sprintf } = wp.i18n;
```

### A2. Shared Controls (`window.SNNControls`)

All block editor JSX files destructure shared helper components from `window.SNNControls`. These are defined once in `/blocks/Controls.jsx` and loaded by `functions.php` before any block JSX:

```jsx
// Shared reusable controls (loaded by functions.php via Controls.jsx)
const { DeviceBadge, RespLabel, ToggleField, IconToggleField, PaddingInput, RangeUnitField, useResponsiveAttributes, useActiveDevice } = window.SNNControls;

// Text block also uses these additional controls:
const { ColorRow, FontSizeRow, AlignRow, TransformRow, CompactSelect } = window.SNNControls;
```

**Available shared components on `window.SNNControls`:**

| Component | Signature | Used By |
|---|---|---|
| `DeviceBadge` | `({ device })` | All blocks — renders a FA icon for desktop/tablet/mobile |
| `RespLabel` | `({ label, device })` | All blocks — label row with device badge |
| `ToggleField` | `({ label, value, options, onChange })` | section, container, text, simple-gallery — ToggleGroupControl with SelectControl fallback |
| `IconToggleField` | `({ label, value, options, onChange })` | section, container — FA icon button group for flex direction/wrap/justify/align |
| `PaddingInput` | `({ values, onChange, device, label? })` | section, container, text — 4-side padding grid (T/R/B/L) |
| `RangeUnitField` | `({ label, value, onChange, min?, max?, step? })` | All blocks — RangeControl slider paired with smart unit-aware text input |
| `ColorRow` | `({ label, value, onChange })` | text — native color picker + alpha slider + hex text input (compact) |
| `FontSizeRow` | `({ label, value, onChange, units? })` | text — number input + unit dropdown |
| `AlignRow` | `({ label, value, onChange })` | text — 3-button text-align toggle (≤/≥/≧) |
| `TransformRow` | `({ label, value, onChange })` | text — 4-button text-transform toggle (Aa/AA/aa/Aa·) |
| `CompactSelect` | `({ label, value, options, onChange })` | text — label + dropdown on one row |
| `useActiveDevice` | `() => 'desktop'\|'tablet'\|'mobile'` | Used internally by `useResponsiveAttributes` — detects WP preview device |
| `useResponsiveAttributes` | `(attributes, setAttributes) => { activeDevice, getVal, setVal, inheritVal, getPad, setPad, inheritPad }` | All blocks — the core responsive hook |

### B. Number & Size Controls (Mandatory Flags)

* **`RangeControl`**: **CRITICAL:** Always include `__next40pxDefaultSize={true}` and `__nextHasNoMarginBottom={true}` to prevent console warnings in modern WP.
* **`ToggleGroupControl`**: Same mandatory flags: `__next40pxDefaultSize={true}` and `__nextHasNoMarginBottom={true}`.

### C. Advanced / Experimental Controls

* **`ToggleGroupControl`**: Modern button-group style selector (`__experimentalToggleGroupControl`).
* **`ToggleGroupControlOption`**: Individual option inside the group (`__experimentalToggleGroupControlOption`).
* **Rule:** Always include a `SelectControl` fallback checking `typeof __experimentalToggleGroupControl !== 'undefined'`. Include the `__next` flags on the `ToggleGroupControl`.

---

## 🧩 6. IMPLEMENTATION PATTERNS

### A. The Magic JSX/PHP Integration Pattern (Crucial)

In your `block.php` file, this is the **ONLY** way we load React. Do not enqueue standard JS files for the editor. Always include the `$current_screen` guard to avoid loading on non-editor pages:

```php
add_action('enqueue_block_editor_assets', function () {
    $current_screen = get_current_screen();
    if ($current_screen && $current_screen->is_block_editor) {
        add_action('admin_footer', function () {
            $jsx_path = __DIR__ . '/editor.jsx';
            if (file_exists($jsx_path)) {
                $jsx_content = file_get_contents($jsx_path);
                echo '<script type="text/babel">' . $jsx_content . '</script>';
            }
        });
    }
});
```

### A1. Injecting CSS into the Editor Iframe Canvas

If your block depends on external CSS with webfonts (e.g. Font Awesome) to render icons in the editor preview, the regular `enqueue_block_editor_assets` hook loads styles on the parent admin page but may **not** reliably resolve relative `url()` paths to webfont files inside the block editor iframe.

The most reliable approach is `enqueue_block_assets` with an `is_admin()` guard. This hook fires in both frontend and editor contexts, and the guard limits it to the editor:

```php
add_action('enqueue_block_assets', function () {
    if (is_admin()) {
        wp_enqueue_style(
            'my-handle',
            SNN_URL . 'assets/fonts/fontawesome/all.min.css',
            [],
            '6.7.2'
        );
    }
});
```

Do **not** use `add_editor_style()` for CSS that contains `@font-face` with relative webfont paths — the iframe context can break the relative URL resolution. Also avoid `block_editor_settings_all` with `file_get_contents()` for large files, as it reads the entire file into memory on every editor load.

### A2. Injecting Data into the Editor (Icon Block Pattern)

If your block needs to pass server-side data to the editor JSX (e.g., an icon library list), output a `<script>` tag alongside the JSX in the `admin_footer` hook:

```php
add_action('enqueue_block_editor_assets', function () {
    $current_screen = get_current_screen();
    if ($current_screen && $current_screen->is_block_editor) {
        add_action('admin_footer', function () {
            // 1. Pass data to the browser BEFORE the JSX
            $icons_path = SNN_PATH_ASSETS . 'fa-icons.json';
            if (file_exists($icons_path)) {
                $icons_json = file_get_contents($icons_path);
                echo '<script>window.snnFAIcons = ' . $icons_json . ';</script>';
            }

            // 2. JSX (compiled by in-browser Babel)
            $jsx_path = __DIR__ . '/editor.jsx';
            if (file_exists($jsx_path)) {
                $jsx_content = file_get_contents($jsx_path);
                echo '<script type="text/babel">' . $jsx_content . '</script>';
            }
        });
    }
});
```

### A3. Loading Shared Controls (Controls.jsx)

The shared editor components (`DeviceBadge`, `ToggleField`, `RangeUnitField`, `useResponsiveAttributes`, etc.) are defined in `/blocks/Controls.jsx` and loaded **once** by `functions.php` at priority 1, before any individual block JSX:

```php
// functions.php — load shared Controls.jsx before all block JSX
add_action('enqueue_block_editor_assets', function () {
    add_action('admin_footer', function () {
        $controls_path = SNN_PATH . 'blocks/Controls.jsx';
        if (file_exists($controls_path)) {
            echo '<script type="text/babel" id="snn-controls">' . file_get_contents($controls_path) . '</script>';
        }
    }, 1);  // priority 1 — runs before block JSX (which use default priority 10)
}, 5);
```

The `Controls.jsx` file uses `window.SNNControls = window.SNNControls || {}` to create a shared namespace. All block editors then destructure the components they need from `window.SNNControls`.

### B. Experimental Control Fallback Pattern (ToggleField)

This is implemented in `Controls.jsx` as `ToggleField` — all blocks use it as a shared component. See Section 5A2 for the destructuring pattern. The implementation checks `typeof __experimentalToggleGroupControl !== 'undefined'` and falls back to `SelectControl`.

### C. Shared Editor Controls (Controls.jsx)

The following controls are defined once in `Controls.jsx` and reused across all blocks. See Section 5A2 for the full component table and destructuring:

- **`ToggleField`** — ToggleGroupControl with SelectControl fallback (Section 6B above)
- **`IconToggleField`** — FA icon button group for flex direction, wrap, justify, align
- **`RangeUnitField`** — RangeControl slider + smart unit-aware text input
- **`PaddingInput`** — 4-side padding grid (T/R/B/L)
- **`ColorRow`** — Compact native color picker + alpha slider + hex text (used by text block)
- **`FontSizeRow`** — Number input + unit dropdown (used by text block)
- **`AlignRow`** — 3-button text-align toggle (used by text block)
- **`TransformRow`** — 4-button text-transform toggle (used by text block)
- **`CompactSelect`** — Label + dropdown on one row (used by text block for font-weight)

**Do NOT inline these in individual block files.** Import them from `window.SNNControls`.

---

## 📱 7. RESPONSIVE ATTRIBUTE ARCHITECTURE (CRITICAL)

This is the **core pattern** of the entire block system. Every styling attribute supports per-device values (desktop, tablet, mobile).

### A. Attribute Shape

All responsive attributes use the same nested object structure in `block.json`:

```json
"attributes": {
    "bgColor": { "type": "object", "default": {} },
    "padding": { "type": "object", "default": {} },
    "fontSize": { "type": "object", "default": {} }
}
```

At runtime, values look like:
```json
{
    "bgColor": {
        "desktop": "#ffffff",
        "tablet": "#f5f5f5",
        "mobile": "#eeeeee"
    },
    "padding": {
        "desktop": { "top": "40px", "right": "20px", "bottom": "40px", "left": "20px" },
        "mobile": { "top": "20px", "right": "10px", "bottom": "20px", "left": "10px" }
    }
}
```

### B. JSX Editor Side — `useResponsiveAttributes` Hook (from Controls.jsx)

Every block editor uses the shared `useResponsiveAttributes` hook from `window.SNNControls`. This single hook replaces all the manual device detection, get/set helpers, and inheritance cascade logic:

```jsx
// 1. Destructure from the shared Controls namespace
const { DeviceBadge, RespLabel, ToggleField, IconToggleField, PaddingInput, RangeUnitField, useResponsiveAttributes } = window.SNNControls;

// 2. One call gives you everything
const { activeDevice, getVal, setVal, inheritVal, getPad, setPad, inheritPad } =
    useResponsiveAttributes(attributes, setAttributes);
```

**What the hook provides:**

| Returned Value | Type | Description |
|---|---|---|
| `activeDevice` | `'desktop' \| 'tablet' \| 'mobile'` | Current WP preview device (lowercased) |
| `getVal(attr)` | `string` | Raw value for the current device (no inheritance) |
| `setVal(attr, value)` | `void` | Sets value for the current device only |
| `inheritVal(attr, fallback?)` | `string` | Inherited value cascade: current → tablet → desktop → fallback |
| `getPad()` | `{ top, right, bottom, left }` | Raw padding for current device |
| `setPad(obj)` | `void` | Sets padding for current device only |
| `inheritPad()` | `{ top, right, bottom, left }` | Inherited padding cascade: current → tablet → desktop |

**How it works internally:**
- Detects the active preview device via `useSelect` on `core/editor` store (WP ≥6.5: `getDeviceType()`; older: `__experimentalGetPreviewDeviceType`)
- `getVal`/`setVal` route to `attributes[attrName][activeDevice]`
- `inheritVal` cascades: mobile → tablet → desktop → fallback
- `inheritPad` cascades: current device → tablet → desktop (first non-empty padding object)
- Also available individually as `useActiveDevice()` on `window.SNNControls`

### C. JSX Editor Side — Device Badge & Label (from Controls.jsx)

These are shared components from `window.SNNControls`, not inline. The actual implementation uses Font Awesome icons instead of colored text badges:

- **`DeviceBadge`** — renders `<i class="fa-solid fa-desktop-alt\|fa-tablet-screen-button\|fa-mobile-screen">` with the device name as title
- **`RespLabel`** — renders a label row with `DeviceBadge` appended

Usage in every block:
```jsx
<RespLabel label={__('Background Color', 'snn')} device={activeDevice} />
```

Or inline the editing indicator:
```jsx
<div style={{ fontSize: '11px', color: '#1e1e1e', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
    <span>{__('Editing:', 'snn')}</span>
    <DeviceBadge device={activeDevice} />
</div>
```

### E. PHP Render Side — `<style>` Tag Generation

On the frontend, responsive CSS is injected via a `<style>` tag using a unique class selector. All blocks share two generic helper functions defined once in `/blocks/block-helpers.php` (the PHP equivalent of `Controls.jsx`):

```php
// 1. Generate a unique class per block instance
$uid = 'snn-c-' . uniqid();     // container: 'snn-c-', section: 'snn-s-', text: 'snn-t-', icon: 'snn-i-', gallery: 'snn-ssl-'
$selector = '.' . $uid;

// 2. Build CSS by device using the shared helpers from block-helpers.php
//    snn_responsive_style($attr, $property, $selector, $unit = '')
//    snn_responsive_padding($padding, $selector)
```

**Shared helpers (`/blocks/block-helpers.php`):**

| Function | Signature | Purpose |
|---|---|---|
| `snn_responsive_style` | `($attr, $property, $selector, $unit='')` | Single CSS property per device (desktop=base, tablet/mobile=@media) |
| `snn_responsive_padding` | `($padding, $selector)` | 4-side padding (top/right/bottom/left) per device |

Each `block.php` includes them with: `require_once __DIR__ . '/../block-helpers.php';`

**Naming convention summary:**

| Block | UID prefix | CSS functions used |
|---|---|---|
| Section | `snn-s-` | `snn_responsive_style` + `snn_responsive_padding` |
| Container | `snn-c-` | `snn_responsive_style` + `snn_responsive_padding` |
| Text | `snn-t-` | `snn_responsive_style` + `snn_responsive_padding` |
| Icon | `snn-i-` | `snn_responsive_style` (size/color only) |
| Simple Gallery | `snn-ssl-` | `snn_responsive_style` (for CSS custom properties: `--snn-gallery-columns`, `--snn-gallery-gap`, `--snn-gallery-aspect-ratio`) |

**Output pattern (same across all blocks):**
```php
// 3. Emit inline styles for non-responsive props + <style> tag for responsive CSS
$output = '<div class="' . esc_attr(implode(' ', $classes)) . '" style="' . $inline_styles . '">';
if ($responsive_css) {
    $output .= '<style>' . $responsive_css . '</style>';
}
$output .= $content;
$output .= '</div>';
```

### F. Non-Responsive Attributes (Flat Values)

Some attributes are NOT responsive — they have a single flat value across all devices:

| Block | Flat Attribute | Type | Notes |
|---|---|---|---|
| Section | `bgImage`, `bgSize`, `bgPosition`, `bgRepeat`, `overflow` | string/object | BG image props + overflow |
| Container | `maxWidth`, `bgImage`, `bgSize`, `bgPosition`, `bgRepeat`, `overflow` | string/object | Max-width is flat, theme default as fallback |
| Text | `tagName`, `content`, `textTransform` | string | HTML tag + rich text content + text-transform |
| Icon | `iconType`, `iconName`, `iconPrefix`, `customSvg`, `customImageId`, `customImageUrl`, `customImageAlt` | string/number | Icon selection data is flat |
| Simple Gallery | `images`, `enableLightbox` | array/boolean | Image array + lightbox toggle |
| All | `customCSS`, `anchor`, `className` | string | Standard WP block attributes |

These use standard `setAttributes({ attrName: value })` without the device routing.

These use standard `setAttributes({ attrName: value })` without the device routing.

### G. When to Make an Attribute Responsive vs Flat

- **Responsive** (object): Layout properties (display, flex, grid, gap, padding, min-height), colors, typography (font-size, line-height, letter-spacing, font-weight, text-align). These are likely to change between desktop/tablet/mobile.
- **Flat** (string/boolean): Semantic/structural properties (HTML tag, overflow, background image position/size, lightbox toggle). These rarely need per-device differentiation.

---

---

## 🎨 CUSTOM CSS SUPPORT (ALL BLOCKS)

Every SNN block supports a **Custom CSS** panel in the editor sidebar where users can write arbitrary CSS rules.

### Implementation Details

**block.json:**
```json
"customCSS": { "type": "string", "default": "" }
```

**editor.jsx:**
- Import `TextareaControl` from `wp.components`
- Add a `PanelBody` titled `'Custom CSS'` inside `InspectorControls`
- Provide help text showing the block's CSS class (e.g., `.snn-container`, `.snn-section`, `.snn-text`, `.snn-simple-gallery`)

**block.php:**
- Extract `$custom_css` from attributes: `$attributes['customCSS'] ?? ''`
- Sanitize with: `preg_replace('~<script\s|</style|url\(|expression\s*\(~i', '', $custom_css)`
- Append to the `<style>` tag using the unique `$selector`:
```php
$all_css .= "{$selector} {\n{$safe_css}\n}\n";
```

### No Separate Groupings

Blocks should NOT have separate `PanelBody` sections for Layout, Spacing, Sizing, or Text. All style controls live in a single **"Style"** panel (or **"Text Settings"** for the Text block), with visual separators (`<hr>`) between logical sections.

---

## 🧠 8. THE OUTPUT PROTOCOL (AI CHECKLIST)

Before giving the user the final code, verify these points silently. If any fail, correct your code before outputting.

1. [ ] **NO IMPORTS:** Are there any `import` statements? *(Delete and use `wp.` destructuring)*.
2. [ ] **NO BUILDS:** Did you create `package.json` or `webpack.config`? *(Delete them).*
3. [ ] **JSX COMPILE:** Did you include the Babel script block in `block.php` with the `$current_screen` guard?
4. [ ] **SECURITY:** Did you use `esc_attr()`, `esc_html()`, or `wp_kses_post()` in the PHP render callback?
5. [ ] **CSS SECURITY:** Are user-controlled values in `<style>` tags sanitized? Strip `<script`, `</style`, `url(`, and `expression(`.
6. [ ] **SVG SECURITY:** If accepting user SVG input, did you strip `<script>` tags, inline event handlers, and `javascript:` URLs?
7. [ ] **SELF-REGISTERING:** Does `block.php` call `register_block_type(__DIR__, ...)` on `init`? Do NOT add registration logic to `functions.php` — just `require_once` the block file.
8. [ ] **SAVE FUNCTION:** Does `save: () => { ... }` return only `<InnerBlocks.Content />` or `null`?
9. [ ] **DIV SOUP:** Is `InnerBlocks` wrapped tightly with `useInnerBlocksProps(useBlockProps())` on the primary semantic tag?
10. [ ] **WARNINGS:** Did you add `__next40pxDefaultSize={true}` and `__nextHasNoMarginBottom={true}` to `RangeControl` / `ToggleGroupControl`?
11. [ ] **FALLBACKS:** Is there a `SelectControl` fallback for experimental components?
12. [ ] **RESPONSIVE ATTRIBUTES:** Are styling attributes shaped as `{ desktop, tablet, mobile }` objects? Are you using `useResponsiveAttributes(attributes, setAttributes)` from `window.SNNControls`?
13. [ ] **SHARED CONTROLS:** Are you using `window.SNNControls` for `DeviceBadge`, `ToggleField`, `IconToggleField`, `PaddingInput`, `RangeUnitField`, `RespLabel` — not inlining them?
14. [ ] **UNIQUE SELECTORS:** Does the PHP render use `uniqid()` to generate a unique CSS class so multiple instances of the same block don't collide?
15. [ ] **THEME CONSTANTS:** Are frontend asset URLs using `SNN_URL` (not hardcoded paths)?
16. [ ] **DYNAMIC CSS:** Do inline CSS styles map correctly in BOTH the React `edit` preview AND the PHP `render_callback`?
17. [ ] **NO GROUPINGS:** Are all inspector controls in ONE panel (Style or Settings) rather than separate Layout/Spacing/Sizing/Text groups? Use `<hr>` separators between logical sections. Exception: Container block has a separate "Container Settings" panel for max-width.
18. [ ] **CUSTOM CSS:** Does `block.json` include `"customCSS": { "type": "string", "default": "" }`? Does `editor.jsx` have a `TextareaControl` in a `Custom CSS` panel? Does `block.php` sanitize and output `$custom_css` in the `<style>` tag?
19. [ ] **SHARED PHP HELPERS:** Is `require_once __DIR__ . '/../block-helpers.php';` at the top of `block.php`? Are `snn_responsive_style()` and `snn_responsive_padding()` used (not per-block functions)?
20. [ ] **CONTROLS.JSX LOADED:** Is `Controls.jsx` loaded in `functions.php` BEFORE individual block JSX? The file is located at `blocks/Controls.jsx` (capital C).
21. [ ] **BLOCK.JSON RENDER:** Does `block.json` include `"render": "file:./block.php"` for apiVersion 3 forward compatibility?

**DELIVERY INSTRUCTIONS:** Output the code as distinct code blocks. Typically 4 files (`block.json`, `block.php`, `editor.jsx`, `block.css`). Include additional frontend JS files (e.g., `lightbox.js`) if the block needs them. Do not omit boilerplate. Provide complete, ready-to-paste files.