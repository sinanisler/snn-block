/**
 * Device Badge — tiny responsive device icon.
 * Attached to: window.SNNControls.DeviceBadge
 */
const C = window.SNNControls = window.SNNControls || {};

C.DeviceBadge = ({ device }) => {
    const iconMap = {
        desktop: 'fa-solid fa-desktop-alt',
        tablet:  'fa-solid fa-tablet-screen-button',
        mobile:  'fa-solid fa-mobile-screen',
    };
    const iconClass = iconMap[device] || iconMap.desktop;
    return (
        <i className={iconClass}
            title={device}
            style={{
                fontSize: '14px', color: '#1e1e1e', marginLeft: '6px',
                verticalAlign: 'middle', lineHeight: 1,
            }}
        ></i>
    );
};
