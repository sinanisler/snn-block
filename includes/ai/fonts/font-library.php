<?php
/**
 * Font installing for the block editor, and the global styles that use it.
 *
 * A font is installed in three places, the same ones WordPress uses itself:
 *  1. the font files, in uploads/fonts (WordPress's font directory);
 *  2. the Font Library records (wp_font_family and wp_font_face posts), which is what
 *     Appearance > Editor > Typography > Manage fonts lists;
 *  3. the global styles palette (settings.typography.fontFamilies.custom, with a
 *     fontFace list), which makes the font choosable in the editor and prints the
 *     @font-face rules on the front end.
 *
 * Files come from Google Fonts (the css2 API, one subset at a time), from https URLs,
 * or from base64 data sent by the client.
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

/**
 * Install one font family: files, Font Library records and, optionally, the palette entry.
 *
 * @param string $family  Family name, for example Syne.
 * @param array  $faces   List of { bytes, weight, style, unicode_range, label }.
 * @param bool   $palette Add the family to the global styles palette.
 * @return array|WP_Error { family, slug, font_family_id, faces, palette }
 */
function snn_font_install( $family, array $faces, $palette = true ) {
    $family = trim( preg_replace( '/\s+/', ' ', (string) $family ) );
    $slug   = sanitize_title( $family );
    if ( '' === $slug ) {
        return new WP_Error( 'invalid_family', 'The family name is empty.' );
    }
    $stack = '"' . str_replace( '"', '', $family ) . '", sans-serif';

    $stored = array();
    foreach ( $faces as $face ) {
        $url = snn_font_store( $face['bytes'], $slug . '-' . $face['weight'] . '-' . $face['style'] . '-' . ( $face['label'] ?? 'all' ) . '.' . snn_font_extension( $face['bytes'] ) );
        if ( is_wp_error( $url ) ) {
            return $url;
        }
        $settings = array(
            'fontFamily'  => $family,
            'fontStyle'   => $face['style'],
            'fontWeight'  => (string) $face['weight'],
            'fontDisplay' => 'swap',
            'src'         => array( $url ),
        );
        if ( ! empty( $face['unicode_range'] ) ) {
            $settings['unicodeRange'] = $face['unicode_range'];
        }
        $stored[] = $settings;
    }

    $family_id = snn_font_library_family( $family, $slug, $stack );
    if ( is_wp_error( $family_id ) ) {
        return $family_id;
    }
    foreach ( $stored as $settings ) {
        $result = snn_font_library_face( $family_id, $settings );
        if ( is_wp_error( $result ) ) {
            return $result;
        }
    }

    if ( $palette ) {
        snn_global_styles_upsert_font( $family, $slug, $stack, $stored );
    }

    return array(
        'family'         => $family,
        'slug'           => $slug,
        'font_family_id' => (int) $family_id,
        'faces'          => array_map( function ( $s ) {
            return array( 'weight' => $s['fontWeight'], 'style' => $s['fontStyle'], 'url' => $s['src'][0] );
        }, $stored ),
        'palette'        => (bool) $palette,
    );
}

/** The Font Library family post for a slug, created when missing. */
function snn_font_library_family( $family, $slug, $stack ) {
    $existing = get_posts( array(
        'post_type'      => 'wp_font_family',
        'name'           => $slug,
        'post_status'    => 'publish',
        'posts_per_page' => 1,
        'fields'         => 'ids',
    ) );
    $content = wp_json_encode( array( 'fontFamily' => $stack ) );
    if ( $existing ) {
        // Refresh the stored settings, so a family written earlier with bad data is repaired.
        $id = (int) $existing[0];
        wp_update_post( wp_slash( array( 'ID' => $id, 'post_content' => $content ) ), true );
        return $id;
    }
    return wp_insert_post( wp_slash( array(
        'post_type'    => 'wp_font_family',
        'post_status'  => 'publish',
        'post_title'   => $family,
        'post_name'    => $slug,
        'post_content' => $content,
    ) ), true );
}

/** A Font Library face post under the family, unless the same face exists. */
function snn_font_library_face( $family_id, array $settings ) {
    $title = WP_Font_Utils::get_font_face_slug( $settings );
    $dupes = get_posts( array(
        'post_type'      => 'wp_font_face',
        'post_parent'    => $family_id,
        'title'          => $title,
        'post_status'    => 'publish',
        'posts_per_page' => 1,
        'fields'         => 'ids',
    ) );
    if ( $dupes ) {
        return (int) $dupes[0];
    }
    return wp_insert_post( wp_slash( array(
        'post_type'    => 'wp_font_face',
        'post_parent'  => $family_id,
        'post_status'  => 'publish',
        'post_title'   => $title,
        'post_name'    => sanitize_title( $title ),
        'post_content' => wp_json_encode( $settings ),
    ) ), true );
}

/* ----------------------------------------------------------------------
 * Global styles (the user's theme.json, stored in the wp_global_styles post)
 * ------------------------------------------------------------------- */

/** ID of the user's global styles post for the active theme, creating it when missing. */
function snn_global_styles_post_id() {
    $id = (int) WP_Theme_JSON_Resolver::get_user_global_styles_post_id();
    if ( $id ) {
        return $id;
    }
    $id = wp_insert_post( wp_slash( array(
        'post_type'    => 'wp_global_styles',
        'post_status'  => 'publish',
        'post_title'   => __( 'Custom Styles', 'snn' ),
        'post_name'    => get_stylesheet(),
        'post_content' => wp_json_encode( array( 'version' => 3, 'isGlobalStylesUserThemeJSON' => true, 'settings' => new stdClass(), 'styles' => new stdClass() ) ),
    ) ), true );
    return is_wp_error( $id ) ? 0 : (int) $id;
}

/** The user's global styles as an array: version, settings, styles. */
function snn_global_styles_read() {
    $post = get_post( snn_global_styles_post_id() );
    $data = $post ? json_decode( (string) $post->post_content, true ) : null;
    if ( ! is_array( $data ) ) {
        $data = array( 'version' => 3, 'isGlobalStylesUserThemeJSON' => true );
    }
    $data['settings'] = is_array( $data['settings'] ?? null ) ? $data['settings'] : array();
    $data['styles']   = is_array( $data['styles'] ?? null ) ? $data['styles'] : array();
    return $data;
}

/** Save the user's global styles array. Returns the post ID or WP_Error. */
function snn_global_styles_write( array $data ) {
    $id = snn_global_styles_post_id();
    if ( ! $id ) {
        return new WP_Error( 'global_styles_unavailable', 'The global styles post could not be created.' );
    }
    $data['version'] = 3;
    $data['isGlobalStylesUserThemeJSON'] = true;
    $result = wp_update_post( wp_slash( array(
        'ID'           => $id,
        'post_content' => wp_json_encode( $data, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE ),
    ) ), true );
    WP_Theme_JSON_Resolver::clean_cached_data();
    return is_wp_error( $result ) ? $result : (int) $id;
}

/** Add or replace one font family in the palette (settings.typography.fontFamilies.custom). */
function snn_global_styles_upsert_font( $family, $slug, $stack, array $faces ) {
    $data = snn_global_styles_read();
    $list = $data['settings']['typography']['fontFamilies']['custom'] ?? array();

    // Faces already in the palette for this family are kept; a face with the same weight, style and range is replaced.
    $kept = array();
    foreach ( (array) $list as $entry ) {
        if ( ( $entry['slug'] ?? '' ) === $slug ) {
            $kept = (array) ( $entry['fontFace'] ?? array() );
        }
    }
    $key = function ( $face ) {
        return ( $face['fontWeight'] ?? '' ) . '|' . ( $face['fontStyle'] ?? '' ) . '|' . ( $face['unicodeRange'] ?? '' );
    };
    $merged = array();
    foreach ( $kept as $face ) {
        $merged[ $key( $face ) ] = $face;
    }
    foreach ( $faces as $face ) {
        $merged[ $key( $face ) ] = $face;
    }

    $list = array_values( array_filter( (array) $list, function ( $entry ) use ( $slug ) {
        return ( $entry['slug'] ?? '' ) !== $slug;
    } ) );
    $list[] = array(
        'fontFamily' => $stack,
        'name'       => $family,
        'slug'       => $slug,
        'fontFace'   => array_values( $merged ),
    );
    $data['settings']['typography']['fontFamilies']['custom'] = $list;
    return snn_global_styles_write( $data );
}
