/**
 * Responsive Label — device-aware label row.
 * Attached to: window.SNNControls.RespLabel
 */
const C = window.SNNControls = window.SNNControls || {};

C.RespLabel = ({ label, device }) => (
    <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: '4px', fontSize: '14px', fontWeight: 500, color: '#1e1e1e',
    }}>
        <span>{label} <C.DeviceBadge device={device} /></span>
    </div>
);
