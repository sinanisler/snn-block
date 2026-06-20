/**
 * SNN Global Command Palette — Ctrl+K Everywhere
 *
 * Pure-vanilla-JS command palette for logged-in users on every page
 * (wp-admin, block editor, site editor, frontend).
 *
 * Press Ctrl+K (or Cmd+K) → search & execute:
 *   - In the block editor: blocks + full wp-admin menu
 *   - On other admin pages: full wp-admin menu (dynamically from REST)
 *   - On the frontend: full wp-admin menu fallback
 *
 * No React, no crash — just DOM + fetch + keyboard events.
 */
(function () {
    'use strict';

    var D = document;
    var B = D.body;

    /* ═══════════════════════════════════════════════
       CONFIG (injected by PHP)
       ═══════════════════════════════════════════════ */

    var SITE_URL   = window.SNN_SITE_URL   || '/';
    var ADMIN_URL  = window.SNN_ADMIN_URL  || SITE_URL + '/wp-admin/';
    var LOGOUT_URL = window.SNN_LOGOUT_URL || SITE_URL + '/wp-login.php?action=logout';

    /* ═══════════════════════════════════════════════
       HELPERS
       ═══════════════════════════════════════════════ */

    function iconSVG(name) {
        var ICONS = {
            search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>',
            block:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>',
            page:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>',
            post:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>',
            gear:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>',
            media:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>',
            link:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>',
            external: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>',
            logout: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>',
        };
        return ICONS[name] || ICONS.page;
    }

    function escapeHTML(str) {
        var d = D.createElement('div');
        d.appendChild(D.createTextNode(str));
        return d.innerHTML;
    }

    function isBlockEditor() {
        return !!(D.querySelector('.block-editor-writing-flow, .edit-site-block-editor__block-list, .interface-interface-skeleton__content'));
    }

    function isAdmin() {
        return !!(D.body.classList.contains('wp-admin') || (window.wp && window.wp.admin));
    }

    /* ═══════════════════════════════════════════════
       BLOCK COMMANDS (editor only)
       ═══════════════════════════════════════════════ */

    function getBlocks() {
        try {
            if (typeof wp === 'undefined' || !wp.blocks || !wp.blocks.getBlockTypes) return [];
            var types = wp.blocks.getBlockTypes() || [];
            var out = [];
            for (var i = 0; i < types.length; i++) {
                var b = types[i];
                if (!b || !b.name || !b.title) continue;
                if (b.parent && b.parent.length) continue;
                if (b.supports && b.supports.inserter === false) continue;
                out.push({
                    name:     b.name,
                    title:    b.title,
                    desc:     b.description || b.name,
                    cat:      b.category || '',
                    keywords: (b.keywords || []).join(' '),
                    type:     'block',
                    icon:     'block',
                });
            }
            out.sort(function (a, b) { return a.title.localeCompare(b.title); });
            return out;
        } catch (e) { return []; }
    }

    function insertBlockIntoEditor(blockName) {
        try {
            if (typeof wp === 'undefined' || !wp.data || !wp.blocks) return false;
            var sel  = wp.data.select('core/block-editor');
            var disp = wp.data.dispatch('core/block-editor');
            if (!sel || !disp) return false;
            var nb = wp.blocks.createBlock(blockName);
            if (!nb) return false;
            var cid  = sel.getSelectedBlockClientId();
            var root = sel.getBlockRootClientId ? sel.getBlockRootClientId(cid) : null;
            var idx;
            if (cid && sel.getBlockIndex(cid) >= 0) {
                idx = sel.getBlockIndex(cid) + 1;
            } else {
                idx = sel.getBlockCount(root);
            }
            disp.insertBlock(nb, idx, root);
            return true;
        } catch (e) { return false; }
    }

    /* ═══════════════════════════════════════════════
       ADMIN MENU (from inline JSON — always available)
       ═══════════════════════════════════════════════ */

    var _menuCache = null;

    function buildMenuCache() {
        if (_menuCache) return;
        // Read at call time — the footer <script> may not have run yet at IIFE time.
        var raw = window.SNN_ADMIN_MENU || [];
        if (!raw.length) { _menuCache = []; return; }
        _menuCache = [];
        for (var i = 0; i < raw.length; i++) {
            var item = raw[i];
            _menuCache.push({
                title: item.title  || '',
                desc:  item.parent || '',
                href:  item.href   || '',
                icon:  mapMenuIcon(item.icon || ''),
                type:  'menu',
            });
        }
    }

    function mapMenuIcon(dashicon) {
        if (!dashicon) return 'page';
        // Direct icon names from PHP (external, logout).
        if (dashicon === 'external' || dashicon === 'logout') return dashicon;
        var m = {
            'dashicons-dashboard': 'page',    'dashicons-admin-post': 'post',
            'dashicons-admin-page': 'page',   'dashicons-admin-media': 'media',
            'dashicons-admin-comments': 'page','dashicons-admin-appearance': 'gear',
            'dashicons-admin-plugins': 'gear', 'dashicons-admin-users': 'gear',
            'dashicons-admin-tools': 'gear',   'dashicons-admin-settings': 'gear',
            'dashicons-admin-generic': 'page', 'dashicons-admin-network': 'gear',
            'dashicons-admin-home': 'page',    'dashicons-admin-links': 'link',
            'dashicons-admin-site': 'link',    'dashicons-admin-site-alt': 'link',
        };
        return m[dashicon] || 'page';
    }

    function getMenuResults(search) {
        buildMenuCache();
        if (!_menuCache.length) return [];
        var s = search.toLowerCase().trim();
        if (!s) return _menuCache;
        var filtered = [];
        for (var i = 0; i < _menuCache.length; i++) {
            var m = _menuCache[i];
            if (m.title.toLowerCase().indexOf(s) !== -1 ||
                (m.desc || '').toLowerCase().indexOf(s) !== -1) {
                filtered.push(m);
            }
        }
        return filtered;
    }

    /* ═══════════════════════════════════════════════
       CATEGORY COLORS (for blocks)
       ═══════════════════════════════════════════════ */

    var CAT_COLORS = {
        text:    '#3858e9',
        media:   '#f59e0b',
        design:  '#7b5cf0',
        widgets: '#00a32a',
        theme:   '#d63638',
        embed:   '#e26f56',
    };

    /* ═══════════════════════════════════════════════
       PALETTE STATE + RENDER
       ═══════════════════════════════════════════════ */

    var state = {
        open:        false,
        search:      '',
        activeIndex: 0,
        results:     [],   // unified flat list: blocks + menu items
        blocksCache: null,
    };

    var refs = {};

    function buildHTML() {
        var overlay = D.createElement('div');
        overlay.className = 'snn-cp-overlay';
        overlay.setAttribute('data-snn-cp', 'overlay');
        overlay.style.display = 'none';
        overlay.innerHTML =
            '<div class="snn-cp-palette" data-snn-cp="palette">' +
                '<div class="snn-cp-header">' +
                    '<span class="snn-cp-icon">' + iconSVG('search') + '</span>' +
                    '<input class="snn-cp-input" type="text" ' +
                        'placeholder="Search commands &amp; blocks…" ' +
                        'autocomplete="off" spellcheck="false" ' +
                        'data-snn-cp="input">' +
                '</div>' +
                '<div class="snn-cp-list" data-snn-cp="list"></div>' +
                '<div class="snn-cp-footer">' +
                    '<span><kbd>↑↓</kbd> navigate</span>' +
                    '<span><kbd>↵</kbd> execute</span>' +
                    '<span><kbd>Esc</kbd> close</span>' +
                    '<span class="snn-cp-footer-spacer"></span>' +
                    '<span data-snn-cp="count"></span>' +
                '</div>' +
            '</div>';
        B.appendChild(overlay);

        refs.overlay = overlay;
        refs.palette = overlay.querySelector('[data-snn-cp="palette"]');
        refs.input   = overlay.querySelector('[data-snn-cp="input"]');
        refs.list    = overlay.querySelector('[data-snn-cp="list"]');
        refs.count   = overlay.querySelector('[data-snn-cp="count"]');
    }

    function render() {
        var list = refs.list;
        list.innerHTML = '';

        if (!state.results.length) {
            list.innerHTML = '<div class="snn-cp-empty"><span class="snn-cp-empty-icon">🔍</span><span>No matches found.</span></div>';
            refs.count.textContent = '';
            return;
        }

        // Separate blocks and menu items.
        var blocks = [], menus = [];
        for (var i = 0; i < state.results.length; i++) {
            (state.results[i].type === 'block' ? blocks : menus).push(state.results[i]);
        }

        // Build groups: blocks first (if any), then pages/menu.
        var idx = 0;
        var max = Math.min(blocks.length, 60); // cap blocks

        if (blocks.length) {
            var bg = D.createElement('div');
            bg.className = 'snn-cp-group';
            bg.textContent = 'Blocks';
            list.appendChild(bg);
            for (var b = 0; b < max; b++, idx++) {
                list.appendChild(buildItem(blocks[b], idx));
            }
        }

        if (menus.length) {
            var mg = D.createElement('div');
            mg.className = 'snn-cp-group';
            mg.textContent = 'Pages';
            list.appendChild(mg);
            var menuMax = Math.min(menus.length, 60);
            for (var m = 0; m < menuMax; m++, idx++) {
                list.appendChild(buildItem(menus[m], idx));
            }
        }

        refs.count.textContent = state.results.length + ' results';
    }

    function buildItem(item, index) {
        var el = D.createElement('button');
        el.className = 'snn-cp-item';
        if (index === state.activeIndex) el.classList.add('snn-cp-item-active');
        el.setAttribute('data-index', index);
        el.setAttribute('type', 'button');

        var svg  = iconSVG(item.icon || 'page');
        var desc = item.desc || (item.type === 'block' ? item.name : '');

        // Badge: only for blocks (category label).
        var badge = '';
        if (item.type === 'block' && item.cat) {
            var col = CAT_COLORS[item.cat] || '#757575';
            badge = '<span class="snn-cp-item-badge" style="color:' + col + ';border-color:' + col + '">' + escapeHTML(item.cat) + '</span>';
        }

        el.innerHTML =
            '<span class="snn-cp-item-icon">' + svg + '</span>' +
            '<span class="snn-cp-item-body">' +
                '<span class="snn-cp-item-title">' + escapeHTML(item.title) + '</span>' +
                (desc ? '<span class="snn-cp-item-desc">' + escapeHTML(desc) + '</span>' : '') +
            '</span>' +
            badge;

        el.addEventListener('click', function () { execute(item); });
        el.addEventListener('mouseenter', function () { setActive(index); });
        return el;
    }

    function setActive(index) {
        state.activeIndex = index;
        var items = refs.list.querySelectorAll('.snn-cp-item');
        for (var i = 0; i < items.length; i++) {
            var idx = parseInt(items[i].getAttribute('data-index'), 10);
            items[i].classList.toggle('snn-cp-item-active', idx === index);
        }
        var act = refs.list.querySelector('.snn-cp-item-active');
        if (act && typeof act.scrollIntoView === 'function') {
            act.scrollIntoView({ block: 'nearest' });
        }
    }

    /* ═══════════════════════════════════════════════
       SEARCH + EXECUTE
       ═══════════════════════════════════════════════ */

    function doSearch() {
        var s = state.search;

        // Blocks — only in the block editor.
        var blockResults = [];
        if (isBlockEditor()) {
            if (!state.blocksCache) state.blocksCache = getBlocks();
            var bs = s.toLowerCase().trim();
            if (!bs) {
                blockResults = state.blocksCache.slice(0, 60);
            } else {
                for (var bi = 0; bi < state.blocksCache.length; bi++) {
                    var bk = state.blocksCache[bi];
                    if (
                        bk.title.toLowerCase().indexOf(bs) !== -1 ||
                        bk.name.toLowerCase().indexOf(bs) !== -1 ||
                        bk.cat.toLowerCase().indexOf(bs) !== -1 ||
                        bk.keywords.toLowerCase().indexOf(bs) !== -1
                    ) blockResults.push(bk);
                }
                blockResults = blockResults.slice(0, 60);
            }
        }

        // Menu items.
        var menuResults = getMenuResults(s);

        // Merge: blocks on top, menu below.
        state.results = blockResults.concat(menuResults);
        state.activeIndex = Math.min(state.activeIndex, Math.max(0, state.results.length - 1));
        if (!state.results.length) state.activeIndex = 0;
        render();
    }

    function execute(item) {
        if (!item) return;
        if (item.type === 'block') {
            insertBlockIntoEditor(item.name);
        } else if (item.href) {
            window.location.href = item.href;
        }
        close();
    }

    /* ═══════════════════════════════════════════════
       OPEN / CLOSE
       ═══════════════════════════════════════════════ */

    function open() {
        if (state.open) return;
        state.open = true;
        state.search = '';
        state.activeIndex = 0;
        state.results = [];
        state.blocksCache = null;

        refs.overlay.style.display = '';
        refs.input.value = '';
        doSearch();
        setTimeout(function () {
            refs.input.focus();
            refs.input.select();
        }, 30);
    }

    function close() {
        if (!state.open) return;
        state.open = false;
        refs.overlay.style.display = 'none';
    }

    function navigate(dir) {
        var max = Math.max(0, state.results.length - 1);
        state.activeIndex = dir < 0
            ? Math.max(0, state.activeIndex - 1)
            : Math.min(max, state.activeIndex + 1);
        setActive(state.activeIndex);
    }

    /* ═══════════════════════════════════════════════
       EVENT HANDLERS
       ═══════════════════════════════════════════════ */

    function onGlobalKeydown(e) {
        if ((e.ctrlKey || e.metaKey) && !e.shiftKey && !e.altKey &&
            (e.key === 'k' || e.key === 'K')) {
            var tag = (e.target.tagName || '').toLowerCase();
            var rt  = e.target.closest('[data-rich-text-format-boundary], .block-editor-rich-text__editable');
            if ((tag === 'input' || tag === 'textarea' || tag === 'select' || e.target.isContentEditable) && !rt) return;
            e.preventDefault();
            e.stopPropagation();
            state.open ? close() : open();
        }
        if (e.key === 'Escape' && state.open) {
            e.preventDefault();
            e.stopPropagation();
            close();
        }
    }

    function onInputKeydown(e) {
        if (!state.open) return;
        switch (e.key) {
            case 'ArrowDown': e.preventDefault(); navigate(1); break;
            case 'ArrowUp':   e.preventDefault(); navigate(-1); break;
            case 'Enter':     e.preventDefault();
                if (state.results.length && state.results[state.activeIndex]) {
                    execute(state.results[state.activeIndex]);
                }
                break;
            case 'Escape':    e.preventDefault(); e.stopPropagation(); close(); break;
        }
    }

    function onInputChange() {
        state.search = refs.input.value;
        state.activeIndex = 0;
        doSearch();
    }

    function onOverlayClick(e) {
        if (e.target === refs.overlay) close();
    }

    /* ═══════════════════════════════════════════════
       INIT
       ═══════════════════════════════════════════════ */

    function init() {
        if (refs.overlay) return;
        buildHTML();
        D.addEventListener('keydown', onGlobalKeydown, true);
        refs.input.addEventListener('keydown', onInputKeydown);
        refs.input.addEventListener('input', onInputChange);
        refs.overlay.addEventListener('mousedown', onOverlayClick);
        refs.palette.addEventListener('mousedown', function (e) { e.stopPropagation(); });
        console.log('SNN Global Command Palette: ✅ Ready — press Ctrl+K anywhere.');
    }

    if (D.readyState === 'loading') {
        D.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
