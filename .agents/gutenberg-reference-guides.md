# Gutenberg Block Development Reference Guides

> Downloaded from https://github.com/WordPress/gutenberg/tree/trunk/docs/reference-guides
> Compiled on 2026-06-19

## Table of Contents

1. [Block API Reference](#1-block-api-reference)
   - [Annotations](#11-annotations)
   - [API Versions](#12-api-versions)
   - [Attributes](#13-attributes)
   - [Bindings](#14-bindings)
   - [Context](#15-context)
   - [Deprecation](#16-deprecation)
   - [Edit and Save](#17-edit-and-save)
   - [Metadata (block.json)](#18-metadata-blockjson)
   - [Patterns](#19-patterns)
   - [Registration](#110-registration)
   - [Selectors](#111-selectors)
   - [Styles](#112-styles)
   - [Supports](#113-supports)
   - [Templates](#114-templates)
   - [Transformations](#115-transformations)
   - [Variations](#116-variations)
2. [Hooks (Filters) Reference](#2-hooks-filters-reference)
   - [Block Filters](#21-block-filters)
   - [Editor Hooks](#22-editor-hooks)
   - [i18n Hooks](#23-i18n-hooks)
   - [Parser Filters](#24-parser-filters)
   - [Autocomplete Filters](#25-autocomplete-filters)
   - [Global Styles Filters](#26-global-styles-filters)
3. [SlotFills Reference](#3-slotfills-reference)
4. [Theme.json Reference](#4-themejson-reference)
   - [Version 3 (latest)](#41-version-3-latest)
   - [Version 2](#42-version-2)
   - [Version 1](#43-version-1)
   - [Migrating to Newer Versions](#44-migrating-to-newer-versions)
5. [RichText Reference](#5-richtext-reference)
6. [Component Reference](#6-component-reference)
7. [Package Reference](#7-package-reference)
8. [Data Module Reference](#8-data-module-reference)
   - [core: WordPress Core Data](#81-core-wordpress-core-data)
   - [core/block-editor: The Block Editor's Data](#82-coreblock-editor-the-block-editors-data)
   - [core/editor: The Post Editor's Data](#83-coreeditor-the-post-editors-data)
   - [Other Data Modules](#84-other-data-modules)

---

# 1. Block API Reference

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

## 1.1 Annotations

> **Note:** This API is experimental, meaning it is subject to non-backward compatible changes or removal in any future version.

Annotations are a way to highlight a specific piece in a post created with the block editor. Examples include commenting on a piece of text and spellchecking. Both can use the annotations API to mark a piece of text.

### API

```js
wp.data.dispatch( 'core/annotations' ).addAnnotation( {
    source: 'my-annotations-plugin',
    blockClientId: wp.data.select( 'core/block-editor' ).getBlockOrder()[ 0 ],
    richTextIdentifier: 'content',
    range: {
        start: 50,
        end: 100,
    },
} );
```

The property `richTextIdentifier` is the identifier of the RichText instance the annotation applies to. The Paragraph block only has a single RichText instance with the identifier `content`. The Quote block type has 2 RichText instances (`citation` and `value`).

### Block Annotation

Annotate a complete block by providing the `selector` property set to `block`:

```js
wp.data.dispatch( 'core/annotations' ).addAnnotation( {
    source: 'my-annotations-plugin',
    blockClientId: wp.data.select( 'core/block-editor' ).getBlockOrder()[ 0 ],
    selector: 'block',
} );
```

CSS styling:
```css
.is-annotated-by-my-annotations-plugin {
    outline: 1px solid black;
}
```

### Text Annotation

Controlled by `start` and `end` properties, assumed to be offsets within the `rich-text` internal structure.

---

## 1.2 API Versions

### Version 3 (>= WordPress 6.3)
- The post editor will be iframed if all registered blocks have a Block API version 3 or higher.
- Adding version 3 support means the block should work inside an iframe.
- **In WordPress 7.0, the post editor is planned to always work as an iframe.**
- Block authors must use `useBlockProps()` hook for the block's `edit` implementation.
- Block authors must explicitly use `useBlockProps.save()` for static block saved markup.

### Version 2 (>= WordPress 5.6)
- Block author must use the `useBlockProps()` hook to render the block element wrapper for `edit`.
- Generated class names and styles are no longer added automatically to saved markup for static blocks. Block author must explicitly use `useBlockProps.save()`.

### Version 1
Initial version.

---

## 1.3 Attributes

Block attributes provide information about the data stored by a block. For example, rich content, a list of image URLs, a background color, or a button title.

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
- `null`, `boolean`, `object`, `array`, `string`, `integer`, `number`

### Enum Validation

```js
{
    size: {
        enum: [ 'large', 'small', 'tiny' ]
    }
}
```

### Value Sources

| Source | Description |
|--------|-------------|
| *(none)* | Data stored in block's comment delimiter |
| `attribute` | Data stored in an HTML element attribute |
| `text` | Data stored in HTML text (innerText) |
| `html` | Data stored in HTML (innerHTML) |
| `query` | Data stored as an array of objects |
| `meta` | Data stored in post meta (deprecated) |

#### `attribute` source
Uses `selector` + `attribute` to extract from HTML. Example:

```js
{
    url: {
        type: 'string',
        source: 'attribute',
        selector: 'img',
        attribute: 'src',
    }
}
```

For boolean attributes (e.g., `disabled`), use `type: 'boolean'`.

#### `text` source
Extracts inner text from markup using `textContent`.

#### `html` source
Extracts inner HTML from markup using `innerHTML`.

#### `query` source
Extracts an array of values from markup. Nested attribute definitions.

```js
{
    images: {
        type: 'array',
        source: 'query',
        selector: 'img',
        query: {
            url: { type: 'string', source: 'attribute', attribute: 'src' },
            alt: { type: 'string', source: 'attribute', attribute: 'alt' },
        }
    }
}
```

#### Meta source (deprecated)
```js
{
    author: {
        type: 'string',
        source: 'meta',
        meta: 'author'
    }
}
```

### Default Value

```js
{
    type: 'string',
    default: 'hello world'
}
```

### Role

| Role | Description |
|------|-------------|
| `content` | User-editable content; enables privileged editing in content-only locking |
| `local` | Temporary, non-persistable; ignored by the Block Serializer |

---

## 1.4 Bindings

Block Bindings API allows connecting block attributes to external data sources. This enables blocks to display dynamic content from sources like post meta, site settings, or custom data stores without custom PHP rendering.

_(See the [Block Bindings documentation](https://github.com/WordPress/gutenberg/blob/trunk/docs/reference-guides/block-api/block-bindings.md) for full details.)_

---

## 1.5 Context

Block context enables ancestor blocks to provide values which can be consumed by descendent blocks within its own hierarchy. Those descendent blocks can inherit these values without hard-coded values.

### Defining Block Context

#### Providing Block Context
A block provides a context value by assigning a `providesContext` property in its registered settings. This maps a context name to one of the block's own attributes.

```js
attributes: {
    recordId: { type: 'number' },
},
providesContext: {
    'my-plugin/recordId': 'recordId',
},
```

Include a namespace in the context key to avoid conflicts.

#### Consuming Block Context
A block inherits a context value from an ancestor provider by assigning a `usesContext` property.

```js
registerBlockType('my-plugin/record-title', {
    title: 'Record Title',
    category: 'widgets',
    usesContext: ['my-plugin/recordId'],
});
```

### Using Block Context

**JavaScript:**
```js
edit({ context }) {
    return 'The record ID: ' + context['my-plugin/recordId'];
}
```

**PHP:**
```php
register_block_type( 'my-plugin/record-title', array(
    'render_callback' => function( $attributes, $content, $block ) {
        return 'The current record ID is: ' . $block->context['my-plugin/recordId'];
    },
) );
```

---

## 1.6 Deprecation

When updating static blocks markup and attributes, block authors need to consider existing posts using the old versions of their block.

### Deprecation Object Properties
- `attributes` (Object): Attributes definition of the deprecated form
- `supports` (Object): Supports definition of the deprecated form
- `save` (Function): Save implementation of the deprecated form
- `migrate` (Function, Optional): Given old attributes and inner blocks, returns new attributes or a tuple `[attributes, innerBlocks]`
- `isEligible` (Function, Optional): Returns `true` if the deprecation can handle the block migration

### How Deprecations Work

1. If the current `save` method does not produce a valid block, the first deprecation is tried
2. If its `save` produces valid content, that deprecation is used to parse attributes; `migrate` is run if present
3. If the first deprecation's `save` does not produce a valid block, subsequent deprecations are tried
4. Attributes (and innerBlocks) from the first valid deprecation are passed to the current `save`

### Example - Changing Attributes

```js
registerBlockType( 'gutenberg/block-with-deprecated-version', {
    attributes: { content: { type: 'string', default: 'some random value' } },
    save( props ) { return <div>{ props.attributes.content }</div>; },
    deprecated: [ {
        attributes: { text: { type: 'string', default: 'some random value' } },
        migrate( { text } ) { return { content: text }; },
        save( props ) { return <p>{ props.attributes.text }</p>; },
    } ],
} );
```

### Changing InnerBlocks

```js
deprecated: [ {
    attributes: { title: { type: 'string', source: 'html', selector: 'p' } },
    migrate( attributes, innerBlocks ) {
        const { title, ...restAttributes } = attributes;
        return [
            restAttributes,
            [ createBlock( 'core/paragraph', { content: attributes.title, fontSize: 'large' } ), ...innerBlocks ],
        ];
    },
    save( props ) { return <p>{ props.attributes.title }</p>; },
} ]
```

---

## 1.7 Edit and Save

The `edit` function describes the structure of your block in the context of the editor. The `save` function defines how attributes combine into final markup serialized into `post_content`.

### Edit Function

```jsx
import { useBlockProps } from '@wordpress/block-editor';

const blockSettings = {
    apiVersion: 3,
    edit: () => {
        const blockProps = useBlockProps();
        return <div { ...blockProps }>Your block.</div>;
    },
};
```

#### Key Props
- `attributes` - All registered attributes and their values
- `setAttributes` - Function to update attributes (supports updater function since WP 6.9)
- `isSelected` - Whether block is currently selected

#### setAttributes with updater function (WP 6.9+)

```js
const toggleSetting = () =>
    setAttributes( ( currentAttr ) => ( {
        mySetting: ! currentAttr.mySetting,
    } ) );
```

### Save Function

```jsx
save: () => {
    const blockProps = useBlockProps.save();
    return <div { ...blockProps }> Your block. </div>;
};
```

For **dynamic blocks** (server-side rendered), `save` returns `null`:

```jsx
save: () => {
    return null;
}
```

### Validation

When the editor loads, all blocks within post content are validated. If the newly-generated markup doesn't match what was already stored in post content, the block is marked as invalid.

---

## 1.8 Metadata (block.json)

Starting with WordPress 5.8, we recommend using the `block.json` metadata file as the canonical way to register block types.

```json
{
    "$schema": "https://schemas.wp.org/trunk/block.json",
    "apiVersion": 3,
    "name": "my-plugin/notice",
    "title": "Notice",
    "category": "text",
    "icon": "star",
    "description": "Shows warning, error or success notices...",
    "keywords": [ "alert", "message" ],
    "version": "1.0.3",
    "textdomain": "my-plugin",
    "attributes": {
        "message": { "type": "string", "source": "html", "selector": ".message" }
    },
    "supports": { "align": true },
    "editorScript": "file:./index.js",
    "style": [ "file:./style.css" ],
    "render": "file:./render.php"
}
```

### Complete block.json Properties

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

### Asset Definitions

**WPDefinedPath**: A path to a JS, CSS, or PHP file relative to `block.json`, prefixed with `file:`:
```json
{ "render": "file:./render.php" }
```

**WPDefinedAsset**: Extends WPDefinedPath. Can be a file path, handle, or object with `handle`, `dependencies`, and `version`.

### Internationalization

Translatable properties (`title`, `description`, `keywords`) are automatically wrapped in `_x()` calls. Set `textdomain` in `block.json`.

---

## 1.9 Patterns

Block Patterns are predefined block layouts available from the patterns tab of the block inserter.

### register_block_pattern

```php
register_block_pattern(
    'my-plugin/my-awesome-pattern',
    array(
        'title'       => __( 'Two buttons', 'my-plugin' ),
        'description' => _x( 'Two horizontal buttons...', 'Block pattern description', 'my-plugin' ),
        'content'     => '<!-- wp:buttons --><div class="wp-block-buttons"><!-- wp:button -->...',
        'categories'  => array( 'buttons' ),
        'keywords'    => array( 'button', 'action' ),
        'viewportWidth' => 800,
        'blockTypes'  => array( 'core/button' ),
        'postTypes'   => array( 'post', 'page' ),
        'inserter'    => true,
        'source'      => 'plugin',
    )
);
```

Properties: `title` (required), `content` (required), `description`, `categories`, `keywords`, `viewportWidth`, `blockTypes`, `postTypes`, `templateTypes`, `inserter`, `source`.

### Pattern Categories

```php
register_block_pattern_category(
    'hero',
    array( 'label' => __( 'Hero', 'my-plugin' ) )
);
```

---

## 1.10 Registration

### `registerBlockType`

Every block starts by registering a new block type definition. The function takes two arguments: a block `name` and a block configuration object.

```js
registerBlockType( 'my-plugin/book', {
    title: __( 'Book' ),
    category: 'widgets',
    icon: 'book-alt',
    keywords: [ __( 'image' ), __( 'photo' ) ],
} );
```

**Block Name**: `namespace/block-name` (e.g., `my-plugin/book`). Must contain only lowercase alphanumeric characters and dashes, must begin with a letter.

#### Block Configuration Properties
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

### Block Collections

```js
registerBlockCollection( 'my-plugin', {
    title: 'My Plugin',
    icon: 'smile',
} );
```

### PHP Registration

```php
register_block_type( __DIR__ . '/build', array(
    'render_callback' => 'render_block_core_notice',
) );
```

---

## 1.11 Selectors

Block Selectors API allows blocks to customize the CSS selector used when their styles are generated.

### Root Selector

```json
{
    "selectors": {
        "root": ".my-custom-block-selector"
    }
}
```

### Feature Selectors

```json
{
    "selectors": {
        "root": ".my-custom-block-selector",
        "color": ".my-custom-block-selector",
        "typography": ".my-custom-block-selector > h2"
    }
}
```

### Subfeature Selectors

```json
{
    "selectors": {
        "root": ".my-custom-block-selector",
        "typography": {
            "root": ".my-custom-block-selector > h2",
            "text-decoration": ".my-custom-block-selector > h2 span"
        }
    }
}
```

### Fallbacks
A selector that hasn't been configured for a specific feature will fall back to the block's root selector.

---

## 1.12 Styles

Block Styles allow alternative styles to be applied to existing blocks. They work by adding a className to the block's wrapper.

### Client-side Registration

```js
wp.blocks.registerBlockStyle( 'core/quote', {
    name: 'fancy-quote',
    label: 'Fancy Quote',
} );
```

### Server-side Registration

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

**Properties**: `name` (required), `label` (required), and one of: `inline_style`, `style_handle`, or `style_data` (theme.json-like array, added in WP 6.6).

### Unregistering

```js
wp.blocks.unregisterBlockStyle( 'core/quote', 'large' );
```

```php
unregister_block_style( 'core/quote', 'fancy-quote' );
```

---

## 1.13 Supports

Block Supports is the API that allows a block to declare support for certain features. Opting into any of these features registers additional attributes and provides UI controls.

| Support | Type | Default | Description |
|---------|------|---------|-------------|
| `anchor` | boolean | false | HTML anchor/id |
| `align` | boolean/array | false | Alignment options |
| `alignWide` | boolean | true | Wide/full alignment |
| `allowedBlocks` | boolean | false | Allow selecting child blocks (WP 6.9) |
| `ariaLabel` | boolean | false | ARIA label |
| `autoRegister` | boolean | false | PHP-only blocks auto-register |
| `background` | object | - | Background image support |
| `className` | boolean | true | Additional CSS class |
| `color` | object | - | Color controls |
| `contentRole` | boolean | false | Mark block as content (WP 6.9) |
| `customClassName` | boolean | true | Custom CSS class |
| `dimensions` | object | - | aspectRatio, height, minHeight, minWidth, width |
| `filter` | object | - | duotone filter |
| `html` | boolean | true | HTML editing mode |
| `inserter` | boolean | true | Show in inserter |
| `interactivity` | object | - | Client-side interactivity |
| `layout` | boolean/object | false | Layout controls |
| `listView` | boolean | false | List View panel (WP 7.0) |
| `lock` | boolean | true | Allow locking UI |
| `multiple` | boolean | true | Allow multiple instances |
| `position` | object | - | sticky position |
| `renaming` | boolean | true | Allow renaming |
| `reusable` | boolean | true | Allow reusable blocks |
| `shadow` | boolean | false | Shadow support |
| `spacing` | object | - | margin, padding, blockGap |
| `splitting` | boolean | false | Block splitting |
| `typography` | object | - | fontSize, lineHeight, textAlign |
| `visibility` | boolean | true | Visibility controls (WP 6.9) |

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

Sides can be restricted: `margin: [ 'top', 'bottom' ]`, `padding: true`, `blockGap: [ 'horizontal', 'vertical' ]`.

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

## 1.14 Templates

A block template is defined as a list of block items with predefined attributes, placeholder content, etc.

### PHP Example

```php
function myplugin_register_template() {
    $post_type_object = get_post_type_object( 'post' );
    $post_type_object->template = array(
        array( 'core/image' ),
    );
}
add_action( 'init', 'myplugin_register_template' );
```

### Locking

```php
$post_type_object->template_lock = 'all';
```

Options: `contentOnly` (prevents all operations, hides non-content blocks), `all` (prevents all operations), `insert` (prevents insert/remove).

### Individual Block Locking

```js
attributes: {
    lock: {
        remove: true,
        move: true,
    }
}
```

### Nested Templates

```php
$template = array(
    array( 'core/paragraph', array( 'placeholder' => 'Add root paragraph' ) ),
    array( 'core/columns', array(), array(
        array( 'core/column', array(), array(
            array( 'core/image', array() ),
        ) ),
    ) )
);
```

---

## 1.15 Transformations

Block Transforms is the API that allows a block to be transformed _from_ and _to_ other blocks, as well as _from_ other entities.

### Transform Direction: `to` and `from`

```js
transforms: {
    from: [ /* supported from transforms */ ],
    to: [ /* supported to transforms */ ],
}
```

### Transformation Types

| Type | Direction | Description |
|------|-----------|-------------|
| `block` | both | Convert between blocks |
| `enter` | from | Create block via ENTER after typed content |
| `files` | from | Create block from dropped files |
| `prefix` | from | Create block from text prefix + space |
| `raw` | from | Create block from raw HTML nodes |
| `shortcode` | from | Create block from shortcode |

#### Block Transform Example

```js
transforms: {
    from: [ {
        type: 'block',
        blocks: [ 'core/paragraph' ],
        transform: ( { content } ) => {
            return createBlock( 'core/heading', { content } );
        },
    } ],
}
```

#### Prefix Transform Example

```js
transforms: {
    from: [ {
        type: 'prefix',
        prefix: '?',
        transform( content ) {
            return createBlock( 'my-plugin/question', { content } );
        },
    } ],
}
```

#### `ungroup` Blocks

```js
transforms: {
    ungroup: ( attributes, innerBlocks ) =>
        innerBlocks.flatMap( ( innerBlock ) => innerBlock.innerBlocks ),
}
```

---

## 1.16 Variations

The Block Variations API allows you to define multiple versions (variations) of a block. A block variation differs by a set of initial attributes or inner blocks.

### Defining a Variation

```js
variations: [
    {
        name: 'wordpress',
        title: 'WordPress',
        description: 'Embed a WordPress post.',
        attributes: { providerNameSlug: 'wordpress' },
        icon: 'wordpress',
        keywords: [ 'wp', 'blog' ],
        scope: [ 'block', 'inserter' ],
        isDefault: false,
        isActive: [ 'providerNameSlug' ],
        innerBlocks: [],
        example: {},
    },
]
```

### Registering a Variation

```js
wp.blocks.registerBlockVariation( 'core/embed', {
    name: 'custom-embed',
    attributes: { providerNameSlug: 'custom' },
} );
```

### Registering in PHP

```php
function my_custom_image_variation( $variations, $block_type ) {
    if ( 'core/image' !== $block_type->name ) {
        return $variations;
    }
    $variations[] = array(
        'name'       => 'wide-image',
        'title'      => __( 'Wide image', 'textdomain' ),
        'scope'      => array( 'inserter' ),
        'attributes' => array( 'align' => 'wide' ),
    );
    return $variations;
}
add_filter( 'get_block_type_variations', 'my_custom_image_variation', 10, 2 );
```

### Removing a Variation

```js
wp.blocks.unregisterBlockVariation( 'core/embed', 'youtube' );
```

### `isDefault` Caveats
- If multiple variations have `isDefault`, the first registered wins
- Unregister the other variation before registering yours with `isDefault`

### `isActive` Specificity
- If multiple variations match, the one with the highest specificity (longest `isActive` array) is chosen
- Function-based `isActive` cannot determine specificity; first match wins

---

# 2. Hooks (Filters) Reference

Hooks are a way for one piece of code to interact/modify another piece of code. There are two types: Actions and Filters.

---

## 2.1 Block Filters

### Registration Filters (PHP)

#### `block_type_metadata`
Filters the raw metadata loaded from `block.json` when registering on the server.

```php
function example_filter_metadata_registration( $metadata ) {
    $metadata['apiVersion'] = 2;
    return $metadata;
}
add_filter( 'block_type_metadata', 'example_filter_metadata_registration' );
```

#### `block_type_metadata_settings`
Filters the settings determined from processed block type metadata.

```php
add_filter( 'block_type_metadata_settings', function( $settings, $metadata ) {
    $settings['api_version'] = $metadata['apiVersion'] + 1;
    return $settings;
}, 10, 2 );
```

#### `register_block_type_args`
Filters a block's arguments array right before registration. Most low-level PHP filter.

```php
add_filter( 'register_block_type_args', function( $args, $block_type ) {
    if ( in_array( $block_type, [ 'core/paragraph', 'core/heading' ], true ) ) {
        $args['supports']['color'] = array(
            'text' => false, 'background' => false, 'link' => false,
        );
    }
    return $args;
}, 10, 2 );
```

### Registration Filters (JS)

#### `blocks.registerBlockType`
Filters block settings when registering on the client.

```js
wp.hooks.addFilter(
    'blocks.registerBlockType',
    'my-plugin/class-names/list-block',
    function( settings, name ) {
        if ( name !== 'core/list' ) return settings;
        return { ...settings, supports: { ...settings.supports, className: true } };
    }
);
```

### Frontend Filters (PHP)

#### `render_block`
Filters the front-end content of any block.

```php
add_filter( 'render_block', function( $block_content, $block ) {
    if ( 'core/paragraph' === $block['blockName'] ) {
        $processor = new WP_HTML_Tag_Processor( $block_content );
        if ( $processor->next_tag( 'p' ) ) {
            $processor->add_class( 'example-class' );
        }
        return $processor->get_updated_html();
    }
    return $block_content;
}, 10, 2 );
```

#### `render_block_{namespace/block}`
Filters the front-end content of a specific block type.

```php
add_filter( 'render_block_core/paragraph', function( $block_content, $block ) {
    $processor = new WP_HTML_Tag_Processor( $block_content );
    if ( $processor->next_tag( 'p' ) ) {
        $processor->add_class( 'example-class' );
    }
    return $processor->get_updated_html();
}, 10, 2 );
```

### Editor Filters (JS)

#### `blocks.getSaveElement`
Replaces or extends the element from a block's `save` function.

#### `blocks.getSaveContent.extraProps`
Adds extra props to the root element of the `save` function.

#### `blocks.getBlockDefaultClassName`
Provides an alternative class name for blocks.

#### `blocks.switchToBlockType.transformedBlock`
Filters individual transform result from block transformation.

#### `blocks.getBlockAttributes`
Called after default parsing of block attributes. Allows manipulation before validation.

```js
wp.hooks.addFilter(
    'blocks.getBlockAttributes',
    'my-plugin/lock-paragraphs',
    function( blockAttributes, blockType ) {
        if ( 'core/paragraph' === blockType.name ) {
            blockAttributes['lock'] = { move: true };
        }
        return blockAttributes;
    }
);
```

#### `editor.BlockEdit`
Modifies the block's `edit` component. Use `createHigherOrderComponent`.

```js
const withMyPluginControls = wp.compose.createHigherOrderComponent( ( BlockEdit ) => {
    return ( props ) => {
        return (
            <>
                <BlockEdit key="edit" { ...props } />
                <wp.blockEditor.InspectorControls>
                    <wp.components.PanelBody>My custom control</wp.components.PanelBody>
                </wp.blockEditor.InspectorControls>
            </>
        );
    };
}, 'withMyPluginControls' );
wp.hooks.addFilter( 'editor.BlockEdit', 'my-plugin/with-inspector-controls', withMyPluginControls );
```

#### `editor.BlockListBlock`
Modifies the block's wrapper component.

### Removing Blocks

```js
wp.domReady( function () {
    wp.blocks.unregisterBlockType( 'core/verse' );
} );
```

### Hiding Blocks from Inserter

```php
add_filter( 'allowed_block_types_all', function( $allowed_block_types, $editor_context ) {
    if ( ! empty( $editor_context->post ) ) {
        return array( 'core/paragraph', 'core/heading' );
    }
    return $allowed_block_types;
}, 10, 2 );
```

### Managing Block Categories

```php
add_filter( 'block_categories_all', function( $block_categories, $editor_context ) {
    if ( ! empty( $editor_context->post ) ) {
        array_push( $block_categories, array(
            'slug'  => 'custom-category',
            'title' => __( 'Custom Category', 'custom-plugin' ),
            'icon'  => null,
        ) );
    }
    return $block_categories;
}, 10, 2 );
```

---

## 2.2 Editor Hooks

### `block_editor_settings_all`
Applied before settings are sent to the Editor. Most common way to modify the Editor.

```php
add_filter( 'block_editor_settings_all', 'example_restrict_code_editor' );
function example_restrict_code_editor( $settings ) {
    if ( ! current_user_can( 'activate_plugins' ) ) {
        $settings[ 'codeEditingEnabled' ] = false;
    }
    return $settings;
}
```

#### Disable Openverse
```php
add_filter( 'block_editor_settings_all', function( $settings ) {
    $settings['enableOpenverseMediaCategory'] = false;
    return $settings;
} );
```

#### Disable Font Library
```php
add_filter( 'block_editor_settings_all', function( $settings ) {
    $settings['fontLibraryEnabled'] = false;
    return $settings;
} );
```

### Editor JS Filters

**`editor.PostFeaturedImage.imageSize`**: Modify the image size for Post Featured Image.
**`editor.PostPreview.interstitialMarkup`**: Filter the interstitial preview message.
**`media.crossOrigin`**: Set/modify `crossOrigin` attribute for foreign-origin media.

### Block Directory
```php
remove_action( 'enqueue_block_editor_assets', 'wp_enqueue_editor_block_directory_assets' );
```

### Block Patterns
```php
add_filter( 'should_load_remote_block_patterns', '__return_false' );
```

### Logging Errors
```js
wp.hooks.addAction(
    'editor.ErrorBoundary.errorLogged',
    'my-plugin/error-capture',
    ( error ) => { console.log( error ); }
);
```

---

## 2.3 i18n Hooks

The i18n functions (`__()`, `_x()`, `_n()` and `_nx()`) return filterable values:

- `i18n.gettext`
- `i18n.gettext_with_context`
- `i18n.ngettext`
- `i18n.ngettext_with_context`

### Example

```jsx
wp.hooks.addFilter(
    'i18n.gettext',
    'my-plugin/override-add-to-reusable-blocks-label',
    function( translation, text, domain ) {
        if ( text === 'Create Reusable block' ) {
            return 'Save to MyOrg block library';
        }
        return translation;
    }
);
```

### Text Domain-Specific Filters
Append `_{textdomain}` to the filter name, e.g. `i18n.gettext_woocommerce`. Use `_default` for core strings.

---

## 2.4 Parser Filters

**`block_parser_class`**: Replace the server-side parser class.

```php
class EmptyParser {
    public function parse( $post_content ) {
        return array();
    }
}
add_filter( 'block_parser_class', function( $prev_parser_class ) {
    return 'EmptyParser';
} );
```

---

## 2.5 Autocomplete Filters

**`editor.Autocomplete.completers`**: Extend/override the list of autocompleters.

```jsx
const acronymCompleter = {
    name: 'acronyms',
    triggerPrefix: '::',
    options: [
        { letters: 'FYI', expansion: 'For Your Information' },
    ],
    getOptionKeywords: ( { letters, expansion } ) => [ letters, ...expansion.split( /\s+/ ) ],
    getOptionLabel: acronym => acronym.letters,
    getOptionCompletion: ( { letters, expansion } ) => <abbr title={ expansion }>{ letters }</abbr>,
};

wp.hooks.addFilter(
    'editor.Autocomplete.completers',
    'my-plugin/autocompleters/acronym',
    ( completers, blockName ) => blockName === 'my-plugin/foo' ? [ ...completers, acronymCompleter ] : completers
);
```

---

## 2.6 Global Styles Filters

Server-side filters to hook into `theme.json` data at different layers:

- `wp_theme_json_data_default` - Default WordPress data
- `wp_theme_json_data_blocks` - Blocks data
- `wp_theme_json_data_theme` - Theme data
- `wp_theme_json_data_user` - User data

```php
function wpdocs_filter_theme_json_theme( $theme_json ) {
    $new_data = array(
        'version'  => 2,
        'settings' => array(
            'color' => array(
                'text'    => false,
                'palette' => array(
                    array( 'slug' => 'foreground', 'color' => 'black', 'name' => __( 'Foreground', 'theme-domain' ) ),
                    array( 'slug' => 'background', 'color' => 'white', 'name' => __( 'Background', 'theme-domain' ) ),
                ),
            ),
        ),
    );
    return $theme_json->update_with( $new_data );
}
add_filter( 'wp_theme_json_data_theme', 'wpdocs_filter_theme_json_theme' );
```

---

# 3. SlotFills Reference

Slot and Fill components allow developers to inject items into predefined places in the Gutenberg admin experience. They leverage the `@wordpress/plugins` API.

### Usage

```js
import { registerPlugin } from '@wordpress/plugins';
import { PluginPostStatusInfo } from '@wordpress/editor';

const PluginPostStatusInfoTest = () => (
    <PluginPostStatusInfo>
        <p>Post Status Info SlotFill</p>
    </PluginPostStatusInfo>
);

registerPlugin( 'post-status-info-test', { render: PluginPostStatusInfoTest } );
```

### Available SlotFills

- **MainDashboardButton** - Add items to the main dashboard button area
- **PluginBlockSettingsMenuItem** - Add items to block settings menu
- **PluginDocumentSettingPanel** - Add panels to the document settings sidebar
- **PluginMoreMenuItem** - Add items to the more menu
- **PluginPostPublishPanel** - Add panels to the post-publish flow
- **PluginPostStatusInfo** - Add items to the post status info area
- **PluginPrePublishPanel** - Add panels to the pre-publish flow
- **PluginSidebar** - Add a custom sidebar
- **PluginSidebarMoreMenuItem** - Add a more menu item for the sidebar

### Conditionally Rendering SlotFill Content

**Restrict to Post Editor** - Check if post type is `viewable`:

```js
const isViewable = useSelect( ( select ) => {
    const postTypeName = select( editorStore ).getCurrentPostType();
    const postTypeObject = select( coreStore ).getPostType( postTypeName );
    return postTypeObject?.viewable;
}, [] );
if ( ! isViewable ) return null;
```

**Restrict to Site Editor** - Check if post type is NOT viewable:

```js
if ( isViewable ) return null;
```

**Restrict to certain post types:**
```js
const allowedPostTypes = [ 'page' ];
if ( ! isViewable || ! allowedPostTypes.includes( postTypeName ) ) return null;
```

**Restrict to Site Editor screens:**
```js
const allowedSiteEditorScreens = [ 'wp_template', 'wp_block', 'wp_template_part' ];
```

---

# 4. Theme.json Reference

The `theme.json` file is used to configure block editor settings and styles. Versions: v3 (latest), v2, v1.

## 4.1 Version 3 (latest)

> Works with WordPress 6.6+ and the latest Gutenberg plugin. Schema: `https://schemas.wp.org/trunk/theme.json`

### Settings

#### `useRootPaddingAwareAlignments`
Enables root padding to be applied to contents of full-width blocks. Requires `styles.spacing.padding` as an object with `top`, `right`, `bottom`, `left`.

#### `appearanceTools`
Enables UI tools for: background, border, color (link, heading, button, caption), dimensions (aspectRatio, height, minHeight, minWidth, width), position (sticky), spacing (blockGap, margin, padding), typography (lineHeight).

#### `background`
| Property | Default |
|----------|---------|
| backgroundImage | false |
| backgroundSize | false |

#### `border`
| Property | Default |
|----------|---------|
| color | false |
| radius | false |
| style | false |
| width | false |

#### `color`
| Property | Default |
|----------|---------|
| background | true |
| text | true |
| link | false |
| heading | true |
| button | true |
| caption | true |
| custom | true |
| customDuotone | true |
| customGradient | true |
| defaultDuotone | true |
| defaultGradients | true |
| defaultPalette | true |

#### `dimensions`
| Property | Default |
|----------|---------|
| aspectRatio | false |
| height | false |
| minHeight | false |
| minWidth | false |
| width | false |
| defaultAspectRatios | true |

#### `layout`
| Property | Default |
|----------|---------|
| contentSize | - |
| wideSize | - |
| allowEditing | true |
| allowCustomContentAndWideSize | true |

#### `lightbox`
| Property | Default |
|----------|---------|
| enabled | - |
| allowEditing | - |

#### `position`
| Property | Default |
|----------|---------|
| sticky | false |

#### `shadow`
| Property | Default |
|----------|---------|
| defaultPresets | true |

#### `spacing`
| Property | Default |
|----------|---------|
| blockGap | null |
| margin | false |
| padding | false |
| units | ["px","em","rem","vh","vw","%"] |
| customSpacingSize | true |
| defaultSpacingSizes | true |

#### `typography`
| Property | Default |
|----------|---------|
| customFontSize | true |
| fontStyle | true |
| fontWeight | true |
| fluid | false |
| letterSpacing | true |
| lineHeight | false |
| textIndent | "subsequent" |
| textAlign | true |
| textColumns | false |
| textDecoration | true |
| writingMode | false |
| textTransform | true |
| dropCap | true |
| defaultFontSizes | true |

### Styles

Top-level styles are added in the `body` selector. Styles can be set for: `background`, `border`, `color`, `css`, `dimensions`, `filter`, `outline`, `shadow`, `spacing`, `typography`.

### Patterns
An array of pattern slugs to be registered from the Pattern Directory.

### customTemplates
Additional metadata for custom templates: `name`, `title`, `postTypes`.

### templateParts
Additional metadata for template parts: `name`, `title`, `area` (e.g., `header`, `footer`).

---

## 4.2 Version 2

Introduced new top-level properties (`customTemplates`, `templateParts`) and many settings additions. Renamed properties from v1.

## 4.3 Version 1

Initial version.

## 4.4 Migrating to Newer Versions

### v1 → v2
1. Update `version` to `2`
2. Rename properties:
   - `settings.border.customRadius` → `settings.border.radius`
   - `settings.spacing.customMargin` → `settings.spacing.margin`
   - `settings.spacing.customPadding` → `settings.spacing.padding`
   - `settings.typography.customLineHeight` → `settings.typography.lineHeight`

### v2 → v3
1. Update `version` to `3`
2. Configure changed defaults:
   - `settings.typography.defaultFontSizes` - `true` by default in v3
   - `settings.spacing.defaultSpacingSizes` - `true` by default in v3

---

# 5. RichText Reference

RichText is a component that allows developers to render a `contenteditable` input with formatting options.

### Example

```jsx
import { registerBlockType } from '@wordpress/blocks';
import { useBlockProps, RichText } from '@wordpress/block-editor';

registerBlockType( 'my-plugin/heading', {
    attributes: {
        content: { type: 'string', source: 'html', selector: 'h2' },
    },
    edit( { attributes, setAttributes } ) {
        const blockProps = useBlockProps();
        return (
            <RichText
                { ...blockProps }
                tagName="h2"
                value={ attributes.content }
                allowedFormats={ [ 'core/bold', 'core/italic' ] }
                onChange={ ( content ) => setAttributes( { content } ) }
                placeholder={ __( 'Heading...' ) }
            />
        );
    },
    save( { attributes } ) {
        const blockProps = useBlockProps.save();
        return <RichText.Content { ...blockProps } tagName="h2" value={ attributes.content } />;
    }
} );
```

### Common Issues

- **HTML tags displayed in content**: Use `<RichText.Content tagName="h2" value={ heading } />` in save
- **Unwanted formatting**: Use `withoutInteractiveFormatting` or `allowedFormats` to limit options
- **Disable format types**: `wp.richText.unregisterFormatType( 'core/image' )`

### Core Blocks Using RichText
Button, Heading, Quote (citation + quotation), Search (label + button text)

---

# 6. Component Reference

The Gutenberg editor provides a comprehensive set of React components through `@wordpress/components`. Key components include:

- **PanelBody, PanelRow, PanelHeader** - Panel layout components
- **TextControl, TextareaControl** - Text input controls
- **ToggleControl** - Toggle/switch control
- **SelectControl** - Dropdown select
- **RangeControl** - Slider control (use `__next40pxDefaultSize={true}` and `__nextHasNoMarginBottom={true}`)
- **Button** - Button component
- **BaseControl** - Base control wrapper
- **ColorPalette** - Color picker
- **__experimentalToggleGroupControl** - Button group selector
- **__experimentalToggleGroupControlOption** - Option for ToggleGroupControl
- **Modal** - Modal dialog
- **Popover** - Popover component
- **Dropdown** - Dropdown component
- **DropdownMenu** - Dropdown menu
- **Spinner** - Loading spinner
- **Placeholder** - Placeholder component
- **Disabled** - Disables child interactions
- **SVG, Path, Circle, G** - SVG primitives

_Source: https://github.com/WordPress/gutenberg/blob/trunk/packages/components/README.md_

---

# 7. Package Reference

The Gutenberg project is organized as a monorepo with the following key packages:

| Package | Description |
|---------|-------------|
| `@wordpress/blocks` | Block registration and management |
| `@wordpress/block-editor` | Block editor components and data |
| `@wordpress/block-library` | Core block types |
| `@wordpress/components` | Reusable UI components |
| `@wordpress/data` | Data module framework |
| `@wordpress/editor` | Post editor |
| `@wordpress/edit-post` | Post editor UI |
| `@wordpress/edit-site` | Site editor |
| `@wordpress/element` | React abstraction |
| `@wordpress/hooks` | Hook/filter system |
| `@wordpress/i18n` | Internationalization |
| `@wordpress/plugins` | Plugin registration system |
| `@wordpress/rich-text` | Rich text formatting |
| `@wordpress/server-side-render` | Server-side rendering |
| `@wordpress/api-fetch` | REST API fetching |
| `@wordpress/url` | URL utilities |
| `@wordpress/api-fetch` | Fetch utility |
| `@wordpress/core-data` | WordPress core data store |
| `@wordpress/primitives` | SVG primitives |
| `@wordpress/compose` | Higher-order components and utilities |
| `@wordpress/dom` | DOM utilities |
| `@wordpress/dom-ready` | DOM ready callback |
| `@wordpress/html-entities` | HTML entity utilities |
| `@wordpress/keycodes` | Keycode utilities |
| `@wordpress/shortcode` | Shortcode utilities |

_Source: https://github.com/WordPress/gutenberg/blob/trunk/docs/reference-guides/packages.md_

---

# 8. Data Module Reference

## 8.1 core: WordPress Core Data

**Namespace**: `core` (from `@wordpress/core-data`)

Import: `import { store as coreDataStore } from '@wordpress/core-data';`

### Dynamically Generated Selectors

| Selector | Description |
|----------|-------------|
| `getPostType( postType )` | Returns information for a given post type |
| `getPostTypes( query )` | Returns information for post types |
| `getTaxonomy( taxonomy )` | Returns information for a given taxonomy |
| `getTaxonomies( query )` | Returns information for taxonomies |

### Other Selectors

| Selector | Description |
|----------|-------------|
| `canUser( action, resource, id )` | Whether the current user can perform a given action |
| `getAuthors( query )` | (Deprecated) Returns all available authors |
| `getAutosave( postType, postId, authorId )` | Returns the autosave for the post and author |
| `getAutosaves( postType, postId )` | Returns the latest autosaves for the post |
| `getBlockPatternCategories()` | Block pattern categories |
| `getBlockPatterns()` | Registered block patterns |
| `getCurrentTheme()` | Current theme |
| `getCurrentUser()` | Current user |
| `getEditedEntityRecord( kind, name, recordId )` | Entity record merged with edits |
| `getEntityRecord( kind, name, key, query )` | Entity's record object by key |
| `getEntityRecords( kind, name, query )` | Entity's records |
| `getEntityRecordsTotalItems( kind, name, query )` | Total available records for a query |
| `getEntityRecordsTotalPages( kind, name, query )` | Number of available pages for a query |
| `getThemeSupports()` | Theme support data |
| `hasEditsForEntityRecord( kind, name, recordId )` | Whether entity record has edits |
| `isSavingEntityRecord( kind, name, recordId )` | Whether entity record is saving |
| `isAutosavingEntityRecord( kind, name, recordId )` | Whether entity record is autosaving |
| `isDeletingEntityRecord( kind, name, recordId )` | Whether entity record is deleting |

### Actions

| Action | Description |
|--------|-------------|
| `addEntities( entities )` | Add new entities |
| `deleteEntityRecord( kind, name, recordId, query, options )` | Delete an entity record |
| `editEntityRecord( kind, name, recordId, edits, options )` | Edit an entity record |
| `saveEditedEntityRecord( kind, name, recordId, options )` | Save an entity record's edits |
| `saveEntityRecord( kind, name, record, options )` | Save an entity record |
| `redo()` | Redo last undone edit |
| `undo()` | Undo last edit |

---

## 8.2 core/block-editor: The Block Editor's Data

**Namespace**: `core/block-editor` (from `@wordpress/block-editor`)

Import: `import { store as blockEditorStore } from '@wordpress/block-editor';`

### Selectors

| Selector | Description |
|----------|-------------|
| `getBlock( clientId )` | Returns a block given its client ID |
| `getBlockAttributes( clientId )` | Returns a block's attributes |
| `getBlockCount( rootClientId )` | Number of blocks in the post |
| `getBlockHierarchyRootClientId( clientId )` | Root of the hierarchy |
| `getBlockIndex( clientId )` | Index at which block occurs |
| `getBlockInsertionPoint()` | Location of the insertion cue |
| `getBlockMode( clientId )` | Block's editing mode |
| `getBlockName( clientId )` | Block's name |
| `getBlockOrder( rootClientId )` | All block client IDs in order |
| `getBlockParents( clientId, ascending )` | List of all parents |
| `getBlockParentsByBlockName( clientId, blockName, ascending )` | Parents filtered by name |
| `getBlockRootClientId( clientId )` | Root block from which block is nested |
| `getBlocks( rootClientId )` | All block objects for the current post |
| `getBlocksByClientId( clientIds )` | Block objects by client IDs |
| `getBlocksByName( blockName )` | All blocks matching a name |
| `getGlobalBlockCount( blockName )` | Total number of blocks |
| `getInserterItems( rootClientId )` | Items in the inserter |
| `getSelectedBlock()` | Currently selected block |
| `getSelectedBlockClientId()` | Selected block client ID |
| `getSelectedBlockCount()` | Number of selected blocks |
| `getSettings()` | Editor settings |
| `getTemplate()` | Defined block template |
| `canInsertBlockType( blockName, rootClientId )` | Whether block type can be inserted |
| `canMoveBlock( clientId )` | Whether block can be moved |
| `canRemoveBlock( clientId )` | Whether block can be removed |
| `hasSelectedBlock()` | Whether a single block is selected |
| `hasMultiSelection()` | Whether multi-selection has been made |
| `isBlockSelected( clientId )` | Whether block is selected |
| `isBlockValid( clientId )` | Whether block is valid |
| `isFirstMultiSelectedBlock( clientId )` | Whether block is first in multi-selection |
| `isSelectionEnabled()` | Whether multi-selection is enabled |
| `isTyping()` | Whether user is typing |
| `getBlockEditingMode( clientId )` | Block editing mode |
| `getPatternsByBlockTypes( blockNames, rootClientId )` | Patterns based on blockTypes |

### Actions

| Action | Description |
|--------|-------------|
| `insertBlock( block, index, rootClientId, updateSelection )` | Insert a single block |
| `insertBlocks( blocks, index, rootClientId, updateSelection )` | Insert multiple blocks |
| `removeBlock( clientId, selectPrevious )` | Remove a block |
| `replaceBlock( clientId, block )` | Replace a block |
| `replaceBlocks( clientIds, blocks )` | Replace given blocks |
| `replaceInnerBlocks( rootClientId, blocks, updateSelection )` | Replace inner blocks |
| `updateBlockAttributes( clientIds, attributes )` | Update attributes |
| `selectBlock( clientId )` | Select a block |
| `multiSelect( start, end )` | Multi-select blocks |
| `clearSelectedBlock()` | Clear block selection |
| `mergeBlocks( firstBlockClientId, secondBlockClientId )` | Merge two blocks |
| `flashBlock( clientId, timeout )` | Flash a block |
| `setBlockEditingMode( clientId, mode )` | Set block editing mode |
| `showInsertionPoint( rootClientId, index )` | Show insertion point |
| `hideInsertionPoint()` | Hide insertion point |
| `startTyping()` / `stopTyping()` | Typing state |
| `startMultiSelect()` / `stopMultiSelect()` | Multi-select state |
| `updateSettings( settings )` | Update block editor settings |

---

## 8.3 core/editor: The Post Editor's Data

**Namespace**: `core/editor` (from `@wordpress/editor`)

Import: `import { store as editorStore } from '@wordpress/editor';`

### Selectors

| Selector | Description |
|----------|-------------|
| `getCurrentPostId()` | Current post ID |
| `getCurrentPostType()` | Current post type |
| `getCurrentPost()` | Current post object |
| `getPostEdits()` | Current post edits |
| `getEditedPostContent()` | Edited post content |
| `isEditedPostDirty()` | Whether post has unsaved changes |
| `isSavingPost()` | Whether post is being saved |
| `isAutoSavingPost()` | Whether post is being autosaved |
| `getEditorBlocks()` | Blocks in the editor |
| `getDeviceType()` | Preview device type (Desktop/Tablet/Mobile) |
| `getPermalink()` | Post permalink |
| `getPostTypeLabel()` | Post type label |

### Actions

| Action | Description |
|--------|-------------|
| `savePost()` | Save the current post |
| `autosave()` | Autosave the current post |
| `editPost( edits )` | Edit the current post |
| `savePost()` | Save post |
| `trashPost()` | Trash post |

---

## 8.4 Other Data Modules

### core/annotations
**Namespace**: `core/annotations`
- `addAnnotation( annotation )` - Add an annotation
- `removeAnnotation( annotationId )` - Remove an annotation

### core/block-directory
**Namespace**: `core/block-directory`
- Install and manage blocks from the Block Directory

### core/blocks
**Namespace**: `core/blocks`
- Block type registration data

### core/customize-widgets
**Namespace**: `core/customize-widgets`
- Widgets customization data

### core/edit-post
**Namespace**: `core/edit-post`
- Post editor UI state (deprecated in favor of `core/editor`)

### core/edit-site
**Namespace**: `core/edit-site`
- Site editor state

### core/edit-widgets
**Namespace**: `core/edit-widgets`
- Widgets editor state

### core/keyboard-shortcuts
**Namespace**: `core/keyboard-shortcuts`
- Keyboard shortcuts data

### core/notices
**Namespace**: `core/notices`
- `createNotice( status, content, options )` - Create a notice
- `removeNotice( id )` - Remove a notice

### core/preferences
**Namespace**: `core/preferences`
- User preferences

### core/reusable-blocks
**Namespace**: `core/reusable-blocks`
- Reusable blocks management

### core/rich-text
**Namespace**: `core/rich-text`
- Rich text format registrations
- `registerFormatType( name, config )` - Register a format type
- `unregisterFormatType( name )` - Unregister a format type

### core/viewport
**Namespace**: `core/viewport`
- Viewport/breakpoint state

---

*Source: https://github.com/WordPress/gutenberg/tree/trunk/docs/reference-guides*
