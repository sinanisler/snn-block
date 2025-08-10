<?php
/**
 * Custom Heading Block
 * Registers a simple heading block with typography controls.
 * This file contains all the necessary PHP and JavaScript for the block.
 */

// Exit if accessed directly.
if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

/**
 * Register the block type.
 */
function custom_heading_block_init() {
    // These attributes are used by the render_callback on the server.
    $block_attributes = array(
        'content'         => array(
            'type'    => 'string',
            'source'  => 'html',
            'selector'=> 'h1,h2,h3,h4,h5,h6',
        ),
        'level'           => array(
            'type'    => 'number',
            'default' => 2,
        ),
        'textAlign'       => array(
            'type'    => 'string',
            'default' => 'left',
        ),
        'fontSize'        => array(
            'type'    => 'string',
        ),
        'lineHeight'      => array(
            'type'    => 'string',
        ),
        'textColor'       => array(
            'type'    => 'string',
        ),
        'backgroundColor' => array(
            'type'    => 'string',
        ),
        'className'       => array(
            'type'    => 'string',
        ),
    );

    // Register the block.
    register_block_type( 'custom/heading', array(
        'editor_script'   => 'custom-heading-block-editor-script',
        'render_callback' => 'custom_heading_render_callback',
        'attributes'      => $block_attributes,
    ) );
}
add_action( 'init', 'custom_heading_block_init' );

/**
 * Enqueue block editor assets.
 */
function custom_heading_block_editor_assets() {
    add_action( 'admin_head', 'custom_heading_block_editor_script' );
    wp_enqueue_script(
        'custom-heading-block-editor-script',
        '', // No source file, as it's an inline script
        array( 'wp-blocks', 'wp-element', 'wp-block-editor', 'wp-components', 'wp-i18n' ),
        '1.0.4' // Updated version
    );
}
add_action( 'enqueue_block_editor_assets', 'custom_heading_block_editor_assets' );

/**
 * Prints the JavaScript for the block editor.
 */
function custom_heading_block_editor_script() {
    ?>
    <script>
    (function(wp) {
        const { registerBlockType } = wp.blocks;
        const { RichText, InspectorControls, PanelColorSettings, AlignmentToolbar, BlockControls } = wp.blockEditor;
        const { PanelBody, SelectControl, TextControl } = wp.components;
        const { Fragment } = wp.element;

        registerBlockType('custom/heading', {
            title: 'Custom Heading',
            icon: 'heading',
            category: 'common',
            attributes: {
                content: {
                    type: 'string',
                    source: 'html',
                    selector: 'h1,h2,h3,h4,h5,h6',
                },
                level: {
                    type: 'number',
                    default: 2,
                },
                textAlign: {
                    type: 'string',
                    default: 'left',
                },
                fontSize: {
                    type: 'string',
                },
                lineHeight: {
                    type: 'string',
                },
                textColor: {
                    type: 'string',
                },
                backgroundColor: {
                    type: 'string',
                },
                className: {
                    type: 'string',
                },
            },
            edit: function({ attributes, setAttributes }) {
                const { content, level, textAlign, fontSize, lineHeight, textColor, backgroundColor } = attributes;

                const blockStyle = {
                    textAlign,
                    fontSize,
                    lineHeight,
                    color: textColor,
                    backgroundColor,
                };

                return wp.element.createElement(
                    Fragment,
                    null,
                    wp.element.createElement(
                        InspectorControls,
                        null,
                        wp.element.createElement(
                            PanelBody, { title: 'Heading Settings', initialOpen: true },
                            wp.element.createElement(SelectControl, {
                                label: 'Heading Level',
                                value: level,
                                options: [
                                    { label: 'H1', value: 1 }, { label: 'H2', value: 2 }, { label: 'H3', value: 3 },
                                    { label: 'H4', value: 4 }, { label: 'H5', value: 5 }, { label: 'H6', value: 6 },
                                ],
                                onChange: (newLevel) => setAttributes({ level: parseInt(newLevel) }),
                            })
                        ),
                        wp.element.createElement(
                            PanelBody, { title: 'Typography', initialOpen: false },
                            wp.element.createElement(TextControl, {
                                label: 'Font Size',
                                value: fontSize,
                                onChange: (newSize) => setAttributes({ fontSize: newSize }),
                                help: 'e.g., 24px, 2em, 1.5rem',
                            }),
                            wp.element.createElement(TextControl, {
                                label: 'Line Height',
                                value: lineHeight,
                                onChange: (newLineHeight) => setAttributes({ lineHeight: newLineHeight }),
                                help: 'e.g., 1.2, 1.5',
                            })
                        ),
                        wp.element.createElement(PanelColorSettings, {
                            title: 'Color Settings',
                            initialOpen: false,
                            colorSettings: [
                                { label: 'Text Color', onChange: (newColor) => setAttributes({ textColor: newColor }), value: textColor },
                                { label: 'Background Color', onChange: (newColor) => setAttributes({ backgroundColor: newColor }), value: backgroundColor },
                            ],
                        })
                    ),
                    wp.element.createElement(
                        BlockControls,
                        null,
                        wp.element.createElement(AlignmentToolbar, {
                            value: textAlign,
                            onChange: (newAlign) => setAttributes({ textAlign: newAlign }),
                        })
                    ),
                    wp.element.createElement(RichText, {
                        tagName: `h${level}`,
                        value: content,
                        onChange: (newContent) => setAttributes({ content: newContent }),
                        placeholder: 'Your Heading Here',
                        style: blockStyle,
                        allowedFormats: [ 'core/bold', 'core/italic', 'core/link' ]
                    })
                );
            },
            save: function() {
                return null;
            },
        });
    })(window.wp);
    </script>
    <?php
}

/**
 * Render the block dynamically on the server.
 */
function custom_heading_render_callback( $attributes, $content ) {
    $level = ( isset( $attributes['level'] ) && $attributes['level'] >= 1 && $attributes['level'] <= 6 ) ? $attributes['level'] : 2;
    $tag = 'h' . $level;
    
    $heading_content = isset( $attributes['content'] ) ? $attributes['content'] : '';

    $style = '';
    $style_props = [];
    if ( ! empty( $attributes['textAlign'] ) ) { $style_props[] = 'text-align:' . esc_attr( $attributes['textAlign'] ); }
    if ( ! empty( $attributes['fontSize'] ) ) { $style_props[] = 'font-size:' . esc_attr( $attributes['fontSize'] ); }
    if ( ! empty( $attributes['lineHeight'] ) ) { $style_props[] = 'line-height:' . esc_attr( $attributes['lineHeight'] ); }
    if ( ! empty( $attributes['textColor'] ) ) { $style_props[] = 'color:' . esc_attr( $attributes['textColor'] ); }
    if ( ! empty( $attributes['backgroundColor'] ) ) { $style_props[] = 'background-color:' . esc_attr( $attributes['backgroundColor'] ); }

    if (!empty($style_props)) {
        $style = implode(';', $style_props);
    }

    $class_name = 'wp-block-custom-heading';
    if ( ! empty( $attributes['className'] ) ) {
        $class_name .= ' ' . esc_attr( $attributes['className'] );
    }

    return sprintf(
        '<%s class="%s" style="%s">%s</%s>',
        $tag,
        esc_attr( $class_name ),
        esc_attr( $style ),
        $heading_content,
        $tag
    );
}