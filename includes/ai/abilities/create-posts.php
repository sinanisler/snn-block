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

CONTENT IS CONVERTED TO BLOCKS: the HTML becomes native block markup (headings, paragraphs, lists, images, buttons, groups, quotes, tables, code, details). Anything a core block cannot hold stays in a Custom HTML block. Inline style attributes and <style> move to page CSS, and <script> tags move to page JavaScript (unfiltered_html needed). Send a whole section or page as HTML, and set template to snn-canvas for a full-width page with no theme header or footer. Use custom_css, custom_js and script_urls for page code. See includes/ai/docs/block-generation-rules.md for the supported blocks.', 'snn' ),
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
                        'description' => 'Post content (clean, valid HTML with ALL tags properly closed). WordPress will parse this into blocks. Use proper structure: <h2>Heading</h2><p>Paragraph</p><ul><li>List item</li></ul>. Avoid unclosed tags, empty blocks, or loose text.',
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
                        'description' => 'JavaScript for this page only (runs in the footer). Needs unfiltered_html.',
                    ),
                    'script_urls' => array(
                        'type'        => 'array',
                        'description' => 'https URLs of script files to load on this page before custom_js (for example GSAP from cdnjs). Needs unfiltered_html.',
                        'items'       => array( 'type' => 'string' ),
                    ),
                    'template' => array(
                        'type'        => 'string',
                        'description' => 'Theme template slug for a page, for example snn-canvas (full width, no header or footer).',
                    ),
                ),
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

                $allow_code = current_user_can( 'unfiltered_html' );
                $has_code   = ! empty( $input['custom_css'] ) || ! empty( $input['custom_js'] ) || ! empty( $input['script_urls'] );
                if ( $has_code && ! $allow_code ) {
                    return new WP_Error(
                        'permission_denied',
                        'Custom CSS, JavaScript and script files need the unfiltered_html capability.',
                        array( 'status' => 403 )
                    );
                }
                if ( ! empty( $input['template'] ) && ! snn_page_template_exists( $input['template'] ) ) {
                    return new WP_Error( 'invalid_template', sprintf( 'Template "%s" does not exist in the active theme.', sanitize_file_name( $input['template'] ) ), array( 'status' => 400 ) );
                }

                $prepared = snn_blocks_prepare_content( $input['content'], $input['convert'] ?? true, $allow_code );

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

                // Insert the post
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

                snn_page_code_save( $post_id, snn_ability_code_fields( $input, $prepared ) );
                if ( ! empty( $input['template'] ) && 'page' === $post_type ) {
                    update_post_meta( $post_id, '_wp_page_template', sanitize_file_name( $input['template'] ) );
                }

                return array(
                    'id'         => $post_id,
                    'url'        => get_permalink( $post_id ),
                    'edit_url'   => get_edit_post_link( $post_id, 'raw' ),
                    'status'     => get_post_status( $post_id ),
                    'conversion' => array(
                        'blocks'         => $prepared['report']['blocks'],
                        'html_fallbacks' => $prepared['report']['html_fallbacks'],
                        'warnings'       => $prepared['report']['warnings'],
                    ),
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
