<?php
/**
 * Container Block
 *
 * @package snn-block
 */

// Register block type using metadata from block.json
add_action( 'init', function() {
    // Register editor script
    wp_register_script(
        'snn-block-container-editor',
        get_stylesheet_directory_uri() . '/blocks/container/editor.js',
        array( 'wp-blocks', 'wp-element', 'wp-block-editor' ),
        filemtime( get_stylesheet_directory() . '/blocks/container/editor.js' ),
        true
    );

    // Register block style
    wp_register_style(
        'snn-block-container-style',
        get_stylesheet_directory_uri() . '/blocks/container/block.css',
        array(),
        filemtime( get_stylesheet_directory() . '/blocks/container/block.css' )
    );

    // Register the block using block.json metadata
    register_block_type( __DIR__ );
} );
