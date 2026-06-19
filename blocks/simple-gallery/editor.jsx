const { registerBlockType } = wp.blocks;
const { InspectorControls, useBlockProps, MediaUpload, MediaUploadCheck } = wp.blockEditor;
const { PanelBody, Button, TextareaControl, RangeControl, SelectControl, ToggleControl, __experimentalToggleGroupControl, __experimentalToggleGroupControlOption } = wp.components;
const { Fragment } = wp.element;
const { useSelect } = wp.data;
const { __, sprintf } = wp.i18n;

/* ─── Device badge ─── */
const DeviceBadge = ({ device }) => (
    <span style={{
        display: 'inline-block', fontSize: '10px', fontWeight: 600,
        textTransform: 'uppercase', letterSpacing: '0.5px',
        background: device === 'desktop' ? '#3858e9' : device === 'tablet' ? '#7b5cf0' : '#f59e0b',
        color: '#fff', padding: '2px 6px', borderRadius: '3px', marginLeft: '6px', verticalAlign: 'middle',
    }}>{device}</span>
);

/* ─── ToggleGroupControl with SelectControl fallback ─── */
const ToggleField = ({ label, value, options, onChange }) => {
    const hasToggle = typeof __experimentalToggleGroupControl !== 'undefined';
    if (hasToggle) {
        return (
            <div style={{ marginBottom: '14px' }}>
                <label style={{ fontSize: '11px', fontWeight: 500, display: 'block', marginBottom: '4px', color: '#1e1e1e' }}>{label}</label>
                <__experimentalToggleGroupControl value={value} onChange={onChange} isBlock __next40pxDefaultSize={true} __nextHasNoMarginBottom={true}>
                    {options.map(opt => (
                        <__experimentalToggleGroupControlOption key={opt.value} label={opt.label} value={opt.value} />
                    ))}
                </__experimentalToggleGroupControl>
            </div>
        );
    }
    return <SelectControl label={label} value={value} options={options} onChange={onChange} />;
};

/* ─── Range slider + smart text input ─── */
const RangeUnitField = ({ label, value, onChange, min = 0, max = 500, step = 1 }) => {
    const strVal = String(value || '');
    const match = strVal.match(/^(-?[\d.]+)(.*)$/);
    const numVal = match ? parseFloat(match[1]) : '';
    const unitVal = match ? match[2] : '';
    const isPureNum = match && !match[2];
    const handleSlider = (v) => onChange(String(v) + (isPureNum ? '' : unitVal));
    return (
        <div style={{ marginBottom: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                <span style={{ fontSize: '11px', fontWeight: 500, color: '#1e1e1e' }}>{label}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                    <input type="text" value={strVal} onChange={e => onChange(e.target.value)} placeholder="0"
                        style={{ width: '70px', padding: '2px 6px', fontSize: '11px', fontFamily: 'monospace', border: '1px solid #ddd', borderRadius: '2px', textAlign: 'right' }} />
                    {isPureNum && strVal !== '' && <span style={{ fontSize: '10px', color: '#999', fontWeight: 500 }}>px</span>}
                </div>
            </div>
            {(numVal !== '' || strVal === '') && (
                <RangeControl value={numVal !== '' ? numVal : 0} onChange={handleSlider}
                    min={min} max={max} step={step} withInputField={false}
                    __next40pxDefaultSize={true} __nextHasNoMarginBottom={true} />
            )}
        </div>
    );
};

/* ═══════════════════════════════════════════════
   SIMPLE GALLERY BLOCK
   ═══════════════════════════════════════════════ */

registerBlockType('snn/simple-gallery', {
    edit: function (props) {
        const { attributes, setAttributes } = props;
        const { images, enableLightbox } = attributes;

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
        const inheritVal = (attr, fallback) => {
            const val = attributes[attr];
            if (!val || typeof val !== 'object') return fallback || '';
            if (val[activeDevice]) return val[activeDevice];
            if (activeDevice === 'mobile' && val.tablet) return val.tablet;
            if (val.desktop) return val.desktop;
            return fallback || '';
        };

        // ── Options ──
        const aspectOptions = [
            { label: '1:1', value: '1/1' },
            { label: '4:3', value: '4/3' },
            { label: '3:2', value: '3/2' },
            { label: '16:9', value: '16/9' },
            { label: '2:3', value: '2/3' },
        ];

        // ── Media handlers ──
        const onSelectImages = (media) => {
            const newImages = media.map((item) => ({
                id: item.id,
                url: item.url,
                alt: item.alt || '',
                caption: item.caption || '',
            }));
            setAttributes({ images: newImages });
        };

        const removeImage = (index) => {
            const newImages = [...images];
            newImages.splice(index, 1);
            setAttributes({ images: newImages });
        };

        // ── Preview styles with inheritance ──
        const invColumns = inheritVal('columns', '3');
        const invGap = inheritVal('gap', '16');
        const invRatio = inheritVal('aspectRatio', '4/3');

        const blockProps = useBlockProps({
            className: 'snn-simple-gallery' + (enableLightbox ? ' has-lightbox' : ''),
            style: {
                '--snn-gallery-columns': invColumns,
                '--snn-gallery-gap': invGap,
                '--snn-gallery-aspect-ratio': invRatio,
            },
        });

        return (
            <Fragment>
                <InspectorControls>
                    <PanelBody title={__('Gallery Settings', 'snn')} initialOpen={true}>
                        <div style={{ fontSize: '11px', color: '#757575', marginBottom: '8px', fontStyle: 'italic' }}>
                            {__('Editing: ', 'snn')}<strong style={{ textTransform: 'capitalize' }}>{activeDevice}</strong> <DeviceBadge device={activeDevice} />
                        </div>

                        <MediaUploadCheck>
                            <MediaUpload
                                onSelect={onSelectImages}
                                allowedTypes={['image']}
                                multiple={true}
                                gallery={true}
                                value={images.map((img) => img.id)}
                                render={({ open }) => (
                                    <div style={{ marginBottom: '16px' }}>
                                        <Button variant="primary" onClick={open} style={{ width: '100%', justifyContent: 'center' }}>
                                            {images.length > 0 ? __('Edit Gallery', 'snn') : __('Select Images', 'snn')}
                                        </Button>
                                        {images.length > 0 && (
                                            <p style={{ margin: '8px 0 0', color: '#757575', fontSize: '12px' }}>
                                                {sprintf(__('%d image(s) selected', 'snn'), images.length)}
                                            </p>
                                        )}
                                    </div>
                                )}
                            />
                        </MediaUploadCheck>

                        <RangeUnitField
                            label={__('Columns', 'snn')}
                            value={getVal('columns')}
                            onChange={v => setVal('columns', v)}
                            min={1} max={8} step={1}
                        />

                        <RangeUnitField
                            label={__('Gap', 'snn')}
                            value={getVal('gap')}
                            onChange={v => setVal('gap', v)}
                            min={0} max={80} step={2}
                        />

                        <ToggleField
                            label={__('Aspect Ratio', 'snn')}
                            value={getVal('aspectRatio')}
                            options={aspectOptions}
                            onChange={v => setVal('aspectRatio', v)}
                        />

                        <ToggleControl
                            label={__('Enable Lightbox', 'snn')}
                            help={enableLightbox
                                ? __('Clicking an image opens it in a fullscreen lightbox.', 'snn')
                                : __('Turn on to enable a fullscreen lightbox with navigation.', 'snn')}
                            checked={enableLightbox}
                            onChange={(val) => setAttributes({ enableLightbox: val })}
                        />
                    </PanelBody>

                    {/* ═══════ CUSTOM CSS ═══════ */}
                    <PanelBody title={__('Custom CSS', 'snn')} initialOpen={false}>
                        <TextareaControl
                            label={__('Custom CSS', 'snn')}
                            help={__('Write custom CSS rules. The selector .snn-simple-gallery will target this block.', 'snn')}
                            value={attributes.customCSS || ''}
                            onChange={val => setAttributes({ customCSS: val })}
                            rows={8}
                        />
                    </PanelBody>
                </InspectorControls>

                <div {...blockProps}>
                    {images.length === 0 ? (
                        <div className="snn-gallery-placeholder">
                            <MediaUploadCheck>
                                <MediaUpload
                                    onSelect={onSelectImages}
                                    allowedTypes={['image']}
                                    multiple={true}
                                    gallery={true}
                                    value={[]}
                                    render={({ open }) => (
                                        <Button
                                            variant="secondary"
                                            onClick={open}
                                            style={{
                                                width: '100%', justifyContent: 'center', minHeight: '200px',
                                                display: 'flex', flexDirection: 'column', alignItems: 'center',
                                                background: '#f0f0f0', border: '2px dashed #ccc', borderRadius: '4px', cursor: 'pointer',
                                            }}
                                        >
                                            <span style={{ fontSize: '40px', display: 'block', marginBottom: '8px' }}>🖼️</span>
                                            <span>{__('Click to select gallery images', 'snn')}</span>
                                        </Button>
                                    )}
                                />
                            </MediaUploadCheck>
                        </div>
                    ) : (
                        <div className="snn-gallery-grid">
                            {images.map((image, index) => (
                                <div className="snn-gallery-item" key={image.id || index}>
                                    <img src={image.url} alt={image.alt || ''} />
                                    <Button
                                        className="snn-gallery-remove-btn"
                                        onClick={() => removeImage(index)}
                                        icon={<span style={{ fontSize: '16px', lineHeight: '1' }}>✕</span>}
                                        label={__('Remove Image', 'snn')}
                                        style={{
                                            position: 'absolute', top: '4px', right: '4px',
                                            background: 'rgba(0,0,0,0.6)', color: '#fff', border: 'none',
                                            borderRadius: '50%', width: '28px', height: '28px', cursor: 'pointer',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            padding: '0', minWidth: '28px',
                                        }}
                                    />
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </Fragment>
        );
    },

    save: function () {
        return null;
    },
});
