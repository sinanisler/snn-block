const { registerBlockType } = wp.blocks;
const { InspectorControls, useBlockProps, useInnerBlocksProps, InnerBlocks, MediaUpload } = wp.blockEditor;
const { PanelBody, Button, SelectControl, TextControl, TextareaControl, ColorPalette, BaseControl, RangeControl, __experimentalToggleGroupControl, __experimentalToggleGroupControlOption } = wp.components;
const { Fragment } = wp.element;
const { useSelect } = wp.data;
const { __ } = wp.i18n;

/* ═══════════════════════════════════════════════
   SHARED HELPER COMPONENTS
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

/* ─── ToggleGroupControl with SelectControl fallback ─── */
const ToggleField = ({ label, value, options, onChange }) => {
    const hasToggle = typeof __experimentalToggleGroupControl !== 'undefined';

    if (hasToggle) {
        return (
            <div style={{ marginBottom: '14px' }}>
                <label style={{ fontSize: '11px', fontWeight: 500, display: 'block', marginBottom: '4px', color: '#1e1e1e' }}>
                    {label}
                </label>
                <__experimentalToggleGroupControl
                    value={value}
                    onChange={onChange}
                    isBlock
                    __next40pxDefaultSize={true}
                    __nextHasNoMarginBottom={true}
                >
                    {options.filter(o => o.value !== '' || o.label === 'Default').map(opt => (
                        <__experimentalToggleGroupControlOption key={opt.value} label={opt.label} value={opt.value} />
                    ))}
                </__experimentalToggleGroupControl>
            </div>
        );
    }

    return (
        <SelectControl label={label} value={value} options={options} onChange={onChange} />
    );
};

/* ─── Icon Toggle Field (Font Awesome) ─── */
const IconToggleField = ({ label, value, options, onChange }) => {
    return (
        <div style={{ marginBottom: '14px' }}>
            <label style={{ fontSize: '11px', fontWeight: 500, display: 'block', marginBottom: '4px', color: '#1e1e1e' }}>
                {label}
            </label>
            <div style={{ display: 'flex', gap: '2px', flexWrap: 'wrap' }}>
                {options.filter(o => o.value !== '' || o.label === 'Default').map(opt => (
                    <button
                        key={opt.value}
                        onClick={() => onChange(opt.value)}
                        title={opt.label}
                        type="button"
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '32px',
                            height: '32px',
                            border: value === opt.value ? '2px solid #3858e9' : '1px solid #d0d0d0',
                            borderRadius: '4px',
                            background: value === opt.value ? '#f0f6ff' : '#fff',
                            cursor: 'pointer',
                            fontSize: '14px',
                            color: value === opt.value ? '#3858e9' : '#666',
                            padding: 0,
                            transition: 'all 0.1s',
                            boxSizing: 'border-box',
                        }}
                    >
                        {opt.icon ? <i className={opt.icon}></i> : opt.label}
                    </button>
                ))}
            </div>
        </div>
    );
};

/* ─── Padding input (4-side grid) ─── */
const PaddingInput = ({ values, onChange, device }) => {
    const sides = [
        { key: 'top', label: 'T' },
        { key: 'right', label: 'R' },
        { key: 'bottom', label: 'B' },
        { key: 'left', label: 'L' },
    ];
    return (
        <div style={{ marginBottom: '14px' }}>
            <RespLabel label={__('Padding', 'snn')} device={device} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' }}>
                {sides.map(s => (
                    <div key={s.key}>
                        <span style={{ fontSize: '9px', color: '#757575', display: 'block' }}>{s.label}</span>
                        <input
                            type="text"
                            value={values?.[s.key] || ''}
                            onChange={e => onChange({ ...values, [s.key]: e.target.value })}
                            placeholder="0"
                            style={{
                                width: '100%', padding: '4px 6px', fontSize: '12px',
                                border: '1px solid #ddd', borderRadius: '2px', boxSizing: 'border-box',
                            }}
                        />
                    </div>
                ))}
            </div>
        </div>
    );
};

/* ─── Range slider + smart text input (defaults to px) ─── */
const RangeUnitField = ({ label, value, onChange, min = 0, max = 500, step = 1 }) => {
    const strVal = String(value || '');
    const match = strVal.match(/^(-?[\d.]+)(.*)$/);
    const numVal = match ? parseFloat(match[1]) : '';
    const unitVal = match ? match[2] : '';
    const isPureNum = match && !match[2];

    const handleSlider = (v) => {
        onChange(String(v) + (isPureNum ? '' : unitVal));
    };

    return (
        <div style={{ marginBottom: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                <span style={{ fontSize: '11px', fontWeight: 500, color: '#1e1e1e' }}>{label}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                    <input
                        type="text"
                        value={strVal}
                        onChange={e => onChange(e.target.value)}
                        placeholder="0"
                        style={{
                            width: '70px', padding: '2px 6px', fontSize: '11px', fontFamily: 'monospace',
                            border: '1px solid #ddd', borderRadius: '2px', textAlign: 'right',
                        }}
                    />
                    {isPureNum && strVal !== '' && (
                        <span style={{ fontSize: '10px', color: '#999', fontWeight: 500 }}>px</span>
                    )}
                </div>
            </div>
            {(numVal !== '' || strVal === '') && (
                <RangeControl
                    value={numVal !== '' ? numVal : 0}
                    onChange={handleSlider}
                    min={min} max={max} step={step}
                    withInputField={false}
                    __next40pxDefaultSize={true}
                    __nextHasNoMarginBottom={true}
                />
            )}
        </div>
    );
};

/* ═══════════════════════════════════════════════
   SECTION BLOCK
   ═══════════════════════════════════════════════ */

registerBlockType('snn/section', {
    edit: function (props) {
        const { attributes, setAttributes } = props;

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
        const getPad = () => attributes.padding?.[activeDevice] || {};
        const setPad = (obj) => {
            setAttributes({ padding: { ...(attributes.padding || {}), [activeDevice]: obj } });
        };
        // Inherited value: current device → tablet → desktop → ''
        const inheritVal = (attr) => {
            const val = attributes[attr];
            if (!val || typeof val !== 'object') return '';
            if (val[activeDevice]) return val[activeDevice];
            if (activeDevice === 'mobile' && val.tablet) return val.tablet;
            if (val.desktop) return val.desktop;
            return '';
        };
        // Inherited padding
        const inheritPad = () => {
            const pad = attributes.padding;
            if (!pad || typeof pad !== 'object') return {};
            // Try device-specific, then cascade
            const tryDevices = ['mobile', 'tablet', 'desktop'];
            const start = tryDevices.indexOf(activeDevice);
            for (let i = start; i < tryDevices.length; i++) {
                const d = tryDevices[i];
                if (pad[d] && Object.values(pad[d]).some(v => v)) return pad[d];
            }
            return {};
        };

        // ── Preview styles with full inheritance cascade ──
        const previewStyles = {};

        const invBg = inheritVal('bgColor');
        if (invBg) previewStyles.backgroundColor = invBg;
        const invText = inheritVal('textColor');
        if (invText) previewStyles.color = invText;

        const bgImg = attributes.bgImage?.url;
        if (bgImg) {
            previewStyles.backgroundImage = `url(${bgImg})`;
            previewStyles.backgroundSize = attributes.bgSize || 'cover';
            previewStyles.backgroundPosition = attributes.bgPosition || 'center center';
            previewStyles.backgroundRepeat = attributes.bgRepeat || 'no-repeat';
        }

        const disp = inheritVal('display');
        if (disp) previewStyles.display = disp;
        const fd = inheritVal('flexDirection');
        if (fd) previewStyles.flexDirection = fd;
        const fw = inheritVal('flexWrap');
        if (fw) previewStyles.flexWrap = fw;
        const jc = inheritVal('justifyContent');
        if (jc) previewStyles.justifyContent = jc;
        const ai = inheritVal('alignItems');
        if (ai) previewStyles.alignItems = ai;
        const gap = inheritVal('gap');
        if (gap) previewStyles.gap = gap;
        const gc = inheritVal('gridColumns');
        if (gc) previewStyles.gridTemplateColumns = gc;
        const ta = inheritVal('textAlign');
        if (ta) previewStyles.textAlign = ta;
        const mh = inheritVal('minHeight');
        if (mh) previewStyles.minHeight = mh;
        if (attributes.overflow) previewStyles.overflow = attributes.overflow;

        const inPad = inheritPad();
        if (inPad.top) previewStyles.paddingTop = inPad.top;
        if (inPad.right) previewStyles.paddingRight = inPad.right;
        if (inPad.bottom) previewStyles.paddingBottom = inPad.bottom;
        if (inPad.left) previewStyles.paddingLeft = inPad.left;

        // ── Contextual layout (inherits so flex/grid controls show on all devices) ──
        const displayVal = inheritVal('display');
        const isFlex = displayVal === 'flex';
        const isGrid = displayVal === 'grid';

        // ── Options ──
        const displayOptions = [
            { label: __('Default', 'snn'), value: '' },
            { label: __('Flex', 'snn'), value: 'flex' },
            { label: __('Grid', 'snn'), value: 'grid' },
            { label: __('Block', 'snn'), value: 'block' },
        ];
        const flexDirOptions = [
            { label: __('Row', 'snn'), value: 'row', icon: 'fa-solid fa-arrow-right' },
            { label: __('Column', 'snn'), value: 'column', icon: 'fa-solid fa-arrow-down' },
            { label: __('Row Rev', 'snn'), value: 'row-reverse', icon: 'fa-solid fa-arrow-left' },
            { label: __('Col Rev', 'snn'), value: 'column-reverse', icon: 'fa-solid fa-arrow-up' },
        ];
        const wrapOptions = [
            { label: __('Wrap', 'snn'), value: 'wrap', icon: 'fa-solid fa-angles-down' },
            { label: __('Nowrap', 'snn'), value: 'nowrap', icon: 'fa-solid fa-ellipsis' },
            { label: __('Wrap Rev', 'snn'), value: 'wrap-reverse', icon: 'fa-solid fa-angles-up' },
        ];
        const justifyOptions = [
            { label: __('Default', 'snn'), value: '', icon: 'fa-solid fa-circle' },
            { label: __('Start', 'snn'), value: 'flex-start', icon: 'fa-solid fa-align-left' },
            { label: __('Center', 'snn'), value: 'center', icon: 'fa-solid fa-align-center' },
            { label: __('End', 'snn'), value: 'flex-end', icon: 'fa-solid fa-align-right' },
            { label: __('Stretch', 'snn'), value: 'stretch', icon: 'fa-solid fa-arrows-left-right' },
            { label: __('Between', 'snn'), value: 'space-between', icon: 'fa-solid fa-object-ungroup' },
            { label: __('Around', 'snn'), value: 'space-around', icon: 'fa-solid fa-object-group' },
        ];
        const alignOptions = [
            { label: __('Default', 'snn'), value: '', icon: 'fa-solid fa-circle' },
            { label: __('Start', 'snn'), value: 'flex-start', icon: 'fa-solid fa-chevron-up' },
            { label: __('Center', 'snn'), value: 'center', icon: 'fa-solid fa-arrows-up-down' },
            { label: __('End', 'snn'), value: 'flex-end', icon: 'fa-solid fa-chevron-down' },
            { label: __('Stretch', 'snn'), value: 'stretch', icon: 'fa-solid fa-expand' },
            { label: __('Between', 'snn'), value: 'space-between', icon: 'fa-solid fa-object-ungroup' },
            { label: __('Around', 'snn'), value: 'space-around', icon: 'fa-solid fa-object-group' },
        ];
        const textAlignOptions = [
            { label: __('Default', 'snn'), value: '' },
            { label: __('Left', 'snn'), value: 'left' },
            { label: __('Center', 'snn'), value: 'center' },
            { label: __('Right', 'snn'), value: 'right' },
        ];
        const overflowOptions = [
            { label: __('Default', 'snn'), value: '' },
            { label: __('Hidden', 'snn'), value: 'hidden' },
            { label: __('Visible', 'snn'), value: 'visible' },
            { label: __('Auto', 'snn'), value: 'auto' },
            { label: __('Scroll', 'snn'), value: 'scroll' },
        ];

        // ── Theme colors ──
        const themeColors = useSelect(select => {
            const settings = select('core/editor')?.getEditorSettings();
            const palette = settings?.__experimentalFeatures?.color?.palette?.theme ||
                settings?.__experimentalFeatures?.color?.palette?.default ||
                settings?.colors || [];
            return palette.map(c => ({ name: c.name, color: c.color }));
        }, []);

        // ── Block props ──
        const blockProps = useBlockProps({
            className: 'snn-section',
            style: previewStyles,
        });

        const innerBlocksProps = useInnerBlocksProps(blockProps, {
            template: [['snn/container']],
        });

        // ── BG image handler ──
        const onBgImageSelect = (media) => {
            setAttributes({ bgImage: { id: media.id, url: media.url, alt: media.alt || '' } });
        };

        return (
            <Fragment>
                <InspectorControls>
                    {/* ═══════ STYLE ═══════ */}
                    <PanelBody title={__('Style', 'snn')} initialOpen={true}>
                        <div style={{ fontSize: '11px', color: '#757575', marginBottom: '8px', fontStyle: 'italic' }}>
                            {__('Editing: ', 'snn')}<strong style={{ textTransform: 'capitalize' }}>{activeDevice}</strong>
                        </div>

                        {/* Background */}
                        <RespLabel label={__('Background Color', 'snn')} device={activeDevice} />
                        <ColorPalette
                            colors={themeColors}
                            value={getVal('bgColor')}
                            onChange={v => setVal('bgColor', v || '')}
                            clearable
                        />

                        <MediaUpload
                            onSelect={onBgImageSelect}
                            allowedTypes={['image']}
                            value={attributes.bgImage?.id}
                            render={({ open }) => (
                                <div style={{ marginTop: '12px' }}>
                                    <Button variant="secondary" onClick={open} style={{ width: '100%', justifyContent: 'center', marginBottom: '8px' }}>
                                        {attributes.bgImage?.url ? __('Change Image', 'snn') : __('Background Image', 'snn')}
                                    </Button>
                                    {attributes.bgImage?.url && (
                                        <div style={{ marginBottom: '8px' }}>
                                            <img src={attributes.bgImage.url} alt="" style={{ maxWidth: '100%', maxHeight: '80px', objectFit: 'cover', borderRadius: '2px' }} />
                                            <Button
                                                onClick={() => setAttributes({ bgImage: { id: 0, url: '', alt: '' } })}
                                                style={{ display: 'block', marginTop: '4px', color: '#cc1818', fontSize: '11px', padding: '0' }}
                                                variant="link"
                                            >{__('Remove', 'snn')}</Button>
                                        </div>
                                    )}
                                </div>
                            )}
                        />

                        {attributes.bgImage?.url && (
                            <Fragment>
                                <SelectControl label={__('Size', 'snn')} value={attributes.bgSize} options={[
                                    { label: 'Cover', value: 'cover' }, { label: 'Contain', value: 'contain' }, { label: 'Auto', value: 'auto' },
                                ]} onChange={v => setAttributes({ bgSize: v })} />
                                <SelectControl label={__('Position', 'snn')} value={attributes.bgPosition} options={[
                                    { label: 'Center', value: 'center center' }, { label: 'Top', value: 'top center' },
                                    { label: 'Bottom', value: 'bottom center' }, { label: 'Left', value: 'left center' },
                                    { label: 'Right', value: 'right center' },
                                ]} onChange={v => setAttributes({ bgPosition: v })} />
                                <SelectControl label={__('Repeat', 'snn')} value={attributes.bgRepeat} options={[
                                    { label: 'No Repeat', value: 'no-repeat' }, { label: 'Repeat', value: 'repeat' },
                                    { label: 'Repeat X', value: 'repeat-x' }, { label: 'Repeat Y', value: 'repeat-y' },
                                ]} onChange={v => setAttributes({ bgRepeat: v })} />
                            </Fragment>
                        )}

                        <hr style={{ margin: '16px 0', border: 'none', borderTop: '1px solid #e0e0e0' }} />

                        {/* Display / Layout */}
                        <ToggleField label={__('Display', 'snn')} value={displayVal} options={displayOptions} onChange={v => setVal('display', v)} />

                        {isFlex && (
                            <Fragment>
                                <IconToggleField label={__('Direction', 'snn')} value={getVal('flexDirection')} options={flexDirOptions} onChange={v => setVal('flexDirection', v)} />
                                <IconToggleField label={__('Wrap', 'snn')} value={getVal('flexWrap')} options={wrapOptions} onChange={v => setVal('flexWrap', v)} />
                                <IconToggleField label={__('Justify', 'snn')} value={getVal('justifyContent')} options={justifyOptions} onChange={v => setVal('justifyContent', v)} />
                                <IconToggleField label={__('Align', 'snn')} value={getVal('alignItems')} options={alignOptions} onChange={v => setVal('alignItems', v)} />
                                <RangeUnitField label={__('Gap', 'snn')} value={getVal('gap')} onChange={v => setVal('gap', v)} min={0} max={200} step={1} />
                            </Fragment>
                        )}

                        {isGrid && (
                            <Fragment>
                                <IconToggleField label={__('Justify', 'snn')} value={getVal('justifyContent')} options={justifyOptions} onChange={v => setVal('justifyContent', v)} />
                                <IconToggleField label={__('Align', 'snn')} value={getVal('alignItems')} options={alignOptions} onChange={v => setVal('alignItems', v)} />
                                <RangeUnitField label={__('Gap', 'snn')} value={getVal('gap')} onChange={v => setVal('gap', v)} min={0} max={200} step={1} />
                                <RespLabel label={__('Grid Columns', 'snn')} device={activeDevice} />
                                <TextControl value={getVal('gridColumns')} onChange={v => setVal('gridColumns', v)} placeholder={__('e.g. 1fr 1fr 1fr', 'snn')} />
                            </Fragment>
                        )}

                        <hr style={{ margin: '16px 0', border: 'none', borderTop: '1px solid #e0e0e0' }} />

                        {/* Padding / Spacing */}
                        <PaddingInput values={getPad()} onChange={setPad} device={activeDevice} />

                        <hr style={{ margin: '16px 0', border: 'none', borderTop: '1px solid #e0e0e0' }} />

                        {/* Sizing */}
                        <RangeUnitField label={__('Min Height', 'snn')} value={getVal('minHeight')} onChange={v => setVal('minHeight', v)} min={0} max={1000} step={10} />
                        <SelectControl label={__('Overflow', 'snn')} value={attributes.overflow || ''} options={overflowOptions} onChange={v => setAttributes({ overflow: v })} />

                        <hr style={{ margin: '16px 0', border: 'none', borderTop: '1px solid #e0e0e0' }} />

                        {/* Text */}
                        <RespLabel label={__('Text Color', 'snn')} device={activeDevice} />
                        <ColorPalette colors={themeColors} value={getVal('textColor')} onChange={v => setVal('textColor', v || '')} clearable />
                        <div style={{ marginTop: '8px' }}>
                            <ToggleField label={__('Text Align', 'snn')} value={getVal('textAlign')} options={textAlignOptions} onChange={v => setVal('textAlign', v)} />
                        </div>
                    </PanelBody>

                    {/* ═══════ CUSTOM CSS ═══════ */}
                    <PanelBody title={__('Custom CSS', 'snn')} initialOpen={false}>
                        <TextareaControl
                            label={__('Custom CSS', 'snn')}
                            help={__('Write custom CSS rules. The selector .snn-section will target this block.', 'snn')}
                            value={attributes.customCSS || ''}
                            onChange={val => setAttributes({ customCSS: val })}
                            rows={8}
                        />
                    </PanelBody>
                </InspectorControls>

                <section {...innerBlocksProps} />
            </Fragment>
        );
    },

    save: function () {
        return <InnerBlocks.Content />;
    },
});
