const { registerBlockType } = wp.blocks;
const { InspectorControls, useBlockProps, MediaUpload, MediaUploadCheck } = wp.blockEditor;
const { PanelBody, Button, TextareaControl, ToggleControl } = wp.components;
const { Fragment } = wp.element;
const { __, sprintf } = wp.i18n;

// Shared reusable controls (loaded by functions.php via Controls.jsx)
const { DeviceBadge, ToggleField, RangeUnitField, useResponsiveAttributes } = window.SNNControls;

/* ═══════════════════════════════════════════════
   SIMPLE GALLERY BLOCK
   ═══════════════════════════════════════════════ */

registerBlockType('snn/simple-gallery', {
    edit: function (props) {
        const { attributes, setAttributes } = props;
        const { images, enableLightbox } = attributes;

        // ── Responsive attributes ──
        const { activeDevice, getVal, setVal, inheritVal } =
            useResponsiveAttributes(attributes, setAttributes);

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
                        <div style={{ fontSize: '11px', color: '#1e1e1e', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <span>{__('Editing:', 'snn')}</span>
                            <DeviceBadge device={activeDevice} />
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
