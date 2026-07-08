const { registerBlockType } = wp.blocks;
const { InspectorControls, useBlockProps, MediaUpload, MediaUploadCheck } = wp.blockEditor;
const { PanelBody, Button, TextareaControl, ToggleControl } = wp.components;
const { Fragment } = wp.element;
const { __, sprintf } = wp.i18n;

const {
    DeviceSwitcher, CompactSection, ColorRow,
    SpacingInput, BorderControl, BorderRadiusControl,
    ShadowBuilder, ToggleField, RangeUnitField,
    useResponsiveAttributes,
} = window.SNNControls;

/* ═══════════════════════════════════════════════
   SIMPLE GALLERY BLOCK — all custom controls
   ═══════════════════════════════════════════════ */

registerBlockType('snn/simple-gallery', {
    edit: function (props) {
        const { attributes, setAttributes } = props;
        const { images, enableLightbox } = attributes;

        const {
            activeDevice, getVal, setVal, inheritVal,
            getSides, setSides, inheritSides,
            getBorderWidth, setBorderWidth,
            getBorderRadius, setBorderRadius,
            getArr, setArr, inheritArr,
        } = useResponsiveAttributes(attributes, setAttributes);
        const d = activeDevice;

        const aspectOptions = [
            { label: '1:1', value: '1/1' }, { label: '4:3', value: '4/3' },
            { label: '3:2', value: '3/2' }, { label: '16:9', value: '16/9' }, { label: '2:3', value: '2/3' },
        ];

        const onSelectImages = (media) => {
            const newImages = media.map((item) => ({
                id: item.id, url: item.url, alt: item.alt || '', caption: item.caption || '',
            }));
            setAttributes({ images: newImages });
        };

        const removeImage = (index) => {
            const newImages = [...images];
            newImages.splice(index, 1);
            setAttributes({ images: newImages });
        };

        // ── Preview styles ──
        const invColumns = inheritVal('columns', '3');
        const invGap = inheritVal('gap', '16');
        const invRatio = inheritVal('aspectRatio', '4/3');
        const invBg = inheritVal('bgColor');
        const pad = inheritSides('padding');
        const mar = inheritSides('margin');

        const previewStyles = {
            '--snn-gallery-columns': invColumns,
            '--snn-gallery-gap': invGap + 'px',
            '--snn-gallery-aspect-ratio': invRatio,
        };
        if (invBg) previewStyles.backgroundColor = invBg;
        if (pad.top) previewStyles.paddingTop = pad.top;
        if (pad.right) previewStyles.paddingRight = pad.right;
        if (pad.bottom) previewStyles.paddingBottom = pad.bottom;
        if (pad.left) previewStyles.paddingLeft = pad.left;
        if (mar.top) previewStyles.marginTop = mar.top;
        if (mar.right) previewStyles.marginRight = mar.right;
        if (mar.bottom) previewStyles.marginBottom = mar.bottom;
        if (mar.left) previewStyles.marginLeft = mar.left;
        const bw = getBorderWidth();
        const bStyle = attributes.border?.style || (bw.top||bw.right||bw.bottom||bw.left ? 'solid' : '');
        if (bStyle && bStyle !== 'none') {
            previewStyles.borderStyle = bStyle;
            if (bw.top) previewStyles.borderTopWidth = bw.top;
            if (bw.right) previewStyles.borderRightWidth = bw.right;
            if (bw.bottom) previewStyles.borderBottomWidth = bw.bottom;
            if (bw.left) previewStyles.borderLeftWidth = bw.left;
            if (attributes.border?.color) previewStyles.borderColor = attributes.border.color;
        }
        const br = getBorderRadius();
        if (br.topLeft) previewStyles.borderTopLeftRadius = br.topLeft;
        if (br.topRight) previewStyles.borderTopRightRadius = br.topRight;
        if (br.bottomRight) previewStyles.borderBottomRightRadius = br.bottomRight;
        if (br.bottomLeft) previewStyles.borderBottomLeftRadius = br.bottomLeft;
        const shadowArr = inheritArr('boxShadow');
        if (shadowArr.length > 0) {
            previewStyles.boxShadow = shadowArr.map(s => {
                const inset = (s.type||'drop')==='inner'?'inset ':'';
                return `${inset}${s.x||'0'} ${s.y||'0'} ${s.blur||'0'} ${s.spread||'0'} ${s.color||'rgba(0,0,0,0.2)'}`;
            }).join(', ');
        }

        const blockProps = useBlockProps({
            className: 'snn-simple-gallery' + (enableLightbox ? ' has-lightbox' : ''),
            style: previewStyles,
        });

        const tinyInp = { width:'100%',padding:'4px 6px',fontSize:'14px',fontFamily:'monospace',border:'1px solid #ddd',borderRadius:'3px',boxSizing:'border-box',lineHeight:'20px' };

        return (
            <Fragment>
                <InspectorControls>
                    <div style={{ padding: '0 10px' }}>
                    <DeviceSwitcher />

                    {/* ── IMAGES ── */}
                    <CompactSection title={__('Images','snn')} />
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
                                        {images.length > 0 ? __('Edit Gallery','snn') : __('Select Images','snn')}
                                    </Button>
                                    {images.length > 0 && (
                                        <p style={{ margin: '8px 0 0', color: '#757575', fontSize: '14px' }}>
                                            {sprintf(__('%d image(s) selected','snn'), images.length)}
                                        </p>
                                    )}
                                </div>
                            )}
                        />
                    </MediaUploadCheck>

                    {/* ── GRID ── */}
                    <CompactSection title={__('Grid','snn')} />
                    <RangeUnitField label={__('Columns','snn')} value={getVal('columns')}
                        onChange={v => setVal('columns',v)} min={1} max={8} step={1} />
                    <RangeUnitField label={__('Gap','snn')} value={getVal('gap')}
                        onChange={v => setVal('gap',v)} min={0} max={80} step={2} />
                    <ToggleField label={__('Aspect Ratio','snn')} value={getVal('aspectRatio')}
                        options={aspectOptions} onChange={v => setVal('aspectRatio',v)} />

                    {/* ── LIGHTBOX ── */}
                    <div style={{ marginBottom:'14px' }}>
                        <ToggleControl
                            label={__('Enable Lightbox','snn')}
                            help={enableLightbox ? __('Clicking opens a fullscreen lightbox.','snn') : __('Turn on for fullscreen lightbox with navigation.','snn')}
                            checked={enableLightbox}
                            onChange={(val) => setAttributes({ enableLightbox: val })} />
                    </div>

                    {/* ── STYLE ── */}
                    <CompactSection title={__('Block Style','snn')} />
                    <ColorRow label={__('BG','snn')} value={getVal('bgColor')} onChange={v => setVal('bgColor',v)} />
                    <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:'6px',marginBottom:'6px' }}>
                        <div><SpacingInput values={getSides('padding')} onChange={v => setSides('padding',v)} device={d} /></div>
                        <div><SpacingInput values={getSides('margin')} onChange={v => setSides('margin',v)} device={d} /></div>
                    </div>

                    <CompactSection title={__('Border & Shadow','snn')} />
                    <BorderControl width={getBorderWidth()} style={attributes.border?.style||''} color={attributes.border?.color||''}
                        onWidthChange={v => setBorderWidth(v)} onStyleChange={v => setAttributes({border:{...(attributes.border||{}),style:v}})}
                        onColorChange={v => setAttributes({border:{...(attributes.border||{}),color:v}})} device={d} />
                    <BorderRadiusControl values={getBorderRadius()} onChange={v => setBorderRadius(v)} device={d} />
                    <ShadowBuilder shadows={getArr('boxShadow')} onChange={v => setArr('boxShadow',v)} device={d} />

                    {/* ── CUSTOM CSS ── */}
                    <PanelBody title={__('Custom CSS','snn')} initialOpen={false}>
                        <TextareaControl
                            label={__('Custom CSS','snn')}
                            help={__('Use "selector" to target this block, e.g. selector { color: red; } or selector:hover { ... }','snn')}
                            value={attributes.customCSS || ''}
                            onChange={val => setAttributes({ customCSS: val })}
                            rows={8} />
                    </PanelBody>
                    </div>
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
