/**
 * Spacing Input — 4-side padding/margin with link toggle.
 * Penpot-inspired: top/right/bottom/left with link icon to unify all values.
 * Attached to: window.SNNControls.SpacingInput
 *
 * Usage: <SpacingInput label="Padding" values={obj} onChange={fn} device="desktop" />
 */
const { __ } = wp.i18n;
const { useState, useEffect } = wp.element;
const C = window.SNNControls = window.SNNControls || {};

C.SpacingInput = ({ label, values, onChange, device, defaultValue = '' }) => {
    const sides = [
        { key: 'top',    label: __('T','snn'), cssProp: 'top' },
        { key: 'right',  label: __('R','snn'), cssProp: 'right' },
        { key: 'bottom', label: __('B','snn'), cssProp: 'bottom' },
        { key: 'left',   label: __('L','snn'), cssProp: 'left' },
    ];
    const [linked, setLinked] = useState(false);

    const vals = values || { top: '', right: '', bottom: '', left: '' };
    const allSame = vals.top === vals.right && vals.right === vals.bottom && vals.bottom === vals.left;

    const handleChange = (key, newVal) => {
        if (linked) {
            onChange({ top: newVal, right: newVal, bottom: newVal, left: newVal });
        } else {
            onChange({ ...vals, [key]: newVal });
        }
    };

    return (
        <div style={{ marginBottom: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <C.RespLabel label={label || __('Spacing','snn')} device={device} />
                <button type="button" onClick={() => setLinked(!linked)}
                    title={linked ? __('Unlink sides','snn') : __('Link sides','snn')}
                    style={{
                        border: 'none', background: 'none', cursor: 'pointer', fontSize: '16px',
                        color: linked ? '#3858e9' : '#949494', padding: '0 4px', lineHeight: 1,
                    }}>
                    <i className={linked ? 'fa-solid fa-link' : 'fa-solid fa-link-slash'}></i>
                </button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' }}>
                {sides.map(s => (
                    <div key={s.key}>
                        <span style={{ fontSize: '14px', color: '#1e1e1e', display: 'block', fontWeight: 500 }}>{s.label}</span>
                        <input type="text" value={vals[s.key] || ''}
                            onChange={e => handleChange(s.key, e.target.value)}
                            placeholder={linked && vals.top ? vals.top : '0'}
                            style={{ width:'100%',padding:'5px 8px',fontSize:'14px',border:'1px solid #949494',borderRadius:'3px',boxSizing:'border-box' }} />
                    </div>
                ))}
            </div>
        </div>
    );
};

// Alias for backwards compatibility (text block references PaddingInput)
C.PaddingInput = C.SpacingInput;
