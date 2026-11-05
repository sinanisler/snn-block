<?php

define( 'SNN_PATH', trailingslashit( get_stylesheet_directory() ) );
define( 'SNN_PATH_ASSETS', trailingslashit( SNN_PATH . 'assets' ) );
define( 'SNN_URL', trailingslashit( get_stylesheet_directory_uri() ) );
define( 'SNN_URL_ASSETS', trailingslashit( SNN_URL . 'assets' ) );


// Feature on/off switches (admin.php?page=snn-settings > Customizations)
require_once SNN_PATH . 'includes/features/feature-toggles.php';

// Clean slate: core and theme defaults removed on the front end and in the block editor (always on)
require_once SNN_PATH . 'includes/features/clean-slate.php';

// Blocks: global styles, block defaults, fonts and (next) our own blocks and their controls (always on)
require_once SNN_PATH . 'includes/blocks/blocks.php';


// Main Features and Settings
require_once SNN_PATH . 'includes/features/settings-page.php';

if ( snn_feature_enabled('snn-other-settings') )         require_once SNN_PATH . 'includes/features/other-settings.php';
if ( snn_feature_enabled('snn-security') )               require_once SNN_PATH . 'includes/features/security-page.php';
if ( snn_feature_enabled('snn-custom-post-types') )      require_once SNN_PATH . 'includes/features/post-types-settings.php';
if ( snn_feature_enabled('snn-custom-fields') )          require_once SNN_PATH . 'includes/features/custom-field-settings.php';
if ( snn_feature_enabled('snn-taxonomies') )             require_once SNN_PATH . 'includes/features/taxonomy-settings.php';
if ( snn_feature_enabled('snn-login-settings') )         require_once SNN_PATH . 'includes/features/login-settings.php';
if ( snn_feature_enabled('snn-security') )               require_once SNN_PATH . 'includes/features/remove-wp-version.php';
if ( snn_feature_enabled('snn-security') )               require_once SNN_PATH . 'includes/features/disable-xmlrpc.php';
if ( snn_feature_enabled('snn-security') )               require_once SNN_PATH . 'includes/features/disable-file-editing.php';
if ( snn_feature_enabled('snn-security') )               require_once SNN_PATH . 'includes/features/remove-rss.php';
if ( snn_feature_enabled('snn-security') )               require_once SNN_PATH . 'includes/features/disable-wp-json-if-not-logged-in.php';
if ( snn_feature_enabled('snn-login-settings') )         require_once SNN_PATH . 'includes/features/login-logo-change-url-change.php';
require_once SNN_PATH . 'includes/features/enqueue-scripts.php';
if ( snn_feature_enabled('snn-media-settings') )         require_once SNN_PATH . 'includes/features/file-size-column-media.php';
if ( snn_feature_enabled('snn-404-logs') )               require_once SNN_PATH . 'includes/features/404-logging.php';
if ( snn_feature_enabled('snn-search-logs') )            require_once SNN_PATH . 'includes/features/search-loggins.php';
if ( snn_feature_enabled('snn-301-redirects') )          require_once SNN_PATH . 'includes/features/301-redirect.php';
if ( snn_feature_enabled('snn-smtp-settings') )          require_once SNN_PATH . 'includes/features/smtp-settings.php';
if ( snn_feature_enabled('snn-mail-logs') )              require_once SNN_PATH . 'includes/features/mail-logging.php';
if ( snn_feature_enabled('snn-media-settings') )         require_once SNN_PATH . 'includes/features/media-settings.php';
if ( snn_feature_enabled('snn-security') )               require_once SNN_PATH . 'includes/features/disable-emojis.php';
if ( snn_feature_enabled('snn-security') )               require_once SNN_PATH . 'includes/features/disable-gravatar.php';
if ( snn_feature_enabled('snn-role-management') )        require_once SNN_PATH . 'includes/features/role-manager.php';
if ( snn_feature_enabled('snn-custom-codes-snippets') )  require_once SNN_PATH . 'includes/features/custom-code-snippets.php';
if ( snn_feature_enabled('snn-cookie-settings') )        require_once SNN_PATH . 'includes/features/cookie-banner.php';
if ( snn_feature_enabled('snn-accessibility-settings') ) require_once SNN_PATH . 'includes/features/accessibility-settings.php';
if ( snn_feature_enabled('snn-activity-log') )           require_once SNN_PATH . 'includes/features/activity-logs.php';
if ( snn_feature_enabled('snn-seo-settings') )           require_once SNN_PATH . 'includes/features/seo.php';
if ( snn_feature_enabled('snn-interactions') )           require_once SNN_PATH . 'includes/features/interactions.php';
if ( snn_feature_enabled('snn-other-settings') )         require_once SNN_PATH . 'includes/features/draft-revision.php';


if ( snn_feature_enabled('snn-ai-settings') )      require_once SNN_PATH . 'includes/ai/api-call-templates.php';
if ( snn_feature_enabled('snn-ai-settings') )      require_once SNN_PATH . 'includes/ai/ai-settings.php';
if ( snn_feature_enabled('snn-ai-settings') )      require_once SNN_PATH . 'includes/ai/ai-api.php';
if ( snn_feature_enabled('snn-ai-settings') )      require_once SNN_PATH . 'includes/ai/ai-proxy.php';
if ( snn_feature_enabled('snn-ai-settings') )      require_once SNN_PATH . 'includes/ai/ai-seo-generation.php';
if ( snn_feature_enabled('snn-ai-settings') )      require_once SNN_PATH . 'includes/ai/ai-block-editor.php';
if ( snn_feature_enabled('snn-ai-settings') )      require_once SNN_PATH . 'includes/ai/custom-code-snippets-ai.php';
if ( snn_feature_enabled('snn-ai-agent-settings') ) require_once SNN_PATH . 'includes/ai/ai-agent-and-chat.php';

if ( snn_feature_enabled('snn-ai-agent-settings') ) {
require_once SNN_PATH . 'includes/ai/blocks/html-to-blocks.php';
require_once SNN_PATH . 'includes/ai/blocks/block-edit.php';
require_once SNN_PATH . 'includes/ai/pixabay/class-pixabay.php';
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
require_once SNN_PATH . 'includes/ai/abilities/pixabay-image.php';
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
require_once SNN_PATH . 'includes/ai/abilities/html-to-blocks.php';
require_once SNN_PATH . 'includes/ai/abilities/set-page-code.php';
require_once SNN_PATH . 'includes/ai/fonts/font-library.php';
require_once SNN_PATH . 'includes/ai/abilities/install-font.php';
require_once SNN_PATH . 'includes/ai/abilities/global-styles.php';
require_once SNN_PATH . 'includes/ai/mcp/mcp-loader.php';
}

// Page code (CSS, JavaScript, script files) is printed on the front end whatever the AI settings are.
require_once SNN_PATH . 'includes/ai/blocks/page-code.php';


// Utils
require_once SNN_PATH . 'includes/features/utils.php';



// Load Translations
add_action('after_setup_theme', function() {
    load_theme_textdomain('snn', SNN_PATH . '/languages');
});


if ( snn_feature_enabled('snn-block-editor-settings') ) require_once SNN_PATH . 'includes/features/block-editor-settings.php';
if ( snn_feature_enabled('snn-media-settings') )        require_once SNN_PATH . 'includes/features/media-image-opt.php';
require_once SNN_PATH . 'includes/features/wp-admin-dashboard-widgets.php';
