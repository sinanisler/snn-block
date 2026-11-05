<?php
/**
 * Fonts for the blocks: download Google Fonts (open licences) and store the files on this
 * site, in WordPress's font directory (wp_get_font_dir()). A stored font works offline: the
 * page loads it from this site, not from Google.
 *
 * These helpers are used by the global styles (includes/blocks/global-styles.php) and by the
 * MCP font ability (includes/ai/fonts/font-library.php). They were moved here from the AI font
 * library, so they load whether or not the AI features are on.
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


function snn_font_extension( $bytes ) {
    return snn_font_format( $bytes ) === 'woff2' ? 'woff2' : ( snn_font_format( $bytes ) === 'woff' ? 'woff' : 'ttf' );
}
