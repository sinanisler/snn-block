/**
 * Background Control — Penpot-inspired background builder with gradient support.
 * Attached to: window.SNNControls.BackgroundControl, .GradientBuilder
 *
 * Supports: color, image, size, position, repeat, attachment, overlay,
 * plus linear/radial/conic gradient builder with multiple color stops.
 */
const { __ } = wp.i18n;
const { useState } = wp.element;
const C = window.SNNControls = window.SNNControls || {};

/* ─── Background Size Options ─── */
const BG_SIZE_OPTS = [
    { value: 'auto',    label: __('Auto','snn') },
    { value: 'cover',   label: __('Cover','snn') },
    { value: 'contain', label: __('Contain','snn') },
    { value: 'custom',  label: __('Custom','snn') },
];

const BG_POS_OPTS = [
    { value: 'center center', label: 'Center' },
    { value: 'top left',      label: 'Top Left' },
    { value: 'top center',    label: 'Top Center' },
    { value: 'top right',     label: 'Top Right' },
    { value: 'center left',   label: 'Center Left' },
    { value: 'center right',  label: 'Center Right' },
    { value: 'bottom left',   label: 'Bottom Left' },
    { value: 'bottom center', label: 'Bottom Center' },
    { value: 'bottom right',  label: 'Bottom Right' },
    { value: 'custom',        label: 'Custom' },
];

const BG_REPEAT_OPTS = [
    { value: 'no-repeat', label: __('No Repeat','snn') },
    { value: 'repeat',    label: __('Repeat','snn') },
    { value: 'repeat-x',  label: __('Repeat X','snn') },
    { value: 'repeat-y',  label: __('Repeat Y','snn') },
    { value: 'space',     label: __('Space','snn') },
    { value: 'round',     label: __('Round','snn') },
];

const BG_ATTACH_OPTS = [
    { value: 'scroll', label: __('Scroll','snn') },
    { value: 'fixed',  label: __('Fixed','snn') },
    { value: 'local',  label: __('Local','snn') },
];

const tinyInp = { flex:1,padding:'4px 6px',fontSize:'14px',fontFamily:'monospace',border:'1px solid #949494',borderRadius:'3px',lineHeight:'20px',boxSizing:'border-box',minWidth:0 };
const selStyle = { fontSize:'14px',padding:'3px 6px',border:'1px solid #949494',borderRadius:'3px',height:'26px',flex:1,background:'#fff',minWidth:0 };

/* ═══════════════════════════════════════════════
   GRADIENT BUILDER
   ═══════════════════════════════════════════════ */
C.GradientBuilder = ({ value, onChange }) => {
    // Parse existing gradient or create default
    const parseGradient = (v) => {
        if (!v || typeof v !== 'string') return { type: 'linear', angle: '90', stops: [{ color: '#000000', pos: '0%' }, { color: '#ffffff', pos: '100%' }] };
        const match = v.match(/^(linear-gradient|radial-gradient|conic-gradient)\((.+)\)$/);
        if (!match) return { type: 'linear', angle: '90', stops: [{ color: '#000000', pos: '0%' }, { color: '#ffffff', pos: '100%' }] };

        const type = match[1].replace('-gradient','');
        let inner = match[2];

        // Extract angle for linear/conic
        let angle = '90';
        if (type === 'linear') {
            const angMatch = inner.match(/^(\d+)(?:deg)\s*,/);
            if (angMatch) { angle = angMatch[1]; inner = inner.slice(angMatch[0].length); }
        } else if (type === 'conic') {
            const angMatch = inner.match(/from\s+(\d+)(?:deg)\s*/);
            if (angMatch) { angle = angMatch[1]; inner = inner.replace(angMatch[0], ''); }
            // Handle "at center"
            inner = inner.replace(/at\s+center\s*,?\s*/, '');
        } else if (type === 'radial') {
            angle = 'circle';
            inner = inner.replace(/circle\s+at\s+center\s*,?\s*/, '').replace(/circle\s*,?\s*/, '');
        }

        // Parse color stops
        const stops = [];
        const stopParts = inner.split(',').map(s => s.trim()).filter(Boolean);
        stopParts.forEach(part => {
            const colorMatch = part.match(/^((?:#(?:[0-9a-fA-F]{3,8})|rgba?\([^)]+\)|hsla?\([^)]+\)|[a-z]+))\s*(\d+%)?$/);
            if (colorMatch) {
                stops.push({ color: colorMatch[1], pos: colorMatch[2] || '' });
            }
        });
        if (stops.length < 2) {
            stops.push({ color: '#ffffff', pos: '100%' });
        }
        return { type, angle, stops };
    };

    const [gradient, setGradient] = useState(parseGradient(value));

    const buildCSS = (g) => {
        const stopsStr = g.stops.map(s => `${s.color}${s.pos ? ' ' + s.pos : ''}`).join(', ');
        if (g.type === 'linear') return `linear-gradient(${g.angle}deg, ${stopsStr})`;
        if (g.type === 'radial') return `radial-gradient(circle at center, ${stopsStr})`;
        return `conic-gradient(from ${g.angle}deg at center, ${stopsStr})`;
    };

    const update = (g) => {
        setGradient(g);
        onChange(buildCSS(g));
    };

    const addStop = () => {
        const last = gradient.stops[gradient.stops.length - 1];
        const newStop = { color: last ? last.color : '#888888', pos: '' };
        update({ ...gradient, stops: [...gradient.stops, newStop] });
    };

    const removeStop = (idx) => {
        if (gradient.stops.length <= 2) return;
        update({ ...gradient, stops: gradient.stops.filter((_, i) => i !== idx) });
    };

    const updateStop = (idx, key, val) => {
        const stops = gradient.stops.map((s, i) => i === idx ? { ...s, [key]: val } : s);
        update({ ...gradient, stops });
    };

    return (
        <div style={{ marginBottom:'6px', padding:'8px', background:'#f9fafc', borderRadius:'4px', border:'1px solid #e8ecf1' }}>
            {/* Type selector */}
            <div style={{ display:'flex',gap:'4px',marginBottom:'6px' }}>
                {['linear','radial','conic'].map(t => (
                    <button key={t} type="button" onClick={() => update({ ...gradient, type: t })}
                        style={{ flex:1,padding:'4px',fontSize:'14px',fontWeight:600,borderRadius:'3px',cursor:'pointer',
                            border: gradient.type===t ? '2px solid #3858e9' : '1px solid #d0d0d0',
                            background: gradient.type===t ? '#f0f6ff' : '#fff',
                            color: gradient.type===t ? '#3858e9' : '#666', }}>
                        {t.charAt(0).toUpperCase()+t.slice(1)}
                    </button>
                ))}
            </div>

            {/* Angle (linear/conic only) */}
            {(gradient.type === 'linear' || gradient.type === 'conic') && (
                <div style={{ display:'flex',alignItems:'center',gap:'4px',marginBottom:'6px' }}>
                    <span style={{ fontSize:'14px',fontWeight:500,color:'#1e1e1e',minWidth:'48px' }}>{__('Angle','snn')}</span>
                    <input type="range" min="0" max="360" value={gradient.angle}
                        onChange={e => update({ ...gradient, angle: e.target.value })}
                        style={{ flex:1,height:'14px',margin:0,cursor:'pointer' }} />
                    <span style={{ fontSize:'14px',fontFamily:'monospace',color:'#1e1e1e',minWidth:'36px',textAlign:'right' }}>{gradient.angle}°</span>
                </div>
            )}

            {/* Gradient preview bar */}
            <div style={{ height:'20px',borderRadius:'3px',marginBottom:'8px',border:'1px solid #d0d0d0',
                background: buildCSS(gradient) }}>
            </div>

            {/* Color stops */}
            {gradient.stops.map((stop, idx) => (
                <div key={idx} style={{ display:'flex',alignItems:'center',gap:'4px',marginBottom:'3px' }}>
                    <span style={{ fontSize:'14px',fontWeight:500,color:'#1e1e1e',minWidth:'20px' }}>{idx + 1}</span>
                    <input type="color" value={stop.color} onChange={e => updateStop(idx, 'color', e.target.value)}
                        style={{ width:'28px',height:'26px',padding:0,border:'1px solid #949494',borderRadius:'3px',cursor:'pointer',flexShrink:0 }} />
                    <input type="text" value={stop.color} onChange={e => updateStop(idx, 'color', e.target.value)}
                        placeholder="#333" style={{ ...tinyInp,width:'70px',flex:'none' }} />
                    <input type="text" value={stop.pos} onChange={e => updateStop(idx, 'pos', e.target.value)}
                        placeholder="0%" style={{ ...tinyInp,width:'50px',flex:'none' }} />
                    {gradient.stops.length > 2 && (
                        <button type="button" onClick={() => removeStop(idx)}
                            style={{ border:'none',background:'none',color:'#cc0000',cursor:'pointer',fontSize:'16px',padding:'0 2px',lineHeight:1,flexShrink:0 }}>×</button>
                    )}
                </div>
            ))}

            <div style={{ display:'flex',gap:'4px',marginTop:'4px' }}>
                <button type="button" onClick={addStop}
                    style={{ width:'100%',border:'1px dashed #949494',background:'#fff',color:'#666',borderRadius:'3px',padding:'4px',fontSize:'14px',cursor:'pointer' }}>
                    + {__('Add Stop','snn')}
                </button>
            </div>
        </div>
    );
};

/* ═══════════════════════════════════════════════
   GRADIENT LAYER EDITOR (multi-gradient repeater)
   ═══════════════════════════════════════════════ */
C.GradientLayerEditor = ({ layers, onChange, title }) => {
    const [activeIndex, setActiveIndex] = useState(0);
    const list = layers || [];

    const addLayer = () => {
        onChange([...list, { css: 'linear-gradient(90deg, #000000, #ffffff)' }]);
        setActiveIndex(list.length);
    };
    const removeLayer = (idx) => {
        const updated = list.filter((_, i) => i !== idx);
        onChange(updated);
        setActiveIndex(Math.min(activeIndex, Math.max(0, updated.length - 1)));
    };
    const updateLayer = (idx, newCSS) => {
        onChange(list.map((l, i) => i === idx ? { css: newCSS } : l));
    };

    const current = list[activeIndex] || null;
    const combinedCSS = list.map(l => l.css || '').filter(Boolean).join(', ');

    return (
        <div style={{ marginBottom:'8px' }}>
            <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'6px' }}>
                <span style={{ fontSize:'14px',fontWeight:600,textTransform:'uppercase',color:'#1e1e1e' }}>
                    {title || __('Gradients','snn')}
                    {list.length > 0 && <span style={{ fontWeight:400,color:'#757575',marginLeft:'6px' }}>({list.length})</span>}
                </span>
                <button type="button" onClick={addLayer}
                    style={{ border:'none',background:'#3858e9',color:'#fff',borderRadius:'3px',padding:'4px 12px',fontSize:'14px',cursor:'pointer' }}>
                    + {__('Add','snn')}
                </button>
            </div>

            {list.length > 0 && (
                <div style={{ height:'24px',borderRadius:'3px',marginBottom:'8px',border:'1px solid #d0d0d0',background:combinedCSS}}></div>
            )}

            {list.length > 1 && (
                <div style={{ display:'flex',gap:'4px',marginBottom:'6px',flexWrap:'wrap' }}>
                    {list.map((l, i) => (
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
                    <C.GradientBuilder value={current.css || ''}
                        onChange={v => updateLayer(activeIndex, v)} />
                    <button type="button" onClick={() => removeLayer(activeIndex)}
                        style={{ border:'none',background:'none',color:'#cc0000',fontSize:'14px',cursor:'pointer',padding:'4px 0',marginTop:'2px' }}>
                        {__('Remove this gradient','snn')}
                    </button>
                </div>
            )}

            {list.length === 0 && (
                <div style={{ padding:'12px',background:'#f9fafc',borderRadius:'4px',border:'1px dashed #d0d0d0',textAlign:'center',fontSize:'14px',color:'#757575' }}>
                    {__('No gradients added yet. Click "+ Add" to create one.','snn')}
                </div>
            )}
        </div>
    );
};

/* ═══════════════════════════════════════════════
   BACKGROUND CONTROL (full — multi-gradient + gradient overlay)
   ═══════════════════════════════════════════════ */
C.BackgroundControl = ({ attributes, setAttributes, device }) => {
    const bgColor = (Array.isArray(attributes.bgColor) ? {} : (attributes.bgColor || {}));
    const bgImage = attributes.bgImage || { id: 0, url: '', alt: '' };
    const bgSize = attributes.bgSize || 'cover';
    const bgPosition = attributes.bgPosition || 'center center';
    const bgRepeat = attributes.bgRepeat || 'no-repeat';
    const bgAttachment = attributes.bgAttachment || 'scroll';
    const bgGradients = (Array.isArray(attributes.bgGradients) ? attributes.bgGradients :
        (attributes.bgGradient ? [{ css: attributes.bgGradient }] : []));
    const bgOverlay = (Array.isArray(attributes.bgOverlay) ? {} : (attributes.bgOverlay || {}));
    const bgBlendMode = attributes.bgBlendMode || 'normal';

    const [showAdvanced, setShowAdvanced] = useState(false);
    const [overlayMode, setOverlayMode] = useState(bgOverlay.gradient ? 'gradient' : 'color');

    const previewBgLayers = [];
    bgGradients.forEach(g => { if (g.css) previewBgLayers.push(g.css); });
    if (bgImage.url) previewBgLayers.push('url(' + bgImage.url + ')');

    return (
        <div style={{ marginBottom: '14px' }}>
            <C.RespLabel label={__('Background','snn')} device={device} />

            <C.ColorRow label={__('Bg Color','snn')} value={bgColor[device] || ''}
                onChange={v => setAttributes({ bgColor: { ...bgColor, [device]: v } })} />

            {/* ── GRADIENT LAYERS (multi-repeater) ── */}
            <C.GradientLayerEditor
                layers={bgGradients}
                onChange={v => setAttributes({ bgGradients: v })}
                title={__('Gradients','snn')}
            />

            {/* Image */}
            <div style={{ marginBottom:'4px' }}>
                <div style={{ display:'flex',alignItems:'center',gap:'4px',marginBottom:'4px' }}>
                    <span style={{ fontSize:'14px',fontWeight:500,textTransform:'uppercase',color:'#1e1e1e',minWidth:'64px' }}>{__('Image','snn')}</span>
                    <input type="text" value={bgImage.url || ''} onChange={e => setAttributes({ bgImage: { ...bgImage, url: e.target.value } })}
                        placeholder="https://..." style={{ ...tinyInp,flex:1 }} />
                    {typeof wp !== 'undefined' && wp.media && (
                        <button type="button" onClick={() => {
                            const frame = wp.media({ title: __('Select Background','snn'), button: { text: __('Use Image','snn') }, multiple: false });
                            frame.on('select', () => {
                                const attachment = frame.state().get('selection').first().toJSON();
                                setAttributes({ bgImage: { id: attachment.id, url: attachment.url, alt: attachment.alt || '' } });
                            });
                            frame.open();
                        }}
                        style={{ border:'1px solid #949494',background:'#fff',borderRadius:'3px',padding:'4px 8px',fontSize:'14px',cursor:'pointer',whiteSpace:'nowrap',flexShrink:0 }}>
                            <i className="fa-solid fa-image"></i>
                        </button>
                    )}
                    {bgImage.url && (
                        <button type="button" onClick={() => setAttributes({ bgImage: { id: 0, url: '', alt: '' } })}
                            style={{ border:'none',background:'none',color:'#cc0000',cursor:'pointer',fontSize:'16px',padding:'0 2px',lineHeight:1,flexShrink:0 }}>×</button>
                    )}
                </div>
            </div>

            {/* Advanced toggle */}
            {(bgImage.url || bgGradients.length > 0) && (
                <button type="button" onClick={() => setShowAdvanced(!showAdvanced)}
                    style={{ border:'none',background:'none',color:'#3858e9',fontSize:'14px',cursor:'pointer',padding:'2px 0',marginBottom:'4px' }}>
                    {showAdvanced ? '▾ ' : '▸ '}{__('Advanced','snn')}
                </button>
            )}

            {showAdvanced && (
                <div style={{ padding:'6px',background:'#f9fafc',borderRadius:'4px',border:'1px solid #e8ecf1',marginBottom:'8px' }}>
                    <C.CompactSelect label={__('Size','snn')} value={bgSize || 'cover'} options={BG_SIZE_OPTS}
                        onChange={v => setAttributes({ bgSize: v })} />
                    {bgSize === 'custom' && (
                        <div style={{ display:'flex',gap:'4px',marginBottom:'3px' }}>
                            <input type="text" value={bgSize} onChange={e => setAttributes({ bgSize: e.target.value })}
                                placeholder="100% auto" style={{ ...tinyInp,flex:1 }} />
                        </div>
                    )}
                    <C.CompactSelect label={__('Position','snn')} value={bgPosition || 'center center'} options={BG_POS_OPTS}
                        onChange={v => setAttributes({ bgPosition: v })} />
                    <C.CompactSelect label={__('Repeat','snn')} value={bgRepeat || 'no-repeat'} options={BG_REPEAT_OPTS}
                        onChange={v => setAttributes({ bgRepeat: v })} />
                    <C.CompactSelect label={__('Attach','snn')} value={bgAttachment || 'scroll'} options={BG_ATTACH_OPTS}
                        onChange={v => setAttributes({ bgAttachment: v })} />
                    <C.BlendModeSelect label={__('Bg Blend','snn')} value={bgBlendMode}
                        onChange={v => setAttributes({ bgBlendMode: v })} />
                </div>
            )}

            {/* ── OVERLAY (Color or Gradient) ── */}
            <div style={{ marginBottom:'8px', padding:'8px', background:'#f9fafc', borderRadius:'4px', border:'1px solid #e8ecf1' }}>
                <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'6px' }}>
                    <span style={{ fontSize:'14px',fontWeight:600,textTransform:'uppercase',color:'#1e1e1e' }}>{__('Overlay','snn')}</span>
                    <div style={{ display:'flex',gap:'2px' }}>
                        <button type="button" onClick={() => { setOverlayMode('color'); setAttributes({ bgOverlay: { ...bgOverlay, gradient: '' } }); }}
                            style={{ padding:'3px 8px',fontSize:'14px',borderRadius:'3px',cursor:'pointer',
                                border: overlayMode==='color'?'2px solid #3858e9':'1px solid #d0d0d0',
                                background: overlayMode==='color'?'#f0f6ff':'#fff',
                                color: overlayMode==='color'?'#3858e9':'#666',fontWeight:500 }}>
                            {__('Color','snn')}
                        </button>
                        <button type="button" onClick={() => setOverlayMode('gradient')}
                            style={{ padding:'3px 8px',fontSize:'14px',borderRadius:'3px',cursor:'pointer',
                                border: overlayMode==='gradient'?'2px solid #3858e9':'1px solid #d0d0d0',
                                background: overlayMode==='gradient'?'#f0f6ff':'#fff',
                                color: overlayMode==='gradient'?'#3858e9':'#666',fontWeight:500 }}>
                            {__('Gradient','snn')}
                        </button>
                    </div>
                </div>

                {overlayMode === 'color' ? (
                    <div>
                        <div style={{ display:'flex',alignItems:'center',gap:'4px',marginBottom:'4px' }}>
                            <span style={{ fontSize:'14px',fontWeight:500,color:'#1e1e1e',minWidth:'48px' }}>{__('Color','snn')}</span>
                            <input type="color" value={bgOverlay.color || '#000000'} onChange={e => setAttributes({ bgOverlay: { ...bgOverlay, color: e.target.value, gradient: '' } })}
                                style={{ width:'28px',height:'26px',padding:0,border:'1px solid #949494',borderRadius:'3px',cursor:'pointer',flexShrink:0 }} />
                            <input type="text" value={bgOverlay.color || ''} onChange={e => setAttributes({ bgOverlay: { ...bgOverlay, color: e.target.value, gradient: '' } })}
                                placeholder="#000" style={{ ...tinyInp,flex:1 }} />
                        </div>
                        <div style={{ display:'flex',alignItems:'center',gap:'4px' }}>
                            <span style={{ fontSize:'14px',fontWeight:500,color:'#1e1e1e',minWidth:'48px' }}>{__('Opacity','snn')}</span>
                            <input type="range" min="0" max="100"
                                value={bgOverlay.opacity ? Math.round(parseFloat(bgOverlay.opacity) * 100) : 50}
                                onChange={e => setAttributes({ bgOverlay: { ...bgOverlay, opacity: String(parseInt(e.target.value) / 100), gradient: '' } })}
                                style={{ flex:1,height:'14px',margin:0,cursor:'pointer' }} />
                            <span style={{ fontSize:'14px',fontFamily:'monospace',color:'#1e1e1e',minWidth:'32px',textAlign:'right' }}>
                                {bgOverlay.opacity ? Math.round(parseFloat(bgOverlay.opacity) * 100) : 50}%
                            </span>
                        </div>
                    </div>
                ) : (
                    <div>
                        <C.GradientBuilder
                            value={bgOverlay.gradient || 'linear-gradient(90deg, #00000080, #00000000)'}
                            onChange={v => setAttributes({ bgOverlay: { ...bgOverlay, gradient: v, color: '' } })}
                        />
                        <div style={{ display:'flex',alignItems:'center',gap:'4px',marginTop:'4px' }}>
                            <span style={{ fontSize:'14px',fontWeight:500,color:'#1e1e1e',minWidth:'48px' }}>{__('Opacity','snn')}</span>
                            <input type="range" min="0" max="100"
                                value={bgOverlay.opacity ? Math.round(parseFloat(bgOverlay.opacity) * 100) : 70}
                                onChange={e => setAttributes({ bgOverlay: { ...bgOverlay, opacity: String(parseInt(e.target.value) / 100) } })}
                                style={{ flex:1,height:'14px',margin:0,cursor:'pointer' }} />
                            <span style={{ fontSize:'14px',fontFamily:'monospace',color:'#1e1e1e',minWidth:'32px',textAlign:'right' }}>
                                {bgOverlay.opacity ? Math.round(parseFloat(bgOverlay.opacity) * 100) : 70}%
                            </span>
                        </div>
                    </div>
                )}
            </div>

            {/* Preview bar */}
            <div style={{ height:'40px',borderRadius:'4px',marginTop:'8px',border:'1px solid #d0d0d0',
                backgroundImage: previewBgLayers.length ? previewBgLayers.join(', ') : 'none',
                backgroundSize: previewBgLayers.length ? bgSize : 'cover',
                backgroundPosition: previewBgLayers.length ? bgPosition : 'center center',
                backgroundRepeat: bgRepeat,
                backgroundAttachment: bgAttachment,
                backgroundColor: bgColor[device] || '#f5f5f5',
            }}>
            </div>
        </div>
    );
};
