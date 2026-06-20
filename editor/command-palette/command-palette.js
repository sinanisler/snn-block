/**
 * SNN Command Palette — Ctrl+K Block Inserter
 *
 * Opens a VS Code-style command palette when the user presses Ctrl+K
 * (or Cmd+K on Mac) inside the block editor or site editor.
 *
 * Features:
 *  - Ctrl+K to open, Esc to close
 *  - Type to filter blocks by name, title, or category
 *  - ↑↓ arrow keys to navigate, Enter to insert
 *  - Click to insert
 *  - Inserts after the currently selected block (or at end if none selected)
 *  - Renders via createPortal to document.body for proper z-index stacking
 *
 * Works in: Post Editor, Site Editor (FSE), Widget Editor
 */
(function () {
    const { createElement: el, useState, useEffect, useRef, useCallback, Fragment } = wp.element;
    const { registerPlugin } = wp.plugins;
    const { createPortal } = wp.element;
    const { useSelect, useDispatch } = wp.data;
    const { __ } = wp.i18n;

    // ── Guards ──
    if (!registerPlugin || !createPortal) {
        console.warn('SNN Command Palette: registerPlugin or createPortal not available.');
        return;
    }

    /* ═══════════════════════════════════════════════
       MAIN COMMAND PALETTE COMPONENT
       ═══════════════════════════════════════════════ */
    const CommandPalette = () => {
        const [isOpen, setIsOpen] = useState(false);
        const [search, setSearch] = useState('');
        const [selectedIndex, setSelectedIndex] = useState(0);
        const inputRef = useRef(null);
        const listRef = useRef(null);
        const selectedItemRef = useRef(null);

        // ── Get all registered blocks ──
        const allBlocks = useSelect(function (select) {
            var blockTypes = select('core/blocks').getBlockTypes() || [];
            return blockTypes
                // Filter out blocks that can only live inside specific parents
                .filter(function (b) {
                    return b.name && b.title && !b.parent;
                })
                .map(function (b) {
                    return {
                        name: b.name,
                        title: b.title,
                        icon: b.icon,
                        category: b.category || '',
                        description: b.description || '',
                        keywords: b.keywords || [],
                    };
                })
                .sort(function (a, b) {
                    return a.title.localeCompare(b.title);
                });
        }, []);

        // ── Get insertion point context ──
        const insertionContext = useSelect(function (select) {
            var editor = select('core/block-editor');
            var selectedClientId = editor.getSelectedBlockClientId();
            var insertionPoint = editor.getBlockInsertionPoint ? editor.getBlockInsertionPoint() : null;

            return {
                selectedClientId: selectedClientId,
                // getBlockInsertionPoint returns { rootClientId, index }
                rootClientId: insertionPoint ? insertionPoint.rootClientId : undefined,
                insertionIndex: insertionPoint ? insertionPoint.index : undefined,
                getBlockIndex: function (id) { return editor.getBlockIndex(id); },
                getBlockCount: function () { return editor.getBlockCount(); },
            };
        }, []);

        var { insertBlock } = useDispatch('core/block-editor');

        // ── Filtered block list ──
        var lowerSearch = search.trim().toLowerCase();
        var filteredBlocks = lowerSearch
            ? allBlocks.filter(function (b) {
                return b.title.toLowerCase().indexOf(lowerSearch) !== -1 ||
                    b.name.toLowerCase().indexOf(lowerSearch) !== -1 ||
                    b.category.toLowerCase().indexOf(lowerSearch) !== -1 ||
                    b.keywords.some(function (kw) { return kw.toLowerCase().indexOf(lowerSearch) !== -1; });
            })
            : allBlocks;

        // ── Reset selection when search changes ──
        useEffect(function () {
            setSelectedIndex(0);
        }, [search]);

        // ── Focus input when opened ──
        useEffect(function () {
            if (isOpen && inputRef.current) {
                // Small delay to let the portal mount
                var timer = setTimeout(function () {
                    if (inputRef.current) {
                        inputRef.current.focus();
                        inputRef.current.select();
                    }
                }, 30);
                return function () { clearTimeout(timer); };
            }
        }, [isOpen]);

        // ── Scroll selected item into view ──
        useEffect(function () {
            if (selectedItemRef.current) {
                selectedItemRef.current.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
            }
        }, [selectedIndex]);

        // ── Keyboard shortcut: Ctrl+K / Cmd+K ──
        useEffect(function () {
            function handleKeyDown(e) {
                // Ctrl+K or Cmd+K → toggle palette
                if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                    // Don't intercept if user is typing in an input/textarea
                    var tag = (e.target.tagName || '').toLowerCase();
                    var isEditable = tag === 'input' || tag === 'textarea' ||
                        e.target.isContentEditable ||
                        e.target.closest('[contenteditable="true"]');
                    // But DO intercept if it's the block editor canvas itself
                    if (isEditable && !e.target.closest('.block-editor-rich-text__editable') &&
                        !e.target.closest('[data-rich-text-format-boundary]')) {
                        return; // Don't intercept in regular form inputs
                    }
                    e.preventDefault();
                    e.stopPropagation();
                    setIsOpen(function (prev) {
                        if (!prev) setSearch('');
                        return !prev;
                    });
                }
            }

            document.addEventListener('keydown', handleKeyDown, true);
            return function () { document.removeEventListener('keydown', handleKeyDown, true); };
        }, []);

        // ── Insert the selected block ──
        var insertSelectedBlock = useCallback(function (blockType) {
            if (!wp.blocks || !wp.blocks.createBlock) return;
            var newBlock = wp.blocks.createBlock(blockType.name);
            if (!newBlock) return;

            var clientId = insertionContext.selectedClientId;
            var insertIndex;

            if (clientId && insertionContext.getBlockIndex(clientId) !== -1) {
                // Insert after the currently selected block
                insertIndex = insertionContext.getBlockIndex(clientId) + 1;
            } else if (typeof insertionContext.insertionIndex === 'number') {
                // Use the block insertion point
                insertIndex = insertionContext.insertionIndex;
            } else {
                // Fallback: append at the end
                insertIndex = insertionContext.getBlockCount();
            }

            insertBlock(newBlock, insertIndex, insertionContext.rootClientId);

            // Close the palette
            setIsOpen(false);
            setSearch('');

            // Focus the newly inserted block after a tick
            setTimeout(function () {
                var newBlockEl = document.querySelector('.block-editor-block-list__block.is-selected');
                if (newBlockEl) newBlockEl.focus();
            }, 50);
        }, [insertBlock, insertionContext]);

        // ── Keyboard navigation inside palette ──
        var handlePaletteKeyDown = useCallback(function (e) {
            switch (e.key) {
                case 'ArrowDown':
                    e.preventDefault();
                    setSelectedIndex(function (prev) {
                        return Math.min(prev + 1, Math.max(0, filteredBlocks.length - 1));
                    });
                    break;
                case 'ArrowUp':
                    e.preventDefault();
                    setSelectedIndex(function (prev) {
                        return Math.max(prev - 1, 0);
                    });
                    break;
                case 'Enter':
                    e.preventDefault();
                    if (filteredBlocks[selectedIndex]) {
                        insertSelectedBlock(filteredBlocks[selectedIndex]);
                    }
                    break;
                case 'Escape':
                    e.preventDefault();
                    e.stopPropagation();
                    setIsOpen(false);
                    // Re-focus the editor
                    setTimeout(function () {
                        var editorEl = document.querySelector('.block-editor-writing-flow');
                        if (editorEl) editorEl.focus();
                    }, 30);
                    break;
            }
        }, [filteredBlocks, selectedIndex, insertSelectedBlock]);

        // ── Render nothing when closed ──
        if (!isOpen) return null;

        // ── Render block icon ──
        function renderBlockIcon(icon) {
            if (!icon) return null;
            // If icon is a string (dashicon name)
            if (typeof icon === 'string') {
                return el('span', {
                    className: 'snn-cp-item-icon dashicons dashicons-' + icon,
                });
            }
            // If icon is a React element / object
            if (icon && typeof icon === 'object' && icon.src) {
                return el('img', {
                    src: icon.src,
                    alt: '',
                    className: 'snn-cp-item-icon-img',
                    width: 20, height: 20,
                });
            }
            // Fallback: render as element
            try {
                return el('span', { className: 'snn-cp-item-icon' }, icon);
            } catch (e) {
                return null;
            }
        }

        // ── Category label colors ──
        var categoryColors = {
            text: '#3858e9',
            media: '#f59e0b',
            design: '#7b5cf0',
            widgets: '#00a32a',
            theme: '#d63638',
            embed: '#e26f56',
        };

        return createPortal(
            el('div', {
                className: 'snn-cp-overlay',
                onClick: function () { setIsOpen(false); },
                // Trap focus inside the palette
                onKeyDown: function (e) {
                    if (e.key === 'Escape') {
                        setIsOpen(false);
                    }
                },
            },
                el('div', {
                    className: 'snn-cp-palette',
                    onClick: function (e) { e.stopPropagation(); },
                    role: 'dialog',
                    'aria-label': __('Block Command Palette', 'snn-block'),
                },
                    // ── Search input ──
                    el('div', { className: 'snn-cp-header' },
                        el('span', { className: 'snn-cp-search-icon', 'aria-hidden': 'true' }, '⌨'),
                        el('input', {
                            ref: inputRef,
                            type: 'text',
                            className: 'snn-cp-input',
                            placeholder: __('Search blocks…', 'snn-block'),
                            value: search,
                            onChange: function (e) { setSearch(e.target.value); },
                            onKeyDown: handlePaletteKeyDown,
                            autoComplete: 'off',
                            spellCheck: false,
                        })
                    ),

                    // ── Block list ──
                    el('div', {
                        className: 'snn-cp-list',
                        ref: listRef,
                    },
                        filteredBlocks.length === 0
                            ? el('div', { className: 'snn-cp-empty' },
                                el('span', { className: 'snn-cp-empty-icon' }, '🧱'),
                                el('span', {}, __('No blocks match your search.', 'snn-block'))
                              )
                            : filteredBlocks.map(function (block, index) {
                                var isSelected = index === selectedIndex;
                                var catColor = categoryColors[block.category] || '#757575';
                                return el('div', {
                                    key: block.name,
                                    ref: isSelected ? selectedItemRef : null,
                                    className: 'snn-cp-item' +
                                        (isSelected ? ' snn-cp-item-selected' : '') +
                                        (block.category ? ' snn-cp-item-cat-' + block.category : ''),
                                    onClick: function () { insertSelectedBlock(block); },
                                    onMouseEnter: function () { setSelectedIndex(index); },
                                    role: 'option',
                                    'aria-selected': isSelected,
                                },
                                    el('span', { className: 'snn-cp-item-icon-wrap' },
                                        renderBlockIcon(block.icon)
                                    ),
                                    el('span', { className: 'snn-cp-item-info' },
                                        el('span', { className: 'snn-cp-item-title' }, block.title),
                                        block.description && el('span', { className: 'snn-cp-item-desc' }, block.description)
                                    ),
                                    block.category && el('span', {
                                        className: 'snn-cp-item-cat',
                                        style: { color: catColor, borderColor: catColor },
                                    }, block.category)
                                );
                            })
                    ),

                    // ── Footer shortcuts ──
                    el('div', { className: 'snn-cp-footer' },
                        el('span', { className: 'snn-cp-footer-hint' },
                            el('kbd', {}, '↑↓'),
                            ' ' + __('navigate', 'snn-block')
                        ),
                        el('span', { className: 'snn-cp-footer-hint' },
                            el('kbd', {}, '↵'),
                            ' ' + __('insert', 'snn-block')
                        ),
                        el('span', { className: 'snn-cp-footer-hint' },
                            el('kbd', {}, 'Esc'),
                            ' ' + __('close', 'snn-block')
                        ),
                        el('span', { className: 'snn-cp-footer-count' },
                            filteredBlocks.length + ' ' + __('blocks', 'snn-block')
                        )
                    )
                )
            ),
            document.body
        );
    };

    // ── Register the plugin ──
    registerPlugin('snn-command-palette', {
        render: CommandPalette,
    });
})();
