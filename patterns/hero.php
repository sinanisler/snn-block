<?php
/**
 * Title: Hero Section
 * Slug: snn-block/hero
 * Categories: featured, banner, header
 * Description: A bold hero section with heading, description, and call-to-action buttons.
 * Keywords: hero, banner, header, intro, cover
 * Viewport Width: 1200
 */
?>
<!-- wp:cover {"overlayColor":"main","minHeight":70,"minHeightUnit":"vh","align":"full","style":{"spacing":{"padding":{"top":"var:preset|spacing|xxx-large","bottom":"var:preset|spacing|xxx-large"}}}} -->
<div class="wp-block-cover alignfull" style="padding-top:var(--wp--preset--spacing--xxx-large);padding-bottom:var(--wp--preset--spacing--xxx-large);min-height:70vh"><span aria-hidden="true" class="wp-block-cover__background has-main-background-color has-background-dim-100 has-background-dim"></span><div class="wp-block-cover__inner-container"><!-- wp:group {"style":{"spacing":{"blockGap":"var:preset|spacing|large"}},"layout":{"type":"constrained","contentSize":"800px"}} -->
<div class="wp-block-group"><!-- wp:heading {"textAlign":"center","level":1,"style":{"typography":{"fontSize":"var:preset|font-size|custom-5","lineHeight":"1.1"}},"textColor":"base"} -->
<h1 class="wp-block-heading has-text-align-center has-base-color has-text-color" style="font-size:var(--wp--preset--font-size--custom-5);line-height:1.1"><?php esc_html_e( 'Build Something Amazing', 'snn' ); ?></h1>
<!-- /wp:heading -->

<!-- wp:paragraph {"align":"center","style":{"typography":{"fontSize":"var:preset|font-size|custom-2","lineHeight":"1.6"}},"textColor":"base"} -->
<p class="has-text-align-center has-base-color has-text-color" style="font-size:var(--wp--preset--font-size--custom-2);line-height:1.6"><?php esc_html_e( 'We craft high-performance WordPress websites that drive results. Modern design, clean code, and measurable impact.', 'snn' ); ?></p>
<!-- /wp:paragraph -->

<!-- wp:buttons {"layout":{"type":"flex","justifyContent":"center"}} -->
<div class="wp-block-buttons"><!-- wp:button {"backgroundColor":"primary","textColor":"base","style":{"typography":{"fontWeight":"600"}},"className":"is-style-fill"} -->
<div class="wp-block-button is-style-fill"><a class="wp-block-button__link has-base-color has-primary-background-color has-text-color has-background wp-element-button" style="font-weight:600"><?php esc_html_e( 'Get Started', 'snn' ); ?></a></div>
<!-- /wp:button -->

<!-- wp:button {"textColor":"base","style":{"typography":{"fontWeight":"600"}},"className":"is-style-outline"} -->
<div class="wp-block-button is-style-outline"><a class="wp-block-button__link has-base-color has-text-color wp-element-button" style="font-weight:600"><?php esc_html_e( 'Learn More', 'snn' ); ?></a></div>
<!-- /wp:button --></div>
<!-- /wp:buttons --></div>
<!-- /wp:group --></div></div>
<!-- /wp:cover -->