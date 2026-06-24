/**
 * Shadow Builder — Penpot-inspired box-shadow + text-shadow editor.
 * Attached to: window.SNNControls.ShadowBuilder
 *
 * Penpot reference: Shadow section — type (drop/inner), X, Y, Blur, Spread,
 * Color+opacity. Multiple shadows per layer via add/remove.
 */
const { __ } = wp.i18n;
const { useState } = wp.element;
const C = window.SNNControls = window.SNNControls || {};

C.ShadowBuilder = ({ shadows, onChange, device }) => {
    const [activeIndex, setActiveIndex] = useState(0);

    const list = shadows || [];

    const addShadow = () => {
        const newShadow = { type: 'drop', x: '0px', y: '4px', blur: '8px', spread: '0px', color: '#00000040' };
        onChange([...list, newShadow]);
        setActiveIndex(list.length);
    };

    const removeShadow = (idx) => {
        const updated = list.filter((_, i) => i !== idx);
        onChange(updated);
        setActiveIndex(Math.min(activeIndex, updated.length - 1));
    };

    const updateShadow = (idx, key, value) => {
        const updated = list.map((s, i) => i === idx ? { ...s, [key]: value } : s);
        onChange(updated);
    };

    const current = list[activeIndex] || null;

    return (
        <div style={{ marginBottom: '14px' }}>
            <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'6px' }}>
                <C.RespLabel label={__('Shadow','snn')} device={device} />
                <button type="button" onClick={addShadow}
                    style={{ border:'none',background:'#3858e9',color:'#fff',borderRadius:'3px',padding:'4px 12px',fontSize:'14px',cursor:'pointer' }}>
                    + Add
                </button>
            </div>

            {/* Shadow layer tabs */}
            {list.length > 1 && (
                <div style={{ display:'flex',gap:'4px',marginBottom:'6px',flexWrap:'wrap' }}>
                    {list.map((s, i) => (
                        <button key={i} type="button" onClick={() => setActiveIndex(i)}
                            style={{
                                padding:'3px 10px',fontSize:'14px',borderRadius:'3px',cursor:'pointer',
                                border: i===activeIndex?'2px solid #3858e9':'1px solid #ddd',
                                background: i===activeIndex?'#f0f6ff':'#fff',color:i===activeIndex?'#3858e9':'#666',
                            }}>
                            #{i+1}
                        </button>
                    ))}
                </div>
            )}

            {current && (
                <div>
                    {/* Type */}
                    <div style={{ marginBottom:'4px' }}>
                        <label style={{ fontSize:'14px',color:'#1e1e1e',display:'block',marginBottom:'2px',fontWeight:500 }}>{__('Type','snn')}</label>
                        <select value={current.type || 'drop'} onChange={e => updateShadow(activeIndex, 'type', e.target.value)}
                            style={{ fontSize:'14px',padding:'3px 6px',border:'1px solid #949494',borderRadius:'3px',height:'26px',width:'100%' }}>
                            <option value="drop">{__('Drop (outside)','snn')}</option>
                            <option value="inner">{__('Inner (inside)','snn')}</option>
                        </select>
                    </div>

                    {/* X, Y, Blur, Spread grid */}
                    <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:'4px',marginBottom:'4px' }}>
                        {[
                            { key:'x', label:'X', placeholder:'0' },
                            { key:'y', label:'Y', placeholder:'4' },
                            { key:'blur', label:__('Blur','snn'), placeholder:'8' },
                            { key:'spread', label:__('Spread','snn'), placeholder:'0' },
                        ].map(f => (
                            <div key={f.key}>
                                <span style={{ fontSize:'14px',color:'#1e1e1e',display:'block',fontWeight:500 }}>{f.label}</span>
                                <input type="text" value={current[f.key] || ''}
                                    onChange={e => updateShadow(activeIndex, f.key, e.target.value)}
                                    placeholder={f.placeholder}
                                    style={{ width:'100%',padding:'5px 8px',fontSize:'14px',border:'1px solid #949494',borderRadius:'3px',boxSizing:'border-box' }} />
                            </div>
                        ))}
                    </div>

                    {/* Color */}
                    <C.ColorRow label={__('Shadow Color','snn')} value={current.color || '#00000040'}
                        onChange={v => updateShadow(activeIndex, 'color', v)} />

                    {/* Remove */}
                    <button type="button" onClick={() => removeShadow(activeIndex)}
                        style={{ border:'none',background:'none',color:'#cc0000',fontSize:'14px',cursor:'pointer',padding:'4px 0',marginTop:'4px' }}>
                        {__('Remove shadow','snn')}
                    </button>
                </div>
            )}
        </div>
    );
};
