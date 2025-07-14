<?php
define( 'SNN_PATH', trailingslashit( get_stylesheet_directory() ) );    
define( 'SNN_PATH_ASSETS', trailingslashit( SNN_PATH . 'assets' ) );    
define( 'SNN_URL', trailingslashit( get_stylesheet_directory_uri() ) ); 
define( 'SNN_URL_ASSETS', trailingslashit( SNN_URL . 'assets' ) );  


require_once SNN_PATH . '/includes/settings-page.php';

require_once SNN_PATH . '/includes/301-redirect.php';
require_once SNN_PATH . '/includes/404-logging.php';
require_once SNN_PATH . '/includes/accessibility-settings.php';
require_once SNN_PATH . '/includes/block-editor-settings.php';
require_once SNN_PATH . '/includes/cookie-banner.php';
require_once SNN_PATH . '/includes/custom-code-snippets.php';
require_once SNN_PATH . '/includes/custom-field-settings.php';
require_once SNN_PATH . '/includes/login-math-captcha.php';
require_once SNN_PATH . '/includes/login-settings.php';
require_once SNN_PATH . '/includes/mail-logging.php';
require_once SNN_PATH . '/includes/media-settings.php';
require_once SNN_PATH . '/includes/post-types-settings.php';
require_once SNN_PATH . '/includes/search-loggins.php';
require_once SNN_PATH . '/includes/security-page.php';
require_once SNN_PATH . '/includes/disable-emojis.php';
require_once SNN_PATH . '/includes/disable-gravatar.php';
require_once SNN_PATH . '/includes/smtp-settings.php';
require_once SNN_PATH . '/includes/taxonomy-settings.php';



// Custom Blocks
require_once SNN_PATH . '/blocks/section.php';
require_once SNN_PATH . '/blocks/container.php';



