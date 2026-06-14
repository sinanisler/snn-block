/**
 * SNN Global Style Editor — Full-Screen Modal App
 *
 * Three tabs:
 *   1. Classes  — CSS utility class manager (existing)
 *   2. Variables — Global CSS variable / design token manager (new)
 *   3. Block Defaults — Per-block default attribute overrides (new)
 *
 * Uses wp.element.createElement (el) for DOM — no JSX needed.
 * All data persisted via wp.apiFetch to WordPress REST API.
 */

(function () {
    const { createElement: el, useState, useEffect, useRef, useCallback, Fragment } = wp.element;
    const { Modal, Button, TextControl, TextareaControl, SelectControl, ColorPicker, ColorPalette, Notice, Flex, FlexItem, ComboboxControl, FormTokenField, ToggleControl, RangeControl, BaseControl, PanelBody, Spinner } = wp.components;
    const { __ } = wp.i18n;
    const apiFetch = wp.apiFetch;
    const { useSelect, useDispatch, select, dispatch } = wp.data;

    /* ═══════════════════════════════════════════════
       INITIAL DATA
       ═══════════════════════════════════════════════ */
    const initialData = window.SNN_GLOBAL_EDITOR_DATA || {
        globalStyles: [],
        globalVariables: [],
        blockDefaults: {},
    };

    /* ─── API helpers ─── */
    function sanitizeCSSVal(str) {
        return String(str || '').replace(/[<>"'`]/g, '');
    }

    /* ═══════════════════════════════════════════════
       MAIN APP COMPONENT
       ═══════════════════════════════════════════════ */
    const GlobalEditorApp = ({ isOpen, onClose }) => {
        const [activeTab, setActiveTab] = useState('classes');
        const [globalStyles, setGlobalStyles] = useState(initialData.globalStyles || []);
        const [globalVariables, setGlobalVariables] = useState(initialData.globalVariables || []);
        const [blockDefaults, setBlockDefaults] = useState(initialData.blockDefaults || {});
        const [notice, setNotice] = useState(null);
        const [saving, setSaving] = useState(false);

        // ── Show notice ──
        const showNotice = useCallback((msg, type) => {
            setNotice({ msg, type });
            setTimeout(() => setNotice(null), 4000);
        }, []);

        // ── Save to DB via REST API ──
        const saveToDB = useCallback(async (key, data) => {
            setSaving(true);
            try {
                await apiFetch({
                    path: '/wp/v2/settings',
                    method: 'POST',
                    data: { [key]: data },
                });
                return true;
            } catch (err) {
                console.error('Error saving:', err);
                showNotice(__('Error saving to database: ', 'snn-block') + (err.message || 'Unknown'), 'error');
                return false;
            } finally {
                setSaving(false);
            }
        }, [showNotice]);

        // ── Save classes ──
        const saveClasses = useCallback(async (newStyles) => {
            setGlobalStyles(newStyles);
            const ok = await saveToDB('snn_global_styles', newStyles);
            if (ok) {
                updateStyleSheetClasses(newStyles);
                showNotice(__('Styles saved!', 'snn-block'), 'success');
            }
            return ok;
        }, [saveToDB, showNotice]);

        // ── Save variables ──
        const saveVariables = useCallback(async (newVars) => {
            setGlobalVariables(newVars);
            const ok = await saveToDB('snn_global_variables', newVars);
            if (ok) {
                updateStyleSheetVariables(newVars);
                showNotice(__('Variables saved!', 'snn-block'), 'success');
            }
            return ok;
        }, [saveToDB, showNotice]);

        // ── Save block defaults ──
        const saveBlockDefaults = useCallback(async (newDefaults) => {
            setBlockDefaults(newDefaults);
            const ok = await saveToDB('snn_block_defaults', newDefaults);
            if (ok) {
                showNotice(__('Block defaults saved! Refresh the editor to apply to new blocks.', 'snn-block'), 'success');
            }
            return ok;
        }, [saveToDB, showNotice]);

        // ── Dynamic stylesheet for classes ──
        const updateStyleSheetClasses = useCallback((styles) => {
            let elSheet = document.getElementById('snn-global-classes');
            if (!elSheet) {
                elSheet = document.createElement('style');
                elSheet.id = 'snn-global-classes';
                document.head.appendChild(elSheet);
            }
            elSheet.textContent = styles.map(s => `${s.selector} { ${s.css} }`).join('\n');
        }, []);

        // ── Dynamic stylesheet for variables ──
        const updateStyleSheetVariables = useCallback((vars) => {
            let elSheet = document.getElementById('snn-global-variables');
            if (!elSheet) {
                elSheet = document.createElement('style');
                elSheet.id = 'snn-global-variables';
                document.head.appendChild(elSheet);
            }
            const colorVars = vars.filter(v => v.name).map(v => `${v.name}: ${v.value};`);
            elSheet.textContent = colorVars.length ? `:root {\n  ${colorVars.join('\n  ')}\n}` : '';
        }, []);

        // ── Init stylesheets on mount ──
        useEffect(() => {
            updateStyleSheetClasses(globalStyles);
            updateStyleSheetVariables(globalVariables);
        }, []);

        if (!isOpen) return null;

        return el(Fragment, null,
            // Notice
            notice && el('div', { className: 'snn-ge-notice' },
                el(Notice, {
                    status: notice.type || 'success',
                    isDismissible: true,
                    onRemove: () => setNotice(null),
                }, notice.msg)
            ),

            el(Modal, {
                title: __('Global Style Editor', 'snn-block'),
                onRequestClose: onClose,
                className: 'snn-global-editor-modal',
            },
                // ── Tabs ──
                el('div', { className: 'snn-ge-tabs' },
                    el(Button, {
                        className: 'snn-ge-tab' + (activeTab === 'classes' ? ' active' : ''),
                        onClick: () => setActiveTab('classes'),
                    }, __('CSS Classes', 'snn-block'),
                        el('span', { className: 'snn-ge-tab-count' }, String(globalStyles.length))
                    ),
                    el(Button, {
                        className: 'snn-ge-tab' + (activeTab === 'variables' ? ' active' : ''),
                        onClick: () => setActiveTab('variables'),
                    }, __('CSS Variables', 'snn-block'),
                        el('span', { className: 'snn-ge-tab-count' }, String(globalVariables.length))
                    ),
                    el(Button, {
                        className: 'snn-ge-tab' + (activeTab === 'defaults' ? ' active' : ''),
                        onClick: () => setActiveTab('defaults'),
                    }, __('Block Defaults', 'snn-block'),
                        el('span', { className: 'snn-ge-tab-count' }, String(Object.keys(blockDefaults).length))
                    ),
                ),

                // ── Content panels ──
                el('div', { className: 'snn-ge-content' },
                    // ── Tab 1: CSS Classes ──
                    el('div', {
                        className: 'snn-ge-panel' + (activeTab === 'classes' ? ' active' : ''),
                    }, el(ClassesPanel, {
                        styles: globalStyles,
                        onSave: saveClasses,
                        saving: saving,
                        showNotice: showNotice,
                    })),

                    // ── Tab 2: CSS Variables ──
                    el('div', {
                        className: 'snn-ge-panel' + (activeTab === 'variables' ? ' active' : ''),
                    }, el(VariablesPanel, {
                        variables: globalVariables,
                        onSave: saveVariables,
                        saving: saving,
                        showNotice: showNotice,
                    })),

                    // ── Tab 3: Block Defaults ──
                    el('div', {
                        className: 'snn-ge-panel' + (activeTab === 'defaults' ? ' active' : ''),
                    }, el(BlockDefaultsPanel, {
                        defaults: blockDefaults,
                        onSave: saveBlockDefaults,
                        saving: saving,
                        showNotice: showNotice,
                    })),
                ),

                // ── Saving overlay ──
                saving && el('div', {
                    style: {
                        position: 'absolute', bottom: '20px', left: '50%',
                        transform: 'translateX(-50%)', zIndex: 100,
                        background: '#007cba', color: '#fff',
                        padding: '6px 16px', borderRadius: '4px',
                        fontSize: '12px', fontWeight: 600,
                    }
                }, __('Saving...', 'snn-block'))
            )
        );
    };

    /* ═══════════════════════════════════════════════
       TAB 1: CSS CLASSES PANEL
       ═══════════════════════════════════════════════ */
    const ClassesPanel = ({ styles, onSave, saving }) => {
        const [search, setSearch] = useState('');
        const [editing, setEditing] = useState(null);
        const [selector, setSelector] = useState('');
        const [css, setCss] = useState('');

        const filtered = styles.filter(s =>
            s.selector.toLowerCase().includes(search.toLowerCase()) ||
            s.css.toLowerCase().includes(search.toLowerCase())
        );

        const reset = () => {
            setEditing(null);
            setSelector('');
            setCss('');
        };

        const handleEdit = (item) => {
            setEditing(item);
            setSelector(item.selector);
            setCss(item.css);
        };

        const handleSave = async () => {
            if (!selector.trim() || !css.trim()) return;
            const data = {
                id: editing?.id || Date.now(),
                selector: selector.trim(),
                css: css.trim(),
                created: editing?.created || new Date().toISOString(),
                modified: new Date().toISOString(),
            };
            let newStyles;
            if (editing) {
                newStyles = styles.map(s => s.id === editing.id ? data : s);
            } else {
                newStyles = [...styles, data];
            }
            await onSave(newStyles);
            reset();
        };

        const handleDelete = async (id) => {
            if (!confirm(__('Delete this style?', 'snn-block'))) return;
            await onSave(styles.filter(s => s.id !== id));
            if (editing?.id === id) reset();
        };

        return el('div', { style: { display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' } },
            el('div', { className: 'snn-ge-toolbar' },
                el('div', { className: 'snn-ge-search', style: { flex: 1 } },
                    el(TextControl, {
                        placeholder: __('Search classes...', 'snn-block'),
                        value: search,
                        onChange: setSearch,
                        hideLabelFromVision: true,
                    })
                ),
                el(Button, {
                    variant: editing ? 'secondary' : 'primary',
                    onClick: reset,
                    disabled: !editing && !selector && !css,
                }, editing ? __('Cancel', 'snn-block') : __('New Style', 'snn-block'))
            ),

            el('div', { className: 'snn-ge-split', style: { flex: 1, minHeight: 0 } },
                // Left: list
                el('div', { className: 'snn-ge-split-left' },
                    filtered.length === 0
                        ? el('div', { className: 'snn-ge-empty' },
                            el('div', { className: 'snn-ge-empty-icon' }, '🎨'),
                            el('h3', {}, search ? __('No matching styles', 'snn-block') : __('No styles yet', 'snn-block')),
                            el('p', {}, __('Create your first CSS class style.', 'snn-block'))
                          )
                        : el('div', { className: 'snn-ge-list' },
                            filtered.map(item => el('div', {
                                key: item.id,
                                className: 'snn-ge-list-item' + (editing?.id === item.id ? ' active' : ''),
                                onClick: () => handleEdit(item),
                            },
                                el('div', { className: 'snn-ge-list-item-title' }, item.selector),
                                el('div', { className: 'snn-ge-list-item-sub' },
                                    item.css.length > 60 ? item.css.substring(0, 60) + '...' : item.css
                                ),
                                el('div', { className: 'snn-ge-list-item-actions' },
                                    el(Button, {
                                        variant: 'tertiary', size: 'small',
                                        icon: 'edit',
                                        onClick: (e) => { e.stopPropagation(); handleEdit(item); },
                                        title: __('Edit', 'snn-block'),
                                    }),
                                    el(Button, {
                                        variant: 'tertiary', size: 'small',
                                        icon: 'trash',
                                        className: 'delete-button',
                                        onClick: (e) => { e.stopPropagation(); handleDelete(item.id); },
                                        title: __('Delete', 'snn-block'),
                                    })
                                )
                            ))
                          )
                ),

                // Right: editor
                el('div', { className: 'snn-ge-split-right' },
                    el('div', { className: 'snn-ge-form' },
                        el('h3', {}, editing ? __('Edit Style', 'snn-block') : __('Add New Style', 'snn-block')),
                        el(TextControl, {
                            label: __('CSS Selector', 'snn-block'),
                            value: selector,
                            onChange: setSelector,
                            placeholder: '.my-class, #my-id, h2, .btn:hover',
                            help: __('Class, ID, tag, or any valid CSS selector.', 'snn-block'),
                        }),
                        el(TextareaControl, {
                            label: __('CSS Rules', 'snn-block'),
                            value: css,
                            onChange: setCss,
                            placeholder: 'color: red;\nfont-size: 16px;',
                            rows: 6,
                            help: __('CSS property: value; pairs without the selector.', 'snn-block'),
                        }),

                        selector && css && el('div', { className: 'snn-ge-preview' },
                            el('div', { className: 'snn-ge-preview-title' }, __('Preview', 'snn-block')),
                            el('div', { className: 'snn-ge-preview-code' },
                                `${selector} {\n  ${css.split('\n').join('\n  ')}\n}`
                            )
                        ),

                        el(Flex, { justify: 'flex-start', style: { marginTop: '12px' } },
                            el(FlexItem, {},
                                el(Button, {
                                    variant: 'primary',
                                    onClick: handleSave,
                                    disabled: !selector.trim() || !css.trim() || saving,
                                    isBusy: saving,
                                }, editing ? __('Update Style', 'snn-block') : __('Add Style', 'snn-block'))
                            )
                        )
                    )
                )
            )
        );
    };

    /* ═══════════════════════════════════════════════
       TAB 2: CSS VARIABLES PANEL
       ═══════════════════════════════════════════════ */
    const VariablesPanel = ({ variables, onSave, saving }) => {
        const [search, setSearch] = useState('');
        const [editing, setEditing] = useState(null);
        const [varName, setVarName] = useState('');
        const [varValue, setVarValue] = useState('');
        const [varType, setVarType] = useState('color');
        const [varLabel, setVarLabel] = useState('');

        const filtered = variables.filter(v =>
            (v.name || '').toLowerCase().includes(search.toLowerCase()) ||
            (v.label || '').toLowerCase().includes(search.toLowerCase()) ||
            (v.value || '').toLowerCase().includes(search.toLowerCase())
        );

        const reset = () => {
            setEditing(null);
            setVarName('');
            setVarValue('');
            setVarType('color');
            setVarLabel('');
        };

        const handleEdit = (item) => {
            setEditing(item);
            setVarName(item.name);
            setVarValue(item.value);
            setVarType(item.type || 'color');
            setVarLabel(item.label || '');
        };

        const handleSave = async () => {
            const cleanName = varName.trim();
            if (!cleanName) return;
            // Auto-prefix with -- if missing
            const finalName = cleanName.startsWith('--') ? cleanName : '--' + cleanName;
            // Check duplicate
            if (variables.some(v => v.name === finalName && v.id !== editing?.id)) {
                alert(__('A variable with this name already exists.', 'snn-block'));
                return;
            }

            const data = {
                id: editing?.id || Date.now(),
                name: finalName,
                value: varValue.trim(),
                type: varType,
                label: varLabel.trim() || finalName,
                created: editing?.created || new Date().toISOString(),
                modified: new Date().toISOString(),
            };
            let newVars;
            if (editing) {
                newVars = variables.map(v => v.id === editing.id ? data : v);
            } else {
                newVars = [...variables, data];
            }
            await onSave(newVars);
            reset();
        };

        const handleDelete = async (id) => {
            if (!confirm(__('Delete this variable?', 'snn-block'))) return;
            await onSave(variables.filter(v => v.id !== id));
            if (editing?.id === id) reset();
        };

        const varTypeOptions = [
            { label: __('Color', 'snn-block'), value: 'color' },
            { label: __('Size', 'snn-block'), value: 'size' },
            { label: __('Font', 'snn-block'), value: 'font' },
            { label: __('Number', 'snn-block'), value: 'number' },
            { label: __('String', 'snn-block'), value: 'string' },
        ];

        // Color value helper
        const isColorType = varType === 'color';

        return el('div', { style: { display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' } },
            el('div', { className: 'snn-ge-toolbar' },
                el('div', { className: 'snn-ge-search', style: { flex: 1 } },
                    el(TextControl, {
                        placeholder: __('Search variables...', 'snn-block'),
                        value: search,
                        onChange: setSearch,
                        hideLabelFromVision: true,
                    })
                ),
                el(Button, {
                    variant: editing ? 'secondary' : 'primary',
                    onClick: reset,
                    disabled: !editing && !varName && !varValue,
                }, editing ? __('Cancel', 'snn-block') : __('New Variable', 'snn-block'))
            ),

            el('div', { className: 'snn-ge-split', style: { flex: 1, minHeight: 0 } },
                // Left: list
                el('div', { className: 'snn-ge-split-left' },
                    filtered.length === 0
                        ? el('div', { className: 'snn-ge-empty' },
                            el('div', { className: 'snn-ge-empty-icon' }, '🎨'),
                            el('h3', {}, search ? __('No matching variables', 'snn-block') : __('No variables yet', 'snn-block')),
                            el('p', {}, __('Define global CSS variables or design tokens.', 'snn-block')),
                          )
                        : el('div', { className: 'snn-ge-list' },
                            filtered.map(item => el('div', {
                                key: item.id,
                                className: 'snn-ge-list-item' + (editing?.id === item.id ? ' active' : ''),
                                onClick: () => handleEdit(item),
                            },
                                el('div', { style: { display: 'flex', alignItems: 'center', gap: '6px' } },
                                    item.type === 'color' && item.value && el('span', {
                                        className: 'snn-ge-color-swatch',
                                        style: { backgroundColor: item.value },
                                    }),
                                    el('div', { className: 'snn-ge-list-item-title' }, item.name)
                                ),
                                el('div', { className: 'snn-ge-list-item-sub' },
                                    item.value + (item.type ? ' (' + item.type + ')' : '')
                                ),
                                el('div', { className: 'snn-ge-list-item-actions' },
                                    el(Button, {
                                        variant: 'tertiary', size: 'small',
                                        icon: 'edit',
                                        onClick: (e) => { e.stopPropagation(); handleEdit(item); },
                                        title: __('Edit', 'snn-block'),
                                    }),
                                    el(Button, {
                                        variant: 'tertiary', size: 'small',
                                        icon: 'trash',
                                        className: 'delete-button',
                                        onClick: (e) => { e.stopPropagation(); handleDelete(item.id); },
                                        title: __('Delete', 'snn-block'),
                                    })
                                )
                            ))
                          )
                ),

                // Right: editor
                el('div', { className: 'snn-ge-split-right' },
                    el('div', { className: 'snn-ge-form' },
                        el('h3', {}, editing ? __('Edit Variable', 'snn-block') : __('Add New Variable', 'snn-block')),

                        el(TextControl, {
                            label: __('Variable Name', 'snn-block'),
                            value: varName,
                            onChange: setVarName,
                            placeholder: 'color-primary, --spacing-lg',
                            help: __('Name will be auto-prefixed with -- if missing.', 'snn-block'),
                        }),

                        el(SelectControl, {
                            label: __('Type', 'snn-block'),
                            value: varType,
                            options: varTypeOptions,
                            onChange: setVarType,
                        }),

                        isColorType
                            ? el(Fragment, null,
                                el(BaseControl, {
                                    label: __('Color Value', 'snn-block'),
                                    id: 'snn-ge-color-input',
                                },
                                    el('div', { style: { display: 'flex', gap: '8px', alignItems: 'flex-start' } },
                                        el('input', {
                                            type: 'text',
                                            value: varValue,
                                            onChange: (e) => setVarValue(e.target.value),
                                            placeholder: '#007cba',
                                            style: {
                                                flex: 1, padding: '6px 8px', fontSize: '13px',
                                                border: '1px solid #ddd', borderRadius: '4px',
                                                fontFamily: 'monospace',
                                            }
                                        }),
                                        varValue && el('input', {
                                            type: 'color',
                                            value: varValue,
                                            onChange: (e) => setVarValue(e.target.value),
                                            style: { width: '36px', height: '36px', padding: 0, border: '1px solid #ddd', borderRadius: '4px', cursor: 'pointer' }
                                        })
                                    )
                                ),
                                el('div', { style: { fontSize: '10px', color: '#007cba', fontWeight: 500, marginTop: '-4px', marginBottom: '8px' } },
                                    __('✅ Color variables automatically sync to ALL block color pickers.', 'snn-block')
                                )
                              )
                            : el(TextControl, {
                                label: __('Value', 'snn-block'),
                                value: varValue,
                                onChange: setVarValue,
                                placeholder: varType === 'size' ? '16px, 2rem, 100%' : varType === 'font' ? '"Open Sans", sans-serif' : 'value',
                            }),

                        el(TextControl, {
                            label: __('Label (optional)', 'snn-block'),
                            value: varLabel,
                            onChange: setVarLabel,
                            placeholder: __('Primary Color', 'snn-block'),
                        }),

                        // Preview
                        varName && varValue && el('div', { className: 'snn-ge-preview' },
                            el('div', { className: 'snn-ge-preview-title' }, __('CSS Output', 'snn-block')),
                            el('div', { className: 'snn-ge-preview-code' },
                                `:root {\n  ${varName.startsWith('--') ? varName : '--' + varName}: ${varValue};\n}`
                            )
                        ),

                        el(Flex, { justify: 'flex-start', style: { marginTop: '12px' } },
                            el(FlexItem, {},
                                el(Button, {
                                    variant: 'primary',
                                    onClick: handleSave,
                                    disabled: !varName.trim() || !varValue.trim() || saving,
                                    isBusy: saving,
                                }, editing ? __('Update Variable', 'snn-block') : __('Add Variable', 'snn-block'))
                            )
                        )
                    )
                )
            )
        );
    };

    /* ═══════════════════════════════════════════════
       TAB 3: BLOCK DEFAULTS PANEL
       ═══════════════════════════════════════════════ */
    const BlockDefaultsPanel = ({ defaults, onSave, saving }) => {
        const [selectedBlock, setSelectedBlock] = useState('');
        const [blockOptions, setBlockOptions] = useState([]);
        const [blockAttrs, setBlockAttrs] = useState({});
        const [editedAttrs, setEditedAttrs] = useState({});
        const [searchBlock, setSearchBlock] = useState('');
        const [collapsed, setCollapsed] = useState({});

        // Load all registered blocks
        useEffect(() => {
            const types = wp.blocks.getBlockTypes() || [];
            const opts = types
                .filter(t => t.name && t.title)
                .sort((a, b) => (a.title || '').localeCompare(b.title || ''))
                .map(t => ({
                    label: (t.title || t.name) + ' (' + t.name + ')',
                    value: t.name,
                }));
            setBlockOptions(opts);
        }, []);

        // When block selected, load its attributes and current defaults
        useEffect(() => {
            if (!selectedBlock) {
                setBlockAttrs({});
                setEditedAttrs({});
                return;
            }
            const type = wp.blocks.getBlockType(selectedBlock);
            if (!type || !type.attributes) {
                setBlockAttrs({});
                setEditedAttrs({});
                return;
            }

            const attrDefs = type.attributes;
            setBlockAttrs(attrDefs);

            // Merge existing defaults with original defaults
            const existing = defaults[selectedBlock] || {};
            const merged = {};
            Object.keys(attrDefs).forEach(key => {
                const attr = attrDefs[key];
                if (attr.hasOwnProperty('default') || existing.hasOwnProperty(key)) {
                    merged[key] = existing.hasOwnProperty(key) ? existing[key] : undefined;
                }
            });
            setEditedAttrs(merged);
        }, [selectedBlock, defaults]);

        const handleAttrChange = (attrName, value) => {
            setEditedAttrs(prev => ({
                ...prev,
                [attrName]: value === '' ? undefined : value,
            }));
        };

        const handleSaveDefaults = async () => {
            // Clean: remove undefined values
            const clean = {};
            Object.keys(editedAttrs).forEach(key => {
                if (editedAttrs[key] !== undefined) {
                    clean[key] = editedAttrs[key];
                }
            });

            const newDefaults = {
                ...defaults,
                [selectedBlock]: Object.keys(clean).length > 0 ? clean : undefined,
            };

            // Remove block entry if empty
            if (!newDefaults[selectedBlock]) {
                delete newDefaults[selectedBlock];
            }

            await onSave(newDefaults);
        };

        const handleResetBlock = async () => {
            const newDefaults = { ...defaults };
            delete newDefaults[selectedBlock];
            await onSave(newDefaults);
            setEditedAttrs({});
        };

        const handleResetAll = async () => {
            if (!confirm(__('Reset ALL block defaults? This cannot be undone.', 'snn-block'))) return;
            await onSave({});
            setEditedAttrs({});
        };

        // Filter block options by search
        const filteredBlockOptions = searchBlock
            ? blockOptions.filter(o => o.label.toLowerCase().includes(searchBlock.toLowerCase()))
            : blockOptions;

        // Get original defaults for reference
        const getOriginalDefault = (attrName) => {
            const attr = blockAttrs[attrName];
            return attr ? attr.default : undefined;
        };

        const isModified = (attrName) => {
            return editedAttrs[attrName] !== undefined &&
                JSON.stringify(editedAttrs[attrName]) !== JSON.stringify(getOriginalDefault(attrName));
        };

        // Render appropriate control based on attribute type
        const renderAttrControl = (attrName, attrDef) => {
            const currentVal = editedAttrs[attrName];
            const origDefault = getOriginalDefault(attrName);
            const hasDefault = attrDef.hasOwnProperty('default');
            const isObject = attrDef.type === 'object';

            // Detect responsive object pattern: { desktop, tablet, mobile }
            const isResponsive = isObject && (
                (origDefault && typeof origDefault === 'object' &&
                    ('desktop' in origDefault || 'tablet' in origDefault || 'mobile' in origDefault))
            );

            // Check if it's a padding-like object (has top/right/bottom/left)
            const isPaddingLike = isObject && origDefault &&
                typeof origDefault === 'object' &&
                ('top' in origDefault || 'right' in origDefault || 'left' in origDefault || 'bottom' in origDefault) &&
                !isResponsive;

            // Check enum
            const enumVals = attrDef.enum;

            if (isResponsive) {
                return renderResponsiveControl(attrName, currentVal, origDefault);
            }
            if (isPaddingLike) {
                return renderPaddingControl(attrName, currentVal, origDefault);
            }
            if (enumVals && Array.isArray(enumVals)) {
                const opts = enumVals.map(v => ({ label: String(v), value: v }));
                opts.unshift({ label: __('Default', 'snn-block'), value: '' });
                return el(SelectControl, {
                    label: attrName,
                    value: currentVal !== undefined ? String(currentVal) : '',
                    options: opts,
                    onChange: (v) => handleAttrChange(attrName, v || undefined),
                });
            }
            if (attrDef.type === 'boolean') {
                return el(ToggleControl, {
                    label: attrName,
                    checked: currentVal === true,
                    onChange: (v) => handleAttrChange(attrName, v),
                });
            }
            if (attrDef.type === 'number') {
                return el(RangeControl, {
                    label: attrName,
                    value: currentVal !== undefined ? Number(currentVal) : 0,
                    onChange: (v) => handleAttrChange(attrName, v),
                    min: 0, max: 500, step: 1,
                    withInputField: true,
                    __next40pxDefaultSize: true,
                    __nextHasNoMarginBottom: true,
                });
            }
            if (attrDef.type === 'string') {
                return el(TextControl, {
                    label: attrName,
                    value: currentVal !== undefined ? String(currentVal) : '',
                    onChange: (v) => handleAttrChange(attrName, v),
                    placeholder: origDefault !== undefined ? 'Default: ' + JSON.stringify(origDefault) : '',
                });
            }
            // Fallback: text JSON input
            return el(TextareaControl, {
                label: attrName,
                value: currentVal !== undefined ? JSON.stringify(currentVal) : '',
                onChange: (v) => {
                    try { handleAttrChange(attrName, JSON.parse(v)); }
                    catch (e) { handleAttrChange(attrName, v); }
                },
                placeholder: origDefault !== undefined ? 'Default: ' + JSON.stringify(origDefault) : '',
                rows: 2,
            });
        };

        // Responsive device control
        const renderResponsiveControl = (attrName, currentVal, origDefault) => {
            const devices = ['desktop', 'tablet', 'mobile'];
            const labels = { desktop: __('Desktop', 'snn-block'), tablet: __('Tablet', 'snn-block'), mobile: __('Mobile', 'snn-block') };

            const cur = currentVal || {};
            const def = origDefault || {};

            return el('div', { key: attrName, className: 'snn-ge-attr-group' },
                el('h4', {}, attrName + ' ' + __('(Responsive)', 'snn-block')),
                devices.map(device =>
                    el('div', { key: device, style: { marginBottom: '8px' } },
                        el('div', { style: { display: 'flex', alignItems: 'center', gap: '8px' } },
                            el('span', {
                                style: {
                                    fontSize: '10px', fontWeight: 600, textTransform: 'uppercase',
                                    color: device === 'desktop' ? '#3858e9' : device === 'tablet' ? '#7b5cf0' : '#f59e0b',
                                    minWidth: '50px',
                                }
                            }, labels[device]),
                            el('input', {
                                type: 'text',
                                value: cur[device] !== undefined ? String(cur[device]) : '',
                                onChange: (e) => {
                                    const newVal = { ...cur, [device]: e.target.value || undefined };
                                    if (!newVal[device]) delete newVal[device];
                                    handleAttrChange(attrName, Object.keys(newVal).length ? newVal : undefined);
                                },
                                placeholder: def[device] !== undefined ? 'Default: ' + def[device] : '',
                                style: {
                                    flex: 1, padding: '4px 6px', fontSize: '12px',
                                    border: '1px solid #ddd', borderRadius: '3px',
                                    fontFamily: 'monospace',
                                }
                            })
                        )
                    )
                )
            );
        };

        // Padding-like control (top/right/bottom/left)
        const renderPaddingControl = (attrName, currentVal, origDefault) => {
            const sides = [
                { key: 'top', label: 'T' },
                { key: 'right', label: 'R' },
                { key: 'bottom', label: 'B' },
                { key: 'left', label: 'L' },
            ];
            const cur = currentVal || {};
            const def = origDefault || {};

            return el('div', { key: attrName, className: 'snn-ge-attr-group' },
                el('h4', {}, attrName),
                el('div', { style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' } },
                    sides.map(s => el('div', { key: s.key },
                        el('span', { style: { fontSize: '9px', color: '#757575', display: 'block' } }, s.label),
                        el('input', {
                            type: 'text',
                            value: cur[s.key] || '',
                            onChange: (e) => {
                                const newVal = { ...cur, [s.key]: e.target.value };
                                handleAttrChange(attrName, Object.values(newVal).some(v => v) ? newVal : undefined);
                            },
                            placeholder: def[s.key] || '',
                            style: {
                                width: '100%', padding: '4px 6px', fontSize: '12px',
                                border: '1px solid #ddd', borderRadius: '2px', boxSizing: 'border-box',
                            }
                        })
                    ))
                )
            );
        };

        // Group attributes by category
        const getAttrGroups = () => {
            const groups = {};
            Object.keys(blockAttrs).forEach(key => {
                const attr = blockAttrs[key];
                if (!attr.hasOwnProperty('default') && !editedAttrs.hasOwnProperty(key)) return;

                // Categorize
                let group = 'other';
                if (/color|colour/i.test(key)) group = 'colors';
                else if (/padding|margin|gap|spacing|width|height|minHeight|maxWidth/i.test(key)) group = 'spacing';
                else if (/font|text|typography|size|lineHeight|letter/i.test(key)) group = 'typography';
                else if (/display|flex|grid|direction|wrap|align|justify/i.test(key)) group = 'layout';
                else if (/border|radius|shadow|outline/i.test(key)) group = 'borders';
                else if (/bg|background|image|overflow/i.test(key)) group = 'background';

                if (!groups[group]) groups[group] = [];
                groups[group].push(key);
            });
            return groups;
        };

        const groupLabels = {
            colors: __('Colors', 'snn-block'),
            spacing: __('Spacing & Sizing', 'snn-block'),
            typography: __('Typography', 'snn-block'),
            layout: __('Layout', 'snn-block'),
            borders: __('Borders', 'snn-block'),
            background: __('Background', 'snn-block'),
            other: __('Other', 'snn-block'),
        };

        const groupOrder = ['colors', 'typography', 'spacing', 'layout', 'borders', 'background', 'other'];

        return el('div', { style: { display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' } },
            // Block selector
            el('div', { className: 'snn-ge-toolbar' },
                el('div', { className: 'snn-ge-search snn-ge-block-selector', style: { flex: 1 } },
                    el(ComboboxControl, {
                        label: __('Select Block', 'snn-block'),
                        value: selectedBlock,
                        options: filteredBlockOptions,
                        onChange: setSelectedBlock,
                        onFilterValueChange: setSearchBlock,
                        placeholder: __('Search blocks...', 'snn-block'),
                        __next40pxDefaultSize: true,
                        __nextHasNoMarginBottom: true,
                    })
                ),
                selectedBlock && el(Button, {
                    variant: 'secondary',
                    onClick: handleResetBlock,
                    disabled: saving,
                }, __('Reset Block', 'snn-block')),
                el(Button, {
                    variant: 'tertiary',
                    onClick: handleResetAll,
                    disabled: saving,
                    style: { color: '#d63638' }
                }, __('Reset All', 'snn-block'))
            ),

            // Attribute editor
            !selectedBlock
                ? el('div', { className: 'snn-ge-empty', style: { flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' } },
                    el('div', { className: 'snn-ge-empty-icon' }, '🧩'),
                    el('h3', {}, __('Select a block', 'snn-block')),
                    el('p', {}, __('Choose a block type above to edit its default attribute values.', 'snn-block')),
                  )
                : el('div', { style: { flex: 1, overflow: 'auto' } },
                    el('div', { style: { fontSize: '12px', color: '#666', marginBottom: '12px', fontStyle: 'italic' } },
                        __('Editing defaults for: ', 'snn-block'),
                        el('strong', {}, selectedBlock),
                        __(' | Changes apply to NEW blocks added after page refresh.', 'snn-block'),
                        el('br'),
                        el('span', { style: { color: '#007cba' } },
                            __('💡 Tip: Set a value to override the default. Leave empty to use the block\'s original default.', 'snn-block')
                        )
                    ),
                    // Groups
                    groupOrder.map(group => {
                        const keys = getAttrGroups()[group];
                        if (!keys || keys.length === 0) return null;
                        const isCollapsed = collapsed[group];

                        return el('div', { key: group, style: { marginBottom: '4px' } },
                            el(Button, {
                                variant: 'link',
                                onClick: () => setCollapsed(prev => ({ ...prev, [group]: !prev[group] })),
                                style: {
                                    fontSize: '12px', fontWeight: 600, textTransform: 'uppercase',
                                    letterSpacing: '0.3px', color: '#555', padding: '6px 0',
                                    textDecoration: 'none',
                                }
                            }, (isCollapsed ? '▶' : '▼') + ' ' + (groupLabels[group] || group) + ' (' + keys.length + ')'),
                            !isCollapsed && el('div', { style: { paddingLeft: '4px' } },
                                keys.map(key => el('div', { key: key, style: { opacity: isModified(key) ? 1 : 0.6 } },
                                    renderAttrControl(key, blockAttrs[key])
                                ))
                            )
                        );
                    }),

                    // Save button
                    el(Flex, { justify: 'flex-start', style: { marginTop: '16px', padding: '12px 0', borderTop: '1px solid #e0e0e0' } },
                        el(FlexItem, {},
                            el(Button, {
                                variant: 'primary',
                                onClick: handleSaveDefaults,
                                disabled: !selectedBlock || saving,
                                isBusy: saving,
                                style: { minWidth: '120px' },
                            }, __('Save Defaults', 'snn-block'))
                        )
                    )
                )
        );
    };

    /* ═══════════════════════════════════════════════
       EXPOSE GLOBALLY
       ═══════════════════════════════════════════════ */
    window.SNN_GlobalEditorApp = GlobalEditorApp;
})();
