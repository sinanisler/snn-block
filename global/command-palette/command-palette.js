/**
 * SNN Global Command Palette — Ctrl+K Everywhere
 *
 * A pure-vanilla-JS command palette that works on every page
 * (wp-admin, block editor, site editor, frontend) for logged-in users.
 *
 * Press Ctrl+K (or Cmd+K) → search & execute commands:
 *   - In the block editor: search blocks + insert them
 *   - On any wp-admin page: navigate to pages, posts, settings, etc.
 *   - On the frontend: navigate to common admin sections
 *
 * No React, no wp.commands, no crash — just DOM + keyboard events.
 */
(function () {
    'use strict';

    /* ═══════════════════════════════════════════════
       HELPERS
       ═══════════════════════════════════════════════ */

    var D = document;
    var B = D.body;

    /** Tiny SVG icon helper (inline for zero-network overhead). */
    var ICONS = {
        search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>',
        block:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>',
        page:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>',
        post:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>',
        nav:    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>',
        gear:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>',
        searchIcon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>',
        media:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>',
        link:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>',
    };

    function iconSVG(name) {
        return ICONS[name] || ICONS.search;
    }

    function escapeHTML(str) {
        var div = D.createElement('div');
        div.appendChild(D.createTextNode(str));
        return div.innerHTML;
    }

    /** Check if we are inside the block editor (Gutenberg). */
    function isBlockEditor() {
        return !!(D.querySelector('.block-editor-writing-flow, .edit-site-block-editor__block-list, .interface-interface-skeleton__content'));
    }

    /** Check if we are on a wp-admin page. */
    function isAdmin() {
        return (typeof window.wp !== 'undefined' && window.wp.admin) || D.body.classList.contains('wp-admin');
    }

    /* ═══════════════════════════════════════════════
       BLOCK COMMANDS (only in editor context)
       ═══════════════════════════════════════════════ */

    function getBlocks() {
        try {
            if (typeof wp === 'undefined' || !wp.blocks || !wp.blocks.getBlockTypes) return [];
            var types = wp.blocks.getBlockTypes() || [];
            var result = [];
            for (var i = 0; i < types.length; i++) {
                var b = types[i];
                if (!b || !b.name || !b.title) continue;
                if (b.parent && b.parent.length) continue;
                if (b.supports && b.supports.inserter === false) continue;
                result.push({
                    name: b.name,
                    title: b.title,
                    desc: b.description || '',
                    cat: b.category || '',
                    keywords: (b.keywords || []).join(' '),
                    type: 'block',
                    icon: 'block',
                });
            }
            result.sort(function (a, b) { return a.title.localeCompare(b.title); });
            return result;
        } catch (e) { return []; }
    }

    function insertBlockIntoEditor(blockName) {
        try {
            if (typeof wp === 'undefined' || !wp.data || !wp.blocks) return false;
            var sel = wp.data.select('core/block-editor');
            var disp = wp.data.dispatch('core/block-editor');
            if (!sel || !disp) return false;
            var nb = wp.blocks.createBlock(blockName);
            if (!nb) return false;
            var cid = sel.getSelectedBlockClientId();
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
       STATIC COMMANDS (available everywhere)
       ═══════════════════════════════════════════════ */

    function getStaticCommands() {
        var cmds = [];

        // Only show these on admin pages.
        if (isAdmin()) {
            cmds.push(
                { name: 'nav-posts',      title: 'All Posts',          desc: 'edit.php',                           type: 'nav', icon: 'post',  href: 'edit.php' },
                { name: 'nav-pages',      title: 'All Pages',          desc: 'edit.php?post_type=page',           type: 'nav', icon: 'page',  href: 'edit.php?post_type=page' },
                { name: 'nav-media',      title: 'Media Library',      desc: 'upload.php',                        type: 'nav', icon: 'media', href: 'upload.php' },
                { name: 'nav-plugins',    title: 'Plugins',            desc: 'plugins.php',                       type: 'nav', icon: 'gear',  href: 'plugins.php' },
                { name: 'nav-users',      title: 'Users',              desc: 'users.php',                         type: 'nav', icon: 'gear',  href: 'users.php' },
                { name: 'nav-themes',     title: 'Appearance → Themes', desc: 'themes.php',                        type: 'nav', icon: 'gear',  href: 'themes.php' },
                { name: 'nav-settings',   title: 'Settings',            desc: 'options-general.php',               type: 'nav', icon: 'gear',  href: 'options-general.php' },
                { name: 'nav-front',      title: 'View Site',           desc: siteUrl(),                           type: 'nav', icon: 'link',  href: siteUrl() },
                { name: 'cmd-new-post',   title: 'New Post',            desc: 'post-new.php',                      type: 'action', icon: 'post',  href: 'post-new.php' },
                { name: 'cmd-new-page',   title: 'New Page',            desc: 'post-new.php?post_type=page',       type: 'action', icon: 'page',  href: 'post-new.php?post_type=page' },
                { name: 'cmd-logout',     title: 'Log Out',             desc: wpLogoutUrl(),                       type: 'action', icon: 'link',  href: wpLogoutUrl() },
            );
        }

        // On frontend, logged-in user might want these.
        if (!isAdmin()) {
            cmds.push(
                { name: 'nav-admin',       title: 'Dashboard',         desc: siteUrl() + '/wp-admin',             type: 'nav',    icon: 'gear',  href: siteUrl() + '/wp-admin' },
                { name: 'nav-posts-f',     title: 'Posts',             desc: siteUrl() + '/wp-admin/edit.php',    type: 'nav',    icon: 'post',  href: siteUrl() + '/wp-admin/edit.php' },
                { name: 'nav-pages-f',     title: 'Pages',             desc: siteUrl() + '/wp-admin/edit.php?post_type=page', type: 'nav', icon: 'page', href: siteUrl() + '/wp-admin/edit.php?post_type=page' },
                { name: 'nav-settings-f',  title: 'Settings',          desc: siteUrl() + '/wp-admin/options-general.php', type: 'nav', icon: 'gear', href: siteUrl() + '/wp-admin/options-general.php' },
                { name: 'cmd-logout-f',    title: 'Log Out',            desc: wpLogoutUrl(),                       type: 'action', icon: 'link', href: wpLogoutUrl() },
            );
        }

        return cmds;
    }

    function siteUrl() {
        if (typeof window.SNN_SITE_URL === 'string') return window.SNN_SITE_URL;
        return '/';
    }

    function wpLogoutUrl() {
        if (typeof window.SNN_LOGOUT_URL === 'string') return window.SNN_LOGOUT_URL;
        return siteUrl() + '/wp-login.php?action=logout';
    }

    /* ═══════════════════════════════════════════════
       CATEGORY COLORS
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
       PALETTE ENGINE
       ═══════════════════════════════════════════════ */

    var state = {
        open: false,
        search: '',
        activeIndex: 0,
        results: [],
        blocksCache: null,
    };

    var refs = {};

    function buildHTML() {
        var frag = D.createDocumentFragment();
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

        frag.appendChild(overlay);
        B.appendChild(frag);

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
            list.innerHTML =
                '<div class="snn-cp-empty">' +
                    '<span class="snn-cp-empty-icon">🔍</span>' +
                    '<span>No matches found.</span>' +
                '</div>';
            refs.count.textContent = '';
            return;
        }

        // Group results by origin: blocks vs commands.
        var hasBlocks = false, hasCmds = false;
        for (var i = 0; i < state.results.length; i++) {
            if (state.results[i].type === 'block') hasBlocks = true;
            else hasCmds = true;
        }

        if (hasBlocks && hasCmds) {
            var blocksGrp = D.createElement('div');
            blocksGrp.className = 'snn-cp-group';
            blocksGrp.textContent = 'Blocks';
            list.appendChild(blocksGrp);

            for (var j = 0; j < state.results.length; j++) {
                if (state.results[j].type !== 'block') continue;
                list.appendChild(buildItem(state.results[j], j));
            }

            var cmdGrp = D.createElement('div');
            cmdGrp.className = 'snn-cp-group';
            cmdGrp.textContent = 'Commands';
            list.appendChild(cmdGrp);
        }

        for (var k = 0; k < state.results.length; k++) {
            if (hasBlocks && hasCmds && state.results[k].type === 'block') continue;
            list.appendChild(buildItem(state.results[k], k));
        }

        refs.count.textContent = state.results.length + ' results';
    }

    function buildItem(item, index) {
        var el = D.createElement('button');
        el.className = 'snn-cp-item';
        if (index === state.activeIndex) el.classList.add('snn-cp-item-active');
        el.setAttribute('data-index', index);
        el.setAttribute('type', 'button');

        var iconHTML = iconSVG(item.icon || 'block');
        var badgeHTML = '';
        if (item.type === 'block') {
            var col = CAT_COLORS[item.cat] || '#757575';
            badgeHTML = '<span class="snn-cp-item-badge" style="color:' + col + ';border-color:' + col + '">' + escapeHTML(item.cat) + '</span>';
        }

        el.innerHTML =
            '<span class="snn-cp-item-icon">' + iconHTML + '</span>' +
            '<span class="snn-cp-item-body">' +
                '<span class="snn-cp-item-title">' + escapeHTML(item.title) + '</span>' +
                (item.desc ? '<span class="snn-cp-item-desc">' + escapeHTML(item.desc) + '</span>' : '') +
            '</span>' +
            badgeHTML;

        el.addEventListener('click', function () { execute(item); });
        el.addEventListener('mouseenter', function () { setActive(index); });

        return el;
    }

    function setActive(index) {
        state.activeIndex = index;
        var items = refs.list.querySelectorAll('.snn-cp-item');
        for (var i = 0; i < items.length; i++) {
            items[i].classList.toggle('snn-cp-item-active', parseInt(items[i].getAttribute('data-index'), 10) === index);
        }
        // Scroll into view.
        var active = refs.list.querySelector('.snn-cp-item-active');
        if (active && typeof active.scrollIntoView === 'function') {
            active.scrollIntoView({ block: 'nearest' });
        }
    }

    function getBlockResults(search) {
        // Cache blocks so we don't re-read on every keystroke.
        if (!state.blocksCache) {
            state.blocksCache = getBlocks();
        }
        var s = search.toLowerCase().trim();
        if (!s) return state.blocksCache.slice(0, 40);
        var filtered = [];
        for (var i = 0; i < state.blocksCache.length; i++) {
            var b = state.blocksCache[i];
            if (
                b.title.toLowerCase().indexOf(s) !== -1 ||
                b.name.toLowerCase().indexOf(s) !== -1 ||
                b.cat.toLowerCase().indexOf(s) !== -1 ||
                b.keywords.toLowerCase().indexOf(s) !== -1
            ) {
                filtered.push(b);
            }
        }
        return filtered.slice(0, 40);
    }

    function getStaticResults(search) {
        var all = getStaticCommands();
        var s = search.toLowerCase().trim();
        if (!s) return all;
        return all.filter(function (c) {
            return c.title.toLowerCase().indexOf(s) !== -1 ||
                (c.desc || '').toLowerCase().indexOf(s) !== -1;
        });
    }

    function doSearch() {
        var s = state.search;
        var blockResults = [];
        var staticResults = [];

        // Show blocks only in the block editor.
        if (isBlockEditor()) {
            blockResults = getBlockResults(s);
        }
        staticResults = getStaticResults(s);

        // Merge: blocks first, then static commands.
        state.results = blockResults.concat(staticResults);
        state.activeIndex = Math.min(state.activeIndex, Math.max(0, state.results.length - 1));
        if (state.results.length === 0) state.activeIndex = 0;
        render();
    }

    function execute(item) {
        if (!item) return;

        if (item.type === 'block') {
            // Insert block.
            var ok = insertBlockIntoEditor(item.name);
            if (!ok) {
                // Fallback: couldn't insert (maybe not in editor).
                // Just close silently.
            }
        } else if (item.href) {
            if (item.href.indexOf('http') === 0 || item.href.indexOf('/') === 0) {
                window.location.href = item.href;
            } else {
                window.location.href = (siteUrl() + '/wp-admin/' + item.href).replace(/\/+/g, '/').replace(':/', '://');
            }
        }

        close();
    }

    function open() {
        if (state.open) return;
        state.open = true;
        state.search = '';
        state.activeIndex = 0;
        state.blocksCache = null; // Refresh block list each open.
        state.results = [];

        refs.overlay.style.display = '';
        refs.input.value = '';

        doSearch();

        // Focus the input.
        setTimeout(function () {
            refs.input.focus();
            refs.input.select();
        }, 30);
    }

    function close() {
        if (!state.open) return;
        state.open = false;
        state.search = '';
        refs.overlay.style.display = 'none';
    }

    function navigate(dir) {
        var max = Math.max(0, state.results.length - 1);
        if (dir < 0) {
            state.activeIndex = Math.max(0, state.activeIndex - 1);
        } else {
            state.activeIndex = Math.min(max, state.activeIndex + 1);
        }
        setActive(state.activeIndex);
    }

    /* ═══════════════════════════════════════════════
       EVENT HANDLERS
       ═══════════════════════════════════════════════ */

    function onGlobalKeydown(e) {
        // Ctrl+K / Cmd+K — toggle palette.
        if ((e.ctrlKey || e.metaKey) && !e.shiftKey && !e.altKey &&
            (e.key === 'k' || e.key === 'K')) {
            // Don't intercept when typing in native inputs (except the editor canvas).
            var tag = (e.target.tagName || '').toLowerCase();
            var isRichText = e.target.closest('[data-rich-text-format-boundary], .block-editor-rich-text__editable');
            if ((tag === 'input' || tag === 'textarea' || tag === 'select' || e.target.isContentEditable) && !isRichText) {
                return; // let native behavior happen (e.g. search fields).
            }
            e.preventDefault();
            e.stopPropagation();
            if (state.open) { close(); } else { open(); }
        }

        // Esc — close.
        if (e.key === 'Escape' && state.open) {
            e.preventDefault();
            e.stopPropagation();
            close();
        }
    }

    function onInputKeydown(e) {
        if (!state.open) return;
        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                navigate(1);
                break;
            case 'ArrowUp':
                e.preventDefault();
                navigate(-1);
                break;
            case 'Enter':
                e.preventDefault();
                if (state.results.length && state.results[state.activeIndex]) {
                    execute(state.results[state.activeIndex]);
                }
                break;
            case 'Escape':
                e.preventDefault();
                e.stopPropagation();
                close();
                break;
        }
    }

    function onInputChange() {
        state.search = refs.input.value;
        state.activeIndex = 0;
        doSearch();
    }

    function onOverlayClick(e) {
        if (e.target === refs.overlay) {
            close();
        }
    }

    /* ═══════════════════════════════════════════════
       INIT
       ═══════════════════════════════════════════════ */

    function init() {
        if (refs.overlay) return; // already initialized.

        buildHTML();

        // Global keyboard listener (capture phase to beat other handlers).
        D.addEventListener('keydown', onGlobalKeydown, true);

        // Input events.
        refs.input.addEventListener('keydown', onInputKeydown);
        refs.input.addEventListener('input', onInputChange);

        // Click outside to close.
        refs.overlay.addEventListener('mousedown', onOverlayClick);

        // Prevent clicks inside palette from closing.
        refs.palette.addEventListener('mousedown', function (e) { e.stopPropagation(); });

        console.log('SNN Global Command Palette: ✅ Ready — press Ctrl+K anywhere.');
    }

    // Start when DOM is ready.
    if (D.readyState === 'loading') {
        D.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
