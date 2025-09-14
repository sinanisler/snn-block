(function () {
    const { addFilter } = wp.hooks;
    const { createElement: el, Fragment, useState, useEffect } = wp.element;
    const { createHigherOrderComponent } = wp.compose;
    const { InspectorControls } = wp.blockEditor || wp.editor;
    const { PanelBody, TextControl, FormTokenField, Button, Flex, FlexItem } = wp.components;
    const { __ } = wp.i18n;

    const isCoreBlock = (name) => /^core\//.test(name);

    // Get global classes from localStorage
    const getGlobalClasses = () => {
        const savedClasses = localStorage.getItem('snn_global_classes');
        if (savedClasses) {
            try {
                return JSON.parse(savedClasses).map(cls => cls.name);
            } catch (e) {
                console.error('Error parsing global classes:', e);
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
                globalClasses: { type: 'array', default: [] }
            });
            return settings;
        }
    );

    // Inject InspectorControls with a FormTokenField for Global Classes
    const withGlobalClassesControl = createHigherOrderComponent((BlockEdit) => {
        return function (props) {
            if (!isCoreBlock(props.name)) return el(BlockEdit, props);
            
            const [isModalOpen, setIsModalOpen] = useState(false);
            const [availableClasses, setAvailableClasses] = useState(getGlobalClasses());
            
            // Update available classes when modal closes
            useEffect(() => {
                if (!isModalOpen) {
                    setAvailableClasses(getGlobalClasses());
                }
            }, [isModalOpen]);
            
            const onChange = (value) => props.setAttributes({ globalClasses: value });
            
            return el(
                Fragment,
                null,
                el(BlockEdit, props),
                el(
                    InspectorControls,
                    null,
                    el(PanelBody, {
                        title: __('Global Classes', 'snn-block'),
                        initialOpen: false,
                        className: 'snn-global-classes-panel'
                    },
                        el('div', { style: { padding: '0' } },
                            el(FormTokenField, {
                                label: __('Add Classes', 'snn-block'),
                                value: props.attributes.globalClasses || [],
                                suggestions: availableClasses,
                                onChange,
                                help: __('Type class names or select from suggestions', 'snn-block')
                            }),
                            el(Button, {
                                variant: 'secondary',
                                size: 'small',
                                onClick: () => setIsModalOpen(true),
                                icon: 'admin-settings',
                                className: 'manage-button',
                                style: { width: '100%', justifyContent: 'center', marginTop: '12px' }
                            }, __('Manage Global Classes', 'snn-block'))
                        )
                    )
                ),
                // Render modal if available and open
                window.SnnGlobalClassesModal && el(window.SnnGlobalClassesModal, {
                    isOpen: isModalOpen,
                    onClose: () => setIsModalOpen(false)
                })
            );
        };
    }, 'withGlobalClassesControl');

    addFilter('editor.BlockEdit', 'snn/extend/all-core-blocks/edit', withGlobalClassesControl);

    // Optional: add editor-only class when populated
    addFilter(
        'editor.BlockListBlock',
        'snn/extend/all-core-blocks/wrapper-prop',
        createHigherOrderComponent((BlockListBlock) => {
            return function (props) {
                if (!isCoreBlock(props.name)) return el(BlockListBlock, props);
                const classes = props.attributes?.globalClasses || [];
                const className = [props.className, ...classes].filter(Boolean).join(' ');
                return el(BlockListBlock, Object.assign({}, props, { className }));
            };
        }, 'withGlobalClassesWrapper')
    );

    // Add global classes to frontend output
    addFilter(
        'blocks.getSaveContent.extraProps',
        'snn/extend/all-core-blocks/save',
        function (extraProps, blockType, attributes) {
            if (!isCoreBlock(blockType.name)) return extraProps;
            const classes = attributes.globalClasses || [];
            if (classes.length > 0) {
                extraProps.className = [extraProps.className || '', ...classes].filter(Boolean).join(' ');
            }
            return extraProps;
        }
    );
})();