<?php
/**
 * Title: Call to Action (Dark)
 * Slug: snn-block/cta-dark
 * Categories: call-to-action, banner
 * Description: A bold centered call-to-action section with dark background and accent button.
 * Keywords: cta, call-to-action, banner, button, signup
 * Viewport Width: 1200
 */
?>
<!-- wp:group {"align":"full","style":{"spacing":{"padding":{"top":"var:preset|spacing|xxx-large","bottom":"var:preset|spacing|xxx-large"}},"color":{"background":"#1E1E26"}},"layout":{"type":"constrained"}} -->
<div class="wp-block-group alignfull has-background" style="background-color:#1E1E26;padding-top:var(--wp--preset--spacing--xxx-large);padding-bottom:var(--wp--preset--spacing--xxx-large)"><!-- wp:group {"style":{"spacing":{"blockGap":"var:preset|spacing|large"}},"layout":{"type":"constrained","contentSize":"700px"}} -->
<div class="wp-block-group"><!-- wp:heading {"textAlign":"center","level":2,"style":{"typography":{"fontSize":"var:preset|font-size|custom-4","lineHeight":"1.15"}},"textColor":"base"} -->
<h2 class="wp-block-heading has-text-align-center has-base-color has-text-color" style="font-size:var(--wp--preset--font-size--custom-4);line-height:1.15"><?php esc_html_e( 'Ready to Start Your Project?', 'snn' ); ?></h2>
<!-- /wp:heading -->

<!-- wp:paragraph {"align":"center","style":{"typography":{"fontSize":"var:preset|font-size|custom-1","lineHeight":"1.6"}},"textColor":"base"} -->
<p class="has-text-align-center has-base-color has-text-color" style="font-size:var(--wp--preset--font-size--custom-1);line-height:1.6"><?php esc_html_e( 'Let\'s build something great together. Get in touch and we\'ll discuss your vision.', 'snn' ); ?></p>
<!-- /wp:paragraph -->

<!-- wp:buttons {"layout":{"type":"flex","justifyContent":"center"}} -->
<div class="wp-block-buttons"><!-- wp:button {"backgroundColor":"primary","textColor":"base","style":{"typography":{"fontWeight":"600","fontSize":"var:preset|font-size|custom-1"}}} -->
<div class="wp-block-button"><a class="wp-block-button__link has-base-color has-primary-background-color has-text-color has-background wp-element-button" style="font-size:var(--wp--preset--font-size--custom-1);font-weight:600"><?php esc_html_e( 'Contact Us →', 'snn' ); ?></a></div>
<!-- /wp:button --></div>
<!-- /wp:buttons --></div>
<!-- /wp:group --></div>
<!-- /wp:group -->