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

Every block consists of exactly 4 files inside its directory:

1. `block.json`: Metadata, attributes, and native block supports.
2. `block.php`: PHP registration, SSR render callback, and enqueueing scripts/styles.
3. `editor.jsx`: The block's visual interface in the Gutenberg editor.
4. `block.css`: Styles applied to both the editor and frontend.

Blocks wil live inside the /blocks folder. Register them in the functions.php

---

## 🛡️ 3. DATA FLOW & SECURITY (PHP OUTPUT)

When writing the PHP `render_callback`, you must strictly follow WordPress security standards:

1. **Escape Attributes:** Any dynamic value used inside an HTML attribute must be escaped using `esc_attr()`. (e.g., `style="<?php echo esc_attr($style); ?>"`, `class="<?php echo esc_attr($classes); ?>"`)
2. **Escape URLs:** Any URL must be escaped using `esc_url()`.
3. **Escape Text:** Any dynamic text node must be escaped using `esc_html()`.
4. **Rich Text:** If the attribute contains HTML (like from a `RichText` component), output it using `wp_kses_post()`.
5. **Default Values:** Always provide fallback values when extracting attributes in PHP: `$myVar = $attributes['myVar'] ?? 'default_value';`

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

---

## 🎛 5. EXHAUSTIVE UI COMPONENTS CHEAT SHEET

When building custom Inspector panels, destructure components from the global `wp` object. **DO NOT INVENT COMPONENTS.**

### A. Destructuring Map

```jsx
// React Hooks & Elements
const { Fragment, useState, useEffect, useRef } = wp.element;
// Block Editor Core
const { InspectorControls, BlockControls, useBlockProps, useInnerBlocksProps, InnerBlocks, RichText, MediaUpload, MediaUploadCheck } = wp.blockEditor;
// Standard Components
const { PanelBody, TextControl, TextareaControl, ToggleControl, SelectControl, RangeControl, ColorPalette, Button, __experimentalToggleGroupControl, __experimentalToggleGroupControlOption } = wp.components;
```

### B. Number & Size Controls (Mandatory Flags)

* **`RangeControl`**: **CRITICAL:** Always include `__next40pxDefaultSize={true}` and `__nextHasNoMarginBottom={true}` to prevent console warnings in modern WP.

### C. Advanced / Experimental Controls

* **`ToggleGroupControl`**: Modern button-group style selector.
* **Rule:** Always include a fallback `SelectControl` checking `typeof ToggleGroupControl !== 'undefined'`. Include the `__next` flags.

---

## 🧩 6. IMPLEMENTATION PATTERNS

### A. The Magic JSX/PHP Integration Pattern (Crucial)

In your `block.php` file, this is the **ONLY** way we load React. Do not enqueue standard JS files for the editor.

```php
add_action('enqueue_block_editor_assets', function() {
    add_action('admin_footer', function() {
        $jsx_content = file_get_contents(__DIR__ . '/editor.jsx');
        echo '<script type="text/babel">' . $jsx_content . '</script>';
    });
});
```

### B. Experimental Control Fallback Pattern

```jsx
const hasToggleGroup = typeof ToggleGroupControl !== 'undefined';

{hasToggleGroup ? (
    <ToggleGroupControl
        label="Direction"
        value={attributes.direction}
        onChange={val => setAttributes({ direction: val })}
        isBlock
        __next40pxDefaultSize={true}
        __nextHasNoMarginBottom={true}
    >
        <ToggleGroupControlOption key="row" label="Row" value="row" />
        <ToggleGroupControlOption key="col" label="Col" value="col" />
    </ToggleGroupControl>
) : (
    <SelectControl
        label="Direction"
        value={attributes.direction}
        options={[
            { label: 'Row', value: 'row' },
            { label: 'Column', value: 'col' },
        ]}
        onChange={val => setAttributes({ direction: val })}
    />
)}
```

---

## 🧠 7. THE OUTPUT PROTOCOL (AI CHECKLIST)

Before giving the user the final code, verify these points silently. If any fail, correct your code before outputting.

1. [ ] **NO IMPORTS:** Are there any `import` statements? *(Delete and use `wp.` destructuring)*.
2. [ ] **NO BUILDS:** Did you create `package.json` or `webpack.config`? *(Delete them).*
3. [ ] **JSX COMPILE:** Did you include the `$jsx_content` Babel block in `block.php`?
4. [ ] **SECURITY:** Did you use `esc_attr()`, `esc_html()`, or `wp_kses_post()` in the PHP render callback?
5. [ ] **SAVE FUNCTION:** Does `save: () => { ... }` return only `<InnerBlocks.Content />` or `null`?
6. [ ] **DIV SOUP:** Is `InnerBlocks` wrapped tightly with `useInnerBlocksProps(useBlockProps())` on the primary HTML tag?
7. [ ] **WARNINGS:** Did you add `__next40pxDefaultSize={true}` and `__nextHasNoMarginBottom={true}` to `RangeControl` / `ToggleGroupControl`?
8. [ ] **FALLBACKS:** Is there a `SelectControl` fallback for experimental components?
9. [ ] **DYNAMIC CSS:** Do inline CSS styles map correctly in BOTH the React `edit` preview AND the PHP `render_callback`?

**DELIVERY INSTRUCTIONS:** Output the code as 4 distinct code blocks representing the 4 required files (`block.json`, `block.php`, `editor.jsx`, `block.css`). Do not omit boilerplate. Provide complete, ready-to-paste files.