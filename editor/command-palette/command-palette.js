/**
 * SNN Command Palette — Block Commands for Ctrl+K
 *
 * Integrates with the native WordPress Command Center (WP 6.3+).
 * When the user presses Ctrl+K:
 *   - Native WP commands (pages, templates, patterns, etc.) still appear
 *   - ALL registered blocks ALSO appear as insertable commands
 *   - Type a block name → Enter → block inserted at selection
 *
 * Falls back to a custom palette (Ctrl+Shift+K) if the native
 * commands API is not available (WordPress < 6.3).
 *
 * Works in: Post Editor, Site Editor (FSE), Widget Editor
 */
(function () {
    const { createElement: el, useState, useEffect, useRef, useCallback } = wp.element;
    const { registerPlugin } = wp.plugins;
    const { createPortal } = wp.element;
    const { useSelect, useDispatch } = wp.data;
    const { __ } = wp.i18n;

    // ── Guards ──
    if (!registerPlugin) {
        console.warn('SNN Command Palette: registerPlugin not available.');
        return;
    }

    /* ═══════════════════════════════════════════════
       HELPERS
       ═══════════════════════════════════════════════ */

    function getInsertableBlocks() {
        var types = wp.blocks.getBlockTypes() || [];
        return types
            .filter(function (b) {
                return b.name && b.title && !b.parent;
            })
            .map(function (b) {
                return {
                    name: b.name,
                    title: b.title,
                    description: b.description || '',
                    category: b.category || '',
                    keywords: (b.keywords || []).join(' '),
                };
            })
            .sort(function (a, b) {
                return a.title.localeCompare(b.title);
            });
    }

    function insertBlockAtSelection(blockName) {
        var editor = wp.data.select('core/block-editor');
        var dispatcher = wp.data.dispatch('core/block-editor');
        var newBlock = wp.blocks.createBlock(blockName);
        if (!newBlock) return;

        var clientId = editor.getSelectedBlockClientId();
        var insertionPoint = editor.getBlockInsertionPoint ? editor.getBlockInsertionPoint() : null;
        var index;

        if (clientId && editor.getBlockIndex(clientId) !== -1) {
            index = editor.getBlockIndex(clientId) + 1;
        } else if (insertionPoint && typeof insertionPoint.index === 'number') {
            index = insertionPoint.index;
        } else {
            index = editor.getBlockCount();
        }

        dispatcher.insertBlock(newBlock, index, insertionPoint ? insertionPoint.rootClientId : undefined);
    }

    /* ═══════════════════════════════════════════════
       APPROACH 1: NATIVE COMMAND CENTER (WP 6.3+)
       Registers blocks as commands in the core/commands
       store so they appear in the native Ctrl+K palette.
       ═══════════════════════════════════════════════ */

    var hasNativeCommands = false;
    try {
        hasNativeCommands = !!wp.data.select('core/commands');
    } catch (e) {
        hasNativeCommands = false;
    }

    if (hasNativeCommands) {
        // ── Register blocks as native commands ──
        var NativeBlockCommands = function () {
            useEffect(function () {
                var commandsStore = wp.data.dispatch('core/commands');
                if (!commandsStore) return;

                var blocks = getInsertableBlocks();
                var registered = [];

                blocks.forEach(function (block) {
                    var commandName = 'snn/insert-block/' + block.name;
                    try {
                        commandsStore.registerCommand({
                            name: commandName,
                            label: __('Block: ', 'snn-block') + block.title,
                            description: block.description || block.name,
                            callback: function () {
                                insertBlockAtSelection(block.name);
                            },
                        });
                        registered.push(commandName);
                    } catch (err) {
                        // Silently skip if registration fails
                    }
                });

                return function () {
                    registered.forEach(function (name) {
                        try { commandsStore.unregisterCommand(name); } catch (e) {}
                    });
                };
            }, []);

            return null;
        };

        registerPlugin('snn-block-commands-native', {
            render: NativeBlockCommands,
        });
    }

    /* ═══════════════════════════════════════════════
       APPROACH 2: CUSTOM PALETTE (fallback for WP < 6.3)
       Uses Ctrl+Shift+K so it never conflicts with any
       native shortcut.
       ═══════════════════════════════════════════════ */

    if (!hasNativeCommands && createPortal) {
        var CustomCommandPalette = function () {
            var _useState = useState(false), isOpen = _useState[0], setIsOpen = _useState[1];
            var _useState2 = useState(''), search = _useState2[0], setSearch = _useState2[1];
            var _useState3 = useState(0), selectedIndex = _useState3[0], setSelectedIndex = _useState3[1];
            var inputRef = useRef(null);
            var selectedItemRef = useRef(null);

            // ── Get insertable blocks ──
            var blocks = useSelect(function (select) {
                return getInsertableBlocks();
            }, []);

            // ── Filter by search ──
            var lowerSearch = search.trim().toLowerCase();
            var filtered = lowerSearch
                ? blocks.filter(function (b) {
                    return b.title.toLowerCase().indexOf(lowerSearch) !== -1 ||
                        b.name.toLowerCase().indexOf(lowerSearch) !== -1 ||
                        b.category.toLowerCase().indexOf(lowerSearch) !== -1 ||
                        b.keywords.toLowerCase().indexOf(lowerSearch) !== -1;
                })
                : blocks;

            // ── Reset selection on search change ──
            useEffect(function () {
                setSelectedIndex(0);
            }, [search]);

            // ── Focus input on open ──
            useEffect(function () {
                if (isOpen && inputRef.current) {
                    var t = setTimeout(function () {
                        if (inputRef.current) { inputRef.current.focus(); inputRef.current.select(); }
                    }, 30);
                    return function () { clearTimeout(t); };
                }
            }, [isOpen]);

            // ── Scroll selected into view ──
            useEffect(function () {
                if (selectedItemRef.current) {
                    selectedItemRef.current.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
                }
            }, [selectedIndex]);

            // ── Keyboard shortcut: Ctrl+Shift+K (won't clash with native Ctrl+K) ──
            useEffect(function () {
                function handleKeyDown(e) {
                    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'K') {
                        var tag = (e.target.tagName || '').toLowerCase();
                        var isFormInput = (tag === 'input' || tag === 'textarea') &&
                            !e.target.closest('.block-editor-rich-text__editable') &&
                            !e.target.closest('[data-rich-text-format-boundary]');
                        if (isFormInput) return;

                        e.preventDefault();
                        e.stopPropagation();
                        setIsOpen(function (prev) { if (!prev) setSearch(''); return !prev; });
                    }
                }
                document.addEventListener('keydown', handleKeyDown, true);
                return function () { document.removeEventListener('keydown', handleKeyDown, true); };
            }, []);

            // ── Handle insert ──
            var doInsert = useCallback(function (block) {
                insertBlockAtSelection(block.name);
                setIsOpen(false);
                setSearch('');
            }, []);

            // ── Keyboard navigation ──
            var handleKeyDown = useCallback(function (e) {
                switch (e.key) {
                    case 'ArrowDown':
                        e.preventDefault();
                        setSelectedIndex(function (p) { return Math.min(p + 1, Math.max(0, filtered.length - 1)); });
                        break;
                    case 'ArrowUp':
                        e.preventDefault();
                        setSelectedIndex(function (p) { return Math.max(p - 1, 0); });
                        break;
                    case 'Enter':
                        e.preventDefault();
                        if (filtered[selectedIndex]) doInsert(filtered[selectedIndex]);
                        break;
                    case 'Escape':
                        e.preventDefault();
                        e.stopPropagation();
                        setIsOpen(false);
                        break;
                }
            }, [filtered, selectedIndex, doInsert]);

            if (!isOpen) return null;

            // ── Category badge colors ──
            var catColors = {
                text: '#3858e9', media: '#f59e0b', design: '#7b5cf0',
                widgets: '#00a32a', theme: '#d63638', embed: '#e26f56',
            };

            return createPortal(
                el('div', {
                    className: 'snn-cp-overlay',
                    onClick: function () { setIsOpen(false); },
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
                                onKeyDown: handleKeyDown,
                                autoComplete: 'off',
                                spellCheck: false,
                            })
                        ),

                        // ── Block list (text + description, no icons) ──
                        el('div', { className: 'snn-cp-list' },
                            filtered.length === 0
                                ? el('div', { className: 'snn-cp-empty' },
                                    el('span', { className: 'snn-cp-empty-icon' }, '🧱'),
                                    el('span', {}, __('No blocks match your search.', 'snn-block'))
                                  )
                                : filtered.map(function (block, idx) {
                                    var isSel = idx === selectedIndex;
                                    var catColor = catColors[block.category] || '#757575';
                                    return el('div', {
                                        key: block.name,
                                        ref: isSel ? selectedItemRef : null,
                                        className: 'snn-cp-item' + (isSel ? ' snn-cp-item-selected' : ''),
                                        onClick: function () { doInsert(block); },
                                        onMouseEnter: function () { setSelectedIndex(idx); },
                                        role: 'option',
                                        'aria-selected': isSel,
                                    },
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
                                el('kbd', {}, '↑↓'), ' ' + __('navigate', 'snn-block')
                            ),
                            el('span', { className: 'snn-cp-footer-hint' },
                                el('kbd', {}, '↵'), ' ' + __('insert', 'snn-block')
                            ),
                            el('span', { className: 'snn-cp-footer-hint' },
                                el('kbd', {}, 'Esc'), ' ' + __('close', 'snn-block')
                            ),
                            el('span', { className: 'snn-cp-footer-count' },
                                filtered.length + ' ' + __('blocks', 'snn-block')
                            )
                        )
                    )
                ),
                document.body
            );
        };

        registerPlugin('snn-command-palette-custom', {
            render: CustomCommandPalette,
        });
    }

    // ── Log which mode is active ──
    if (hasNativeCommands) {
        console.log('SNN Command Palette: ✅ Native WP Command Center detected — blocks registered into Ctrl+K.');
    } else {
        console.log('SNN Command Palette: ⚠ Native commands API not available — using Ctrl+Shift+K fallback.');
    }
})();
