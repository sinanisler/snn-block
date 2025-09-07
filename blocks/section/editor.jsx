
const { useBlockProps, InnerBlocks } = wp.blockEditor;
const { InspectorControls } = wp.blockEditor;
const {
    PanelBody,
    SelectControl,
    RangeControl,
    __experimentalToggleGroupControl: ToggleGroupControl,
    __experimentalToggleGroupControlOption: ToggleGroupControlOption
} = wp.components;

// Fallback check for components availability
const hasToggleGroup = typeof ToggleGroupControl !== 'undefined';

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
                        {hasToggleGroup ? (
                            <ToggleGroupControl
                                label="Layout Type"
                                value={layoutType}
                                onChange={val => setAttributes({ layoutType: val })}
                                isBlock
                            >
                                <ToggleGroupControlOption key="flex" label="Flex" value="flex" />
                                <ToggleGroupControlOption key="grid" label="Grid" value="grid" />
                            </ToggleGroupControl>
                        ) : (
                            <SelectControl
                                label="Layout Type"
                                value={layoutType}
                                options={[
                                    { label: 'Flex', value: 'flex' },
                                    { label: 'Grid', value: 'grid' },
                                ]}
                                onChange={val => setAttributes({ layoutType: val })}
                            />
                        )}
                        {layoutType === 'flex' && (
                            <>
                                {hasToggleGroup ? (
                                    <ToggleGroupControl
                                        label="Direction"
                                        value={flexDirection}
                                        onChange={val => setAttributes({ flexDirection: val })}
                                        isBlock
                                    >
                                        <ToggleGroupControlOption key="row" label="Row" value="row" />
                                        <ToggleGroupControlOption key="row-reverse" label="Row Reverse" value="row-reverse" />
                                        <ToggleGroupControlOption key="column" label="Column" value="column" />
                                        <ToggleGroupControlOption key="column-reverse" label="Column Reverse" value="column-reverse" />
                                    </ToggleGroupControl>
                                ) : (
                                    <SelectControl
                                        label="Direction"
                                        value={flexDirection}
                                        options={[
                                            { label: 'Row', value: 'row' },
                                            { label: 'Row Reverse', value: 'row-reverse' },
                                            { label: 'Column', value: 'column' },
                                            { label: 'Column Reverse', value: 'column-reverse' },
                                        ]}
                                        onChange={val => setAttributes({ flexDirection: val })}
                                    />
                                )}
                                <SelectControl
                                    label="Wrap"
                                    value={flexWrap}
                                    options={[
                                        { label: 'No Wrap', value: 'nowrap' },
                                        { label: 'Wrap', value: 'wrap' },
                                        { label: 'Wrap Reverse', value: 'wrap-reverse' },
                                    ]}
                                    onChange={val => setAttributes({ flexWrap: val })}
                                />
                                <SelectControl
                                    label="Justify Content"
                                    value={justifyContent}
                                    options={[
                                        { label: 'Flex Start', value: 'flex-start' },
                                        { label: 'Center', value: 'center' },
                                        { label: 'Flex End', value: 'flex-end' },
                                        { label: 'Space Between', value: 'space-between' },
                                        { label: 'Space Around', value: 'space-around' },
                                        { label: 'Space Evenly', value: 'space-evenly' },
                                    ]}
                                    onChange={val => setAttributes({ justifyContent: val })}
                                />
                                <SelectControl
                                    label="Align Items"
                                    value={alignItems}
                                    options={[
                                        { label: 'Stretch', value: 'stretch' },
                                        { label: 'Flex Start', value: 'flex-start' },
                                        { label: 'Center', value: 'center' },
                                        { label: 'Flex End', value: 'flex-end' },
                                        { label: 'Baseline', value: 'baseline' },
                                    ]}
                                    onChange={val => setAttributes({ alignItems: val })}
                                />
                                <RangeControl
                                    label="Gap (px)"
                                    value={gap}
                                    min={0}
                                    max={100}
                                    onChange={val => setAttributes({ gap: val })}
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
                                />
                                <RangeControl
                                    label="Rows"
                                    value={gridRows}
                                    min={1}
                                    max={12}
                                    onChange={val => setAttributes({ gridRows: val })}
                                />
                                <RangeControl
                                    label="Gap (px)"
                                    value={gridGap}
                                    min={0}
                                    max={100}
                                    onChange={val => setAttributes({ gridGap: val })}
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
                <section {...useBlockProps({ className: 'snn-section', style })}>
                    <InnerBlocks />
                </section>
            </>
        );
    },
    save: () => null
});
