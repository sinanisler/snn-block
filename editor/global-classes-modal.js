(function () {
    const { createElement: el, useState, useEffect, useRef } = wp.element;
    const { Modal, Button, TextControl, TextareaControl, PanelBody, PanelRow, Icon, Notice, Flex, FlexItem, Card, CardBody } = wp.components;
    const { __ } = wp.i18n;

    // Global Classes Manager
    const GlobalClassesModal = ({ isOpen, onClose }) => {
        const [classes, setClasses] = useState([]);
        const [editingClass, setEditingClass] = useState(null);
        const [newClassName, setNewClassName] = useState('');
        const [newClassCSS, setNewClassCSS] = useState('');
        const [notice, setNotice] = useState(null);
        const [searchTerm, setSearchTerm] = useState('');
        const [activeTab, setActiveTab] = useState('classes');
        const [isLoading, setIsLoading] = useState(false);
        const resizerRef = useRef(null);
        const leftPanelRef = useRef(null);
        const rightPanelRef = useRef(null);

        // Load classes from localStorage on mount
        useEffect(() => {
            setIsLoading(true);
            const savedClasses = localStorage.getItem('snn_global_classes');
            if (savedClasses) {
                try {
                    setClasses(JSON.parse(savedClasses));
                } catch (e) {
                    console.error('Error parsing global classes:', e);
                    showNotice('Error loading saved classes', 'error');
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

        // Save classes to localStorage
        const saveClasses = (newClasses) => {
            setClasses(newClasses);
            localStorage.setItem('snn_global_classes', JSON.stringify(newClasses));
            updateStyleSheet(newClasses);
        };

        // Update the dynamic stylesheet
        const updateStyleSheet = (classList) => {
            let styleElement = document.getElementById('snn-global-classes-styles');
            if (!styleElement) {
                styleElement = document.createElement('style');
                styleElement.id = 'snn-global-classes-styles';
                document.head.appendChild(styleElement);
            }
            
            const css = classList.map(cls => `.${cls.name} { ${cls.css} }`).join('\n');
            styleElement.textContent = css;
        };

        // Initialize stylesheet on load
        useEffect(() => {
            updateStyleSheet(classes);
        }, [classes]);

        const showNotice = (message, type = 'success') => {
            setNotice({ message, type });
            setTimeout(() => setNotice(null), 4000);
        };

        const validateClassName = (name) => {
            if (!name.trim()) return 'Class name is required';
            if (!/^[a-zA-Z][a-zA-Z0-9_-]*$/.test(name)) return 'Invalid class name format';
            if (classes.some(cls => cls.name === name && cls.id !== editingClass?.id)) {
                return 'Class name already exists';
            }
            return null;
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

        const handleSaveClass = async () => {
            setIsLoading(true);
            const nameError = validateClassName(newClassName);
            const cssError = validateCSS(newClassCSS);

            if (nameError || cssError) {
                showNotice(nameError || cssError, 'error');
                setIsLoading(false);
                return;
            }

            const classData = {
                id: editingClass?.id || Date.now(),
                name: newClassName.trim(),
                css: newClassCSS.trim(),
                created: editingClass?.created || new Date().toISOString(),
                modified: new Date().toISOString()
            };

            let newClasses;
            if (editingClass) {
                newClasses = classes.map(cls => cls.id === editingClass.id ? classData : cls);
                showNotice('Class updated successfully!');
            } else {
                newClasses = [...classes, classData];
                showNotice('Class created successfully!');
            }

            saveClasses(newClasses);
            resetForm();
            setIsLoading(false);
        };

        const handleEditClass = (classItem) => {
            setEditingClass(classItem);
            setNewClassName(classItem.name);
            setNewClassCSS(classItem.css);
            setActiveTab('editor');
        };

        const handleDeleteClass = (classId) => {
            if (confirm('Are you sure you want to delete this class?')) {
                const newClasses = classes.filter(cls => cls.id !== classId);
                saveClasses(newClasses);
                showNotice('Class deleted successfully!');
                if (editingClass?.id === classId) {
                    resetForm();
                }
            }
        };

        const handleDuplicateClass = (classItem) => {
            const duplicatedClass = {
                ...classItem,
                id: Date.now(),
                name: `${classItem.name}-copy`,
                created: new Date().toISOString(),
                modified: new Date().toISOString()
            };
            const newClasses = [...classes, duplicatedClass];
            saveClasses(newClasses);
            showNotice('Class duplicated successfully!');
        };

        const resetForm = () => {
            setEditingClass(null);
            setNewClassName('');
            setNewClassCSS('');
        };

        const exportClasses = () => {
            const dataStr = JSON.stringify(classes, null, 2);
            const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
            const exportFileDefaultName = `global-classes-${new Date().toISOString().split('T')[0]}.json`;
            
            const linkElement = document.createElement('a');
            linkElement.setAttribute('href', dataUri);
            linkElement.setAttribute('download', exportFileDefaultName);
            linkElement.click();
            showNotice('Classes exported successfully!');
        };

        const importClasses = (event) => {
            const file = event.target.files[0];
            if (!file) return;

            setIsLoading(true);
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const importedClasses = JSON.parse(e.target.result);
                    if (Array.isArray(importedClasses)) {
                        const mergedClasses = [...classes];
                        let importCount = 0;
                        
                        importedClasses.forEach(importedClass => {
                            if (!mergedClasses.some(cls => cls.name === importedClass.name)) {
                                mergedClasses.push({
                                    ...importedClass,
                                    id: Date.now() + Math.random(),
                                    modified: new Date().toISOString()
                                });
                                importCount++;
                            }
                        });
                        
                        saveClasses(mergedClasses);
                        showNotice(`${importCount} classes imported successfully!`);
                    } else {
                        showNotice('Invalid file format', 'error');
                    }
                } catch (error) {
                    showNotice('Error importing classes', 'error');
                }
                setIsLoading(false);
            };
            reader.readAsText(file);
            event.target.value = '';
        };

        const filteredClasses = classes.filter(cls => 
            cls.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            cls.css.toLowerCase().includes(searchTerm.toLowerCase())
        );

        // Keyboard shortcuts
        useEffect(() => {
            if (!isOpen) return;

            const handleKeyDown = (e) => {
                // Ctrl/Cmd + S to save
                if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                    e.preventDefault();
                    if (activeTab === 'editor' && (newClassName || newClassCSS)) {
                        handleSaveClass();
                    }
                }
                // Escape to close modal
                if (e.key === 'Escape' && !e.target.closest('.components-modal__content')) {
                    onClose();
                }
                // Tab navigation
                if (e.key === '1' && (e.ctrlKey || e.metaKey)) {
                    e.preventDefault();
                    setActiveTab('classes');
                }
                if (e.key === '2' && (e.ctrlKey || e.metaKey)) {
                    e.preventDefault();
                    setActiveTab('editor');
                }
            };

            document.addEventListener('keydown', handleKeyDown);
            return () => document.removeEventListener('keydown', handleKeyDown);
        }, [isOpen, activeTab, newClassName, newClassCSS]);

        // Render tab content
        const renderTabContent = () => {
            switch (activeTab) {
                case 'classes':
                    return renderClassesList();
                case 'editor':
                    return renderEditor();
                default:
                    return renderClassesList();
            }
        };

        const renderClassesList = () => el('div', { className: 'snn-tab-panel active' },
            el('div', { className: 'quick-actions' },
                el('div', { className: 'search-container' },
                    el(TextControl, {
                        placeholder: __('Search classes...', 'snn-block'),
                        value: searchTerm,
                        onChange: setSearchTerm,
                        className: 'search-input'
                    })
                ),
                el(Button, {
                    variant: 'secondary',
                    onClick: exportClasses,
                    size: 'small'
                }, __('Export', 'snn-block')),
                el('input', {
                    type: 'file',
                    accept: '.json',
                    onChange: importClasses,
                    style: { display: 'none' },
                    id: 'import-classes'
                }),
                el(Button, {
                    variant: 'secondary',
                    onClick: () => document.getElementById('import-classes').click(),
                    size: 'small'
                }, __('Import', 'snn-block'))
            ),

            el('div', { 
                className: `classes-list ${isLoading ? 'snn-loading' : ''}` 
            },
                filteredClasses.length === 0 ? 
                    el('div', { className: 'empty-state' },
                        el('div', { className: 'empty-state-icon' }, '📝'),
                        el('h3', {}, searchTerm ? __('No classes found', 'snn-block') : __('No classes yet', 'snn-block')),
                        el('p', {}, searchTerm ? 
                            __('Try adjusting your search terms.', 'snn-block') :
                            __('Create your first class!', 'snn-block')
                        ),
                        !searchTerm && el(Button, {
                            variant: 'primary',
                            onClick: () => setActiveTab('editor')
                        }, __('Create First Class', 'snn-block'))
                    ) :
                    filteredClasses.map(classItem => 
                        el('div', { 
                            key: classItem.id, 
                            className: `class-item ${editingClass?.id === classItem.id ? 'active' : ''}`,
                            onClick: () => handleEditClass(classItem)
                        },
                            el('div', { className: 'class-name' }, classItem.name),
                            el('div', { className: 'class-css' }, 
                                classItem.css.length > 50 ? 
                                    classItem.css.substring(0, 50) + '...' : 
                                    classItem.css
                            ),
                            el('div', { className: 'class-actions' },
                                el(Button, {
                                    variant: 'tertiary',
                                    size: 'small',
                                    onClick: (e) => {
                                        e.stopPropagation();
                                        handleEditClass(classItem);
                                    },
                                    icon: 'edit',
                                    title: __('Edit class', 'snn-block')
                                }),
                                el(Button, {
                                    variant: 'tertiary',
                                    size: 'small',
                                    onClick: (e) => {
                                        e.stopPropagation();
                                        handleDuplicateClass(classItem);
                                    },
                                    icon: 'admin-page',
                                    title: __('Duplicate class', 'snn-block')
                                }),
                                el(Button, {
                                    variant: 'tertiary',
                                    size: 'small',
                                    onClick: (e) => {
                                        e.stopPropagation();
                                        handleDeleteClass(classItem.id);
                                    },
                                    icon: 'trash',
                                    className: 'delete-button',
                                    title: __('Delete class', 'snn-block')
                                })
                            )
                        )
                    )
            )
        );

        const renderEditor = () => el('div', { className: 'snn-tab-panel active form-section' },
            el('h3', {}, editingClass ? __('Edit Class', 'snn-block') : __('Add New Class', 'snn-block')),
            
            el(TextControl, {
                label: __('Class Name', 'snn-block'),
                value: newClassName,
                onChange: setNewClassName,
                placeholder: 'e.g., my-custom-class',
                help: __('Use only letters, numbers, hyphens, and underscores', 'snn-block')
            }),

            el(TextareaControl, {
                label: __('CSS Styles', 'snn-block'),
                value: newClassCSS,
                onChange: setNewClassCSS,
                placeholder: 'color: red;\nfont-size: 16px;\nmargin: 10px;',
                rows: 8,
                help: __('Enter CSS properties without the selector. Use Ctrl+S to save.', 'snn-block')
            }),

            // Live Preview
            newClassName && newClassCSS && el('div', { className: 'snn-global-class-preview' },
                el('div', { className: 'snn-global-class-preview-title' }, __('Preview', 'snn-block')),
                el('div', { className: 'snn-global-class-preview-css' }, `.${newClassName} {\n  ${newClassCSS.split('\n').join('\n  ')}\n}`)
            ),

            el(Flex, { justify: 'flex-start', style: { marginTop: '16px' } },
                el(FlexItem, {},
                    el(Button, {
                        variant: 'primary',
                        onClick: handleSaveClass,
                        isBusy: isLoading,
                        disabled: !newClassName.trim() || !newClassCSS.trim()
                    }, editingClass ? __('Update Class', 'snn-block') : __('Add Class', 'snn-block'))
                ),
                editingClass && el(FlexItem, {},
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
            title: __('Global Classes Manager', 'snn-block'),
            onRequestClose: onClose,
            className: 'snn-global-classes-modal',
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
                        className: `snn-tab-button ${activeTab === 'classes' ? 'active' : ''}`,
                        onClick: () => setActiveTab('classes')
                    }, __('Classes', 'snn-block'), ` (${classes.length})`),
                    el(Button, {
                        className: `snn-tab-button ${activeTab === 'editor' ? 'active' : ''}`,
                        onClick: () => setActiveTab('editor')
                    }, editingClass ? __('Edit', 'snn-block') : __('Create', 'snn-block'))
                )
            ),

            // Main Layout
            el('div', { className: 'snn-modal-layout' },
                // Left Panel
                activeTab === 'classes' ? el('div', { 
                    className: 'snn-modal-panel snn-modal-panel-left',
                    ref: leftPanelRef 
                }, renderTabContent()) : null,
                
                // Resizer (only show when both panels are visible)
                activeTab === 'classes' ? el('div', { 
                    className: 'snn-panel-resizer',
                    ref: resizerRef 
                }) : null,
                
                // Right Panel or Full Width
                el('div', { 
                    className: `snn-modal-panel ${activeTab === 'classes' ? 'snn-modal-panel-right' : ''}`,
                    ref: rightPanelRef,
                    style: activeTab !== 'classes' ? { gridColumn: '1 / -1' } : {}
                }, activeTab === 'classes' ? renderEditor() : renderTabContent())
            )
        );
    };

    // Make the modal available globally
    window.SnnGlobalClassesModal = GlobalClassesModal;

})();
