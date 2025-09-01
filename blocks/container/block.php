<?php
/**
 * Container Block
 *
 * @package snn-block
 */

function snn_block_render_container_block( $attributes, $content ) {
    // If content is empty, this means we're using client-side save with InnerBlocks.Content
    // so we should return nothing and let the client-side save handle it
    if ( empty( trim( $content ) ) ) {
        return '';
    }
    
    // Properly render container with block wrapper attributes for style support
    $wrapper_attributes = get_block_wrapper_attributes( array( 'class' => 'snn-container' ) );
    
    // Debug: log $content to a file
    $debug_file = get_stylesheet_directory() . '/container-block-debug.log';
    file_put_contents( $debug_file, "CONTENT:\n" . $content . "\nATTRIBUTES:\n" . print_r($attributes, true) . "\n\n", FILE_APPEND );
    
    return sprintf( '<div %s>%s</div>', $wrapper_attributes, $content );
}

// Register block type using metadata from block.json

add_action( 'init', function() {
    // Register editor script for block editor only
    wp_register_script(
        'snn-block-container-editor',
        get_stylesheet_directory_uri() . '/blocks/container/editor.js',
        array( 'wp-blocks', 'wp-element', 'wp-block-editor' ),
        filemtime( get_stylesheet_directory() . '/blocks/container/editor.js' ),
        true // in_footer
    );

    // Register block style for both editor and frontend
    wp_register_style(
        'snn-block-container-style',
        get_stylesheet_directory_uri() . '/blocks/container/block.css',
        array(),
        filemtime( get_stylesheet_directory() . '/blocks/container/block.css' )
    );

    register_block_type( __DIR__, array(
        'editor_script' => 'snn-block-container-editor',
        'style'        => 'snn-block-container-style',
        // Remove render_callback since we're using client-side save
    ) );
} );
