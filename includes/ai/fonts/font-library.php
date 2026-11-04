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

const SNN_FONT_MAX_BYTES = 5242880; // 5 MB per font file.

/** Browser user agent. Google Fonts serves WOFF2 only to browsers it knows. */
const SNN_FONT_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';

/**
 * Faces of a Google Fonts family for the given weights, styles and subsets.
 *
 * @return array|WP_Error List of { weight, style, subset, url, unicode_range }.
 */
function snn_font_google_faces( $family, array $weights, array $styles, array $subsets ) {
    $axis = array();
    foreach ( $weights as $weight ) {
        $weight = (string) $weight;
        if ( ! preg_match( '/^[1-9]00$/', $weight ) ) {
            return new WP_Error( 'invalid_weight', sprintf( 'Weight "%s" is not a number from 100 to 900 in steps of 100.', $weight ) );
        }
        $axis[] = $weight;
    }
    $axis = array_values( array_unique( $axis ) );
    sort( $axis );

    $spec = str_replace( ' ', '+', $family ) . ':' . ( in_array( 'italic', $styles, true ) ? 'ital,wght@' : 'wght@' );
    $parts = array();
    foreach ( $styles as $style ) {
        foreach ( $axis as $weight ) {
            $parts[] = ( 'italic' === $style ? '1,' : ( in_array( 'italic', $styles, true ) ? '0,' : '' ) ) . $weight;
        }
    }
    $url = 'https://fonts.googleapis.com/css2?family=' . $spec . implode( ';', $parts ) . '&display=swap';

    $response = wp_remote_get( $url, array( 'timeout' => 20, 'user-agent' => SNN_FONT_UA ) );
    if ( is_wp_error( $response ) ) {
        return $response;
    }
    if ( 200 !== wp_remote_retrieve_response_code( $response ) ) {
        return new WP_Error( 'google_fonts_error', sprintf( 'Google Fonts answered %d for "%s". Check the family name and weights.', wp_remote_retrieve_response_code( $response ), $family ) );
    }
    $css = wp_remote_retrieve_body( $response );

    $faces = array();
    if ( ! preg_match_all( '#/\*\s*([a-z0-9-]+)\s*\*/\s*@font-face\s*\{(.*?)\}#s', $css, $blocks, PREG_SET_ORDER ) ) {
        return new WP_Error( 'google_fonts_empty', sprintf( 'Google Fonts sent no font faces for "%s".', $family ) );
    }
    foreach ( $blocks as $block ) {
        $subset = $block[1];
        if ( $subsets && ! in_array( $subset, $subsets, true ) ) {
            continue;
        }
        $body = $block[2];
        if ( ! preg_match( '#font-weight:\s*(\d+)#', $body, $w ) || ! preg_match( '#font-style:\s*(\w+)#', $body, $s ) || ! preg_match( '#url\((https://[^)]+\.woff2)\)#', $body, $u ) ) {
            continue;
        }
        $range = preg_match( '#unicode-range:\s*([^;]+);#', $body, $r ) ? trim( $r[1] ) : '';
        $faces[] = array(
            'weight'        => $w[1],
            'style'         => $s[1],
            'subset'        => $subset,
            'url'           => $u[1],
            'unicode_range' => $range,
        );
    }
    return $faces;
}

/** Bytes of a font file from an https URL, checked for size and a font signature. */
function snn_font_download( $url ) {
    if ( ! preg_match( '#^https://#i', $url ) ) {
        return new WP_Error( 'invalid_url', 'Font URLs must start with https://.' );
    }
    $response = wp_remote_get( $url, array( 'timeout' => 30, 'user-agent' => SNN_FONT_UA, 'limit_response_size' => SNN_FONT_MAX_BYTES ) );
    if ( is_wp_error( $response ) ) {
        return $response;
    }
    if ( 200 !== wp_remote_retrieve_response_code( $response ) ) {
        return new WP_Error( 'download_failed', sprintf( 'Could not download %s (HTTP %d).', $url, wp_remote_retrieve_response_code( $response ) ) );
    }
    return snn_font_check_bytes( wp_remote_retrieve_body( $response ) );
}

/** The same bytes, when they are a font file (WOFF2, WOFF, TrueType or OpenType). */
function snn_font_check_bytes( $bytes ) {
    $bytes = (string) $bytes;
    if ( '' === $bytes || strlen( $bytes ) > SNN_FONT_MAX_BYTES ) {
        return new WP_Error( 'font_size', 'The font file is empty or larger than 5 MB.' );
    }
    $magic = substr( $bytes, 0, 4 );
    if ( ! in_array( $magic, array( 'wOF2', 'wOFF', "\x00\x01\x00\x00", 'true', 'OTTO' ), true ) ) {
        return new WP_Error( 'font_type', 'The file is not a WOFF2, WOFF, TrueType or OpenType font.' );
    }
    return $bytes;
}

/** Format of a font file from its signature. */
function snn_font_format( $bytes ) {
    $magic = substr( (string) $bytes, 0, 4 );
    return array(
        'wOF2' => 'woff2',
        'wOFF' => 'woff',
        'OTTO' => 'opentype',
    )[ $magic ] ?? 'truetype';
}

/**
 * Write font bytes into WordPress's font directory.
 *
 * @return string|WP_Error URL of the stored file.
 */
function snn_font_store( $bytes, $filename ) {
    if ( ! function_exists( '_wp_filter_font_directory' ) ) {
        return new WP_Error( 'fonts_unavailable', 'This WordPress version has no font directory.' );
    }
    // Font types are allowed only while the font directory is in use, as in core's own font upload.
    add_filter( 'upload_dir', '_wp_filter_font_directory' );
    add_filter( 'upload_mimes', array( 'WP_Font_Utils', 'get_allowed_font_mime_types' ) );
    $upload = wp_upload_bits( sanitize_file_name( $filename ), null, $bytes );
    remove_filter( 'upload_mimes', array( 'WP_Font_Utils', 'get_allowed_font_mime_types' ) );
    remove_filter( 'upload_dir', '_wp_filter_font_directory' );

    if ( ! empty( $upload['error'] ) ) {
        return new WP_Error( 'font_store_failed', (string) $upload['error'] );
    }
    return (string) $upload['url'];
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

function snn_font_extension( $bytes ) {
    return snn_font_format( $bytes ) === 'woff2' ? 'woff2' : ( snn_font_format( $bytes ) === 'woff' ? 'woff' : 'ttf' );
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
