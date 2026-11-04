<?php
/**
 * Install Font Ability
 * Registers snn/install-font: installs a font family for the block editor and the front end.
 */

add_action( 'wp_abilities_api_init', 'snn_register_install_font_ability' );
function snn_register_install_font_ability() {
    wp_register_ability(
        'snn/install-font',
        array(
            'label'       => __( 'Install Font', 'snn' ),
            'description' => __( 'Installs a font family on this site, self-hosted. source "google" downloads the family from Google Fonts for the given weights, styles and subsets (for example Syne with weights 600, 700, 800). source "files" installs font files sent as base64 or https URLs (WOFF2, WOFF, TTF or OTF), with the weight and style each file is. The family then appears in Appearance > Editor > Typography, and its font faces are printed on the front end. Set add_to_palette to false to keep it out of the editor palette.', 'snn' ),
            'category'    => 'content',
            'input_schema' => array(
                'type'       => 'object',
                'required'   => array( 'family' ),
                'properties' => array(
                    'family'  => array( 'type' => 'string', 'description' => 'Font family name, for example Syne or Inter.' ),
                    'source'  => array( 'type' => 'string', 'enum' => array( 'google', 'files' ), 'default' => 'google' ),
                    'weights' => array( 'type' => 'array', 'items' => array( 'type' => 'string' ), 'description' => 'google: weights to download, 100 to 900 (default ["400"]).' ),
                    'styles'  => array( 'type' => 'array', 'items' => array( 'type' => 'string', 'enum' => array( 'normal', 'italic' ) ), 'description' => 'google: styles to download (default ["normal"]).' ),
                    'subsets' => array( 'type' => 'array', 'items' => array( 'type' => 'string' ), 'description' => 'google: Google Fonts subsets to keep (default ["latin"]). Use [] to keep all subsets.' ),
                    'files'   => array(
                        'type'        => 'array',
                        'description' => 'files: font files. Each has base64 or url, and weight (string), style (normal or italic), unicode_range (optional).',
                        'items'       => array(
                            'type'       => 'object',
                            'properties' => array(
                                'base64'        => array( 'type' => 'string' ),
                                'url'           => array( 'type' => 'string' ),
                                'weight'        => array( 'type' => 'string' ),
                                'style'         => array( 'type' => 'string', 'enum' => array( 'normal', 'italic' ) ),
                                'unicode_range' => array( 'type' => 'string' ),
                            ),
                        ),
                    ),
                    'add_to_palette' => array( 'type' => 'boolean', 'default' => true, 'description' => 'Add the family to the editor font palette (default true).' ),
                ),
            ),
            'output_schema' => array(
                'type'       => 'object',
                'properties' => array(
                    'family'         => array( 'type' => 'string' ),
                    'slug'           => array( 'type' => 'string' ),
                    'font_family_id' => array( 'type' => 'integer' ),
                    'faces'          => array( 'type' => 'array' ),
                    'palette'        => array( 'type' => 'boolean' ),
                ),
            ),
            'execute_callback' => function( $input ) {
                $family = sanitize_text_field( (string) $input['family'] );
                $source = $input['source'] ?? 'google';
                $faces  = array();

                if ( 'google' === $source ) {
                    $weights = array_map( 'strval', (array) ( $input['weights'] ?? array( '400' ) ) );
                    $styles  = (array) ( $input['styles'] ?? array( 'normal' ) );
                    $subsets = (array) ( $input['subsets'] ?? array( 'latin' ) );

                    $list = snn_font_google_faces( $family, $weights, $styles, $subsets );
                    if ( is_wp_error( $list ) ) {
                        return $list;
                    }
                    if ( empty( $list ) ) {
                        return new WP_Error( 'no_faces', sprintf( 'Google Fonts has no faces of "%s" for these weights, styles and subsets.', $family ) );
                    }
                    foreach ( $list as $face ) {
                        $bytes = snn_font_download( $face['url'] );
                        if ( is_wp_error( $bytes ) ) {
                            return $bytes;
                        }
                        $faces[] = array(
                            'bytes'         => $bytes,
                            'weight'        => $face['weight'],
                            'style'         => $face['style'],
                            'unicode_range' => $face['unicode_range'],
                            'label'         => $face['subset'],
                        );
                    }
                } else {
                    foreach ( (array) ( $input['files'] ?? array() ) as $index => $file ) {
                        if ( ! empty( $file['base64'] ) ) {
                            $raw = preg_replace( '#^data:[^,]*,#', '', (string) $file['base64'] );
                            if ( strlen( $raw ) > 7 * 1024 * 1024 ) {
                                return new WP_Error( 'font_size', sprintf( 'File %d is larger than 5 MB.', $index + 1 ) );
                            }
                            $bytes = base64_decode( $raw, true );
                            $bytes = false === $bytes ? new WP_Error( 'font_base64', sprintf( 'File %d is not valid base64.', $index + 1 ) ) : snn_font_check_bytes( $bytes );
                        } elseif ( ! empty( $file['url'] ) ) {
                            $bytes = snn_font_download( (string) $file['url'] );
                        } else {
                            $bytes = new WP_Error( 'font_source', sprintf( 'File %d needs base64 or url.', $index + 1 ) );
                        }
                        if ( is_wp_error( $bytes ) ) {
                            return $bytes;
                        }
                        $faces[] = array(
                            'bytes'         => $bytes,
                            'weight'        => (string) ( $file['weight'] ?? '400' ),
                            'style'         => (string) ( $file['style'] ?? 'normal' ),
                            'unicode_range' => (string) ( $file['unicode_range'] ?? '' ),
                            'label'         => 'file' . ( $index + 1 ),
                        );
                    }
                }

                if ( empty( $faces ) ) {
                    return new WP_Error( 'no_faces', 'No font files to install.' );
                }

                return snn_font_install( $family, $faces, (bool) ( $input['add_to_palette'] ?? true ) );
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
