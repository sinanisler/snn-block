/**
 * SNN Global Style Editor — Direct Header Button
 *
 * Injects a button directly into the editor-header__settings toolbar area
 * using createPortal. Clicking opens the full-screen Global Style Editor modal
 * immediately — no intermediate sidebar step.
 */
(function () {
    const { createElement: el, useState, useEffect, useRef, Fragment, createPortal } = wp.element;
    const { registerPlugin } = wp.plugins;
    const { Button, Icon } = wp.components;
    const { __ } = wp.i18n;

    // Guard: required APIs
    if (!registerPlugin || !createPortal) {
        console.warn('SNN Global Editor: registerPlugin or createPortal not available.');
        return;
    }

    const GlobalEditorButton = () => {
        const [isModalOpen, setIsModalOpen] = useState(false);
        const [portalTarget, setPortalTarget] = useState(null);
        const intervalRef = useRef(null);
        const GlobalEditorModal = window.SNN_GlobalEditorApp;

        // Find the header and insert our container at the right position (before the 3rd child = settings cog)
        useEffect(function () {
            function insertButtonContainer() {
                var header = document.querySelector('.editor-header__settings');
                if (!header) return false;

                // Check if our container already exists
                var existing = document.getElementById('snn-ge-header-btn');
                if (existing) { setPortalTarget(existing); return true; }

                // Create our container element
                var container = document.createElement('span');
                container.id = 'snn-ge-header-btn';
                container.className = 'snn-ge-header-btn-wrapper';
                container.style.cssText = 'display:inline-flex;align-items:center;';

                // Insert before the 3rd child (0-indexed: index 2)
                // This typically places it before the settings cog / preferences button
                var targetChild = header.children[2];
                if (targetChild) {
                    header.insertBefore(container, targetChild);
                } else {
                    header.appendChild(container);
                }

                setPortalTarget(container);
                return true;
            }

            // Try immediately
            if (insertButtonContainer()) return;

            // Poll until it works
            intervalRef.current = setInterval(function () {
                if (insertButtonContainer()) {
                    clearInterval(intervalRef.current);
                    intervalRef.current = null;
                }
            }, 500);

            return function () {
                if (intervalRef.current) clearInterval(intervalRef.current);
                // Clean up our container when plugin unmounts
                var container = document.getElementById('snn-ge-header-btn');
                if (container) container.remove();
            };
        }, []);

        if (!portalTarget) return null;

        var btn = el(Button, {
            onClick: function () { setIsModalOpen(true); },
            icon: 'admin-appearance',
            label: __('Global Style Editor', 'snn-block'),
            showTooltip: true,
            style: {
                height: '36px',
                width: '36px',
                padding: '0',
                justifyContent: 'center',
                minWidth: '36px',
            },
        });

        return el(Fragment, null,
            createPortal(btn, portalTarget),
            GlobalEditorModal && el(GlobalEditorModal, {
                isOpen: isModalOpen,
                onClose: function () { setIsModalOpen(false); },
            })
        );
    };

    // ── Also add a "More" menu item for extra discoverability ──
    const { PluginMoreMenuItem } = wp.editor || wp.editPost || {};

    const GlobalMoreMenuItem = () => {
        var [isOpen, setOpen] = useState(false);
        var GlobalEditorModal = window.SNN_GlobalEditorApp;

        if (!PluginMoreMenuItem) return null;

        return el(Fragment, null,
            el(PluginMoreMenuItem, {
                icon: 'admin-appearance',
                onClick: function () { setOpen(true); },
            }, __('Global Style Editor', 'snn-block')),
            GlobalEditorModal && el(GlobalEditorModal, {
                isOpen: isOpen,
                onClose: function () { setOpen(false); },
            })
        );
    };

    registerPlugin('snn-global-style-editor-button', {
        render: GlobalEditorButton,
    });

    if (PluginMoreMenuItem) {
        registerPlugin('snn-global-style-editor-menu', {
            render: GlobalMoreMenuItem,
        });
    }
})();
