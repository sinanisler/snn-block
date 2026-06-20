/**
 * SNN Command Palette — Ctrl+K Block Inserter
 *
 * When user presses Ctrl+K in the block editor or site editor:
 *   - Native WP commands (pages, templates, patterns, etc.) still appear
 *   - ALL registered blocks appear as insertable commands
 *   - Type a block name → Enter → inserted at selection
 *
 * Uses wp.commands.useCommandLoader (native WP 6.3+ Command Center).
 * Falls back to a custom Ctrl+Shift+K portal palette if commands API
 * is not available.
 */
(function () {
    'use strict';

    var el = wp.element && wp.element.createElement;
    var registerPlugin = wp.plugins && wp.plugins.registerPlugin;
    var __ = (wp.i18n && wp.i18n.__) || function (s) { return s; };

    if (!el || !registerPlugin) return;

    /* ═══════════════════════════════════════════════
       SHARED HELPERS
       ═══════════════════════════════════════════════ */

    function getBlocks() {
        try {
            var types = wp.blocks && wp.blocks.getBlockTypes ? wp.blocks.getBlockTypes() : [];
            if (!types || !types.length) return [];
            var result = [];
            for (var i = 0; i < types.length; i++) {
                var b = types[i];
                if (b && b.name && b.title && !b.parent) {
                    result.push({
                        name: b.name,
                        title: b.title,
                        desc: b.description || '',
                        cat: b.category || '',
                        keywords: (b.keywords || []).join(' '),
                    });
                }
            }
            result.sort(function (a, b) { return a.title.localeCompare(b.title); });
            return result;
        } catch (e) { return []; }
    }

    function insertBlock(blockName) {
        try {
            var ed = wp.data && wp.data.select ? wp.data.select('core/block-editor') : null;
            var dp = wp.data && wp.data.dispatch ? wp.data.dispatch('core/block-editor') : null;
            if (!ed || !dp) return false;
            var nb = wp.blocks.createBlock(blockName);
            if (!nb) return false;
            var cid = ed.getSelectedBlockClientId();
            var idx;
            if (cid && ed.getBlockIndex(cid) >= 0) {
                idx = ed.getBlockIndex(cid) + 1;
            } else {
                idx = ed.getBlockCount();
            }
            dp.insertBlock(nb, idx);
            return true;
        } catch (e) { return false; }
    }

    /* ═══════════════════════════════════════════════
       APPROACH 1: NATIVE COMMAND CENTER (WP 6.3+)
       Uses wp.commands.useCommandLoader to inject
       block commands into the native Ctrl+K palette.
       ═══════════════════════════════════════════════ */

    var hasNativeCommands = !!(wp.commands && wp.commands.useCommandLoader);

    if (hasNativeCommands) {
        var useCommandLoader = wp.commands.useCommandLoader;

        var NativeBlockCommands = function () {
            var allBlocks = getBlocks();

            useCommandLoader({
                name: 'snn/block-commands',
                hook: 'snn-blocks',
                label: __('Blocks', 'snn-block'),
                getCommands: function (ctx) {
                    var search = (ctx && ctx.search || '').toLowerCase().trim();
                    var filtered = allBlocks;
                    if (search) {
                        filtered = allBlocks.filter(function (b) {
                            return b.title.toLowerCase().indexOf(search) !== -1 ||
                                b.name.toLowerCase().indexOf(search) !== -1 ||
                                b.cat.toLowerCase().indexOf(search) !== -1 ||
                                b.keywords.toLowerCase().indexOf(search) !== -1;
                        });
                    }
                    // Only show top 30 to keep palette fast
                    filtered = filtered.slice(0, 30);
                    return filtered.map(function (b) {
                        return {
                            name: 'snn/insert/' + b.name,
                            label: b.title,
                            description: b.desc || b.name,
                            callback: (function (name) {
                                return function () { insertBlock(name); };
                            })(b.name),
                        };
                    });
                },
            });

            return null;
        };

        registerPlugin('snn-block-commands-native', { render: NativeBlockCommands });
        console.log('SNN Command Palette: ✅ Blocks registered into native Ctrl+K Command Center.');
    }

    /* ═══════════════════════════════════════════════
       APPROACH 2: CUSTOM PORTAL PALETTE (fallback)
       Ctrl+Shift+K — won't conflict with native Ctrl+K.
       ═══════════════════════════════════════════════ */

    if (!hasNativeCommands) {
        var createPortal = wp.element && wp.element.createPortal;
        var useState = wp.element && wp.element.useState;
        var useEffect = wp.element && wp.element.useEffect;
        var useRef = wp.element && wp.element.useRef;
        var useSelect = wp.data && wp.data.useSelect;

        if (!createPortal || !useState) return;

        var CustomPalette = function () {
            var sOpen = useState(false), isOpen = sOpen[0], setOpen = sOpen[1];
            var sSearch = useState(''), search = sSearch[0], setSearch = sSearch[1];
            var sIdx = useState(0), sel = sIdx[0], setSel = sIdx[1];
            var inputR = useRef(null);

            var blocks = useSelect(function () { return getBlocks(); }, []);
            var lower = search.trim().toLowerCase();
            var filtered = lower
                ? blocks.filter(function (b) {
                    return b.title.toLowerCase().indexOf(lower) !== -1 ||
                        b.name.toLowerCase().indexOf(lower) !== -1 ||
                        b.cat.toLowerCase().indexOf(lower) !== -1 ||
                        b.keywords.toLowerCase().indexOf(lower) !== -1;
                  })
                : blocks;

            useEffect(function () { setSel(0); }, [search]);
            useEffect(function () {
                if (isOpen && inputR.current) {
                    var t = setTimeout(function () {
                        if (inputR.current) { inputR.current.focus(); inputR.current.select(); }
                    }, 40);
                    return function () { clearTimeout(t); };
                }
            }, [isOpen]);

            useEffect(function () {
                function onKey(e) {
                    if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'k' || e.key === 'K')) {
                        var tag = (e.target.tagName || '').toLowerCase();
                        if ((tag === 'input' || tag === 'textarea') &&
                            !e.target.closest('.block-editor-rich-text__editable') &&
                            !e.target.closest('[data-rich-text-format-boundary]')) {
                            return;
                        }
                        e.preventDefault();
                        e.stopPropagation();
                        setOpen(function (p) { if (!p) setSearch(''); return !p; });
                    }
                }
                document.addEventListener('keydown', onKey, true);
                return function () { document.removeEventListener('keydown', onKey, true); };
            }, []);

            function onInputKey(e) {
                var max = Math.max(0, filtered.length - 1);
                switch (e.key) {
                    case 'ArrowDown': e.preventDefault(); setSel(function (p) { return Math.min(p + 1, max); }); break;
                    case 'ArrowUp': e.preventDefault(); setSel(function (p) { return Math.max(p - 1, 0); }); break;
                    case 'Enter': e.preventDefault();
                        if (filtered.length && filtered[sel]) {
                            insertBlock(filtered[sel].name);
                            setOpen(false); setSearch('');
                        } break;
                    case 'Escape': e.preventDefault(); setOpen(false); break;
                }
            }

            function doPick(b) { insertBlock(b.name); setOpen(false); setSearch(''); }

            if (!isOpen) return null;

            var cc = { text:'#3858e9', media:'#f59e0b', design:'#7b5cf0', widgets:'#00a32a', theme:'#d63638', embed:'#e26f56' };
            var items = [];
            for (var i = 0; i < filtered.length; i++) {
                var b = filtered[i];
                var isS = i === sel;
                var col = cc[b.cat] || '#757575';
                items.push(el('div', {
                    key: b.name,
                    className: 'snn-cp-item' + (isS ? ' snn-cp-item-selected' : ''),
                    onClick: (function (block) { return function () { doPick(block); }; })(b),
                    onMouseEnter: (function (idx) { return function () { setSel(idx); }; })(i),
                    role: 'option', 'aria-selected': isS,
                },
                    el('span', { className: 'snn-cp-item-info' },
                        el('span', { className: 'snn-cp-item-title' }, b.title),
                        b.desc ? el('span', { className: 'snn-cp-item-desc' }, b.desc) : null
                    ),
                    b.cat ? el('span', { className: 'snn-cp-item-cat', style: { color:col, borderColor:col } }, b.cat) : null
                ));
            }

            return createPortal(
                el('div', { className: 'snn-cp-overlay', onClick: function () { setOpen(false); } },
                    el('div', { className: 'snn-cp-palette', onClick: function (e) { e.stopPropagation(); } },
                        el('div', { className: 'snn-cp-header' },
                            el('input', {
                                ref: inputR, type: 'text', className: 'snn-cp-input',
                                placeholder: __('Search blocks…', 'snn-block'),
                                value: search,
                                onChange: function (e) { setSearch(e.target.value); },
                                onKeyDown: onInputKey, autoComplete: 'off', spellCheck: false,
                            })
                        ),
                        el('div', { className: 'snn-cp-list' },
                            items.length ? items : el('div', { className: 'snn-cp-empty' },
                                el('span', {}, __('No blocks found.', 'snn-block')))
                        ),
                        el('div', { className: 'snn-cp-footer' },
                            el('span', { className: 'snn-cp-footer-hint' }, el('kbd', {}, '↑↓'), ' nav'),
                            el('span', { className: 'snn-cp-footer-hint' }, el('kbd', {}, '↵'), ' insert'),
                            el('span', { className: 'snn-cp-footer-hint' }, el('kbd', {}, 'Esc'), ' close'),
                            el('span', { className: 'snn-cp-footer-count' }, filtered.length + ' blocks')
                        )
                    )
                ), document.body
            );
        };

        registerPlugin('snn-command-palette-custom', { render: CustomPalette });
        console.log('SNN Command Palette: ⚠ Native commands API unavailable — using Ctrl+Shift+K fallback.');
    }
})();
