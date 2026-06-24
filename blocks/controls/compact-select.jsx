/**
 * Compact Select — label + dropdown on one line.
 * Attached to: window.SNNControls.CompactSelect
 */
const C = window.SNNControls = window.SNNControls || {};

C.CompactSelect = ({ label, value, options, onChange }) => (
    <div style={{ display:'flex',alignItems:'center',gap:'4px',marginBottom:'3px' }}>
        <span style={{ fontSize:'14px',fontWeight:500,textTransform:'uppercase',color:'#1e1e1e',minWidth:'64px' }}>{label}</span>
        <select value={value||''} onChange={e => onChange(e.target.value)}
            style={{ fontSize:'14px',padding:'3px 6px',border:'1px solid #949494',borderRadius:'3px',lineHeight:'20px',background:'#fff',boxSizing:'border-box',height:'26px',flex:1 }}>
            {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
    </div>
);
