const { useBlockProps, InnerBlocks } = wp.blockEditor;

wp.blocks.registerBlockType('snn/section', {
    title: 'Section',
    icon: 'layout',
    category: 'layout',
    supports: {
        html: false,
        innerBlocks: true
    },
    edit: (props) => {
        return (
            <section {...useBlockProps({ className: 'snn-section' })}>
                <InnerBlocks />
            </section>
        );
    },
    save: () => null
});
