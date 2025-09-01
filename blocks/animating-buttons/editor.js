(function(wp) {
  const { createElement: el, useState, useEffect } = wp.element;
  const { registerBlockType } = wp.blocks;
  const { InspectorControls, RichText, useBlockProps } = wp.blockEditor;
  const { PanelBody, TextControl, SelectControl, RangeControl, ColorPicker, Button, ToggleControl, __experimentalBoxControl: BoxControl } = wp.components;

  function Edit(props) {
    const { attributes, setAttributes } = props;
    const blockProps = useBlockProps();

    const animationTypes = [
      { label: 'None', value: 'none' },
      { label: 'Fade In', value: 'fadeIn' },
      { label: 'Slide Up', value: 'slideUp' },
      { label: 'Slide Down', value: 'slideDown' },
      { label: 'Slide Left', value: 'slideLeft' },
      { label: 'Slide Right', value: 'slideRight' },
      { label: 'Bounce', value: 'bounce' },
      { label: 'Pulse', value: 'pulse' },
      { label: 'Shake', value: 'shake' },
      { label: 'Rotate', value: 'rotate' },
      { label: 'Scale', value: 'scale' }
    ];

    const hoverAnimations = [
      { label: 'None', value: 'none' },
      { label: 'Grow', value: 'grow' },
      { label: 'Shrink', value: 'shrink' },
      { label: 'Rotate', value: 'rotateHover' },
      { label: 'Glow', value: 'glow' },
      { label: 'Shadow', value: 'shadow' },
      { label: 'Color Change', value: 'colorChange' }
    ];

    const easingOptions = [
      { label: 'Ease', value: 'ease' },
      { label: 'Linear', value: 'linear' },
      { label: 'Ease In', value: 'ease-in' },
      { label: 'Ease Out', value: 'ease-out' },
      { label: 'Ease In Out', value: 'ease-in-out' }
    ];

    const borderStyles = [
      { label: 'Solid', value: 'solid' },
      { label: 'Dashed', value: 'dashed' },
      { label: 'Dotted', value: 'dotted' },
      { label: 'Double', value: 'double' },
      { label: 'Groove', value: 'groove' },
      { label: 'Ridge', value: 'ridge' },
      { label: 'Inset', value: 'inset' },
      { label: 'Outset', value: 'outset' }
    ];

    const fontWeights = [
      { label: '100', value: '100' },
      { label: '200', value: '200' },
      { label: '300', value: '300' },
      { label: '400', value: '400' },
      { label: '500', value: '500' },
      { label: '600', value: '600' },
      { label: '700', value: '700' },
      { label: '800', value: '800' },
      { label: '900', value: '900' }
    ];

    const textTransforms = [
      { label: 'None', value: 'none' },
      { label: 'Capitalize', value: 'capitalize' },
      { label: 'Uppercase', value: 'uppercase' },
      { label: 'Lowercase', value: 'lowercase' }
    ];

    const alignments = [
      { label: 'Left', value: 'left' },
      { label: 'Center', value: 'center' },
      { label: 'Right', value: 'right' }
    ];

    const buttonStyle = {
      backgroundColor: attributes.backgroundColor,
      color: attributes.textColor,
      borderColor: attributes.borderColor,
      borderWidth: attributes.borderWidth + 'px',
      borderRadius: attributes.borderRadius + 'px',
      borderStyle: attributes.borderStyle,
      paddingTop: attributes.paddingTop,
      paddingRight: attributes.paddingRight,
      paddingBottom: attributes.paddingBottom,
      paddingLeft: attributes.paddingLeft,
      marginTop: attributes.marginTop,
      marginRight: attributes.marginRight,
      marginBottom: attributes.marginBottom,
      marginLeft: attributes.marginLeft,
      fontSize: attributes.fontSize,
      fontWeight: attributes.fontWeight,
      fontFamily: attributes.fontFamily,
      textTransform: attributes.textTransform,
      letterSpacing: attributes.letterSpacing,
      lineHeight: attributes.lineHeight,
      boxShadow: `${attributes.shadowHorizontal}px ${attributes.shadowVertical}px ${attributes.shadowBlur}px ${attributes.shadowSpread}px rgba(${hexToRgb(attributes.shadowColor)}, ${attributes.shadowOpacity})`,
      width: attributes.width,
      height: attributes.height,
      textAlign: 'center',
      display: 'inline-block',
      cursor: 'pointer',
      transition: 'all 0.3s ease'
    };

    function hexToRgb(hex) {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : '0, 0, 0';
    }

    return el('div', blockProps, [
      el(InspectorControls, {}, [
        el(PanelBody, { title: 'Button Content', initialOpen: true }, [
          el(TextControl, {
            label: 'Button Text',
            value: attributes.text,
            onChange: (value) => setAttributes({ text: value })
          }),
          el(TextControl, {
            label: 'URL',
            value: attributes.url,
            onChange: (value) => setAttributes({ url: value })
          }),
          el(SelectControl, {
            label: 'Target',
            value: attributes.target,
            options: [
              { label: 'Same Window', value: '_self' },
              { label: 'New Window', value: '_blank' }
            ],
            onChange: (value) => setAttributes({ target: value })
          }),
          el(TextControl, {
            label: 'Rel',
            value: attributes.rel,
            onChange: (value) => setAttributes({ rel: value })
          })
        ]),
        el(PanelBody, { title: 'Animations', initialOpen: false }, [
          el(SelectControl, {
            label: 'Entry Animation',
            value: attributes.animationType,
            options: animationTypes,
            onChange: (value) => setAttributes({ animationType: value })
          }),
          el(RangeControl, {
            label: 'Animation Duration (ms)',
            value: attributes.animationDuration,
            onChange: (value) => setAttributes({ animationDuration: value }),
            min: 100,
            max: 5000,
            step: 100
          }),
          el(RangeControl, {
            label: 'Animation Delay (ms)',
            value: attributes.animationDelay,
            onChange: (value) => setAttributes({ animationDelay: value }),
            min: 0,
            max: 5000,
            step: 100
          }),
          el(SelectControl, {
            label: 'Animation Easing',
            value: attributes.animationEasing,
            options: easingOptions,
            onChange: (value) => setAttributes({ animationEasing: value })
          }),
          el(SelectControl, {
            label: 'Hover Animation',
            value: attributes.hoverAnimation,
            options: hoverAnimations,
            onChange: (value) => setAttributes({ hoverAnimation: value })
          })
        ]),
        el(PanelBody, { title: 'Colors', initialOpen: false }, [
          el('div', {}, [
            el('label', {}, 'Background Color'),
            el(ColorPicker, {
              color: attributes.backgroundColor,
              onChange: (value) => setAttributes({ backgroundColor: value })
            })
          ]),
          el('div', {}, [
            el('label', {}, 'Text Color'),
            el(ColorPicker, {
              color: attributes.textColor,
              onChange: (value) => setAttributes({ textColor: value })
            })
          ]),
          el('div', {}, [
            el('label', {}, 'Border Color'),
            el(ColorPicker, {
              color: attributes.borderColor,
              onChange: (value) => setAttributes({ borderColor: value })
            })
          ]),
          el('div', {}, [
            el('label', {}, 'Shadow Color'),
            el(ColorPicker, {
              color: attributes.shadowColor,
              onChange: (value) => setAttributes({ shadowColor: value })
            })
          ]),
          el(RangeControl, {
            label: 'Shadow Opacity',
            value: attributes.shadowOpacity,
            onChange: (value) => setAttributes({ shadowOpacity: value }),
            min: 0,
            max: 1,
            step: 0.1
          })
        ]),
        el(PanelBody, { title: 'Border & Shadow', initialOpen: false }, [
          el(RangeControl, {
            label: 'Border Width (px)',
            value: attributes.borderWidth,
            onChange: (value) => setAttributes({ borderWidth: value }),
            min: 0,
            max: 20,
            step: 1
          }),
          el(RangeControl, {
            label: 'Border Radius (px)',
            value: attributes.borderRadius,
            onChange: (value) => setAttributes({ borderRadius: value }),
            min: 0,
            max: 50,
            step: 1
          }),
          el(SelectControl, {
            label: 'Border Style',
            value: attributes.borderStyle,
            options: borderStyles,
            onChange: (value) => setAttributes({ borderStyle: value })
          }),
          el(RangeControl, {
            label: 'Shadow Blur (px)',
            value: attributes.shadowBlur,
            onChange: (value) => setAttributes({ shadowBlur: value }),
            min: 0,
            max: 50,
            step: 1
          }),
          el(RangeControl, {
            label: 'Shadow Spread (px)',
            value: attributes.shadowSpread,
            onChange: (value) => setAttributes({ shadowSpread: value }),
            min: -50,
            max: 50,
            step: 1
          }),
          el(RangeControl, {
            label: 'Shadow Horizontal (px)',
            value: attributes.shadowHorizontal,
            onChange: (value) => setAttributes({ shadowHorizontal: value }),
            min: -50,
            max: 50,
            step: 1
          }),
          el(RangeControl, {
            label: 'Shadow Vertical (px)',
            value: attributes.shadowVertical,
            onChange: (value) => setAttributes({ shadowVertical: value }),
            min: -50,
            max: 50,
            step: 1
          })
        ]),
        el(PanelBody, { title: 'Spacing', initialOpen: false }, [
          el('label', {}, 'Padding'),
          el(BoxControl, {
            values: {
              top: attributes.paddingTop,
              right: attributes.paddingRight,
              bottom: attributes.paddingBottom,
              left: attributes.paddingLeft
            },
            onChange: (value) => setAttributes({
              paddingTop: value.top || '0px',
              paddingRight: value.right || '0px',
              paddingBottom: value.bottom || '0px',
              paddingLeft: value.left || '0px'
            })
          }),
          el('label', {}, 'Margin'),
          el(BoxControl, {
            values: {
              top: attributes.marginTop,
              right: attributes.marginRight,
              bottom: attributes.marginBottom,
              left: attributes.marginLeft
            },
            onChange: (value) => setAttributes({
              marginTop: value.top || '0px',
              marginRight: value.right || '0px',
              marginBottom: value.bottom || '0px',
              marginLeft: value.left || '0px'
            })
          })
        ]),
        el(PanelBody, { title: 'Typography', initialOpen: false }, [
          el(TextControl, {
            label: 'Font Size',
            value: attributes.fontSize,
            onChange: (value) => setAttributes({ fontSize: value })
          }),
          el(SelectControl, {
            label: 'Font Weight',
            value: attributes.fontWeight,
            options: fontWeights,
            onChange: (value) => setAttributes({ fontWeight: value })
          }),
          el(TextControl, {
            label: 'Font Family',
            value: attributes.fontFamily,
            onChange: (value) => setAttributes({ fontFamily: value })
          }),
          el(SelectControl, {
            label: 'Text Transform',
            value: attributes.textTransform,
            options: textTransforms,
            onChange: (value) => setAttributes({ textTransform: value })
          }),
          el(TextControl, {
            label: 'Letter Spacing',
            value: attributes.letterSpacing,
            onChange: (value) => setAttributes({ letterSpacing: value })
          }),
          el(TextControl, {
            label: 'Line Height',
            value: attributes.lineHeight,
            onChange: (value) => setAttributes({ lineHeight: value })
          })
        ]),
        el(PanelBody, { title: 'Layout', initialOpen: false }, [
          el(TextControl, {
            label: 'Width',
            value: attributes.width,
            onChange: (value) => setAttributes({ width: value })
          }),
          el(TextControl, {
            label: 'Height',
            value: attributes.height,
            onChange: (value) => setAttributes({ height: value })
          }),
          el(SelectControl, {
            label: 'Alignment',
            value: attributes.align,
            options: alignments,
            onChange: (value) => setAttributes({ align: value })
          })
        ]),
        el(PanelBody, { title: 'Advanced', initialOpen: false }, [
          el(TextControl, {
            label: 'Custom Class',
            value: attributes.customClass,
            onChange: (value) => setAttributes({ customClass: value })
          })
        ])
      ]),
      el('div', { style: { textAlign: attributes.align } }, [
        el('a', {
          href: attributes.url || '#',
          target: attributes.target,
          rel: attributes.rel,
          className: `snn-animating-button ${attributes.customClass} animation-${attributes.animationType} hover-${attributes.hoverAnimation}`,
          style: buttonStyle,
          'data-duration': attributes.animationDuration,
          'data-delay': attributes.animationDelay,
          'data-easing': attributes.animationEasing
        }, attributes.text)
      ])
    ]);
  }

  registerBlockType('snn-block/animating-buttons', {
    edit: Edit,
    save: function() { return null; }
  });
})(window.wp);
