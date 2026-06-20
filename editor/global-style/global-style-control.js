/**
 * SNN Global Style Editor — Per-Block Control & Editor Integration
 *
 * Three responsibilities:
 * 1. PER-BLOCK CSS CLASS SELECTOR (simple FormTokenField on ALL blocks)
 * 2. COLOR VARIABLE SYNC (inject global color vars into all ColorPalette controls)
 * 3. BLOCK DEFAULTS OVERRIDE (apply saved defaults at registration time)
 *
 * Kept minimal and separate from the full-screen modal app.
 */
(function () {
    const { addFilter, applyFilters } = wp.hooks;
    const { createElement: el, Fragment, useState, useEffect } = wp.element;
    const { createHigherOrderComponent } = wp.compose;
    const { InspectorControls } = wp.blockEditor || wp.editor;
    const { PanelBody, FormTokenField, Button } = wp.components;
    const { __ } = wp.i18n;

    /* ═══════════════════════════════════════════════
       1. DATA HELPERS
       ═══════════════════════════════════════════════ */
    const editorData = window.SNN_GLOBAL_EDITOR_DATA || {};

    // Get class selector suggestions from DB data
    function getClassSuggestions() {
        const styles = editorData.globalStyles || [];
        // Filter to class selectors (starting with .) and strip the dot
        return styles
            .filter(s => s.selector && s.selector.startsWith('.'))
            .map(s => s.selector.substring(1));
    }

    /* ═══════════════════════════════════════════════
       2. ADD globalStyles ATTRIBUTE TO ALL BLOCKS
       ═══════════════════════════════════════════════ */
    addFilter(
        'blocks.registerBlockType',
        'snn/global-styles/attributes',
        function (settings, name) {
            settings.attributes = Object.assign({}, settings.attributes, {
                globalStyles: { type: 'array', default: [] }
            });
            return settings;
        }
    );

    /* ═══════════════════════════════════════════════
       3. APPLY BLOCK DEFAULTS AT REGISTRATION TIME
       ═══════════════════════════════════════════════ */
    addFilter(
        'blocks.registerBlockType',
        'snn/block-defaults/apply',
        function (settings, name) {
            const defaults = editorData.blockDefaults || {};
            const overrides = defaults[name];
            if (!overrides || typeof overrides !== 'object') return settings;

            Object.keys(overrides).forEach(function (attrName) {
                if (settings.attributes && settings.attributes[attrName] &&
                    settings.attributes[attrName].hasOwnProperty('default')) {
                    settings.attributes[attrName].default = overrides[attrName];
                }
            });
            return settings;
        },
        20 // Lower priority so it runs after the attributes filter
    );

    /* ═══════════════════════════════════════════════
       4. SYNC COLOR VARIABLES INTO ALL ColorPalette
       ═══════════════════════════════════════════════ */
    addFilter(
        'blockEditor.useSetting.before',
        'snn/color-variables/sync',
        function (settingValue, settingName, clientId, blockName) {
            // Only inject into color.palette settings
            if (settingName !== 'color.palette') return settingValue;

            const variables = editorData.globalVariables || [];
            const colorVars = variables.filter(function (v) {
                return v.type === 'color' && v.value && v.name;
            });
            if (colorVars.length === 0) return settingValue;

            // Build color entries from variables
            var customColors = colorVars.map(function (v) {
                var slug = v.name.replace(/^--snn-/i, '').replace(/^--/, '').toLowerCase();
                slug = slug.replace(/[^a-z0-9-]/g, '-');
                return {
                    name: v.label || v.name,
                    slug: 'snn-' + slug,
                    color: v.value,
                };
            });

            // Merge into existing palette
            if (Array.isArray(settingValue)) {
                return settingValue.concat(customColors);
            }
            if (settingValue && typeof settingValue === 'object') {
                return Object.assign({}, settingValue, { theme: customColors });
            }
            return customColors;
        },
        10
    );

    /* ═══════════════════════════════════════════════
       5. PER-BLOCK CSS CLASS SELECTOR (InspectorControls)
       ═══════════════════════════════════════════════ */
    const withGlobalStylesControl = createHigherOrderComponent(function (BlockEdit) {
        return function (props) {
            const [isModalOpen, setIsModalOpen] = useState(false);
            const [suggestions, setSuggestions] = useState(getClassSuggestions());

            // Refresh suggestions when modal closes (data may have changed)
            useEffect(function () {
                if (!isModalOpen) {
                    // Re-read from global data (in case it was updated)
                    setSuggestions(getClassSuggestions());
                }
            }, [isModalOpen]);

            // Refresh on a timer when modal is not open (catches DB saves)
            useEffect(function () {
                if (isModalOpen) return;
                var timer = setInterval(function () {
                    var fresh = getClassSuggestions();
                    setSuggestions(fresh);
                }, 10000); // every 10s
                return function () { clearInterval(timer); };
            }, [isModalOpen]);

            var currentClasses = props.attributes.globalStyles || [];

            function handleChange(value) {
                props.setAttributes({ globalStyles: value });
            }

            // Simple class selector panel
            var classPanel = el(PanelBody, {
                title: __('CSS Classes', 'snn-block'),
                initialOpen: false,
                className: 'snn-global-styles-panel',
            },
                el('div', { style: { padding: '0' } },
                    el(FormTokenField, {
                        label: __('Add Classes', 'snn-block'),
                        value: currentClasses,
                        suggestions: suggestions,
                        onChange: handleChange,
                        help: __('Type class names or pick from existing global styles.', 'snn-block'),
                    }),
                    el(Button, {
                        variant: 'secondary',
                        size: 'small',
                        onClick: function () { setIsModalOpen(true); },
                        icon: 'admin-appearance',
                        style: { width: '100%', justifyContent: 'center', marginTop: '10px' },
                    }, __('Open Global Style Editor', 'snn-block'))
                )
            );

            return el(Fragment, null,
                el(BlockEdit, props),
                el(InspectorControls, null, classPanel),
                // Open full-screen Global Editor modal
                window.SNN_GlobalEditorApp && el(window.SNN_GlobalEditorApp, {
                    isOpen: isModalOpen,
                    onClose: function () { setIsModalOpen(false); },
                })
            );
        };
    }, 'withGlobalStylesControl');

    addFilter('editor.BlockEdit', 'snn/global-styles/block-edit', withGlobalStylesControl);

    /* ═══════════════════════════════════════════════
       6. ADD CLASSES TO EDITOR PREVIEW
       ═══════════════════════════════════════════════ */
    addFilter(
        'editor.BlockListBlock',
        'snn/global-styles/wrapper',
        createHigherOrderComponent(function (BlockListBlock) {
            return function (props) {
                var classes = props.attributes?.globalStyles || [];
                if (classes.length === 0) return el(BlockListBlock, props);
                var className = [props.className, ...classes].filter(Boolean).join(' ');
                return el(BlockListBlock, Object.assign({}, props, { className: className }));
            };
        }, 'withGlobalStylesWrapper')
    );

    /* ═══════════════════════════════════════════════
       7. ADD CLASSES TO FRONTEND OUTPUT
       ═══════════════════════════════════════════════ */
    addFilter(
        'blocks.getSaveContent.extraProps',
        'snn/global-styles/save',
        function (extraProps, blockType, attributes) {
            var classes = attributes.globalStyles || [];
            if (classes.length > 0) {
                extraProps.className = [extraProps.className || '', ...classes].filter(Boolean).join(' ');
            }
            return extraProps;
        }
    );
})();