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

CONTENT: send an HTML design (a section, a page or a fragment) as content. It is converted to the own blocks of this site (mode snn, the default): Section, Container, Div, Text, Image, Button, Icon and Code. The <style> of the design and inline styles become the CSS of this page, its scripts the page JavaScript (unfiltered_html needed), its Google Fonts are listed under conversion.fonts. Block markup (with <!-- wp: comments) is stored as given. The answer has a conversion report: blocks per kind, code_fallbacks (parts kept as written HTML), unknown_blocks, disabled_blocks and dropped values. Read snn/get-block-schema before writing block markup by hand. See includes/ai/docs/block-generation-rules.md.', 'snn' ),
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
                        'description' => 'HTML design or block markup. HTML is converted to blocks (see convert and mode).',
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
                ) + snn_ability_content_properties(),
            ),
            'output_schema' => array(
                'type'       => 'object',
                'properties' => array(
                    'id'         => array( 'type' => 'integer' ),
                    'updated'    => array( 'type' => 'boolean' ),
                    'url'        => array( 'type' => 'string' ),
                    'modified'   => array( 'type' => 'string' ),
                    'conversion' => array( 'type' => array( 'object', 'null' ), 'description' => 'Report on the stored content (when content was sent).' ),
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

                $prepared = snn_ability_prepare_input( $input );
                if ( is_wp_error( $prepared ) ) {
                    return $prepared;
                }
                if ( null !== $prepared ) {
                    $update_data['post_content'] = $prepared['markup'];
                }

                if ( isset( $input['status'] ) ) {
                    $update_data['post_status'] = sanitize_text_field( $input['status'] );
                }

                if ( isset( $input['excerpt'] ) ) {
                    $update_data['post_excerpt'] = sanitize_textarea_field( $input['excerpt'] );
                }

                // WordPress takes slashed data (the block attributes are JSON with backslashes).
                $result = wp_update_post( wp_slash( $update_data ), true );

                if ( is_wp_error( $result ) ) {
                    return $result;
                }

                $conversion = snn_ability_store_extras( $post_id, $input, $prepared );
                $post       = get_post( $post_id );

                return array(
                    'id'         => $post_id,
                    'updated'    => true,
                    'url'        => get_permalink( $post ),
                    'modified'   => $post->post_modified,
                    'conversion' => $conversion,
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
