const { registerBlockType } = wp.blocks;
const { InspectorControls, useBlockProps } = wp.blockEditor;
const { PanelBody, Button, Modal, SearchControl, ColorPalette, RangeControl, BaseControl, TextareaControl } = wp.components;
const { Fragment, useState, useEffect, useRef } = wp.element;
const { useSelect } = wp.data;
const { __, sprintf } = wp.i18n;

/* ═══════════════════════════════════════════════
   SHARED HELPERS
   ═══════════════════════════════════════════════ */

/* ─── Device badge ─── */
const DeviceBadge = ({ device }) => (
    <span style={{
        display: 'inline-block', fontSize: '10px', fontWeight: 600,
        textTransform: 'uppercase', letterSpacing: '0.5px',
        background: device === 'desktop' ? '#3858e9' : device === 'tablet' ? '#7b5cf0' : '#f59e0b',
        color: '#fff', padding: '2px 6px', borderRadius: '3px', marginLeft: '6px', verticalAlign: 'middle',
    }}>{device}</span>
);

/* ─── Device-aware label row ─── */
const RespLabel = ({ label, device }) => (
    <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: '4px', fontSize: '11px', fontWeight: 500, color: '#1e1e1e',
    }}>
        <span>{label} <DeviceBadge device={device} /></span>
    </div>
);

/* ─── Size field: slider (0–200) + free-form text input ─── */
const SizeField = ({ label, value, onChange }) => {
    const strVal = String(value || '');
    const numVal = parseFloat(strVal);
    const isValidNum = !isNaN(numVal) && strVal.trim() !== '';

    return (
        <div style={{ marginBottom: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                <span style={{ fontSize: '11px', fontWeight: 500, color: '#1e1e1e' }}>{label}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                    <input
                        type="text"
                        value={strVal}
                        onChange={e => onChange(e.target.value)}
                        placeholder="48"
                        style={{
                            width: '70px', padding: '2px 6px', fontSize: '11px',
                            fontFamily: 'monospace', border: '1px solid #ddd',
                            borderRadius: '2px', textAlign: 'right',
                        }}
                    />
                    {strVal !== '' && (
                        <span style={{ fontSize: '10px', color: '#999', fontWeight: 500 }}>px</span>
                    )}
                </div>
            </div>
            {isValidNum && (
                <RangeControl
                    value={Math.min(numVal, 200)}
                    onChange={v => onChange(String(v))}
                    min={0}
                    max={200}
                    step={1}
                    withInputField={false}
                    __next40pxDefaultSize={true}
                    __nextHasNoMarginBottom={true}
                />
            )}
        </div>
    );
};

/* ═══════════════════════════════════════════════
   ICON BLOCK
   ═══════════════════════════════════════════════ */

registerBlockType('snn/icon', {
    edit: function (props) {
        const { attributes, setAttributes } = props;
        const { iconName, size, color, customCSS } = attributes;

        // ── Device state ──
        const deviceType = useSelect(select => {
            const editorStore = select('core/editor');
            if (editorStore?.getDeviceType) {
                return editorStore.getDeviceType();
            }
            const store = select('core/edit-post') || editorStore;
            const getDevice = store?.__experimentalGetPreviewDeviceType;
            return getDevice ? getDevice() : 'Desktop';
        }, []);
        const activeDevice = (deviceType || 'Desktop').toLowerCase();

        // ── Responsive helpers ──
        const getVal = (attr) => attributes[attr]?.[activeDevice] || '';
        const setVal = (attr, value) => {
            setAttributes({ [attr]: { ...(attributes[attr] || {}), [activeDevice]: value } });
        };
        const inheritVal = (attr) => {
            const val = attributes[attr];
            if (!val || typeof val !== 'object') return '';
            if (val[activeDevice]) return val[activeDevice];
            if (activeDevice === 'mobile' && val.tablet) return val.tablet;
            if (val.desktop) return val.desktop;
            return '';
        };

        // ── Icon picker state ──
        const [isModalOpen, setIsModalOpen] = useState(false);
        const [searchTerm, setSearchTerm] = useState('');
        const [gridReady, setGridReady] = useState(false);
        const rafRef = useRef(null);

        // All icons from the global injected by block.php
        const allIcons = window.snnFAIcons || [];

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

        // Look up the correct FA style class for an icon name
        const getIconStyle = (name) => {
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

        // Filter by search term
        const filteredIcons = searchTerm
            ? allIcons.filter(icon => icon.name.toLowerCase().includes(searchTerm.toLowerCase()))
            : allIcons;

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

        // ── Block props ──
        const blockProps = useBlockProps({
            className: 'snn-icon',
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
                        <div style={{ fontSize: '11px', color: '#757575', marginBottom: '8px', fontStyle: 'italic' }}>
                            {__('Editing: ', 'snn')}<strong style={{ textTransform: 'capitalize' }}>{activeDevice}</strong>
                        </div>

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
                                        <i className={getIconStyle(iconName) + ' ' + iconName}
                                           style={{ fontSize: '20px', verticalAlign: 'middle', marginRight: '8px' }}
                                        ></i>
                                        {iconName.replace('fa-', '').replace(/-/g, ' ')}
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
                                style={{ color: '#cc1818', fontSize: '11px', padding: '0', marginTop: '4px' }}
                            >
                                {__('Remove Icon', 'snn')}
                            </Button>
                        )}

                        <hr style={{ margin: '16px 0', border: 'none', borderTop: '1px solid #e0e0e0' }} />

                        {/* Size */}
                        <RespLabel label={__('Size', 'snn')} device={activeDevice} />
                        <SizeField
                            label=""
                            value={getVal('size') || '48'}
                            onChange={v => setVal('size', v)}
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
                            help={__('Write custom CSS rules. The selector .snn-icon will target this block.', 'snn')}
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
                                    const isActive = iconName === fullName;
                                    return (
                                        <button
                                            key={icon.name}
                                            onClick={() => {
                                                const style = icon.prefix === 'brands' ? 'fa-brands' : icon.prefix === 'regular' ? 'fa-regular' : 'fa-solid';
                                                setAttributes({ iconName: fullName, iconPrefix: style });
                                                setIsModalOpen(false);
                                                setSearchTerm('');
                                            }}
                                            title={icon.name.replace(/-/g, ' ')}
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
                                            <i className={(icon.prefix === 'brands' ? 'fa-brands' : icon.prefix === 'regular' ? 'fa-regular' : 'fa-solid') + ' ' + fullName}></i>
                                        </button>
                                    );
                                })}
                            </div>
                        ) : (
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                height: '200px',
                                color: '#999',
                                fontSize: '13px',
                            }}>
                                {__('Loading icons…', 'snn')}
                            </div>
                        )}

                        {gridReady && (
                            <p style={{
                                textAlign: 'center',
                                marginTop: '12px',
                                color: '#757575',
                                fontSize: '12px',
                            }}>
                                {filteredIcons.length === 1
                                    ? __('1 icon found', 'snn')
                                    : sprintf(__('%d icons found', 'snn'), filteredIcons.length)
                                }
                            </p>
                        )}
                    </Modal>
                )}

                {/* ═══════ EDITOR PREVIEW ═══════ */}
                <div {...blockProps}>
                    {iconName ? (
                        <i className={getIconStyle(iconName) + ' ' + iconName} style={{
                            fontSize: previewSize + 'px',
                            color: previewColor || undefined,
                            lineHeight: 1,
                        }}></i>
                    ) : (
                        <span style={{ color: '#aaa', fontStyle: 'italic', fontSize: '13px' }}>
                            {__('Click to choose an icon →', 'snn')}
                        </span>
                    )}
                </div>
            </Fragment>
        );
    },

    save: function () {
        return null; /* rendered server-side by PHP */
    },
});
