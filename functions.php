<?php                                                                    
// DO NOT TOUCH THIS FILE 


define( 'SNN_PATH', trailingslashit( get_stylesheet_directory() ) );    
define( 'SNN_PATH_ASSETS', trailingslashit( SNN_PATH . 'assets' ) );    
define( 'SNN_URL', trailingslashit( get_stylesheet_directory_uri() ) ); 
define( 'SNN_URL_ASSETS', trailingslashit( SNN_URL . 'assets' ) );  


// Main Features and Settings
require_once SNN_PATH . 'includes/settings-page.php';

require_once SNN_PATH . 'includes/other-settings.php';
require_once SNN_PATH . 'includes/security-page.php';
require_once SNN_PATH . 'includes/post-types-settings.php';
require_once SNN_PATH . 'includes/custom-field-settings.php';
require_once SNN_PATH . 'includes/taxonomy-settings.php';
require_once SNN_PATH . 'includes/login-settings.php';
require_once SNN_PATH . 'includes/remove-wp-version.php';
require_once SNN_PATH . 'includes/disable-xmlrpc.php';
require_once SNN_PATH . 'includes/disable-file-editing.php';
require_once SNN_PATH . 'includes/remove-rss.php';
require_once SNN_PATH . 'includes/disable-wp-json-if-not-logged-in.php';
require_once SNN_PATH . 'includes/login-logo-change-url-change.php';
require_once SNN_PATH . 'includes/enqueue-scripts.php';
require_once SNN_PATH . 'includes/file-size-column-media.php';
require_once SNN_PATH . 'includes/404-logging.php';
require_once SNN_PATH . 'includes/search-loggins.php';
require_once SNN_PATH . 'includes/301-redirect.php';
require_once SNN_PATH . 'includes/smtp-settings.php';
require_once SNN_PATH . 'includes/mail-logging.php';
require_once SNN_PATH . 'includes/media-settings.php';
require_once SNN_PATH . 'includes/disable-emojis.php';
require_once SNN_PATH . 'includes/disable-gravatar.php';
require_once SNN_PATH . 'includes/role-manager.php';
require_once SNN_PATH . 'includes/custom-code-snippets.php';
require_once SNN_PATH . 'includes/cookie-banner.php';
require_once SNN_PATH . 'includes/accessibility-settings.php';
require_once SNN_PATH . 'includes/activity-logs.php';
require_once SNN_PATH . 'includes/seo.php';


require_once SNN_PATH . 'includes/ai/ai-settings.php';
require_once SNN_PATH . 'includes/ai/ai-api.php';
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



require_once SNN_PATH . 'includes/block-editor-settings.php';
require_once SNN_PATH . 'includes/media-image-opt.php';
require_once SNN_PATH . 'includes/wp-admin-dashboard-widgets.php';




// Load Translations
load_theme_textdomain('snn', SNN_PATH . '/languages');
