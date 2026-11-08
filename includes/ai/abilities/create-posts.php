<?php 
/**
 * Create Post Ability
 * Registers the snn/create-post ability for the WordPress Abilities API
 */

// Register ability
add_action( 'wp_abilities_api_init', 'snn_register_create_post_ability' );
function snn_register_create_post_ability() {
    wp_register_ability(
        'snn/create-post',
        array(
            'label'       => __( 'Create Post', 'snn' ),
            'description' => __( 'Creates a new WordPress post or page with specified title, content (HTML supported), excerpt, status (draft/publish/pending/private), categories, and tags. Automatically sanitizes input and sets the current user as author. Returns the new post ID, permalink, and edit URL. Use this when you need to programmatically create content, import posts, generate articles, or add new pages to the site. Always create as draft first unless explicitly instructed to publish immediately.

CONTENT: send an HTML design (a section, a page or a fragment) as content. It is converted to the own blocks of this site (mode snn, the default): Section, Container, Div, Text, Image, Button, Icon and Code. The <style> of the design and inline styles become the CSS of this page, its scripts the page JavaScript (unfiltered_html needed), its Google Fonts are listed under conversion.fonts. Block markup (with <!-- wp: comments) is stored as given. The answer has a conversion report: blocks per kind, code_fallbacks (parts kept as written HTML), unknown_blocks, disabled_blocks and dropped values. Read snn/get-block-schema before writing block markup by hand. See includes/ai/docs/block-generation-rules.md.', 'snn' ),
            'category'    => 'content',
            'input_schema' => array(
                'type'       => 'object',
                'required'   => array( 'title', 'content' ),
                'properties' => array(
                    'title' => array(
                        'type'        => 'string',
                        'description' => 'Post title.',
                        'minLength'   => 1,
                        'maxLength'   => 200,
                    ),
                    'content' => array(
                        'type'        => 'string',
                        'description' => 'HTML design or block markup. HTML is converted to blocks (see convert and mode).',
                        'minLength'   => 1,
                    ),
                    'status' => array(
                        'type'        => 'string',
                        'description' => 'Post status (draft, publish, pending).',
                        'enum'        => array( 'draft', 'publish', 'pending', 'private' ),
                        'default'     => 'draft',
                    ),
                    'post_type' => array(
                        'type'        => 'string',
                        'description' => 'Post type (post, page).',
                        'enum'        => array( 'post', 'page' ),
                        'default'     => 'post',
                    ),
                    'excerpt' => array(
                        'type'        => 'string',
                        'description' => 'Optional post excerpt.',
                    ),
                    'categories' => array(
                        'type'        => 'array',
                        'description' => 'Array of category IDs.',
                        'items'       => array( 'type' => 'integer' ),
                    ),
                    'tags' => array(
                        'type'        => 'array',
                        'description' => 'Array of tag names.',
                        'items'       => array( 'type' => 'string' ),
                    ),
                ) + snn_ability_content_properties(),
            ),
            'output_schema' => array(
                'type'       => 'object',
                'properties' => array(
                    'id'  => array(
                        'type'        => 'integer',
                        'description' => 'Created post ID',
                    ),
                    'url' => array(
                        'type'        => 'string',
                        'description' => 'Post permalink',
                    ),
                    'edit_url' => array(
                        'type'        => 'string',
                        'description' => 'Edit URL in admin',
                    ),
                    'status' => array(
                        'type'        => 'string',
                        'description' => 'Post status',
                    ),
                    'conversion' => array(
                        'type'        => 'object',
                        'description' => 'Report on the stored content: mode, blocks, code_fallbacks, code_tags, unknown_blocks, disabled_blocks, dropped, warnings, fonts.',
                    ),
                ),
            ),
            'execute_callback' => function( $input ) {
                $post_type     = sanitize_key( $input['post_type'] ?? 'post' );
                $status        = sanitize_key( $input['status'] ?? 'draft' );
                $post_type_obj = snn_ability_post_type( $post_type );

                if ( ! $post_type_obj || ! current_user_can( $post_type_obj->cap->create_posts ) ) {
                    return new WP_Error(
                        'permission_denied',
                        sprintf( 'You are not allowed to create "%s" posts.', $post_type ),
                        array( 'status' => 403 )
                    );
                }
                if ( ! snn_ability_can_use_status( $post_type_obj, $status ) ) {
                    return new WP_Error(
                        'permission_denied',
                        sprintf( 'You are not allowed to create posts with the status "%s".', $status ),
                        array( 'status' => 403 )
                    );
                }

                $prepared = snn_ability_prepare_input( $input );
                if ( is_wp_error( $prepared ) ) {
                    return $prepared;
                }

                $post_data = array(
                    'post_title'   => sanitize_text_field( $input['title'] ),
                    'post_content' => $prepared['markup'],
                    'post_status'  => $status,
                    'post_type'    => $post_type,
                    'post_author'  => get_current_user_id(),
                );

                // Add optional excerpt
                if ( ! empty( $input['excerpt'] ) ) {
                    $post_data['post_excerpt'] = sanitize_textarea_field( $input['excerpt'] );
                }

                // Insert the post. WordPress takes slashed data (the block attributes are JSON with backslashes).
                $post_id = wp_insert_post( wp_slash( $post_data ), true );

                if ( is_wp_error( $post_id ) ) {
                    return $post_id;
                }

                // Set categories if provided
                if ( ! empty( $input['categories'] ) && is_array( $input['categories'] ) ) {
                    wp_set_post_categories( $post_id, $input['categories'] );
                }

                // Set tags if provided
                if ( ! empty( $input['tags'] ) && is_array( $input['tags'] ) ) {
                    wp_set_post_tags( $post_id, $input['tags'] );
                }

                $conversion = snn_ability_store_extras( $post_id, $input, $prepared );

                return array(
                    'id'         => $post_id,
                    'url'        => get_permalink( $post_id ),
                    'edit_url'   => get_edit_post_link( $post_id, 'raw' ),
                    'status'     => get_post_status( $post_id ),
                    'conversion' => $conversion,
                );
            },
            'permission_callback' => function() {
                return current_user_can( 'publish_posts' );
            },
            'meta' => array(
                'show_in_rest' => true,
                'readonly'     => false,
                'destructive'  => false,
                'idempotent'   => false,
            ),
        )
    );
}
