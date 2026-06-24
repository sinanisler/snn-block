const { registerBlockType } = wp.blocks;
const { InspectorControls, useBlockProps, useInnerBlocksProps, MediaUpload } = wp.blockEditor;
const { Button, TextareaControl, PanelBody } = wp.components;
const { Fragment } = wp.element;
const { __ } = wp.i18n;

const {
    DeviceSwitcher, CompactSection, CompactRow, CompactLabel,
    ColorRow, SpacingInput, BorderControl, BorderRadiusControl,
    ShadowBuilder, FilterControls, TransformControls, OpacitySlider,
    BlendModeSelect, FontSizeRow, FontWeightSelect, LineHeightRow,
    LetterSpacingRow, AlignRow, TransformRow, DecorationRow, FontFamilySelect,
    ToggleField, IconToggleField, CompactSelect, RangeUnitField,
    PositionSelect, OffsetInput, ZIndexControl, VisibilityControls,
    OverflowSelect, useResponsiveAttributes,
} = window.SNNControls;

registerBlockType('snn/section', {
    edit: function (props) {
        const { attributes, setAttributes } = props;
        const { activeDevice, getVal, setVal, inheritVal, getSides, setSides, inheritSides, getBorderWidth, setBorderWidth, getBorderRadius, setBorderRadius } = useResponsiveAttributes(attributes, setAttributes);
        const d = activeDevice;

        const previewStyles = {};
        const invBg = inheritVal('bgColor'); if (invBg) previewStyles.backgroundColor = invBg;
        const invText = inheritVal('textColor'); if (invText) previewStyles.color = invText;
        if (attributes.bgImage?.url) {
            previewStyles.backgroundImage = `url(${attributes.bgImage.url})`;
            previewStyles.backgroundSize = attributes.bgSize || 'cover';
            previewStyles.backgroundPosition = attributes.bgPosition || 'center center';
            previewStyles.backgroundRepeat = attributes.bgRepeat || 'no-repeat';
            previewStyles.backgroundAttachment = attributes.bgAttachment || 'scroll';
        }
        ['display','flexDirection','flexWrap','justifyContent','justifyItems','alignItems','alignContent','gap','gridColumns','textAlign','minHeight'].forEach(k => {
            const v = inheritVal(k); if (v) previewStyles[k==='gridColumns'?'gridTemplateColumns':k] = v;
        });
        if (attributes.overflow) previewStyles.overflow = attributes.overflow;
        const pad = inheritSides('padding');
        if (pad.top) previewStyles.paddingTop = pad.top;
        if (pad.right) previewStyles.paddingRight = pad.right;
        if (pad.bottom) previewStyles.paddingBottom = pad.bottom;
        if (pad.left) previewStyles.paddingLeft = pad.left;

        const displayVal = inheritVal('display');
        const isFlex = displayVal === 'flex';
        const isGrid = displayVal === 'grid';

        const blockProps = useBlockProps({ className:'snn-section', style:previewStyles });
        const innerBlocksProps = useInnerBlocksProps(blockProps, { template: [['snn/container']] });

        /* ══════════════════════════════════════════
           SHARED STYLES
           ══════════════════════════════════════════ */
        const row = { display:'flex',alignItems:'center',gap:'6px',marginBottom:'4px' };
        const lbl = { fontSize:'14px',fontWeight:600,textTransform:'uppercase',color:'#1e1e1e',minWidth:'54px',flexShrink:0 };
        const tinyInp = { width:'100%',padding:'4px 6px',fontSize:'14px',fontFamily:'monospace',border:'1px solid #ddd',borderRadius:'3px',boxSizing:'border-box',lineHeight:'20px' };
        const sel = { fontSize:'14px',padding:'3px 6px',border:'1px solid #949494',borderRadius:'3px',height:'26px',flex:1,background:'#fff',minWidth:0 };

        return (
            <Fragment>
                <InspectorControls>
                    <div style={{ padding: '0 10px' }}>
                    <DeviceSwitcher />

                    {/* ── LAYOUT ── */}
                    <ToggleField label={__('Display','snn')} value={displayVal}
                        options={[{label:'Block',value:'block'},{label:'Flex',value:'flex'},{label:'Grid',value:'grid'},{label:'Inline',value:'inline-block'},{label:'None',value:'none'}]}
                        onChange={v => setVal('display',v)} />
                    <CompactSelect label={__('Align','snn')} value={getVal('textAlign')}
                        options={[{value:'',label:'—'},{value:'left',label:'Left'},{value:'center',label:'Center'},{value:'right',label:'Right'}]}
                        onChange={v => setVal('textAlign',v)} />

                    {isFlex && <div>
                        <div style={{ display:'flex',gap:'4px',marginBottom:'4px' }}>
                            <select value={getVal('flexDirection')} onChange={e => setVal('flexDirection',e.target.value)} style={sel}>
                                <option value="">{__('Direction','snn')}</option>
                                <option value="row">Row</option><option value="column">Column</option>
                                <option value="row-reverse">Row Rev</option><option value="column-reverse">Col Rev</option>
                            </select>
                            <select value={getVal('flexWrap')} onChange={e => setVal('flexWrap',e.target.value)} style={sel}>
                                <option value="">{__('Wrap','snn')}</option>
                                <option value="wrap">Wrap</option><option value="nowrap">Nowrap</option>
                                <option value="wrap-reverse">Wrap Rev</option>
                            </select>
                        </div>
                        <div style={{ display:'flex',gap:'4px',marginBottom:'4px' }}>
                            <select value={getVal('justifyContent')} onChange={e => setVal('justifyContent',e.target.value)} style={sel}>
                                <option value="">{__('Justify','snn')}</option>
                                <option value="flex-start">Start</option><option value="center">Center</option>
                                <option value="flex-end">End</option><option value="space-between">Between</option>
                                <option value="space-around">Around</option><option value="space-evenly">Evenly</option>
                            </select>
                            <select value={getVal('alignItems')} onChange={e => setVal('alignItems',e.target.value)} style={sel}>
                                <option value="">{__('Align','snn')}</option>
                                <option value="flex-start">Start</option><option value="center">Center</option>
                                <option value="flex-end">End</option><option value="stretch">Stretch</option>
                            </select>
                        </div>
                    </div>}

                    {isGrid && <div style={{ display:'flex',gap:'4px',marginBottom:'4px' }}>
                        <input type="text" value={getVal('gridColumns')} onChange={e => setVal('gridColumns',e.target.value)}
                            placeholder="1fr 1fr" style={{...tinyInp,flex:1}} />
                        <select value={getVal('alignItems')} onChange={e => setVal('alignItems',e.target.value)} style={sel}>
                            <option value="">Align</option>
                            <option value="start">Start</option><option value="center">Center</option>
                            <option value="end">End</option><option value="stretch">Stretch</option>
                        </select>
                    </div>}

                    <div style={{ display:'flex',gap:'4px',marginBottom:'2px' }}>
                        <input type="text" value={getVal('gap')} onChange={e => setVal('gap',e.target.value)}
                            placeholder={__('Gap','snn')} style={{...tinyInp,flex:1}} />
                    </div>

                    <CompactSection title={__('Spacing','snn')} />
                    <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:'6px',marginBottom:'6px' }}>
                        <div>
                            <label style={{fontSize:'14px',fontWeight:500,color:'#1e1e1e',display:'block',marginBottom:'2px'}}>{__('Padding','snn')}</label>
                            <SpacingInput values={getSides('padding')} onChange={v => setSides('padding',v)} device={d} />
                        </div>
                        <div>
                            <label style={{fontSize:'14px',fontWeight:500,color:'#1e1e1e',display:'block',marginBottom:'2px'}}>{__('Margin','snn')}</label>
                            <SpacingInput values={getSides('margin')} onChange={v => setSides('margin',v)} device={d} />
                        </div>
                    </div>

                    <CompactSection title={__('Sizing','snn')} />
                    <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'4px',marginBottom:'6px' }}>
                        {[{k:'width',l:'W'},{k:'height',l:'H'},{k:'minWidth',l:'MinW'},{k:'maxWidth',l:'MaxW'},{k:'minHeight',l:'MinH'},{k:'maxHeight',l:'MaxH'}].map(f => (
                            <div key={f.k} style={{display:'flex',alignItems:'center',gap:'3px'}}>
                                <span style={{fontSize:'14px',fontWeight:500,color:'#1e1e1e',minWidth:'28px'}}>{f.l}</span>
                                <input type="text" value={getVal(f.k)} onChange={e => setVal(f.k,e.target.value)}
                                    placeholder="—" style={{...tinyInp,flex:1,textAlign:'center',padding:'4px 4px',fontSize:'14px'}} />
                            </div>
                        ))}
                    </div>
                    <OverflowSelect value={attributes.overflow||''} onChange={v => setAttributes({overflow:v})} device={d} />

                    <CompactSection title={__('Background','snn')} />
                    <ColorRow label={__('Color','snn')} value={getVal('bgColor')} onChange={v => setVal('bgColor',v)} />
                    <div style={{marginBottom:'6px'}}>
                        <MediaUpload onSelect={m => setAttributes({bgImage:{id:m.id,url:m.url,alt:m.alt||''}})} allowedTypes={['image']} value={attributes.bgImage?.id||0}
                            render={({open}) => (
                                <Button onClick={open} isSecondary style={{width:'100%',justifyContent:'center',fontSize:'14px',padding:'4px 12px',height:'auto'}}>
                                    {attributes.bgImage?.url ? __('Change Image','snn') : __('+ BG Image','snn')}
                                </Button>
                            )} />
                        {attributes.bgImage?.url && <Button onClick={() => setAttributes({bgImage:{id:0,url:'',alt:''}})} isDestructive style={{width:'100%',marginTop:'4px',fontSize:'14px',padding:'3px 12px',height:'auto'}}>{__('Remove','snn')}</Button>}
                    </div>
                    <div style={{display:'flex',gap:'6px',marginBottom:'6px'}}>
                        <select value={attributes.bgSize||'cover'} onChange={e => setAttributes({bgSize:e.target.value})} style={sel}>
                            <option value="cover">Cover</option><option value="contain">Contain</option><option value="auto">Auto</option>
                        </select>
                        <select value={attributes.bgAttachment||'scroll'} onChange={e => setAttributes({bgAttachment:e.target.value})} style={sel}>
                            <option value="scroll">Scroll</option><option value="fixed">Fixed</option>
                        </select>
                    </div>
                    <div style={row}>
                        <span style={lbl}>{__('Overlay','snn')}</span>
                        <input type="text" value={attributes.bgOverlay?.color||''} onChange={e => setAttributes({bgOverlay:{...(attributes.bgOverlay||{}),color:e.target.value}})}
                            placeholder="#00000080" style={{...tinyInp,flex:1}} />
                    </div>

                    <CompactSection title={__('Color & Type','snn')} />
                    <ColorRow label={__('Text','snn')} value={getVal('textColor')} onChange={v => setVal('textColor',v)} />
                    <div style={{display:'flex',gap:'4px',marginBottom:'2px'}}>
                        <input type="text" value={attributes.fontFamily||''} onChange={e => setAttributes({fontFamily:e.target.value})}
                            placeholder={__('Font','snn')} style={{...tinyInp,flex:2}} />
                        <input type="text" value={getVal('fontSize')} onChange={e => setVal('fontSize',e.target.value)}
                            placeholder="16px" style={{...tinyInp,flex:1}} />
                        <select value={getVal('fontWeight')||'400'} onChange={e => setVal('fontWeight',e.target.value)} style={{...sel,flex:0,minWidth:'48px'}}>
                            {['100','200','300','400','500','600','700','800','900'].map(w => <option key={w} value={w}>{w}</option>)}
                        </select>
                    </div>
                    <div style={{display:'flex',gap:'4px',marginBottom:'2px'}}>
                        <input type="text" value={getVal('lineHeight')} onChange={e => setVal('lineHeight',e.target.value)}
                            placeholder="1.5" style={{...tinyInp,flex:1}} title={__('Line Height','snn')} />
                        <input type="text" value={getVal('letterSpacing')} onChange={e => setVal('letterSpacing',e.target.value)}
                            placeholder="0px" style={{...tinyInp,flex:1}} title={__('Letter Spacing','snn')} />
                        <select value={attributes.textTransform||''} onChange={e => setAttributes({textTransform:e.target.value})} style={{...sel,flex:0,minWidth:'48px'}}>
                            <option value="">Aa</option><option value="uppercase">AA</option><option value="lowercase">aa</option><option value="capitalize">Aa.</option>
                        </select>
                    </div>

                    <CompactSection title={__('Border & Radius','snn')} />
                    <BorderControl width={getBorderWidth()} style={attributes.border?.style||''} color={attributes.border?.color||''}
                        onWidthChange={v => setBorderWidth(v)} onStyleChange={v => setAttributes({border:{...(attributes.border||{}),style:v}})}
                        onColorChange={v => setAttributes({border:{...(attributes.border||{}),color:v}})} device={d} />
                    <BorderRadiusControl values={getBorderRadius()} onChange={v => setBorderRadius(v)} device={d} />

                    {/* ── EFFECTS (collapsible, less used) ── */}
                    <PanelBody title={__('Effects','snn')} initialOpen={false}>
                        <OpacitySlider value={attributes.opacity||''} onChange={v => setAttributes({opacity:v})} device={d} />
                        <BlendModeSelect value={attributes.blendMode||''} onChange={v => setAttributes({blendMode:v})} />
                        <ShadowBuilder shadows={attributes.boxShadow||[]} onChange={v => setAttributes({boxShadow:v})} device={d} />
                        <FilterControls filters={attributes.filter||{}} onChange={v => setAttributes({filter:v})} device={d} />
                        <TransformControls transform={attributes.transform||{}} onChange={v => setAttributes({transform:v})} device={d} />
                    </PanelBody>

                    {/* ── POSITION (collapsible) ── */}
                    <PanelBody title={__('Position','snn')} initialOpen={false}>
                        <PositionSelect value={attributes.position||''} onChange={v => setAttributes({position:v})} />
                        <OffsetInput offsets={attributes.offsets||{}} onChange={v => setAttributes({offsets:v})} device={d} />
                        <ZIndexControl value={attributes.zIndex||''} onChange={v => setAttributes({zIndex:v})} />
                        <VisibilityControls visibility={attributes.visibility||{}} onChange={v => setAttributes({visibility:v})} />
                    </PanelBody>

                    {/* ── ADVANCED (collapsible) ── */}
                    <PanelBody title={__('Advanced','snn')} initialOpen={false}>
                        <label style={{fontSize:'14px',fontWeight:500,display:'block',marginBottom:'4px',color:'#1e1e1e'}}>{__('Custom CSS','snn')}</label>
                        <TextareaControl value={attributes.customCSS||''} onChange={v => setAttributes({customCSS:v})}
                            placeholder=".your-class { color: red; }" style={{fontSize:'14px',fontFamily:'monospace'}} />
                    </PanelBody>
                    </div>
                </InspectorControls>
                <section {...innerBlocksProps} />
            </Fragment>
        );
    },
    save: () => null,
});
