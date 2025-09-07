const { useBlockProps, InspectorControls, RichText } = wp.blockEditor;
const { PanelBody, SelectControl } = wp.components;

wp.blocks.registerBlockType('snn/flip-card', {
    title: 'Flip Card',
    icon: 'image-flip-horizontal',
    category: 'widgets',
    attributes: {
        frontText: { type: 'string', default: 'Front Side' },
        backText: { type: 'string', default: 'Back Side' },
        flipDirection: { type: 'string', default: 'horizontal' },
        lockHover: { type: 'boolean', default: false },
    },
    edit: (props) => {
        const { attributes, setAttributes } = props;
        return (
            <div {...useBlockProps()}>
                <InspectorControls>
                    <PanelBody title="Flip Card Settings">
                        <wp.components.ToggleControl
                            label="Flip Direction: Vertical"
                            checked={attributes.flipDirection === 'vertical'}
                            onChange={(val) => setAttributes({ flipDirection: val ? 'vertical' : 'horizontal' })}
                            help="Switch between horizontal and vertical flip."
                        />
                        <wp.components.ToggleControl
                            label="Lock Hover (for editing)"
                            checked={!!attributes.lockHover}
                            onChange={(val) => setAttributes({ lockHover: val })}
                            help="Prevent card from flipping on hover so you can edit text."
                        />
                    </PanelBody>
                </InspectorControls>
                <div
                    className={`snn-flip-card snn-flip-${attributes.flipDirection}${attributes.lockHover ? ' snn-flip-locked' : ''}`}
                    style={{ width: '300px', height: '200px', margin: 'auto' }}
                >
                    <div className="snn-flip-card-inner">
                        <div className="snn-flip-card-front">
                            <RichText
                                tagName="span"
                                value={attributes.frontText}
                                allowedFormats={['core/bold', 'core/italic']}
                                placeholder="Front Side..."
                                onChange={(val) => setAttributes({ frontText: val })}
                            />
                        </div>
                        <div className="snn-flip-card-back">
                            <RichText
                                tagName="span"
                                value={attributes.backText}
                                allowedFormats={['core/bold', 'core/italic']}
                                placeholder="Back Side..."
                                onChange={(val) => setAttributes({ backText: val })}
                            />
                        </div>
                    </div>
                </div>
            </div>
        );
    },
    save: () => null
});
