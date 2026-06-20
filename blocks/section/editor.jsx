const { registerBlockType } = wp.blocks;
const { InspectorControls, useBlockProps, useInnerBlocksProps, InnerBlocks, MediaUpload } = wp.blockEditor;
const { PanelBody, Button, SelectControl, TextControl, TextareaControl, ColorPalette } = wp.components;
const { Fragment } = wp.element;
const { useSelect } = wp.data;
const { __ } = wp.i18n;

// Shared reusable controls (loaded by functions.php via Controls.jsx)
const { DeviceBadge, RespLabel, ToggleField, IconToggleField, PaddingInput, RangeUnitField, useResponsiveAttributes } = window.SNNControls;

/* ═══════════════════════════════════════════════
   SECTION BLOCK
   ═══════════════════════════════════════════════ */

registerBlockType('snn/section', {
    edit: function (props) {
        const { attributes, setAttributes } = props;

        // ── Responsive attributes ──
        const { activeDevice, getVal, setVal, inheritVal, getPad, setPad, inheritPad } =
            useResponsiveAttributes(attributes, setAttributes);

        // ── Preview styles with full inheritance cascade ──
        const previewStyles = {};

        const invBg = inheritVal('bgColor');
        if (invBg) previewStyles.backgroundColor = invBg;
        const invText = inheritVal('textColor');
        if (invText) previewStyles.color = invText;

        const bgImg = attributes.bgImage?.url;
        if (bgImg) {
            previewStyles.backgroundImage = `url(${bgImg})`;
            previewStyles.backgroundSize = attributes.bgSize || 'cover';
            previewStyles.backgroundPosition = attributes.bgPosition || 'center center';
            previewStyles.backgroundRepeat = attributes.bgRepeat || 'no-repeat';
        }

        const disp = inheritVal('display');
        if (disp) previewStyles.display = disp;
        const fd = inheritVal('flexDirection');
        if (fd) previewStyles.flexDirection = fd;
        const fw = inheritVal('flexWrap');
        if (fw) previewStyles.flexWrap = fw;
        const jc = inheritVal('justifyContent');
        if (jc) previewStyles.justifyContent = jc;
        const ai = inheritVal('alignItems');
        if (ai) previewStyles.alignItems = ai;
        const gap = inheritVal('gap');
        if (gap) previewStyles.gap = gap;
        const gc = inheritVal('gridColumns');
        if (gc) previewStyles.gridTemplateColumns = gc;
        const ji = inheritVal('justifyItems');
        if (ji) previewStyles.justifyItems = ji;
        const ac = inheritVal('alignContent');
        if (ac) previewStyles.alignContent = ac;
        const ta = inheritVal('textAlign');
        if (ta) previewStyles.textAlign = ta;
        const mh = inheritVal('minHeight');
        if (mh) previewStyles.minHeight = mh;
        if (attributes.overflow) previewStyles.overflow = attributes.overflow;

        const inPad = inheritPad();
        if (inPad.top) previewStyles.paddingTop = inPad.top;
        if (inPad.right) previewStyles.paddingRight = inPad.right;
        if (inPad.bottom) previewStyles.paddingBottom = inPad.bottom;
        if (inPad.left) previewStyles.paddingLeft = inPad.left;

        // ── Contextual layout (inherits so flex/grid controls show on all devices) ──
        const displayVal = inheritVal('display');
        const isFlex = displayVal === 'flex';
        const isGrid = displayVal === 'grid';

        // ── Options ──
        const displayOptions = [
            { label: __('Block', 'snn'), value: 'block' },
            { label: __('Flex', 'snn'), value: 'flex' },
            { label: __('Grid', 'snn'), value: 'grid' },
            { label: __('Inline Block', 'snn'), value: 'inline-block' },
            { label: __('None', 'snn'), value: 'none' },
        ];
        const flexDirOptions = [
            { label: __('Row', 'snn'), value: 'row', icon: 'fa-solid fa-arrow-right' },
            { label: __('Column', 'snn'), value: 'column', icon: 'fa-solid fa-arrow-down' },
            { label: __('Row Rev', 'snn'), value: 'row-reverse', icon: 'fa-solid fa-arrow-left' },
            { label: __('Col Rev', 'snn'), value: 'column-reverse', icon: 'fa-solid fa-arrow-up' },
        ];
        const wrapOptions = [
            { label: __('Wrap', 'snn'), value: 'wrap', icon: 'fa-solid fa-angles-down' },
            { label: __('Nowrap', 'snn'), value: 'nowrap', icon: 'fa-solid fa-ellipsis' },
            { label: __('Wrap Rev', 'snn'), value: 'wrap-reverse', icon: 'fa-solid fa-angles-up' },
        ];
        const justifyOptions = [
            { label: __('Default', 'snn'), value: '', icon: 'fa-solid fa-circle' },
            { label: __('Start', 'snn'), value: 'flex-start', icon: 'fa-solid fa-align-left' },
            { label: __('Center', 'snn'), value: 'center', icon: 'fa-solid fa-align-center' },
            { label: __('End', 'snn'), value: 'flex-end', icon: 'fa-solid fa-align-right' },
            { label: __('Stretch', 'snn'), value: 'stretch', icon: 'fa-solid fa-arrows-left-right' },
            { label: __('Between', 'snn'), value: 'space-between', icon: 'fa-solid fa-object-ungroup' },
            { label: __('Around', 'snn'), value: 'space-around', icon: 'fa-solid fa-object-group' },
        ];
        const alignOptions = [
            { label: __('Default', 'snn'), value: '', icon: 'fa-solid fa-circle' },
            { label: __('Start', 'snn'), value: 'flex-start', icon: 'fa-solid fa-chevron-up' },
            { label: __('Center', 'snn'), value: 'center', icon: 'fa-solid fa-arrows-up-down' },
            { label: __('End', 'snn'), value: 'flex-end', icon: 'fa-solid fa-chevron-down' },
            { label: __('Stretch', 'snn'), value: 'stretch', icon: 'fa-solid fa-expand' },
            { label: __('Between', 'snn'), value: 'space-between', icon: 'fa-solid fa-object-ungroup' },
            { label: __('Around', 'snn'), value: 'space-around', icon: 'fa-solid fa-object-group' },
        ];
        const gridJustifyItemsOptions = [
            { label: __('Default', 'snn'), value: '', icon: 'fa-solid fa-circle' },
            { label: __('Start', 'snn'), value: 'start', icon: 'fa-solid fa-align-left' },
            { label: __('Center', 'snn'), value: 'center', icon: 'fa-solid fa-align-center' },
            { label: __('End', 'snn'), value: 'end', icon: 'fa-solid fa-align-right' },
            { label: __('Stretch', 'snn'), value: 'stretch', icon: 'fa-solid fa-arrows-left-right' },
        ];
        const gridAlignItemsOptions = [
            { label: __('Default', 'snn'), value: '', icon: 'fa-solid fa-circle' },
            { label: __('Start', 'snn'), value: 'start', icon: 'fa-solid fa-chevron-up' },
            { label: __('Center', 'snn'), value: 'center', icon: 'fa-solid fa-arrows-up-down' },
            { label: __('End', 'snn'), value: 'end', icon: 'fa-solid fa-chevron-down' },
            { label: __('Stretch', 'snn'), value: 'stretch', icon: 'fa-solid fa-expand' },
        ];
        const gridJustifyContentOptions = [
            { label: __('Default', 'snn'), value: '', icon: 'fa-solid fa-circle' },
            { label: __('Start', 'snn'), value: 'start', icon: 'fa-solid fa-align-left' },
            { label: __('Center', 'snn'), value: 'center', icon: 'fa-solid fa-align-center' },
            { label: __('End', 'snn'), value: 'end', icon: 'fa-solid fa-align-right' },
            { label: __('Stretch', 'snn'), value: 'stretch', icon: 'fa-solid fa-arrows-left-right' },
            { label: __('Between', 'snn'), value: 'space-between', icon: 'fa-solid fa-object-ungroup' },
            { label: __('Around', 'snn'), value: 'space-around', icon: 'fa-solid fa-object-group' },
            { label: __('Evenly', 'snn'), value: 'space-evenly', icon: 'fa-solid fa-object-group' },
        ];
        const gridAlignContentOptions = [
            { label: __('Default', 'snn'), value: '', icon: 'fa-solid fa-circle' },
            { label: __('Start', 'snn'), value: 'start', icon: 'fa-solid fa-chevron-up' },
            { label: __('Center', 'snn'), value: 'center', icon: 'fa-solid fa-arrows-up-down' },
            { label: __('End', 'snn'), value: 'end', icon: 'fa-solid fa-chevron-down' },
            { label: __('Stretch', 'snn'), value: 'stretch', icon: 'fa-solid fa-expand' },
            { label: __('Between', 'snn'), value: 'space-between', icon: 'fa-solid fa-object-ungroup' },
            { label: __('Around', 'snn'), value: 'space-around', icon: 'fa-solid fa-object-group' },
            { label: __('Evenly', 'snn'), value: 'space-evenly', icon: 'fa-solid fa-object-group' },
        ];
        const textAlignOptions = [
            { label: __('Default', 'snn'), value: '' },
            { label: __('Left', 'snn'), value: 'left' },
            { label: __('Center', 'snn'), value: 'center' },
            { label: __('Right', 'snn'), value: 'right' },
        ];
        const overflowOptions = [
            { label: __('Default', 'snn'), value: '' },
            { label: __('Hidden', 'snn'), value: 'hidden' },
            { label: __('Visible', 'snn'), value: 'visible' },
            { label: __('Auto', 'snn'), value: 'auto' },
            { label: __('Scroll', 'snn'), value: 'scroll' },
        ];

        // ── Theme colors ──
        const themeColors = useSelect(select => {
            const settings = select('core/editor')?.getEditorSettings();
            const palette = settings?.__experimentalFeatures?.color?.palette?.theme ||
                settings?.__experimentalFeatures?.color?.palette?.default ||
                settings?.colors || [];
            return palette.map(c => ({ name: c.name, color: c.color }));
        }, []);

        // ── Block props ──
        const blockProps = useBlockProps({
            className: 'snn-section',
            style: previewStyles,
        });

        const innerBlocksProps = useInnerBlocksProps(blockProps, {
            template: [['snn/container']],
        });

        // ── BG image handler ──
        const onBgImageSelect = (media) => {
            setAttributes({ bgImage: { id: media.id, url: media.url, alt: media.alt || '' } });
        };

        return (
            <Fragment>
                <InspectorControls>
                    {/* ═══════ STYLE ═══════ */}
                    <PanelBody title={__('Style', 'snn')} initialOpen={true}>
                        <div style={{ fontSize: '11px', color: '#1e1e1e', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <span>{__('Editing:', 'snn')}</span>
                            <DeviceBadge device={activeDevice} />
                        </div>

                        {/* Display / Layout */}
                        <ToggleField label={__('Display', 'snn')} value={displayVal} options={displayOptions} onChange={v => setVal('display', v)} />

                        {isFlex && (
                            <Fragment>
                                <IconToggleField label={__('Direction', 'snn')} value={getVal('flexDirection')} options={flexDirOptions} onChange={v => setVal('flexDirection', v)} />
                                <IconToggleField label={__('Wrap', 'snn')} value={getVal('flexWrap')} options={wrapOptions} onChange={v => setVal('flexWrap', v)} />
                                <IconToggleField label={__('Justify', 'snn')} value={getVal('justifyContent')} options={justifyOptions} onChange={v => setVal('justifyContent', v)} />
                                <IconToggleField label={__('Align', 'snn')} value={getVal('alignItems')} options={alignOptions} onChange={v => setVal('alignItems', v)} />
                                <RangeUnitField label={__('Gap', 'snn')} value={getVal('gap')} onChange={v => setVal('gap', v)} min={0} max={200} step={1} />
                            </Fragment>
                        )}

                        {isGrid && (
                            <Fragment>
                                <RespLabel label={__('Grid Columns', 'snn')} device={activeDevice} />
                                <TextControl value={getVal('gridColumns')} onChange={v => setVal('gridColumns', v)} placeholder={__('e.g. 1fr 1fr 1fr', 'snn')} />
                                <IconToggleField label={__('Justify Items', 'snn')} value={getVal('justifyItems')} options={gridJustifyItemsOptions} onChange={v => setVal('justifyItems', v)} />
                                <IconToggleField label={__('Align Items', 'snn')} value={getVal('alignItems')} options={gridAlignItemsOptions} onChange={v => setVal('alignItems', v)} />
                                <IconToggleField label={__('Justify Content', 'snn')} value={getVal('justifyContent')} options={gridJustifyContentOptions} onChange={v => setVal('justifyContent', v)} />
                                <IconToggleField label={__('Align Content', 'snn')} value={getVal('alignContent')} options={gridAlignContentOptions} onChange={v => setVal('alignContent', v)} />
                                <RangeUnitField label={__('Gap', 'snn')} value={getVal('gap')} onChange={v => setVal('gap', v)} min={0} max={200} step={1} />
                            </Fragment>
                        )}

                        <hr style={{ margin: '16px 0', border: 'none', borderTop: '1px solid #e0e0e0' }} />

                        {/* Padding / Spacing */}
                        <PaddingInput values={getPad()} onChange={setPad} device={activeDevice} />

                        <hr style={{ margin: '16px 0', border: 'none', borderTop: '1px solid #e0e0e0' }} />

                        {/* Sizing */}
                        <RangeUnitField label={__('Min Height', 'snn')} value={getVal('minHeight')} onChange={v => setVal('minHeight', v)} min={0} max={1000} step={10} />
                        <SelectControl label={__('Overflow', 'snn')} value={attributes.overflow || ''} options={overflowOptions} onChange={v => setAttributes({ overflow: v })} />

                        <hr style={{ margin: '16px 0', border: 'none', borderTop: '1px solid #e0e0e0' }} />

                        {/* Text */}
                        <RespLabel label={__('Text Color', 'snn')} device={activeDevice} />
                        <ColorPalette colors={themeColors} value={getVal('textColor')} onChange={v => setVal('textColor', v || '')} clearable />
                        <div style={{ marginTop: '8px' }}>
                            <ToggleField label={__('Text Align', 'snn')} value={getVal('textAlign')} options={textAlignOptions} onChange={v => setVal('textAlign', v)} />
                        </div>

                        <hr style={{ margin: '16px 0', border: 'none', borderTop: '1px solid #e0e0e0' }} />

                        {/* Background Color */}
                        <RespLabel label={__('Background Color', 'snn')} device={activeDevice} />
                        <ColorPalette
                            colors={themeColors}
                            value={getVal('bgColor')}
                            onChange={v => setVal('bgColor', v || '')}
                            clearable
                        />

                        <hr style={{ margin: '16px 0', border: 'none', borderTop: '1px solid #e0e0e0' }} />

                        <MediaUpload
                            onSelect={onBgImageSelect}
                            allowedTypes={['image']}
                            value={attributes.bgImage?.id}
                            render={({ open }) => (
                                <div style={{ marginTop: '12px' }}>
                                    <Button variant="secondary" onClick={open} style={{ width: '100%', justifyContent: 'center', marginBottom: '8px' }}>
                                        {attributes.bgImage?.url ? __('Change Image', 'snn') : __('Background Image', 'snn')}
                                    </Button>
                                    {attributes.bgImage?.url && (
                                        <div style={{ marginBottom: '8px' }}>
                                            <img src={attributes.bgImage.url} alt="" style={{ maxWidth: '100%', maxHeight: '80px', objectFit: 'cover', borderRadius: '2px' }} />
                                            <Button
                                                onClick={() => setAttributes({ bgImage: { id: 0, url: '', alt: '' } })}
                                                style={{ display: 'block', marginTop: '4px', color: '#cc1818', fontSize: '11px', padding: '0' }}
                                                variant="link"
                                            >{__('Remove', 'snn')}</Button>
                                        </div>
                                    )}
                                </div>
                            )}
                        />

                        {attributes.bgImage?.url && (
                            <Fragment>
                                <SelectControl label={__('Size', 'snn')} value={attributes.bgSize} options={[
                                    { label: 'Cover', value: 'cover' }, { label: 'Contain', value: 'contain' }, { label: 'Auto', value: 'auto' },
                                ]} onChange={v => setAttributes({ bgSize: v })} />
                                <SelectControl label={__('Position', 'snn')} value={attributes.bgPosition} options={[
                                    { label: 'Center', value: 'center center' }, { label: 'Top', value: 'top center' },
                                    { label: 'Bottom', value: 'bottom center' }, { label: 'Left', value: 'left center' },
                                    { label: 'Right', value: 'right center' },
                                ]} onChange={v => setAttributes({ bgPosition: v })} />
                                <SelectControl label={__('Repeat', 'snn')} value={attributes.bgRepeat} options={[
                                    { label: 'No Repeat', value: 'no-repeat' }, { label: 'Repeat', value: 'repeat' },
                                    { label: 'Repeat X', value: 'repeat-x' }, { label: 'Repeat Y', value: 'repeat-y' },
                                ]} onChange={v => setAttributes({ bgRepeat: v })} />
                            </Fragment>
                        )}
                    </PanelBody>

                    {/* ═══════ CUSTOM CSS ═══════ */}
                    <PanelBody title={__('Custom CSS', 'snn')} initialOpen={false}>
                        <TextareaControl
                            label={__('Custom CSS', 'snn')}
                            help={__('Write custom CSS rules. The selector .snn-section will target this block.', 'snn')}
                            value={attributes.customCSS || ''}
                            onChange={val => setAttributes({ customCSS: val })}
                            rows={8}
                        />
                    </PanelBody>
                </InspectorControls>

                <section {...innerBlocksProps} />
            </Fragment>
        );
    },

    save: function () {
        return <InnerBlocks.Content />;
    },
});
