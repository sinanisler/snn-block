/**
 * Visual Effects Control — Backdrop Filter, Outline, Text Shadow, Clip Path, Object Fit, Aspect Ratio.
 * Attached to: window.SNNControls.BackdropFilterControl, .OutlineControl, .TextShadowControl,
 *   .ClipPathControl, .ObjectFitControl, .AspectRatioControl
 */
const { __ } = wp.i18n;
const C = window.SNNControls = window.SNNControls || {};

const tinyInp = { width:'100%',padding:'5px 8px',fontSize:'14px',fontFamily:'monospace',border:'1px solid #949494',borderRadius:'3px',boxSizing:'border-box',lineHeight:'20px' };

/* ─── Backdrop Filter Control ─── */
C.BackdropFilterControl = ({ filters, onChange, device }) => {
    const vals = filters || {};
    const filterDefs = [
        { key: 'blur',        label: __('Blur','snn'),        unit: 'px', min: 0, max: 50, step: 0.5, default: '0' },
        { key: 'brightness',  label: __('Brightness','snn'),  unit: '%',  min: 0, max: 300, step: 1, default: '100' },
        { key: 'contrast',    label: __('Contrast','snn'),    unit: '%',  min: 0, max: 300, step: 1, default: '100' },
        { key: 'grayscale',   label: __('Grayscale','snn'),   unit: '%',  min: 0, max: 100, step: 1, default: '0' },
        { key: 'hueRotate',   label: __('Hue Rotate','snn'),  unit: 'deg',min: 0, max: 360, step: 1, default: '0' },
        { key: 'invert',      label: __('Invert','snn'),      unit: '%',  min: 0, max: 100, step: 1, default: '0' },
        { key: 'saturate',    label: __('Saturate','snn'),    unit: '%',  min: 0, max: 300, step: 1, default: '100' },
        { key: 'sepia',       label: __('Sepia','snn'),       unit: '%',  min: 0, max: 100, step: 1, default: '0' },
    ];
    return (
        <div style={{ marginBottom: '14px' }}>
            <C.RespLabel label={__('Backdrop Filter','snn')} device={device} />
            {filterDefs.map(f => (
                <div key={f.key} style={{ display:'flex',alignItems:'center',gap:'4px',marginBottom:'3px' }}>
                    <span style={{ fontSize:'14px',color:'#1e1e1e',minWidth:'76px',textTransform:'uppercase',fontWeight:500 }}>{f.label}</span>
                    <input type="range" min={f.min} max={f.max} step={f.step}
                        value={parseFloat(vals[f.key]) || parseFloat(f.default)}
                        onChange={e => onChange({ ...vals, [f.key]: e.target.value })}
                        style={{ flex:1,height:'14px',margin:0,cursor:'pointer' }} />
                    <span style={{ fontSize:'14px',fontFamily:'monospace',color:'#1e1e1e',minWidth:'50px',textAlign:'right' }}>
                        {(vals[f.key] || f.default)}{f.unit}
                    </span>
                </div>
            ))}
        </div>
    );
};

/* ─── Outline Control ─── */
C.OutlineControl = ({ width, style, color, onWidthChange, onStyleChange, onColorChange, device }) => {
    const styleOpts = [
        { value: '',        label: '—' },
        { value: 'solid',   label: __('Solid','snn') },
        { value: 'dashed',  label: __('Dashed','snn') },
        { value: 'dotted',  label: __('Dotted','snn') },
        { value: 'double',  label: __('Double','snn') },
        { value: 'none',    label: __('None','snn') },
    ];
    return (
        <div style={{ marginBottom: '8px' }}>
            <C.RespLabel label={__('Outline','snn')} device={device} />
            <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:'4px',marginBottom:'4px' }}>
                <div>
                    <span style={{ fontSize:'14px',color:'#1e1e1e',display:'block',fontWeight:500 }}>{__('Width','snn')}</span>
                    <input type="text" value={width || ''} onChange={e => onWidthChange(e.target.value)}
                        placeholder="2px" style={tinyInp} />
                </div>
                <div>
                    <span style={{ fontSize:'14px',color:'#1e1e1e',display:'block',fontWeight:500 }}>{__('Offset','snn')}</span>
                    <input type="text" value={''} placeholder="0px" style={tinyInp} />
                </div>
            </div>
            <C.CompactSelect label={__('Style','snn')} value={style || ''} options={styleOpts} onChange={onStyleChange} />
            <C.ColorRow label={__('Color','snn')} value={color || ''} onChange={onColorChange} />
        </div>
    );
};

/* ─── Text Shadow Control ─── */
C.TextShadowControl = ({ shadows, onChange, device }) => {
    const list = shadows || [];
    const addShadow = () => {
        onChange([...list, { x: '0px', y: '2px', blur: '4px', color: '#00000040' }]);
    };
    const removeShadow = (idx) => {
        onChange(list.filter((_, i) => i !== idx));
    };
    const updateShadow = (idx, key, value) => {
        onChange(list.map((s, i) => i === idx ? { ...s, [key]: value } : s));
    };

    return (
        <div style={{ marginBottom: '14px' }}>
            <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'6px' }}>
                <C.RespLabel label={__('Text Shadow','snn')} device={device} />
                <button type="button" onClick={addShadow}
                    style={{ border:'none',background:'#3858e9',color:'#fff',borderRadius:'3px',padding:'4px 12px',fontSize:'14px',cursor:'pointer' }}>+ Add</button>
            </div>
            {list.map((s, idx) => (
                <div key={idx} style={{ padding:'6px',background:'#f9fafc',borderRadius:'4px',border:'1px solid #e8ecf1',marginBottom:'4px' }}>
                    <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'4px' }}>
                        <span style={{ fontSize:'14px',fontWeight:600,color:'#1e1e1e' }}>#{idx + 1}</span>
                        <button type="button" onClick={() => removeShadow(idx)}
                            style={{ border:'none',background:'none',color:'#cc0000',cursor:'pointer',fontSize:'14px',padding:0 }}>{__('Remove','snn')}</button>
                    </div>
                    <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'4px',marginBottom:'4px' }}>
                        {[
                            { key:'x', label:'X' }, { key:'y', label:'Y' }, { key:'blur', label:__('Blur','snn') },
                        ].map(f => (
                            <div key={f.key}>
                                <span style={{ fontSize:'14px',color:'#1e1e1e',display:'block',fontWeight:500 }}>{f.label}</span>
                                <input type="text" value={s[f.key] || ''} onChange={e => updateShadow(idx, f.key, e.target.value)}
                                    placeholder="0" style={tinyInp} />
                            </div>
                        ))}
                    </div>
                    <C.ColorRow label={__('Color','snn')} value={s.color || '#00000040'}
                        onChange={v => updateShadow(idx, 'color', v)} />
                </div>
            ))}
        </div>
    );
};

/* ─── Object Fit Control ─── */
C.ObjectFitControl = ({ label, value, onChange, device }) => {
    const opts = [
        { value: '',         label: '—' },
        { value: 'fill',     label: __('Fill','snn') },
        { value: 'contain',  label: __('Contain','snn') },
        { value: 'cover',    label: __('Cover','snn') },
        { value: 'none',     label: __('None','snn') },
        { value: 'scale-down', label: __('Scale Down','snn') },
    ];
    return <C.CompactSelect label={label || __('Object Fit','snn')} value={value || ''} options={opts} onChange={onChange} />;
};

/* ─── Aspect Ratio Control ─── */
C.AspectRatioControl = ({ label, value, onChange, device }) => (
    <div style={{ display:'flex',alignItems:'center',gap:'4px',marginBottom:'3px' }}>
        <span style={{ fontSize:'14px',fontWeight:500,textTransform:'uppercase',color:'#1e1e1e',minWidth:'64px' }}>{label || __('Aspect Ratio','snn')}</span>
        <input type="text" value={value || ''} onChange={e => onChange(e.target.value)}
            placeholder="16/9" style={{ flex:1,padding:'4px 6px',fontSize:'14px',fontFamily:'monospace',border:'1px solid #949494',borderRadius:'3px',lineHeight:'20px',boxSizing:'border-box' }} />
        {device && <C.DeviceBadge device={device} />}
    </div>
);

/* ─── Clip Path Control ─── */
C.ClipPathControl = ({ label, value, onChange, device }) => {
    const presets = [
        { value: '',            label: '—' },
        { value: 'circle(50%)', label: __('Circle','snn') },
        { value: 'ellipse(50% 50%)', label: __('Ellipse','snn') },
        { value: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)', label: __('Diamond','snn') },
        { value: 'polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%)', label: __('Pentagon','snn') },
        { value: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)', label: __('Hexagon','snn') },
        { value: 'polygon(0% 0%, 100% 0%, 100% 75%, 75% 75%, 75% 100%, 50% 75%, 0% 75%)', label: __('Notch','snn') },
    ];
    return (
        <div style={{ marginBottom:'8px' }}>
            <C.RespLabel label={label || __('Clip Path','snn')} device={device} />
            <div style={{ display:'flex',gap:'4px',marginBottom:'4px',flexWrap:'wrap' }}>
                {presets.map(p => (
                    <button key={p.value} type="button" onClick={() => onChange(p.value)}
                        style={{ padding:'3px 8px',fontSize:'14px',borderRadius:'3px',cursor:'pointer',
                            border: value===p.value ? '2px solid #3858e9' : '1px solid #d0d0d0',
                            background: value===p.value ? '#f0f6ff' : '#fff',
                            color: value===p.value ? '#3858e9' : '#666',fontWeight:500 }}>
                        {p.label}
                    </button>
                ))}
            </div>
            <input type="text" value={value || ''} onChange={e => onChange(e.target.value)}
                placeholder="circle(50%)" style={{ ...tinyInp,textAlign:'center' }} />
        </div>
    );
};
