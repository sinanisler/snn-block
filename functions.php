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
require_once SNN_PATH . 'includes/features/block-patterns.php';


// Load Translations
add_action('after_setup_theme', function() {
    load_theme_textdomain('snn', SNN_PATH . '/languages');
});








require_once SNN_PATH . 'includes/features/block-editor-settings.php';
require_once SNN_PATH . 'includes/features/media-image-opt.php';
require_once SNN_PATH . 'includes/features/wp-admin-dashboard-widgets.php';









