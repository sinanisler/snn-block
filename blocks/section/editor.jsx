const { registerBlockType } = wp.blocks;
const { InspectorControls, useBlockProps, useInnerBlocksProps, InnerBlocks, MediaUpload } = wp.blockEditor;
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

registerBlockType('snn/section', {
    edit: function (props) {
        const { attributes, setAttributes } = props;
        const { activeDevice, getVal, setVal, inheritVal, getSides, setSides, inheritSides, getBorderWidth, setBorderWidth, getBorderRadius, setBorderRadius, getObj, setObj, inheritObj, getArr, setArr, inheritArr } = useResponsiveAttributes(attributes, setAttributes);
        const d = activeDevice;

        const previewStyles = {};
        const invBg = inheritVal('bgColor'); if (invBg) previewStyles.backgroundColor = invBg;
        const invText = inheritVal('textColor'); if (invText) previewStyles.color = invText;
        const bgImg = inheritObj('bgImage');
        if (bgImg.url) {
            previewStyles.backgroundImage = `url(${bgImg.url})`;
            previewStyles.backgroundSize = inheritVal('bgSize', 'cover');
            previewStyles.backgroundPosition = inheritVal('bgPosition', 'center center');
            previewStyles.backgroundRepeat = inheritVal('bgRepeat', 'no-repeat');
            previewStyles.backgroundAttachment = inheritVal('bgAttachment', 'scroll');
        }
        ['display','flexDirection','flexWrap','justifyContent','justifyItems','alignItems','alignContent','gap','gridColumns','textAlign','minHeight','width','height','minWidth','maxWidth','maxHeight',
         'gridRows','gridAutoFlow','rowGap','columnGap','flexGrow','flexShrink','flexBasis','alignSelf','order',
         'gridColumnStart','gridColumnEnd','gridRowStart','gridRowEnd',
         'objectFit','aspectRatio','cursor','pointerEvents','userSelect','resize','scrollBehavior',
         'scrollSnapType','scrollSnapAlign','scrollSnapStop','textOverflow','whiteSpace','wordBreak','verticalAlign',
         'boxSizing','willChange','isolation'].forEach(k => {
            const v = inheritVal(k); if (v) previewStyles[k==='gridColumns'?'gridTemplateColumns':k==='gridRows'?'gridTemplateRows':k==='gridAutoFlow'?'gridAutoFlow':k] = v;
        });
        const invOverflow = inheritVal('overflow'); if (invOverflow) previewStyles.overflow = invOverflow;
        // ── New controls preview ──
        const bgGradients = (Array.isArray(attributes.bgGradients) ? attributes.bgGradients :
            (attributes.bgGradient ? [{ css: attributes.bgGradient }] : []));
        const bgLayers = [];
        bgGradients.forEach(g => { if (g.css) bgLayers.push(g.css); });
        if (attributes.bgImage?.url) bgLayers.push('url(' + attributes.bgImage.url + ')');
        if (bgLayers.length) previewStyles.backgroundImage = bgLayers.join(', ');
        const invBgBlend = inheritVal('bgBlendMode'); if (invBgBlend && invBgBlend !== 'normal') previewStyles.backgroundBlendMode = invBgBlend;
        const outline = inheritObj('outline', {});
        if (outline.style && outline.style !== 'none') {
            let ol = ''; if (outline.width) ol += outline.width + ' '; ol += outline.style; if (outline.color) ol += ' ' + outline.color;
            if (ol) previewStyles.outline = ol;
        }
        const textShadowArr = inheritArr('textShadow');
        if (textShadowArr.length > 0) {
            previewStyles.textShadow = textShadowArr.map(s => `${s.x||'0'} ${s.y||'0'} ${s.blur||'0'} ${s.color||'rgba(0,0,0,0.2)'}`).join(', ');
        }
        const bfObj = inheritObj('backdropFilter', {});
        if (Object.keys(bfObj).length > 0) {
            const bfMap = {blur:'blur(%spx)',brightness:'brightness(%s%%)',contrast:'contrast(%s%%)',grayscale:'grayscale(%s%%)',hueRotate:'hue-rotate(%sdeg)',invert:'invert(%s%%)',saturate:'saturate(%s%%)',sepia:'sepia(%s%%)'};
            const bfParts = [];
            for (const [k, fmt] of Object.entries(bfMap)) {
                const v = bfObj[k];
                if (v !== '' && v !== null && v !== undefined) bfParts.push(fmt.replace('%s', v));
            }
            if (bfParts.length > 0) previewStyles.backdropFilter = bfParts.join(' ');
        }
        const transArr = inheritArr('transitions');
        if (transArr.length > 0) {
            previewStyles.transition = transArr.map(t => `${t.property||'all'} ${t.duration||'0.3s'} ${t.timing||'ease'} ${t.delay||'0s'}`).join(', ');
        }
        const animArr = inheritArr('animations');
        if (animArr.length > 0) {
            previewStyles.animation = animArr.map(a => `${a.name||'fadeIn'} ${a.duration||'0.5s'} ${a.timing||'ease'} ${a.delay||'0s'} ${a.iterationCount||'1'} ${a.direction||'normal'} ${a.fillMode||'forwards'}`).join(', ');
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

        // ── Typography preview ──
        const invFF = inheritVal('fontFamily'); if (invFF) previewStyles.fontFamily = invFF;
        const invFs = inheritVal('fontSize'); if (invFs) previewStyles.fontSize = invFs;
        const invFw = inheritVal('fontWeight'); if (invFw) previewStyles.fontWeight = invFw;
        const invLh = inheritVal('lineHeight'); if (invLh) previewStyles.lineHeight = invLh;
        const invLs = inheritVal('letterSpacing'); if (invLs) previewStyles.letterSpacing = invLs;
        const invTT = inheritVal('textTransform'); if (invTT) previewStyles.textTransform = invTT;

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
        const shadowArr = inheritArr('boxShadow');
        if (shadowArr.length > 0) {
            previewStyles.boxShadow = shadowArr.map(s => {
                const inset = (s.type || 'drop') === 'inner' ? 'inset ' : '';
                return `${inset}${s.x||'0'} ${s.y||'0'} ${s.blur||'0'} ${s.spread||'0'} ${s.color||'rgba(0,0,0,0.2)'}`;
            }).join(', ');
        }

        // ── Filter preview ──
        const filters = inheritObj('filter', {});
        const filterMap = {blur:'blur(%spx)',brightness:'brightness(%s%%)',contrast:'contrast(%s%%)',grayscale:'grayscale(%s%%)',hueRotate:'hue-rotate(%sdeg)',invert:'invert(%s%%)',saturate:'saturate(%s%%)',sepia:'sepia(%s%%)'};
        const filterParts = [];
        for (const [k, fmt] of Object.entries(filterMap)) {
            const v = filters[k];
            if (v !== '' && v !== null && v !== undefined) filterParts.push(fmt.replace('%s', v));
        }
        if (filterParts.length > 0) previewStyles.filter = filterParts.join(' ');

        // ── Transform preview ──
        const t = inheritObj('transform', {});
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
        const invOpacity = inheritVal('opacity'); if (invOpacity) previewStyles.opacity = invOpacity;

        // ── Blend Mode ──
        const invBlend = inheritVal('blendMode'); if (invBlend && invBlend !== 'normal') previewStyles.mixBlendMode = invBlend;

        // ── Position / Offsets / Z-Index ──
        const invPos = inheritVal('position'); if (invPos && invPos !== 'static') previewStyles.position = invPos;
        const offsets = inheritSides('offsets');
        if (offsets.top) previewStyles.top = offsets.top;
        if (offsets.right) previewStyles.right = offsets.right;
        if (offsets.bottom) previewStyles.bottom = offsets.bottom;
        if (offsets.left) previewStyles.left = offsets.left;
        const invZ = inheritVal('zIndex'); if (invZ) previewStyles.zIndex = invZ;

        const displayVal = inheritVal('display');
        const isFlex = displayVal === 'flex';
        const isGrid = displayVal === 'grid';

        // Overlay preview
        const overlay = inheritObj('bgOverlay', {});
        const overlayColor = overlay.color || '';
        const hasOverlay = !!overlayColor || !!overlay.gradient;
        const wrapperStyle = { ...previewStyles };
        if (hasOverlay) {
            wrapperStyle['--snn-overlay'] = overlayColor;
            wrapperStyle.position = wrapperStyle.position || 'relative';
        }

        const blockProps = useBlockProps({ className:'snn-section', style: wrapperStyle });
        const innerBlocksProps = useInnerBlocksProps(blockProps, { template: [['snn/container']] });

        /* ══════════════════════════════════════════
           SHARED STYLES
           ══════════════════════════════════════════ */
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
                    <OverflowSelect value={getVal('overflow')} onChange={v => setVal('overflow',v)} device={d} />

                    <CompactSection title={__('Background','snn')} />
                    <BackgroundControl attributes={attributes} setAttributes={setAttributes} device={d} />

                    <CompactSection title={__('Color & Type','snn')} />
                    <ColorRow label={__('Text','snn')} value={getVal('textColor')} onChange={v => setVal('textColor',v)} />
                    <div style={{display:'flex',gap:'4px',marginBottom:'2px'}}>
                        <input type="text" value={getVal('fontFamily')} onChange={e => setVal('fontFamily',e.target.value)}
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
                        <select value={getVal('textTransform')} onChange={e => setVal('textTransform',e.target.value)} style={{...sel,flex:0,minWidth:'48px'}}>
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
                        <OpacitySlider value={getVal('opacity')} onChange={v => setVal('opacity',v)} device={d} />
                        <BlendModeSelect value={getVal('blendMode')} onChange={v => setVal('blendMode',v)} />
                        <ShadowBuilder shadows={getArr('boxShadow')} onChange={v => setArr('boxShadow',v)} device={d} />
                        <FilterControls filters={getObj('filter',{})} onChange={v => setObj('filter',v)} device={d} />
                        <TransformControls transform={getObj('transform',{})} onChange={v => setObj('transform',v)} device={d} />
                    </PanelBody>

                    {/* ── POSITION (collapsible) ── */}
                    <PanelBody title={__('Position','snn')} initialOpen={false}>
                        <PositionSelect value={getVal('position')} onChange={v => setVal('position',v)} />
                        <OffsetInput offsets={getSides('offsets')} onChange={v => setSides('offsets',v)} device={d} />
                        <ZIndexControl value={getVal('zIndex')} onChange={v => setVal('zIndex',v)} />
                        <VisibilityControls visibility={attributes.visibility||{}} onChange={v => setAttributes({visibility:v})} />
                    </PanelBody>

                    {/* ── ADVANCED (collapsible) ── */}
                    <PanelBody title={__('Advanced','snn')} initialOpen={false}>
                        <label style={{fontSize:'14px',fontWeight:500,display:'block',marginBottom:'4px',color:'#1e1e1e'}}>{__('Custom CSS','snn')}</label>
                        <TextareaControl value={attributes.customCSS||''} onChange={v => setAttributes({customCSS:v})}
                            placeholder=".your-class { color: red; }" style={{fontSize:'14px',fontFamily:'monospace'}} />
                    </PanelBody>

                    {/* ── MORE CONTROLS (new: backdrop-filter, outline, text-shadow, animations, etc.) ── */}
                    <PanelBody title={__('More Controls','snn')} initialOpen={false}>

                        {/* Visual Effects */}
                        <CompactSection title={__('Visual Effects','snn')} />
                        <BackdropFilterControl filters={getObj('backdropFilter', {})} onChange={v => setObj('backdropFilter', v)} device={d} />
                        <OutlineControl width={getObj('outline', {}).width||''} style={getObj('outline', {}).style||''} color={getObj('outline', {}).color||''}
                            onWidthChange={v => setObj('outline', {...getObj('outline',{}),width:v})}
                            onStyleChange={v => setObj('outline', {...getObj('outline',{}),style:v})}
                            onColorChange={v => setObj('outline', {...getObj('outline',{}),color:v})} device={d} />
                        <TextShadowControl shadows={getArr('textShadow')} onChange={v => setArr('textShadow', v)} device={d} />
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
                        <TransitionBuilder transitions={getArr('transitions')} onChange={v => setArr('transitions', v)} device={d} />
                        <AnimationBuilder animations={getArr('animations')} onChange={v => setArr('animations', v)} device={d} />

                        {/* Misc */}
                        <CompactSection title={__('Misc','snn')} />
                        <WillChangeSelect value={getVal('willChange')} onChange={v => setVal('willChange',v)} />
                        <IsolationSelect value={getVal('isolation')} onChange={v => setVal('isolation',v)} />
                        <ListStyleControl type={getObj('listStyle',{}).type||''} position={getObj('listStyle',{}).position||''}
                            onTypeChange={v => setObj('listStyle', {...getObj('listStyle',{}),type:v})}
                            onPositionChange={v => setObj('listStyle', {...getObj('listStyle',{}),position:v})} />
                        <InsetControl value={getObj('inset',{top:'',right:'',bottom:'',left:''})} onChange={v => setObj('inset', v)} device={d} />
                        <CompactSelect label={__('Bg Blend','snn')} value={getVal('bgBlendMode')}
                            options={[{value:'',label:'—'},{value:'normal',label:'Normal'},{value:'multiply',label:'Multiply'},{value:'screen',label:'Screen'},{value:'overlay',label:'Overlay'},{value:'darken',label:'Darken'},{value:'lighten',label:'Lighten'},{value:'color-dodge',label:'Color Dodge'},{value:'color-burn',label:'Color Burn'},{value:'hard-light',label:'Hard Light'},{value:'soft-light',label:'Soft Light'},{value:'difference',label:'Difference'},{value:'exclusion',label:'Exclusion'},{value:'hue',label:'Hue'},{value:'saturation',label:'Saturation'},{value:'color',label:'Color'},{value:'luminosity',label:'Luminosity'}]}
                            onChange={v => setVal('bgBlendMode',v)} />
                    </PanelBody>
                    </div>
                </InspectorControls>
                <section {...innerBlocksProps} />
            </Fragment>
        );
    },
    save: () => <InnerBlocks.Content />,
});
