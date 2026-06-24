/**
 * Border Control — Penpot-inspired 4-side border (width, style, color).
 * Attached to: window.SNNControls.BorderControl
 *
 * Penpot reference: Stroke section with color+opacity, width (px),
 * position (center/outside/inside), style (solid/dotted/dashed/mixed).
 */
const { __ } = wp.i18n;
const C = window.SNNControls = window.SNNControls || {};

C.BorderControl = ({ width, style, color, onWidthChange, onStyleChange, onColorChange, device }) => {
    const styleOpts = [
        { value: 'solid',  label: __('Solid','snn') },
        { value: 'dashed', label: __('Dashed','snn') },
        { value: 'dotted', label: __('Dotted','snn') },
        { value: 'double', label: __('Double','snn') },
        { value: 'none',   label: __('None','snn') },
    ];

    const borderWidth = width || { top: '', right: '', bottom: '', left: '' };
    const borderColor = color || '';

    return (
        <div style={{ marginBottom: '8px' }}>
            <C.RespLabel label={__('Border','snn')} device={device} />

            {/* Style + Width row */}
            <div style={{ display: 'flex', gap: '4px', marginBottom: '4px' }}>
                <select value={style || 'solid'} onChange={e => onStyleChange(e.target.value)}
                    style={{ fontSize:'14px',padding:'3px 6px',border:'1px solid #949494',borderRadius:'3px',height:'26px',flex:1 }}>
                    {styleOpts.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
            </div>

            {/* 4-side width */}
            <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr 1fr 1fr',gap:'3px',marginBottom:'4px' }}>
                {['top','right','bottom','left'].map(side => (
                    <div key={side}>
                        <span style={{ fontSize:'14px',color:'#1e1e1e',display:'block',textAlign:'center',fontWeight:500 }}>{side.charAt(0).toUpperCase()}</span>
                        <input type="text" value={borderWidth[side] || ''}
                            onChange={e => onWidthChange({ ...borderWidth, [side]: e.target.value })}
                            placeholder="1"
                            style={{ width:'100%',padding:'5px 8px',fontSize:'14px',border:'1px solid #949494',borderRadius:'3px',boxSizing:'border-box',textAlign:'center' }} />
                    </div>
                ))}
            </div>

            {/* Color picker */}
            <C.ColorRow label={__('Border Color','snn')} value={borderColor} onChange={onColorChange} />
        </div>
    );
};
