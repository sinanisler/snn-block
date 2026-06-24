/**
 * Device Switcher — visual Desktop / Tablet / Mobile tabs.
 * Reads current device from WP store and dispatches changes.
 * Attached to: window.SNNControls.DeviceSwitcher
 *
 * Usage: <DeviceSwitcher /> — no props needed, fully self-contained.
 */
const { __ } = wp.i18n;
const { useSelect, useDispatch } = wp.data;
const C = window.SNNControls = window.SNNControls || {};

C.DeviceSwitcher = () => {
    // Read current device from WordPress preview state
    const device = useSelect(select => {
        const es = select('core/editor');
        if (es?.getDeviceType) return (es.getDeviceType() || 'Desktop').toLowerCase();
        const eps = select('core/edit-post');
        const getD = eps?.__experimentalGetPreviewDeviceType;
        return (getD ? getD() : 'Desktop').toLowerCase();
    }, []);

    // Dispatch device change to WordPress
    const { setDeviceType } = useDispatch('core/editor') || {};
    const { __experimentalSetPreviewDeviceType } = useDispatch('core/edit-post') || {};

    const setDevice = (d) => {
        // Try both dispatchers — one will work
        if (setDeviceType) {
            setDeviceType(d.charAt(0).toUpperCase() + d.slice(1)); // 'Desktop', 'Tablet', 'Mobile'
        } else if (__experimentalSetPreviewDeviceType) {
            __experimentalSetPreviewDeviceType(d.charAt(0).toUpperCase() + d.slice(1));
        }
    };

    const devices = [
        { key: 'desktop', icon: 'fa-solid fa-desktop-alt', label: __('Desktop','snn') },
        { key: 'tablet',  icon: 'fa-solid fa-tablet-screen-button', label: __('Tablet','snn') },
        { key: 'mobile',  icon: 'fa-solid fa-mobile-screen', label: __('Mobile','snn') },
    ];

    return (
        <div style={{
            display: 'flex', gap: '2px', marginBottom: '10px',
            background: '#f0f0f0', borderRadius: '4px', padding: '2px',
        }}>
            {devices.map(d => (
                <button
                    key={d.key}
                    type="button"
                    onClick={() => setDevice(d.key)}
                    title={d.label}
                    style={{
                        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        gap: '3px', padding: '5px 2px', border: 'none', borderRadius: '3px',
                        background: device === d.key ? '#fff' : 'transparent',
                        color: device === d.key ? '#3858e9' : '#757575',
                        cursor: 'pointer', fontSize: '14px', fontWeight: device === d.key ? 600 : 400,
                        boxShadow: device === d.key ? '0 1px 3px rgba(0,0,0,0.12)' : 'none',
                        transition: 'all 0.15s',
                    }}
                >
                    <i className={d.icon} style={{ fontSize: '14px' }}></i>
                    <span style={{ fontSize: '14px' }}>{d.label}</span>
                </button>
            ))}
        </div>
    );
};
