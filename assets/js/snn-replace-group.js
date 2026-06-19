/**
 * Replace "Group" with "Container" in the block editor.
 *
 * Uses official WordPress APIs discovered from Gutenberg source:
 * - setGroupingBlockName()  → changes which block is used for grouping
 * - i18n.gettext_with_context filter → renames "Group" → "Container" in menus
 * - blocks.registerBlockType filter → adds transform to snn/container
 *
 * @see https://github.com/WordPress/gutenberg/blob/trunk/packages/blocks/src/api/registration.ts
 * @see https://github.com/WordPress/gutenberg/blob/trunk/packages/block-editor/src/components/convert-to-group-buttons/
 */
(function () {
    'use strict';

    var addFilter = wp.hooks.addFilter;
    var domReady = wp.domReady;

    /* ═══════════════════════════════════════════════
       1. Set snn/container as the grouping block
          This is the OFFICIAL WordPress API.
          After this, ALL grouping operations will use
          snn/container instead of core/group.
       ═══════════════════════════════════════════════ */
    domReady(function () {
        try {
            wp.blocks.setGroupingBlockName('snn/container');
        } catch (e) {
            // Fallback for older WP versions
        }
    });

    /* ═══════════════════════════════════════════════
       2. Rename "Group" → "Container" in all menus
          The menu label is hardcoded as _x('Group', 'verb')
          and _x('Group', 'action: convert blocks to group').
          We override the i18n translation to change it.
       ═══════════════════════════════════════════════ */
    addFilter(
        'i18n.gettext_with_context',
        'snn/rename-group-to-container',
        function (translation, text, context) {
            if (text === 'Group' &&
                (context === 'verb' || context === 'action: convert blocks to group')) {
                return 'Container';
            }
            return translation;
        }
    );

    /* ═══════════════════════════════════════════════
       3. Add transform to snn/container so that
          switchToBlockType() can convert any blocks
          into a container (required for grouping).
       ═══════════════════════════════════════════════ */
    addFilter(
        'blocks.registerBlockType',
        'snn/add-container-transform',
        function (settings, name) {
            if (name === 'snn/container') {
                settings.transforms = settings.transforms || {};
                settings.transforms.from = settings.transforms.from || [];
                // Only add if not already present
                var hasWildcardTransform = settings.transforms.from.some(function (t) {
                    return t.type === 'block' && t.blocks && t.blocks.indexOf('*') !== -1;
                });
                if (!hasWildcardTransform) {
                    settings.transforms.from.push({
                        type: 'block',
                        isMultiBlock: true,
                        blocks: ['*'],
                        __experimentalConvert: function (blocks) {
                            return wp.blocks.createBlock(
                                'snn/container',
                                {},
                                blocks.map(function (b) {
                                    return wp.blocks.createBlock(
                                        b.name,
                                        Object.assign({}, b.attributes),
                                        (b.innerBlocks || []).map(function (inner) {
                                            return wp.blocks.createBlock(
                                                inner.name,
                                                Object.assign({}, inner.attributes),
                                                inner.innerBlocks
                                            );
                                        })
                                    );
                                })
                            );
                        }
                    });
                }
            }
            return settings;
        }
    );

})();
