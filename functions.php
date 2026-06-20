<?php                                                                                                     
// DO NOT TOUCH THIS FILE 


define( 'SNN_PATH', trailingslashit( get_stylesheet_directory() ) );    
define( 'SNN_PATH_ASSETS', trailingslashit( SNN_PATH . 'assets' ) );    
define( 'SNN_URL', trailingslashit( get_stylesheet_directory_uri() ) ); 
define( 'SNN_URL_ASSETS', trailingslashit( SNN_URL . 'assets' ) );  


// Main Features and Settings
require_once SNN_PATH . 'includes/features/settings-page.php';

require_once SNN_PATH . 'includes/features/other-settings.php';
require_once SNN_PATH . 'includes/features/security-page.php';
require_once SNN_PATH . 'includes/features/post-types-settings.php';
require_once SNN_PATH . 'includes/features/custom-field-settings.php';
require_once SNN_PATH . 'includes/features/taxonomy-settings.php';
require_once SNN_PATH . 'includes/features/login-settings.php';
require_once SNN_PATH . 'includes/features/remove-wp-version.php';
require_once SNN_PATH . 'includes/features/disable-xmlrpc.php';
require_once SNN_PATH . 'includes/features/disable-file-editing.php';
require_once SNN_PATH . 'includes/features/remove-rss.php';
require_once SNN_PATH . 'includes/features/disable-wp-json-if-not-logged-in.php';
require_once SNN_PATH . 'includes/features/login-logo-change-url-change.php';
require_once SNN_PATH . 'includes/features/file-size-column-media.php';
require_once SNN_PATH . 'includes/features/404-logging.php';
require_once SNN_PATH . 'includes/features/search-loggins.php';
require_once SNN_PATH . 'includes/features/301-redirect.php';
require_once SNN_PATH . 'includes/features/smtp-settings.php';
require_once SNN_PATH . 'includes/features/mail-logging.php';
require_once SNN_PATH . 'includes/features/media-settings.php';
require_once SNN_PATH . 'includes/features/disable-emojis.php';
require_once SNN_PATH . 'includes/features/disable-gravatar.php';
require_once SNN_PATH . 'includes/features/role-manager.php';
require_once SNN_PATH . 'includes/features/custom-code-snippets.php';
require_once SNN_PATH . 'includes/features/cookie-banner.php';
require_once SNN_PATH . 'includes/features/accessibility-settings.php';
require_once SNN_PATH . 'includes/features/activity-logs.php';
require_once SNN_PATH . 'includes/features/seo.php';
require_once SNN_PATH . 'includes/features/interactions.php';
require_once SNN_PATH . 'includes/features/draft-revision.php';


require_once SNN_PATH . 'includes/ai/api-call-templates.php';
require_once SNN_PATH . 'includes/ai/ai-settings.php';
require_once SNN_PATH . 'includes/ai/ai-api.php';
require_once SNN_PATH . 'includes/ai/ai-proxy.php';
require_once SNN_PATH . 'includes/ai/ai-overlay.php';
require_once SNN_PATH . 'includes/ai/ai-seo-generation.php';
require_once SNN_PATH . 'includes/ai/ai-block-editor.php';
require_once SNN_PATH . 'includes/ai/ai-agent-and-chat.php';

require_once SNN_PATH . 'includes/ai/abilities/ability-categories.php';
require_once SNN_PATH . 'includes/ai/abilities/create-posts.php';
require_once SNN_PATH . 'includes/ai/abilities/update-posts.php';
require_once SNN_PATH . 'includes/ai/abilities/get-posts.php';
require_once SNN_PATH . 'includes/ai/abilities/get-post-by-id.php';
require_once SNN_PATH . 'includes/ai/abilities/get-post-meta.php';
require_once SNN_PATH . 'includes/ai/abilities/search-content.php';
require_once SNN_PATH . 'includes/ai/abilities/get-terms.php';
require_once SNN_PATH . 'includes/ai/abilities/get-tags.php';
require_once SNN_PATH . 'includes/ai/abilities/create-terms.php';
require_once SNN_PATH . 'includes/ai/abilities/get-media.php';
require_once SNN_PATH . 'includes/ai/abilities/get-users.php';
require_once SNN_PATH . 'includes/ai/abilities/get-comments.php';
require_once SNN_PATH . 'includes/ai/abilities/get-site-info.php';
require_once SNN_PATH . 'includes/ai/abilities/suggest-content-ideas.php';
require_once SNN_PATH . 'includes/ai/abilities/create-post-summaries.php';
require_once SNN_PATH . 'includes/ai/abilities/check-seo-quality-title-and-content.php';
require_once SNN_PATH . 'includes/ai/abilities/installed-plugin-list-and-infos.php';
require_once SNN_PATH . 'includes/ai/abilities/active-theme-info.php';
require_once SNN_PATH . 'includes/ai/abilities/list-taxonomies.php';
require_once SNN_PATH . 'includes/ai/abilities/get-post-content.php';
require_once SNN_PATH . 'includes/ai/abilities/generate-block-pattern.php';
require_once SNN_PATH . 'includes/ai/abilities/edit-block-content.php';
require_once SNN_PATH . 'includes/ai/abilities/update-post-metadata.php';
require_once SNN_PATH . 'includes/ai/abilities/analyze-post-seo.php';




// Utils
require_once SNN_PATH . 'includes/features/utils.php';
//require_once SNN_PATH . 'includes/features/auto-update-snn-brx-github.php';

// Block Patterns
add_filter( 'should_load_remote_block_patterns', '__return_false' );
add_action( 'after_setup_theme', function() {
    remove_theme_support( 'core-block-patterns' );
} );

add_action( 'init', function() {
    register_block_pattern_category( 'snn/hero',     [ 'label' => __( 'SNN — Hero Sections', 'snn' ), 'description' => __( 'Bold hero and banner sections for landing pages.', 'snn' ) ] );
    register_block_pattern_category( 'snn/features', [ 'label' => __( 'SNN — Features', 'snn' ), 'description' => __( 'Feature grids, service lists, and capability showcases.', 'snn' ) ] );
    register_block_pattern_category( 'snn/cta',      [ 'label' => __( 'SNN — Call to Action', 'snn' ), 'description' => __( 'Conversion-focused call-to-action sections.', 'snn' ) ] );
    register_block_pattern_category( 'snn/content',  [ 'label' => __( 'SNN — Content', 'snn' ), 'description' => __( 'Content sections: posts, FAQs, testimonials, and more.', 'snn' ) ] );
    register_block_pattern_category( 'snn/layout',   [ 'label' => __( 'SNN — Layout', 'snn' ), 'description' => __( 'Full-page layouts, pricing, contact, and team sections.', 'snn' ) ] );
} );

// Load Translations
add_action('after_setup_theme', function() {
    load_theme_textdomain('snn', SNN_PATH . '/languages');
});








require_once SNN_PATH . 'includes/features/block-editor-settings.php';
require_once SNN_PATH . 'includes/features/global-style-editor-settings.php';

// Global Command Palette (Ctrl+K everywhere — admin + frontend)
require_once SNN_PATH . 'global/command-palette/command-palette-loader.php';
require_once SNN_PATH . 'includes/features/media-image-opt.php';
require_once SNN_PATH . 'includes/features/wp-admin-dashboard-widgets.php';









// Register Blocks
require_once SNN_PATH . 'blocks/simple-gallery/block.php';
require_once SNN_PATH . 'blocks/section/block.php';
require_once SNN_PATH . 'blocks/container/block.php';
require_once SNN_PATH . 'blocks/text/block.php';
require_once SNN_PATH . 'blocks/icon/block.php';








function snn_block_enqueue_assets() { wp_enqueue_style( 'snn-block-style', get_stylesheet_uri(), array(), wp_get_theme()->get('Version') ); } add_action( 'wp_enqueue_scripts', 'snn_block_enqueue_assets' );



// Load Babel Tower (required for block editor.jsx files)
add_action('enqueue_block_editor_assets', function() { 
    wp_enqueue_script(
        'babel-standalone', SNN_URL_ASSETS . 'js/babel.min.js',[
            'wp-blocks','wp-element','wp-components','wp-block-editor','wp-i18n','wp-editor',      
            'wp-data','wp-compose','wp-rich-text','wp-api-fetch','wp-url','wp-dom-ready',   
            'wp-hooks','wp-notices','wp-keycodes','wp-viewport'     
        ], wp_get_theme()->get('Version') , true );
});

// Load shared Controls.jsx — reusable editor components, loaded before any block JSX
add_action('enqueue_block_editor_assets', function () {
    add_action('admin_footer', function () {
        $controls_path = SNN_PATH . 'blocks/Controls.jsx';
        if (file_exists($controls_path)) {
            echo '<script type="text/babel" id="snn-controls">' . file_get_contents($controls_path) . '</script>';
        }
    }, 1);
}, 5);