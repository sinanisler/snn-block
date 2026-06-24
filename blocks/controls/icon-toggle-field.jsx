/**
 * Icon Toggle Field — Font Awesome icon grid selector.
 * Attached to: window.SNNControls.IconToggleField
 */
const C = window.SNNControls = window.SNNControls || {};

C.IconToggleField = ({ label, value, options, onChange }) => (
    <div style={{ marginBottom: '14px' }}>
        <label style={{ fontSize:'14px',fontWeight:500,display:'block',marginBottom:'6px',color:'#1e1e1e' }}>{label}</label>
        <div style={{ display:'flex',gap:'2px',flexWrap:'wrap' }}>
            {options.filter(o => o.value!==''||o.label==='Default').map(opt => (
                <button key={opt.value} onClick={() => onChange(opt.value)} title={opt.label} type="button"
                    style={{ display:'inline-flex',alignItems:'center',justifyContent:'center',width:'32px',height:'32px',
                        border:value===opt.value?'2px solid #3858e9':'1px solid #d0d0d0',borderRadius:'4px',
                        background:value===opt.value?'#f0f6ff':'#fff',color:value===opt.value?'#3858e9':'#666',
                        cursor:'pointer',fontSize:'14px',padding:0,transition:'all 0.1s',boxSizing:'border-box' }}>
                    {opt.icon ? <i className={opt.icon}></i> : opt.label}
                </button>
            ))}
        </div>
    </div>
);
