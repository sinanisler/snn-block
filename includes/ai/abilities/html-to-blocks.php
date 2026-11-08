<?php
/**
 * HTML to Blocks Ability
 * Registers snn/html-to-blocks: converts an HTML design to block markup without saving it.
 */

add_action( 'wp_abilities_api_init', 'snn_register_html_to_blocks_ability' );
function snn_register_html_to_blocks_ability() {
    wp_register_ability(
        'snn/html-to-blocks',
        array(
            'label'       => __( 'HTML to Blocks', 'snn' ),
            'description' => __( 'Converts an HTML design (a section, a page or a fragment) into block editor markup and saves nothing. Returns the markup, the page CSS (from <style> and inline styles), the page scripts (from <script>, when allowed), the Google Fonts the design asks for, and a report: how many blocks of each kind were made, how many parts stayed as Custom HTML, and warnings. Use it to check a conversion before snn/create-post or snn/update-post, or to see which parts of a design need a native block.', 'snn' ),
            'category'    => 'content',
            'input_schema' => array(
                'type'       => 'object',
                'required'   => array( 'html' ),
                'properties' => array(
                    'html' => array(
                        'type'        => 'string',
                        'description' => 'The HTML design: a section, a page or a fragment. Block markup is returned normalized.',
                    ),
                    'mode' => snn_ability_content_properties()['mode'],
                ),
            ),
            'output_schema' => array(
                'type'       => 'object',
                'properties' => array(
                    'markup'  => array( 'type' => 'string', 'description' => 'Block editor markup.' ),
                    'css'     => array( 'type' => 'string', 'description' => 'Page CSS from the design.' ),
                    'scripts' => array( 'type' => 'object', 'description' => 'src (list of URLs) and inline (JavaScript).' ),
                    'fonts'   => array( 'type' => 'object', 'description' => 'Google Fonts family => weights the design asks for.' ),
                    'report'  => array( 'type' => 'object', 'description' => 'blocks (count per block), html_fallbacks, dropped_attributes, warnings.' ),
                ),
            ),
            'execute_callback' => function( $input ) {
                $allow_code = current_user_can( 'unfiltered_html' );
                $prepared   = snn_blocks_prepare_content( $input['html'], true, $allow_code, (string) ( $input['mode'] ?? 'snn' ) );

                return array(
                    'markup'  => $prepared['markup'],
                    'css'     => $prepared['css'],
                    'scripts' => $prepared['scripts'],
                    'fonts'   => (object) $prepared['fonts'],
                    'report'  => snn_blocks_content_report( $prepared, $prepared['markup'] ),
                );
            },
            'permission_callback' => function() {
                return current_user_can( 'edit_posts' );
            },
            'meta' => array(
                'show_in_rest' => true,
                'readonly'     => true,
                'destructive'  => false,
                'idempotent'   => true,
            ),
        )
    );
}
