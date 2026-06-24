/**
 * Layout Control — Extra flex/grid controls: Gap, Grid Template, Flex Child, Grid Placement, Order.
 * Attached to: window.SNNControls.GapControl, .GridTemplateControl, .FlexChildControl, .GridPlacementControl, .OrderControl
 *
 * Note: DirectionIcons, JustifyIcons, AlignIcons, WrapIcons already exist in flex-grid-icons.jsx.
 */
const { __ } = wp.i18n;
const C = window.SNNControls = window.SNNControls || {};

const tinyInp = { width:'100%',padding:'5px 8px',fontSize:'14px',fontFamily:'monospace',border:'1px solid #949494',borderRadius:'3px',boxSizing:'border-box',lineHeight:'20px' };

/* ─── Gap Control (row-gap + column-gap or unified) ─── */
C.GapControl = ({ getVal, setVal, device }) => (
    <div style={{ marginBottom:'8px' }}>
        <C.RespLabel label={__('Gap','snn')} device={device} />
        <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:'4px' }}>
            <div>
                <span style={{ fontSize:'14px',color:'#1e1e1e',display:'block',fontWeight:500 }}>{__('Row','snn')}</span>
                <input type="text" value={getVal('rowGap')} onChange={e => setVal('rowGap',e.target.value)}
                    placeholder="16px" style={tinyInp} />
            </div>
            <div>
                <span style={{ fontSize:'14px',color:'#1e1e1e',display:'block',fontWeight:500 }}>{__('Column','snn')}</span>
                <input type="text" value={getVal('columnGap')} onChange={e => setVal('columnGap',e.target.value)}
                    placeholder="16px" style={tinyInp} />
            </div>
        </div>
        {/* Unified gap (applied to both if row/col not set) */}
        <div style={{ marginTop:'4px' }}>
            <input type="text" value={getVal('gap')} onChange={e => setVal('gap',e.target.value)}
                placeholder={__('Unified gap','snn')} style={{ ...tinyInp,textAlign:'center' }} />
        </div>
    </div>
);

/* ─── Grid Template Control ─── */
C.GridTemplateControl = ({ getVal, setVal, device }) => (
    <div style={{ marginBottom:'8px' }}>
        <C.RespLabel label={__('Grid Template','snn')} device={device} />
        <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:'4px' }}>
            <div>
                <span style={{ fontSize:'14px',color:'#1e1e1e',display:'block',fontWeight:500 }}>{__('Columns','snn')}</span>
                <input type="text" value={getVal('gridColumns')} onChange={e => setVal('gridColumns',e.target.value)}
                    placeholder="1fr 1fr 1fr" style={tinyInp} />
            </div>
            <div>
                <span style={{ fontSize:'14px',color:'#1e1e1e',display:'block',fontWeight:500 }}>{__('Rows','snn')}</span>
                <input type="text" value={getVal('gridRows')} onChange={e => setVal('gridRows',e.target.value)}
                    placeholder="auto" style={tinyInp} />
            </div>
        </div>
        {/* Auto flow */}
        <div style={{ marginTop:'4px' }}>
            <C.CompactSelect label={__('Auto Flow','snn')} value={getVal('gridAutoFlow') || ''}
                options={[
                    { value:'', label:'—' },
                    { value:'row', label:__('Row','snn') },
                    { value:'column', label:__('Column','snn') },
                    { value:'dense', label:__('Dense','snn') },
                    { value:'row dense', label:__('Row Dense','snn') },
                    { value:'column dense', label:__('Column Dense','snn') },
                ]}
                onChange={v => setVal('gridAutoFlow',v)} />
        </div>
    </div>
);

/* ─── Flex Child Control ─── */
C.FlexChildControl = ({ getVal, setVal, device }) => (
    <div style={{ marginBottom:'8px', padding:'8px', background:'#f9fafc', borderRadius:'4px', border:'1px solid #e8ecf1' }}>
        <C.RespLabel label={__('Flex Child','snn')} device={device} />
        <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'4px' }}>
            <div>
                <span style={{ fontSize:'14px',color:'#1e1e1e',display:'block',fontWeight:500 }}>{__('Grow','snn')}</span>
                <input type="text" value={getVal('flexGrow')} onChange={e => setVal('flexGrow',e.target.value)}
                    placeholder="0" style={tinyInp} />
            </div>
            <div>
                <span style={{ fontSize:'14px',color:'#1e1e1e',display:'block',fontWeight:500 }}>{__('Shrink','snn')}</span>
                <input type="text" value={getVal('flexShrink')} onChange={e => setVal('flexShrink',e.target.value)}
                    placeholder="1" style={tinyInp} />
            </div>
            <div>
                <span style={{ fontSize:'14px',color:'#1e1e1e',display:'block',fontWeight:500 }}>{__('Basis','snn')}</span>
                <input type="text" value={getVal('flexBasis')} onChange={e => setVal('flexBasis',e.target.value)}
                    placeholder="auto" style={tinyInp} />
            </div>
        </div>
        <div style={{ marginTop:'4px' }}>
            <C.CompactSelect label={__('Align Self','snn')} value={getVal('alignSelf') || ''}
                options={[
                    { value:'', label:'—' },
                    { value:'auto', label:__('Auto','snn') },
                    { value:'flex-start', label:__('Start','snn') },
                    { value:'center', label:__('Center','snn') },
                    { value:'flex-end', label:__('End','snn') },
                    { value:'stretch', label:__('Stretch','snn') },
                    { value:'baseline', label:__('Baseline','snn') },
                ]}
                onChange={v => setVal('alignSelf',v)} />
        </div>
    </div>
);

/* ─── Grid Placement Control ─── */
C.GridPlacementControl = ({ getVal, setVal, device }) => (
    <div style={{ marginBottom:'8px', padding:'8px', background:'#f9fafc', borderRadius:'4px', border:'1px solid #e8ecf1' }}>
        <C.RespLabel label={__('Grid Placement','snn')} device={device} />
        <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:'4px' }}>
            <div>
                <span style={{ fontSize:'14px',color:'#1e1e1e',display:'block',fontWeight:500 }}>{__('Col Start','snn')}</span>
                <input type="text" value={getVal('gridColumnStart')} onChange={e => setVal('gridColumnStart',e.target.value)}
                    placeholder="auto" style={tinyInp} />
            </div>
            <div>
                <span style={{ fontSize:'14px',color:'#1e1e1e',display:'block',fontWeight:500 }}>{__('Col End','snn')}</span>
                <input type="text" value={getVal('gridColumnEnd')} onChange={e => setVal('gridColumnEnd',e.target.value)}
                    placeholder="auto" style={tinyInp} />
            </div>
            <div>
                <span style={{ fontSize:'14px',color:'#1e1e1e',display:'block',fontWeight:500 }}>{__('Row Start','snn')}</span>
                <input type="text" value={getVal('gridRowStart')} onChange={e => setVal('gridRowStart',e.target.value)}
                    placeholder="auto" style={tinyInp} />
            </div>
            <div>
                <span style={{ fontSize:'14px',color:'#1e1e1e',display:'block',fontWeight:500 }}>{__('Row End','snn')}</span>
                <input type="text" value={getVal('gridRowEnd')} onChange={e => setVal('gridRowEnd',e.target.value)}
                    placeholder="auto" style={tinyInp} />
            </div>
        </div>
    </div>
);

/* ─── Order Control ─── */
C.OrderControl = ({ getVal, setVal, device }) => (
    <div style={{ display:'flex',alignItems:'center',gap:'4px',marginBottom:'4px' }}>
        <span style={{ fontSize:'14px',fontWeight:500,textTransform:'uppercase',color:'#1e1e1e',minWidth:'64px' }}>{__('Order','snn')}</span>
        <input type="text" value={getVal('order')} onChange={e => setVal('order',e.target.value)}
            placeholder="0" style={{ flex:1,padding:'5px 8px',fontSize:'14px',fontFamily:'monospace',border:'1px solid #949494',borderRadius:'3px',boxSizing:'border-box' }} />
        <C.DeviceBadge device={device} />
    </div>
);
