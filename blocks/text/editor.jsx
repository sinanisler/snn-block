const { registerBlockType } = wp.blocks;
const { InspectorControls, useBlockProps, RichText, MediaUpload } = wp.blockEditor;
const { PanelBody, Button, SelectControl, TextControl, ColorPalette, RangeControl, __experimentalToggleGroupControl, __experimentalToggleGroupControlOption } = wp.components;
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
                    {options.map(opt => (
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

/* ─── Range slider + smart text input ─── */
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
   TEXT BLOCK
   ═══════════════════════════════════════════════ */

registerBlockType('snn/text', {
    edit: function (props) {
        const { attributes, setAttributes } = props;

        // ── Device state ──
        const deviceType = useSelect(select => {
            const store = select('core/edit-post') || select('core/editor');
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
        const inheritPad = () => {
            const pad = attributes.padding;
            if (!pad || typeof pad !== 'object') return {};
            const tryDevices = ['mobile', 'tablet', 'desktop'];
            const start = tryDevices.indexOf(activeDevice);
            for (let i = start; i < tryDevices.length; i++) {
                const d = tryDevices[i];
                if (pad[d] && Object.values(pad[d]).some(v => v)) return pad[d];
            }
            return {};
        };

        // ── Preview styles with full inheritance ──
        const previewStyles = {};

        const invTxtCol = inheritVal('textColor');
        if (invTxtCol) previewStyles.color = invTxtCol;
        const invBgCol = inheritVal('bgColor');
        if (invBgCol) previewStyles.backgroundColor = invBgCol;
        const invFs = inheritVal('fontSize');
        if (invFs) previewStyles.fontSize = invFs;
        const invLh = inheritVal('lineHeight');
        if (invLh) previewStyles.lineHeight = invLh;
        const invLs = inheritVal('letterSpacing');
        if (invLs) previewStyles.letterSpacing = invLs;
        const invFw = inheritVal('fontWeight');
        if (invFw) previewStyles.fontWeight = invFw;
        const invTa = inheritVal('textAlign');
        if (invTa) previewStyles.textAlign = invTa;
        if (attributes.textTransform) previewStyles.textTransform = attributes.textTransform;

        const inPad = inheritPad();
        if (inPad.top) previewStyles.paddingTop = inPad.top;
        if (inPad.right) previewStyles.paddingRight = inPad.right;
        if (inPad.bottom) previewStyles.paddingBottom = inPad.bottom;
        if (inPad.left) previewStyles.paddingLeft = inPad.left;

        // ── Options ──
        const tagOptions = [
            { label: 'P', value: 'p' },
            { label: 'H1', value: 'h1' },
            { label: 'H2', value: 'h2' },
            { label: 'H3', value: 'h3' },
            { label: 'H4', value: 'h4' },
            { label: 'DIV', value: 'div' },
        ];
        const weightOptions = [
            { label: __('Default', 'snn'), value: '' },
            { label: __('Thin', 'snn'), value: '100' },
            { label: __('Light', 'snn'), value: '300' },
            { label: __('Normal', 'snn'), value: '400' },
            { label: __('Medium', 'snn'), value: '500' },
            { label: __('Semi Bold', 'snn'), value: '600' },
            { label: __('Bold', 'snn'), value: '700' },
            { label: __('Black', 'snn'), value: '900' },
        ];
        const transformOptions = [
            { label: __('None', 'snn'), value: '' },
            { label: __('UPPER', 'snn'), value: 'uppercase' },
            { label: __('lower', 'snn'), value: 'lowercase' },
            { label: __('Capitalize', 'snn'), value: 'capitalize' },
        ];
        const textAlignOptions = [
            { label: __('Default', 'snn'), value: '' },
            { label: __('Left', 'snn'), value: 'left' },
            { label: __('Center', 'snn'), value: 'center' },
            { label: __('Right', 'snn'), value: 'right' },
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
            className: 'snn-text',
            style: previewStyles,
        });

        return (
            <Fragment>
                <InspectorControls>
                    {/* ═══════ TAG SELECTOR ═══════ */}
                    <PanelBody title={__('Tag', 'snn')} initialOpen={true}>
                        <ToggleField
                            label={__('HTML Tag', 'snn')}
                            value={attributes.tagName || 'p'}
                            options={tagOptions}
                            onChange={v => setAttributes({ tagName: v })}
                        />
                    </PanelBody>

                    {/* ═══════ TYPOGRAPHY ═══════ */}
                    <PanelBody title={__('Typography', 'snn')} initialOpen={false}>
                        <div style={{ fontSize: '11px', color: '#757575', marginBottom: '8px', fontStyle: 'italic' }}>
                            {__('Editing: ', 'snn')}<strong style={{ textTransform: 'capitalize' }}>{activeDevice}</strong>
                        </div>

                        <RangeUnitField
                            label={__('Font Size', 'snn')}
                            value={getVal('fontSize')}
                            onChange={v => setVal('fontSize', v)}
                            min={8} max={200} step={1}
                        />
                        <RangeUnitField
                            label={__('Line Height', 'snn')}
                            value={getVal('lineHeight')}
                            onChange={v => setVal('lineHeight', v)}
                            min={0.5} max={4} step={0.1}
                        />
                        <RangeUnitField
                            label={__('Letter Spacing', 'snn')}
                            value={getVal('letterSpacing')}
                            onChange={v => setVal('letterSpacing', v)}
                            min={-5} max={20} step={0.5}
                        />
                        <ToggleField
                            label={__('Font Weight', 'snn')}
                            value={getVal('fontWeight')}
                            options={weightOptions}
                            onChange={v => setVal('fontWeight', v)}
                        />
                        <ToggleField
                            label={__('Transform', 'snn')}
                            value={attributes.textTransform || ''}
                            options={transformOptions}
                            onChange={v => setAttributes({ textTransform: v })}
                        />
                        <ToggleField
                            label={__('Text Align', 'snn')}
                            value={getVal('textAlign')}
                            options={textAlignOptions}
                            onChange={v => setVal('textAlign', v)}
                        />
                    </PanelBody>

                    {/* ═══════ COLORS ═══════ */}
                    <PanelBody title={__('Colors', 'snn')} initialOpen={false}>
                        <RespLabel label={__('Text Color', 'snn')} device={activeDevice} />
                        <ColorPalette
                            colors={themeColors}
                            value={getVal('textColor')}
                            onChange={v => setVal('textColor', v || '')}
                            clearable
                        />
                        <div style={{ marginTop: '12px' }}>
                            <RespLabel label={__('Background', 'snn')} device={activeDevice} />
                            <ColorPalette
                                colors={themeColors}
                                value={getVal('bgColor')}
                                onChange={v => setVal('bgColor', v || '')}
                                clearable
                            />
                        </div>
                    </PanelBody>

                    {/* ═══════ SPACING ═══════ */}
                    <PanelBody title={__('Spacing', 'snn')} initialOpen={false}>
                        <div style={{ fontSize: '11px', color: '#757575', marginBottom: '8px', fontStyle: 'italic' }}>
                            {__('Editing: ', 'snn')}<strong style={{ textTransform: 'capitalize' }}>{activeDevice}</strong>
                        </div>
                        <PaddingInput values={getPad()} onChange={setPad} device={activeDevice} />
                    </PanelBody>
                </InspectorControls>

                <RichText
                    {...blockProps}
                    tagName={attributes.tagName || 'p'}
                    value={attributes.content}
                    onChange={content => setAttributes({ content })}
                    placeholder={__('Enter text...', 'snn')}
                    allowedFormats={['core/bold', 'core/italic', 'core/link', 'core/strikethrough']}
                />
            </Fragment>
        );
    },

    save: function () {
        return null;
    },
});
