// Flip Card Block Editor (JSX, Babel Standalone)
const { useBlockProps, InspectorControls } = wp.blockEditor;
const { PanelBody, TextControl, SelectControl } = wp.components;

wp.blocks.registerBlockType('snn/flip-card', {
    title: 'Flip Card',
    icon: 'image-flip-horizontal',
    category: 'widgets',
    attributes: {
        frontText: { type: 'string', default: 'Front Side' },
        backText: { type: 'string', default: 'Back Side' },
        flipDirection: { type: 'string', default: 'horizontal' },
    },
    edit: (props) => {
        const { attributes, setAttributes } = props;
        return (
            <div {...useBlockProps()}>
                <InspectorControls>
                    <PanelBody title="Flip Card Settings">
                        <TextControl
                            label="Front Text"
                            value={attributes.frontText}
                            onChange={(val) => setAttributes({ frontText: val })}
                        />
                        <TextControl
                            label="Back Text"
                            value={attributes.backText}
                            onChange={(val) => setAttributes({ backText: val })}
                        />
                        <SelectControl
                            label="Flip Direction"
                            value={attributes.flipDirection}
                            options={[
                                { label: 'Horizontal', value: 'horizontal' },
                                { label: 'Vertical', value: 'vertical' },
                            ]}
                            onChange={(val) => setAttributes({ flipDirection: val })}
                        />
                    </PanelBody>
                </InspectorControls>
                <div className={`snn-flip-card snn-flip-${attributes.flipDirection}`}
                     style={{ width: '300px', height: '200px', margin: 'auto' }}>
                    <div className="snn-flip-card-inner">
                        <div className="snn-flip-card-front">{attributes.frontText}</div>
                        <div className="snn-flip-card-back">{attributes.backText}</div>
                    </div>
                </div>
            </div>
        );
    },
    save: () => null // Rendered by PHP
});
