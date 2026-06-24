/**
 * Flex & Grid Icon Controls — Bricks-inspired visual icon buttons
 * for direction, justify, align, wrap — replacing select dropdowns.
 * Attached to: window.SNNControls.DirectionIcons, .JustifyIcons, .AlignIcons, .WrapIcons
 */

const { __ } = wp.i18n;
const C = window.SNNControls = window.SNNControls || {};

/* ═══════════════════════════════════════════════
   SHARED STYLES & HELPERS
   ═══════════════════════════════════════════════ */

const iconBtnBase = {
    display:'inline-flex', alignItems:'center', justifyContent:'center',
    width:'28px', height:'26px', padding:0, border:'1px solid #d0d0d0',
    borderRadius:'3px', background:'#fff', cursor:'pointer',
    transition:'all 0.12s', boxSizing:'border-box', flexShrink:0,
};
const iconBtnActive = {
    borderColor:'#3858e9', background:'#f0f6ff',
};
const iconBtnReversed = {
    borderColor:'#e09000', background:'#fff8e6',
};

const svgStyle = (active, reversed) => ({
    width:'20px', height:'20px', display:'block',
    opacity: active ? 1 : 0.35,
    filter: reversed ? 'none' : undefined,
});

const labelRow = {
    display:'flex', alignItems:'center', justifyContent:'space-between',
    marginBottom:'4px', marginTop:'4px',
};
const labelText = {
    fontSize:'14px', fontWeight:600, textTransform:'uppercase', color:'#1e1e1e',
};
const iconRow = {
    display:'flex', gap:'3px', flexWrap:'wrap',
};

/* ═══════════════════════════════════════════════
   DIRECTION ICONS (row / column / reverse toggle)
   ═══════════════════════════════════════════════ */

// Horizontal icon  →  row
const IconRow = ({ active, reversed }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" style={svgStyle(active, reversed)}>
        <path fill={active ? (reversed ? '#e09000' : '#3858e9') : '#666'} fillRule="evenodd"
            d="M86 16h26v96H86zm-35 0h26v96H51zm-35 0h26v96H16z" />
    </svg>
);

// Vertical icon  →  column
const IconCol = ({ active, reversed }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" style={svgStyle(active, reversed)}>
        <path fill={active ? (reversed ? '#e09000' : '#3858e9') : '#666'} fillRule="evenodd"
            d="M16 86h96v26H16zm0-35h96v26H16zm0-35h96v26H16z" />
    </svg>
);

// Reverse icon
const IconReverse = ({ active }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" style={{ width:'16px', height:'16px', display:'block', opacity: active ? 1 : 0.25 }}>
        <g fill="none" fillRule="evenodd">
            <path fill={active ? '#e09000' : '#666'}
                d="M86 44H40c-5.523 0-10-4.477-10-10 0-5.403 4.38-9.783 9.783-9.783l.215.003 56.839 1.248A9.37 9.37 0 0 1 105.563 32H106v24h5.172a2 2 0 0 1 1.414 3.414L97.414 74.586a2 2 0 0 1-2.828 0L79.414 59.414A2 2 0 0 1 80.828 56H86z" />
            <path fill={active ? '#e09000' : '#666'}
                d="M42 84h48a8 8 0 0 1 8 8v4a8 8 0 0 1-8 8H30a8 8 0 0 1-7.996-7.75L22 96V72h-5.172a2 2 0 0 1-1.414-3.414l15.172-15.172a2 2 0 0 1 2.828 0l15.172 15.172A2 2 0 0 1 47.172 72H42z" />
        </g>
    </svg>
);

C.DirectionIcons = ({ value, onChange }) => {
    const isRow = value === 'row' || value === 'row-reverse';
    const isCol = value === 'column' || value === 'column-reverse';
    const isReversed = value === 'row-reverse' || value === 'column-reverse';

    const setDir = (base) => {
        if (value === base) {
            // Already in normal mode — toggle to reverse
            onChange(base + '-reverse');
        } else if (value === base + '-reverse') {
            // Already reversed — toggle to normal
            onChange(base);
        } else {
            // Different direction — set normal
            onChange(base);
        }
    };

    const toggleRev = () => {
        if (!value || value === '') return;
        if (isReversed) {
            onChange(value.replace('-reverse', ''));
        } else {
            onChange(value + '-reverse');
        }
    };

    return (
        <div style={{ marginBottom:'4px' }}>
            <div style={labelRow}>
                <span style={labelText}>{__('Direction','snn')}</span>
                <button type="button" onClick={toggleRev} title={__('Reverse','snn')}
                    disabled={!value}
                    style={{
                        ...iconBtnBase, width:'22px', height:'22px',
                        borderColor: isReversed ? '#e09000' : '#d0d0d0',
                        background: isReversed ? '#fff8e6' : '#fff',
                        opacity: value ? 1 : 0.3,
                    }}>
                    <IconReverse active={isReversed} />
                </button>
            </div>
            <div style={iconRow}>
                <button type="button" onClick={() => setDir('row')} title={__('Row','snn')}
                    style={{ ...iconBtnBase, ...(isRow ? (isReversed ? iconBtnReversed : iconBtnActive) : {}) }}>
                    <IconRow active={isRow} reversed={isRow && isReversed} />
                </button>
                <button type="button" onClick={() => setDir('column')} title={__('Column','snn')}
                    style={{ ...iconBtnBase, ...(isCol ? (isReversed ? iconBtnReversed : iconBtnActive) : {}) }}>
                    <IconCol active={isCol} reversed={isCol && isReversed} />
                </button>
            </div>
        </div>
    );
};

/* ═══════════════════════════════════════════════
   JUSTIFY CONTENT ICONS
   ═══════════════════════════════════════════════ */

const justifyIcons = [
    { value:'flex-start', label: __('Start','snn'), path: 'M0 0h128v8H0zm16 16h96v32H16zm0 40h96v32H16z' },
    { value:'center',     label: __('Center','snn'), path: 'M0 60h128v8H0zm16-40h96v32H16zm0 56h96v32H16z' },
    { value:'flex-end',   label: __('End','snn'), path: 'M0 120h128v8H0zm16-40h96v32H16zm0-40h96v32H16z' },
    { value:'space-between', label: __('Between','snn'), path: 'M0 120h128v8H0zM0 0h128v8H0zm16 12h96v32H16zm0 72h96v32H16z' },
    { value:'space-around',  label: __('Around','snn'), path: 'M0 120h128v8H0zM0 0h128v8H0zm16 20h96v32H16zm0 56h96v32H16z' },
    { value:'space-evenly',  label: __('Evenly','snn'), path: 'M0 120h128v8H0zM0 0h128v8H0zm16 24h96v32H16zm0 48h96v32H16z' },
];

C.JustifyIcons = ({ value, onChange, isGrid, label }) => {
    const icons = isGrid
        ? justifyIcons.map(i => ({ ...i, value: i.value.replace('flex-', '') }))
        : justifyIcons;
    // Add 'stretch' option for align-content in grid mode
    const allIcons = [...icons];
    if (isGrid) {
        allIcons.push({ value:'stretch', label: __('Stretch','snn'),
            path: 'M0 120h128v8H0zM0 0h128v8H0zm16 16h96v96H16z' });
    }
    const current = value || '';

    return (
        <div style={{ marginBottom:'4px' }}>
            <div style={labelRow}>
                <span style={labelText}>{label || (isGrid ? __('Justify','snn') : __('Justify','snn'))}</span>
            </div>
            <div style={iconRow}>
                {allIcons.map(ic => (
                    <button key={ic.value} type="button" onClick={() => onChange(ic.value)}
                        title={ic.label}
                        style={{ ...iconBtnBase, ...(current === ic.value ? iconBtnActive : {}) }}>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128"
                            style={{ width:'20px', height:'20px', display:'block', opacity: current === ic.value ? 1 : 0.35 }}>
                            <path fill={current === ic.value ? '#3858e9' : '#666'} fillRule="evenodd" d={ic.path} />
                        </svg>
                    </button>
                ))}
            </div>
        </div>
    );
};

/* ═══════════════════════════════════════════════
   ALIGN ITEMS ICONS
   ═══════════════════════════════════════════════ */

const alignIcons = [
    { value:'flex-start', label: __('Start','snn'),
        path: 'M0 0h8v128H0zm16 28h96v32H16zm0 40h96v32H16z' },
    { value:'center',     label: __('Center','snn'),
        path: 'M60 0h8v24h-8zm0 104h8v24h-8zM16 28h96v32H16zm0 40h96v32H16z' },
    { value:'flex-end',   label: __('End','snn'),
        path: 'M120 0h8v128h-8zM16 28h96v32H16zm0 40h96v32H16z' },
    { value:'stretch',    label: __('Stretch','snn'),
        path: 'M120 0h8v128h-8zM0 0h8v128H0zm16 28h96v32H16zm0 40h96v32H16z' },
    { value:'baseline',   label: __('Baseline','snn'),
        path: 'M60 0h8v128h-8zm8 28h28v32H68zm0 40h44v32H68z', hasStroke: true },
];

C.AlignIcons = ({ value, onChange, isGrid }) => {
    const icons = isGrid
        ? alignIcons.filter(i => i.value !== 'baseline').map(i => ({ ...i, value: i.value.replace('flex-', '') }))
        : alignIcons;
    const current = value || '';

    return (
        <div style={{ marginBottom:'4px' }}>
            <div style={labelRow}>
                <span style={labelText}>{isGrid ? __('Align Items','snn') : __('Align','snn')}</span>
            </div>
            <div style={iconRow}>
                {icons.map(ic => (
                    <button key={ic.value} type="button" onClick={() => onChange(ic.value)}
                        title={ic.label}
                        style={{ ...iconBtnBase, ...(current === ic.value ? iconBtnActive : {}) }}>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128"
                            style={{ width:'20px', height:'20px', display:'block', opacity: current === ic.value ? 1 : 0.35 }}>
                            {ic.hasStroke ? (
                                <g fill="none" fillRule="evenodd">
                                    <path fill={current === ic.value ? '#3858e9' : '#666'} d={ic.path.split(';')[0]} />
                                    <path stroke={current === ic.value ? '#3858e9' : '#666'} strokeWidth="6" d={ic.path.split(';')[1] || ''} />
                                </g>
                            ) : (
                                <path fill={current === ic.value ? '#3858e9' : '#666'} fillRule="evenodd" d={ic.path} />
                            )}
                        </svg>
                    </button>
                ))}
            </div>
        </div>
    );
};

/* ═══════════════════════════════════════════════
   WRAP ICONS
   ═══════════════════════════════════════════════ */

C.WrapIcons = ({ value, onChange }) => (
    <div style={{ marginBottom:'4px' }}>
        <div style={labelRow}>
            <span style={labelText}>{__('Wrap','snn')}</span>
        </div>
        <div style={{ display:'flex', gap:'4px' }}>
            {[
                { value:'nowrap', label: __('No Wrap','snn'), icon: '—' },
                { value:'wrap', label: __('Wrap','snn'), icon: '↵' },
                { value:'wrap-reverse', label: __('Wrap Rev','snn'), icon: '↶' },
            ].map(w => {
                const active = value === w.value;
                return (
                    <button key={w.value} type="button" onClick={() => onChange(value === w.value ? '' : w.value)}
                        title={w.label}
                        style={{
                            ...iconBtnBase, width:'auto', padding:'0 6px', fontSize:'14px', fontWeight:600,
                            gap:'3px', ...(active ? iconBtnActive : {}),
                        }}>
                        <span style={{ fontSize:'16px', lineHeight:1 }}>{w.icon}</span>
                    </button>
                );
            })}
        </div>
    </div>
);
