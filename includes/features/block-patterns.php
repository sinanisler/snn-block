<?php
/**
 * SNN Block Theme - Block Pattern Categories
 *
 * Registers custom pattern categories and pattern-related theme support.
 *
 * @package SNN_Block
 */

// Register custom pattern categories
add_action( 'init', 'snn_register_pattern_categories' );

function snn_register_pattern_categories() {
    // Unregister if already registered in a previous call
    if ( ! WP_Block_Pattern_Categories_Registry::get_instance()->is_registered( 'snn/hero' ) ) {
        register_block_pattern_category( 'snn/hero', array(
            'label'       => __( 'SNN — Hero Sections', 'snn' ),
            'description' => __( 'Bold hero and banner sections for landing pages.', 'snn' ),
        ) );
    }

    if ( ! WP_Block_Pattern_Categories_Registry::get_instance()->is_registered( 'snn/features' ) ) {
        register_block_pattern_category( 'snn/features', array(
            'label'       => __( 'SNN — Features', 'snn' ),
            'description' => __( 'Feature grids, service lists, and capability showcases.', 'snn' ),
        ) );
    }

    if ( ! WP_Block_Pattern_Categories_Registry::get_instance()->is_registered( 'snn/cta' ) ) {
        register_block_pattern_category( 'snn/cta', array(
            'label'       => __( 'SNN — Call to Action', 'snn' ),
            'description' => __( 'Conversion-focused call-to-action sections.', 'snn' ),
        ) );
    }

    if ( ! WP_Block_Pattern_Categories_Registry::get_instance()->is_registered( 'snn/content' ) ) {
        register_block_pattern_category( 'snn/content', array(
            'label'       => __( 'SNN — Content', 'snn' ),
            'description' => __( 'Content sections: posts, FAQs, testimonials, and more.', 'snn' ),
        ) );
    }

    if ( ! WP_Block_Pattern_Categories_Registry::get_instance()->is_registered( 'snn/layout' ) ) {
        register_block_pattern_category( 'snn/layout', array(
            'label'       => __( 'SNN — Layout', 'snn' ),
            'description' => __( 'Full-page layouts, pricing, contact, and team sections.', 'snn' ),
        ) );
    }
}

// Disable remote patterns (these are loaded from WordPress.org)
add_filter( 'should_load_remote_block_patterns', '__return_false' );

// Remove core block patterns (keep only theme patterns for a clean inserter)
add_action( 'after_setup_theme', 'snn_remove_core_patterns' );

function snn_remove_core_patterns() {
    remove_theme_support( 'core-block-patterns' );
}
