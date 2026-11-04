<?php
/**
 * Page-level custom code: CSS, JavaScript and script files for one post or page.
 *
 * What is stored per post (post meta, never in the content):
 *  - _snn_html_css   CSS that came with an HTML design (its <style> blocks and the
 *                    generated classes for inline styles). Replaced on each conversion.
 *  - _snn_page_css   CSS written on purpose (custom_css).
 *  - _snn_page_js    JavaScript (custom_js, plus inline scripts of a design).
 *  - _snn_page_scripts  https URLs of script files, loaded before _snn_page_js.
 *
 * Output: on the front end of that post only. CSS goes in the head after the theme
 * styles; scripts and JavaScript go in the footer, in that order.
 *
 * Saving CSS, JavaScript or script files needs unfiltered_html (administrators have
 * it). Without it the content is passed through wp_kses_post and no code is kept.
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

/**
 * Prepare content for storage from HTML or block markup.
 *
 * @param string $content    HTML design or block markup.
 * @param bool   $convert    Convert HTML to block markup (default true in the abilities).
 * @param bool   $allow_code Whether the user may store scripts (unfiltered_html).
 * @return array { markup, css, scripts: { src, inline }, fonts, report }
 */
function snn_blocks_prepare_content( $content, $convert, $allow_code ) {
    $content = (string) $content;

    if ( $convert ) {
        $result = SNN_HTML_To_Blocks::convert( $content, array( 'allow_code' => $allow_code ) );
    } else {
        $result = array(
            'markup'  => $content,
            'css'     => '',
            'scripts' => array( 'src' => array(), 'inline' => '' ),
            'fonts'   => array(),
            'report'  => array( 'blocks' => array(), 'html_fallbacks' => 0, 'dropped_attributes' => 0, 'warnings' => array() ),
        );
    }

    if ( ! $allow_code ) {
        $result['markup'] = wp_kses_post( $result['markup'] );
    }

    return $result;
}

/**
 * Store page code for a post. Keys that are not in $fields stay as they are;
 * an empty value removes the stored code.
 *
 * @param int   $post_id
 * @param array $fields  html_css (string), css (string), js (string), scripts (list of https URLs).
 */
function snn_page_code_save( $post_id, array $fields ) {
    $map = array(
        'html_css' => '_snn_html_css',
        'css'      => '_snn_page_css',
        'js'       => '_snn_page_js',
        'scripts'  => '_snn_page_scripts',
    );
    foreach ( $map as $key => $meta_key ) {
        if ( ! array_key_exists( $key, $fields ) ) {
            continue;
        }
        $value = $fields[ $key ];
        if ( '' === $value || array() === $value || null === $value ) {
            delete_post_meta( $post_id, $meta_key );
        } else {
            // WordPress expects slashed data here (it strips one level of slashes), so the code survives intact.
            update_post_meta( $post_id, $meta_key, wp_slash( $value ) );
        }
    }
}

/**
 * Page code fields for snn_page_code_save(), from an ability's input.
 *
 * When content is given, the design's CSS and scripts replace the stored ones.
 * custom_css, custom_js and script_urls replace their stored values when given.
 *
 * @param array      $input    The ability input.
 * @param array|null $prepared Result of snn_blocks_prepare_content(), or null when no content was sent.
 */
function snn_ability_code_fields( array $input, $prepared = null ) {
    $fields = array();
    $js     = array();
    $src    = array();

    if ( null !== $prepared ) {
        $fields['html_css'] = (string) ( $prepared['css'] ?? '' );
        if ( ! empty( $prepared['scripts']['inline'] ) ) {
            $js[] = (string) $prepared['scripts']['inline'];
        }
        $src = array_merge( $src, (array) ( $prepared['scripts']['src'] ?? array() ) );
    }
    if ( array_key_exists( 'custom_css', $input ) ) {
        $fields['css'] = (string) $input['custom_css'];
    }
    if ( array_key_exists( 'custom_js', $input ) ) {
        $js[] = (string) $input['custom_js'];
    }
    if ( array_key_exists( 'script_urls', $input ) ) {
        $src = array_merge( $src, (array) $input['script_urls'] );
    }

    if ( null !== $prepared || array_key_exists( 'custom_js', $input ) ) {
        $fields['js'] = implode( "\n;\n", array_filter( array_map( 'trim', $js ) ) );
    }
    if ( null !== $prepared || array_key_exists( 'script_urls', $input ) ) {
        $fields['scripts'] = snn_page_code_clean_scripts( $src );
    }
    return $fields;
}

/** Whether a page template file exists in the active theme (or its parent). */
function snn_page_template_exists( $slug ) {
    $slug = sanitize_file_name( (string) $slug );
    if ( '' === $slug ) {
        return false;
    }
    return file_exists( get_stylesheet_directory() . '/templates/' . $slug . '.html' )
        || file_exists( get_template_directory() . '/templates/' . $slug . '.html' );
}

/** Validated list of script URLs: https only. */
function snn_page_code_clean_scripts( $urls ) {
    $out = array();
    foreach ( (array) $urls as $url ) {
        $url = esc_url_raw( trim( (string) $url ), array( 'https' ) );
        if ( '' !== $url ) {
            $out[] = $url;
        }
    }
    return array_values( array_unique( $out ) );
}

/** Code for a post, as it is printed on the front end. */
function snn_page_code_for_post( $post_id ) {
    $scripts = get_post_meta( $post_id, '_snn_page_scripts', true );
    return array(
        'css'     => trim( (string) get_post_meta( $post_id, '_snn_html_css', true ) . "\n" . (string) get_post_meta( $post_id, '_snn_page_css', true ) ),
        'js'      => trim( (string) get_post_meta( $post_id, '_snn_page_js', true ) ),
        'scripts' => is_array( $scripts ) ? $scripts : array(),
    );
}

/**
 * Layout reset for the snn-canvas template: removes the theme's spacing, width and
 * text wrapping from the content, so a design's own CSS decides the layout.
 * It is printed before the page's CSS, so the design's rules win on equal specificity.
 */
function snn_page_code_canvas_reset() {
    return '.wp-site-blocks,.wp-block-post-content{padding:0!important;margin:0!important;max-width:none!important;width:100%!important}'
        . '.wp-block-post-content>*{max-width:none;margin-inline:0;margin-block-start:0;margin-block-end:0}'
        . '.wp-block-group.is-layout-flow>*+*,.wp-block-group.is-layout-constrained>*+*,.wp-block-post-content>*+*{margin-block-start:0}'
        . '.wp-block-group,.wp-block-buttons,.wp-block-list,.wp-block-quote,.wp-block-details,.wp-block-table,.wp-block-image,.wp-block-code,.wp-block-paragraph,.wp-block-heading,.wp-block-separator{max-width:none;margin-block:0}'
        . '.wp-block-post-content :is(h1,h2,h3,h4,h5,h6){color:inherit}'
        . '.wp-block-post-content a{color:inherit}'
        . '.wp-block-paragraph,.wp-block-heading,.wp-block-list-item{text-wrap:wrap}'
        . 'body{color:inherit;background:inherit}';
}

add_action( 'wp_head', 'snn_page_code_print_head', 99 );
function snn_page_code_print_head() {
    if ( ! is_singular() ) {
        return;
    }
    $id   = get_queried_object_id();
    $code = snn_page_code_for_post( $id );
    $css  = $code['css'];
    if ( 'snn-canvas' === get_page_template_slug( $id ) ) {
        $css = snn_page_code_canvas_reset() . "\n" . $css;
    }
    if ( '' === trim( $css ) ) {
        return;
    }
    // A stylesheet cannot be closed early from inside the CSS text.
    echo "<style id=\"snn-page-css\">\n" . str_ireplace( '</style', '<\/style', $css ) . "\n</style>\n"; // phpcs:ignore WordPress.Security.EscapeOutput
}

add_action( 'wp_footer', 'snn_page_code_print_footer', 99 );
function snn_page_code_print_footer() {
    if ( ! is_singular() ) {
        return;
    }
    $code = snn_page_code_for_post( get_queried_object_id() );
    foreach ( snn_page_code_clean_scripts( $code['scripts'] ) as $src ) {
        echo '<script src="' . esc_url( $src ) . "\"></script>\n";
    }
    if ( '' !== $code['js'] ) {
        echo "<script id=\"snn-page-js\">\n" . str_ireplace( '</script', '<\/script', $code['js'] ) . "\n</script>\n"; // phpcs:ignore WordPress.Security.EscapeOutput
    }
}
