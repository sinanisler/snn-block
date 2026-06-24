/**
 * Interaction Control — Cursor, Pointer Events, User Select, Resize, Scroll Behavior & Snap.
 * Attached to: window.SNNControls.CursorSelect, .PointerEventsSelect, .UserSelectSelect,
 *   .ResizeSelect, .ScrollBehaviorControl, .ScrollSnapControl
 */
const { __ } = wp.i18n;
const C = window.SNNControls = window.SNNControls || {};

/* ─── Cursor Select ─── */
C.CursorSelect = ({ label, value, onChange }) => {
    const opts = [
        { value: '',          label: '—' },
        { value: 'auto',      label: __('Auto','snn') },
        { value: 'default',   label: __('Default','snn') },
        { value: 'pointer',   label: __('Pointer','snn') },
        { value: 'grab',      label: __('Grab','snn') },
        { value: 'grabbing',  label: __('Grabbing','snn') },
        { value: 'crosshair', label: __('Crosshair','snn') },
        { value: 'not-allowed', label: __('Not Allowed','snn') },
        { value: 'zoom-in',   label: __('Zoom In','snn') },
        { value: 'zoom-out',  label: __('Zoom Out','snn') },
        { value: 'move',      label: __('Move','snn') },
        { value: 'text',      label: __('Text','snn') },
        { value: 'wait',      label: __('Wait','snn') },
        { value: 'help',      label: __('Help','snn') },
        { value: 'none',      label: __('None','snn') },
    ];
    return <C.CompactSelect label={label || __('Cursor','snn')} value={value || ''} options={opts} onChange={onChange} />;
};

/* ─── Pointer Events Select ─── */
C.PointerEventsSelect = ({ label, value, onChange }) => {
    const opts = [
        { value: '',     label: '—' },
        { value: 'auto', label: __('Auto','snn') },
        { value: 'none', label: __('None','snn') },
    ];
    return <C.CompactSelect label={label || __('Pointer','snn')} value={value || ''} options={opts} onChange={onChange} />;
};

/* ─── User Select Select ─── */
C.UserSelectSelect = ({ label, value, onChange }) => {
    const opts = [
        { value: '',     label: '—' },
        { value: 'auto', label: __('Auto','snn') },
        { value: 'none', label: __('None','snn') },
        { value: 'text', label: __('Text','snn') },
        { value: 'all',  label: __('All','snn') },
    ];
    return <C.CompactSelect label={label || __('User Select','snn')} value={value || ''} options={opts} onChange={onChange} />;
};

/* ─── Resize Select ─── */
C.ResizeSelect = ({ label, value, onChange }) => {
    const opts = [
        { value: '',          label: '—' },
        { value: 'none',      label: __('None','snn') },
        { value: 'both',      label: __('Both','snn') },
        { value: 'horizontal',label: __('Horizontal','snn') },
        { value: 'vertical',  label: __('Vertical','snn') },
    ];
    return <C.CompactSelect label={label || __('Resize','snn')} value={value || ''} options={opts} onChange={onChange} />;
};

/* ─── Scroll Behavior Control ─── */
C.ScrollBehaviorSelect = ({ label, value, onChange }) => {
    const opts = [
        { value: '',      label: '—' },
        { value: 'auto',  label: __('Auto','snn') },
        { value: 'smooth',label: __('Smooth','snn') },
    ];
    return <C.CompactSelect label={label || __('Scroll','snn')} value={value || ''} options={opts} onChange={onChange} />;
};

/* ─── Scroll Snap Control ─── */
C.ScrollSnapControl = ({ getVal, setVal, device }) => {
    const tinyInp = { width:'100%',padding:'5px 8px',fontSize:'14px',fontFamily:'monospace',border:'1px solid #949494',borderRadius:'3px',boxSizing:'border-box',lineHeight:'20px' };
    const snapTypeOpts = [
        { value: '',          label: '—' },
        { value: 'none',      label: __('None','snn') },
        { value: 'x mandatory', label: __('X Mandatory','snn') },
        { value: 'y mandatory', label: __('Y Mandatory','snn') },
        { value: 'both mandatory', label: __('Both Mandatory','snn') },
        { value: 'x proximity', label: __('X Proximity','snn') },
        { value: 'y proximity', label: __('Y Proximity','snn') },
        { value: 'both proximity', label: __('Both Proximity','snn') },
    ];
    const alignOpts = [
        { value: '',       label: '—' },
        { value: 'start',  label: __('Start','snn') },
        { value: 'center', label: __('Center','snn') },
        { value: 'end',    label: __('End','snn') },
    ];

    return (
        <div style={{ marginBottom:'8px' }}>
            <C.RespLabel label={__('Scroll Snap','snn')} device={device} />
            <C.CompactSelect label={__('Type','snn')} value={getVal('scrollSnapType')} options={snapTypeOpts}
                onChange={v => setVal('scrollSnapType',v)} />
            <C.CompactSelect label={__('Align','snn')} value={getVal('scrollSnapAlign')} options={alignOpts}
                onChange={v => setVal('scrollSnapAlign',v)} />
            <div style={{ marginTop:'3px' }}>
                <span style={{ fontSize:'14px',color:'#1e1e1e',display:'block',fontWeight:500,marginBottom:'2px' }}>{__('Stop','snn')}</span>
                <C.CompactSelect label={__('Stop','snn')} value={getVal('scrollSnapStop')}
                    options={[{value:'',label:'—'},{value:'normal',label:__('Normal','snn')},{value:'always',label:__('Always','snn')}]}
                    onChange={v => setVal('scrollSnapStop',v)} />
            </div>
        </div>
    );
};
