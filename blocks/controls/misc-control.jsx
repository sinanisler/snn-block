/**
 * Misc Controls — Will Change, Isolation, List Style, Inset.
 * Attached to: window.SNNControls.WillChangeSelect, .IsolationSelect, .ListStyleControl, .InsetControl
 */
const { __ } = wp.i18n;
const C = window.SNNControls = window.SNNControls || {};

const tinyInp = { width:'100%',padding:'5px 8px',fontSize:'14px',fontFamily:'monospace',border:'1px solid #949494',borderRadius:'3px',boxSizing:'border-box',lineHeight:'20px' };

/* ─── Will Change Select ─── */
C.WillChangeSelect = ({ label, value, onChange }) => {
    const opts = [
        { value: '',           label: '—' },
        { value: 'auto',       label: __('Auto','snn') },
        { value: 'transform',  label: __('Transform','snn') },
        { value: 'opacity',    label: __('Opacity','snn') },
        { value: 'transform, opacity', label: __('Both','snn') },
        { value: 'scroll-position', label: __('Scroll','snn') },
        { value: 'contents',   label: __('Contents','snn') },
    ];
    return <C.CompactSelect label={label || __('Will Change','snn')} value={value || ''} options={opts} onChange={onChange} />;
};

/* ─── Isolation Select ─── */
C.IsolationSelect = ({ label, value, onChange }) => {
    const opts = [
        { value: '',       label: '—' },
        { value: 'auto',   label: __('Auto','snn') },
        { value: 'isolate',label: __('Isolate','snn') },
    ];
    return <C.CompactSelect label={label || __('Isolation','snn')} value={value || ''} options={opts} onChange={onChange} />;
};

/* ─── List Style Control ─── */
C.ListStyleControl = ({ type, position, image, onTypeChange, onPositionChange, onImageChange }) => {
    const typeOpts = [
        { value: '',           label: '—' },
        { value: 'disc',       label: '● Disc' },
        { value: 'circle',     label: '○ Circle' },
        { value: 'square',     label: '■ Square' },
        { value: 'decimal',    label: '1. Decimal' },
        { value: 'decimal-leading-zero', label: '01. Decimal Zero' },
        { value: 'lower-roman',  label: 'i. Lower Roman' },
        { value: 'upper-roman',  label: 'I. Upper Roman' },
        { value: 'lower-alpha',  label: 'a. Lower Alpha' },
        { value: 'upper-alpha',  label: 'A. Upper Alpha' },
        { value: 'none',       label: __('None','snn') },
    ];
    const posOpts = [
        { value: '',       label: '—' },
        { value: 'inside', label: __('Inside','snn') },
        { value: 'outside',label: __('Outside','snn') },
    ];

    return (
        <div style={{ marginBottom:'8px' }}>
            <span style={{ fontSize:'14px',fontWeight:600,textTransform:'uppercase',color:'#1e1e1e',display:'block',marginBottom:'4px' }}>{__('List Style','snn')}</span>
            <C.CompactSelect label={__('Type','snn')} value={type || ''} options={typeOpts} onChange={onTypeChange} />
            <C.CompactSelect label={__('Position','snn')} value={position || ''} options={posOpts} onChange={onPositionChange} />
        </div>
    );
};

/* ─── Inset Control (Positioned shorthand) ─── */
C.InsetControl = ({ label, value, onChange, device }) => {
    const vals = value || { top: '', right: '', bottom: '', left: '' };
    const sides = ['top','right','bottom','left'];

    return (
        <div style={{ marginBottom:'8px' }}>
            <C.RespLabel label={label || __('Inset','snn')} device={device} />
            <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:'4px' }}>
                {sides.map(s => (
                    <div key={s}>
                        <span style={{ fontSize:'14px',color:'#1e1e1e',display:'block',fontWeight:500 }}>{s.charAt(0).toUpperCase() + s.slice(1)}</span>
                        <input type="text" value={vals[s] || ''}
                            onChange={e => onChange({ ...vals, [s]: e.target.value })}
                            placeholder="auto" style={tinyInp} />
                    </div>
                ))}
            </div>
        </div>
    );
};
