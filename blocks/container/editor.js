const { registerBlockType } = wp.blocks;
const { useBlockProps, InnerBlocks } = wp.blockEditor;
const { createElement } = wp.element;

registerBlockType('snn-block/container', {
  title: 'Container',
  icon: 'editor-table',
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
    layout: {
      allowSwitching: false,
      allowInheriting: false,
      default: { type: 'constrained' }
    },
    __experimentalLayout: {
      allowSwitching: false,
      allowInheriting: false,
      default: { type: 'constrained' }
    },
    sizing: {
      width: true,
      maxWidth: true,
      minWidth: true
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
    const blockProps = useBlockProps({ className: 'snn-container' });
    const template = [
      ['core/paragraph', { placeholder: 'Add your content...' }]
    ];
    return createElement(
      'div',
      blockProps,
      createElement(InnerBlocks, {
        template: template,
        allowedBlocks: undefined 
      })
    );
  },
  save: function() {
    const blockProps = useBlockProps.save({ className: 'snn-container' });
    return createElement(
      'div',
      blockProps,
      createElement(InnerBlocks.Content)
    );
  }
});
