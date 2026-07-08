const { registerBlockType } = wp.blocks;
const { InspectorControls, useBlockProps, RichText } = wp.blockEditor;
const { PanelBody, TextareaControl } = wp.components;
const { Fragment, useEffect, useRef } = wp.element;
const { __ } = wp.i18n;

const {
    DeviceSwitcher, CompactSection, ColorRow,
    SpacingInput, BorderControl, BorderRadiusControl,
    ShadowBuilder, FilterControls, TransformControls, OpacitySlider,
    BlendModeSelect, ToggleField, CompactSelect,
    PositionSelect, VisibilityControls,
    OverflowSelect, useResponsiveAttributes,
    BackgroundControl,
    BackdropFilterControl, OutlineControl, TextShadowControl,
    ClipPathControl, ObjectFitControl, AspectRatioControl,
    CursorSelect, PointerEventsSelect, UserSelectSelect,
    ResizeSelect,
    TextOverflowSelect, WhiteSpaceSelect, WordBreakSelect, VerticalAlignSelect,
    TransitionBuilder, AnimationBuilder,
    WillChangeSelect, IsolationSelect,
} = window.SNNControls;

/* ── Shared preview helper (same as Box block) ── */
function computeBoxPreview(attributes, inheritVal, inheritObj, inheritArr, inheritSides, getBorderWidth, getBorderRadius, d) {
    const s = {};
    const invBg = inheritVal('bgColor'); if (invBg) s.backgroundColor = invBg;
    const invText = inheritVal('textColor'); if (invText) s.color = invText;
    const invFF = inheritVal('fontFamily'); if (invFF) s.fontFamily = invFF;
    const invFs = inheritVal('fontSize'); if (invFs) s.fontSize = invFs;
    const invFw = inheritVal('fontWeight'); if (invFw) s.fontWeight = invFw;
    const invLh = inheritVal('lineHeight'); if (invLh) s.lineHeight = invLh;
    const invLs = inheritVal('letterSpacing'); if (invLs) s.letterSpacing = invLs;
    const invTT = inheritVal('textTransform'); if (invTT) s.textTransform = invTT;
    const bgImg = inheritObj('bgImage');
    if (bgImg.url) {
        s.backgroundImage = `url(${bgImg.url})`;
        s.backgroundSize = inheritVal('bgSize', 'cover');
        s.backgroundPosition = inheritVal('bgPosition', 'center center');
        s.backgroundRepeat = inheritVal('bgRepeat', 'no-repeat');
        s.backgroundAttachment = inheritVal('bgAttachment', 'scroll');
    }
    const bgGradients = (Array.isArray(attributes.bgGradients) ? attributes.bgGradients :
        (attributes.bgGradient ? [{ css: attributes.bgGradient }] : []));
    const bgLayers = [];
    bgGradients.forEach(g => { if (g.css) bgLayers.push(g.css); });
    if (attributes.bgImage?.url && !bgImg.url) bgLayers.push('url(' + attributes.bgImage.url + ')');
    if (bgLayers.length) s.backgroundImage = bgLayers.join(', ');
    const invBgBlend = inheritVal('bgBlendMode'); if (invBgBlend && invBgBlend !== 'normal') s.backgroundBlendMode = invBgBlend;
    ['display','flexDirection','flexWrap','justifyContent','alignItems','alignSelf','gap',
     'width','height','minWidth','minHeight','maxWidth','maxHeight','boxSizing',
     'flexGrow','flexShrink','flexBasis','order',
     'objectFit','aspectRatio','cursor','pointerEvents','userSelect','resize',
     'textOverflow','whiteSpace','wordBreak','verticalAlign','willChange','isolation'].forEach(k => {
        const v = inheritVal(k); if (v) { const prop = k; s[prop] = v; }
    });
    const invOverflow = inheritVal('overflow'); if (invOverflow) s.overflow = invOverflow;
    const outline = inheritObj('outline', {});
    if (outline.style && outline.style !== 'none') {
        let ol = ''; if (outline.width) ol += outline.width + ' '; ol += outline.style; if (outline.color) ol += ' ' + outline.color;
        if (ol) s.outline = ol;
    }
    const textShadowArr = inheritArr('textShadow');
    if (textShadowArr.length > 0) s.textShadow = textShadowArr.map(sh => `${sh.x||'0'} ${sh.y||'0'} ${sh.blur||'0'} ${sh.color||'rgba(0,0,0,0.2)'}`).join(', ');
    const transArr = inheritArr('transitions');
    if (transArr.length > 0) s.transition = transArr.map(t => `${t.property||'all'} ${t.duration||'0.3s'} ${t.timing||'ease'} ${t.delay||'0s'}`).join(', ');
    const animArr = inheritArr('animations');
    if (animArr.length > 0) s.animation = animArr.map(a => `${a.name||'fadeIn'} ${a.duration||'0.5s'} ${a.timing||'ease'} ${a.delay||'0s'} ${a.iterationCount||'1'} ${a.direction||'normal'} ${a.fillMode||'forwards'}`).join(', ');
    const pad = inheritSides('padding');
    if (pad.top) s.paddingTop = pad.top; if (pad.right) s.paddingRight = pad.right; if (pad.bottom) s.paddingBottom = pad.bottom; if (pad.left) s.paddingLeft = pad.left;
    const mar = inheritSides('margin');
    if (mar.top) s.marginTop = mar.top; if (mar.right) s.marginRight = mar.right; if (mar.bottom) s.marginBottom = mar.bottom; if (mar.left) s.marginLeft = mar.left;
    const border = (Array.isArray(attributes.border) ? {} : (attributes.border || {}));
    const bw = getBorderWidth(); const hasBW = bw.top || bw.right || bw.bottom || bw.left;
    const bStyle = border.style || (hasBW ? 'solid' : '');
    if (bStyle && bStyle !== 'none') {
        s.borderStyle = bStyle;
        if (bw.top) s.borderTopWidth = bw.top; if (bw.right) s.borderRightWidth = bw.right; if (bw.bottom) s.borderBottomWidth = bw.bottom; if (bw.left) s.borderLeftWidth = bw.left;
        if (border.color) s.borderColor = border.color;
    }
    const br = getBorderRadius();
    if (br.topLeft) s.borderTopLeftRadius = br.topLeft; if (br.topRight) s.borderTopRightRadius = br.topRight; if (br.bottomRight) s.borderBottomRightRadius = br.bottomRight; if (br.bottomLeft) s.borderBottomLeftRadius = br.bottomLeft;
    const shadowArr = inheritArr('boxShadow');
    if (shadowArr.length > 0) s.boxShadow = shadowArr.map(sh => { const inset = (sh.type || 'drop') === 'inner' ? 'inset ' : ''; return `${inset}${sh.x||'0'} ${sh.y||'0'} ${sh.blur||'0'} ${sh.spread||'0'} ${sh.color||'rgba(0,0,0,0.2)'}`; }).join(', ');
    const filters = inheritObj('filter', {});
    const filterMap = {blur:'blur(%spx)',brightness:'brightness(%s%%)',contrast:'contrast(%s%%)',grayscale:'grayscale(%s%%)',hueRotate:'hue-rotate(%sdeg)',invert:'invert(%s%%)',saturate:'saturate(%s%%)',sepia:'sepia(%s%%)'};
    const filterParts = [];
    for (const [k, fmt] of Object.entries(filterMap)) { const v = filters[k]; if (v !== '' && v !== null && v !== undefined) filterParts.push(fmt.replace('%s', v)); }
    if (filterParts.length > 0) s.filter = filterParts.join(' ');
    const t = inheritObj('transform', {});
    const tParts = []; const tx = t.translateX || '', ty = t.translateY || ''; if (tx !== '' || ty !== '') tParts.push(`translate(${tx||'0'}, ${ty||'0'})`);
    const sx = t.scaleX || '', sy = t.scaleY || ''; if (sx !== '' || sy !== '') tParts.push(`scale(${sx||'1'}, ${sy||'1'})`);
    if (t.rotate) tParts.push(`rotate(${t.rotate})`);
    const kx = t.skewX || '', ky = t.skewY || ''; if (kx !== '' || ky !== '') tParts.push(`skew(${kx||'0'}, ${ky||'0'})`);
    if (tParts.length > 0) s.transform = tParts.join(' ');
    const invOpacity = inheritVal('opacity'); if (invOpacity) s.opacity = invOpacity;
    const invBlend = inheritVal('blendMode'); if (invBlend && invBlend !== 'normal') s.mixBlendMode = invBlend;
    const invPos = inheritVal('position'); if (invPos && invPos !== 'static') s.position = invPos;
    const offsets = inheritSides('offsets'); if (offsets.top) s.top = offsets.top; if (offsets.right) s.right = offsets.right; if (offsets.bottom) s.bottom = offsets.bottom; if (offsets.left) s.left = offsets.left;
    const invZ = inheritVal('zIndex'); if (invZ) s.zIndex = invZ;
    const bfObj = inheritObj('backdropFilter', {});
    if (Object.keys(bfObj).length > 0) {
        const bfMap = {blur:'blur(%spx)',brightness:'brightness(%s%%)',contrast:'contrast(%s%%)',grayscale:'grayscale(%s%%)',hueRotate:'hue-rotate(%sdeg)',invert:'invert(%s%%)',saturate:'saturate(%s%%)',sepia:'sepia(%s%%)'};
        const bfParts = []; for (const [k, fmt] of Object.entries(bfMap)) { const v = bfObj[k]; if (v !== '' && v !== null && v !== undefined) bfParts.push(fmt.replace('%s', v)); }
        if (bfParts.length > 0) s.backdropFilter = bfParts.join(' ');
    }
    return s;
}

/* ═══════════════════════════════════════════════
   TEXT BLOCK (full control suite)
   ═══════════════════════════════════════════════ */

registerBlockType('snn/text', {
    edit: function (props) {
        const { attributes, setAttributes } = props;
        const { tagName } = attributes;
        const {
            activeDevice, getVal, setVal, inheritVal,
            getSides, setSides, inheritSides,
            getBorderWidth, setBorderWidth,
            getBorderRadius, setBorderRadius,
            getObj, setObj, inheritObj,
            getArr, setArr, inheritArr,
        } = useResponsiveAttributes(attributes, setAttributes);
        const d = activeDevice;

        const previewStyles = computeBoxPreview(
            attributes, inheritVal, inheritObj, inheritArr, inheritSides,
            getBorderWidth, getBorderRadius, d
        );

        const overlay = inheritObj('bgOverlay', {});
        if (overlay.color || overlay.gradient) {
            if (overlay.color) previewStyles['--snn-overlay'] = overlay.color;
            previewStyles.position = previewStyles.position || 'relative';
        }

        const tagOptions = [
            { label: 'P', value: 'p' }, { label: 'H1', value: 'h1' }, { label: 'H2', value: 'h2' },
            { label: 'H3', value: 'h3' }, { label: 'H4', value: 'h4' }, { label: 'H5', value: 'h5' },
            { label: 'H6', value: 'h6' }, { label: 'DIV', value: 'div' }, { label: 'SPAN', value: 'span' },
        ];

        // ── Editor-unique class for custom CSS live preview ──
        const editorClass = 'snn-te-' + props.clientId.substring(0, 8);
        const editorSelector = '.' + editorClass;

        useEffect(() => {
            const styleId = 'snn-css-' + props.clientId;
            const raw = attributes.customCSS || '';
            // Gutenberg renders blocks inside an iframe — target it directly
            const iframe = document.querySelector('iframe[name="editor-canvas"]');
            const doc = iframe && iframe.contentDocument ? iframe.contentDocument : document;
            let styleEl = doc.getElementById(styleId);
            if (!styleEl) {
                styleEl = doc.createElement('style');
                styleEl.id = styleId;
                doc.head.appendChild(styleEl);
            }
            if (raw.trim()) {
                styleEl.textContent = raw.includes('selector')
                    ? raw.replace(/selector/g, editorSelector)
                    : editorSelector + ' {\n' + raw + '\n}';
            } else {
                styleEl.textContent = '';
            }
            return () => {
                const el = doc.getElementById(styleId);
                if (el) el.remove();
            };
        }, [attributes.customCSS, editorSelector, props.clientId]);

        const blockProps = useBlockProps({ className: 'snn-text ' + editorClass, style: previewStyles });
        const tinyInp = { width:'100%',padding:'4px 6px',fontSize:'14px',fontFamily:'monospace',border:'1px solid #ddd',borderRadius:'3px',boxSizing:'border-box',lineHeight:'20px' };
        const sel = { fontSize:'14px',padding:'3px 6px',border:'1px solid #949494',borderRadius:'3px',height:'26px',flex:1,background:'#fff',minWidth:0 };

        return (
            <Fragment>
                <InspectorControls>
                    <div style={{ padding: '0 10px' }}>
                    <DeviceSwitcher />

                    {/* ── TAG ── */}
                    <ToggleField label={__('HTML Tag','snn')} value={tagName || 'p'} options={tagOptions}
                        onChange={v => setAttributes({ tagName: v })} />

                    {/* ── TYPOGRAPHY ── */}
                    <CompactSection title={__('Color & Type','snn')} />
                    <ColorRow label={__('Text','snn')} value={getVal('textColor')} onChange={v => setVal('textColor',v)} />
                    <ColorRow label={__('BG','snn')} value={getVal('bgColor')} onChange={v => setVal('bgColor',v)} />
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
                    <CompactSelect label={__('Align','snn')} value={getVal('textAlign')}
                        options={[{value:'',label:'—'},{value:'left',label:'Left'},{value:'center',label:'Center'},{value:'right',label:'Right'},{value:'justify',label:'Justify'}]}
                        onChange={v => setVal('textAlign',v)} />

                    {/* ── BACKGROUND ── */}
                    <CompactSection title={__('Background','snn')} />
                    <BackgroundControl attributes={attributes} setAttributes={setAttributes} device={d} />

                    {/* ── SPACING ── */}
                    <CompactSection title={__('Spacing','snn')} />
                    <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:'6px',marginBottom:'6px' }}>
                        <div><SpacingInput values={getSides('padding')} onChange={v => setSides('padding',v)} device={d} /></div>
                        <div><SpacingInput values={getSides('margin')} onChange={v => setSides('margin',v)} device={d} /></div>
                    </div>

                    <CompactSection title={__('Sizing','snn')} />
                    <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:'4px',marginBottom:'6px' }}>
                        {[{k:'width',l:'W'},{k:'height',l:'H'},{k:'maxWidth',l:'MaxW'}].map(f => (
                            <div key={f.k} style={{display:'flex',alignItems:'center',gap:'3px'}}>
                                <span style={{fontSize:'14px',fontWeight:500,color:'#1e1e1e',minWidth:'28px'}}>{f.l}</span>
                                <input type="text" value={getVal(f.k)} onChange={e => setVal(f.k,e.target.value)}
                                    placeholder="—" style={{...tinyInp,flex:1,textAlign:'center',padding:'4px 4px',fontSize:'14px'}} />
                            </div>
                        ))}
                    </div>
                    <OverflowSelect value={getVal('overflow')} onChange={v => setVal('overflow',v)} device={d} />

                    {/* ── BORDER ── */}
                    <CompactSection title={__('Border & Radius','snn')} />
                    <BorderControl width={getBorderWidth()} style={attributes.border?.style||''} color={attributes.border?.color||''}
                        onWidthChange={v => setBorderWidth(v)} onStyleChange={v => setAttributes({border:{...(attributes.border||{}),style:v}})}
                        onColorChange={v => setAttributes({border:{...(attributes.border||{}),color:v}})} device={d} />
                    <BorderRadiusControl values={getBorderRadius()} onChange={v => setBorderRadius(v)} device={d} />

                    {/* ── EFFECTS ── */}
                    <PanelBody title={__('Effects','snn')} initialOpen={false}>
                        <OpacitySlider value={getVal('opacity')} onChange={v => setVal('opacity',v)} device={d} />
                        <BlendModeSelect value={getVal('blendMode')} onChange={v => setVal('blendMode',v)} />
                        <ShadowBuilder shadows={getArr('boxShadow')} onChange={v => setArr('boxShadow',v)} device={d} />
                        <FilterControls filters={getObj('filter',{})} onChange={v => setObj('filter',v)} device={d} />
                        <TransformControls transform={getObj('transform',{})} onChange={v => setObj('transform',v)} device={d} />
                    </PanelBody>

                    {/* ── POSITION ── */}
                    <PanelBody title={__('Position','snn')} initialOpen={false}>
                        <PositionSelect value={getVal('position')} onChange={v => setVal('position',v)} />
                        <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:'4px',marginBottom:'6px' }}>
                            {['top','right','bottom','left'].map(side => (
                                <div key={side}>
                                    <span style={{ fontSize:'14px',color:'#1e1e1e',display:'block',fontWeight:500,textTransform:'capitalize' }}>{side}</span>
                                    <input type="text" value={(getSides('offsets')||{})[side]||''}
                                        onChange={e => { const v = getSides('offsets'); v[side] = e.target.value; setSides('offsets',v); }}
                                        placeholder="auto" style={{...tinyInp,textAlign:'center'}} />
                                </div>
                            ))}
                        </div>
                        <div style={{display:'flex',alignItems:'center',gap:'6px',marginBottom:'6px'}}>
                            <span style={{fontSize:'14px',fontWeight:500,color:'#1e1e1e',minWidth:'48px'}}>{__('Z-Index','snn')}</span>
                            <input type="text" value={getVal('zIndex')} onChange={e => setVal('zIndex',e.target.value)} placeholder="auto" style={{...tinyInp,flex:1,textAlign:'center'}} />
                        </div>
                    </PanelBody>

                    {/* ── ADVANCED ── */}
                    <PanelBody title={__('Advanced','snn')} initialOpen={false}>
                        <VisibilityControls visibility={inheritObj('visibility',{desktop:true,tablet:true,mobile:true})} onChange={v => setObj('visibility',v)} />
                        <BackdropFilterControl filters={getObj('backdropFilter',{})} onChange={v => setObj('backdropFilter',v)} device={d} />
                        {(() => { const o = getObj('outline',{}); return <OutlineControl width={o.width||''} style={o.style||''} color={o.color||''}
                            onWidthChange={v => setObj('outline',{...o,width:v})} onStyleChange={v => setObj('outline',{...o,style:v})} onColorChange={v => setObj('outline',{...o,color:v})} device={d} />; })()}
                        <TextShadowControl shadows={getArr('textShadow')} onChange={v => setArr('textShadow',v)} device={d} />
                        <TransitionBuilder transitions={getArr('transitions')} onChange={v => setArr('transitions',v)} device={d} />
                        <AnimationBuilder animations={getArr('animations')} onChange={v => setArr('animations',v)} device={d} />
                    </PanelBody>

                    {/* ── CUSTOM CSS ── */}
                    <PanelBody title={__('Custom CSS','snn')} initialOpen={false}>
                        <TextareaControl
                            label={__('Custom CSS','snn')}
                            help={__('Use "selector" to target this block, e.g. selector { color: red; } or selector:hover { ... }','snn')}
                            value={attributes.customCSS || ''}
                            onChange={v => setAttributes({ customCSS: v })}
                            rows={8} />
                    </PanelBody>
                    </div>
                </InspectorControls>

                <RichText
                    {...blockProps}
                    tagName={tagName || 'p'}
                    value={attributes.content}
                    onChange={content => setAttributes({ content })}
                    placeholder={__('Enter text...','snn')}
                    allowedFormats={['core/bold', 'core/italic', 'core/link', 'core/strikethrough']}
                />
            </Fragment>
        );
    },
    save: function () { return null; },
});
