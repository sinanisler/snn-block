/**
 * Color Row — Penpot-inspired color picker (native + hex text + alpha slider).
 * Attached to: window.SNNControls.ColorRow
 *
 * Penpot reference: Color picker with HEX/RGB/HSB/HSL models, opacity slider,
 * eyedropper, and color palette integration.
 */
const { useState, useEffect, useRef, useCallback } = wp.element;
const C = window.SNNControls = window.SNNControls || {};

/* ─── Internal: parse CSS color to { hex, alpha } ─── */
function _parseColor(val) {
    if (!val || typeof val !== 'string') return { hex: '000000', alpha: 1 };
    const s = val.trim();

    const rgba = s.match(/^rgba?\s*\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*(?:,\s*([\d.]+))?\s*\)$/i);
    if (rgba) {
        const toHex = (n) => parseInt(n,10).toString(16).padStart(2,'0');
        return { hex: toHex(rgba[1])+toHex(rgba[2])+toHex(rgba[3]), alpha: rgba[4]!==undefined?parseFloat(rgba[4]):1 };
    }
    const hex8 = s.match(/^#([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})$/);
    if (hex8) return { hex: hex8[1]+hex8[2]+hex8[3], alpha: Math.round((parseInt(hex8[4],16)/255)*100)/100 };
    const hex6 = s.match(/^#([0-9a-fA-F]{3,6})$/);
    if (hex6) { let h=hex6[1]; if(h.length===3)h=h[0]+h[0]+h[1]+h[1]+h[2]+h[2]; return {hex:h.toLowerCase(),alpha:1}; }
    if (/^(var\(|--)/.test(s)) return { hex:'000000',alpha:1,raw:s };
    try {
        if(typeof CSS!=='undefined'&&CSS.supports&&!CSS.supports('color',s)) return {hex:'000000',alpha:1,raw:s};
        const ctx=document.createElement('canvas').getContext('2d'); ctx.fillStyle=s;
        const r=ctx.fillStyle; if(r&&r!==s) return _parseColor(r);
    } catch(e){}
    return {hex:'000000',alpha:1,raw:s};
}

/* ─── Color Row ─── */
C.ColorRow = ({ label, value, onChange }) => {
    const parsed = _parseColor(value);
    const [hexVal, setHexVal] = useState(parsed.hex || '000000');
    const [alphaVal, setAlphaVal] = useState(parsed.alpha != null ? parsed.alpha : 1);
    const [textVal, setTextVal] = useState(value || '');
    const timerRef = useRef(null);
    const onChangeRef = useRef(onChange);
    onChangeRef.current = onChange;

    useEffect(() => {
        setTextVal(value || '');
        const p = _parseColor(value);
        setHexVal(p.hex || '000000');
        setAlphaVal(p.alpha != null ? p.alpha : 1);
    }, [value]);

    const buildColor = useCallback((hex, alpha) => {
        const h = String(hex || '000000').replace('#', '');
        if (alpha >= 1 || alpha == null) return '#' + h;
        return '#' + h + Math.round(alpha * 255).toString(16).padStart(2, '0');
    }, []);

    const commit = useCallback((v) => {
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => onChangeRef.current(v), 120);
    }, []);

    useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

    const handleColorInput = (e) => {
        const h = e.target.value.replace('#', '');
        setHexVal(h);
        const out = buildColor(h, alphaVal);
        setTextVal(out);
        commit(out);
    };

    const handleAlphaInput = (e) => {
        const a = parseFloat(e.target.value) / 100;
        setAlphaVal(a);
        const out = buildColor(hexVal, a);
        setTextVal(out);
        commit(out);
    };

    const handleTextInput = (e) => {
        const v = e.target.value;
        setTextVal(v);
        commit(v);
        const p = _parseColor(v);
        if (!p.raw) { setHexVal(p.hex || '000000'); setAlphaVal(p.alpha != null ? p.alpha : 1); }
    };

    const alphaPct = Math.round(alphaVal * 100);

    return (
        <div style={{ marginBottom: '4px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ fontSize: '14px', fontWeight: 600, textTransform: 'uppercase', color: '#1e1e1e', minWidth: '64px' }}>{label}</span>
                <input type="color" value={'#' + hexVal} onChange={handleColorInput}
                    style={{ width:'32px',height:'32px',padding:0,border:'1px solid #949494',borderRadius:'3px',cursor:'pointer',flexShrink:0 }} />
                <input type="text" value={textVal || ''} onChange={handleTextInput} placeholder="#333333"
                    style={{ flex:1,padding:'4px 6px',fontSize:'14px',fontFamily:'monospace',border:'1px solid #949494',borderRadius:'3px',lineHeight:'20px',boxSizing:'border-box',minWidth:0 }} />
            </div>
            <div style={{ display:'flex',alignItems:'center',gap:'4px',marginTop:'2px' }}>
                <input type="range" min="0" max="100" value={alphaPct} onChange={handleAlphaInput} title={'Opacity: '+alphaPct+'%'}
                    style={{ flex:1,height:'14px',margin:0,padding:0,cursor:'pointer',accentColor:'#'+hexVal,borderRadius:'7px' }} />
                <span style={{ fontSize:'14px',fontWeight:600,color:'#1e1e1e',minWidth:'32px',textAlign:'right',flexShrink:0 }}>{alphaPct}%</span>
            </div>
        </div>
    );
};
