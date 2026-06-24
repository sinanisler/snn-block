/**
 * Transform Controls — Penpot-inspired CSS transform editor.
 * Attached to: window.SNNControls.TransformControls
 *
 * Penpot reference: Transform section — translate (X/Y), rotate (deg),
 * scale (X/Y), skew (X/Y), transform origin.
 */
const { __ } = wp.i18n;
const C = window.SNNControls = window.SNNControls || {};

C.TransformControls = ({ transform, onChange, device }) => {
    const t = transform || {};

    const set = (key, value) => onChange({ ...t, [key]: value });

    const fields = [
        { group: __('Translate','snn'), items: [
            { key:'translateX', label:'X', placeholder:'0', unit:'px' },
            { key:'translateY', label:'Y', placeholder:'0', unit:'px' },
        ]},
        { group: __('Scale','snn'), items: [
            { key:'scaleX', label:'X', placeholder:'1', unit:'' },
            { key:'scaleY', label:'Y', placeholder:'1', unit:'' },
        ]},
        { group: __('Skew','snn'), items: [
            { key:'skewX', label:'X', placeholder:'0', unit:'deg' },
            { key:'skewY', label:'Y', placeholder:'0', unit:'deg' },
        ]},
    ];

    return (
        <div style={{ marginBottom: '14px' }}>
            <C.RespLabel label={__('Transform','snn')} device={device} />

            {/* Rotate */}
            <div style={{ display:'flex',alignItems:'center',gap:'4px',marginBottom:'4px' }}>
                <span style={{ fontSize:'14px',color:'#1e1e1e',minWidth:'76px',textTransform:'uppercase',fontWeight:500 }}>{__('Rotate','snn')}</span>
                <input type="text" value={t.rotate || ''}
                    onChange={e => set('rotate', e.target.value)}
                    placeholder="0"
                    style={{ flex:1,padding:'5px 8px',fontSize:'14px',border:'1px solid #949494',borderRadius:'3px',boxSizing:'border-box' }} />
                <span style={{ fontSize:'14px',color:'#1e1e1e' }}>deg</span>
            </div>

            {fields.map(grp => (
                <div key={grp.group} style={{ marginBottom:'4px' }}>
                    <span style={{ fontSize:'14px',color:'#1e1e1e',display:'block',marginBottom:'2px',fontWeight:500 }}>{grp.group}</span>
                    <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:'4px' }}>
                        {grp.items.map(f => (
                            <div key={f.key} style={{ display:'flex',alignItems:'center',gap:'2px' }}>
                                <span style={{ fontSize:'14px',color:'#1e1e1e',minWidth:'16px',fontWeight:500 }}>{f.label}</span>
                                <input type="text" value={t[f.key] || ''}
                                    onChange={e => set(f.key, e.target.value)}
                                    placeholder={f.placeholder}
                                    style={{ flex:1,padding:'5px 6px',fontSize:'14px',border:'1px solid #949494',borderRadius:'3px',boxSizing:'border-box',textAlign:'center' }} />
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
};
