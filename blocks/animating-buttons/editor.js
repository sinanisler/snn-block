(function(wp) {
  const el = wp.element.createElement;
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

    function hexToRgb(hex) {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : '0, 0, 0';
    }

    const buttonStyle = {
      backgroundColor: attributes.backgroundColor || '#007cba',
      color: attributes.textColor || '#ffffff',
      borderColor: attributes.borderColor || '#007cba',
      borderWidth: (attributes.borderWidth || 0) + 'px',
      borderRadius: (attributes.borderRadius || 4) + 'px',
      borderStyle: attributes.borderStyle || 'solid',
      paddingTop: attributes.paddingTop || '12px',
      paddingRight: attributes.paddingRight || '24px',
      paddingBottom: attributes.paddingBottom || '12px',
      paddingLeft: attributes.paddingLeft || '24px',
      marginTop: attributes.marginTop || '0px',
      marginRight: attributes.marginRight || '0px',
      marginBottom: attributes.marginBottom || '0px',
      marginLeft: attributes.marginLeft || '0px',
      fontSize: attributes.fontSize || '16px',
      fontWeight: attributes.fontWeight || '400',
      fontFamily: attributes.fontFamily || 'inherit',
      textTransform: attributes.textTransform || 'none',
      letterSpacing: attributes.letterSpacing || '0px',
      lineHeight: attributes.lineHeight || '1.5',
      boxShadow: `${attributes.shadowHorizontal || 0}px ${attributes.shadowVertical || 2}px ${attributes.shadowBlur || 4}px ${attributes.shadowSpread || 0}px rgba(${hexToRgb(attributes.shadowColor || '#000000')}, ${attributes.shadowOpacity || 0.2})`,
      width: attributes.width || 'auto',
      height: attributes.height || 'auto',
      textAlign: 'center',
      display: 'inline-block',
      cursor: 'pointer',
      transition: 'all 0.3s ease'
    };

    return el('div', blockProps, [
      el(InspectorControls, {}, [
        el(PanelBody, { title: 'Button Content', initialOpen: true }, [
          el(TextControl, {
            label: 'Button Text',
            value: attributes.text || 'Click Me',
            onChange: function(val) { setAttributes({ text: val }); }
          }),
          el(TextControl, {
            label: 'URL',
            value: attributes.url || '',
            onChange: function(val) { setAttributes({ url: val }); }
          }),
          el(SelectControl, {
            label: 'Target',
            value: attributes.target || '_self',
            options: [
              { label: 'Same Window', value: '_self' },
              { label: 'New Window', value: '_blank' }
            ],
            onChange: function(val) { setAttributes({ target: val }); }
          }),
          el(TextControl, {
            label: 'Rel',
            value: attributes.rel || '',
            onChange: function(val) { setAttributes({ rel: val }); }
          })
        ]),
        el(PanelBody, { title: 'Animations', initialOpen: false }, [
          el(SelectControl, {
            label: 'Entry Animation',
            value: attributes.animationType || 'none',
            options: animationTypes,
            onChange: function(val) { setAttributes({ animationType: val }); }
          }),
          el(RangeControl, {
            label: 'Animation Duration (ms)',
            value: attributes.animationDuration || 1000,
            onChange: function(val) { setAttributes({ animationDuration: val }); },
            min: 100,
            max: 5000,
            step: 100
          }),
          el(RangeControl, {
            label: 'Animation Delay (ms)',
            value: attributes.animationDelay || 0,
            onChange: function(val) { setAttributes({ animationDelay: val }); },
            min: 0,
            max: 5000,
            step: 100
          }),
          el(SelectControl, {
            label: 'Animation Easing',
            value: attributes.animationEasing || 'ease',
            options: easingOptions,
            onChange: function(val) { setAttributes({ animationEasing: val }); }
          }),
          el(SelectControl, {
            label: 'Hover Animation',
            value: attributes.hoverAnimation || 'none',
            options: hoverAnimations,
            onChange: function(val) { setAttributes({ hoverAnimation: val }); }
          })
        ]),
        el(PanelBody, { title: 'Colors', initialOpen: false }, [
          el('div', {}, [
            el('label', { style: { display: 'block', marginBottom: '8px' } }, 'Background Color'),
            el(ColorPicker, {
              color: attributes.backgroundColor || '#007cba',
              onChange: function(val) { setAttributes({ backgroundColor: val }); }
            })
          ]),
          el('div', {}, [
            el('label', { style: { display: 'block', marginBottom: '8px' } }, 'Text Color'),
            el(ColorPicker, {
              color: attributes.textColor || '#ffffff',
              onChange: function(val) { setAttributes({ textColor: val }); }
            })
          ]),
          el('div', {}, [
            el('label', { style: { display: 'block', marginBottom: '8px' } }, 'Border Color'),
            el(ColorPicker, {
              color: attributes.borderColor || '#007cba',
              onChange: function(val) { setAttributes({ borderColor: val }); }
            })
          ]),
          el('div', {}, [
            el('label', { style: { display: 'block', marginBottom: '8px' } }, 'Shadow Color'),
            el(ColorPicker, {
              color: attributes.shadowColor || '#000000',
              onChange: function(val) { setAttributes({ shadowColor: val }); }
            })
          ]),
          el(RangeControl, {
            label: 'Shadow Opacity',
            value: attributes.shadowOpacity || 0.2,
            onChange: function(val) { setAttributes({ shadowOpacity: val }); },
            min: 0,
            max: 1,
            step: 0.1
          })
        ]),
        el(PanelBody, { title: 'Border & Shadow', initialOpen: false }, [
          el(RangeControl, {
            label: 'Border Width (px)',
            value: attributes.borderWidth || 0,
            onChange: function(val) { setAttributes({ borderWidth: val }); },
            min: 0,
            max: 20,
            step: 1
          }),
          el(RangeControl, {
            label: 'Border Radius (px)',
            value: attributes.borderRadius || 4,
            onChange: function(val) { setAttributes({ borderRadius: val }); },
            min: 0,
            max: 50,
            step: 1
          }),
          el(SelectControl, {
            label: 'Border Style',
            value: attributes.borderStyle || 'solid',
            options: borderStyles,
            onChange: function(val) { setAttributes({ borderStyle: val }); }
          }),
          el(RangeControl, {
            label: 'Shadow Blur (px)',
            value: attributes.shadowBlur || 4,
            onChange: function(val) { setAttributes({ shadowBlur: val }); },
            min: 0,
            max: 50,
            step: 1
          }),
          el(RangeControl, {
            label: 'Shadow Spread (px)',
            value: attributes.shadowSpread || 0,
            onChange: function(val) { setAttributes({ shadowSpread: val }); },
            min: -50,
            max: 50,
            step: 1
          }),
          el(RangeControl, {
            label: 'Shadow Horizontal (px)',
            value: attributes.shadowHorizontal || 0,
            onChange: function(val) { setAttributes({ shadowHorizontal: val }); },
            min: -50,
            max: 50,
            step: 1
          }),
          el(RangeControl, {
            label: 'Shadow Vertical (px)',
            value: attributes.shadowVertical || 2,
            onChange: function(val) { setAttributes({ shadowVertical: val }); },
            min: -50,
            max: 50,
            step: 1
          })
        ]),
        el(PanelBody, { title: 'Spacing', initialOpen: false }, [
          el('label', {}, 'Padding'),
          el(BoxControl, {
            values: {
              top: attributes.paddingTop || '12px',
              right: attributes.paddingRight || '24px',
              bottom: attributes.paddingBottom || '12px',
              left: attributes.paddingLeft || '24px'
            },
            onChange: function(value) {
              setAttributes({
                paddingTop: value.top || '0px',
                paddingRight: value.right || '0px',
                paddingBottom: value.bottom || '0px',
                paddingLeft: value.left || '0px'
              });
            }
          }),
          el('label', {}, 'Margin'),
          el(BoxControl, {
            values: {
              top: attributes.marginTop || '0px',
              right: attributes.marginRight || '0px',
              bottom: attributes.marginBottom || '0px',
              left: attributes.marginLeft || '0px'
            },
            onChange: function(value) {
              setAttributes({
                marginTop: value.top || '0px',
                marginRight: value.right || '0px',
                marginBottom: value.bottom || '0px',
                marginLeft: value.left || '0px'
              });
            }
          })
        ]),
        el(PanelBody, { title: 'Typography', initialOpen: false }, [
          el(TextControl, {
            label: 'Font Size',
            value: attributes.fontSize || '16px',
            onChange: function(val) { setAttributes({ fontSize: val }); }
          }),
          el(SelectControl, {
            label: 'Font Weight',
            value: attributes.fontWeight || '400',
            options: fontWeights,
            onChange: function(val) { setAttributes({ fontWeight: val }); }
          }),
          el(TextControl, {
            label: 'Font Family',
            value: attributes.fontFamily || 'inherit',
            onChange: function(val) { setAttributes({ fontFamily: val }); }
          }),
          el(SelectControl, {
            label: 'Text Transform',
            value: attributes.textTransform || 'none',
            options: textTransforms,
            onChange: function(val) { setAttributes({ textTransform: val }); }
          }),
          el(TextControl, {
            label: 'Letter Spacing',
            value: attributes.letterSpacing || '0px',
            onChange: function(val) { setAttributes({ letterSpacing: val }); }
          }),
          el(TextControl, {
            label: 'Line Height',
            value: attributes.lineHeight || '1.5',
            onChange: function(val) { setAttributes({ lineHeight: val }); }
          })
        ]),
        el(PanelBody, { title: 'Layout', initialOpen: false }, [
          el(TextControl, {
            label: 'Width',
            value: attributes.width || 'auto',
            onChange: function(val) { setAttributes({ width: val }); }
          }),
          el(TextControl, {
            label: 'Height',
            value: attributes.height || 'auto',
            onChange: function(val) { setAttributes({ height: val }); }
          }),
          el(SelectControl, {
            label: 'Alignment',
            value: attributes.align || 'left',
            options: alignments,
            onChange: function(val) { setAttributes({ align: val }); }
          })
        ]),
        el(PanelBody, { title: 'Advanced', initialOpen: false }, [
          el(TextControl, {
            label: 'Custom Class',
            value: attributes.customClass || '',
            onChange: function(val) { setAttributes({ customClass: val }); }
          })
        ])
      ]),
      el('div', { style: { textAlign: attributes.align || 'left' } }, [
        el('a', {
          href: attributes.url || '#',
          target: attributes.target || '_self',
          rel: attributes.rel || '',
          className: `snn-animating-button ${attributes.customClass || ''} animation-${attributes.animationType || 'none'} hover-${attributes.hoverAnimation || 'none'}`,
          style: buttonStyle,
          'data-duration': attributes.animationDuration || 1000,
          'data-delay': attributes.animationDelay || 0,
          'data-easing': attributes.animationEasing || 'ease'
        }, attributes.text || 'Click Me')
      ])
    ]);
  }

  registerBlockType('snn-block/animating-buttons', {
    edit: Edit,
    save: function() { return null; }
  });
})(window.wp);
