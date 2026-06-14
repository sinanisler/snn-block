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

### Block Registration Flow

Each `block.php` is **self-registering** — it hooks into `init` and calls `register_block_type(__DIR__, ...)`. The `functions.php` only **includes** the block files:

```php
// functions.php — just require the block files
require_once SNN_PATH . 'blocks/section/block.php';
require_once SNN_PATH . 'blocks/container/block.php';
require_once SNN_PATH . 'blocks/text/block.php';
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

For layout blocks (Section, Container) and text blocks, prefer custom responsive controls so users can set different values per device.

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
const { PanelBody, TextControl, TextareaControl, ToggleControl, SelectControl, RangeControl, ColorPalette, Button, BaseControl, __experimentalToggleGroupControl, __experimentalToggleGroupControlOption } = wp.components;

// Data & i18n (MUST destructure — used in every block)
const { useSelect } = wp.data;
const { __, sprintf } = wp.i18n;
```

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

### B. Experimental Control Fallback Pattern

```jsx
const ToggleField = ({ label, value, options, onChange }) => {
    const hasToggle = typeof __experimentalToggleGroupControl !== 'undefined';

    if (hasToggle) {
        return (
            <div style={{ marginBottom: '14px' }}>
                <label style={{ fontSize: '11px', fontWeight: 500, display: 'block', marginBottom: '4px', color: '#1e1e1e' }}>
                    {label}
                </label>
                <__experimentalToggleGroupControl
                    value={value}
                    onChange={onChange}
                    isBlock
                    __next40pxDefaultSize={true}
                    __nextHasNoMarginBottom={true}
                >
                    {options.map(opt => (
                        <__experimentalToggleGroupControlOption key={opt.value} label={opt.label} value={opt.value} />
                    ))}
                </__experimentalToggleGroupControl>
            </div>
        );
    }

    return (
        <SelectControl label={label} value={value} options={options} onChange={onChange} />
    );
};
```

### C. RangeUnitField — Smart Slider with Unit-Aware Input

This is a shared pattern used in every block. It provides a `RangeControl` slider paired with a text input that auto-detects units (`px`, `em`, `rem`, `%`, `vh`, `vw`, etc.). When the value is a pure number, it shows "px" as implied unit and enables the slider:

```jsx
const RangeUnitField = ({ label, value, onChange, min = 0, max = 500, step = 1 }) => {
    const strVal = String(value || '');
    const match = strVal.match(/^(-?[\d.]+)(.*)$/);
    const numVal = match ? parseFloat(match[1]) : '';
    const unitVal = match ? match[2] : '';
    const isPureNum = match && !match[2];

    const handleSlider = (v) => {
        onChange(String(v) + (isPureNum ? '' : unitVal));
    };

    return (
        <div style={{ marginBottom: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                <span style={{ fontSize: '11px', fontWeight: 500, color: '#1e1e1e' }}>{label}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                    <input
                        type="text"
                        value={strVal}
                        onChange={e => onChange(e.target.value)}
                        placeholder="0"
                        style={{ width: '70px', padding: '2px 6px', fontSize: '11px', fontFamily: 'monospace', border: '1px solid #ddd', borderRadius: '2px', textAlign: 'right' }}
                    />
                    {isPureNum && strVal !== '' && (
                        <span style={{ fontSize: '10px', color: '#999', fontWeight: 500 }}>px</span>
                    )}
                </div>
            </div>
            {(numVal !== '' || strVal === '') && (
                <RangeControl
                    value={numVal !== '' ? numVal : 0}
                    onChange={handleSlider}
                    min={min} max={max} step={step}
                    withInputField={false}
                    __next40pxDefaultSize={true}
                    __nextHasNoMarginBottom={true}
                />
            )}
        </div>
    );
};
```

### D. PaddingInput — 4-Side Padding Grid

Another shared pattern. Provides T/R/B/L text inputs for per-device padding values:

```jsx
const PaddingInput = ({ values, onChange, device }) => {
    const sides = [
        { key: 'top', label: 'T' },
        { key: 'right', label: 'R' },
        { key: 'bottom', label: 'B' },
        { key: 'left', label: 'L' },
    ];
    return (
        <div style={{ marginBottom: '14px' }}>
            <RespLabel label={__('Padding', 'snn')} device={device} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' }}>
                {sides.map(s => (
                    <div key={s.key}>
                        <span style={{ fontSize: '9px', color: '#757575', display: 'block' }}>{s.label}</span>
                        <input
                            type="text"
                            value={values?.[s.key] || ''}
                            onChange={e => onChange({ ...values, [s.key]: e.target.value })}
                            placeholder="0"
                            style={{ width: '100%', padding: '4px 6px', fontSize: '12px', border: '1px solid #ddd', borderRadius: '2px', boxSizing: 'border-box' }}
                        />
                    </div>
                ))}
            </div>
        </div>
    );
};
```

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

### B. JSX Editor Side — Device-Aware Editing

Every `editor.jsx` must detect the current preview device and route `getVal()`/`setVal()` to the correct key:

```jsx
// 1. Detect active device from the editor store
const deviceType = useSelect(select => {
    const store = select('core/edit-post') || select('core/editor');
    const getDevice = store?.__experimentalGetPreviewDeviceType;
    return getDevice ? getDevice() : 'Desktop';
}, []);
const activeDevice = (deviceType || 'Desktop').toLowerCase(); // "desktop" | "tablet" | "mobile"

// 2. Responsive get/set helpers
const getVal = (attr) => attributes[attr]?.[activeDevice] || '';
const setVal = (attr, value) => {
    setAttributes({ [attr]: { ...(attributes[attr] || {}), [activeDevice]: value } });
};

// 3. For padding (4-side object, not a flat value)
const getPad = () => attributes.padding?.[activeDevice] || {};
const setPad = (obj) => {
    setAttributes({ padding: { ...(attributes.padding || {}), [activeDevice]: obj } });
};
```

### C. JSX Editor Side — Inheritance Cascade

To preview correctly, the editor must **cascade** values: current device → tablet → desktop → fallback. If mobile has no value set, show the tablet value. If tablet has none, show desktop:

```jsx
const inheritVal = (attr) => {
    const val = attributes[attr];
    if (!val || typeof val !== 'object') return '';
    if (val[activeDevice]) return val[activeDevice];
    if (activeDevice === 'mobile' && val.tablet) return val.tablet;
    if (val.desktop) return val.desktop;
    return '';
};

const inheritPad = () => {
    const pad = attributes.padding;
    if (!pad || typeof pad !== 'object') return {};
    const tryDevices = ['mobile', 'tablet', 'desktop'];
    const start = tryDevices.indexOf(activeDevice);
    for (let i = start; i < tryDevices.length; i++) {
        const d = tryDevices[i];
        if (pad[d] && Object.values(pad[d]).some(v => v)) return pad[d];
    }
    return {};
};
```

### D. JSX Editor Side — Device Badge & Label

Display which device is being edited with a colored badge:

```jsx
const DeviceBadge = ({ device }) => (
    <span style={{
        display: 'inline-block', fontSize: '10px', fontWeight: 600,
        textTransform: 'uppercase', letterSpacing: '0.5px',
        background: device === 'desktop' ? '#3858e9' : device === 'tablet' ? '#7b5cf0' : '#f59e0b',
        color: '#fff', padding: '2px 6px', borderRadius: '3px', marginLeft: '6px', verticalAlign: 'middle',
    }}>{device}</span>
);

const RespLabel = ({ label, device }) => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px', fontSize: '11px', fontWeight: 500, color: '#1e1e1e' }}>
        <span>{label} <DeviceBadge device={device} /></span>
    </div>
);
```

### E. PHP Render Side — `<style>` Tag Generation

On the frontend, responsive CSS is injected via a `<style>` tag using a unique class selector. The pattern:

```php
// 1. Generate a unique class per block instance
$uid = 'snn-c-' . uniqid();
$selector = '.' . $uid;

// 2. Build CSS by device: desktop (base rule), tablet + mobile (@media queries)
function snn_block_all_style($attr, $property, $selector, $unit = '') {
    if (empty($attr) || !is_array($attr)) return '';
    $css = '';
    $devices = ['desktop', 'tablet', 'mobile'];
    $breakpoints = [
        'desktop' => '',
        'tablet'  => 'max-width: 1023px',
        'mobile'  => 'max-width: 767px',
    ];
    foreach ($devices as $device) {
        $value = $attr[$device] ?? '';
        if ($value === '' || $value === null || $value === false) continue;
        if ($device === 'desktop') {
            $css .= "{$selector} {{$property}: {$value}{$unit};}\n";
        } else {
            $css .= "@media ({$breakpoints[$device]}) {\n";
            $css .= "\t{$selector} {{$property}: {$value}{$unit};}\n";
            $css .= "}\n";
        }
    }
    return $css;
}

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

- `maxWidth` (Container)
- `tagName` (Text)
- `enableLightbox` (Simple Gallery)
- `bgSize`, `bgPosition`, `bgRepeat` (Section, Container)
- `overflow`, `textTransform`

These use standard `setAttributes({ attrName: value })` without the device routing.

### G. When to Make an Attribute Responsive vs Flat

- **Responsive** (object): Layout properties (display, flex, grid, gap, padding, min-height), colors, typography (font-size, line-height, letter-spacing, font-weight, text-align). These are likely to change between desktop/tablet/mobile.
- **Flat** (string/boolean): Semantic/structural properties (HTML tag, overflow, background image position/size, lightbox toggle). These rarely need per-device differentiation.

---

## 🧠 8. THE OUTPUT PROTOCOL (AI CHECKLIST)

Before giving the user the final code, verify these points silently. If any fail, correct your code before outputting.

1. [ ] **NO IMPORTS:** Are there any `import` statements? *(Delete and use `wp.` destructuring)*.
2. [ ] **NO BUILDS:** Did you create `package.json` or `webpack.config`? *(Delete them).*
3. [ ] **JSX COMPILE:** Did you include the Babel script block in `block.php` with the `$current_screen` guard?
4. [ ] **SECURITY:** Did you use `esc_attr()`, `esc_html()`, or `wp_kses_post()` in the PHP render callback?
5. [ ] **CSS SECURITY:** Are user-controlled values in `<style>` tags sanitized? Strip `<script`, `</style`, `url(`, and `expression(`.
6. [ ] **SELF-REGISTERING:** Does `block.php` call `register_block_type(__DIR__, ...)` on `init`? Do NOT add registration logic to `functions.php` — just `require_once` the block file.
7. [ ] **SAVE FUNCTION:** Does `save: () => { ... }` return only `<InnerBlocks.Content />` or `null`?
8. [ ] **DIV SOUP:** Is `InnerBlocks` wrapped tightly with `useInnerBlocksProps(useBlockProps())` on the primary semantic tag?
9. [ ] **WARNINGS:** Did you add `__next40pxDefaultSize={true}` and `__nextHasNoMarginBottom={true}` to `RangeControl` / `ToggleGroupControl`?
10. [ ] **FALLBACKS:** Is there a `SelectControl` fallback for experimental components?
11. [ ] **RESPONSIVE ATTRIBUTES:** Are styling attributes shaped as `{ desktop, tablet, mobile }` objects? Are `getVal`/`setVal`/`inheritVal`/`inheritPad` helpers defined?
12. [ ] **UNIQUE SELECTORS:** Does the PHP render use `uniqid()` to generate a unique CSS class so multiple instances of the same block don't collide?
13. [ ] **THEME CONSTANTS:** Are frontend asset URLs using `SNN_URL` (not hardcoded paths)?
14. [ ] **DYNAMIC CSS:** Do inline CSS styles map correctly in BOTH the React `edit` preview AND the PHP `render_callback`?

**DELIVERY INSTRUCTIONS:** Output the code as distinct code blocks. Typically 4 files (`block.json`, `block.php`, `editor.jsx`, `block.css`). Include additional frontend JS files (e.g., `lightbox.js`) if the block needs them. Do not omit boilerplate. Provide complete, ready-to-paste files.