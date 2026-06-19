# Gutenberg Block Development Reference Guides

> Downloaded from https://github.com/WordPress/gutenberg/tree/trunk/docs/reference-guides

## Table of Contents

- [Block API Reference](#block-api-reference)
- [Registration](#registration)
- [Attributes](#attributes)
- [Supports](#supports)
- [Edit and Save](#edit-and-save)
- [Metadata in block.json](#metadata-in-blockjson)
- [Styles](#styles)
- [Filters](#filters)
- [Theme.json Reference](#themejson-reference)

---

## Block API Reference

Blocks are the fundamental element of the editor. They are the primary way in which plugins and themes can register their own functionality and extend the capabilities of the editor.

Key APIs:
- **Annotations** - Block annotation system
- **API Versions** - Currently v3 (WordPress 6.3+), v2 (WordPress 5.6+), v1
- **Attributes** - Data stored by a block
- **Bindings** - Connect block attributes to external data sources
- **Context** - Pass data between parent/child blocks
- **Deprecation** - Migrate older block versions
- **Edit and Save** - Block rendering in editor vs frontend
- **Metadata** - block.json properties
- **Patterns** - Predefined block layouts
- **Registration** - How to register blocks
- **Selectors** - CSS selectors for blocks
- **Styles** - Block style variations
- **Supports** - Feature flags for block capabilities
- **Templates** - Predefined block templates
- **Transformations** - Convert between block types
- **Variations** - Similar versions of a block

---

## Registration

### `registerBlockType`

Every block starts by registering a new block type definition. The function takes two arguments: a block `name` and a block configuration object.

**Block Name**: `namespace/block-name` (e.g., `my-plugin/book`)

**Block configuration properties:**
- `title` (String, required) - Display title
- `description` (String, optional)
- `category` (String) - text, media, design, widgets, theme, embed
- `icon` (String|Object) - Dashicon or custom SVG
- `keywords` (Array) - Search aliases
- `styles` (Array) - Alternative style variations
- `attributes` (Object) - Data schema
- `example` (Object) - Preview data
- `variations` (Object[]) - Block variations
- `supports` (Object) - Feature flags
- `transforms` (Object) - Conversion rules
- `parent` (Array) - Restrict to parent blocks
- `ancestor` (Array) - Restrict to ancestor blocks
- `allowedBlocks` (Array) - Limit nested blocks
- `blockHooks` (Object) - Auto-insert relative to other blocks

### PHP Registration

```php
register_block_type( __DIR__ . '/build', array(
    'render_callback' => 'render_block_core_notice',
) );
```

---

## Attributes

Block attributes provide information about the data stored by a block.

### Attribute Definition

```json
{
    "attributes": {
        "url": {
            "type": "string",
            "source": "attribute",
            "selector": "img",
            "attribute": "src"
        },
        "content": {
            "type": "string",
            "source": "html",
            "selector": ".content"
        },
        "align": {
            "type": "string"
        }
    }
}
```

### Type Validation
- `string`, `number`, `boolean`, `object`, `array`, `integer`

### Value Sources
- `attribute` - Extract from HTML attribute
- `text` - Extract inner text
- `html` - Extract inner HTML
- `rich-text` - Extract rich text content
- `query` - Extract array from repeated elements
- `raw` - Raw HTML (no processing)
- (none) - Serialized to block comment delimiter

### Default Value
```json
{
    "type": "string",
    "default": "hello world"
}
```

### Role
- `content` - User-editable content
- `local` - Temporary, non-persistable (ignored by serializer)

---

## Supports

Block Supports API allows a block to declare support for certain features. Opting into any of these features registers additional attributes and provides UI controls.

### Available Supports

| Support | Type | Default | Description |
|---------|------|---------|-------------|
| `anchor` | boolean | false | HTML anchor/id |
| `align` | boolean/array | false | Alignment options |
| `alignWide` | boolean | true | Wide/full alignment |
| `ariaLabel` | boolean | false | ARIA label |
| `background` | object | - | Background image support |
| `className` | boolean | true | Additional CSS class |
| `color` | object | - | Color controls |
| `customClassName` | boolean | true | Custom CSS class |
| `dimensions` | object | - | aspectRatio, height, minHeight, width |
| `filter` | object | - | duotone filter |
| `html` | boolean | true | HTML editing mode |
| `inserter` | boolean | true | Show in inserter |
| `interactivity` | object | - | Client-side interactivity |
| `layout` | boolean/object | false | Layout controls |
| `multiple` | boolean | true | Allow multiple instances |
| `renaming` | boolean | true | Allow renaming |
| `reusable` | boolean | true | Allow reusable blocks |
| `shadow` | boolean | false | Shadow support |
| `spacing` | object | - | margin, padding, blockGap |
| `typography` | object | - | fontSize, lineHeight, etc. |
| `splitting` | boolean | false | Block splitting |
| `visibility` | boolean | true | Visibility controls |

### Color Support
```json
{
    "supports": {
        "color": {
            "background": true,
            "text": true,
            "gradients": false,
            "link": false,
            "button": false,
            "heading": false,
            "enableContrastChecker": true
        }
    }
}
```

### Spacing Support
```json
{
    "supports": {
        "spacing": {
            "margin": true,
            "padding": true,
            "blockGap": true
        }
    }
}
```

### Typography Support
```json
{
    "supports": {
        "typography": {
            "fontSize": true,
            "lineHeight": true,
            "textAlign": true
        }
    }
}
```

---

## Edit and Save

### Edit function
Describes the block structure in the editor context.

```jsx
edit: ( { attributes, setAttributes, isSelected } ) => {
    const blockProps = useBlockProps();
    return <div { ...blockProps }>Your block.</div>;
}
```

### Save function
Defines how attributes combine into final markup for `post_content`.

```jsx
save: ( { attributes } ) => {
    const blockProps = useBlockProps.save();
    return <div { ...blockProps }>{ attributes.content }</div>;
}
```

For **dynamic blocks** (server-side rendered), `save` returns `null` or `<InnerBlocks.Content />`.

### Key Props
- `attributes` - All registered attributes and their values
- `setAttributes` - Function to update attributes (supports updater function since WP 6.9)
- `isSelected` - Whether block is currently selected
- `innerBlocks` - Nested block representations

---

## Metadata in block.json

Complete list of block.json properties:

| Property | Type | Required |
|----------|------|----------|
| `apiVersion` | number | No (default: 1) |
| `name` | string | Yes |
| `title` | string | Yes |
| `category` | string | Yes |
| `parent` | string[] | No |
| `ancestor` | string[] | No |
| `allowedBlocks` | string[] | No |
| `icon` | string/object | No |
| `description` | string | No |
| `keywords` | string[] | No |
| `version` | string | No |
| `textDomain` | string | No |
| `attributes` | object | No |
| `providesContext` | object | No |
| `usesContext` | string[] | No |
| `selectors` | object | No |
| `supports` | object | No |
| `styles` | array | No |
| `example` | object | No |
| `variations` | object[] | No |
| `blockHooks` | object | No |
| `editorScript` | string | No |
| `script` | string | No |
| `viewScript` | string/array | No |
| `viewScriptModule` | string | No |
| `editorStyle` | string | No |
| `style` | string | No |
| `viewStyle` | string/array | No |
| `render` | string | No |

---

## Styles

Block Styles allow alternative styles to be applied to existing blocks.

### Register Block Style (JS)
```js
wp.blocks.registerBlockStyle( 'core/quote', {
    name: 'fancy-quote',
    label: 'Fancy Quote',
} );
```

### Register Block Style (PHP)
```php
register_block_style(
    'core/quote',
    array(
        'name'         => 'blue-quote',
        'label'        => __( 'Blue Quote', 'textdomain' ),
        'inline_style' => '.wp-block-quote.is-style-blue-quote { color: blue; }',
    )
);
```

---

## Filters

### Block Filters
- `block_type_metadata` - Filter block metadata during registration (PHP)
- `block_type_metadata_settings` - Filter block settings (PHP)
- `register_block_type_args` - Filter block type args (PHP)
- `blocks.registerBlockType` - Filter block settings (JS)
- `blocks.getSaveElement` - Filter save element
- `blocks.getSaveContent.extraProps` - Filter save content props
- `blocks.getBlockDefaultClassName` - Filter default class name
- `blocks.switchToBlockType.transformedBlock` - Filter transformed block
- `blocks.getBlockAttributes` - Filter block attributes
- `editor.BlockEdit` - Filter block edit component
- `editor.BlockListBlock` - Filter block list item

---

## Theme.json Reference

Theme.json Versions: v3 (latest), v2, v1

Key settings: color, typography, spacing, layout, blocks, styles

---

*Source: https://github.com/WordPress/gutenberg/tree/trunk/docs/reference-guides*
