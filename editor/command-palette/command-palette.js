/**
 * SNN Command Palette — Block Inserter for the native Command Center
 *
 * Registers all insertable blocks into WordPress's native Command Palette
 * (Ctrl+K / Cmd+K) so they appear alongside the built-in commands (pages,
 * templates, patterns, settings, etc.). Type a block name → Enter → the
 * block is inserted at the current selection.
 *
 * Implementation notes:
 *   - Uses wp.data.dispatch( wp.commands.store ).registerCommandLoader with
 *     a PLAIN function (not a React hook). The Command Center calls the
 *     loader as `hook({ search })` and expects `{ commands, isLoading }`.
 *     Calling React hooks (useSelect/useMemo) inside it triggered
 *     React error #130, so we read blocks synchronously instead.
 *   - We do NOT bind our own Ctrl+K handler, so the native palette (with
 *     pages/subpages) keeps working as usual.
 */
(function () {
    'use strict';

    var registerPlugin = wp.plugins && wp.plugins.registerPlugin;
    var __ = (wp.i18n && wp.i18n.__) || function (s) { return s; };
    if (!registerPlugin) return;

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
       COMMAND LOADER (plain function, NOT a React hook)
       ═══════════════════════════════════════════════ */

    // The Command Center calls this as `hook({ search })` and expects
    // `{ commands, isLoading }`. It must NOT call React hooks.
    function blockCommandLoader(props) {
        var search = (props && props.search) ? props.search : '';
        var allBlocks = readBlockTypes();
        var s = String(search).toLowerCase().trim();

        var filtered = allBlocks;
        if (s) {
            filtered = [];
            for (var i = 0; i < allBlocks.length; i++) {
                var b = allBlocks[i];
                if (
                    b.title.toLowerCase().indexOf(s) !== -1 ||
                    b.name.toLowerCase().indexOf(s) !== -1 ||
                    b.cat.toLowerCase().indexOf(s) !== -1 ||
                    b.keywords.toLowerCase().indexOf(s) !== -1
                ) {
                    filtered.push(b);
                }
            }
        }
        // Keep the palette snappy.
        filtered = filtered.slice(0, 40);

        var commands = [];
        for (var j = 0; j < filtered.length; j++) {
            (function (block) {
                commands.push({
                    name: 'snn/insert/' + block.name,
                    label: block.title,
                    description: block.desc || block.name,
                    category: 'command',
                    keywords: block.keywords ? block.keywords.split(' ') : [],
                    callback: function (args) {
                        var close = args && args.close;
                        if (insertBlock(block.name)) {
                            if (typeof close === 'function') close();
                        }
                    },
                });
            })(filtered[j]);
        }

        return { commands: commands, isLoading: false };
    }

    /* ═══════════════════════════════════════════════
       REGISTER INTO THE NATIVE COMMAND CENTER
       ═══════════════════════════════════════════════ */

    function register() {
        try {
            var storeKey = (wp.commands && wp.commands.store) ? wp.commands.store : 'core/commands';
            var dispatch = wp.data.dispatch(storeKey);
            if (dispatch && typeof dispatch.registerCommandLoader === 'function') {
                dispatch.registerCommandLoader({
                    name: 'snn/block-commands',
                    hook: blockCommandLoader,
                    category: 'command',
                });
                console.log('SNN Command Palette: ✅ Blocks added to native Command Center (Ctrl+K).');
                return true;
            }
        } catch (e) {
            console.error('SNN Command Palette: register failed', e);
        }
        return false;
    }

    // The plugin render function is only used to ensure the registration
    // runs inside the editor context (after wp.data stores are ready).
    // It renders nothing.
    function SNNCommandPaletteRegistration() {
        // Register once on mount.
        if (!window.__snnBlockCommandsRegistered) {
            window.__snnBlockCommandsRegistered = register();
        }
        return null;
    }

    registerPlugin('snn-command-palette', { render: SNNCommandPaletteRegistration });
})();
