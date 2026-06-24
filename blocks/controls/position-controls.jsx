/**
 * Position & Z-Index Controls — Penpot-inspired.
 * Attached to: window.SNNControls.PositionSelect, .OffsetInput, .ZIndexControl
 *
 * Penpot reference: Position (static/absolute/relative/fixed/sticky),
 * top/right/bottom/left offsets, z-index.
 */
const { __ } = wp.i18n;
const C = window.SNNControls = window.SNNControls || {};

/* ─── Position Select ─── */
C.PositionSelect = ({ label, value, onChange }) => {
    const opts = [
        { value:'static',label:__('Static','snn') },
        { value:'relative',label:__('Relative','snn') },
        { value:'absolute',label:__('Absolute','snn') },
        { value:'fixed',label:__('Fixed','snn') },
        { value:'sticky',label:__('Sticky','snn') },
    ];
    return (
        <div style={{ display:'flex',alignItems:'center',gap:'4px',marginBottom:'3px' }}>
            <span style={{ fontSize:'14px',fontWeight:500,textTransform:'uppercase',color:'#1e1e1e',minWidth:'64px' }}>{label||__('Position','snn')}</span>
            <select value={value||'static'} onChange={e => onChange(e.target.value)}
                style={{ fontSize:'14px',padding:'3px 6px',border:'1px solid #949494',borderRadius:'3px',height:'26px',flex:1 }}>
                {opts.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
        </div>
    );
};

/* ─── Offset Inputs (top/right/bottom/left) ─── */
C.OffsetInput = ({ offsets, onChange, device }) => {
    const vals = offsets || { top:'',right:'',bottom:'',left:'' };
    const sides = ['top','right','bottom','left'];
    return (
        <div style={{ marginBottom:'4px' }}>
            <C.RespLabel label={__('Offsets','snn')} device={device} />
            <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:'4px' }}>
                {sides.map(s => (
                    <div key={s}>
                        <span style={{ fontSize:'14px',color:'#1e1e1e',display:'block',fontWeight:500 }}>{s.charAt(0).toUpperCase()+s.slice(1)}</span>
                        <input type="text" value={vals[s]||''}
                            onChange={e => onChange({...vals,[s]:e.target.value})}
                            placeholder="auto"
                            style={{ width:'100%',padding:'5px 8px',fontSize:'14px',border:'1px solid #949494',borderRadius:'3px',boxSizing:'border-box' }} />
                    </div>
                ))}
            </div>
        </div>
    );
};

/* ─── Z-Index Control ─── */
C.ZIndexControl = ({ label, value, onChange }) => (
    <div style={{ display:'flex',alignItems:'center',gap:'4px',marginBottom:'3px' }}>
        <span style={{ fontSize:'14px',fontWeight:500,textTransform:'uppercase',color:'#1e1e1e',minWidth:'64px' }}>{label||__('Z-Index','snn')}</span>
        <input type="text" value={value||''} onChange={e => onChange(e.target.value)} placeholder="0"
            style={{ flex:1,padding:'4px 6px',fontSize:'14px',fontFamily:'monospace',border:'1px solid #949494',borderRadius:'3px',lineHeight:'20px',boxSizing:'border-box' }} />
    </div>
);
