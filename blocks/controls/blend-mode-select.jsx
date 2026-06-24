/**
 * Blend Mode Select — Penpot-inspired 16 blend modes.
 * Attached to: window.SNNControls.BlendModeSelect
 *
 * Penpot reference: Blend mode dropdown — Normal, Darken, Multiply,
 * Color burn, Lighten, Screen, Color dodge, Overlay, Soft light,
 * Hard light, Difference, Exclusion, Hue, Saturation, Color, Luminosity.
 */
const { __ } = wp.i18n;
const C = window.SNNControls = window.SNNControls || {};

C.BlendModeSelect = ({ label, value, onChange }) => {
    const modes = [
        'normal','multiply','screen','overlay','darken','lighten',
        'color-dodge','color-burn','hard-light','soft-light',
        'difference','exclusion','hue','saturation','color','luminosity',
    ];
    return (
        <div style={{ display:'flex',alignItems:'center',gap:'4px',marginBottom:'3px' }}>
            <span style={{ fontSize:'14px',fontWeight:500,textTransform:'uppercase',color:'#1e1e1e',minWidth:'64px' }}>{label || __('Blend','snn')}</span>
            <select value={value || 'normal'} onChange={e => onChange(e.target.value)}
                style={{ fontSize:'14px',padding:'3px 6px',border:'1px solid #949494',borderRadius:'3px',height:'26px',flex:1 }}>
                {modes.map(m => <option key={m} value={m}>{m.charAt(0).toUpperCase()+m.slice(1)}</option>)}
            </select>
        </div>
    );
};
