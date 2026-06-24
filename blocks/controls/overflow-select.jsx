/**
 * Overflow Select — Penpot-inspired overflow control (visible/hidden/scroll/auto).
 * Attached to: window.SNNControls.OverflowSelect
 */
const { __ } = wp.i18n;
const C = window.SNNControls = window.SNNControls || {};

C.OverflowSelect = ({ label, value, onChange, device }) => {
    const opts = [
        { value:'visible',label:__('Visible','snn') },
        { value:'hidden',label:__('Hidden','snn') },
        { value:'scroll',label:__('Scroll','snn') },
        { value:'auto',label:__('Auto','snn') },
    ];
    return (
        <div style={{ marginBottom:'3px' }}>
            <div style={{ display:'flex',alignItems:'center',gap:'4px' }}>
                <span style={{ fontSize:'14px',fontWeight:500,textTransform:'uppercase',color:'#1e1e1e',minWidth:'64px' }}>{label||__('Overflow','snn')}</span>
                <select value={value||'visible'} onChange={e => onChange(e.target.value)}
                    style={{ fontSize:'14px',padding:'3px 6px',border:'1px solid #949494',borderRadius:'3px',height:'26px',flex:1 }}>
                    {opts.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
            </div>
            <C.DeviceBadge device={device} />
        </div>
    );
};
