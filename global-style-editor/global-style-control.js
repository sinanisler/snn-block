(function () {
    const { addFilter } = wp.hooks;
    const { createElement: el, Fragment, useState, useEffect } = wp.element;
    const { createHigherOrderComponent } = wp.compose;
    const { InspectorControls } = wp.blockEditor || wp.editor;
    const { PanelBody, TextControl, FormTokenField, Button, Flex, FlexItem } = wp.components;
    const { __ } = wp.i18n;

    const isCoreBlock = (name) => /^core\//.test(name);

    // Get global styles from localStorage
    const getGlobalStyles = () => {
        const savedStyles = localStorage.getItem('snn_global_styles');
        if (savedStyles) {
            try {
                return JSON.parse(savedStyles).filter(style => style.selector && style.selector.startsWith('.')).map(style => style.selector.substring(1));
            } catch (e) {
                console.error('Error parsing global styles:', e);
            }
        }
        return ['grid', 'grid-2', 'grid-3', 'grid-4', 'flex', 'margin-top', 'padding-bottom', 'text-center', 'bg-primary', 'border'];
    };

    // Add attribute to all core blocks
    addFilter(
        'blocks.registerBlockType',
        'snn/extend/all-core-blocks/attributes',
        function (settings, name) {
            if (!isCoreBlock(name)) return settings;
            settings.attributes = Object.assign({}, settings.attributes, {
                globalStyles: { type: 'array', default: [] }
            });
            return settings;
        }
    );

    // Inject InspectorControls with a FormTokenField for Global Styles
    const withGlobalStylesControl = createHigherOrderComponent((BlockEdit) => {
        return function (props) {
            if (!isCoreBlock(props.name)) return el(BlockEdit, props);
            
            const [isModalOpen, setIsModalOpen] = useState(false);
            const [availableStyles, setAvailableStyles] = useState(getGlobalStyles());
            
            // Update available styles when modal closes
            useEffect(() => {
                if (!isModalOpen) {
                    setAvailableStyles(getGlobalStyles());
                }
            }, [isModalOpen]);
            
            const onChange = (value) => props.setAttributes({ globalStyles: value });
            
            return el(
                Fragment,
                null,
                el(BlockEdit, props),
                el(
                    InspectorControls,
                    null,
                    el(PanelBody, {
                        title: __('Global Styles', 'snn-block'),
                        initialOpen: false,
                        className: 'snn-global-styles-panel'
                    },
                        el('div', { style: { padding: '0' } },
                            el(FormTokenField, {
                                label: __('Add CSS Classes', 'snn-block'),
                                value: props.attributes.globalStyles || [],
                                suggestions: availableStyles,
                                onChange,
                                help: __('Type class names or select from suggestions (from Global Style Manager)', 'snn-block')
                            }),
                            el(Button, {
                                variant: 'secondary',
                                size: 'small',
                                onClick: () => setIsModalOpen(true),
                                icon: 'admin-settings',
                                className: 'manage-button',
                                style: { width: '100%', justifyContent: 'center', marginTop: '12px' }
                            }, __('Manage Global Styles', 'snn-block'))
                        )
                    )
                ),
                // Render modal if available and open
                window.SnnGlobalStyleModal && el(window.SnnGlobalStyleModal, {
                    isOpen: isModalOpen,
                    onClose: () => setIsModalOpen(false)
                })
            );
        };
    }, 'withGlobalStylesControl');

    addFilter('editor.BlockEdit', 'snn/extend/all-core-blocks/edit', withGlobalStylesControl);

    // Optional: add editor-only class when populated
    addFilter(
        'editor.BlockListBlock',
        'snn/extend/all-core-blocks/wrapper-prop',
        createHigherOrderComponent((BlockListBlock) => {
            return function (props) {
                if (!isCoreBlock(props.name)) return el(BlockListBlock, props);
                const classes = props.attributes?.globalStyles || [];
                const className = [props.className, ...classes].filter(Boolean).join(' ');
                return el(BlockListBlock, Object.assign({}, props, { className }));
            };
        }, 'withGlobalStylesWrapper')
    );

    // Add global styles to frontend output
    addFilter(
        'blocks.getSaveContent.extraProps',
        'snn/extend/all-core-blocks/save',
        function (extraProps, blockType, attributes) {
            if (!isCoreBlock(blockType.name)) return extraProps;
            const classes = attributes.globalStyles || [];
            if (classes.length > 0) {
                extraProps.className = [extraProps.className || '', ...classes].filter(Boolean).join(' ');
            }
            return extraProps;
        }
    );
})();