
const { useBlockProps, useInnerBlocksProps, InnerBlocks } = wp.blockEditor;
const { InspectorControls } = wp.blockEditor;
const {
    PanelBody,
    SelectControl,
    RangeControl,
    ButtonGroup,
    Button
} = wp.components;

wp.blocks.registerBlockType('snn/section', {
    title: 'Section',
    icon: 'layout',
    category: 'layout',
    attributes: {
        layoutType: {
            type: 'string',
            default: 'flex',
        },
        flexDirection: {
            type: 'string',
            default: 'row',
        },
        flexWrap: {
            type: 'string',
            default: 'nowrap',
        },
        justifyContent: {
            type: 'string',
            default: 'flex-start',
        },
        alignItems: {
            type: 'string',
            default: 'stretch',
        },
        gap: {
            type: 'number',
            default: 0,
        },
        gridColumns: {
            type: 'number',
            default: 2,
        },
        gridRows: {
            type: 'number',
            default: 1,
        },
        gridGap: {
            type: 'number',
            default: 0,
        },
        gridAlign: {
            type: 'string',
            default: 'stretch',
        },
        gridJustify: {
            type: 'string',
            default: 'stretch',
        },
    },
    supports: {
        html: false,
        innerBlocks: true
    },
    edit: (props) => {
        const { attributes, setAttributes } = props;
        const {
            layoutType,
            flexDirection,
            flexWrap,
            justifyContent,
            alignItems,
            gap,
            gridColumns,
            gridRows,
            gridGap,
            gridAlign,
            gridJustify,
        } = attributes;

        // Dynamic style for preview
        const style = layoutType === 'flex'
            ? {
                display: 'flex',
                flexDirection,
                flexWrap,
                justifyContent,
                alignItems,
                gap: gap + 'px',
            }
            : {
                display: 'grid',
                gridTemplateColumns: `repeat(${gridColumns}, 1fr)`,
                gridTemplateRows: `repeat(${gridRows}, 1fr)`,
                gap: gridGap + 'px',
                alignItems: gridAlign,
                justifyItems: gridJustify,
            };

        return (
            <>
                <InspectorControls>
                    <PanelBody title="Layout Settings" initialOpen={true}>
                        <div>
                            <label style={{ fontWeight: 'bold', marginBottom: '8px', display: 'block' }}>Layout Type</label>
                            <ButtonGroup style={{ marginBottom: '16px' }}>
                                <Button
                                    variant={layoutType === 'flex' ? 'primary' : 'secondary'}
                                    onClick={() => setAttributes({ layoutType: 'flex' })}
                                >
                                    Flex
                                </Button>
                                <Button
                                    variant={layoutType === 'grid' ? 'primary' : 'secondary'}
                                    onClick={() => setAttributes({ layoutType: 'grid' })}
                                >
                                    Grid
                                </Button>
                            </ButtonGroup>
                        </div>
                        {layoutType === 'flex' && (
                            <>
                                <div>
                                    <label style={{ fontWeight: 'bold', marginBottom: '8px', display: 'block' }}>Direction</label>
                                    <ButtonGroup style={{ marginBottom: '16px' }}>
                                        <Button
                                            variant={flexDirection === 'row' ? 'primary' : 'secondary'}
                                            onClick={() => setAttributes({ flexDirection: 'row' })}
                                        >
                                            Row
                                        </Button>
                                        <Button
                                            variant={flexDirection === 'row-reverse' ? 'primary' : 'secondary'}
                                            onClick={() => setAttributes({ flexDirection: 'row-reverse' })}
                                        >
                                            Row Reverse
                                        </Button>
                                        <Button
                                            variant={flexDirection === 'column' ? 'primary' : 'secondary'}
                                            onClick={() => setAttributes({ flexDirection: 'column' })}
                                        >
                                            Column
                                        </Button>
                                        <Button
                                            variant={flexDirection === 'column-reverse' ? 'primary' : 'secondary'}
                                            onClick={() => setAttributes({ flexDirection: 'column-reverse' })}
                                        >
                                            Column Reverse
                                        </Button>
                                    </ButtonGroup>
                                </div>
                                <div>
                                    <label style={{ fontWeight: 'bold', marginBottom: '8px', display: 'block' }}>Wrap</label>
                                    <ButtonGroup style={{ marginBottom: '16px' }}>
                                        <Button
                                            variant={flexWrap === 'nowrap' ? 'primary' : 'secondary'}
                                            onClick={() => setAttributes({ flexWrap: 'nowrap' })}
                                        >
                                            No Wrap
                                        </Button>
                                        <Button
                                            variant={flexWrap === 'wrap' ? 'primary' : 'secondary'}
                                            onClick={() => setAttributes({ flexWrap: 'wrap' })}
                                        >
                                            Wrap
                                        </Button>
                                        <Button
                                            variant={flexWrap === 'wrap-reverse' ? 'primary' : 'secondary'}
                                            onClick={() => setAttributes({ flexWrap: 'wrap-reverse' })}
                                        >
                                            Wrap Reverse
                                        </Button>
                                    </ButtonGroup>
                                </div>
                                <div>
                                    <label style={{ fontWeight: 'bold', marginBottom: '8px', display: 'block' }}>Justify Content</label>
                                    <ButtonGroup style={{ marginBottom: '16px' }}>
                                        <Button
                                            variant={justifyContent === 'flex-start' ? 'primary' : 'secondary'}
                                            onClick={() => setAttributes({ justifyContent: 'flex-start' })}
                                        >
                                            Flex Start
                                        </Button>
                                        <Button
                                            variant={justifyContent === 'center' ? 'primary' : 'secondary'}
                                            onClick={() => setAttributes({ justifyContent: 'center' })}
                                        >
                                            Center
                                        </Button>
                                        <Button
                                            variant={justifyContent === 'flex-end' ? 'primary' : 'secondary'}
                                            onClick={() => setAttributes({ justifyContent: 'flex-end' })}
                                        >
                                            Flex End
                                        </Button>
                                        <Button
                                            variant={justifyContent === 'space-between' ? 'primary' : 'secondary'}
                                            onClick={() => setAttributes({ justifyContent: 'space-between' })}
                                        >
                                            Space Between
                                        </Button>
                                        <Button
                                            variant={justifyContent === 'space-around' ? 'primary' : 'secondary'}
                                            onClick={() => setAttributes({ justifyContent: 'space-around' })}
                                        >
                                            Space Around
                                        </Button>
                                        <Button
                                            variant={justifyContent === 'space-evenly' ? 'primary' : 'secondary'}
                                            onClick={() => setAttributes({ justifyContent: 'space-evenly' })}
                                        >
                                            Space Evenly
                                        </Button>
                                    </ButtonGroup>
                                </div>
                                <div>
                                    <label style={{ fontWeight: 'bold', marginBottom: '8px', display: 'block' }}>Align Items</label>
                                    <ButtonGroup style={{ marginBottom: '16px' }}>
                                        <Button
                                            variant={alignItems === 'stretch' ? 'primary' : 'secondary'}
                                            onClick={() => setAttributes({ alignItems: 'stretch' })}
                                        >
                                            Stretch
                                        </Button>
                                        <Button
                                            variant={alignItems === 'flex-start' ? 'primary' : 'secondary'}
                                            onClick={() => setAttributes({ alignItems: 'flex-start' })}
                                        >
                                            Flex Start
                                        </Button>
                                        <Button
                                            variant={alignItems === 'center' ? 'primary' : 'secondary'}
                                            onClick={() => setAttributes({ alignItems: 'center' })}
                                        >
                                            Center
                                        </Button>
                                        <Button
                                            variant={alignItems === 'flex-end' ? 'primary' : 'secondary'}
                                            onClick={() => setAttributes({ alignItems: 'flex-end' })}
                                        >
                                            Flex End
                                        </Button>
                                        <Button
                                            variant={alignItems === 'baseline' ? 'primary' : 'secondary'}
                                            onClick={() => setAttributes({ alignItems: 'baseline' })}
                                        >
                                            Baseline
                                        </Button>
                                    </ButtonGroup>
                                </div>
                                <RangeControl
                                    label="Gap (px)"
                                    value={gap}
                                    min={0}
                                    max={100}
                                    onChange={val => setAttributes({ gap: val })}
                                    __next40pxDefaultSize={true}
                                    __nextHasNoMarginBottom={true}
                                />
                            </>
                        )}
                        {layoutType === 'grid' && (
                            <>
                                <RangeControl
                                    label="Columns"
                                    value={gridColumns}
                                    min={1}
                                    max={12}
                                    onChange={val => setAttributes({ gridColumns: val })}
                                    __next40pxDefaultSize={true}
                                    __nextHasNoMarginBottom={true}
                                />
                                <RangeControl
                                    label="Rows"
                                    value={gridRows}
                                    min={1}
                                    max={12}
                                    onChange={val => setAttributes({ gridRows: val })}
                                    __next40pxDefaultSize={true}
                                    __nextHasNoMarginBottom={true}
                                />
                                <RangeControl
                                    label="Gap (px)"
                                    value={gridGap}
                                    min={0}
                                    max={100}
                                    onChange={val => setAttributes({ gridGap: val })}
                                    __next40pxDefaultSize={true}
                                    __nextHasNoMarginBottom={true}
                                />
                                <SelectControl
                                    label="Align Items"
                                    value={gridAlign}
                                    options={[
                                        { label: 'Stretch', value: 'stretch' },
                                        { label: 'Start', value: 'start' },
                                        { label: 'Center', value: 'center' },
                                        { label: 'End', value: 'end' },
                                    ]}
                                    onChange={val => setAttributes({ gridAlign: val })}
                                />
                                <SelectControl
                                    label="Justify Items"
                                    value={gridJustify}
                                    options={[
                                        { label: 'Stretch', value: 'stretch' },
                                        { label: 'Start', value: 'start' },
                                        { label: 'Center', value: 'center' },
                                        { label: 'End', value: 'end' },
                                    ]}
                                    onChange={val => setAttributes({ gridJustify: val })}
                                />
                            </>
                        )}
                    </PanelBody>
                </InspectorControls>
                {/* Use useInnerBlocksProps to eliminate the wrapper divs */}
                <section {...useInnerBlocksProps(
                    useBlockProps({ className: 'snn-section', style })
                )}></section>
            </>
        );
    },
    save: () => {
        return <InnerBlocks.Content />;
    }
});
