<?php
define( 'SNN_PATH', trailingslashit( get_stylesheet_directory() ) );    
define( 'SNN_PATH_ASSETS', trailingslashit( SNN_PATH . 'assets' ) );    
define( 'SNN_URL', trailingslashit( get_stylesheet_directory_uri() ) ); 
define( 'SNN_URL_ASSETS', trailingslashit( SNN_URL . 'assets' ) );  

function snn_block_enqueue_assets() { wp_enqueue_style( 'snn-block-style', get_stylesheet_uri(), array(), wp_get_theme()->get('Version') ); } add_action( 'wp_enqueue_scripts', 'snn_block_enqueue_assets' );


require_once SNN_PATH . '/includes/settings-page.php';

require_once __DIR__ . '/includes/301-redirect.php';
require_once __DIR__ . '/includes/404-logging.php';
require_once __DIR__ . '/includes/accessibility-settings.php';
require_once __DIR__ . '/includes/block-editor-settings.php';
require_once __DIR__ . '/includes/cookie-banner.php';
require_once __DIR__ . '/includes/custom-code-snippets.php';
require_once __DIR__ . '/includes/custom-field-settings.php';
require_once __DIR__ . '/includes/login-math-captcha.php';
require_once __DIR__ . '/includes/login-settings.php';
require_once __DIR__ . '/includes/mail-logging.php';
require_once __DIR__ . '/includes/media-settings.php';
require_once __DIR__ . '/includes/post-types-settings.php';
require_once __DIR__ . '/includes/search-loggins.php';
require_once __DIR__ . '/includes/security-page.php';
require_once __DIR__ . '/includes/smtp-settings.php';
require_once __DIR__ . '/includes/taxonomy-settings.php';
require_once __DIR__ . '/includes/activity-logs.php';


require_once SNN_PATH . '/includes/block-editor-utils.php';


// Custom Blocks
require_once SNN_PATH . '/blocks/flip-card/block.php';
require_once SNN_PATH . '/blocks/section/block.php';





// Load Babel Tower
add_action('enqueue_block_editor_assets', function() { 
    wp_enqueue_script(
        'babel-standalone', SNN_URL_ASSETS . 'js/babel.min.js',[
            'wp-blocks','wp-element','wp-components','wp-block-editor','wp-i18n','wp-editor',      
            'wp-data','wp-compose','wp-rich-text','wp-api-fetch','wp-url','wp-dom-ready',   
            'wp-hooks','wp-notices','wp-keycodes','wp-viewport'     
        ], wp_get_theme()->get('Version') , true );
    
    // Enqueue global classes modal styles
    wp_enqueue_style(
        'snn-global-classes-modal-styles',
        SNN_URL . 'editor/global-classes-modal.css',
        [],
        wp_get_theme()->get('Version')
    );
    
    // Enqueue global classes modal
    wp_enqueue_script(
        'snn-global-classes-modal',
        SNN_URL . 'editor/global-classes-modal.js',
        [
            'wp-element',
            'wp-components',
            'wp-i18n'
        ],
        wp_get_theme()->get('Version'),
        true
    );
    
    // Enqueue editor filter for core block attributes
    wp_enqueue_script(
        'snn-core-attributes',
        SNN_URL . 'editor/global-class-control.js',
        [
            'wp-blocks',
            'wp-hooks',
            'wp-element',
            'wp-components',
            'wp-compose',
            'wp-block-editor',
            'wp-editor',
            'snn-global-classes-modal'
        ],
        wp_get_theme()->get('Version'),
        true
    );
});



