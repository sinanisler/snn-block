<?php
/**
 * Title: Pricing Table (3-Column)
 * Slug: snn-block/pricing-table
 * Categories: text, call-to-action, columns
 * Description: A three-column pricing table with feature lists and call-to-action buttons.
 * Keywords: pricing, plans, packages, subscription, comparison
 * Viewport Width: 1200
 */
?>
<!-- wp:group {"align":"full","style":{"spacing":{"padding":{"top":"var:preset|spacing|xxx-large","bottom":"var:preset|spacing|xxx-large"}},"color":{"background":"#f8f7fc"}},"layout":{"type":"constrained"}} -->
<div class="wp-block-group alignfull has-background" style="background-color:#f8f7fc;padding-top:var(--wp--preset--spacing--xxx-large);padding-bottom:var(--wp--preset--spacing--xxx-large)"><!-- wp:group {"style":{"spacing":{"blockGap":"var:preset|spacing|small"}},"layout":{"type":"constrained","contentSize":"700px"}} -->
<div class="wp-block-group"><!-- wp:heading {"textAlign":"center","style":{"typography":{"fontSize":"var:preset|font-size|custom-4"}},"textColor":"main"} -->
<h2 class="wp-block-heading has-text-align-center has-main-color has-text-color" style="font-size:var(--wp--preset--font-size--custom-4)"><?php esc_html_e( 'Simple, Transparent Pricing', 'snn' ); ?></h2>
<!-- /wp:heading -->

<!-- wp:paragraph {"align":"center","style":{"color":{"text":"#545473"}}} -->
<p class="has-text-align-center has-text-color" style="color:#545473"><?php esc_html_e( 'Choose the plan that fits your needs. No hidden fees.', 'snn' ); ?></p>
<!-- /wp:paragraph --></div>
<!-- /wp:group -->

<!-- wp:spacer {"height":"var:preset|spacing|x-large"} -->
<div style="height:var(--wp--preset--spacing--x-large)" aria-hidden="true" class="wp-block-spacer"></div>
<!-- /wp:spacer -->

<!-- wp:columns {"style":{"spacing":{"blockGap":{"top":"var:preset|spacing|x-large","left":"var:preset|spacing|large"}}}} -->
<div class="wp-block-columns"><!-- wp:column -->
<div class="wp-block-column"><!-- wp:group {"style":{"spacing":{"blockGap":"var:preset|spacing|medium","padding":{"top":"var:preset|spacing|x-large","bottom":"var:preset|spacing|x-large","left":"var:preset|spacing|large","right":"var:preset|spacing|large"}},"border":{"radius":"16px","width":"1px"},"color":{"background":"#ffffff"}},"layout":{"type":"constrained"}} -->
<div class="wp-block-group has-background" style="border-width:1px;border-radius:16px;background-color:#ffffff;padding-top:var(--wp--preset--spacing--x-large);padding-right:var(--wp--preset--spacing--large);padding-bottom:var(--wp--preset--spacing--x-large);padding-left:var(--wp--preset--spacing--large)"><!-- wp:heading {"level":3,"textAlign":"center","style":{"typography":{"fontSize":"var:preset|font-size|custom-2","fontWeight":"600"}},"textColor":"main"} -->
<h3 class="wp-block-heading has-text-align-center has-main-color has-text-color" style="font-size:var(--wp--preset--font-size--custom-2);font-weight:600"><?php esc_html_e( 'Starter', 'snn' ); ?></h3>
<!-- /wp:heading -->

<!-- wp:paragraph {"align":"center","style":{"color":{"text":"#545473"}}} -->
<p class="has-text-align-center has-text-color" style="color:#545473"><?php esc_html_e( 'Perfect for small projects', 'snn' ); ?></p>
<!-- /wp:paragraph -->

<!-- wp:group {"style":{"spacing":{"blockGap":"0"}},"layout":{"type":"flex","flexWrap":"nowrap","justifyContent":"center"}} -->
<div class="wp-block-group"><!-- wp:paragraph {"style":{"typography":{"fontSize":"var:preset|font-size|custom-5","fontWeight":"700","lineHeight":"1"}},"textColor":"main"} -->
<p class="has-main-color has-text-color" style="font-size:var(--wp--preset--font-size--custom-5);font-weight:700;line-height:1">$29</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph {"style":{"typography":{"fontSize":"var:preset|font-size|custom-1"},"color":{"text":"#545473"}}} -->
<p style="color:#545473;font-size:var(--wp--preset--font-size--custom-1)">/mo</p>
<!-- /wp:paragraph --></div>
<!-- /wp:group -->

<!-- wp:separator {"backgroundColor":"border-light","className":"is-style-wide"} -->
<hr class="wp-block-separator has-text-color has-border-light-color has-alpha-channel-opacity has-border-light-background-color has-background is-style-wide"/>
<!-- /wp:separator -->

<!-- wp:list {"style":{"spacing":{"padding":{"left":"var:preset|spacing|medium"}},"typography":{"lineHeight":"2"},"color":{"text":"#545473"}}} -->
<ul style="color:#545473;line-height:2;padding-left:var(--wp--preset--spacing--medium)"><!-- wp:list-item -->
<li><?php esc_html_e( '5 Pages', 'snn' ); ?></li>
<!-- /wp:list-item -->

<!-- wp:list-item -->
<li><?php esc_html_e( 'Basic SEO Setup', 'snn' ); ?></li>
<!-- /wp:list-item -->

<!-- wp:list-item -->
<li><?php esc_html_e( 'Email Support', 'snn' ); ?></li>
<!-- /wp:list-item -->

<!-- wp:list-item -->
<li><?php esc_html_e( '1 Revision', 'snn' ); ?></li>
<!-- /wp:list-item --></ul>
<!-- /wp:list -->

<!-- wp:button {"backgroundColor":"main","textColor":"base","width":100,"style":{"typography":{"fontWeight":"600"}}} -->
<div class="wp-block-button has-custom-width wp-block-button__width-100" style="font-weight:600"><a class="wp-block-button__link has-base-color has-main-background-color has-text-color has-background wp-element-button"><?php esc_html_e( 'Get Started', 'snn' ); ?></a></div>
<!-- /wp:button --></div>
<!-- /wp:group --></div>
<!-- /wp:column -->

<!-- wp:column -->
<div class="wp-block-column"><!-- wp:group {"style":{"spacing":{"blockGap":"var:preset|spacing|medium","padding":{"top":"var:preset|spacing|x-large","bottom":"var:preset|spacing|x-large","left":"var:preset|spacing|large","right":"var:preset|spacing|large"}},"border":{"radius":"16px","width":"2px","color":"#5344F4"},"color":{"background":"#ffffff"}},"layout":{"type":"constrained"}} -->
<div class="wp-block-group has-background" style="border-color:#5344F4;border-width:2px;border-radius:16px;background-color:#ffffff;padding-top:var(--wp--preset--spacing--x-large);padding-right:var(--wp--preset--spacing--large);padding-bottom:var(--wp--preset--spacing--x-large);padding-left:var(--wp--preset--spacing--large)"><!-- wp:paragraph {"align":"center","style":{"typography":{"fontWeight":"600"},"color":{"text":"#5344F4"}},"fontSize":"small"} -->
<p class="has-text-align-center has-text-color" style="color:#5344F4;font-size:var(--wp--preset--font-size--small);font-weight:600"><?php esc_html_e( 'MOST POPULAR', 'snn' ); ?></p>
<!-- /wp:paragraph -->

<!-- wp:heading {"level":3,"textAlign":"center","style":{"typography":{"fontSize":"var:preset|font-size|custom-2","fontWeight":"600"}},"textColor":"main"} -->
<h3 class="wp-block-heading has-text-align-center has-main-color has-text-color" style="font-size:var(--wp--preset--font-size--custom-2);font-weight:600"><?php esc_html_e( 'Professional', 'snn' ); ?></h3>
<!-- /wp:heading -->

<!-- wp:paragraph {"align":"center","style":{"color":{"text":"#545473"}}} -->
<p class="has-text-align-center has-text-color" style="color:#545473"><?php esc_html_e( 'Best for growing businesses', 'snn' ); ?></p>
<!-- /wp:paragraph -->

<!-- wp:group {"style":{"spacing":{"blockGap":"0"}},"layout":{"type":"flex","flexWrap":"nowrap","justifyContent":"center"}} -->
<div class="wp-block-group"><!-- wp:paragraph {"style":{"typography":{"fontSize":"var:preset|font-size|custom-5","fontWeight":"700","lineHeight":"1"}},"textColor":"main"} -->
<p class="has-main-color has-text-color" style="font-size:var(--wp--preset--font-size--custom-5);font-weight:700;line-height:1">$79</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph {"style":{"typography":{"fontSize":"var:preset|font-size|custom-1"},"color":{"text":"#545473"}}} -->
<p style="color:#545473;font-size:var(--wp--preset--font-size--custom-1)">/mo</p>
<!-- /wp:paragraph --></div>
<!-- /wp:group -->

<!-- wp:separator {"backgroundColor":"border-light","className":"is-style-wide"} -->
<hr class="wp-block-separator has-text-color has-border-light-color has-alpha-channel-opacity has-border-light-background-color has-background is-style-wide"/>
<!-- /wp:separator -->

<!-- wp:list {"style":{"spacing":{"padding":{"left":"var:preset|spacing|medium"}},"typography":{"lineHeight":"2"},"color":{"text":"#545473"}}} -->
<ul style="color:#545473;line-height:2;padding-left:var(--wp--preset--spacing--medium)"><!-- wp:list-item -->
<li><?php esc_html_e( '20 Pages', 'snn' ); ?></li>
<!-- /wp:list-item -->

<!-- wp:list-item -->
<li><?php esc_html_e( 'Advanced SEO', 'snn' ); ?></li>
<!-- /wp:list-item -->

<!-- wp:list-item -->
<li><?php esc_html_e( 'Priority Support', 'snn' ); ?></li>
<!-- /wp:list-item -->

<!-- wp:list-item -->
<li><?php esc_html_e( 'Unlimited Revisions', 'snn' ); ?></li>
<!-- /wp:list-item -->

<!-- wp:list-item -->
<li><?php esc_html_e( 'Custom Integrations', 'snn' ); ?></li>
<!-- /wp:list-item --></ul>
<!-- /wp:list -->

<!-- wp:button {"backgroundColor":"primary","textColor":"base","width":100,"style":{"typography":{"fontWeight":"600"}}} -->
<div class="wp-block-button has-custom-width wp-block-button__width-100" style="font-weight:600"><a class="wp-block-button__link has-base-color has-primary-background-color has-text-color has-background wp-element-button"><?php esc_html_e( 'Get Started', 'snn' ); ?></a></div>
<!-- /wp:button --></div>
<!-- /wp:group --></div>
<!-- /wp:column -->

<!-- wp:column -->
<div class="wp-block-column"><!-- wp:group {"style":{"spacing":{"blockGap":"var:preset|spacing|medium","padding":{"top":"var:preset|spacing|x-large","bottom":"var:preset|spacing|x-large","left":"var:preset|spacing|large","right":"var:preset|spacing|large"}},"border":{"radius":"16px","width":"1px"},"color":{"background":"#ffffff"}},"layout":{"type":"constrained"}} -->
<div class="wp-block-group has-background" style="border-width:1px;border-radius:16px;background-color:#ffffff;padding-top:var(--wp--preset--spacing--x-large);padding-right:var(--wp--preset--spacing--large);padding-bottom:var(--wp--preset--spacing--x-large);padding-left:var(--wp--preset--spacing--large)"><!-- wp:heading {"level":3,"textAlign":"center","style":{"typography":{"fontSize":"var:preset|font-size|custom-2","fontWeight":"600"}},"textColor":"main"} -->
<h3 class="wp-block-heading has-text-align-center has-main-color has-text-color" style="font-size:var(--wp--preset--font-size--custom-2);font-weight:600"><?php esc_html_e( 'Enterprise', 'snn' ); ?></h3>
<!-- /wp:heading -->

<!-- wp:paragraph {"align":"center","style":{"color":{"text":"#545473"}}} -->
<p class="has-text-align-center has-text-color" style="color:#545473"><?php esc_html_e( 'For large organizations', 'snn' ); ?></p>
<!-- /wp:paragraph -->

<!-- wp:group {"style":{"spacing":{"blockGap":"0"}},"layout":{"type":"flex","flexWrap":"nowrap","justifyContent":"center"}} -->
<div class="wp-block-group"><!-- wp:paragraph {"style":{"typography":{"fontSize":"var:preset|font-size|custom-5","fontWeight":"700","lineHeight":"1"}},"textColor":"main"} -->
<p class="has-main-color has-text-color" style="font-size:var(--wp--preset--font-size--custom-5);font-weight:700;line-height:1">$199</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph {"style":{"typography":{"fontSize":"var:preset|font-size|custom-1"},"color":{"text":"#545473"}}} -->
<p style="color:#545473;font-size:var(--wp--preset--font-size--custom-1)">/mo</p>
<!-- /wp:paragraph --></div>
<!-- /wp:group -->

<!-- wp:separator {"backgroundColor":"border-light","className":"is-style-wide"} -->
<hr class="wp-block-separator has-text-color has-border-light-color has-alpha-channel-opacity has-border-light-background-color has-background is-style-wide"/>
<!-- /wp:separator -->

<!-- wp:list {"style":{"spacing":{"padding":{"left":"var:preset|spacing|medium"}},"typography":{"lineHeight":"2"},"color":{"text":"#545473"}}} -->
<ul style="color:#545473;line-height:2;padding-left:var(--wp--preset--spacing--medium)"><!-- wp:list-item -->
<li><?php esc_html_e( 'Unlimited Pages', 'snn' ); ?></li>
<!-- /wp:list-item -->

<!-- wp:list-item -->
<li><?php esc_html_e( 'Full SEO Suite', 'snn' ); ?></li>
<!-- /wp:list-item -->

<!-- wp:list-item -->
<li><?php esc_html_e( '24/7 Dedicated Support', 'snn' ); ?></li>
<!-- /wp:list-item -->

<!-- wp:list-item -->
<li><?php esc_html_e( 'White Label Option', 'snn' ); ?></li>
<!-- /wp:list-item -->

<!-- wp:list-item -->
<li><?php esc_html_e( 'SLA Guarantee', 'snn' ); ?></li>
<!-- /wp:list-item --></ul>
<!-- /wp:list -->

<!-- wp:button {"backgroundColor":"main","textColor":"base","width":100,"style":{"typography":{"fontWeight":"600"}}} -->
<div class="wp-block-button has-custom-width wp-block-button__width-100" style="font-weight:600"><a class="wp-block-button__link has-base-color has-main-background-color has-text-color has-background wp-element-button"><?php esc_html_e( 'Contact Sales', 'snn' ); ?></a></div>
<!-- /wp:button --></div>
<!-- /wp:group --></div>
<!-- /wp:column --></div>
<!-- /wp:columns --></div>
<!-- /wp:group -->