const { registerBlockType } = wp.blocks;
const { InspectorControls, useBlockProps, useInnerBlocksProps, InnerBlocks, MediaUpload } = wp.blockEditor;
const { Button, TextareaControl, PanelBody } = wp.components;
const { Fragment } = wp.element;
const { useSelect } = wp.data;
const { __ } = wp.i18n;

const {
    DeviceSwitcher, CompactSection, CompactRow, CompactLabel,
    ColorRow, SpacingInput, BorderControl, BorderRadiusControl,
    ShadowBuilder, FilterControls, TransformControls, OpacitySlider,
    BlendModeSelect, AlignRow,
    ToggleField, IconToggleField, CompactSelect, RangeUnitField,
    PositionSelect, OffsetInput, ZIndexControl, VisibilityControls,
    OverflowSelect, useResponsiveAttributes,
    DirectionIcons, JustifyIcons, AlignIcons, WrapIcons,
    // ── NEW CONTROLS ──
    BackgroundControl, GradientBuilder,
    DimensionsControl, SizeInput, BoxSizingSelect,
    GapControl, GridTemplateControl, FlexChildControl, GridPlacementControl, OrderControl,
    BackdropFilterControl, OutlineControl, TextShadowControl, ClipPathControl, ObjectFitControl, AspectRatioControl,
    CursorSelect, PointerEventsSelect, UserSelectSelect, ResizeSelect, ScrollBehaviorSelect, ScrollSnapControl,
    TextOverflowSelect, WhiteSpaceSelect, WordBreakSelect, VerticalAlignSelect,
    TransitionBuilder, AnimationBuilder,
    WillChangeSelect, IsolationSelect, ListStyleControl, InsetControl,
} = window.SNNControls;

registerBlockType('snn/container', {
    transforms: {
        from: [{
            type: 'block', isMultiBlock: true, blocks: ['*'],
            __experimentalConvert: function (blocks) {
                return wp.blocks.createBlock('snn/container', {}, blocks.map(function (b) {
                    return wp.blocks.createBlock(b.name, Object.assign({}, b.attributes),
                        (b.innerBlocks||[]).map(function (inner) {
                            return wp.blocks.createBlock(inner.name, Object.assign({}, inner.attributes), inner.innerBlocks);
                        })
                    );
                }));
            }
        }]
    },
    edit: function (props) {
        const { attributes, setAttributes } = props;
        const { activeDevice, getVal, setVal, inheritVal, getSides, setSides, inheritSides, getBorderWidth, setBorderWidth, getBorderRadius, setBorderRadius } = useResponsiveAttributes(attributes, setAttributes);
        const d = activeDevice;

        const themeContentSize = useSelect(select => {
            const s = select('core/editor')?.getEditorSettings();
            return s?.__experimentalFeatures?.layout?.contentSize || '1200px';
        }, []);

        const previewStyles = {};
        const maxW = attributes.maxWidth || themeContentSize;
        previewStyles.maxWidth = maxW;
        previewStyles.marginLeft = 'auto';
        previewStyles.marginRight = 'auto';
        const invBg = inheritVal('bgColor'); if (invBg) previewStyles.backgroundColor = invBg;
        const invText = inheritVal('textColor'); if (invText) previewStyles.color = invText;
        if (attributes.bgImage?.url) {
            previewStyles.backgroundImage = `url(${attributes.bgImage.url})`;
            previewStyles.backgroundSize = attributes.bgSize || 'cover';
            previewStyles.backgroundPosition = attributes.bgPosition || 'center center';
            previewStyles.backgroundRepeat = attributes.bgRepeat || 'no-repeat';
            previewStyles.backgroundAttachment = attributes.bgAttachment || 'scroll';
        }
        ['display','flexDirection','flexWrap','justifyContent','justifyItems','alignItems','alignContent','gap','gridColumns','textAlign','minHeight','width','height','minWidth','maxHeight',
         'gridRows','gridAutoFlow','rowGap','columnGap','flexGrow','flexShrink','flexBasis','alignSelf','order',
         'gridColumnStart','gridColumnEnd','gridRowStart','gridRowEnd',
         'objectFit','aspectRatio','cursor','pointerEvents','userSelect','resize','scrollBehavior',
         'scrollSnapType','scrollSnapAlign','scrollSnapStop','textOverflow','whiteSpace','wordBreak','verticalAlign',
         'boxSizing','willChange','isolation'].forEach(k => {
            const v = inheritVal(k); if (v) previewStyles[k==='gridColumns'?'gridTemplateColumns':k==='gridRows'?'gridTemplateRows':k==='gridAutoFlow'?'gridAutoFlow':k] = v;
        });
        if (attributes.overflow) previewStyles.overflow = attributes.overflow;
        // ── New controls preview ──
        if (attributes.bgGradient) {
            if (attributes.bgImage?.url) previewStyles.backgroundImage = attributes.bgGradient + ', url(' + attributes.bgImage.url + ')';
            else previewStyles.backgroundImage = attributes.bgGradient;
        }
        if (attributes.bgBlendMode && attributes.bgBlendMode !== 'normal') previewStyles.backgroundBlendMode = attributes.bgBlendMode;
        const outline = (Array.isArray(attributes.outline) ? {} : (attributes.outline || {}));
        if (outline.style && outline.style !== 'none') {
            let ol = ''; if (outline.width) ol += outline.width + ' '; ol += outline.style; if (outline.color) ol += ' ' + outline.color;
            if (ol) previewStyles.outline = ol;
        }
        if (attributes.textShadow && attributes.textShadow.length > 0) {
            previewStyles.textShadow = attributes.textShadow.map(s => `${s.x||'0'} ${s.y||'0'} ${s.blur||'0'} ${s.color||'rgba(0,0,0,0.2)'}`).join(', ');
        }
        if (attributes.backdropFilter && !Array.isArray(attributes.backdropFilter)) {
            const bfMap = {blur:'blur(%spx)',brightness:'brightness(%s%%)',contrast:'contrast(%s%%)',grayscale:'grayscale(%s%%)',hueRotate:'hue-rotate(%sdeg)',invert:'invert(%s%%)',saturate:'saturate(%s%%)',sepia:'sepia(%s%%)'};
            const bfParts = [];
            for (const [k, fmt] of Object.entries(bfMap)) {
                const v = attributes.backdropFilter[k];
                if (v !== '' && v !== null && v !== undefined) bfParts.push(fmt.replace('%s', v));
            }
            if (bfParts.length > 0) previewStyles.backdropFilter = bfParts.join(' ');
        }
        if (attributes.transitions && attributes.transitions.length > 0) {
            previewStyles.transition = attributes.transitions.map(t => `${t.property||'all'} ${t.duration||'0.3s'} ${t.timing||'ease'} ${t.delay||'0s'}`).join(', ');
        }
        if (attributes.animations && attributes.animations.length > 0) {
            previewStyles.animation = attributes.animations.map(a => `${a.name||'fadeIn'} ${a.duration||'0.5s'} ${a.timing||'ease'} ${a.delay||'0s'} ${a.iterationCount||'1'} ${a.direction||'normal'} ${a.fillMode||'forwards'}`).join(', ');
        }
        const pad = inheritSides('padding');
        if (pad.top) previewStyles.paddingTop = pad.top;
        if (pad.right) previewStyles.paddingRight = pad.right;
        if (pad.bottom) previewStyles.paddingBottom = pad.bottom;
        if (pad.left) previewStyles.paddingLeft = pad.left;

        // ── Margin preview ──
        const mar = inheritSides('margin');
        if (mar.top) previewStyles.marginTop = mar.top;
        if (mar.right) previewStyles.marginRight = mar.right;
        if (mar.bottom) previewStyles.marginBottom = mar.bottom;
        if (mar.left) previewStyles.marginLeft = mar.left;

        // ── Border preview ──
        const border = (Array.isArray(attributes.border) ? {} : (attributes.border || {}));
        const bw = getBorderWidth();
        const hasBorderWidth = bw.top || bw.right || bw.bottom || bw.left;
        const borderStyle = border.style || (hasBorderWidth ? 'solid' : '');
        if (borderStyle && borderStyle !== 'none') {
            previewStyles.borderStyle = borderStyle;
            if (bw.top) previewStyles.borderTopWidth = bw.top;
            if (bw.right) previewStyles.borderRightWidth = bw.right;
            if (bw.bottom) previewStyles.borderBottomWidth = bw.bottom;
            if (bw.left) previewStyles.borderLeftWidth = bw.left;
            if (border.color) previewStyles.borderColor = border.color;
        }

        // ── Border Radius preview ──
        const br = getBorderRadius();
        if (br.topLeft) previewStyles.borderTopLeftRadius = br.topLeft;
        if (br.topRight) previewStyles.borderTopRightRadius = br.topRight;
        if (br.bottomRight) previewStyles.borderBottomRightRadius = br.bottomRight;
        if (br.bottomLeft) previewStyles.borderBottomLeftRadius = br.bottomLeft;

        // ── Box Shadow preview ──
        if (attributes.boxShadow && attributes.boxShadow.length > 0) {
            previewStyles.boxShadow = attributes.boxShadow.map(s => {
                const inset = (s.type || 'drop') === 'inner' ? 'inset ' : '';
                return `${inset}${s.x||'0'} ${s.y||'0'} ${s.blur||'0'} ${s.spread||'0'} ${s.color||'rgba(0,0,0,0.2)'}`;
            }).join(', ');
        }

        // ── Filter preview ──
        const filters = (Array.isArray(attributes.filter) ? {} : (attributes.filter || {}));
        const filterMap = {blur:'blur(%spx)',brightness:'brightness(%s%%)',contrast:'contrast(%s%%)',grayscale:'grayscale(%s%%)',hueRotate:'hue-rotate(%sdeg)',invert:'invert(%s%%)',saturate:'saturate(%s%%)',sepia:'sepia(%s%%)'};
        const filterParts = [];
        for (const [k, fmt] of Object.entries(filterMap)) {
            const v = filters[k];
            if (v !== '' && v !== null && v !== undefined) filterParts.push(fmt.replace('%s', v));
        }
        if (filterParts.length > 0) previewStyles.filter = filterParts.join(' ');

        // ── Transform preview ──
        const t = (Array.isArray(attributes.transform) ? {} : (attributes.transform || {}));
        const transformParts = [];
        const tx = t.translateX || '', ty = t.translateY || '';
        if (tx !== '' || ty !== '') transformParts.push(`translate(${tx||'0'}, ${ty||'0'})`);
        const sx = t.scaleX || '', sy = t.scaleY || '';
        if (sx !== '' || sy !== '') transformParts.push(`scale(${sx||'1'}, ${sy||'1'})`);
        if (t.rotate) transformParts.push(`rotate(${t.rotate})`);
        const kx = t.skewX || '', ky = t.skewY || '';
        if (kx !== '' || ky !== '') transformParts.push(`skew(${kx||'0'}, ${ky||'0'})`);
        if (transformParts.length > 0) previewStyles.transform = transformParts.join(' ');

        // ── Opacity ──
        if (attributes.opacity !== '' && attributes.opacity !== null) previewStyles.opacity = attributes.opacity;

        // ── Blend Mode ──
        if (attributes.blendMode && attributes.blendMode !== 'normal') previewStyles.mixBlendMode = attributes.blendMode;

        // ── Position / Offsets / Z-Index ──
        if (attributes.position && attributes.position !== 'static') previewStyles.position = attributes.position;
        const offsets = (Array.isArray(attributes.offsets) ? {} : (attributes.offsets || {}));
        if (offsets.top) previewStyles.top = offsets.top;
        if (offsets.right) previewStyles.right = offsets.right;
        if (offsets.bottom) previewStyles.bottom = offsets.bottom;
        if (offsets.left) previewStyles.left = offsets.left;
        if (attributes.zIndex !== '' && attributes.zIndex !== null) previewStyles.zIndex = attributes.zIndex;

        const displayVal = inheritVal('display');
        const isFlex = displayVal === 'flex';
        const isGrid = displayVal === 'grid';

        // Overlay preview — sets CSS var consumed by ::before in block.css
        const overlayColor = attributes.bgOverlay?.color || '';
        const hasOverlay = !!overlayColor;
        const wrapperStyle = { ...previewStyles };
        if (hasOverlay) {
            wrapperStyle['--snn-overlay'] = overlayColor;
            wrapperStyle.position = wrapperStyle.position || 'relative';
        }

        const blockProps = useBlockProps({ className:'snn-container', style: wrapperStyle });
        const innerBlocksProps = useInnerBlocksProps(blockProps, {});

        const sel = { fontSize:'14px',padding:'3px 6px',border:'1px solid #949494',borderRadius:'3px',height:'26px',flex:1,background:'#fff',minWidth:0 };
        const tinyInp = { width:'100%',padding:'4px 6px',fontSize:'14px',fontFamily:'monospace',border:'1px solid #ddd',borderRadius:'3px',boxSizing:'border-box',lineHeight:'20px' };

        return (
            <Fragment>
                <InspectorControls>
                    <div style={{ padding: '0 10px' }}>
                    <DeviceSwitcher />

                    {/* ── CONTAINER ── */}
                    <div style={{display:'flex',alignItems:'center',gap:'6px',marginBottom:'6px'}}>
                        <span style={{fontSize:'14px',fontWeight:600,textTransform:'uppercase',color:'#1e1e1e',minWidth:'50px'}}>{__('Max W','snn')}</span>
                        <input type="text" value={attributes.maxWidth||''} onChange={e => setAttributes({maxWidth:e.target.value})}
                            placeholder={themeContentSize} style={{...tinyInp,flex:1}} />
                    </div>

                    {/* ── LAYOUT ── */}
                    <ToggleField label={__('Display','snn')} value={displayVal}
                        options={[{label:'Block',value:'block'},{label:'Flex',value:'flex'},{label:'Grid',value:'grid'},{label:'Inline',value:'inline-block'},{label:'None',value:'none'}]}
                        onChange={v => setVal('display',v)} />
                    <CompactSelect label={__('Align','snn')} value={getVal('textAlign')}
                        options={[{value:'',label:'—'},{value:'left',label:'Left'},{value:'center',label:'Center'},{value:'right',label:'Right'}]}
                        onChange={v => setVal('textAlign',v)} />

                    {/* ── FLEX: Direction / Wrap / Justify / Align ── */}
                    {isFlex && <div style={{ marginBottom:'6px', padding:'8px', background:'#f9fafc', borderRadius:'4px', border:'1px solid #e8ecf1' }}>
                        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'4px' }}>
                            <DirectionIcons value={getVal('flexDirection')} onChange={v => setVal('flexDirection',v)} />
                            <WrapIcons value={getVal('flexWrap')} onChange={v => setVal('flexWrap',v)} />
                        </div>
                        <JustifyIcons value={getVal('justifyContent')} onChange={v => setVal('justifyContent',v)} isGrid={false} />
                        <AlignIcons value={getVal('alignItems')} onChange={v => setVal('alignItems',v)} isGrid={false} />
                    </div>}

                    {/* ── GRID: Columns / Justify Items / Align Items / Justify Content / Align Content ── */}
                    {isGrid && <div style={{ marginBottom:'6px', padding:'8px', background:'#f9fafc', borderRadius:'4px', border:'1px solid #e8ecf1' }}>
                        <div style={{ display:'flex',alignItems:'center',gap:'6px',marginBottom:'8px' }}>
                            <span style={{ fontSize:'14px',fontWeight:600,color:'#1e1e1e',whiteSpace:'nowrap' }}>{__('Columns','snn')}</span>
                            <input type="text" value={getVal('gridColumns')} onChange={e => setVal('gridColumns',e.target.value)}
                                placeholder="1fr 1fr" style={{...tinyInp,flex:1}} />
                        </div>
                        <JustifyIcons value={getVal('justifyItems')} onChange={v => setVal('justifyItems',v)} isGrid={true} label={__('Justify Items','snn')} />
                        <AlignIcons value={getVal('alignItems')} onChange={v => setVal('alignItems',v)} isGrid={true} />
                        <JustifyIcons value={getVal('justifyContent')} onChange={v => setVal('justifyContent',v)} isGrid={true} label={__('Justify Content','snn')} />
                        <JustifyIcons value={getVal('alignContent')} onChange={v => setVal('alignContent',v)} isGrid={true} label={__('Align Content','snn')} />
                    </div>}

                    {/* ── GAP (only for flex/grid) ── */}
                    {(isFlex || isGrid) && <div style={{ display:'flex',gap:'4px',marginBottom:'6px' }}>
                        <input type="text" value={getVal('gap')} onChange={e => setVal('gap',e.target.value)}
                            placeholder={__('Gap','snn')} style={{...tinyInp,flex:1}} />
                    </div>}

                    <CompactSection title={__('Spacing','snn')} />
                    <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:'6px',marginBottom:'6px' }}>
                        <div><label style={{fontSize:'14px',fontWeight:500,color:'#1e1e1e',display:'block',marginBottom:'2px'}}>{__('Padding','snn')}</label>
                            <SpacingInput values={getSides('padding')} onChange={v => setSides('padding',v)} device={d} /></div>
                        <div><label style={{fontSize:'14px',fontWeight:500,color:'#1e1e1e',display:'block',marginBottom:'2px'}}>{__('Margin','snn')}</label>
                            <SpacingInput values={getSides('margin')} onChange={v => setSides('margin',v)} device={d} /></div>
                    </div>

                    <CompactSection title={__('Sizing','snn')} />
                    <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'4px',marginBottom:'6px' }}>
                        {[{k:'width',l:'W'},{k:'height',l:'H'},{k:'minWidth',l:'MinW'},{k:'maxHeight',l:'MaxH'},{k:'minHeight',l:'MinH'}].map(f => (
                            <div key={f.k} style={{display:'flex',alignItems:'center',gap:'3px'}}>
                                <span style={{fontSize:'14px',fontWeight:500,color:'#1e1e1e',minWidth:'28px'}}>{f.l}</span>
                                <input type="text" value={getVal(f.k)} onChange={e => setVal(f.k,e.target.value)}
                                    placeholder="—" style={{...tinyInp,flex:1,textAlign:'center',padding:'4px 4px',fontSize:'14px'}} />
                            </div>
                        ))}
                    </div>
                    <OverflowSelect value={attributes.overflow||''} onChange={v => setAttributes({overflow:v})} device={d} />

                    <CompactSection title={__('Background','snn')} />

                    {/* ── 1. Background Color ── */}
                    <ColorRow label={__('Color','snn')} value={getVal('bgColor')} onChange={v => setVal('bgColor',v)} />

                    {/* ── 2. Background Image with thumbnail preview ── */}
                    <div style={{ marginBottom:'8px' }}>
                        <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'4px' }}>
                            <span style={{ fontSize:'14px',fontWeight:600,color:'#1e1e1e' }}>{__('Image','snn')}</span>
                            <MediaUpload onSelect={m => setAttributes({bgImage:{id:m.id,url:m.url,alt:m.alt||''}})} allowedTypes={['image']} value={attributes.bgImage?.id||0}
                                render={({open}) => (
                                    <button type="button" onClick={open} style={{ border:'none',background:'#3858e9',color:'#fff',borderRadius:'3px',padding:'3px 10px',fontSize:'13px',cursor:'pointer',fontWeight:500 }}>
                                        {attributes.bgImage?.url ? __('Change','snn') : __('+ Add','snn')}
                                    </button>
                                )} />
                        </div>
                        {attributes.bgImage?.url ? (
                            <div style={{ position:'relative',borderRadius:'4px',overflow:'hidden',border:'1px solid #d0d0d0',marginBottom:'4px' }}>
                                <img src={attributes.bgImage.url} alt={attributes.bgImage.alt||''}
                                    style={{ width:'100%',height:'80px',objectFit:'cover',display:'block' }} />
                                <button type="button" onClick={() => setAttributes({bgImage:{id:0,url:'',alt:''}})}
                                    title={__('Remove image','snn')}
                                    style={{ position:'absolute',top:'4px',right:'4px',width:'24px',height:'24px',borderRadius:'50%',border:'none',background:'rgba(0,0,0,0.55)',color:'#fff',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'12px',padding:0,lineHeight:1 }}>
                                    ✕
                                </button>
                            </div>
                        ) : (
                            <MediaUpload onSelect={m => setAttributes({bgImage:{id:m.id,url:m.url,alt:m.alt||''}})} allowedTypes={['image']} value={attributes.bgImage?.id||0}
                                render={({open}) => (
                                    <button type="button" onClick={open} style={{ width:'100%',height:'60px',border:'1px dashed #b0b0b0',borderRadius:'4px',background:'#fafafa',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:'6px',fontSize:'14px',color:'#757575' }}>
                                        <span style={{ fontSize:'20px' }}>🖼</span> {__('Select image','snn')}
                                    </button>
                                )} />
                        )}
                    </div>

                    {/* ── 3-6. Size / Position / Repeat / Attachment ── */}
                    <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:'4px',marginBottom:'4px' }}>
                        <div>
                            <span style={{ fontSize:'13px',fontWeight:500,color:'#1e1e1e',display:'block',marginBottom:'2px' }}>{__('Size','snn')}</span>
                            <select value={attributes.bgSize||'cover'} onChange={e => setAttributes({bgSize:e.target.value})} style={sel}>
                                <option value="cover">Cover</option><option value="contain">Contain</option><option value="auto">Auto</option>
                            </select>
                        </div>
                        <div>
                            <span style={{ fontSize:'13px',fontWeight:500,color:'#1e1e1e',display:'block',marginBottom:'2px' }}>{__('Position','snn')}</span>
                            <select value={attributes.bgPosition||'center center'} onChange={e => setAttributes({bgPosition:e.target.value})} style={sel}>
                                <option value="left top">Left Top</option><option value="center top">Center Top</option><option value="right top">Right Top</option>
                                <option value="left center">Left Center</option><option value="center center">Center</option><option value="right center">Right Center</option>
                                <option value="left bottom">Left Bottom</option><option value="center bottom">Center Bottom</option><option value="right bottom">Right Bottom</option>
                            </select>
                        </div>
                        <div>
                            <span style={{ fontSize:'13px',fontWeight:500,color:'#1e1e1e',display:'block',marginBottom:'2px' }}>{__('Repeat','snn')}</span>
                            <select value={attributes.bgRepeat||'no-repeat'} onChange={e => setAttributes({bgRepeat:e.target.value})} style={sel}>
                                <option value="no-repeat">No Repeat</option><option value="repeat">Repeat</option>
                                <option value="repeat-x">Repeat X</option><option value="repeat-y">Repeat Y</option>
                            </select>
                        </div>
                        <div>
                            <span style={{ fontSize:'13px',fontWeight:500,color:'#1e1e1e',display:'block',marginBottom:'2px' }}>{__('Attachment','snn')}</span>
                            <select value={attributes.bgAttachment||'scroll'} onChange={e => setAttributes({bgAttachment:e.target.value})} style={sel}>
                                <option value="scroll">Scroll</option><option value="fixed">Fixed</option>
                            </select>
                        </div>
                    </div>

                    {/* ── 7. Background Overlay ── */}
                    <ColorRow label={__('Overlay','snn')} value={attributes.bgOverlay?.color||''} onChange={v => setAttributes({bgOverlay:{...(attributes.bgOverlay||{}),color:v}})} />

                    <CompactSection title={__('Color','snn')} />
                    <ColorRow label={__('Text','snn')} value={getVal('textColor')} onChange={v => setVal('textColor',v)} />

                    <CompactSection title={__('Border & Radius','snn')} />
                    <BorderControl width={getBorderWidth()} style={attributes.border?.style||''} color={attributes.border?.color||''}
                        onWidthChange={v => setBorderWidth(v)} onStyleChange={v => setAttributes({border:{...(attributes.border||{}),style:v}})}
                        onColorChange={v => setAttributes({border:{...(attributes.border||{}),color:v}})} device={d} />
                    <BorderRadiusControl values={getBorderRadius()} onChange={v => setBorderRadius(v)} device={d} />

                    {/* ── EFFECTS ── */}
                    <PanelBody title={__('Effects','snn')} initialOpen={false}>
                        <OpacitySlider value={attributes.opacity||''} onChange={v => setAttributes({opacity:v})} device={d} />
                        <BlendModeSelect value={attributes.blendMode||''} onChange={v => setAttributes({blendMode:v})} />
                        <ShadowBuilder shadows={attributes.boxShadow||[]} onChange={v => setAttributes({boxShadow:v})} device={d} />
                        <FilterControls filters={attributes.filter||{}} onChange={v => setAttributes({filter:v})} device={d} />
                        <TransformControls transform={attributes.transform||{}} onChange={v => setAttributes({transform:v})} device={d} />
                    </PanelBody>

                    {/* ── POSITION ── */}
                    <PanelBody title={__('Position','snn')} initialOpen={false}>
                        <PositionSelect value={attributes.position||''} onChange={v => setAttributes({position:v})} />
                        <OffsetInput offsets={attributes.offsets||{}} onChange={v => setAttributes({offsets:v})} device={d} />
                        <ZIndexControl value={attributes.zIndex||''} onChange={v => setAttributes({zIndex:v})} />
                        <VisibilityControls visibility={attributes.visibility||{}} onChange={v => setAttributes({visibility:v})} />
                    </PanelBody>

                    {/* ── ADVANCED ── */}
                    <PanelBody title={__('Advanced','snn')} initialOpen={false}>
                        <label style={{fontSize:'14px',fontWeight:500,display:'block',marginBottom:'4px',color:'#1e1e1e'}}>{__('Custom CSS','snn')}</label>
                        <TextareaControl value={attributes.customCSS||''} onChange={v => setAttributes({customCSS:v})}
                            placeholder=".your-class { color: red; }" style={{fontSize:'14px',fontFamily:'monospace'}} />
                    </PanelBody>

                    {/* ── MORE CONTROLS (new: backdrop-filter, outline, text-shadow, animations, etc.) ── */}
                    <PanelBody title={__('More Controls','snn')} initialOpen={false}>

                        {/* Visual Effects */}
                        <CompactSection title={__('Visual Effects','snn')} />
                        <BackdropFilterControl filters={attributes.backdropFilter||{}} onChange={v => setAttributes({backdropFilter:v})} device={d} />
                        <OutlineControl width={attributes.outline?.width||''} style={attributes.outline?.style||''} color={attributes.outline?.color||''}
                            onWidthChange={v => setAttributes({outline:{...(attributes.outline||{}),width:v}})}
                            onStyleChange={v => setAttributes({outline:{...(attributes.outline||{}),style:v}})}
                            onColorChange={v => setAttributes({outline:{...(attributes.outline||{}),color:v}})} device={d} />
                        <TextShadowControl shadows={attributes.textShadow||[]} onChange={v => setAttributes({textShadow:v})} device={d} />
                        <ClipPathControl value={getVal('clipPath')} onChange={v => setVal('clipPath',v)} device={d} />
                        <ObjectFitControl value={getVal('objectFit')} onChange={v => setVal('objectFit',v)} device={d} />
                        <AspectRatioControl value={getVal('aspectRatio')} onChange={v => setVal('aspectRatio',v)} device={d} />

                        {/* Interaction */}
                        <CompactSection title={__('Interaction','snn')} />
                        <CursorSelect value={getVal('cursor')} onChange={v => setVal('cursor',v)} />
                        <PointerEventsSelect value={getVal('pointerEvents')} onChange={v => setVal('pointerEvents',v)} />
                        <UserSelectSelect value={getVal('userSelect')} onChange={v => setVal('userSelect',v)} />
                        <ResizeSelect value={getVal('resize')} onChange={v => setVal('resize',v)} />
                        <ScrollBehaviorSelect value={getVal('scrollBehavior')} onChange={v => setVal('scrollBehavior',v)} />
                        <ScrollSnapControl getVal={getVal} setVal={setVal} device={d} />

                        {/* Text Advanced */}
                        <CompactSection title={__('Text Advanced','snn')} />
                        <TextOverflowSelect value={getVal('textOverflow')} onChange={v => setVal('textOverflow',v)} />
                        <WhiteSpaceSelect value={getVal('whiteSpace')} onChange={v => setVal('whiteSpace',v)} />
                        <WordBreakSelect value={getVal('wordBreak')} onChange={v => setVal('wordBreak',v)} />
                        <VerticalAlignSelect value={getVal('verticalAlign')} onChange={v => setVal('verticalAlign',v)} />

                        {/* Layout Extra */}
                        <CompactSection title={__('Layout Extra','snn')} />
                        <BoxSizingSelect value={getVal('boxSizing')} onChange={v => setVal('boxSizing',v)} />
                        <OrderControl getVal={getVal} setVal={setVal} device={d} />
                        {isFlex && <FlexChildControl getVal={getVal} setVal={setVal} device={d} />}
                        {isGrid && <GridPlacementControl getVal={getVal} setVal={setVal} device={d} />}

                        {/* Animations */}
                        <CompactSection title={__('Animations','snn')} />
                        <TransitionBuilder transitions={attributes.transitions||[]} onChange={v => setAttributes({transitions:v})} device={d} />
                        <AnimationBuilder animations={attributes.animations||[]} onChange={v => setAttributes({animations:v})} device={d} />

                        {/* Misc */}
                        <CompactSection title={__('Misc','snn')} />
                        <WillChangeSelect value={getVal('willChange')} onChange={v => setVal('willChange',v)} />
                        <IsolationSelect value={getVal('isolation')} onChange={v => setVal('isolation',v)} />
                        <ListStyleControl type={attributes.listStyle?.type||''} position={attributes.listStyle?.position||''}
                            onTypeChange={v => setAttributes({listStyle:{...(attributes.listStyle||{}),type:v}})}
                            onPositionChange={v => setAttributes({listStyle:{...(attributes.listStyle||{}),position:v}})} />
                        <InsetControl value={attributes.inset||{}} onChange={v => setAttributes({inset:v})} device={d} />
                        <CompactSelect label={__('Bg Blend','snn')} value={attributes.bgBlendMode||''}
                            options={[{value:'',label:'—'},{value:'normal',label:'Normal'},{value:'multiply',label:'Multiply'},{value:'screen',label:'Screen'},{value:'overlay',label:'Overlay'},{value:'darken',label:'Darken'},{value:'lighten',label:'Lighten'},{value:'color-dodge',label:'Color Dodge'},{value:'color-burn',label:'Color Burn'},{value:'hard-light',label:'Hard Light'},{value:'soft-light',label:'Soft Light'},{value:'difference',label:'Difference'},{value:'exclusion',label:'Exclusion'},{value:'hue',label:'Hue'},{value:'saturation',label:'Saturation'},{value:'color',label:'Color'},{value:'luminosity',label:'Luminosity'}]}
                            onChange={v => setAttributes({bgBlendMode:v})} />
                    </PanelBody>
                    </div>
                </InspectorControls>
                <div {...innerBlocksProps} />
            </Fragment>
        );
    },
    save: () => <InnerBlocks.Content />,
});
