/**
 * Typography Controls — Penpot-inspired font controls.
 * Attached to: window.SNNControls.FontSizeRow, .FontWeightSelect, .LineHeightRow,
 *   .LetterSpacingRow, .AlignRow, .TransformRow, .DecorationRow, .FontFamilySelect
 *
 * Penpot reference: Text section — font family, size, weight, line height (px),
 * letter spacing (px), text case, horizontal/vertical align, decoration, direction.
 */
const { __ } = wp.i18n;
const C = window.SNNControls = window.SNNControls || {};

/* ─── Font Size Row ─── */
C.FontSizeRow = ({ label, value, onChange, units = ['px', 'em', 'rem', 'vw', '%'] }) => {
    const strVal = String(value || '');
    const match = strVal.match(/^(-?[\d.]+)(.*)$/);
    const numVal = match ? match[1] : '';
    const unitVal = match && match[2] ? match[2] : 'px';
    return (
        <div style={{ display:'flex',alignItems:'center',gap:'4px',marginBottom:'3px' }}>
            <span style={{ fontSize:'14px',fontWeight:500,textTransform:'uppercase',color:'#1e1e1e',minWidth:'64px' }}>{label}</span>
            <input type="text" value={numVal}
                onChange={e => { const v=e.target.value; if(v===''){onChange('');return;} const n=parseFloat(v); if(!isNaN(n)) onChange(String(n)+unitVal); }}
                placeholder="16"
                style={{ width:'50px',padding:'4px 6px',fontSize:'14px',fontFamily:'monospace',border:'1px solid #949494',borderRadius:'3px',textAlign:'center',lineHeight:'20px',boxSizing:'border-box' }} />
            <select value={unitVal} onChange={e => onChange(String(numVal||0)+e.target.value)}
                style={{ fontSize:'14px',padding:'3px 4px',border:'1px solid #949494',borderRadius:'3px',lineHeight:'20px',background:'#fff',boxSizing:'border-box',height:'26px' }}>
                {units.map(u => <option key={u} value={u}>{u}</option>)}
            </select>
        </div>
    );
};

/* ─── Font Weight Select ─── */
C.FontWeightSelect = ({ label, value, onChange }) => {
    const weights = ['100','200','300','400','500','600','700','800','900'];
    return (
        <div style={{ display:'flex',alignItems:'center',gap:'4px',marginBottom:'3px' }}>
            <span style={{ fontSize:'14px',fontWeight:500,textTransform:'uppercase',color:'#1e1e1e',minWidth:'64px' }}>{label}</span>
            <select value={value || '400'} onChange={e => onChange(e.target.value)}
                style={{ fontSize:'14px',padding:'3px 6px',border:'1px solid #949494',borderRadius:'3px',height:'26px',flex:1 }}>
                {weights.map(w => <option key={w} value={w}>{w}</option>)}
            </select>
        </div>
    );
};

/* ─── Line Height Row ─── */
C.LineHeightRow = ({ label, value, onChange }) => (
    <div style={{ display:'flex',alignItems:'center',gap:'4px',marginBottom:'3px' }}>
        <span style={{ fontSize:'14px',fontWeight:500,textTransform:'uppercase',color:'#1e1e1e',minWidth:'64px' }}>{label}</span>
        <input type="text" value={value || ''} onChange={e => onChange(e.target.value)} placeholder="1.5"
            style={{ flex:1,padding:'4px 6px',fontSize:'14px',fontFamily:'monospace',border:'1px solid #949494',borderRadius:'3px',lineHeight:'20px',boxSizing:'border-box' }} />
    </div>
);

/* ─── Letter Spacing Row ─── */
C.LetterSpacingRow = ({ label, value, onChange }) => (
    <div style={{ display:'flex',alignItems:'center',gap:'4px',marginBottom:'3px' }}>
        <span style={{ fontSize:'14px',fontWeight:500,textTransform:'uppercase',color:'#1e1e1e',minWidth:'64px' }}>{label}</span>
        <input type="text" value={value || ''} onChange={e => onChange(e.target.value)} placeholder="0"
            style={{ flex:1,padding:'4px 6px',fontSize:'14px',fontFamily:'monospace',border:'1px solid #949494',borderRadius:'3px',lineHeight:'20px',boxSizing:'border-box' }} />
    </div>
);

/* ─── Text Align Row ─── */
C.AlignRow = ({ label, value, onChange }) => {
    const opts = [
        { v: 'left',   l: '\u2264' },
        { v: 'center', l: '\u2265' },
        { v: 'right',  l: '\u2267' },
    ];
    return (
        <div style={{ display:'flex',alignItems:'center',gap:'4px',marginBottom:'3px' }}>
            <span style={{ fontSize:'14px',fontWeight:500,textTransform:'uppercase',color:'#1e1e1e',minWidth:'64px' }}>{label}</span>
            {opts.map(o => (
                <button key={o.v} type="button" onClick={() => onChange(o.v===value?'':o.v)}
                    style={{ width:'28px',height:'26px',border:'1px solid #949494',borderRadius:'3px',
                        background:value===o.v?'#1e1e1e':'#fff',color:value===o.v?'#fff':'#1e1e1e',
                        cursor:'pointer',fontSize:'14px',lineHeight:'20px',display:'flex',alignItems:'center',justifyContent:'center',padding:0 }}>
                    {o.l}
                </button>
            ))}
        </div>
    );
};

/* ─── Text Transform Row ─── */
C.TransformRow = ({ label, value, onChange }) => {
    const opts = [
        { v: '',           l: 'Aa' },
        { v: 'uppercase',  l: 'AA' },
        { v: 'lowercase',  l: 'aa' },
        { v: 'capitalize', l: 'Aa\u2022' },
    ];
    return (
        <div style={{ display:'flex',alignItems:'center',gap:'4px',marginBottom:'3px' }}>
            <span style={{ fontSize:'14px',fontWeight:500,textTransform:'uppercase',color:'#1e1e1e',minWidth:'64px' }}>{label}</span>
            {opts.map(o => (
                <button key={o.v} type="button" onClick={() => onChange(o.v===value?'':o.v)}
                    style={{ height:'26px',padding:'0 7px',border:'1px solid #949494',borderRadius:'3px',
                        background:value===o.v?'#1e1e1e':'#fff',color:value===o.v?'#fff':'#1e1e1e',
                        cursor:'pointer',fontSize:'14px',fontWeight:600,lineHeight:'20px' }}>
                    {o.l}
                </button>
            ))}
        </div>
    );
};

/* ─── Text Decoration Row ─── */
C.DecorationRow = ({ label, value, onChange }) => {
    const opts = [
        { v: '',           l: __('None','snn') },
        { v: 'underline',  l: 'U' },
        { v: 'line-through', l: 'S' },
        { v: 'overline',   l: 'O' },
    ];
    return (
        <div style={{ display:'flex',alignItems:'center',gap:'4px',marginBottom:'3px' }}>
            <span style={{ fontSize:'14px',fontWeight:500,textTransform:'uppercase',color:'#1e1e1e',minWidth:'64px' }}>{label}</span>
            <select value={value || ''} onChange={e => onChange(e.target.value)}
                style={{ fontSize:'14px',padding:'3px 6px',border:'1px solid #949494',borderRadius:'3px',height:'26px',flex:1 }}>
                {opts.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
            </select>
        </div>
    );
};

/* ─── Font Family Select ─── */
C.FontFamilySelect = ({ label, value, onChange }) => (
    <div style={{ display:'flex',alignItems:'center',gap:'4px',marginBottom:'3px' }}>
        <span style={{ fontSize:'14px',fontWeight:500,textTransform:'uppercase',color:'#1e1e1e',minWidth:'64px' }}>{label}</span>
        <input type="text" value={value || ''} onChange={e => onChange(e.target.value)} placeholder="Arial, sans-serif"
            style={{ flex:1,padding:'4px 6px',fontSize:'14px',fontFamily:'monospace',border:'1px solid #949494',borderRadius:'3px',lineHeight:'20px',boxSizing:'border-box' }} />
    </div>
);
