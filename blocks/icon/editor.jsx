const { registerBlockType } = wp.blocks;
const { InspectorControls, useBlockProps, MediaUpload, MediaUploadCheck } = wp.blockEditor;
const { PanelBody, Button, Modal, SearchControl, ColorPalette, BaseControl, TextareaControl, SelectControl } = wp.components;
const { Fragment, useState, useEffect, useRef } = wp.element;
const { useSelect } = wp.data;
const { __, sprintf } = wp.i18n;

// Shared reusable controls (loaded by functions.php via Controls.jsx)
const { DeviceBadge, RespLabel, RangeUnitField, useResponsiveAttributes } = window.SNNControls;

/* ═══════════════════════════════════════════════
   ICON BLOCK
   ═══════════════════════════════════════════════ */

registerBlockType('snn/icon', {
    edit: function (props) {
        const { attributes, setAttributes } = props;
        const { iconType, iconName, iconPrefix, customSvg, customImageId, customImageUrl, customImageAlt, size, color, customCSS } = attributes;

        // ── Responsive attributes ──
        const { activeDevice, getVal, setVal, inheritVal } =
            useResponsiveAttributes(attributes, setAttributes);

        // ── Icon picker state ──
        const [isModalOpen, setIsModalOpen] = useState(false);
        const [searchTerm, setSearchTerm] = useState('');
        const [gridReady, setGridReady] = useState(false);
        const rafRef = useRef(null);

        // All icons from the global injected by block.php
        const allIcons = window.snnFAIcons || [];

        // Exclude single-character / text-glyph icons (e.g. "0","1","a","b"…)
        // from the picker grid — they render as styled letters/numbers, not
        // meaningful graphical icons and clutter the top of the list.
        const displayIcons = allIcons.filter(icon => icon.name && icon.name.length > 1);

        // Defer icon grid rendering so the modal backdrop paints solid first.
        // Without this, the first open renders ~1999 icon buttons synchronously
        // and the browser's initial composite appears semi-transparent.
        useEffect(() => {
            if (isModalOpen) {
                setGridReady(false);
                rafRef.current = requestAnimationFrame(() => {
                    // Double rAF ensures the modal's backdrop has composited
                    rafRef.current = requestAnimationFrame(() => {
                        setGridReady(true);
                    });
                });
            } else {
                setGridReady(false);
                if (rafRef.current) {
                    cancelAnimationFrame(rafRef.current);
                    rafRef.current = null;
                }
            }
            return () => {
                if (rafRef.current) {
                    cancelAnimationFrame(rafRef.current);
                    rafRef.current = null;
                }
            };
        }, [isModalOpen]);

        // Use the saved iconPrefix attribute; fall back to lookup for legacy
        // blocks that were saved before the prefix was stored.
        const getIconStyle = (name) => {
            if (iconPrefix) return iconPrefix;
            if (!name) return 'fa-solid';
            const clean = name.replace(/^fa-/, '');
            const icon = allIcons.find(i => i.name === clean);
            if (icon) {
                return icon.prefix === 'brands' ? 'fa-brands'
                     : icon.prefix === 'regular' ? 'fa-regular'
                     : 'fa-solid';
            }
            return 'fa-solid';
        };

        // Filter + sort by search term (with relevance ranking)
        const filteredIcons = (() => {
            const q = (searchTerm || '').trim();
            if (!q) return displayIcons;

            const lowerQ = q.toLowerCase();
            const results = displayIcons.filter(icon =>
                icon.name.toLowerCase().includes(lowerQ)
            );

            // Relevance sort: exact match → starts-with → contains → rest
            results.sort((a, b) => {
                const na = a.name.toLowerCase();
                const nb = b.name.toLowerCase();
                const scoreA = na === lowerQ ? 0 : na.startsWith(lowerQ) ? 1 : 2;
                const scoreB = nb === lowerQ ? 0 : nb.startsWith(lowerQ) ? 1 : 2;
                if (scoreA !== scoreB) return scoreA - scoreB;
                return na.localeCompare(nb);
            });

            return results;
        })();

        // ── Theme colors ──
        const themeColors = useSelect(select => {
            const settings = select('core/editor')?.getEditorSettings();
            const palette = settings?.__experimentalFeatures?.color?.palette?.theme ||
                settings?.__experimentalFeatures?.color?.palette?.default ||
                settings?.colors || [];
            return palette.map(c => ({ name: c.name, color: c.color }));
        }, []);

        // ── Preview values (inheritance cascade) ──
        const previewSize = inheritVal('size') || '48';
        const previewColor = inheritVal('color');

        // ── Editor-unique class for custom CSS live preview ──
        const editorClass = 'snn-ie-' + props.clientId.substring(0, 8);
        const editorSelector = '.' + editorClass;

        useEffect(() => {
            const styleId = 'snn-css-' + props.clientId;
            const raw = attributes.customCSS || '';
            // Gutenberg renders blocks inside an iframe — target it directly
            const iframe = document.querySelector('iframe[name="editor-canvas"]');
            const doc = iframe && iframe.contentDocument ? iframe.contentDocument : document;
            let styleEl = doc.getElementById(styleId);
            if (!styleEl) {
                styleEl = doc.createElement('style');
                styleEl.id = styleId;
                doc.head.appendChild(styleEl);
            }
            if (raw.trim()) {
                styleEl.textContent = raw.includes('selector')
                    ? raw.replace(/selector/g, editorSelector)
                    : editorSelector + ' {\n' + raw + '\n}';
            } else {
                styleEl.textContent = '';
            }
            return () => {
                const el = doc.getElementById(styleId);
                if (el) el.remove();
            };
        }, [attributes.customCSS, editorSelector, props.clientId]);

        // ── Block props ──
        const blockProps = useBlockProps({
            className: 'snn-icon ' + editorClass,
            style: {
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                padding: '20px',
                minHeight: '80px',
            },
        });

        return (
            <Fragment>
                <InspectorControls>
                    {/* ═══════ ICON SETTINGS ═══════ */}
                    <PanelBody title={__('Icon Settings', 'snn')} initialOpen={true}>
                        <div style={{ fontSize: '14px', fontWeight: 500, color: '#1e1e1e', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <span>{__('Editing:', 'snn')}</span>
                            <DeviceBadge device={activeDevice} />
                        </div>

                        {/* Icon Type Toggle */}
                        <SelectControl
                            label={__('Icon Source', 'snn')}
                            value={iconType || 'icon-library'}
                            options={[
                                { label: __('Icon Library', 'snn'), value: 'icon-library' },
                                { label: __('Custom SVG / Image', 'snn'), value: 'custom' },
                            ]}
                            onChange={val => setAttributes({ iconType: val })}
                        />

                        <hr style={{ margin: '12px 0', border: 'none', borderTop: '1px solid #e0e0e0' }} />

                        {/* ── Icon Library Mode ── */}
                        {(iconType === 'icon-library' || !iconType) && (
                            <Fragment>
                                {/* Icon Picker Button */}
                                <BaseControl label={__('Select Icon', 'snn')}>
                                    <Button
                                        variant="secondary"
                                        onClick={() => setIsModalOpen(true)}
                                        style={{
                                            width: '100%',
                                            justifyContent: 'center',
                                            gap: '8px',
                                            padding: '10px',
                                            height: 'auto',
                                        }}
                                    >
                                        {iconName ? (
                                            <span>
                                                <i className={(iconPrefix || getIconStyle(iconName)) + ' ' + iconName}
                                                   style={{ fontSize: '20px', verticalAlign: 'middle', marginRight: '8px' }}
                                                ></i>
                                                {iconName.replace('fa-', '').replace(/-/g, ' ')}
                                                {iconPrefix && iconPrefix !== 'fa-solid' ? (
                                                    <span style={{ fontSize: '14px', color: '#999', marginLeft: '4px' }}>({iconPrefix.replace('fa-', '')})</span>
                                                ) : null}
                                            </span>
                                        ) : (
                                            __('Choose Icon…', 'snn')
                                        )}
                                    </Button>
                                </BaseControl>

                                {/* Remove icon button */}
                                {iconName && (
                                    <Button
                                        variant="link"
                                        onClick={() => setAttributes({ iconName: '' })}
                                        style={{ color: '#cc1818', fontSize: '14px', padding: '0', marginTop: '4px' }}
                                    >
                                        {__('Remove Icon', 'snn')}
                                    </Button>
                                )}
                            </Fragment>
                        )}

                        {/* ── Custom SVG / Image Mode ── */}
                        {iconType === 'custom' && (
                            <Fragment>
                                {/* SVG Code Input */}
                                <TextareaControl
                                    label={__('SVG Code', 'snn')}
                                    help={__('Paste raw SVG markup here. Takes priority over image upload.', 'snn')}
                                    value={customSvg || ''}
                                    onChange={val => setAttributes({ customSvg: val })}
                                    rows={6}
                                    style={{ fontFamily: 'monospace', fontSize: '14px' }}
                                />

                                <hr style={{ margin: '16px 0', border: 'none', borderTop: '1px solid #e0e0e0' }} />

                                {/* Image Upload */}
                                <BaseControl label={__('Or Upload an Image', 'snn')}>
                                    <MediaUploadCheck>
                                        <MediaUpload
                                            onSelect={media => {
                                                setAttributes({
                                                    customImageId: media.id,
                                                    customImageUrl: media.url,
                                                    customImageAlt: media.alt || '',
                                                });
                                            }}
                                            allowedTypes={['image']}
                                            value={customImageId}
                                            render={({ open }) => (
                                                <Fragment>
                                                    {customImageUrl ? (
                                                        <div style={{ position: 'relative', marginBottom: '8px' }}>
                                                            <img
                                                                src={customImageUrl}
                                                                alt={customImageAlt || ''}
                                                                style={{
                                                                    maxWidth: '100%',
                                                                    maxHeight: '120px',
                                                                    display: 'block',
                                                                    borderRadius: '4px',
                                                                    border: '1px solid #ddd',
                                                                }}
                                                            />
                                                        </div>
                                                    ) : null}
                                                    <div style={{ display: 'flex', gap: '8px' }}>
                                                        <Button
                                                            variant="secondary"
                                                            onClick={open}
                                                            style={{ flex: 1 }}
                                                        >
                                                            {customImageUrl ? __('Replace Image', 'snn') : __('Choose Image', 'snn')}
                                                        </Button>
                                                        {customImageUrl && (
                                                            <Button
                                                                variant="link"
                                                                onClick={() => setAttributes({
                                                                    customImageId: 0,
                                                                    customImageUrl: '',
                                                                    customImageAlt: '',
                                                                })}
                                                                style={{ color: '#cc1818', fontSize: '14px' }}
                                                            >
                                                                {__('Remove', 'snn')}
                                                            </Button>
                                                        )}
                                                    </div>
                                                </Fragment>
                                            )}
                                        />
                                    </MediaUploadCheck>
                                </BaseControl>
                            </Fragment>
                        )}

                        <hr style={{ margin: '16px 0', border: 'none', borderTop: '1px solid #e0e0e0' }} />

                        {/* Size */}
                        <RespLabel label={__('Size', 'snn')} device={activeDevice} />
                        <RangeUnitField
                            label=""
                            value={getVal('size') || '48'}
                            onChange={v => setVal('size', v)}
                            min={0} max={200} step={1}
                        />

                        <hr style={{ margin: '16px 0', border: 'none', borderTop: '1px solid #e0e0e0' }} />

                        {/* Color */}
                        <RespLabel label={__('Color', 'snn')} device={activeDevice} />
                        <ColorPalette
                            colors={themeColors}
                            value={getVal('color')}
                            onChange={v => setVal('color', v || '')}
                            clearable
                        />
                    </PanelBody>

                    {/* ═══════ CUSTOM CSS ═══════ */}
                    <PanelBody title={__('Custom CSS', 'snn')} initialOpen={false}>
                        <TextareaControl
                            label={__('Custom CSS', 'snn')}
                            help={__('Use "selector" to target this block, e.g. selector { color: red; } or selector:hover { ... }', 'snn')}
                            value={customCSS || ''}
                            onChange={val => setAttributes({ customCSS: val })}
                            rows={8}
                        />
                    </PanelBody>
                </InspectorControls>

                {/* ═══════ ICON PICKER MODAL ═══════ */}
                {isModalOpen && (
                    <Modal
                        title={__('Select an Icon', 'snn')}
                        onRequestClose={() => {
                            setIsModalOpen(false);
                            setSearchTerm('');
                        }}
                        style={{ width: '90vw', maxWidth: '820px' }}
                    >
                        <SearchControl
                            placeholder={__('Search icons… (e.g. arrow, heart, star)', 'snn')}
                            value={searchTerm}
                            onChange={setSearchTerm}
                        />

                        {gridReady ? (
                            filteredIcons.length > 0 ? (
                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(auto-fill, minmax(44px, 1fr))',
                                    gap: '4px',
                                    maxHeight: '420px',
                                    overflowY: 'auto',
                                    marginTop: '12px',
                                    padding: '4px',
                                }}>
                                    {filteredIcons.map(icon => {
                                        const fullName = 'fa-' + icon.name;
                                        const style = icon.prefix === 'brands' ? 'fa-brands' : icon.prefix === 'regular' ? 'fa-regular' : 'fa-solid';
                                        const isActive = iconName === fullName && iconPrefix === style;
                                        return (
                                            <button
                                                key={icon.prefix + '--' + icon.name}
                                                onClick={() => {
                                                    setAttributes({ iconName: fullName, iconPrefix: style });
                                                    setIsModalOpen(false);
                                                    setSearchTerm('');
                                                }}
                                                title={(icon.prefix === 'regular' ? '(regular) ' : icon.prefix === 'brands' ? '(brands) ' : '') + icon.name.replace(/-/g, ' ')}
                                                style={{
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    width: '44px',
                                                    height: '44px',
                                                    border: isActive ? '2px solid #3858e9' : '1px solid #ddd',
                                                    borderRadius: '4px',
                                                    background: isActive ? '#f0f6ff' : '#fff',
                                                    cursor: 'pointer',
                                                    fontSize: '24px',
                                                    color: '#333',
                                                    padding: 0,
                                                    transition: 'all 0.1s',
                                                }}
                                            >
                                                <i className={style + ' ' + fullName}></i>
                                            </button>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    height: '200px',
                                    color: '#999',
                                    fontSize: '14px',
                                }}>
                                    <span style={{ fontSize: '36px', opacity: 0.4 }}>🔍</span>
                                    <span>{__('No icons match your search.', 'snn')}</span>
                                    <span style={{ fontSize: '14px' }}>
                                        {__('Try a different term (e.g. arrow, heart, star).', 'snn')}
                                    </span>
                                </div>
                            )
                        ) : (
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                height: '200px',
                                color: '#999',
                                fontSize: '14px',
                            }}>
                                {__('Loading icons…', 'snn')}
                            </div>
                        )}

                        {gridReady && filteredIcons.length > 0 && (
                            <p style={{
                                textAlign: 'center',
                                marginTop: '12px',
                                color: '#757575',
                                fontSize: '14px',
                            }}>
                                {searchTerm.trim()
                                    ? sprintf(
                                        /* translators: 1: number of matching icons, 2: total display icons */
                                        __('%1$d of %2$d icons match', 'snn'),
                                        filteredIcons.length,
                                        displayIcons.length
                                    )
                                    : sprintf(
                                        /* translators: %d: total number of icons */
                                        __('%d icons available', 'snn'),
                                        displayIcons.length
                                    )
                                }
                            </p>
                        )}
                    </Modal>
                )}

                {/* ═══════ EDITOR PREVIEW ═══════ */}
                <div {...blockProps}>
                    {(() => {
                        // Custom SVG / Image mode
                        if (iconType === 'custom') {
                            if (customSvg) {
                                return (
                                    <span
                                        dangerouslySetInnerHTML={{ __html: customSvg }}
                                        style={{
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            width: previewSize + 'px',
                                            height: previewSize + 'px',
                                            color: previewColor || undefined,
                                            lineHeight: 1,
                                        }}
                                    />
                                );
                            }
                            if (customImageUrl) {
                                return (
                                    <img
                                        src={customImageUrl}
                                        alt={customImageAlt || ''}
                                        style={{
                                            width: previewSize + 'px',
                                            height: previewSize + 'px',
                                            objectFit: 'contain',
                                            lineHeight: 1,
                                        }}
                                    />
                                );
                            }
                            return (
                                <span style={{ color: '#aaa', fontStyle: 'italic', fontSize: '14px' }}>
                                    {__('Add an SVG or image →', 'snn')}
                                </span>
                            );
                        }

                        // Icon Library mode
                        if (iconName) {
                            return (
                                <i className={(iconPrefix || getIconStyle(iconName)) + ' ' + iconName} style={{
                                    fontSize: previewSize + 'px',
                                    color: previewColor || undefined,
                                    lineHeight: 1,
                                }}></i>
                            );
                        }
                        return (
                            <span style={{ color: '#aaa', fontStyle: 'italic', fontSize: '14px' }}>
                                {__('Click to choose an icon →', 'snn')}
                            </span>
                        );
                    })()}
                </div>
            </Fragment>
        );
    },

    save: function () {
        return null; /* rendered server-side by PHP */
    },
});
