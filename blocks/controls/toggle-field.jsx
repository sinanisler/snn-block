/**
 * Toggle Field — Flexible toggle (ToggleGroupControl with SelectControl fallback).
 * Attached to: window.SNNControls.ToggleField
 */
const { __experimentalToggleGroupControl, __experimentalToggleGroupControlOption, SelectControl } = wp.components;
const C = window.SNNControls = window.SNNControls || {};

C.ToggleField = ({ label, value, options, onChange }) => {
    if (typeof __experimentalToggleGroupControl !== 'undefined') {
        return (
            <div style={{ marginBottom: '14px' }}>
                <label style={{ fontSize:'14px',fontWeight:500,display:'block',marginBottom:'6px',color:'#1e1e1e' }}>{label}</label>
                <__experimentalToggleGroupControl value={value} onChange={onChange} isBlock
                    __next40pxDefaultSize={true} __nextHasNoMarginBottom={true}>
                    {options.map(opt => (
                        <__experimentalToggleGroupControlOption key={opt.value} label={opt.label} value={opt.value} />
                    ))}
                </__experimentalToggleGroupControl>
            </div>
        );
    }
    return <SelectControl label={label} value={value} options={options} onChange={onChange} />;
};
