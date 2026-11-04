<?php 
/**
 * Update Post Ability
 * Registers the snn/update-post ability for the WordPress Abilities API
 */

// Register ability
add_action( 'wp_abilities_api_init', 'snn_register_update_post_ability' );
function snn_register_update_post_ability() {
    wp_register_ability(
        'snn/update-post',
        array(
            'label'       => __( 'Update Post', 'snn' ),
            'description' => __( 'Updates an existing post by ID with new title, content (HTML supported), status (draft/publish/pending/private), or excerpt. All fields are optional - only provided fields will be updated. Automatically sanitizes input and preserves unchanged fields. Returns post ID, success status, updated permalink, and last modified timestamp. Use this to edit existing content, change post status, update excerpts, revise posts, or programmatically modify content. Requires post ID - use get-posts or search-content to find posts first if ID unknown.

CONTENT IS CONVERTED TO BLOCKS: HTML content becomes native block markup, and anything a core block cannot hold stays in a Custom HTML block. Inline style attributes and <style> move to page CSS, and <script> tags move to page JavaScript (unfiltered_html needed). Page code can be changed with custom_css, custom_js, script_urls and template, without changing the content. See includes/ai/docs/block-generation-rules.md for the supported blocks.', 'snn' ),
            'category'    => 'content',
            'input_schema' => array(
                'type'       => 'object',
                'required'   => array( 'post_id' ),
                'properties' => array(
                    'post_id' => array(
                        'type'        => 'integer',
                        'description' => 'ID of the post to update.',
                    ),
                    'title' => array(
                        'type'        => 'string',
                        'description' => 'New post title.',
                    ),
                    'content' => array(
                        'type'        => 'string',
                        'description' => 'New post content: an HTML design or section (converted to native blocks by default), or block markup when convert is false.',
                    ),
                    'convert' => array(
                        'type'        => 'boolean',
                        'description' => 'Convert HTML to native block markup (default true). Send false only when the content is already block markup.',
                        'default'     => true,
                    ),
                    'custom_css' => array(
                        'type'        => 'string',
                        'description' => 'CSS for this page only. Needs unfiltered_html. Replaces the stored page CSS.',
                    ),
                    'custom_js' => array(
                        'type'        => 'string',
                        'description' => 'JavaScript for this page only (runs in the footer). Needs unfiltered_html. Replaces the stored page JavaScript.',
                    ),
                    'script_urls' => array(
                        'type'        => 'array',
                        'description' => 'https URLs of script files to load on this page before custom_js. Needs unfiltered_html.',
                        'items'       => array( 'type' => 'string' ),
                    ),
                    'template' => array(
                        'type'        => 'string',
                        'description' => 'Theme template slug for a page, for example snn-canvas (full width, no header or footer).',
                    ),
                    'status' => array(
                        'type'        => 'string',
                        'description' => 'New post status.',
                        'enum'        => array( 'draft', 'publish', 'pending', 'private' ),
                    ),
                    'excerpt' => array(
                        'type'        => 'string',
                        'description' => 'New post excerpt.',
                    ),
                ),
            ),
            'output_schema' => array(
                'type'       => 'object',
                'properties' => array(
                    'id'       => array( 'type' => 'integer' ),
                    'updated'  => array( 'type' => 'boolean' ),
                    'url'      => array( 'type' => 'string' ),
                    'modified' => array( 'type' => 'string' ),
                ),
            ),
            'execute_callback' => function( $input ) {
                $post_id = absint( $input['post_id'] );

                // Same response for missing, internal and not-editable posts, so IDs cannot be probed.
                $post          = get_post( $post_id );
                $post_type_obj = $post ? snn_ability_post_type( $post->post_type ) : null;
                if ( ! $post_type_obj || ! current_user_can( 'edit_post', $post_id ) ) {
                    return new WP_Error(
                        'post_not_found',
                        sprintf( 'Post with ID %d not found.', $post_id ),
                        array( 'status' => 404 )
                    );
                }

                if ( isset( $input['status'] ) && ! snn_ability_can_use_status( $post_type_obj, $input['status'] ) ) {
                    return new WP_Error(
                        'permission_denied',
                        sprintf( 'You are not allowed to set this post to "%s".', sanitize_key( $input['status'] ) ),
                        array( 'status' => 403 )
                    );
                }

                $update_data = array( 'ID' => $post_id );

                if ( isset( $input['title'] ) ) {
                    $update_data['post_title'] = sanitize_text_field( $input['title'] );
                }

                $allow_code = current_user_can( 'unfiltered_html' );
                $has_code   = ! empty( $input['custom_css'] ) || ! empty( $input['custom_js'] ) || ! empty( $input['script_urls'] );
                if ( $has_code && ! $allow_code ) {
                    return new WP_Error( 'permission_denied', 'Custom CSS, JavaScript and script files need the unfiltered_html capability.', array( 'status' => 403 ) );
                }
                if ( ! empty( $input['template'] ) && ! snn_page_template_exists( $input['template'] ) ) {
                    return new WP_Error( 'invalid_template', sprintf( 'Template "%s" does not exist in the active theme.', sanitize_file_name( $input['template'] ) ), array( 'status' => 400 ) );
                }

                $prepared = null;
                if ( isset( $input['content'] ) ) {
                    $prepared = snn_blocks_prepare_content( $input['content'], $input['convert'] ?? true, $allow_code );
                    $update_data['post_content'] = $prepared['markup'];
                }

                if ( isset( $input['status'] ) ) {
                    $update_data['post_status'] = sanitize_text_field( $input['status'] );
                }

                if ( isset( $input['excerpt'] ) ) {
                    $update_data['post_excerpt'] = sanitize_textarea_field( $input['excerpt'] );
                }

                $result = wp_update_post( wp_slash( $update_data ), true );

                if ( is_wp_error( $result ) ) {
                    return $result;
                }

                if ( null !== $prepared || array_key_exists( 'custom_css', $input ) || array_key_exists( 'custom_js', $input ) || array_key_exists( 'script_urls', $input ) ) {
                    snn_page_code_save( $post_id, snn_ability_code_fields( $input, $prepared ) );
                }
                if ( ! empty( $input['template'] ) && 'page' === get_post_type( $post_id ) ) {
                    update_post_meta( $post_id, '_wp_page_template', sanitize_file_name( $input['template'] ) );
                }

                $post = get_post( $post_id );

                return array(
                    'id'         => $post_id,
                    'updated'    => true,
                    'url'        => get_permalink( $post ),
                    'modified'   => $post->post_modified,
                    'conversion' => null === $prepared ? null : array(
                        'blocks'         => $prepared['report']['blocks'],
                        'html_fallbacks' => $prepared['report']['html_fallbacks'],
                        'warnings'       => $prepared['report']['warnings'],
                    ),
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
