/**
 * Visibility Controls — show/hide on device.
 * Attached to: window.SNNControls.VisibilityControls
 */
const { __ } = wp.i18n;
const C = window.SNNControls = window.SNNControls || {};

C.VisibilityControls = ({ visibility, onChange }) => {
    const v = visibility || { desktop: true, tablet: true, mobile: true };

    const toggle = (device) => {
        onChange({ ...v, [device]: !v[device] });
    };

    const devices = [
        { key: 'desktop', icon: 'fa-solid fa-desktop-alt', label: __('Desktop','snn') },
        { key: 'tablet',  icon: 'fa-solid fa-tablet-screen-button', label: __('Tablet','snn') },
        { key: 'mobile',  icon: 'fa-solid fa-mobile-screen', label: __('Mobile','snn') },
    ];

    return (
        <div style={{ marginBottom: '14px' }}>
            <label style={{ fontSize:'14px',fontWeight:500,display:'block',marginBottom:'8px',color:'#1e1e1e' }}>
                {__('Visibility','snn')}
            </label>
            <div style={{ display:'flex',gap:'4px' }}>
                {devices.map(d => (
                    <button key={d.key} type="button" onClick={() => toggle(d.key)}
                        title={d.label}
                        style={{
                            flex:1,display:'flex',alignItems:'center',justifyContent:'center',gap:'4px',
                            padding:'6px',border:'1px solid #949494',borderRadius:'3px',
                            background: v[d.key] ? '#f0f6ff' : '#f5f5f5',
                            color: v[d.key] ? '#3858e9' : '#949494',
                            cursor:'pointer',fontSize:'14px',
                            opacity: v[d.key] ? 1 : 0.5,
                            transition:'all 0.15s',
                        }}>
                        <i className={d.icon} style={{ fontSize:'14px' }}></i>
                        <span style={{ fontSize:'14px',fontWeight:500 }}>{v[d.key] ? d.label : __('Hidden','snn')}</span>
                    </button>
                ))}
            </div>
        </div>
    );
};
