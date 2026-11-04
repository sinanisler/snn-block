<?php
/**
 * Set Page Code Ability
 * Registers snn/set-page-code: page CSS, page JavaScript, script files and the page template,
 * without changing the post content.
 */

add_action( 'wp_abilities_api_init', 'snn_register_set_page_code_ability' );
function snn_register_set_page_code_ability() {
    wp_register_ability(
        'snn/set-page-code',
        array(
            'label'       => __( 'Set Page Code', 'snn' ),
            'description' => __( 'Sets the custom code of one post or page: custom_css (CSS for this page), custom_js (JavaScript, runs in the footer), script_urls (https script files loaded before custom_js) and template (theme template slug, for example snn-canvas). The post content is not changed. Send an empty string or empty list to remove a value. Custom CSS, JavaScript and script files need the unfiltered_html capability.', 'snn' ),
            'category'    => 'content',
            'input_schema' => array(
                'type'       => 'object',
                'required'   => array( 'post_id' ),
                'properties' => array(
                    'post_id'     => array( 'type' => 'integer', 'description' => 'Post or page ID.' ),
                    'custom_css'  => array( 'type' => 'string', 'description' => 'CSS for this page only. Replaces the stored value.' ),
                    'custom_js'   => array( 'type' => 'string', 'description' => 'JavaScript for this page only (footer). Replaces the stored value.' ),
                    'script_urls' => array( 'type' => 'array', 'items' => array( 'type' => 'string' ), 'description' => 'https URLs of script files, loaded in this order before custom_js.' ),
                    'template'    => array( 'type' => 'string', 'description' => 'Theme template slug for a page. Empty string restores the default template.' ),
                ),
            ),
            'output_schema' => array(
                'type'       => 'object',
                'properties' => array(
                    'post_id'    => array( 'type' => 'integer' ),
                    'css_bytes'  => array( 'type' => 'integer' ),
                    'js_bytes'   => array( 'type' => 'integer' ),
                    'scripts'    => array( 'type' => 'array' ),
                    'template'   => array( 'type' => 'string' ),
                ),
            ),
            'execute_callback' => function( $input ) {
                $post_id = absint( $input['post_id'] );
                $post    = get_post( $post_id );
                $type    = $post ? snn_ability_post_type( $post->post_type ) : null;
                if ( ! $type || ! current_user_can( 'edit_post', $post_id ) ) {
                    return new WP_Error( 'post_not_found', sprintf( 'Post with ID %d not found.', $post_id ), array( 'status' => 404 ) );
                }

                $has_code = array_key_exists( 'custom_css', $input ) || array_key_exists( 'custom_js', $input ) || array_key_exists( 'script_urls', $input );
                if ( $has_code && ! current_user_can( 'unfiltered_html' ) ) {
                    return new WP_Error( 'permission_denied', 'Custom CSS, JavaScript and script files need the unfiltered_html capability.', array( 'status' => 403 ) );
                }
                if ( ! empty( $input['template'] ) && ! snn_page_template_exists( $input['template'] ) ) {
                    return new WP_Error( 'invalid_template', sprintf( 'Template "%s" does not exist in the active theme.', sanitize_file_name( $input['template'] ) ), array( 'status' => 400 ) );
                }

                snn_page_code_save( $post_id, snn_ability_code_fields( $input, null ) );

                if ( array_key_exists( 'template', $input ) && 'page' === $post->post_type ) {
                    if ( '' === $input['template'] ) {
                        delete_post_meta( $post_id, '_wp_page_template' );
                    } else {
                        update_post_meta( $post_id, '_wp_page_template', sanitize_file_name( $input['template'] ) );
                    }
                }

                $code = snn_page_code_for_post( $post_id );
                return array(
                    'post_id'   => $post_id,
                    'css_bytes' => strlen( $code['css'] ),
                    'js_bytes'  => strlen( $code['js'] ),
                    'scripts'   => $code['scripts'],
                    'template'  => (string) get_post_meta( $post_id, '_wp_page_template', true ),
                );
            },
            'permission_callback' => function() {
                return current_user_can( 'edit_posts' );
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
