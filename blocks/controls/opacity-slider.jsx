/**
 * Opacity Slider — Penpot-inspired 0-100% opacity slider.
 * Attached to: window.SNNControls.OpacitySlider
 */
const { __ } = wp.i18n;
const C = window.SNNControls = window.SNNControls || {};

C.OpacitySlider = ({ value, onChange, device }) => {
    const pct = value ? Math.round(parseFloat(value) * 100) : 100;

    const handleChange = (e) => {
        const v = parseFloat(e.target.value);
        onChange(String(v / 100));
    };

    return (
        <div style={{ marginBottom: '14px' }}>
            <C.RespLabel label={__('Opacity','snn')} device={device} />
            <div style={{ display:'flex',alignItems:'center',gap:'8px' }}>
                <input type="range" min="0" max="100" value={pct} onChange={handleChange}
                    style={{ flex:1,height:'14px',margin:0,cursor:'pointer' }} />
                <span style={{ fontSize:'14px',fontWeight:600,color:'#1e1e1e',minWidth:'40px',textAlign:'right' }}>{pct}%</span>
            </div>
        </div>
    );
};
