window.addEventListener('DOMContentLoaded', function() {
  if (window.wp && wp.blocks && wp.blockEditor && wp.element) {
    const { registerBlockType } = wp.blocks;
    const { useBlockProps, InnerBlocks } = wp.blockEditor;
    const { createElement } = wp.element;

    registerBlockType('snn-block/section', {
      title: 'Section',
      icon: 'layout',
      category: 'design',
      supports: {
        html: false,
        color: {
          background: true,
          text: true,
          gradients: true
        },
        spacing: {
          padding: true,
          margin: true,
          blockGap: true
        },
        border: {
          color: true,
          radius: true,
          style: true,
          width: true
        },
        typography: {
          fontSize: true,
          lineHeight: true,
          fontFamily: true,
          fontWeight: true,
          fontStyle: true,
          textTransform: true,
          textDecoration: true,
          letterSpacing: true
        },
        dimensions: {
          minHeight: true
        },
        background: {
          backgroundImage: true,
          backgroundSize: true,
          backgroundPosition: true,
          backgroundRepeat: true
        },
        position: {
          sticky: true
        }
      },
      edit: function() {
        const blockProps = useBlockProps({ className: 'snn-section' });
        const template = [
          ['snn-block/container']
        ];
        return createElement(
          'section',
          blockProps,
          createElement(InnerBlocks, {
            template: template,
            allowedBlocks: undefined 
          })
        );
      },
      save: function() {
        const blockProps = useBlockProps.save({ className: 'snn-section' });
        return createElement(
          'section',
          blockProps,
          createElement(InnerBlocks.Content)
        );
      }
    });
  }
});
