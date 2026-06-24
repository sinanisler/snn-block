/**
 * Dimensions Control — Penpot-inspired width/height/min-max/box-sizing.
 * Attached to: window.SNNControls.DimensionsControl, .SizeInput, .BoxSizingSelect
 */
const { __ } = wp.i18n;
const C = window.SNNControls = window.SNNControls || {};

const tinyInp = { width:'100%',padding:'5px 8px',fontSize:'14px',fontFamily:'monospace',border:'1px solid #949494',borderRadius:'3px',boxSizing:'border-box',lineHeight:'20px' };
const lblStyle = { fontSize:'14px',color:'#1e1e1e',display:'block',fontWeight:500,marginBottom:'2px' };

/* ─── Single Size Input (with unit) ─── */
C.SizeInput = ({ label, value, onChange, placeholder }) => (
    <div>
        <span style={lblStyle}>{label}</span>
        <input type="text" value={value || ''} onChange={e => onChange(e.target.value)}
            placeholder={placeholder || 'auto'} style={tinyInp} />
    </div>
);

/* ─── Box Sizing Select ─── */
C.BoxSizingSelect = ({ label, value, onChange }) => {
    const opts = [
        { value: '',           label: __('Default','snn') },
        { value: 'border-box', label: __('Border Box','snn') },
        { value: 'content-box',label: __('Content Box','snn') },
    ];
    return <C.CompactSelect label={label || __('Box Sizing','snn')} value={value || ''} options={opts} onChange={onChange} />;
};

/* ─── Full Dimensions Control ─── */
C.DimensionsControl = ({ getVal, setVal, device, showBoxSizing = true }) => {
    const d = device;
    const sizeFields = [
        { key: 'width',     label: __('Width','snn'),     placeholder: 'auto' },
        { key: 'minWidth',  label: __('Min Width','snn'),  placeholder: '0' },
        { key: 'maxWidth',  label: __('Max Width','snn'),  placeholder: 'none' },
        { key: 'height',    label: __('Height','snn'),    placeholder: 'auto' },
        { key: 'minHeight', label: __('Min Height','snn'), placeholder: '0' },
        { key: 'maxHeight', label: __('Max Height','snn'), placeholder: 'none' },
    ];

    return (
        <div style={{ marginBottom: '14px' }}>
            <C.RespLabel label={__('Dimensions','snn')} device={device} />

            <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:'6px',marginBottom:'6px' }}>
                {sizeFields.map(f => (
                    <C.SizeInput key={f.key} label={f.label} value={getVal(f.key)} onChange={v => setVal(f.key, v)} placeholder={f.placeholder} />
                ))}
            </div>

            {showBoxSizing && (
                <C.BoxSizingSelect value={getVal('boxSizing')} onChange={v => setVal('boxSizing', v)} />
            )}
        </div>
    );
};
