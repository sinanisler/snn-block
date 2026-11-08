<?php
/**
 * Get Block Schema Ability
 * Registers snn/get-block-schema: our blocks, their attributes and defaults, the allowed values, the per-view
 * (responsive) format and the icon libraries. Read-only.
 */

add_action( 'wp_abilities_api_init', 'snn_register_get_block_schema_ability' );
function snn_register_get_block_schema_ability() {
    wp_register_ability(
        'snn/get-block-schema',
        array(
            'label'       => __( 'Get Block Schema', 'snn' ),
            'description' => __( 'Returns the schema of this site\'s own blocks (snn/section, snn/container, snn/div, snn/text, snn/image, snn/button, snn/icon, snn/code): each block\'s attributes with their type and default, the allowed tags and values, the Style properties and the kind of value each takes, the responsive format (tablet and mobile values) and the icon libraries. Read it before writing block markup by hand; snn/create-post with an HTML design builds these blocks for you. The core blocks are switched off in this site\'s editor, so pages are made of these blocks.', 'snn' ),
            'category'    => 'content',
            'input_schema' => array(
                'type'       => 'object',
                'properties' => array(
                    'block' => array(
                        'type'        => 'string',
                        'description' => 'Optional: one block name (for example snn/button). Without it, every block is returned.',
                    ),
                ),
            ),
            'output_schema' => array(
                'type'       => 'object',
                'properties' => array(
                    'blocks'      => array( 'type' => 'object' ),
                    'allowed'     => array( 'type' => 'object' ),
                    'style_props' => array( 'type' => 'object' ),
                    'values'      => array( 'type' => 'object' ),
                    'responsive'  => array( 'type' => 'object' ),
                    'icons'       => array( 'type' => 'object' ),
                    'rules'       => array( 'type' => 'array' ),
                ),
            ),
            'execute_callback' => function( $input ) {
                $schema = snn_block_schema();
                $one    = is_array( $input ) && ! empty( $input['block'] ) ? (string) $input['block'] : '';
                if ( '' !== $one ) {
                    if ( ! isset( $schema['blocks'][ $one ] ) ) {
                        return new WP_Error( 'unknown_block', sprintf( 'Unknown block "%s". Blocks: %s.', $one, implode( ', ', array_keys( $schema['blocks'] ) ) ), array( 'status' => 404 ) );
                    }
                    $schema['blocks'] = array( $one => $schema['blocks'][ $one ] );
                }
                return $schema;
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
