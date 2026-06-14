(function () {
    const { createElement: el, useState, useEffect, useRef } = wp.element;
    const { Modal, Button, TextControl, TextareaControl, PanelBody, PanelRow, Icon, Notice, Flex, FlexItem, Card, CardBody } = wp.components;
    const { __ } = wp.i18n;

    // Global Style Manager
    const GlobalStyleModal = ({ isOpen, onClose }) => {
        const [styles, setStyles] = useState([]);
        const [editingStyle, setEditingStyle] = useState(null);
        const [newStyleSelector, setNewStyleSelector] = useState('');
        const [newStyleCSS, setNewStyleCSS] = useState('');
        const [notice, setNotice] = useState(null);
        const [searchTerm, setSearchTerm] = useState('');
        const [activeTab, setActiveTab] = useState('styles');
        const [isLoading, setIsLoading] = useState(false);
        const resizerRef = useRef(null);
        const leftPanelRef = useRef(null);
        const rightPanelRef = useRef(null);

        // Load styles from localStorage on mount
        useEffect(() => {
            setIsLoading(true);
            const savedStyles = localStorage.getItem('snn_global_styles');
            if (savedStyles) {
                try {
                    setStyles(JSON.parse(savedStyles));
                } catch (e) {
                    console.error('Error parsing global styles:', e);
                    showNotice('Error loading saved styles', 'error');
                }
            }
            setIsLoading(false);
        }, []);

        // Panel resizer functionality
        useEffect(() => {
            if (!isOpen || !resizerRef.current) return;

            let isResizing = false;
            
            const handleMouseDown = (e) => {
                isResizing = true;
                document.addEventListener('mousemove', handleMouseMove);
                document.addEventListener('mouseup', handleMouseUp);
                e.preventDefault();
            };
            
            const handleMouseMove = (e) => {
                if (!isResizing) return;
                
                const container = resizerRef.current.parentElement;
                const containerRect = container.getBoundingClientRect();
                const offsetX = e.clientX - containerRect.left;
                const percentage = (offsetX / containerRect.width) * 100;
                
                if (percentage > 20 && percentage < 80) {
                    container.style.gridTemplateColumns = `${percentage}% 4px ${100 - percentage}%`;
                }
            };
            
            const handleMouseUp = () => {
                isResizing = false;
                document.removeEventListener('mousemove', handleMouseMove);
                document.removeEventListener('mouseup', handleMouseUp);
            };
            
            const resizer = resizerRef.current;
            resizer.addEventListener('mousedown', handleMouseDown);
            
            return () => {
                resizer?.removeEventListener('mousedown', handleMouseDown);
                document.removeEventListener('mousemove', handleMouseMove);
                document.removeEventListener('mouseup', handleMouseUp);
            };
        }, [isOpen]);

        // Save styles to localStorage
        const saveStyles = (newStyles) => {
            setStyles(newStyles);
            localStorage.setItem('snn_global_styles', JSON.stringify(newStyles));
            updateStyleSheet(newStyles);
        };

        // Update the dynamic stylesheet
        const updateStyleSheet = (styleList) => {
            let styleElement = document.getElementById('snn-global-styles');
            if (!styleElement) {
                styleElement = document.createElement('style');
                styleElement.id = 'snn-global-styles';
                document.head.appendChild(styleElement);
            }
            
            const css = styleList.map(style => `${style.selector} { ${style.css} }`).join('\n');
            styleElement.textContent = css;
        };

        // Initialize stylesheet on load
        useEffect(() => {
            updateStyleSheet(styles);
        }, [styles]);

        const showNotice = (message, type = 'success') => {
            setNotice({ message, type });
            setTimeout(() => setNotice(null), 4000);
        };

        const validateSelector = (selector) => {
            if (!selector.trim()) return 'CSS selector is required';
            
            // Validate CSS selector format
            try {
                // Test if it's a valid CSS selector by trying to use it with querySelector
                document.querySelector(selector);
                
                // Check if selector already exists (but not for current editing style)
                if (styles.some(style => style.selector === selector && style.id !== editingStyle?.id)) {
                    return 'Selector already exists';
                }
                
                return null;
            } catch (e) {
                return 'Invalid CSS selector format';
            }
        };

        const validateCSS = (css) => {
            if (!css.trim()) return 'CSS is required';
            // Basic CSS validation
            try {
                const testElement = document.createElement('div');
                testElement.style.cssText = css;
                return null;
            } catch (e) {
                return 'Invalid CSS syntax';
            }
        };

        const handleSaveStyle = async () => {
            setIsLoading(true);
            const selectorError = validateSelector(newStyleSelector);
            const cssError = validateCSS(newStyleCSS);

            if (selectorError || cssError) {
                showNotice(selectorError || cssError, 'error');
                setIsLoading(false);
                return;
            }

            const styleData = {
                id: editingStyle?.id || Date.now(),
                selector: newStyleSelector.trim(),
                css: newStyleCSS.trim(),
                created: editingStyle?.created || new Date().toISOString(),
                modified: new Date().toISOString()
            };

            let newStyles;
            if (editingStyle) {
                newStyles = styles.map(style => style.id === editingStyle.id ? styleData : style);
                showNotice('Style updated successfully!');
            } else {
                newStyles = [...styles, styleData];
                showNotice('Style created successfully!');
            }

            saveStyles(newStyles);
            resetForm();
            setIsLoading(false);
        };

        const handleEditStyle = (styleItem) => {
            setEditingStyle(styleItem);
            setNewStyleSelector(styleItem.selector);
            setNewStyleCSS(styleItem.css);
            setActiveTab('editor');
        };

        const handleDeleteStyle = (styleId) => {
            if (confirm('Are you sure you want to delete this style?')) {
                const newStyles = styles.filter(style => style.id !== styleId);
                saveStyles(newStyles);
                showNotice('Style deleted successfully!');
                if (editingStyle?.id === styleId) {
                    resetForm();
                }
            }
        };

        const handleDuplicateStyle = (styleItem) => {
            const duplicatedStyle = {
                ...styleItem,
                id: Date.now(),
                selector: `${styleItem.selector}-copy`,
                created: new Date().toISOString(),
                modified: new Date().toISOString()
            };
            const newStyles = [...styles, duplicatedStyle];
            saveStyles(newStyles);
            showNotice('Style duplicated successfully!');
        };

        const resetForm = () => {
            setEditingStyle(null);
            setNewStyleSelector('');
            setNewStyleCSS('');
        };

        const exportStyles = () => {
            const dataStr = JSON.stringify(styles, null, 2);
            const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
            const exportFileDefaultName = `global-styles-${new Date().toISOString().split('T')[0]}.json`;
            
            const linkElement = document.createElement('a');
            linkElement.setAttribute('href', dataUri);
            linkElement.setAttribute('download', exportFileDefaultName);
            linkElement.click();
            showNotice('Styles exported successfully!');
        };

        const importStyles = (event) => {
            const file = event.target.files[0];
            if (!file) return;

            setIsLoading(true);
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const importedStyles = JSON.parse(e.target.result);
                    if (Array.isArray(importedStyles)) {
                        const mergedStyles = [...styles];
                        let importCount = 0;
                        
                        importedStyles.forEach(importedStyle => {
                            if (!mergedStyles.some(style => style.selector === importedStyle.selector)) {
                                mergedStyles.push({
                                    ...importedStyle,
                                    id: Date.now() + Math.random(),
                                    modified: new Date().toISOString()
                                });
                                importCount++;
                            }
                        });
                        
                        saveStyles(mergedStyles);
                        showNotice(`${importCount} styles imported successfully!`);
                    } else {
                        showNotice('Invalid file format', 'error');
                    }
                } catch (error) {
                    showNotice('Error importing styles', 'error');
                }
                setIsLoading(false);
            };
            reader.readAsText(file);
            event.target.value = '';
        };

        const filteredStyles = styles.filter(style => 
            style.selector.toLowerCase().includes(searchTerm.toLowerCase()) ||
            style.css.toLowerCase().includes(searchTerm.toLowerCase())
        );

        // Keyboard shortcuts
        useEffect(() => {
            if (!isOpen) return;

            const handleKeyDown = (e) => {
                // Ctrl/Cmd + S to save
                if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                    e.preventDefault();
                    if (activeTab === 'editor' && (newStyleSelector || newStyleCSS)) {
                        handleSaveStyle();
                    }
                }
                // Escape to close modal
                if (e.key === 'Escape' && !e.target.closest('.components-modal__content')) {
                    onClose();
                }
                // Tab navigation
                if (e.key === '1' && (e.ctrlKey || e.metaKey)) {
                    e.preventDefault();
                    setActiveTab('styles');
                }
                if (e.key === '2' && (e.ctrlKey || e.metaKey)) {
                    e.preventDefault();
                    setActiveTab('editor');
                }
            };

            document.addEventListener('keydown', handleKeyDown);
            return () => document.removeEventListener('keydown', handleKeyDown);
        }, [isOpen, activeTab, newStyleSelector, newStyleCSS]);

        // Render tab content
        const renderTabContent = () => {
            switch (activeTab) {
                case 'styles':
                    return renderStylesList();
                case 'editor':
                    return renderEditor();
                default:
                    return renderStylesList();
            }
        };

        const renderStylesList = () => el('div', { className: 'snn-tab-panel active' },
            el('div', { className: 'quick-actions' },
                el('div', { className: 'search-container' },
                    el(TextControl, {
                        placeholder: __('Search styles...', 'snn-block'),
                        value: searchTerm,
                        onChange: setSearchTerm,
                        className: 'search-input'
                    })
                ),
                el(Button, {
                    variant: 'secondary',
                    onClick: exportStyles,
                    size: 'small'
                }, __('Export', 'snn-block')),
                el('input', {
                    type: 'file',
                    accept: '.json',
                    onChange: importStyles,
                    style: { display: 'none' },
                    id: 'import-styles'
                }),
                el(Button, {
                    variant: 'secondary',
                    onClick: () => document.getElementById('import-styles').click(),
                    size: 'small'
                }, __('Import', 'snn-block'))
            ),

            el('div', { 
                className: `styles-list ${isLoading ? 'snn-loading' : ''}` 
            },
                filteredStyles.length === 0 ? 
                    el('div', { className: 'empty-state' },
                        el('div', { className: 'empty-state-icon' }, '🎨'),
                        el('h3', {}, searchTerm ? __('No styles found', 'snn-block') : __('No styles yet', 'snn-block')),
                        el('p', {}, searchTerm ? 
                            __('Try adjusting your search terms.', 'snn-block') :
                            __('Create your first style!', 'snn-block')
                        ),
                        !searchTerm && el(Button, {
                            variant: 'primary',
                            onClick: () => setActiveTab('editor')
                        }, __('Create First Style', 'snn-block'))
                    ) :
                    filteredStyles.map(styleItem => 
                        el('div', { 
                            key: styleItem.id, 
                            className: `style-item ${editingStyle?.id === styleItem.id ? 'active' : ''}`,
                            onClick: () => handleEditStyle(styleItem)
                        },
                            el('div', { 
                                className: `style-selector ${styleItem.selector.startsWith('.') ? 'class-selector' : ''}` 
                            }, styleItem.selector),
                            el('div', { className: 'style-css' }, 
                                styleItem.css.length > 50 ? 
                                    styleItem.css.substring(0, 50) + '...' : 
                                    styleItem.css
                            ),
                            el('div', { className: 'style-actions' },
                                el(Button, {
                                    variant: 'tertiary',
                                    size: 'small',
                                    onClick: (e) => {
                                        e.stopPropagation();
                                        handleEditStyle(styleItem);
                                    },
                                    icon: 'edit',
                                    title: __('Edit style', 'snn-block')
                                }),
                                el(Button, {
                                    variant: 'tertiary',
                                    size: 'small',
                                    onClick: (e) => {
                                        e.stopPropagation();
                                        handleDuplicateStyle(styleItem);
                                    },
                                    icon: 'admin-page',
                                    title: __('Duplicate style', 'snn-block')
                                }),
                                el(Button, {
                                    variant: 'tertiary',
                                    size: 'small',
                                    onClick: (e) => {
                                        e.stopPropagation();
                                        handleDeleteStyle(styleItem.id);
                                    },
                                    icon: 'trash',
                                    className: 'delete-button',
                                    title: __('Delete style', 'snn-block')
                                })
                            )
                        )
                    )
            )
        );

        const renderEditor = () => el('div', { className: 'snn-tab-panel active form-section' },
            el('h3', {}, editingStyle ? __('Edit Style', 'snn-block') : __('Add New Style', 'snn-block')),
            
            el(TextControl, {
                label: __('CSS Selector', 'snn-block'),
                value: newStyleSelector,
                onChange: setNewStyleSelector,
                placeholder: 'e.g., .my-class, #my-id, h2, p:hover, .btn::before',
                help: __('Enter any valid CSS selector: classes (.class), IDs (#id), tags (h1), pseudo-selectors (:hover), pseudo-elements (::before)', 'snn-block')
            }),

            el(TextareaControl, {
                label: __('CSS Styles', 'snn-block'),
                value: newStyleCSS,
                onChange: setNewStyleCSS,
                placeholder: 'color: red;\nfont-size: 16px;\nmargin: 10px;',
                rows: 8,
                help: __('Enter CSS properties without the selector. Use Ctrl+S to save.', 'snn-block')
            }),

            // Live Preview
            newStyleSelector && newStyleCSS && el('div', { className: 'snn-global-style-preview' },
                el('div', { className: 'snn-global-style-preview-title' }, __('Preview', 'snn-block')),
                el('div', { className: 'snn-global-style-preview-css' }, `${newStyleSelector} {\n  ${newStyleCSS.split('\n').join('\n  ')}\n}`)
            ),

            el(Flex, { justify: 'flex-start', style: { marginTop: '16px' } },
                el(FlexItem, {},
                    el(Button, {
                        variant: 'primary',
                        onClick: handleSaveStyle,
                        isBusy: isLoading,
                        disabled: !newStyleSelector.trim() || !newStyleCSS.trim()
                    }, editingStyle ? __('Update Style', 'snn-block') : __('Add Style', 'snn-block'))
                ),
                editingStyle && el(FlexItem, {},
                    el(Button, {
                        variant: 'secondary',
                        onClick: resetForm,
                        style: { marginLeft: '8px' }
                    }, __('Cancel', 'snn-block'))
                )
            )
        );

        if (!isOpen) return null;

        return el(Modal, {
            title: __('Global Style Manager', 'snn-block'),
            onRequestClose: onClose,
            className: 'snn-global-style-modal',
            style: { maxWidth: '90vw', width: '1200px' }
        },
            notice && el(Notice, {
                status: notice.type,
                isDismissible: true,
                onRemove: () => setNotice(null),
                className: notice.type === 'success' ? 'snn-modal-success' : 'snn-modal-error'
            }, notice.message),

            // Tab Navigation
            el('div', { className: 'snn-tabs-container' },
                el('div', { className: 'snn-tabs-list' },
                    el(Button, {
                        className: `snn-tab-button ${activeTab === 'styles' ? 'active' : ''}`,
                        onClick: () => setActiveTab('styles')
                    }, __('Styles', 'snn-block'), ` (${styles.length})`),
                    el(Button, {
                        className: `snn-tab-button ${activeTab === 'editor' ? 'active' : ''}`,
                        onClick: () => setActiveTab('editor')
                    }, editingStyle ? __('Edit', 'snn-block') : __('Create', 'snn-block'))
                )
            ),

            // Main Layout
            el('div', { className: 'snn-modal-layout' },
                // Left Panel
                activeTab === 'styles' ? el('div', { 
                    className: 'snn-modal-panel snn-modal-panel-left',
                    ref: leftPanelRef 
                }, renderTabContent()) : null,
                
                // Resizer (only show when both panels are visible)
                activeTab === 'styles' ? el('div', { 
                    className: 'snn-panel-resizer',
                    ref: resizerRef 
                }) : null,
                
                // Right Panel or Full Width
                el('div', { 
                    className: `snn-modal-panel ${activeTab === 'styles' ? 'snn-modal-panel-right' : ''}`,
                    ref: rightPanelRef,
                    style: activeTab !== 'styles' ? { gridColumn: '1 / -1' } : {}
                }, activeTab === 'styles' ? renderEditor() : renderTabContent())
            )
        );
    };

    // Make the modal available globally
    window.SnnGlobalStyleModal = GlobalStyleModal;

})();
