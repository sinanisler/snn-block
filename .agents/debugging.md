# 🐛 Debugging Guide — SNN Block Editor Controls

> **AI AGENT NOTE:** This guide documents real bugs discovered, their root causes, diagnostic techniques, and fixes. Read this BEFORE touching any block editor control code.

---

## 📋 Table of Contents

1. [Diagnostic Toolkit](#1-diagnostic-toolkit)
2. [Bug #1: Empty Objects Serialized as Empty Arrays `[]`](#2-bug-1-empty-objects-serialized-as-empty-arrays-)
3. [Bug #2: Editor Preview Styles Missing for Most Controls](#3-bug-2-editor-preview-styles-missing-for-most-controls)
4. [Bug #3: Border Style Not Set When Width is Set](#4-bug-3-border-style-not-set-when-width-is-set)
5. [Bug #4: Document Overview Confusion — Section vs Container](#5-bug-4-document-overview-confusion--section-vs-container)
6. [Prevention Checklist for New Controls](#6-prevention-checklist-for-new-controls)

---

## 1. Diagnostic Toolkit

### 1.1 Checking Block Attributes at Runtime

Open the browser DevTools console on the WordPress editor page and run:

```js
// Get the selected block's full attributes
const { select } = wp.data;
const id = select('core/block-editor').getSelectedBlockClientId();
const block = select('core/block-editor').getBlock(id);
console.log(block.attributes);

// Check attribute TYPES ([] vs {})
Object.entries(block.attributes).forEach(([k, v]) => {
    console.log(k, Array.isArray(v) ? 'ARRAY' : typeof v, v);
});
```

**Red flag:** If you see `"type": "object"` attributes showing as `[]` (array), see [Bug #1](#2-bug-1-empty-objects-serialized-as-empty-arrays-).

### 1.2 Checking the Rendered Preview Style

```js
// Inside the editor iframe canvas
const iframe = document.querySelector('iframe[name="editor-canvas"]');
const frame = iframe.contentWindow;
const el = frame.document.querySelector('.wp-block-snn-container'); // or .wp-block-snn-section
console.log(el.style.cssText);  // Full inline style
```

### 1.3 Verifying WP Data Store Availability

```js
// Check which stores and methods exist
console.log(!!wp.data.select('core/editor')?.getDeviceType);     // WP ≥ 6.5
console.log(!!wp.data.select('core/edit-post')?.__experimentalGetPreviewDeviceType); // older
console.log(!!wp.data.select('core/block-editor')?.getSelectedBlockClientId);
```

### 1.4 Checking SNNControls Load State

```js
console.log('SNNControls keys:', Object.keys(window.SNNControls || {}));
console.log('Count:', Object.keys(window.SNNControls || {}).length);
// Expected: 39 keys (as of 2026-06-24)
```

### 1.5 Babel Compilation Errors

Babel errors appear in the console prefixed with the Babel warning but are sometimes swallowed. Look for:
- `The specified value "#xxx" does not conform to the required format` — color input validation warnings (harmless)
- `Unexpected token` — syntax error in JSX
- Silent failures — if a block doesn't render at all, check the `id="snn-controls"` script for syntax errors

---

## 2. Bug #1: Empty Objects Serialized as Empty Arrays `[]`

### Symptom
Controls save correctly when you interact with them, but new blocks have all object-type attributes initialized as `[]` (empty arrays) instead of `{}` (empty objects). This causes the `useResponsiveAttributes` hook to fail silently — `inheritVal` returns fallback values, so the preview works by accident, but attribute writes may behave unexpectedly.

### Discovery Method
Ran `wp.data.select('core/block-editor').getBlock(id).attributes` in the console and noticed:
```
border: []         // should be {}
padding: []        // should be {}
textColor: []      // should be {}
display: []        // should be {}
```
Only attributes that had been explicitly set by user interaction (e.g., `bgColor`, `border.width`) had proper object shapes.

### Root Cause
WordPress's block comment delimiter serializes `"default": {}` (block.json default value) as `[]` in the JSON comment when the block is first loaded from saved content. This is a long-standing WordPress core quirk — when no values have been set, empty objects may serialize as empty arrays in the block delimiter comment.

### Fix — `blocks/controls/responsive-hooks.js`

Added a normalization helper that ALL attribute-reading functions use:

```javascript
// Normalize helper: ensure attribute is an object, not an array.
// WP may serialize empty objects {} as [] in block delimiter comments.
const obj = (attr) => {
    const v = attributes[attr];
    if (Array.isArray(v)) return {};
    if (!v || typeof v !== 'object') return {};
    return v;
};
```

Then updated every function to use it:
- `getVal(attr)` → `const o = obj(attr); return o[activeDevice] || '';`
- `setVal(attr, value)` → `const o = obj(attr); setAttributes({ [attr]: { ...o, [activeDevice]: value } });`
- `inheritVal(attr, fallback)` → `const val = obj(attr); ...`
- `getSides(attr)` / `setSides(attr)` / `inheritSides(attr)` → same pattern
- `getBorderWidth()` / `setBorderWidth()` / `getBorderRadius()` / `setBorderRadius()` → guard with `Array.isArray(attributes.border)`

### Verification
After the fix, checked the block attributes in the console — newly set values like `padding: { desktop: '10px' }` persisted correctly, and the preview styles applied properly to the editor canvas.

---

## 3. Bug #2: Editor Preview Styles Missing for Most Controls

### Symptom
Controls in the inspector sidebar worked (values were saved to attributes), but the **editor preview** (what you see in the canvas) didn't update. The frontend rendered correctly because PHP generates CSS from the saved attributes. Only basic properties like `backgroundColor` and `backgroundImage` showed in the preview.

### Discovery Method
Compared the `previewStyles` object in `container/editor.jsx` against the full list of controls rendered in `<InspectorControls>`. Found that ~15 CSS properties were never added to `previewStyles`.

### Properties That Were Missing

| Control | CSS Property | Container | Section |
|---------|-------------|:---------:|:-------:|
| Margin inputs | `margin-top/right/bottom/left` | ❌ | ❌ |
| Border control | `border-style/width/color` | ❌ | ❌ |
| Border radius | `border-top-left-radius` etc. | ❌ | ❌ |
| Box shadow | `box-shadow` | ❌ | ❌ |
| CSS filters | `filter` | ❌ | ❌ |
| CSS transform | `transform` | ❌ | ❌ |
| Opacity slider | `opacity` | ❌ | ❌ |
| Blend mode | `mix-blend-mode` | ❌ | ❌ |
| Position/offsets | `position/top/right/bottom/left` | ❌ | ❌ |
| Z-index | `z-index` | ❌ | ❌ |
| Font family | `font-family` | N/A | ❌ |
| Font size | `font-size` | N/A | ❌ |
| Font weight | `font-weight` | N/A | ❌ |
| Line height | `line-height` | N/A | ❌ |
| Letter spacing | `letter-spacing` | N/A | ❌ |
| Text transform | `text-transform` | N/A | ❌ |

### Fix — `blocks/container/editor.jsx` and `blocks/section/editor.jsx`

Added comprehensive CSS generation for each missing property to the `previewStyles` object, using the same logic as `block-helpers.php` for consistency:

```javascript
// Border preview
const border = (Array.isArray(attributes.border) ? {} : (attributes.border || {}));
const bw = getBorderWidth();
const hasBorderWidth = bw.top || bw.right || bw.bottom || bw.left;
const borderStyle = border.style || (hasBorderWidth ? 'solid' : '');
if (borderStyle && borderStyle !== 'none') {
    previewStyles.borderStyle = borderStyle;
    if (bw.top) previewStyles.borderTopWidth = bw.top;
    // ... etc
}

// Box Shadow preview
if (attributes.boxShadow && attributes.boxShadow.length > 0) {
    previewStyles.boxShadow = attributes.boxShadow.map(s => {
        const inset = (s.type || 'drop') === 'inner' ? 'inset ' : '';
        return `${inset}${s.x||'0'} ${s.y||'0'} ${s.blur||'0'} ${s.spread||'0'} ${s.color||'rgba(0,0,0,0.2)'}`;
    }).join(', ');
}

// Filter preview
const filterMap = {blur:'blur(%spx)', brightness:'brightness(%s%%)', /* ... */};
// Build CSS filter string from attribute object

// Transform preview
const transformParts = [];
// Build translate/scale/rotate/skew CSS functions
```

### Verification
Set each property via `dispatch('core/block-editor').updateBlockAttributes()` and checked `el.style.cssText` in the iframe canvas. All properties now appear in the inline style.

---

## 4. Bug #3: Border Style Not Set When Width is Set

### Symptom
Setting border width values (e.g., "2px") in the inspector did NOT show a border preview in the editor. The border only appeared if the user also changed the border style dropdown (which defaults to "Solid" visually but hasn't been committed to the attribute).

### Root Cause
The `BorderControl` component renders a `<select>` with `value={style || 'solid'}`, so it **displays** "Solid" by default. But `onStyleChange` only fires when the user manually changes the dropdown — the `attributes.border.style` attribute remains unset. The preview code checked `if (border.style && border.style !== 'none')`, which was `false` because `style` was undefined.

### Fix — Three Locations

**1. `blocks/container/editor.jsx` and `blocks/section/editor.jsx` (preview)**

Default style to `'solid'` when border widths exist but no style is set:
```javascript
const borderStyle = border.style || (hasBorderWidth ? 'solid' : '');
```

**2. `blocks/block-helpers.php` (frontend render)**

Same logic for the PHP CSS generator:
```php
$has_width = !empty($border['width']);
if (!$style && $has_width) $style = 'solid';
```

---

## 5. Bug #4: Document Overview Confusion — Section vs Container

### Symptom
Both Section and Container blocks have nearly identical inspector controls (Device Switcher, Display, Spacing, Sizing, Background, Border, Effects, Position, Advanced). When editing, it's easy to be confused about which block type is currently selected.

### Fix — Workflow
Always keep the **Document Overview** (List View) panel open in the WordPress editor sidebar. Click the "Document Overview" button in the top toolbar (icon: three horizontal lines). This shows the full block tree:
```
📄 Section
  ├─ 📦 Container
  │   ├─ ¶ Paragraph
  │   ├─ ¶ Paragraph
  │   └─ ...
```

The selected block is highlighted blue. You can click any block in this tree to select it, and the tree auto-expands to show context.

---

## 6. Prevention Checklist for New Controls

When adding a new visual control to any block, verify ALL of these:

### 6.1 Attribute Definition (`block.json`)
- [ ] Attribute type matches the data shape (`object`, `array`, `string`)
- [ ] Default value matches the expected shape (`{}` for objects, `[]` for arrays, `""` for strings)
- [ ] For responsive objects: `{ "type": "object", "default": {} }`

### 6.2 Inspector Control (`editor.jsx`)
- [ ] Control calls `setAttributes()` or `setVal()` correctly
- [ ] Control reads current value from the attribute (not a local state that diverges)
- [ ] If using `setVal`, the attribute must be a responsive object `{ desktop, tablet, mobile }`
- [ ] If using `setAttributes`, the top-level attribute name must match `block.json`

### 6.3 Editor Preview (`editor.jsx` — `previewStyles` object)
- [ ] CSS property is added to `previewStyles` when the attribute has a value
- [ ] Guard against `[]` arrays: `Array.isArray(attributes.xyz) ? {} : (attributes.xyz || {})`
- [ ] CSS property names use camelCase for React inline styles
- [ ] Values are converted to valid CSS strings (e.g., box shadow array → string, filter object → string)

### 6.4 Frontend Render (`block.php` + `block-helpers.php`)
- [ ] PHP extracts attribute with `??` default: `$myAttr = $attributes['myAttr'] ?? '';`
- [ ] CSS is generated via `block-helpers.php` helpers (or new helper if needed)
- [ ] If using a new pattern, add a helper to `block-helpers.php` (don't inline CSS logic)
- [ ] Unique class selector (`.$uid`) is used for scoping

### 6.5 Responsive vs Non-Responsive
- [ ] **Responsive** (needs `getVal`/`setVal`): font size, padding, margin, text align, display, gap, sizing, colors
- [ ] **Non-responsive** (uses `attributes.xxx` directly): opacity, blend mode, position, z-index, box shadow, filters, transform, visibility, custom CSS

### 6.6 Test That It Actually Works
- [ ] Open browser DevTools console
- [ ] Set the control value in the inspector
- [ ] Run: `wp.data.select('core/block-editor').getBlock(wp.data.select('core/block-editor').getSelectedBlockClientId()).attributes` — verify the attribute is saved
- [ ] In the iframe canvas: `document.querySelector('.wp-block-snn-xxx').style.cssText` — verify the CSS property appears
- [ ] Save the post, reload, and verify the value persists (frontend and editor)

---

## 📝 Quick Debug Snippets

Paste these in the browser console while on the WordPress editor page:

```js
// === BLOCK INSPECTION ===
const { select, dispatch } = wp.data;
const id = select('core/block-editor').getSelectedBlockClientId();
const block = select('core/block-editor').getBlock(id);
console.log('Block:', block.name);
console.log('Attributes:', block.attributes);

// === FIND ARRAY-TYPED ATTRIBUTES (should be objects) ===
Object.entries(block.attributes).forEach(([k, v]) => {
    if (Array.isArray(v) && v.length === 0) console.warn(`⚠ ${k} is [] — should be {}`);
});

// === CHECK PREVIEW STYLE ===
const iframe = document.querySelector('iframe[name="editor-canvas"]');
const el = iframe.contentDocument.querySelector(`[class*="snn-"]`);
console.log('Preview style:', el?.style.cssText);

// === DIRECTLY SET AN ATTRIBUTE (for testing) ===
dispatch('core/block-editor').updateBlockAttributes(id, {
    opacity: '0.5',
    boxShadow: [{ type: 'drop', x: '4px', y: '4px', blur: '12px', spread: '0px', color: '#00000040' }],
    filter: { blur: '3', brightness: '120' },
    transform: { rotate: '5deg', scaleX: '1.05', scaleY: '1.05' },
});

// === CHECK IF SNN CONTROLS LOADED ===
console.log('SNNControls:', Object.keys(window.SNNControls || {}));
// Expected: 39 keys as of 2026-06-24
```
