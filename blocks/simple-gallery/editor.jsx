const { registerBlockType } = wp.blocks;
const { InspectorControls, useBlockProps, MediaUpload, MediaUploadCheck } = wp.blockEditor;
const { PanelBody, Button, RangeControl, SelectControl, ToggleControl, __experimentalToggleGroupControl, __experimentalToggleGroupControlOption } = wp.components;
const { Fragment, useState } = wp.element;
const { __, sprintf } = wp.i18n;

registerBlockType('snn/simple-gallery', {
    edit: function (props) {
        const { attributes, setAttributes } = props;
        const { images, columns, gap, aspectRatio, enableLightbox } = attributes;

        const hasToggleGroup = typeof __experimentalToggleGroupControl !== 'undefined';

        const onSelectImages = (media) => {
            const newImages = media.map((item) => ({
                id: item.id,
                url: item.url,
                alt: item.alt || '',
                caption: item.caption || '',
            }));
            setAttributes({ images: newImages });
        };

        const removeImage = (index) => {
            const newImages = [...images];
            newImages.splice(index, 1);
            setAttributes({ images: newImages });
        };

        const blockProps = useBlockProps({
            className: 'snn-simple-gallery' + (enableLightbox ? ' has-lightbox' : ''),
            style: {
                '--snn-gallery-columns': columns,
                '--snn-gallery-gap': gap + 'px',
                '--snn-gallery-aspect-ratio': aspectRatio,
            },
        });

        return (
            <Fragment>
                <InspectorControls>
                    <PanelBody title={__('Gallery Settings', 'snn')} initialOpen={true}>
                        <MediaUploadCheck>
                            <MediaUpload
                                onSelect={onSelectImages}
                                allowedTypes={['image']}
                                multiple={true}
                                gallery={true}
                                value={images.map((img) => img.id)}
                                render={({ open }) => (
                                    <div style={{ marginBottom: '16px' }}>
                                        <Button
                                            variant="primary"
                                            onClick={open}
                                            style={{ width: '100%', justifyContent: 'center' }}
                                        >
                                            {images.length > 0
                                                ? __('Edit Gallery', 'snn')
                                                : __('Select Images', 'snn')}
                                        </Button>
                                        {images.length > 0 && (
                                            <p style={{ margin: '8px 0 0', color: '#757575', fontSize: '12px' }}>
                                                {sprintf(
                                                    __('%d image(s) selected', 'snn'),
                                                    images.length
                                                )}
                                            </p>
                                        )}
                                    </div>
                                )}
                            />
                        </MediaUploadCheck>

                        <RangeControl
                            label={__('Columns', 'snn')}
                            value={columns}
                            onChange={(val) => setAttributes({ columns: val })}
                            min={1}
                            max={6}
                            step={1}
                            __next40pxDefaultSize={true}
                            __nextHasNoMarginBottom={true}
                        />

                        <RangeControl
                            label={__('Gap (px)', 'snn')}
                            value={gap}
                            onChange={(val) => setAttributes({ gap: val })}
                            min={0}
                            max={40}
                            step={2}
                            __next40pxDefaultSize={true}
                            __nextHasNoMarginBottom={true}
                        />

                        {hasToggleGroup ? (
                            <__experimentalToggleGroupControl
                                label={__('Aspect Ratio', 'snn')}
                                value={aspectRatio}
                                onChange={(val) => setAttributes({ aspectRatio: val })}
                                isBlock
                                __next40pxDefaultSize={true}
                                __nextHasNoMarginBottom={true}
                            >
                                <__experimentalToggleGroupControlOption key="1/1" label="1:1" value="1/1" />
                                <__experimentalToggleGroupControlOption key="4/3" label="4:3" value="4/3" />
                                <__experimentalToggleGroupControlOption key="3/2" label="3:2" value="3/2" />
                                <__experimentalToggleGroupControlOption key="16/9" label="16:9" value="16/9" />
                                <__experimentalToggleGroupControlOption key="2/3" label="2:3" value="2/3" />
                            </__experimentalToggleGroupControl>
                        ) : (
                            <SelectControl
                                label={__('Aspect Ratio', 'snn')}
                                value={aspectRatio}
                                options={[
                                    { label: '1:1', value: '1/1' },
                                    { label: '4:3', value: '4/3' },
                                    { label: '3:2', value: '3/2' },
                                    { label: '16:9', value: '16/9' },
                                    { label: '2:3', value: '2/3' },
                                ]}
                                onChange={(val) => setAttributes({ aspectRatio: val })}
                            />
                        )}

                        <ToggleControl
                            label={__('Enable Lightbox', 'snn')}
                            help={enableLightbox
                                ? __('Clicking an image opens it in a fullscreen lightbox.', 'snn')
                                : __('Turn on to enable a fullscreen lightbox with navigation.', 'snn')}
                            checked={enableLightbox}
                            onChange={(val) => setAttributes({ enableLightbox: val })}
                        />
                    </PanelBody>
                </InspectorControls>

                <div {...blockProps}>
                    {images.length === 0 ? (
                        <div className="snn-gallery-placeholder">
                            <MediaUploadCheck>
                                <MediaUpload
                                    onSelect={onSelectImages}
                                    allowedTypes={['image']}
                                    multiple={true}
                                    gallery={true}
                                    value={[]}
                                    render={({ open }) => (
                                        <Button
                                            variant="secondary"
                                            onClick={open}
                                            style={{
                                                width: '100%',
                                                justifyContent: 'center',
                                                minHeight: '200px',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                alignItems: 'center',
                                                background: '#f0f0f0',
                                                border: '2px dashed #ccc',
                                                borderRadius: '4px',
                                                cursor: 'pointer',
                                            }}
                                        >
                                            <span style={{ fontSize: '40px', display: 'block', marginBottom: '8px' }}>🖼️</span>
                                            <span>{__('Click to select gallery images', 'snn')}</span>
                                        </Button>
                                    )}
                                />
                            </MediaUploadCheck>
                        </div>
                    ) : (
                        <div className="snn-gallery-grid">
                            {images.map((image, index) => (
                                <div className="snn-gallery-item" key={image.id || index}>
                                    <img
                                        src={image.url}
                                        alt={image.alt || ''}
                                    />
                                    <Button
                                        className="snn-gallery-remove-btn"
                                        onClick={() => removeImage(index)}
                                        icon={
                                            <span style={{ fontSize: '16px', lineHeight: '1' }}>✕</span>
                                        }
                                        label={__('Remove Image', 'snn')}
                                        style={{
                                            position: 'absolute',
                                            top: '4px',
                                            right: '4px',
                                            background: 'rgba(0,0,0,0.6)',
                                            color: '#fff',
                                            border: 'none',
                                            borderRadius: '50%',
                                            width: '28px',
                                            height: '28px',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            padding: '0',
                                            minWidth: '28px',
                                        }}
                                    />
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </Fragment>
        );
    },

    save: function () {
        return null;
    },
});
