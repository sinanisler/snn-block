/**
 * Compact Section Header — tiny label with divider line.
 * Attached to: window.SNNControls.CompactSection, .CompactRow
 */
const C = window.SNNControls = window.SNNControls || {};

/* ─── Section divider: UPPERCASE label + line ─── */
C.CompactSection = ({ title }) => (
    <div style={{
        display:'flex',alignItems:'center',gap:'6px',
        margin:'8px 0 4px 0',paddingTop:'8px',
        borderTop:'1px solid #e0e0e0',
    }}>
        <span style={{
            fontSize:'14px',fontWeight:700,textTransform:'uppercase',
            color:'#1e1e1e',letterSpacing:'0.5px',whiteSpace:'nowrap',
        }}>{title}</span>
        <div style={{flex:1,height:'1px',background:'#e0e0e0'}}></div>
    </div>
);

/* ─── 2-column row: label left, control right ─── */
C.CompactRow = ({ children }) => (
    <div style={{ display:'flex',alignItems:'center',gap:'4px',marginBottom:'2px' }}>
        {children}
    </div>
);

/* ─── Compact label ─── */
C.CompactLabel = ({ text }) => (
    <span style={{ fontSize:'14px',fontWeight:500,textTransform:'uppercase',color:'#1e1e1e',minWidth:'52px',flexShrink:0 }}>{text}</span>
);
