<?php
/**
 * What the MCP abilities tell an agent about block markup: a report on stored content (snn_blocks_report) and the
 * schema of our blocks (snn_block_schema, the snn/get-block-schema ability).
 *
 * The report reads the markup as WordPress stores it: the blocks of each kind, the blocks this site does not know (or
 * has switched off), the values our blocks drop when they render (a value that is not allowed for its setting writes
 * nothing), and the number of Code blocks (parts kept as written HTML).
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

/**
 * Report on block markup.
 *
 * @return array { blocks: {name: count}, unknown_blocks: [name], disabled_blocks: [name], dropped: [{block, id, attribute, value, reason}], code_fallbacks: int }
 */
function snn_blocks_report( $markup ) {
    $report = array(
        'blocks'          => array(),
        'unknown_blocks'  => array(),
        'disabled_blocks' => array(),
        'dropped'         => array(),
        'code_fallbacks'  => 0,
    );
    $registry = WP_Block_Type_Registry::get_instance();
    $allowed  = snn_blocks_allowed_names();
    $walk     = function ( array $blocks ) use ( &$walk, &$report, $registry, $allowed ) {
        foreach ( $blocks as $block ) {
            $name = $block['blockName'] ?? null;
            if ( ! $name ) {
                if ( '' !== trim( (string) ( $block['innerHTML'] ?? '' ) ) ) {
                    $report['unknown_blocks'][] = '(HTML outside a block)';
                }
                continue;
            }
            $report['blocks'][ $name ] = ( $report['blocks'][ $name ] ?? 0 ) + 1;
            if ( ! $registry->is_registered( $name ) ) {
                $report['unknown_blocks'][] = $name;
            } elseif ( null !== $allowed && ! in_array( $name, $allowed, true ) ) {
                $report['disabled_blocks'][] = $name;
            }
            if ( 'snn/code' === $name ) {
                $report['code_fallbacks']++;
            }
            if ( isset( SNN_Layout_Blocks::definitions()[ $name ] ) ) {
                foreach ( snn_blocks_dropped_values( $name, (array) ( $block['attrs'] ?? array() ) ) as $row ) {
                    $report['dropped'][] = $row;
                }
            }
            if ( ! empty( $block['innerBlocks'] ) ) {
                $walk( $block['innerBlocks'] );
            }
        }
    };
    $walk( parse_blocks( (string) $markup ) );
    $report['unknown_blocks']  = array_values( array_unique( $report['unknown_blocks'] ) );
    $report['disabled_blocks'] = array_values( array_unique( $report['disabled_blocks'] ) );
    return $report;
}

/** The block names the editor offers (the Block Editor Settings switches), or null when every block is allowed. */
function snn_blocks_allowed_names() {
    $settings = apply_filters( 'allowed_block_types_all', true, new WP_Block_Editor_Context( array( 'name' => 'core/edit-post' ) ) );
    return is_array( $settings ) ? array_values( $settings ) : null;
}

/**
 * The values of one of our blocks that are not used: attributes it does not have, values outside the allowed list,
 * and style values its check refuses. A value with a dynamic tag ({post_title}) is checked when the page renders, so
 * it is not judged here.
 */
function snn_blocks_dropped_values( $name, array $attrs ) {
    $out      = array();
    $id       = is_string( $attrs['htmlId'] ?? null ) ? $attrs['htmlId'] : '';
    $known    = SNN_Layout_Blocks::attributes( $name );
    $clean    = SNN_Layout_Blocks::clean( $attrs, $name );
    $add      = function ( $key, $value, $reason ) use ( &$out, $name, $id ) {
        $out[] = array(
            'block'     => $name,
            'id'        => $id,
            'attribute' => $key,
            'value'     => is_scalar( $value ) ? (string) $value : wp_json_encode( $value ),
            'reason'    => $reason,
        );
    };
    $checks = array(
        'gap'             => array( 'SNN_Layout_Blocks', 'gap' ),
        'columnGap'       => array( 'SNN_Layout_Blocks', 'gap' ),
        'rowGap'          => array( 'SNN_Layout_Blocks', 'gap' ),
        'paddingTop'      => array( 'SNN_Layout_Blocks', 'size_value' ),
        'paddingBottom'   => array( 'SNN_Layout_Blocks', 'size_value' ),
        'maxWidth'        => array( 'SNN_Layout_Blocks', 'size_value' ),
        'backgroundColor' => array( 'SNN_Layout_Blocks', 'color' ),
        'gridColumns'     => array( 'SNN_Layout_Blocks', 'columns' ),
        'gridRows'        => array( 'SNN_Layout_Blocks', 'template' ),
        'gridAutoColumns' => array( 'SNN_Layout_Blocks', 'template' ),
        'gridAutoRows'    => array( 'SNN_Layout_Blocks', 'template' ),
        'gridAreas'       => array( 'SNN_Layout_Blocks', 'areas' ),
        'opacity'         => array( 'SNN_Layout_Blocks', 'opacity' ),
        'flexGrow'        => array( 'SNN_Layout_Blocks', 'number' ),
        'flexShrink'      => array( 'SNN_Layout_Blocks', 'number' ),
        'flexBasis'       => array( 'SNN_Layout_Blocks', 'length_or_auto' ),
        'order'           => array( 'SNN_Layout_Blocks', 'integer' ),
        'columnSpan'      => array( 'SNN_Layout_Blocks', 'span' ),
        'rowSpan'         => array( 'SNN_Layout_Blocks', 'span' ),
        'columnStart'     => array( 'SNN_Layout_Blocks', 'line' ),
        'rowStart'        => array( 'SNN_Layout_Blocks', 'line' ),
        'gridArea'        => array( 'SNN_Layout_Blocks', 'ident' ),
    );
    $judge = function ( $key, $value ) use ( $checks ) {
        if ( ! is_scalar( $value ) || '' === (string) $value || false !== strpos( (string) $value, '{' ) ) {
            return true;
        }
        if ( isset( $checks[ $key ] ) ) {
            return '' !== call_user_func( $checks[ $key ], (string) $value );
        }
        if ( isset( SNN_Style_Props::TABLE[ $key ] ) && null !== SNN_Style_Props::TABLE[ $key ][0] ) {
            $row = SNN_Style_Props::TABLE[ $key ];
            return '' !== SNN_Style_Props::check( $row[1], (string) $value, $row[2] ?? array() );
        }
        return true;
    };

    foreach ( $attrs as $key => $value ) {
        if ( in_array( $key, array( 'metadata', 'lock', 'className', 'style' ), true ) ) {
            continue;
        }
        if ( ! array_key_exists( $key, $known ) ) {
            $add( $key, $value, 'not a setting of this block' );
            continue;
        }
        if ( 'responsive' === $key ) {
            foreach ( is_array( $value ) ? $value : array() as $view => $own ) {
                if ( ! isset( SNN_Layout_Blocks::VIEW_WIDTHS[ $view ] ) ) {
                    $add( 'responsive.' . $view, $own, 'views are tablet and mobile' );
                    continue;
                }
                foreach ( is_array( $own ) ? $own : array() as $view_key => $view_value ) {
                    if ( ! isset( $clean['responsive'][ $view ][ $view_key ] ) ) {
                        $add( 'responsive.' . $view . '.' . $view_key, $view_value, 'not a per-view setting' );
                    } elseif ( ! $judge( $view_key, $view_value ) ) {
                        $add( 'responsive.' . $view . '.' . $view_key, $view_value, 'value not allowed' );
                    }
                }
            }
            continue;
        }
        if ( is_scalar( $value ) && is_scalar( $clean[ $key ] ?? null ) ) {
            if ( is_bool( $clean[ $key ] ) ) {
                continue;
            }
            if ( (string) $value !== (string) $clean[ $key ] ) {
                $add( $key, $value, 'value not allowed; ' . ( '' === (string) $clean[ $key ] ? 'nothing is written' : 'used: ' . $clean[ $key ] ) );
            } elseif ( ! $judge( $key, $value ) ) {
                $add( $key, $value, 'value not allowed; nothing is written' );
            }
            continue;
        }
        if ( is_array( $value ) && $value && empty( $clean[ $key ] ) && 'query' !== $key ) {
            $add( $key, $value, 'not a valid value; dropped' );
        } elseif ( is_array( $value ) && array_is_list( $value ) && is_array( $clean[ $key ] ?? null ) && count( $value ) > count( $clean[ $key ] ) ) {
            $add( $key, $value, ( count( $value ) - count( $clean[ $key ] ) ) . ' of ' . count( $value ) . ' items dropped' );
        }
    }
    return $out;
}

/** The input fields snn/create-post and snn/update-post share: conversion and page code. */
function snn_ability_content_properties() {
    return array(
        'convert'     => array(
            'type'        => 'boolean',
            'description' => 'Convert HTML to blocks (default true). Block markup (with <!-- wp: comments) is stored as given either way.',
            'default'     => true,
        ),
        'mode'        => array(
            'type'        => 'string',
            'enum'        => array( 'snn', 'core', 'blocks' ),
            'description' => 'snn (default): our own blocks (Section, Container, Div, Text, Image, Button, Icon, Code), editable in this site\'s editor. core: one Custom HTML block per section with core heading and paragraph blocks inside (core blocks are switched off in this editor). blocks: the older per-element core conversion.',
            'default'     => 'snn',
        ),
        'custom_css'  => array( 'type' => 'string', 'description' => 'CSS for this page only, kept apart from the design CSS. Needs unfiltered_html.' ),
        'custom_js'   => array( 'type' => 'string', 'description' => 'JavaScript for this page only (footer). Needs unfiltered_html.' ),
        'script_urls' => array( 'type' => 'array', 'items' => array( 'type' => 'string' ), 'description' => 'https script files, loaded before the page JavaScript.' ),
        'template'    => array( 'type' => 'string', 'description' => 'Page template slug, for example snn-canvas (full width, no theme header or footer). Empty string: the default template.' ),
    );
}

/**
 * Prepare the content an ability stores: convert HTML (in the chosen mode), check the code fields. Returns
 * array( markup, prepared ) or a WP_Error.
 */
function snn_ability_prepare_input( array $input ) {
    $has_code = array_key_exists( 'custom_css', $input ) || array_key_exists( 'custom_js', $input ) || array_key_exists( 'script_urls', $input );
    if ( $has_code && ! current_user_can( 'unfiltered_html' ) ) {
        return new WP_Error( 'permission_denied', 'Custom CSS, JavaScript and script files need the unfiltered_html capability.', array( 'status' => 403 ) );
    }
    if ( ! empty( $input['template'] ) && ! snn_page_template_exists( $input['template'] ) ) {
        return new WP_Error( 'invalid_template', sprintf( 'Template "%s" does not exist in the active theme.', sanitize_file_name( $input['template'] ) ), array( 'status' => 400 ) );
    }
    if ( ! isset( $input['content'] ) ) {
        return null;
    }
    $content = (string) $input['content'];
    $convert = ! isset( $input['convert'] ) || false !== $input['convert'];
    if ( false !== strpos( $content, '<!-- wp:' ) ) {
        $convert = false;
    }
    return snn_blocks_prepare_content( $content, $convert, current_user_can( 'unfiltered_html' ), (string) ( $input['mode'] ?? 'snn' ) );
}

/** Store the page code and the template of a post after its content was saved. Returns the conversion report. */
function snn_ability_store_extras( $post_id, array $input, $prepared ) {
    snn_page_code_save( $post_id, snn_ability_code_fields( $input, $prepared ) );
    $post = get_post( $post_id );
    if ( array_key_exists( 'template', $input ) && $post && 'page' === $post->post_type ) {
        if ( '' === $input['template'] ) {
            delete_post_meta( $post_id, '_wp_page_template' );
        } else {
            update_post_meta( $post_id, '_wp_page_template', sanitize_file_name( $input['template'] ) );
        }
    }
    if ( null === $prepared ) {
        return null;
    }
    $report          = snn_blocks_content_report( $prepared, $post ? $post->post_content : '' );
    $report['fonts'] = (object) ( $prepared['fonts'] ?? array() );
    if ( ! empty( $prepared['fonts'] ) ) {
        $report['warnings'][] = 'The design asks for Google Fonts (see fonts): install them with snn/install-font.';
    }
    return $report;
}

/** The schema of our blocks, for agents that write block markup (snn/get-block-schema). */
function snn_block_schema() {
    $blocks = array();
    foreach ( SNN_Layout_Blocks::definitions() as $name => $def ) {
        $attributes = array();
        foreach ( SNN_Layout_Blocks::attributes( $name ) as $key => $spec ) {
            $attributes[ $key ] = array(
                'type'    => $spec['type'],
                'default' => $spec['default'],
            );
        }
        $kind = SNN_Layout_Blocks::kind_class( $name );
        $tags = SNN_Layout_Blocks::is_text( $name ) ? SNN_Layout_Blocks::TEXT_TAGS : ( SNN_Layout_Blocks::is_image( $name ) ? SNN_Image_Block::TAGS : ( $kind ? constant( $kind . '::TAGS' ) : SNN_Layout_Blocks::TAGS ) );
        if ( SNN_Layout_Blocks::is_link( $name ) ) {
            $tags[] = 'a';
        }
        $attributes['tagName']['allowed'] = $tags;
        $blocks[ $name ] = array(
            'title'         => $def['title'],
            'inner_blocks'  => ! ( $def['text'] || ! empty( $def['image'] ) || $kind ),
            'markup'        => ( $def['text'] || ! empty( $def['image'] ) || $kind ) ? '<!-- wp:' . $name . ' {...} /-->' : '<!-- wp:' . $name . ' {...} -->inner blocks<!-- /wp:' . $name . ' -->',
            'attributes'    => $attributes,
        );
    }

    $allowed = array(
        'display'        => SNN_Layout_Blocks::DISPLAYS,
        'flexDirection'  => SNN_Layout_Blocks::FLEX_DIRECTION,
        'flexWrap'       => SNN_Layout_Blocks::FLEX_WRAP,
        'justifyContent' => SNN_Layout_Blocks::JUSTIFY,
        'alignItems'     => SNN_Layout_Blocks::ALIGN,
        'alignContent'   => SNN_Layout_Blocks::ALIGN_CONTENT,
        'justifyItems'   => SNN_Layout_Blocks::JUSTIFY_ITEMS,
        'gridAutoFlow'   => SNN_Layout_Blocks::GRID_FLOW,
        'alignSelf'      => SNN_Layout_Blocks::ALIGN_SELF,
        'justifySelf'    => SNN_Layout_Blocks::JUSTIFY_SELF,
        'overflow'       => SNN_Layout_Blocks::OVERFLOW,
        'iconPosition'   => SNN_Button_Block::ICON_POSITION,
        'objectFit'      => SNN_Image_Block::OBJECT_FIT,
        'captionType'    => SNN_Image_Block::CAPTION,
        'loading'        => SNN_Image_Block::LOADING,
        'linkTo'         => SNN_Image_Block::LINK,
    );
    $style = array();
    foreach ( SNN_Style_Props::TABLE as $key => $row ) {
        $style[ $key ] = array_filter(
            array(
                'css'     => $row[0],
                'type'    => $row[1],
                'options' => $row[2] ?? null,
            ),
            function ( $v ) {
                return null !== $v;
            }
        );
    }

    return array(
        'blocks'       => $blocks,
        'allowed'      => $allowed,
        'style_props'  => $style,
        'values'       => array(
            'length'   => 'A CSS length: 16px, 1.5rem, 50%, 0, calc(...), clamp(...), or a variable var(--name). A bare number is px.',
            'color'    => 'A hex colour, rgb(), rgba(), hsl(), hsla(), transparent, or a variable var(--name).',
            'opacity'  => '0 to 100 (percent).',
            'gridColumns' => '1 to 12 (that many equal columns) or a track template such as 1fr 2fr or repeat(auto-fill, minmax(240px, 1fr)).',
            'dynamic'  => 'Text and most values take dynamic tags such as {post_title}; they are filled in when the page renders.',
        ),
        'responsive'   => array(
            'format' => 'responsive = { "tablet": { key: value }, "mobile": { key: value } }. A view without a value uses the view above it, then Desktop (the plain attribute).',
            'views'  => SNN_Layout_Blocks::VIEW_WIDTHS,
            'keys'   => array_values( array_merge( SNN_Layout_Blocks::VIEW_KEYS, SNN_Style_Props::keys() ) ),
        ),
        'icons'        => array(
            'format'    => 'icon = { "library": "fontawesome-solid", "name": "fa-star" } for a font icon, or { "library": "svg", "svg": "<svg ...>...</svg>" }.',
            'libraries' => array(
                'fontawesome-solid'   => 'Font Awesome 6 Free Solid, names such as fa-star, fa-arrow-right',
                'fontawesome-regular' => 'Font Awesome 6 Free Regular, names such as fa-heart',
                'fontawesome-brands'  => 'Font Awesome 6 Free Brands, names such as fa-github',
                'ionicons'            => 'Ionicons 4, names such as ion-ios-add, ion-md-heart',
                'themify'             => 'Themify, names such as ti-star, ti-home',
                'svg'                 => 'An inline SVG (svg) or an SVG from the media library (svgId)',
            ),
            'names_url' => SNN_URL . 'includes/block/assets/icons/icon-lists.json',
        ),
        'rules'        => array(
            'Section is a part of the page; Container is the box inside a section; Div is any other box. Each holds inner blocks.',
            'Text holds a rich text (content): inline HTML such as strong, em, a, span with a class, br. Its tag is p, h1-h6, div or span.',
            'Button: text, an optional icon, and a link (linkUrl). With linkUrl it is an a; without, its tag (span, button, div).',
            'Div and Container can be a link: tagName "a" with linkUrl (a whole card as one link).',
            'Image: imageUrl (or imageId for the media library) and imageAlt.',
            'Code: any HTML, CSS and JavaScript, printed as written (noWrapper: true prints it without an element around it). Needs unfiltered_html.',
            'Every block has htmlId (its CSS ID) and cssClasses (space-separated classes). Other attributes go in customAttributes: [{ "name": "data-x", "value": "1" }].',
            'A Button with the class snn-plain has no starting look (black with white text): the page CSS draws it.',
            'Blocks with inner blocks save only their inner blocks between the comments. The others are self-closing comments.',
        ),
    );
}
