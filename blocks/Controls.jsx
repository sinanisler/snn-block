/**
 * SNN Block Controls — Shared reusable editor components.
 *
 * Loaded before all block editor.jsx files via functions.php.
 * Exposed on window.SNNControls for use across blocks.
 *
 * Usage in any block editor.jsx:
 *   const { ColorRow, FontSizeRow, ToggleField, PaddingInput, ... } = window.SNNControls;
 */

const { __ } = wp.i18n;
const { __experimentalToggleGroupControl, __experimentalToggleGroupControlOption, SelectControl } = wp.components;

const C = window.SNNControls = window.SNNControls || {};

/* ═══════════════════════════════════════════════
   DEVICE / RESPONSIVE HELPERS
   ═══════════════════════════════════════════════ */

/* ─── Device badge ─── */
C.DeviceBadge = ({ device }) => (
    <span style={{
        display: 'inline-block', fontSize: '10px', fontWeight: 600,
        textTransform: 'uppercase', letterSpacing: '0.5px',
        background: device === 'desktop' ? '#3858e9' : device === 'tablet' ? '#7b5cf0' : '#f59e0b',
        color: '#fff', padding: '2px 6px', borderRadius: '3px', marginLeft: '6px', verticalAlign: 'middle',
    }}>{device}</span>
);

/* ─── Device-aware label row ─── */
C.RespLabel = ({ label, device }) => (
    <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: '4px', fontSize: '11px', fontWeight: 500, color: '#1e1e1e',
    }}>
        <span>{label} <C.DeviceBadge device={device} /></span>
    </div>
);

/* ═══════════════════════════════════════════════
   LAYOUT / INPUT CONTROLS
   ═══════════════════════════════════════════════ */

/* ─── ToggleGroupControl with SelectControl fallback ─── */
C.ToggleField = ({ label, value, options, onChange }) => {
    if (typeof __experimentalToggleGroupControl !== 'undefined') {
        return (
            <div style={{ marginBottom: '14px' }}>
                <label style={{ fontSize: '11px', fontWeight: 500, display: 'block', marginBottom: '4px', color: '#1e1e1e' }}>
                    {label}
                </label>
                <__experimentalToggleGroupControl
                    value={value}
                    onChange={onChange}
                    isBlock
                    __next40pxDefaultSize={true}
                    __nextHasNoMarginBottom={true}
                >
                    {options.map(opt => (
                        <__experimentalToggleGroupControlOption key={opt.value} label={opt.label} value={opt.value} />
                    ))}
                </__experimentalToggleGroupControl>
            </div>
        );
    }
    return <SelectControl label={label} value={value} options={options} onChange={onChange} />;
};

/* ─── Padding input (4-side grid) ─── */
C.PaddingInput = ({ values, onChange, device, label }) => {
    const sides = [
        { key: 'top', label: 'T' },
        { key: 'right', label: 'R' },
        { key: 'bottom', label: 'B' },
        { key: 'left', label: 'L' },
    ];
    return (
        <div style={{ marginBottom: '14px' }}>
            <C.RespLabel label={label || __('Padding', 'snn')} device={device} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' }}>
                {sides.map(s => (
                    <div key={s.key}>
                        <span style={{ fontSize: '9px', color: '#757575', display: 'block' }}>{s.label}</span>
                        <input
                            type="text"
                            value={values?.[s.key] || ''}
                            onChange={e => onChange({ ...values, [s.key]: e.target.value })}
                            placeholder="0"
                            style={{
                                width: '100%', padding: '4px 6px', fontSize: '12px',
                                border: '1px solid #ddd', borderRadius: '2px', boxSizing: 'border-box',
                            }}
                        />
                    </div>
                ))}
            </div>
        </div>
    );
};

/* ═══════════════════════════════════════════════
   COLOR CONTROL
   ═══════════════════════════════════════════════ */

/* ═══════════════════════════════════════════════
   COLOR PARSING HELPERS
   ═══════════════════════════════════════════════ */

/**
 * Parse a CSS color string into { hex (6-char), alpha (0-1) }.
 * Handles: #RGB, #RRGGBB, #RRGGBBAA, rgb(), rgba(), named/var fallback.
 */
function parseColor(val) {
    if (!val || typeof val !== 'string') return { hex: '000000', alpha: 1 };
    const s = val.trim();

    // rgba(r, g, b, a)
    const rgba = s.match(/^rgba?\s*\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*(?:,\s*([\d.]+))?\s*\)$/i);
    if (rgba) {
        const toHex = (n) => parseInt(n, 10).toString(16).padStart(2, '0');
        return {
            hex: toHex(rgba[1]) + toHex(rgba[2]) + toHex(rgba[3]),
            alpha: rgba[4] !== undefined ? parseFloat(rgba[4]) : 1,
        };
    }

    // #RRGGBBAA or #RGBA
    const hex8 = s.match(/^#([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})$/);
    if (hex8) {
        return {
            hex: hex8[1] + hex8[2] + hex8[3],
            alpha: Math.round((parseInt(hex8[4], 16) / 255) * 100) / 100,
        };
    }

    // #RRGGBB or #RGB
    const hex6 = s.match(/^#([0-9a-fA-F]{3,6})$/);
    if (hex6) {
        let h = hex6[1];
        if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
        return { hex: h.toLowerCase(), alpha: 1 };
    }

    // CSS variable, named color, etc. — return as-is, no parsing
    return { hex: '000000', alpha: 1, raw: s };
}

/* ═══════════════════════════════════════════════
   COLOR CONTROL  (native picker + alpha + text)
   ═══════════════════════════════════════════════ */

C.ColorRow = ({ label, value, onChange }) => {
    const { useState, useEffect, useRef, useCallback } = wp.element;
    const parsed = parseColor(value);
    const [hexVal, setHexVal] = useState(parsed.hex || '000000');
    const [alphaVal, setAlphaVal] = useState(parsed.alpha != null ? parsed.alpha : 1);
    const [textVal, setTextVal] = useState(value || '');
    const timerRef = useRef(null);
    const onChangeRef = useRef(onChange);
    onChangeRef.current = onChange;

    // Sync external value changes (device switch, undo, etc.)
    useEffect(() => {
        setTextVal(value || '');
        const p = parseColor(value);
        setHexVal(p.hex || '000000');
        setAlphaVal(p.alpha != null ? p.alpha : 1);
    }, [value]);

    // Build the final CSS color value from hex + alpha
    const buildColor = useCallback((hex, alpha) => {
        const h = String(hex || '000000').replace('#', '');
        if (alpha >= 1 || alpha == null) return '#' + h;
        const r = parseInt(h.substring(0, 2), 16);
        const g = parseInt(h.substring(2, 4), 16);
        const b = parseInt(h.substring(4, 6), 16);
        const a = Math.round(alpha * 100) / 100; // round to 2 decimals
        return 'rgba(' + r + ',' + g + ',' + b + ',' + a + ')';
    }, []);

    // Debounced commit
    const commit = useCallback((v) => {
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => {
            onChangeRef.current(v);
        }, 120);
    }, []);

    useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

    // ── handlers ──
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
        // Try to re-parse hexVal / alphaVal from typed value
        const p = parseColor(v);
        if (!p.raw) {
            setHexVal(p.hex || '000000');
            setAlphaVal(p.alpha != null ? p.alpha : 1);
        }
    };

    const alphaPct = Math.round(alphaVal * 100);

    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '3px' }}>
            <span style={{ fontSize: '11px', fontWeight: 500, textTransform: 'uppercase', color: '#1e1e1e', minWidth: '64px' }}>{label}</span>
            <input
                type="color"
                value={'#' + hexVal}
                onChange={handleColorInput}
                style={{ width: '26px', height: '22px', padding: 0, border: '1px solid #949494', borderRadius: '2px', cursor: 'pointer', flexShrink: 0 }}
            />
            {/* Alpha slider */}
            <input
                type="range"
                min="0" max="100"
                value={alphaPct}
                onChange={handleAlphaInput}
                title={'Opacity: ' + alphaPct + '%'}
                style={{
                    width: '36px', height: '14px', margin: 0, padding: 0,
                    cursor: 'pointer', flexShrink: 0,
                    accentColor: '#' + hexVal,
                    background: 'linear-gradient(to right, transparent, #' + hexVal + ')',
                    borderRadius: '7px',
                    appearance: 'none',
                }}
            />
            <span style={{ fontSize: '9px', color: '#757575', minWidth: '26px', textAlign: 'right', flexShrink: 0 }}>
                {alphaPct}%
            </span>
            <input
                type="text"
                value={textVal || ''}
                onChange={handleTextInput}
                placeholder="#333, rgb(0,0,0,.5), var(--wp--preset--color--primary)"
                style={{
                    flex: 1, padding: '1px 4px', fontSize: '11px', fontFamily: 'monospace',
                    border: '1px solid #949494', borderRadius: '2px', lineHeight: '18px',
                    boxSizing: 'border-box', minWidth: 0,
                }}
            />
        </div>
    );
};

/* ═══════════════════════════════════════════════
   TYPOGRAPHY CONTROLS
   ═══════════════════════════════════════════════ */

/* ─── Font size row: label + number + unit dropdown ─── */
C.FontSizeRow = ({ label, value, onChange, units = ['px', 'em', 'rem', 'vw', '%'] }) => {
    const strVal = String(value || '');
    const match = strVal.match(/^(-?[\d.]+)(.*)$/);
    const numVal = match ? match[1] : '';
    const unitVal = match && match[2] ? match[2] : 'px';

    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '3px' }}>
            <span style={{ fontSize: '11px', fontWeight: 500, textTransform: 'uppercase', color: '#1e1e1e', minWidth: '64px' }}>{label}</span>
            <input
                type="text"
                value={numVal}
                onChange={e => {
                    const v = e.target.value;
                    if (v === '') { onChange(''); return; }
                    const n = parseFloat(v);
                    if (!isNaN(n)) onChange(String(n) + unitVal);
                }}
                placeholder="16"
                style={{ width: '40px', padding: '1px 2px', fontSize: '11px', fontFamily: 'monospace', border: '1px solid #949494', borderRadius: '2px', textAlign: 'center', lineHeight: '18px', boxSizing: 'border-box' }}
            />
            <select
                value={unitVal}
                onChange={e => onChange(String(numVal || 0) + e.target.value)}
                style={{ fontSize: '10px', padding: '1px 2px', border: '1px solid #949494', borderRadius: '2px', lineHeight: '18px', background: '#fff', boxSizing: 'border-box', height: '22px' }}
            >
                {units.map(u => <option key={u} value={u}>{u}</option>)}
            </select>
        </div>
    );
};

/* ─── Text align row: label + toggle buttons ─── */
C.AlignRow = ({ label, value, onChange }) => {
    const opts = [
        { v: 'left',   l: '\u2264' },
        { v: 'center', l: '\u2265' },
        { v: 'right',  l: '\u2267' },
    ];
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '3px' }}>
            <span style={{ fontSize: '11px', fontWeight: 500, textTransform: 'uppercase', color: '#1e1e1e', minWidth: '64px' }}>{label}</span>
            {opts.map(o => (
                <button
                    key={o.v}
                    type="button"
                    onClick={() => onChange(o.v === value ? '' : o.v)}
                    style={{
                        width: '24px', height: '22px', border: '1px solid #949494', borderRadius: '2px',
                        background: value === o.v ? '#1e1e1e' : '#fff',
                        color: value === o.v ? '#fff' : '#1e1e1e',
                        cursor: 'pointer', fontSize: '11px', lineHeight: '20px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0,
                    }}
                >{o.l}</button>
            ))}
        </div>
    );
};

/* ─── Text transform row: label + Aa / AA / aa / Aa· buttons ─── */
C.TransformRow = ({ label, value, onChange }) => {
    const opts = [
        { v: '',           l: 'Aa' },
        { v: 'uppercase',  l: 'AA' },
        { v: 'lowercase',  l: 'aa' },
        { v: 'capitalize', l: 'Aa\u2022' },
    ];
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '3px' }}>
            <span style={{ fontSize: '11px', fontWeight: 500, textTransform: 'uppercase', color: '#1e1e1e', minWidth: '64px' }}>{label}</span>
            {opts.map(o => (
                <button
                    key={o.v}
                    type="button"
                    onClick={() => onChange(o.v === value ? '' : o.v)}
                    style={{
                        height: '22px', padding: '0 5px', border: '1px solid #949494', borderRadius: '2px',
                        background: value === o.v ? '#1e1e1e' : '#fff',
                        color: value === o.v ? '#fff' : '#1e1e1e',
                        cursor: 'pointer', fontSize: '10px', fontWeight: 600, lineHeight: '20px',
                    }}
                >{o.l}</button>
            ))}
        </div>
    );
};

/* ─── Compact select: label + dropdown on one line ─── */
C.CompactSelect = ({ label, value, options, onChange }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '3px' }}>
        <span style={{ fontSize: '11px', fontWeight: 500, textTransform: 'uppercase', color: '#1e1e1e', minWidth: '64px' }}>{label}</span>
        <select
            value={value || ''}
            onChange={e => onChange(e.target.value)}
            style={{
                fontSize: '11px', padding: '1px 4px', border: '1px solid #949494',
                borderRadius: '2px', lineHeight: '18px', background: '#fff',
                boxSizing: 'border-box', height: '22px',
            }}
        >
            {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
    </div>
);
