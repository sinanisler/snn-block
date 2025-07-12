<?php
/**
 * container Block - Dynamic PHP Block with Responsive Controls
 */

// Register the block
add_action('init', function() {
    // Define the attributes array separately to reuse it
    $block_attributes = [
        // Display attributes
        'display' => [
            'type' => 'object',
            'default' => [
                'desktop' => 'flex',
                'tablet' => 'flex',
                'mobile' => 'flex'
            ]
        ],
        
        // Flex properties
        'flexDirection' => [
            'type' => 'object',
            'default' => [
                'desktop' => 'row',
                'tablet' => 'row',
                'mobile' => 'column'
            ]
        ],
        'justifyContent' => [
            'type' => 'object',
            'default' => [
                'desktop' => 'flex-start',
                'tablet' => 'flex-start',
                'mobile' => 'flex-start'
            ]
        ],
        'alignItems' => [
            'type' => 'object',
            'default' => [
                'desktop' => 'stretch',
                'tablet' => 'stretch',
                'mobile' => 'stretch'
            ]
        ],
        'flexWrap' => [
            'type' => 'object',
            'default' => [
                'desktop' => 'nowrap',
                'tablet' => 'wrap',
                'mobile' => 'wrap'
            ]
        ],
        'gap' => [
            'type' => 'object',
            'default' => [
                'desktop' => '20px',
                'tablet' => '15px',
                'mobile' => '10px'
            ]
        ],
        
        // Grid properties
        'gridTemplateColumns' => [
            'type' => 'object',
            'default' => [
                'desktop' => 'repeat(3, 1fr)',
                'tablet' => 'repeat(2, 1fr)',
                'mobile' => '1fr'
            ]
        ],
        'gridTemplateRows' => [
            'type' => 'object',
            'default' => [
                'desktop' => 'auto',
                'tablet' => 'auto',
                'mobile' => 'auto'
            ]
        ],
        'gridGap' => [
            'type' => 'object',
            'default' => [
                'desktop' => '20px',
                'tablet' => '15px',
                'mobile' => '10px'
            ]
        ],
        
        // Common style attributes
        'padding' => [
            'type' => 'object',
            'default' => [
                'desktop' => ['top' => '0', 'right' => '0', 'bottom' => '0', 'left' => '0'],
                'tablet' => ['top' => '15px', 'right' => '15px', 'bottom' => '15px', 'left' => '15px'],
                'mobile' => ['top' => '10px', 'right' => '10px', 'bottom' => '10px', 'left' => '10px']
            ]
        ],
        'margin' => [
            'type' => 'object',
            'default' => [
                'desktop' => ['top' => '0px', 'right' => 'auto', 'bottom' => '0px', 'left' => 'auto'],
                'tablet' => ['top' => '0px', 'right' => 'auto', 'bottom' => '0px', 'left' => 'auto'],
                'mobile' => ['top' => '0px', 'right' => 'auto', 'bottom' => '0px', 'left' => 'auto']
            ]
        ],
        'backgroundColor' => [
            'type' => 'object',
            'default' => [
                'desktop' => '',
                'tablet' => '',
                'mobile' => ''
            ]
        ],
        'textColor' => [
            'type' => 'object',
            'default' => [
                'desktop' => '',
                'tablet' => '',
                'mobile' => ''
            ]
        ],
        'minHeight' => [
            'type' => 'object',
            'default' => [
                'desktop' => '',
                'tablet' => '',
                'mobile' => ''
            ]
        ],
        'maxWidth' => [
            'type' => 'object',
            'default' => [
                'desktop' => '1200px',
                'tablet' => '100%',
                'mobile' => '100%'
            ]
        ],
        
        // Border attributes
        'border' => [
            'type' => 'object',
            'default' => [
                'desktop' => ['width' => '', 'style' => '', 'color' => '', 'radius' => ''],
                'tablet' => ['width' => '', 'style' => '', 'color' => '', 'radius' => ''],
                'mobile' => ['width' => '', 'style' => '', 'color' => '', 'radius' => '']
            ]
        ],
        
        // Additional attributes
        'className' => [
            'type' => 'string',
            'default' => ''
        ],
        'anchor' => [
            'type' => 'string',
            'default' => ''
        ]
    ];

    register_block_type('custom/container', [
        'render_callback' => 'render_container_block',
        'attributes' => $block_attributes // Use the defined attributes array
    ]);

    // Store attributes for later use in enqueue_block_editor_assets
    // This is a common pattern to pass data from PHP to JS in WordPress blocks
    global $custom_container_block_attributes;
    $custom_container_block_attributes = $block_attributes;
});

// Render callback
function render_container_block($attributes, $content) {
    $class_name = 'wp-block-custom-container';
    if (!empty($attributes['className'])) {
        $class_name .= ' ' . $attributes['className'];
    }
    
    $wrapper_attributes = [
        'class' => $class_name
    ];
    
    if (!empty($attributes['anchor'])) {
        $wrapper_attributes['id'] = $attributes['anchor'];
    }
    
    // Generate unique ID for this block instance
    $block_id = 'container-' . uniqid();
    $wrapper_attributes['data-block-id'] = $block_id;
    
    // Build wrapper attributes string
    $wrapper_attrs_string = '';
    foreach ($wrapper_attributes as $key => $value) {
        $wrapper_attrs_string .= sprintf(' %s="%s"', $key, esc_attr($value));
    }
    
    // Generate responsive CSS
    $css = container_generate_responsive_css($block_id, $attributes);
    
    // Output the block
    $output = sprintf(
        '<style>%s</style><div%s>%s</div>',
        $css,
        $wrapper_attrs_string,
        $content
    );
    
    return $output;
}

// Generate responsive CSS
function container_generate_responsive_css($block_id, $attributes) {
    $css = '';
    
    // Desktop styles (default)
    $desktop_styles = container_generate_styles_for_breakpoint($attributes, 'desktop');
    if (!empty($desktop_styles)) {
        $css .= sprintf('[data-block-id="%s"] { %s }', $block_id, $desktop_styles);
    }
    
    // Tablet styles
    $tablet_styles = container_generate_styles_for_breakpoint($attributes, 'tablet');
    if (!empty($tablet_styles)) {
        $css .= sprintf('@media (max-width: 781px) { [data-block-id="%s"] { %s } }', $block_id, $tablet_styles);
    }
    
    // Mobile styles
    $mobile_styles = container_generate_styles_for_breakpoint($attributes, 'mobile');
    if (!empty($mobile_styles)) {
        $css .= sprintf('@media (max-width: 599px) { [data-block-id="%s"] { %s } }', $block_id, $mobile_styles);
    }
    
    return $css;
}

// Generate styles for specific breakpoint
function container_generate_styles_for_breakpoint($attributes, $breakpoint) {
    $styles = [];
    
    // Display
    if (isset($attributes['display'][$breakpoint])) {
        $styles[] = sprintf('display: %s', $attributes['display'][$breakpoint]);
        
        // Flex properties
        if ($attributes['display'][$breakpoint] === 'flex') {
            if (isset($attributes['flexDirection'][$breakpoint])) {
                $styles[] = sprintf('flex-direction: %s', $attributes['flexDirection'][$breakpoint]);
            }
            if (isset($attributes['justifyContent'][$breakpoint])) {
                $styles[] = sprintf('justify-content: %s', $attributes['justifyContent'][$breakpoint]);
            }
            if (isset($attributes['alignItems'][$breakpoint])) {
                $styles[] = sprintf('align-items: %s', $attributes['alignItems'][$breakpoint]);
            }
            if (isset($attributes['flexWrap'][$breakpoint])) {
                $styles[] = sprintf('flex-wrap: %s', $attributes['flexWrap'][$breakpoint]);
            }
            if (isset($attributes['gap'][$breakpoint])) {
                $styles[] = sprintf('gap: %s', $attributes['gap'][$breakpoint]);
            }
        }
        
        // Grid properties
        if ($attributes['display'][$breakpoint] === 'grid') {
            if (isset($attributes['gridTemplateColumns'][$breakpoint])) {
                $styles[] = sprintf('grid-template-columns: %s', $attributes['gridTemplateColumns'][$breakpoint]);
            }
            if (isset($attributes['gridTemplateRows'][$breakpoint])) {
                $styles[] = sprintf('grid-template-rows: %s', $attributes['gridTemplateRows'][$breakpoint]);
            }
            if (isset($attributes['gridGap'][$breakpoint])) {
                $styles[] = sprintf('grid-gap: %s', $attributes['gridGap'][$breakpoint]);
            }
        }
    }
    
    // Padding
    if (isset($attributes['padding'][$breakpoint])) {
        $padding = $attributes['padding'][$breakpoint];
        if (is_array($padding)) {
            $styles[] = sprintf(
                'padding: %s %s %s %s',
                $padding['top'] ?? '0',
                $padding['right'] ?? '0',
                $padding['bottom'] ?? '0',
                $padding['left'] ?? '0'
            );
        }
    }
    
    // Margin
    if (isset($attributes['margin'][$breakpoint])) {
        $margin = $attributes['margin'][$breakpoint];
        if (is_array($margin)) {
            $styles[] = sprintf(
                'margin: %s %s %s %s',
                $margin['top'] ?? '0',
                $margin['right'] ?? '0',
                $margin['bottom'] ?? '0',
                $margin['left'] ?? '0'
            );
        }
    }
    
    // Colors
    if (isset($attributes['backgroundColor'][$breakpoint]) && !empty($attributes['backgroundColor'][$breakpoint])) {
        $styles[] = sprintf('background-color: %s', $attributes['backgroundColor'][$breakpoint]);
    }
    if (isset($attributes['textColor'][$breakpoint]) && !empty($attributes['textColor'][$breakpoint])) {
        $styles[] = sprintf('color: %s', $attributes['textColor'][$breakpoint]);
    }
    
    // Dimensions
    if (isset($attributes['minHeight'][$breakpoint]) && !empty($attributes['minHeight'][$breakpoint])) {
        $styles[] = sprintf('min-height: %s', $attributes['minHeight'][$breakpoint]);
    }
    if (isset($attributes['maxWidth'][$breakpoint]) && !empty($attributes['maxWidth'][$breakpoint])) {
        $styles[] = sprintf('max-width: %s', $attributes['maxWidth'][$breakpoint]);
    }
    
    // Border
    if (isset($attributes['border'][$breakpoint])) {
        $border = $attributes['border'][$breakpoint];
        if (!empty($border['width']) && !empty($border['style']) && !empty($border['color'])) {
            $styles[] = sprintf('border: %s %s %s', $border['width'], $border['style'], $border['color']);
        }
        if (!empty($border['radius'])) {
            $styles[] = sprintf('border-radius: %s', $border['radius']);
        }
    }
    
    return implode('; ', $styles);
}

// Enqueue block editor assets
add_action('enqueue_block_editor_assets', function() {
    global $custom_container_block_attributes; // Access the global variable

    // Ensure attributes are available
    $attributes_json = json_encode($custom_container_block_attributes ?: []); // Fallback to empty array if not set

    // Define a unique handle for our block's editor script
    $script_handle = 'custom-container-block-editor-script';

    // Register the script first with all necessary dependencies
    wp_register_script(
        $script_handle,
        '', // No source file, as it's an inline script
        ['wp-blocks', 'wp-element', 'wp-components', 'wp-block-editor', 'wp-data', 'wp-viewport'],
        filemtime(__FILE__), // Use filemtime for versioning
        false // Enqueue in the header, not footer, for editor scripts
    );

    $script = "
    (function(wp) {
        // console.log('Custom container Block: Script loaded and starting registration.'); // Debugging log
        // console.log('wp.blocks object:', wp.blocks); // Check wp.blocks object
        
        // Ensure wp.blocks and registerBlockType are available
        if (typeof wp.blocks === 'undefined' || typeof wp.blocks.registerBlockType === 'undefined') {
            console.error('Custom container Block: wp.blocks or registerBlockType is not defined. Block will not be registered.');
            return; // Exit if dependencies are not fully loaded
        }

        const { registerBlockType } = wp.blocks;
        const { InspectorControls, InnerBlocks, useBlockProps } = wp.blockEditor;
        const { PanelBody, SelectControl, TextControl, __experimentalBoxControl: BoxControl, ColorPicker, RangeControl, ToggleControl } = wp.components;
        const { Fragment, useState, useEffect } = wp.element;
        const { select, useSelect, subscribe } = wp.data;
        const { store: viewportStore } = wp.viewport;
        
        // Get current viewport
        function getCurrentViewport() {
            const viewport = select(viewportStore);
            if (viewport.isViewportMatch('< small')) return 'mobile';
            if (viewport.isViewportMatch('< medium')) return 'tablet';
            return 'desktop';
        }
        
        registerBlockType('custom/container', {
            title: 'Container',
            icon: 'layout',
            category: 'design',
            supports: {
                html: false,
                anchor: true,
                className: true
            },
            attributes: " . $attributes_json . ", // Directly embed the JSON string
            
            edit: function(props) {
                console.log('Custom container Block: Edit function loaded and running!'); // Debugging log
                const { attributes, setAttributes } = props;
                const [currentViewport, setCurrentViewport] = useState(getCurrentViewport());
                
                // Subscribe to viewport changes
                useEffect(() => {
                    const unsubscribe = subscribe(() => {
                        const newViewport = getCurrentViewport();
                        if (newViewport !== currentViewport) {
                            setCurrentViewport(newViewport);
                        }
                    });
                    return unsubscribe;
                }, [currentViewport]);
                
                // Helper to update responsive attribute
                const updateResponsiveAttribute = (attributeName, value) => {
                    setAttributes({
                        [attributeName]: {
                            ...attributes[attributeName],
                            [currentViewport]: value
                        }
                    });
                };
                
                // Get current value for responsive attribute
                const getResponsiveValue = (attributeName) => {
                    return attributes[attributeName]?.[currentViewport] || '';
                };
                
                const blockProps = useBlockProps({
                    style: {
                        display: getResponsiveValue('display'),
                        flexDirection: getResponsiveValue('flexDirection'),
                        justifyContent: getResponsiveValue('justifyContent'),
                        alignItems: getResponsiveValue('alignItems'),
                        flexWrap: getResponsiveValue('flexWrap'),
                        gap: getResponsiveValue('gap'),
                        gridTemplateColumns: getResponsiveValue('gridTemplateColumns'),
                        gridTemplateRows: getResponsiveValue('gridTemplateRows'),
                        gridGap: getResponsiveValue('gridGap'),
                        padding: getResponsiveValue('padding') ? Object.values(getResponsiveValue('padding')).join(' ') : undefined,
                        margin: getResponsiveValue('margin') ? Object.values(getResponsiveValue('margin')).join(' ') : undefined,
                        backgroundColor: getResponsiveValue('backgroundColor'),
                        color: getResponsiveValue('textColor'),
                        minHeight: getResponsiveValue('minHeight'),
                        maxWidth: getResponsiveValue('maxWidth'),
                    }
                });
                
                return wp.element.createElement(
                    Fragment,
                    null,
                    wp.element.createElement(
                        InspectorControls,
                        null,
                        wp.element.createElement(
                            'div',
                            { style: { padding: '16px', backgroundColor: '#f0f0f0', marginBottom: '16px' } },
                            wp.element.createElement('strong', null, 'Current Viewport: ' + currentViewport.toUpperCase())
                        ),
                        wp.element.createElement(
                            PanelBody,
                            { title: 'Layout', initialOpen: true },
                            wp.element.createElement(
                                SelectControl,
                                {
                                    label: 'Display',
                                    value: getResponsiveValue('display'),
                                    options: [
                                        { label: 'Flex', value: 'flex' },
                                        { label: 'Grid', value: 'grid' },
                                        { label: 'Block', value: 'block' }
                                    ],
                                    onChange: (value) => updateResponsiveAttribute('display', value),
                                    // Opt-in to new default size and no bottom margin
                                    __next40pxDefaultSize: true,
                                    __nextHasNoMarginBottom: true
                                }
                            ),
                            getResponsiveValue('display') === 'flex' && wp.element.createElement(
                                Fragment,
                                null,
                                wp.element.createElement(
                                    SelectControl,
                                    {
                                        label: 'Flex Direction',
                                        value: getResponsiveValue('flexDirection'),
                                        options: [
                                            { label: 'Row', value: 'row' },
                                            { label: 'Column', value: 'column' },
                                            { label: 'Row Reverse', value: 'row-reverse' },
                                            { label: 'Column Reverse', value: 'column-reverse' }
                                        ],
                                        onChange: (value) => updateResponsiveAttribute('flexDirection', value),
                                        // Opt-in to new default size and no bottom margin
                                        __next40pxDefaultSize: true,
                                        __nextHasNoMarginBottom: true
                                    }
                                ),
                                wp.element.createElement(
                                    SelectControl,
                                    {
                                        label: 'Justify Content',
                                        value: getResponsiveValue('justifyContent'),
                                        options: [
                                            { label: 'Start', value: 'flex-start' },
                                            { label: 'Center', value: 'center' },
                                            { label: 'End', value: 'flex-end' },
                                            { label: 'Space Between', value: 'space-between' },
                                            { label: 'Space Around', value: 'space-around' },
                                            { label: 'Space Evenly', value: 'space-evenly' }
                                        ],
                                        onChange: (value) => updateResponsiveAttribute('justifyContent', value),
                                        // Opt-in to new default size and no bottom margin
                                        __next40pxDefaultSize: true,
                                        __nextHasNoMarginBottom: true
                                    }
                                ),
                                wp.element.createElement(
                                    SelectControl,
                                    {
                                        label: 'Align Items',
                                        value: getResponsiveValue('alignItems'),
                                        options: [
                                            { label: 'Stretch', value: 'stretch' },
                                            { label: 'Start', value: 'flex-start' },
                                            { label: 'Center', value: 'center' },
                                            { label: 'End', value: 'flex-end' },
                                            { label: 'Baseline', value: 'baseline' }
                                        ],
                                        onChange: (value) => updateResponsiveAttribute('alignItems', value),
                                        // Opt-in to new default size and no bottom margin
                                        __next40pxDefaultSize: true,
                                        __nextHasNoMarginBottom: true
                                    }
                                ),
                                wp.element.createElement(
                                    SelectControl,
                                    {
                                        label: 'Flex Wrap',
                                        value: getResponsiveValue('flexWrap'),
                                        options: [
                                            { label: 'No Wrap', value: 'nowrap' },
                                            { label: 'Wrap', value: 'wrap' },
                                            { label: 'Wrap Reverse', value: 'wrap-reverse' }
                                        ],
                                        onChange: (value) => updateResponsiveAttribute('flexWrap', value),
                                        // Opt-in to new default size and no bottom margin
                                        __next40pxDefaultSize: true,
                                        __nextHasNoMarginBottom: true
                                    }
                                ),
                                wp.element.createElement(
                                    TextControl,
                                    {
                                        label: 'Gap',
                                        value: getResponsiveValue('gap'),
                                        onChange: (value) => updateResponsiveAttribute('gap', value),
                                        // Opt-in to new default size and no bottom margin
                                        __next40pxDefaultSize: true,
                                        __nextHasNoMarginBottom: true
                                    }
                                )
                            ),
                            getResponsiveValue('display') === 'grid' && wp.element.createElement(
                                Fragment,
                                null,
                                wp.element.createElement(
                                    TextControl,
                                    {
                                        label: 'Grid Template Columns',
                                        value: getResponsiveValue('gridTemplateColumns'),
                                        onChange: (value) => updateResponsiveAttribute('gridTemplateColumns', value),
                                        help: 'e.g., repeat(3, 1fr) or 200px 1fr 200px',
                                        // Opt-in to new default size and no bottom margin
                                        __next40pxDefaultSize: true,
                                        __nextHasNoMarginBottom: true
                                    }
                                ),
                                wp.element.createElement(
                                    TextControl,
                                    {
                                        label: 'Grid Template Rows',
                                        value: getResponsiveValue('gridTemplateRows'),
                                        onChange: (value) => updateResponsiveAttribute('gridTemplateRows', value),
                                        // Opt-in to new default size and no bottom margin
                                        __next40pxDefaultSize: true,
                                        __nextHasNoMarginBottom: true
                                    }
                                ),
                                wp.element.createElement(
                                    TextControl,
                                    {
                                        label: 'Grid Gap',
                                        value: getResponsiveValue('gridGap'),
                                        onChange: (value) => updateResponsiveAttribute('gridGap', value),
                                        // Opt-in to new default size and no bottom margin
                                        __next40pxDefaultSize: true,
                                        __nextHasNoMarginBottom: true
                                    }
                                )
                            )
                        ),
                        wp.element.createElement(
                            PanelBody,
                            { title: 'Spacing', initialOpen: false },
                            wp.element.createElement(
                                'div',
                                { style: { marginBottom: '20px' } },
                                wp.element.createElement('label', null, 'Padding'),
                                wp.element.createElement(
                                    BoxControl,
                                    {
                                        values: getResponsiveValue('padding'),
                                        onChange: (value) => updateResponsiveAttribute('padding', value)
                                    }
                                )
                            ),
                            wp.element.createElement(
                                'div',
                                null,
                                wp.element.createElement('label', null, 'Margin'),
                                wp.element.createElement(
                                    BoxControl,
                                    {
                                        values: getResponsiveValue('margin'),
                                        onChange: (value) => updateResponsiveAttribute('margin', value)
                                    }
                                )
                            )
                        ),
                        wp.element.createElement(
                            PanelBody,
                            { title: 'Colors', initialOpen: false },
                            wp.element.createElement(
                                'div',
                                { style: { marginBottom: '20px' } },
                                wp.element.createElement('label', null, 'Background Color'),
                                wp.element.createElement(
                                    ColorPicker,
                                    {
                                        color: getResponsiveValue('backgroundColor'),
                                        onChangeComplete: (value) => updateResponsiveAttribute('backgroundColor', value.hex)
                                    }
                                )
                            ),
                            wp.element.createElement(
                                'div',
                                null,
                                wp.element.createElement('label', null, 'Text Color'),
                                wp.element.createElement(
                                    ColorPicker,
                                    {
                                        color: getResponsiveValue('textColor'),
                                        onChangeComplete: (value) => updateResponsiveAttribute('textColor', value.hex)
                                    }
                                )
                            )
                        ),
                        wp.element.createElement(
                            PanelBody,
                            { title: 'Dimensions', initialOpen: false },
                            wp.element.createElement(
                                TextControl,
                                {
                                    label: 'Min Height',
                                    value: getResponsiveValue('minHeight'),
                                    onChange: (value) => updateResponsiveAttribute('minHeight', value),
                                    // Opt-in to new default size and no bottom margin
                                    __next40pxDefaultSize: true,
                                    __nextHasNoMarginBottom: true
                                }
                            ),
                            wp.element.createElement(
                                TextControl,
                                {
                                    label: 'Max Width',
                                    value: getResponsiveValue('maxWidth'),
                                    onChange: (value) => updateResponsiveAttribute('maxWidth', value),
                                    // Opt-in to new default size and no bottom margin
                                    __next40pxDefaultSize: true,
                                    __nextHasNoMarginBottom: true
                                }
                            )
                        )
                    ),
                    wp.element.createElement(
                        'div',
                        blockProps,
                        wp.element.createElement(InnerBlocks)
                    )
                );
            },
            
            save: function() {
                return wp.element.createElement(InnerBlocks.Content);
            }
        });
        console.log('Custom container Block: registerBlockType call completed.'); // Debugging log
    })(window.wp);
    ";
    
    // Add the inline script to our custom script handle
    wp_add_inline_script($script_handle, $script);

    // Enqueue the script
    wp_enqueue_script($script_handle);
});
