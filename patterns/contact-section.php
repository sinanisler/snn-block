<?php
/**
 * Title: Contact Section
 * Slug: snn-block/contact-section
 * Categories: contact, call-to-action, text
 * Description: A two-column contact section with info on one side and a form placeholder on the other.
 * Keywords: contact, form, email, address, get in touch
 * Viewport Width: 1200
 */
?>
<!-- wp:group {"align":"full","style":{"spacing":{"padding":{"top":"var:preset|spacing|xxx-large","bottom":"var:preset|spacing|xxx-large"}},"color":{"background":"#f8f7fc"}},"layout":{"type":"constrained"}} -->
<div class="wp-block-group alignfull has-background" style="background-color:#f8f7fc;padding-top:var(--wp--preset--spacing--xxx-large);padding-bottom:var(--wp--preset--spacing--xxx-large)"><!-- wp:columns {"style":{"spacing":{"blockGap":{"top":"var:preset|spacing|xxx-large","left":"var:preset|spacing|xxx-large"}}}} -->
<div class="wp-block-columns"><!-- wp:column {"verticalAlignment":"center","width":"40%"} -->
<div class="wp-block-column is-vertically-aligned-center" style="flex-basis:40%"><!-- wp:group {"style":{"spacing":{"blockGap":"var:preset|spacing|large"}},"layout":{"type":"constrained"}} -->
<div class="wp-block-group"><!-- wp:heading {"style":{"typography":{"fontSize":"var:preset|font-size|custom-4","lineHeight":"1.15"}},"textColor":"main"} -->
<h2 class="wp-block-heading has-main-color has-text-color" style="font-size:var(--wp--preset--font-size--custom-4);line-height:1.15"><?php esc_html_e( 'Get in Touch', 'snn' ); ?></h2>
<!-- /wp:heading -->

<!-- wp:paragraph {"style":{"typography":{"lineHeight":"1.7"},"color":{"text":"#545473"}}} -->
<p style="color:#545473;line-height:1.7"><?php esc_html_e( 'Have a project in mind? We\'d love to hear about it. Send us a message and we\'ll get back to you within 24 hours.', 'snn' ); ?></p>
<!-- /wp:paragraph -->

<!-- wp:group {"style":{"spacing":{"blockGap":"var:preset|spacing|small"}},"layout":{"type":"flex","flexWrap":"nowrap"}} -->
<div class="wp-block-group"><!-- wp:group {"style":{"spacing":{"padding":{"top":"var:preset|spacing|small","bottom":"var:preset|spacing|small","left":"var:preset|spacing|small","right":"var:preset|spacing|small"}},"border":{"radius":"8px"},"color":{"background":"#e9e7ff"}},"layout":{"type":"constrained"} -->
<div class="wp-block-group has-background" style="border-radius:8px;background-color:#e9e7ff;padding-top:var(--wp--preset--spacing--small);padding-right:var(--wp--preset--spacing--small);padding-bottom:var(--wp--preset--spacing--small);padding-left:var(--wp--preset--spacing--small)"><!-- wp:paragraph {"style":{"typography":{"fontSize":"20px"}}} -->
<p style="font-size:20px">📧</p>
<!-- /wp:paragraph --></div>
<!-- /wp:group -->

<!-- wp:group {"style":{"spacing":{"blockGap":"2px"}},"layout":{"type":"flex","orientation":"vertical"}} -->
<div class="wp-block-group"><!-- wp:paragraph {"style":{"typography":{"fontWeight":"600"}},"textColor":"main"} -->
<p class="has-main-color has-text-color" style="font-weight:600"><?php esc_html_e( 'Email', 'snn' ); ?></p>
<!-- /wp:paragraph -->

<!-- wp:paragraph {"style":{"color":{"text":"#545473"}},"fontSize":"small"} -->
<p class="has-text-color" style="color:#545473;font-size:var(--wp--preset--font-size--small)">hello@example.com</p>
<!-- /wp:paragraph --></div>
<!-- /wp:group --></div>
<!-- /wp:group -->

<!-- wp:group {"style":{"spacing":{"blockGap":"var:preset|spacing|small"}},"layout":{"type":"flex","flexWrap":"nowrap"}} -->
<div class="wp-block-group"><!-- wp:group {"style":{"spacing":{"padding":{"top":"var:preset|spacing|small","bottom":"var:preset|spacing|small","left":"var:preset|spacing|small","right":"var:preset|spacing|small"}},"border":{"radius":"8px"},"color":{"background":"#e9e7ff"}},"layout":{"type":"constrained"} -->
<div class="wp-block-group has-background" style="border-radius:8px;background-color:#e9e7ff;padding-top:var(--wp--preset--spacing--small);padding-right:var(--wp--preset--spacing--small);padding-bottom:var(--wp--preset--spacing--small);padding-left:var(--wp--preset--spacing--small)"><!-- wp:paragraph {"style":{"typography":{"fontSize":"20px"}}} -->
<p style="font-size:20px">📍</p>
<!-- /wp:paragraph --></div>
<!-- /wp:group -->

<!-- wp:group {"style":{"spacing":{"blockGap":"2px"}},"layout":{"type":"flex","orientation":"vertical"}} -->
<div class="wp-block-group"><!-- wp:paragraph {"style":{"typography":{"fontWeight":"600"}},"textColor":"main"} -->
<p class="has-main-color has-text-color" style="font-weight:600"><?php esc_html_e( 'Office', 'snn' ); ?></p>
<!-- /wp:paragraph -->

<!-- wp:paragraph {"style":{"color":{"text":"#545473"}},"fontSize":"small"} -->
<p class="has-text-color" style="color:#545473;font-size:var(--wp--preset--font-size--small)"><?php esc_html_e( '123 Tech Street, San Francisco, CA 94105', 'snn' ); ?></p>
<!-- /wp:paragraph --></div>
<!-- /wp:group --></div>
<!-- /wp:group -->

<!-- wp:group {"style":{"spacing":{"blockGap":"var:preset|spacing|small"}},"layout":{"type":"flex","flexWrap":"nowrap"}} -->
<div class="wp-block-group"><!-- wp:group {"style":{"spacing":{"padding":{"top":"var:preset|spacing|small","bottom":"var:preset|spacing|small","left":"var:preset|spacing|small","right":"var:preset|spacing|small"}},"border":{"radius":"8px"},"color":{"background":"#e9e7ff"}},"layout":{"type":"constrained"} -->
<div class="wp-block-group has-background" style="border-radius:8px;background-color:#e9e7ff;padding-top:var(--wp--preset--spacing--small);padding-right:var(--wp--preset--spacing--small);padding-bottom:var(--wp--preset--spacing--small);padding-left:var(--wp--preset--spacing--small)"><!-- wp:paragraph {"style":{"typography":{"fontSize":"20px"}}} -->
<p style="font-size:20px">📞</p>
<!-- /wp:paragraph --></div>
<!-- /wp:group -->

<!-- wp:group {"style":{"spacing":{"blockGap":"2px"}},"layout":{"type":"flex","orientation":"vertical"}} -->
<div class="wp-block-group"><!-- wp:paragraph {"style":{"typography":{"fontWeight":"600"}},"textColor":"main"} -->
<p class="has-main-color has-text-color" style="font-weight:600"><?php esc_html_e( 'Phone', 'snn' ); ?></p>
<!-- /wp:paragraph -->

<!-- wp:paragraph {"style":{"color":{"text":"#545473"}},"fontSize":"small"} -->
<p class="has-text-color" style="color:#545473;font-size:var(--wp--preset--font-size--small)">+1 (555) 000-0000</p>
<!-- /wp:paragraph --></div>
<!-- /wp:group --></div>
<!-- /wp:group --></div>
<!-- /wp:group --></div>
<!-- /wp:column -->

<!-- wp:column {"verticalAlignment":"center","width":"60%"} -->
<div class="wp-block-column is-vertically-aligned-center" style="flex-basis:60%"><!-- wp:group {"style":{"spacing":{"blockGap":"var:preset|spacing|medium","padding":{"top":"var:preset|spacing|x-large","bottom":"var:preset|spacing|x-large","left":"var:preset|spacing|x-large","right":"var:preset|spacing|x-large"}},"border":{"radius":"16px"},"color":{"background":"#ffffff"}},"layout":{"type":"constrained"}} -->
<div class="wp-block-group has-background" style="border-radius:16px;background-color:#ffffff;padding-top:var(--wp--preset--spacing--x-large);padding-right:var(--wp--preset--spacing--x-large);padding-bottom:var(--wp--preset--spacing--x-large);padding-left:var(--wp--preset--spacing--x-large)"><!-- wp:heading {"level":3,"style":{"typography":{"fontSize":"var:preset|font-size|custom-2"}},"textColor":"main"} -->
<h3 class="wp-block-heading has-main-color has-text-color" style="font-size:var(--wp--preset--font-size--custom-2)"><?php esc_html_e( 'Send Us a Message', 'snn' ); ?></h3>
<!-- /wp:heading -->

<!-- wp:paragraph {"style":{"typography":{"lineHeight":"1.6"},"color":{"text":"#545473"}}} -->
<p style="color:#545473;line-height:1.6"><?php esc_html_e( 'Fill out the form below and our team will get back to you shortly.', 'snn' ); ?></p>
<!-- /wp:paragraph -->

<!-- wp:group {"style":{"spacing":{"blockGap":"var:preset|spacing|medium"}},"layout":{"type":"constrained"}} -->
<div class="wp-block-group"><!-- wp:group {"style":{"spacing":{"blockGap":"var:preset|spacing|small"}},"layout":{"type":"flex","flexWrap":"nowrap"}} -->
<div class="wp-block-group"><!-- wp:group {"style":{"spacing":{"padding":{"top":"var:preset|spacing|medium","bottom":"var:preset|spacing|medium","left":"var:preset|spacing|medium","right":"var:preset|spacing|medium"}},"border":{"radius":"8px","width":"1px"}},"layout":{"type":"constrained","justifyContent":"stretch"}} -->
<div class="wp-block-group" style="border-width:1px;border-radius:8px;padding-top:var(--wp--preset--spacing--medium);padding-right:var(--wp--preset--spacing--medium);padding-bottom:var(--wp--preset--spacing--medium);padding-left:var(--wp--preset--spacing--medium)"><!-- wp:paragraph {"style":{"color":{"text":"#545473"}}} -->
<p style="color:#545473"><?php esc_html_e( 'Your Name', 'snn' ); ?></p>
<!-- /wp:paragraph --></div>
<!-- /wp:group -->

<!-- wp:group {"style":{"spacing":{"padding":{"top":"var:preset|spacing|medium","bottom":"var:preset|spacing|medium","left":"var:preset|spacing|medium","right":"var:preset|spacing|medium"}},"border":{"radius":"8px","width":"1px"}},"layout":{"type":"constrained","justifyContent":"stretch"}} -->
<div class="wp-block-group" style="border-width:1px;border-radius:8px;padding-top:var(--wp--preset--spacing--medium);padding-right:var(--wp--preset--spacing--medium);padding-bottom:var(--wp--preset--spacing--medium);padding-left:var(--wp--preset--spacing--medium)"><!-- wp:paragraph {"style":{"color":{"text":"#545473"}}} -->
<p style="color:#545473"><?php esc_html_e( 'Your Email', 'snn' ); ?></p>
<!-- /wp:paragraph --></div>
<!-- /wp:group --></div>
<!-- /wp:group -->

<!-- wp:group {"style":{"spacing":{"padding":{"top":"var:preset|spacing|medium","bottom":"var:preset|spacing|x-large","left":"var:preset|spacing|medium","right":"var:preset|spacing|medium"}},"border":{"radius":"8px","width":"1px"}},"layout":{"type":"constrained"}} -->
<div class="wp-block-group" style="border-width:1px;border-radius:8px;padding-top:var(--wp--preset--spacing--medium);padding-right:var(--wp--preset--spacing--medium);padding-bottom:var(--wp--preset--spacing--x-large);padding-left:var(--wp--preset--spacing--medium)"><!-- wp:paragraph {"style":{"color":{"text":"#545473"}}} -->
<p style="color:#545473"><?php esc_html_e( 'Your Message', 'snn' ); ?></p>
<!-- /wp:paragraph --></div>
<!-- /wp:group -->

<!-- wp:button {"backgroundColor":"primary","textColor":"base","style":{"typography":{"fontWeight":"600"}},"className":"is-style-fill"} -->
<div class="wp-block-button is-style-fill"><a class="wp-block-button__link has-base-color has-primary-background-color has-text-color has-background wp-element-button" style="font-weight:600"><?php esc_html_e( 'Send Message →', 'snn' ); ?></a></div>
<!-- /wp:button --></div>
<!-- /wp:group --></div>
<!-- /wp:group --></div>
<!-- /wp:column --></div>
<!-- /wp:columns --></div>
<!-- /wp:group -->