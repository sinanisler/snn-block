const { registerBlockType } = wp.blocks;
const { InspectorControls, useBlockProps, RichText } = wp.blockEditor;
const { PanelBody, TextareaControl } = wp.components;
const { Fragment } = wp.element;
const { __ } = wp.i18n;

// Shared reusable controls (loaded by functions.php via Controls.jsx)
const { DeviceBadge, RespLabel, ToggleField, PaddingInput, ColorRow, FontSizeRow, AlignRow, TransformRow, CompactSelect, useResponsiveAttributes } = window.SNNControls;

/* ═══════════════════════════════════════════════
   TEXT BLOCK
   ═══════════════════════════════════════════════ */

registerBlockType('snn/text', {
    edit: function (props) {
        const { attributes, setAttributes } = props;

        // ── Responsive attributes ──
        const { activeDevice, getVal, setVal, inheritVal, getPad, setPad, inheritPad } =
            useResponsiveAttributes(attributes, setAttributes);

        // ── Preview styles with full inheritance ──
        const previewStyles = {};

        const invTxtCol = inheritVal('textColor');
        if (invTxtCol) previewStyles.color = invTxtCol;
        const invBgCol = inheritVal('bgColor');
        if (invBgCol) previewStyles.backgroundColor = invBgCol;
        const invFs = inheritVal('fontSize');
        if (invFs) previewStyles.fontSize = invFs;
        const invFw = inheritVal('fontWeight');
        if (invFw) previewStyles.fontWeight = invFw;
        const invTa = inheritVal('textAlign');
        if (invTa) previewStyles.textAlign = invTa;
        if (attributes.textTransform) previewStyles.textTransform = attributes.textTransform;

        const inPad = inheritPad();
        if (inPad.top) previewStyles.paddingTop = inPad.top;
        if (inPad.right) previewStyles.paddingRight = inPad.right;
        if (inPad.bottom) previewStyles.paddingBottom = inPad.bottom;
        if (inPad.left) previewStyles.paddingLeft = inPad.left;

        // ── Options ──
        const tagOptions = [
            { label: 'P', value: 'p' },
            { label: 'H1', value: 'h1' },
            { label: 'H2', value: 'h2' },
            { label: 'H3', value: 'h3' },
            { label: 'H4', value: 'h4' },
            { label: 'DIV', value: 'div' },
        ];
        const weightOptions = [
            { label: __('Default', 'snn'), value: '' },
            { label: __('Thin 100', 'snn'), value: '100' },
            { label: __('Light 300', 'snn'), value: '300' },
            { label: __('Normal 400', 'snn'), value: '400' },
            { label: __('Medium 500', 'snn'), value: '500' },
            { label: __('Semi Bold 600', 'snn'), value: '600' },
            { label: __('Bold 700', 'snn'), value: '700' },
            { label: __('Black 900', 'snn'), value: '900' },
        ];

        // ── Block props ──
        const blockProps = useBlockProps({
            className: 'snn-text',
            style: previewStyles,
        });

        return (
            <Fragment>
                <InspectorControls>
                    {/* ═══════ TEXT SETTINGS ═══════ */}
                    <PanelBody title={__('Text Settings', 'snn')} initialOpen={true}>
                        <ToggleField
                            label={__('HTML Tag', 'snn')}
                            value={attributes.tagName || 'p'}
                            options={tagOptions}
                            onChange={v => setAttributes({ tagName: v })}
                        />

                        <hr style={{ margin: '12px 0', border: 'none', borderTop: '1px solid #e0e0e0' }} />

                        {/* Colors */}
                        <div style={{ fontSize: '14px', fontWeight: 500, color: '#1e1e1e', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <span>{__('Editing:', 'snn')}</span>
                            <DeviceBadge device={activeDevice} />
                        </div>
                        <ColorRow
                            label=""
                            value={getVal('textColor')}
                            onChange={v => setVal('textColor', v || '')}
                        />

                        <hr style={{ margin: '12px 0', border: 'none', borderTop: '1px solid #e0e0e0' }} />

                        {/* Typography */}
                        <FontSizeRow
                            label={__('Font Size', 'snn')}
                            value={getVal('fontSize')}
                            onChange={v => setVal('fontSize', v)}
                        />
                        <AlignRow
                            label={__('Align', 'snn')}
                            value={getVal('textAlign')}
                            onChange={v => setVal('textAlign', v)}
                        />
                        <TransformRow
                            label={__('Transform', 'snn')}
                            value={attributes.textTransform || ''}
                            onChange={v => setAttributes({ textTransform: v })}
                        />
                        <CompactSelect
                            label={__('Weight', 'snn')}
                            value={getVal('fontWeight')}
                            options={weightOptions}
                            onChange={v => setVal('fontWeight', v)}
                        />

                        <hr style={{ margin: '12px 0', border: 'none', borderTop: '1px solid #e0e0e0' }} />

                        {/* Spacing */}
                        <PaddingInput values={getPad()} onChange={setPad} device={activeDevice} />
                    </PanelBody>

                    {/* ═══════ CUSTOM CSS ═══════ */}
                    <PanelBody title={__('Custom CSS', 'snn')} initialOpen={false}>
                        <TextareaControl
                            label={__('Custom CSS', 'snn')}
                            help={__('Write custom CSS rules. The selector .snn-text will target this block.', 'snn')}
                            value={attributes.customCSS || ''}
                            onChange={val => setAttributes({ customCSS: val })}
                            rows={8}
                        />
                    </PanelBody>
                </InspectorControls>

                <RichText
                    {...blockProps}
                    tagName={attributes.tagName || 'p'}
                    value={attributes.content}
                    onChange={content => setAttributes({ content })}
                    placeholder={__('Enter text...', 'snn')}
                    allowedFormats={['core/bold', 'core/italic', 'core/link', 'core/strikethrough']}
                />
            </Fragment>
        );
    },

    save: function () {
        return null;
    },
});
