/**
 * Range Unit Field — Range slider + text input with unit detection.
 * Attached to: window.SNNControls.RangeUnitField
 */
const { RangeControl } = wp.components;
const C = window.SNNControls = window.SNNControls || {};

C.RangeUnitField = ({ label, value, onChange, min = 0, max = 500, step = 1 }) => {
    const strVal = String(value || '');
    const match = strVal.match(/^(-?[\d.]+)(.*)$/);
    const numVal = match ? parseFloat(match[1]) : '';
    const unitVal = match ? match[2] : '';
    const isPureNum = match && !match[2];

    const handleSlider = (v) => { onChange(String(v) + (isPureNum ? '' : unitVal)); };

    return (
        <div style={{ marginBottom: '16px' }}>
            <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'2px' }}>
                <span style={{ fontSize:'14px',fontWeight:500,color:'#1e1e1e' }}>{label}</span>
                <div style={{ display:'flex',alignItems:'center',gap:'2px' }}>
                    <input type="text" value={strVal} onChange={e => onChange(e.target.value)} placeholder="0"
                        style={{ width:'80px',padding:'4px 8px',fontSize:'14px',fontFamily:'monospace',border:'1px solid #949494',borderRadius:'3px',textAlign:'right' }} />
                    {isPureNum && strVal !== '' && <span style={{ fontSize:'14px',color:'#1e1e1e',fontWeight:500 }}>px</span>}
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
