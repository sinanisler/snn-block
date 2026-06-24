/**
 * Filter Controls — Penpot-inspired CSS filter editor.
 * Attached to: window.SNNControls.FilterControls
 *
 * Penpot reference: CSS filter effects — blur, brightness, contrast,
 * grayscale, hue-rotate, invert, saturate, sepia.
 */
const { __ } = wp.i18n;
const C = window.SNNControls = window.SNNControls || {};

C.FilterControls = ({ filters, onChange, device }) => {
    const vals = filters || {};

    const filterDefs = [
        { key: 'blur',        label: __('Blur','snn'),        unit: 'px', min: 0, max: 50, step: 0.5, default: '0' },
        { key: 'brightness',  label: __('Brightness','snn'),  unit: '%',  min: 0, max: 300, step: 1, default: '100' },
        { key: 'contrast',    label: __('Contrast','snn'),    unit: '%',  min: 0, max: 300, step: 1, default: '100' },
        { key: 'grayscale',   label: __('Grayscale','snn'),   unit: '%',  min: 0, max: 100, step: 1, default: '0' },
        { key: 'hueRotate',   label: __('Hue Rotate','snn'),  unit: 'deg',min: 0, max: 360, step: 1, default: '0' },
        { key: 'invert',      label: __('Invert','snn'),      unit: '%',  min: 0, max: 100, step: 1, default: '0' },
        { key: 'saturate',    label: __('Saturate','snn'),    unit: '%',  min: 0, max: 300, step: 1, default: '100' },
        { key: 'sepia',       label: __('Sepia','snn'),       unit: '%',  min: 0, max: 100, step: 1, default: '0' },
    ];

    const handleChange = (key, value) => {
        onChange({ ...vals, [key]: value });
    };

    return (
        <div style={{ marginBottom: '14px' }}>
            <C.RespLabel label={__('Filters','snn')} device={device} />
            {filterDefs.map(f => (
                <div key={f.key} style={{ display:'flex',alignItems:'center',gap:'4px',marginBottom:'3px' }}>
                    <span style={{ fontSize:'14px',color:'#1e1e1e',minWidth:'76px',textTransform:'uppercase',fontWeight:500 }}>{f.label}</span>
                    <input type="range" min={f.min} max={f.max} step={f.step}
                        value={parseFloat(vals[f.key]) || parseFloat(f.default)}
                        onChange={e => handleChange(f.key, e.target.value)}
                        style={{ flex:1,height:'14px',margin:0,cursor:'pointer' }} />
                    <span style={{ fontSize:'14px',fontFamily:'monospace',color:'#1e1e1e',minWidth:'50px',textAlign:'right' }}>
                        {(vals[f.key] || f.default)}{f.unit}
                    </span>
                </div>
            ))}
        </div>
    );
};
