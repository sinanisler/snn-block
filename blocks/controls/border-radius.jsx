/**
 * Border Radius — Penpot-inspired 4-corner radius with link toggle.
 * Attached to: window.SNNControls.BorderRadiusControl
 *
 * Penpot reference: Border radius section — each corner individually
 * customizable, with link icon to unify all four.
 */
const { useState } = wp.element;
const { __ } = wp.i18n;
const C = window.SNNControls = window.SNNControls || {};

C.BorderRadiusControl = ({ values, onChange, device }) => {
    const [linked, setLinked] = useState(false);
    const corners = [
        { key: 'topLeft',     label: 'TL' },
        { key: 'topRight',    label: 'TR' },
        { key: 'bottomRight', label: 'BR' },
        { key: 'bottomLeft',  label: 'BL' },
    ];

    const vals = values || { topLeft: '', topRight: '', bottomRight: '', bottomLeft: '' };

    const handleChange = (key, newVal) => {
        if (linked) {
            onChange({ topLeft: newVal, topRight: newVal, bottomRight: newVal, bottomLeft: newVal });
        } else {
            onChange({ ...vals, [key]: newVal });
        }
    };

    return (
        <div style={{ marginBottom: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <C.RespLabel label={__('Radius','snn')} device={device} />
                <button type="button" onClick={() => setLinked(!linked)}
                    title={linked ? __('Unlink corners','snn') : __('Link corners','snn')}
                    style={{ border:'none',background:'none',cursor:'pointer',fontSize:'16px',color:linked?'#3858e9':'#949494',padding:'0 4px',lineHeight:1 }}>
                    <i className={linked ? 'fa-solid fa-link' : 'fa-solid fa-link-slash'}></i>
                </button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' }}>
                {corners.map(c => (
                    <div key={c.key}>
                        <span style={{ fontSize:'14px',color:'#1e1e1e',display:'block',fontWeight:500 }}>{c.label}</span>
                        <input type="text" value={vals[c.key] || ''}
                            onChange={e => handleChange(c.key, e.target.value)}
                            placeholder="0"
                            style={{ width:'100%',padding:'5px 8px',fontSize:'14px',border:'1px solid #949494',borderRadius:'3px',boxSizing:'border-box' }} />
                    </div>
                ))}
            </div>
        </div>
    );
};
