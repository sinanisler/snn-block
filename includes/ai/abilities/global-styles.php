<?php
/**
 * Global Styles Abilities
 * Registers snn/get-global-styles and snn/update-global-styles: the site's theme.json
 * customizations (palette, typography, spacing, styles) and the Additional CSS.
 */

add_action( 'wp_abilities_api_init', 'snn_register_global_styles_abilities' );
function snn_register_global_styles_abilities() {
    wp_register_ability(
        'snn/get-global-styles',
        array(
            'label'       => __( 'Get Global Styles', 'snn' ),
            'description' => __( 'Returns the site-wide style customizations: the user settings and styles (theme.json), the installed font families, the palette colors, and the Additional CSS. Read it before changing global styles with snn/update-global-styles.', 'snn' ),
            'category'    => 'content',
            'input_schema' => array(
                'type'       => 'object',
                'properties' => new stdClass(),
            ),
            'output_schema' => array(
                'type'       => 'object',
                'properties' => array(
                    'settings'    => array( 'type' => 'object' ),
                    'styles'      => array( 'type' => 'object' ),
                    'custom_css'  => array( 'type' => 'string' ),
                    'font_families' => array( 'type' => 'array' ),
                ),
            ),
            'execute_callback' => function( $input ) {
                $data = snn_global_styles_read();
                $fonts = array();
                foreach ( $data['settings']['typography']['fontFamilies']['custom'] ?? array() as $entry ) {
                    $fonts[] = array( 'name' => $entry['name'] ?? '', 'slug' => $entry['slug'] ?? '', 'faces' => count( $entry['fontFace'] ?? array() ) );
                }
                return array(
                    'settings'      => (object) $data['settings'],
                    'styles'        => (object) $data['styles'],
                    'custom_css'    => (string) wp_get_custom_css(),
                    'font_families' => $fonts,
                );
            },
            'permission_callback' => function() {
                return current_user_can( 'edit_theme_options' );
            },
            'meta' => array(
                'show_in_rest' => true,
                'readonly'     => true,
                'destructive'  => false,
                'idempotent'   => true,
            ),
        )
    );

    wp_register_ability(
        'snn/update-global-styles',
        array(
            'label'       => __( 'Update Global Styles', 'snn' ),
            'description' => __( 'Changes the site-wide styles. settings and styles are merged into the user theme.json: objects merge key by key, lists and values are replaced. custom_css replaces the Additional CSS (site-wide CSS). remove_fonts takes font slugs to remove from the editor palette. Call snn/get-global-styles first to see the current values. Example settings: {"color":{"palette":[{"slug":"ink","color":"#06060a","name":"Ink"}]}}, {"typography":{"fontFamilies":{"custom":[...]}}}, {"spacing":{"blockGap":"24px"}}.', 'snn' ),
            'category'    => 'content',
            'input_schema' => array(
                'type'       => 'object',
                'properties' => array(
                    'settings'    => array( 'type' => 'object', 'description' => 'theme.json settings to merge (color, typography, spacing, layout, ...).' ),
                    'styles'      => array( 'type' => 'object', 'description' => 'theme.json styles to merge (color, typography, elements, blocks, ...).' ),
                    'custom_css'  => array( 'type' => 'string', 'description' => 'Site-wide CSS (Additional CSS). Replaces the current value.' ),
                    'remove_fonts' => array( 'type' => 'array', 'items' => array( 'type' => 'string' ), 'description' => 'Font slugs to remove from the editor palette.' ),
                ),
            ),
            'output_schema' => array(
                'type'       => 'object',
                'properties' => array(
                    'updated'    => array( 'type' => 'boolean' ),
                    'custom_css' => array( 'type' => 'boolean' ),
                ),
            ),
            'execute_callback' => function( $input ) {
                $data = snn_global_styles_read();

                if ( isset( $input['settings'] ) && is_array( $input['settings'] ) ) {
                    $data['settings'] = snn_global_styles_merge( $data['settings'], $input['settings'] );
                }
                if ( isset( $input['styles'] ) && is_array( $input['styles'] ) ) {
                    $data['styles'] = snn_global_styles_merge( $data['styles'], $input['styles'] );
                }
                if ( ! empty( $input['remove_fonts'] ) ) {
                    $remove = array_map( 'sanitize_title', (array) $input['remove_fonts'] );
                    $list   = $data['settings']['typography']['fontFamilies']['custom'] ?? array();
                    $data['settings']['typography']['fontFamilies']['custom'] = array_values( array_filter( (array) $list, function ( $entry ) use ( $remove ) {
                        return ! in_array( $entry['slug'] ?? '', $remove, true );
                    } ) );
                }

                $saved = snn_global_styles_write( $data );
                if ( is_wp_error( $saved ) ) {
                    return $saved;
                }

                $css_saved = false;
                if ( isset( $input['custom_css'] ) ) {
                    $result    = wp_update_custom_css_post( (string) $input['custom_css'] );
                    $css_saved = ! is_wp_error( $result );
                }

                return array(
                    'updated'    => true,
                    'custom_css' => $css_saved,
                );
            },
            'permission_callback' => function() {
                return current_user_can( 'edit_theme_options' );
            },
            'meta' => array(
                'show_in_rest' => true,
                'readonly'     => false,
                'destructive'  => false,
                'idempotent'   => true,
            ),
        )
    );
}

/**
 * Merge theme.json fragments: objects merge key by key, anything else is replaced.
 * A list (a numeric array) is replaced as a whole.
 */
function snn_global_styles_merge( array $current, array $patch ) {
    foreach ( $patch as $key => $value ) {
        if ( is_array( $value ) && isset( $current[ $key ] ) && is_array( $current[ $key ] ) && ! array_is_list( $value ) && ! array_is_list( $current[ $key ] ) ) {
            $current[ $key ] = snn_global_styles_merge( $current[ $key ], $value );
        } else {
            $current[ $key ] = $value;
        }
    }
    return $current;
}
