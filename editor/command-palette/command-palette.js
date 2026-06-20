/**
 * SNN Command Palette — Ctrl+K Block Inserter
 *
 * Simple, self-contained command palette for the block editor & site editor:
 *   - Press Ctrl+K (or Cmd+K) → palette opens
 *   - Type a block name → arrow keys to navigate → Enter to insert
 *   - Esc to close
 *
 * This deliberately does NOT use wp.commands/useCommandLoader (the native
 * Command Center API), because that integration triggered React error #130
 * ("element type is undefined") in the global wp build. Instead it renders
 * its own portal palette using only stable wp.element primitives.
 */
(function () {
    'use strict';

    var element = wp.element || {};
    var el = element.createElement;
    var createPortal = element.createPortal;
    var useState = element.useState;
    var useEffect = element.useEffect;
    var useRef = element.useRef;
    var registerPlugin = wp.plugins && wp.plugins.registerPlugin;
    var __ = (wp.i18n && wp.i18n.__) || function (s) { return s; };

    if (!el || !createPortal || !useState || !useEffect || !useRef || !registerPlugin) {
        return;
    }

    /* ═══════════════════════════════════════════════
       BLOCK LIST + INSERT
       ═══════════════════════════════════════════════ */

    // Synchronous read of all insertable block types.
    // Returns [{ name, title, desc, cat, keywords }] sorted by title.
    function readBlockTypes() {
        try {
            if (!wp.blocks || !wp.blocks.getBlockTypes) return [];
            var types = wp.blocks.getBlockTypes() || [];
            var result = [];
            for (var i = 0; i < types.length; i++) {
                var b = types[i];
                if (!b || !b.name || !b.title) continue;
                if (b.parent && b.parent.length) continue;            // inner-only
                if (b.supports && b.supports.inserter === false) continue; // hidden
                result.push({
                    name: b.name,
                    title: b.title,
                    desc: b.description || '',
                    cat: b.category || '',
                    keywords: (b.keywords || []).join(' '),
                });
            }
            result.sort(function (a, b) { return a.title.localeCompare(b.title); });
            return result;
        } catch (e) {
            return [];
        }
    }

    function insertBlock(blockName) {
        try {
            var select = wp.data.select;
            var dispatch = wp.data.dispatch;
            if (!select || !dispatch) return false;
            var ed = select('core/block-editor');
            var dp = dispatch('core/block-editor');
            if (!ed || !dp) return false;
            var nb = wp.blocks.createBlock(blockName);
            if (!nb) return false;

            var cid = ed.getSelectedBlockClientId();
            var rootClientId = ed.getBlockRootClientId
                ? ed.getBlockRootClientId(cid)
                : null;
            var idx;
            if (cid && ed.getBlockIndex(cid) >= 0) {
                idx = ed.getBlockIndex(cid) + 1;
            } else {
                idx = ed.getBlockCount(rootClientId);
            }
            dp.insertBlock(nb, idx, rootClientId);
            return true;
        } catch (e) {
            console.error('SNN Command Palette: insertBlock failed', e);
            return false;
        }
    }

    /* ═══════════════════════════════════════════════
       PALETTE COMPONENT
       ═══════════════════════════════════════════════ */

    var CAT_COLORS = {
        text: '#3858e9',
        media: '#f59e0b',
        design: '#7b5cf0',
        widgets: '#00a32a',
        theme: '#d63638',
        embed: '#e26f56',
    };

    function SNNCommandPalette() {
        var sOpen = useState(false), isOpen = sOpen[0], setOpen = sOpen[1];
        var sSearch = useState(''), search = sSearch[0], setSearch = sSearch[1];
        var sIdx = useState(0), sel = sIdx[0], setSel = sIdx[1];
        var inputRef = useRef(null);
        var listRef = useRef(null);
        var blocksRef = useRef([]);

        var lower = search.trim().toLowerCase();
        var filtered = lower
            ? blocksRef.current.filter(function (b) {
                return b.title.toLowerCase().indexOf(lower) !== -1 ||
                    b.name.toLowerCase().indexOf(lower) !== -1 ||
                    b.cat.toLowerCase().indexOf(lower) !== -1 ||
                    b.keywords.toLowerCase().indexOf(lower) !== -1;
              })
            : blocksRef.current;
        if (filtered.length > 60) filtered = filtered.slice(0, 60);

        // Reset selection when search changes.
        useEffect(function () { setSel(0); }, [search]);

        // Global Ctrl+K / Cmd+K toggle.
        useEffect(function () {
            function onKey(e) {
                if ((e.ctrlKey || e.metaKey) && !e.shiftKey && !e.altKey &&
                    (e.key === 'k' || e.key === 'K')) {
                    e.preventDefault();
                    e.stopPropagation();
                    setOpen(function (p) {
                        if (!p) {
                            blocksRef.current = readBlockTypes();
                            setSearch('');
                        }
                        return !p;
                    });
                }
            }
            document.addEventListener('keydown', onKey, true);
            return function () { document.removeEventListener('keydown', onKey, true); };
        }, []);

        // Focus input when opening.
        useEffect(function () {
            if (!isOpen) return;
            var t = setTimeout(function () {
                if (inputRef.current) { inputRef.current.focus(); inputRef.current.select(); }
            }, 30);
            return function () { clearTimeout(t); };
        }, [isOpen]);

        // Scroll selected item into view.
        useEffect(function () {
            if (!isOpen || !listRef.current) return;
            var node = listRef.current.querySelector('.snn-cp-item-selected');
            if (node && typeof node.scrollIntoView === 'function') {
                node.scrollIntoView({ block: 'nearest' });
            }
        }, [sel, isOpen]);

        function close() { setOpen(false); setSearch(''); }

        function pick(b) {
            if (!b) return;
            insertBlock(b.name);
            close();
        }

        function onInputKey(e) {
            var max = Math.max(0, filtered.length - 1);
            switch (e.key) {
                case 'ArrowDown':
                    e.preventDefault();
                    setSel(function (p) { return Math.min(p + 1, max); });
                    break;
                case 'ArrowUp':
                    e.preventDefault();
                    setSel(function (p) { return Math.max(p - 1, 0); });
                    break;
                case 'Enter':
                    e.preventDefault();
                    pick(filtered[sel]);
                    break;
                case 'Escape':
                    e.preventDefault();
                    close();
                    break;
                case 'Tab':
                    e.preventDefault();
                    setSel(function (p) { return e.shiftKey ? Math.max(p - 1, 0) : Math.min(p + 1, max); });
                    break;
            }
        }

        if (!isOpen) return null;

        var items = [];
        for (var i = 0; i < filtered.length; i++) {
            (function (b, idx, isSel) {
                var col = CAT_COLORS[b.cat] || '#757575';
                items.push(el('div', {
                    key: b.name,
                    className: 'snn-cp-item' + (isSel ? ' snn-cp-item-selected' : ''),
                    onClick: function () { pick(b); },
                    onMouseEnter: function () { setSel(idx); },
                    role: 'option',
                    'aria-selected': isSel,
                },
                    el('span', { className: 'snn-cp-item-info' },
                        el('span', { className: 'snn-cp-item-title' }, b.title),
                        b.desc ? el('span', { className: 'snn-cp-item-desc' }, b.desc) : null
                    ),
                    b.cat ? el('span', {
                        className: 'snn-cp-item-cat',
                        style: { color: col, borderColor: col },
                    }, b.cat) : null
                ));
            })(filtered[i], i, i === sel);
        }

        return createPortal(
            el('div', {
                className: 'snn-cp-overlay',
                onMouseDown: function (e) { if (e.target === e.currentTarget) close(); },
            },
                el('div', {
                    className: 'snn-cp-palette',
                    onMouseDown: function (e) { e.stopPropagation(); },
                },
                    el('div', { className: 'snn-cp-header' },
                        el('input', {
                            ref: inputRef,
                            type: 'text',
                            className: 'snn-cp-input',
                            placeholder: __('Search blocks to insert…', 'snn-block'),
                            value: search,
                            onChange: function (e) { setSearch(e.target.value); },
                            onKeyDown: onInputKey,
                            autoComplete: 'off',
                            spellCheck: false,
                            'aria-label': __('Search blocks', 'snn-block'),
                        })
                    ),
                    el('div', { className: 'snn-cp-list', ref: listRef },
                        items.length ? items : el('div', { className: 'snn-cp-empty' },
                            el('span', {}, __('No blocks found.', 'snn-block'))
                        )
                    ),
                    el('div', { className: 'snn-cp-footer' },
                        el('span', { className: 'snn-cp-footer-hint' }, el('kbd', {}, '↑↓'), ' nav'),
                        el('span', { className: 'snn-cp-footer-hint' }, el('kbd', {}, '↵'), ' insert'),
                        el('span', { className: 'snn-cp-footer-hint' }, el('kbd', {}, 'Esc'), ' close'),
                        el('span', { className: 'snn-cp-footer-count' }, filtered.length + ' blocks')
                    )
                )
            ),
            document.body
        );
    }

    registerPlugin('snn-command-palette', { render: SNNCommandPalette });
    console.log('SNN Command Palette: ✅ Ready — press Ctrl+K to search & insert blocks.');
})();
