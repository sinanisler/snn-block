<?php
/**
 * Title: About Section (Image + Text)
 * Slug: snn-block/about-section
 * Categories: about, featured, text
 * Description: A two-column about section with image on one side and text content on the other.
 * Keywords: about, intro, company, image, text, profile
 * Viewport Width: 1200
 */
?>
<!-- wp:group {"align":"full","style":{"spacing":{"padding":{"top":"var:preset|spacing|xxx-large","bottom":"var:preset|spacing|xxx-large"}}},"layout":{"type":"constrained"}} -->
<div class="wp-block-group alignfull" style="padding-top:var(--wp--preset--spacing--xxx-large);padding-bottom:var(--wp--preset--spacing--xxx-large)"><!-- wp:columns {"style":{"spacing":{"blockGap":{"top":"var:preset|spacing|xxx-large","left":"var:preset|spacing|xxx-large"}}}} -->
<div class="wp-block-columns"><!-- wp:column {"verticalAlignment":"center","width":"50%"} -->
<div class="wp-block-column is-vertically-aligned-center" style="flex-basis:50%"><!-- wp:group {"style":{"spacing":{"blockGap":"var:preset|spacing|medium"}},"layout":{"type":"constrained"}} -->
<div class="wp-block-group"><!-- wp:paragraph {"style":{"typography":{"fontWeight":"600","textTransform":"uppercase","letterSpacing":"2px"},"color":{"text":"#5344F4"}},"fontSize":"small"} -->
<p class="has-text-color" style="color:#5344F4;font-size:var(--wp--preset--font-size--small);font-weight:600;letter-spacing:2px;text-transform:uppercase"><?php esc_html_e( 'About Us', 'snn' ); ?></p>
<!-- /wp:paragraph -->

<!-- wp:heading {"style":{"typography":{"fontSize":"var:preset|font-size|custom-4","lineHeight":"1.15"}},"textColor":"main"} -->
<h2 class="wp-block-heading has-main-color has-text-color" style="font-size:var(--wp--preset--font-size--custom-4);line-height:1.15"><?php esc_html_e( 'We Build Digital Experiences That Matter', 'snn' ); ?></h2>
<!-- /wp:heading -->

<!-- wp:paragraph {"style":{"typography":{"lineHeight":"1.7"},"color":{"text":"#545473"}}} -->
<p style="color:#545473;line-height:1.7"><?php esc_html_e( 'Since 2010, we\'ve been crafting custom WordPress solutions for businesses of all sizes. Our team combines design thinking with technical excellence to deliver websites that are not just beautiful but also performant, accessible, and easy to manage.', 'snn' ); ?></p>
<!-- /wp:paragraph -->

<!-- wp:list {"style":{"spacing":{"padding":{"left":"var:preset|spacing|medium"}},"typography":{"lineHeight":"1.8"},"color":{"text":"#545473"}}} -->
<ul style="color:#545473;line-height:1.8;padding-left:var(--wp--preset--spacing--medium)"><!-- wp:list-item -->
<li><?php esc_html_e( 'Full-service design and development', 'snn' ); ?></li>
<!-- /wp:list-item -->

<!-- wp:list-item -->
<li><?php esc_html_e( 'SEO-optimized from day one', 'snn' ); ?></li>
<!-- /wp:list-item -->

<!-- wp:list-item -->
<li><?php esc_html_e( 'Ongoing support and maintenance', 'snn' ); ?></li>
<!-- /wp:list-item --></ul>
<!-- /wp:list -->

<!-- wp:button {"backgroundColor":"primary","textColor":"base","style":{"typography":{"fontWeight":"600"}}} -->
<div class="wp-block-button"><a class="wp-block-button__link has-base-color has-primary-background-color has-text-color has-background wp-element-button" style="font-weight:600"><?php esc_html_e( 'Learn More About Us →', 'snn' ); ?></a></div>
<!-- /wp:button --></div>
<!-- /wp:group --></div>
<!-- /wp:column -->

<!-- wp:column {"verticalAlignment":"center","width":"50%"} -->
<div class="wp-block-column is-vertically-aligned-center" style="flex-basis:50%"><!-- wp:group {"style":{"border":{"radius":"16px"},"spacing":{"padding":{"top":"var:preset|spacing|xxx-large","bottom":"var:preset|spacing|xxx-large","left":"var:preset|spacing|large","right":"var:preset|spacing|large"}},"color":{"gradient":"linear-gradient(135deg,rgb(83,68,244) 0%,rgb(173,52,250) 100%)"}},"layout":{"type":"constrained"}} -->
<div class="wp-block-group has-background" style="border-radius:16px;background:linear-gradient(135deg,rgb(83,68,244) 0%,rgb(173,52,250) 100%);padding-top:var(--wp--preset--spacing--xxx-large);padding-right:var(--wp--preset--spacing--large);padding-bottom:var(--wp--preset--spacing--xxx-large);padding-left:var(--wp--preset--spacing--large)"><!-- wp:group {"style":{"spacing":{"blockGap":"var:preset|spacing|large"}},"layout":{"type":"constrained"}} -->
<div class="wp-block-group"><!-- wp:paragraph {"align":"center","style":{"typography":{"fontSize":"64px"}}} -->
<p class="has-text-align-center" style="font-size:64px">🚀</p>
<!-- /wp:paragraph -->

<!-- wp:heading {"textAlign":"center","level":3,"style":{"typography":{"fontSize":"var:preset|font-size|custom-3"}},"textColor":"base"} -->
<h3 class="wp-block-heading has-text-align-center has-base-color has-text-color" style="font-size:var(--wp--preset--font-size--custom-3)"><?php esc_html_e( 'Your Vision, Our Expertise', 'snn' ); ?></h3>
<!-- /wp:heading -->

<!-- wp:paragraph {"align":"center","textColor":"base","style":{"typography":{"lineHeight":"1.6"}}} -->
<p class="has-text-align-center has-base-color has-text-color" style="line-height:1.6"><?php esc_html_e( 'We don\'t just build websites — we create growth engines that help your business thrive online.', 'snn' ); ?></p>
<!-- /wp:paragraph --></div>
<!-- /wp:group --></div>
<!-- /wp:group --></div>
<!-- /wp:column --></div>
<!-- /wp:columns --></div>
<!-- /wp:group -->