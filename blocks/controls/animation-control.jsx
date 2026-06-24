/**
 * Animation Builder — Penpot-inspired transition & keyframe animation editor.
 * Attached to: window.SNNControls.TransitionBuilder, .AnimationBuilder
 *
 * Penpot reference: Interaction/Prototype panel — triggers, actions,
 * transitions with easing curves, durations, delays.
 */
const { __ } = wp.i18n;
const { useState } = wp.element;
const C = window.SNNControls = window.SNNControls || {};

const tinyInp = { width:'100%',padding:'5px 8px',fontSize:'14px',fontFamily:'monospace',border:'1px solid #949494',borderRadius:'3px',boxSizing:'border-box',lineHeight:'20px' };

/* ═══════════════════════════════════════════════
   EASING CURVES
   ═══════════════════════════════════════════════ */
const EASING_PRESETS = [
    { value: 'ease',            label: 'Ease' },
    { value: 'ease-in',         label: 'Ease In' },
    { value: 'ease-out',        label: 'Ease Out' },
    { value: 'ease-in-out',     label: 'Ease In Out' },
    { value: 'linear',          label: 'Linear' },
    { value: 'cubic-bezier(0.34,1.56,0.64,1)', label: 'Spring' },
    { value: 'cubic-bezier(0.22,0.61,0.36,1)', label: 'Smooth' },
    { value: 'cubic-bezier(0.76,0,0.24,1)', label: 'Power' },
];

/* ═══════════════════════════════════════════════
   TRANSITION BUILDER
   ═══════════════════════════════════════════════ */
C.TransitionBuilder = ({ transitions, onChange, device }) => {
    const list = transitions || [];

    const addTransition = () => {
        onChange([...list, { property: 'all', duration: '0.3s', timing: 'ease', delay: '0s' }]);
    };

    const removeTransition = (idx) => {
        onChange(list.filter((_, i) => i !== idx));
    };

    const updateTransition = (idx, key, value) => {
        onChange(list.map((t, i) => i === idx ? { ...t, [key]: value } : t));
    };

    const buildCSS = (t) => `${t.property || 'all'} ${t.duration || '0.3s'} ${t.timing || 'ease'} ${t.delay || '0s'}`;

    const propertyOpts = [
        { value: 'all', label: __('All','snn') },
        { value: 'opacity', label: __('Opacity','snn') },
        { value: 'transform', label: __('Transform','snn') },
        { value: 'color', label: __('Color','snn') },
        { value: 'background-color', label: __('Background','snn') },
        { value: 'border-color', label: __('Border','snn') },
        { value: 'box-shadow', label: __('Shadow','snn') },
        { value: 'filter', label: __('Filter','snn') },
        { value: 'width', label: __('Width','snn') },
        { value: 'height', label: __('Height','snn') },
        { value: 'margin', label: __('Margin','snn') },
        { value: 'padding', label: __('Padding','snn') },
    ];

    return (
        <div style={{ marginBottom: '14px' }}>
            <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'6px' }}>
                <C.RespLabel label={__('Transition','snn')} device={device} />
                <button type="button" onClick={addTransition}
                    style={{ border:'none',background:'#3858e9',color:'#fff',borderRadius:'3px',padding:'4px 12px',fontSize:'14px',cursor:'pointer' }}>+ Add</button>
            </div>

            {list.length > 1 && (
                <div style={{ display:'flex',gap:'4px',marginBottom:'6px',flexWrap:'wrap' }}>
                    {list.map((t, i) => (
                        <button key={i} type="button"
                            style={{ padding:'3px 10px',fontSize:'14px',borderRadius:'3px',cursor:'pointer',
                                border: '1px solid #d0d0d0', background: '#fff', color: '#666', }}>
                            #{i+1} {t.property || 'all'}
                        </button>
                    ))}
                </div>
            )}

            {list.map((t, idx) => (
                <div key={idx} style={{ padding:'6px',background:'#f9fafc',borderRadius:'4px',border:'1px solid #e8ecf1',marginBottom:'6px' }}>
                    <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'4px' }}>
                        <span style={{ fontSize:'14px',fontWeight:600,color:'#1e1e1e' }}>#{idx + 1}</span>
                        <button type="button" onClick={() => removeTransition(idx)}
                            style={{ border:'none',background:'none',color:'#cc0000',cursor:'pointer',fontSize:'14px',padding:0 }}>{__('Remove','snn')}</button>
                    </div>

                    {/* Property */}
                    <C.CompactSelect label={__('Property','snn')} value={t.property || 'all'}
                        options={propertyOpts} onChange={v => updateTransition(idx, 'property', v)} />

                    {/* Duration & Delay */}
                    <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:'4px',marginBottom:'3px' }}>
                        <div>
                            <span style={{ fontSize:'14px',color:'#1e1e1e',display:'block',fontWeight:500 }}>{__('Duration','snn')}</span>
                            <input type="text" value={t.duration || '0.3s'} onChange={e => updateTransition(idx, 'duration', e.target.value)}
                                placeholder="0.3s" style={tinyInp} />
                        </div>
                        <div>
                            <span style={{ fontSize:'14px',color:'#1e1e1e',display:'block',fontWeight:500 }}>{__('Delay','snn')}</span>
                            <input type="text" value={t.delay || '0s'} onChange={e => updateTransition(idx, 'delay', e.target.value)}
                                placeholder="0s" style={tinyInp} />
                        </div>
                    </div>

                    {/* Timing */}
                    <span style={{ fontSize:'14px',color:'#1e1e1e',display:'block',fontWeight:500,marginBottom:'2px' }}>{__('Easing','snn')}</span>
                    <div style={{ display:'flex',gap:'4px',flexWrap:'wrap',marginBottom:'3px' }}>
                        {EASING_PRESETS.map(e => (
                            <button key={e.value} type="button" onClick={() => updateTransition(idx, 'timing', e.value)}
                                style={{ padding:'3px 8px',fontSize:'14px',borderRadius:'3px',cursor:'pointer',
                                    border: t.timing===e.value ? '2px solid #3858e9' : '1px solid #d0d0d0',
                                    background: t.timing===e.value ? '#f0f6ff' : '#fff',
                                    color: t.timing===e.value ? '#3858e9' : '#666',fontWeight:500 }}>
                                {e.label}
                            </button>
                        ))}
                    </div>
                    <input type="text" value={t.timing || 'ease'} onChange={e => updateTransition(idx, 'timing', e.target.value)}
                        placeholder="cubic-bezier(0.34,1.56,0.64,1)" style={{ ...tinyInp,textAlign:'center' }} />

                    {/* Preview */}
                    <div style={{ marginTop:'4px',fontSize:'14px',fontFamily:'monospace',color:'#666',padding:'4px',background:'#e8ecf1',borderRadius:'3px',wordBreak:'break-all' }}>
                        {buildCSS(t)}
                    </div>
                </div>
            ))}
        </div>
    );
};

/* ═══════════════════════════════════════════════
   KEYFRAME ANIMATION BUILDER
   ═══════════════════════════════════════════════ */
C.AnimationBuilder = ({ animations, onChange, device }) => {
    const list = animations || [];

    const addAnimation = () => {
        onChange([...list, {
            name: 'fadeIn', duration: '0.5s', timing: 'ease', delay: '0s',
            iterationCount: '1', direction: 'normal', fillMode: 'forwards',
        }]);
    };

    const removeAnimation = (idx) => {
        onChange(list.filter((_, i) => i !== idx));
    };

    const updateAnimation = (idx, key, value) => {
        onChange(list.map((a, i) => i === idx ? { ...a, [key]: value } : a));
    };

    const directionOpts = [
        { value: 'normal', label: __('Normal','snn') },
        { value: 'reverse', label: __('Reverse','snn') },
        { value: 'alternate', label: __('Alternate','snn') },
        { value: 'alternate-reverse', label: __('Alt Reverse','snn') },
    ];

    const fillModeOpts = [
        { value: 'none', label: __('None','snn') },
        { value: 'forwards', label: __('Forwards','snn') },
        { value: 'backwards', label: __('Backwards','snn') },
        { value: 'both', label: __('Both','snn') },
    ];

    return (
        <div style={{ marginBottom: '14px' }}>
            <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'6px' }}>
                <C.RespLabel label={__('Animation','snn')} device={device} />
                <button type="button" onClick={addAnimation}
                    style={{ border:'none',background:'#3858e9',color:'#fff',borderRadius:'3px',padding:'4px 12px',fontSize:'14px',cursor:'pointer' }}>+ Add</button>
            </div>

            {list.map((a, idx) => (
                <div key={idx} style={{ padding:'6px',background:'#f9fafc',borderRadius:'4px',border:'1px solid #e8ecf1',marginBottom:'6px' }}>
                    <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'4px' }}>
                        <span style={{ fontSize:'14px',fontWeight:600,color:'#1e1e1e' }}>#{idx + 1}</span>
                        <button type="button" onClick={() => removeAnimation(idx)}
                            style={{ border:'none',background:'none',color:'#cc0000',cursor:'pointer',fontSize:'14px',padding:0 }}>{__('Remove','snn')}</button>
                    </div>

                    {/* Name */}
                    <div style={{ display:'flex',alignItems:'center',gap:'4px',marginBottom:'3px' }}>
                        <span style={{ fontSize:'14px',fontWeight:500,textTransform:'uppercase',color:'#1e1e1e',minWidth:'64px' }}>{__('Name','snn')}</span>
                        <input type="text" value={a.name || 'fadeIn'} onChange={e => updateAnimation(idx, 'name', e.target.value)}
                            placeholder="fadeIn" style={{ flex:1,padding:'4px 6px',fontSize:'14px',fontFamily:'monospace',border:'1px solid #949494',borderRadius:'3px',lineHeight:'20px',boxSizing:'border-box' }} />
                    </div>

                    {/* Duration & Delay */}
                    <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:'4px',marginBottom:'3px' }}>
                        <div>
                            <span style={{ fontSize:'14px',color:'#1e1e1e',display:'block',fontWeight:500 }}>{__('Duration','snn')}</span>
                            <input type="text" value={a.duration || '0.5s'} onChange={e => updateAnimation(idx, 'duration', e.target.value)}
                                placeholder="0.5s" style={tinyInp} />
                        </div>
                        <div>
                            <span style={{ fontSize:'14px',color:'#1e1e1e',display:'block',fontWeight:500 }}>{__('Delay','snn')}</span>
                            <input type="text" value={a.delay || '0s'} onChange={e => updateAnimation(idx, 'delay', e.target.value)}
                                placeholder="0s" style={tinyInp} />
                        </div>
                    </div>

                    {/* Timing */}
                    <span style={{ fontSize:'14px',color:'#1e1e1e',display:'block',fontWeight:500,marginBottom:'2px' }}>{__('Easing','snn')}</span>
                    <div style={{ display:'flex',gap:'4px',flexWrap:'wrap',marginBottom:'3px' }}>
                        {EASING_PRESETS.map(e => (
                            <button key={e.value} type="button" onClick={() => updateAnimation(idx, 'timing', e.value)}
                                style={{ padding:'3px 8px',fontSize:'14px',borderRadius:'3px',cursor:'pointer',
                                    border: a.timing===e.value ? '2px solid #3858e9' : '1px solid #d0d0d0',
                                    background: a.timing===e.value ? '#f0f6ff' : '#fff',
                                    color: a.timing===e.value ? '#3858e9' : '#666',fontWeight:500 }}>
                                {e.label}
                            </button>
                        ))}
                    </div>

                    {/* Iteration Count */}
                    <div style={{ display:'flex',alignItems:'center',gap:'4px',marginBottom:'3px' }}>
                        <span style={{ fontSize:'14px',fontWeight:500,textTransform:'uppercase',color:'#1e1e1e',minWidth:'64px' }}>{__('Repeat','snn')}</span>
                        <input type="text" value={a.iterationCount || '1'} onChange={e => updateAnimation(idx, 'iterationCount', e.target.value)}
                            placeholder="1 or infinite" style={{ flex:1,padding:'4px 6px',fontSize:'14px',fontFamily:'monospace',border:'1px solid #949494',borderRadius:'3px',lineHeight:'20px',boxSizing:'border-box' }} />
                    </div>

                    {/* Direction & Fill */}
                    <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:'4px',marginBottom:'3px' }}>
                        <C.CompactSelect label={__('Dir','snn')} value={a.direction || 'normal'} options={directionOpts}
                            onChange={v => updateAnimation(idx, 'direction', v)} />
                        <C.CompactSelect label={__('Fill','snn')} value={a.fillMode || 'forwards'} options={fillModeOpts}
                            onChange={v => updateAnimation(idx, 'fillMode', v)} />
                    </div>

                    {/* Preview */}
                    <div style={{ marginTop:'4px',fontSize:'14px',fontFamily:'monospace',color:'#666',padding:'4px',background:'#e8ecf1',borderRadius:'3px',wordBreak:'break-all' }}>
                        {a.name} {a.duration} {a.timing} {a.delay} {a.iterationCount} {a.direction} {a.fillMode}
                    </div>
                </div>
            ))}
        </div>
    );
};
