<?php
/**
 * Title: FAQ Section
 * Slug: snn-block/faq-section
 * Categories: text, services
 * Description: A clean FAQ accordion-style section using the Details block.
 * Keywords: faq, questions, help, support, accordion
 * Viewport Width: 1200
 */
?>
<!-- wp:group {"align":"full","style":{"spacing":{"padding":{"top":"var:preset|spacing|xxx-large","bottom":"var:preset|spacing|xxx-large"}}},"layout":{"type":"constrained"}} -->
<div class="wp-block-group alignfull" style="padding-top:var(--wp--preset--spacing--xxx-large);padding-bottom:var(--wp--preset--spacing--xxx-large)"><!-- wp:group {"style":{"spacing":{"blockGap":"var:preset|spacing|small"}},"layout":{"type":"constrained","contentSize":"700px"}} -->
<div class="wp-block-group"><!-- wp:heading {"textAlign":"center","style":{"typography":{"fontSize":"var:preset|font-size|custom-4"}},"textColor":"main"} -->
<h2 class="wp-block-heading has-text-align-center has-main-color has-text-color" style="font-size:var(--wp--preset--font-size--custom-4)"><?php esc_html_e( 'Frequently Asked Questions', 'snn' ); ?></h2>
<!-- /wp:heading -->

<!-- wp:paragraph {"align":"center","style":{"color":{"text":"#545473"}}} -->
<p class="has-text-align-center has-text-color" style="color:#545473"><?php esc_html_e( 'Got questions? We\'ve got answers.', 'snn' ); ?></p>
<!-- /wp:paragraph --></div>
<!-- /wp:group -->

<!-- wp:spacer {"height":"var:preset|spacing|x-large"} -->
<div style="height:var(--wp--preset--spacing--x-large)" aria-hidden="true" class="wp-block-spacer"></div>
<!-- /wp:spacer -->

<!-- wp:group {"style":{"spacing":{"blockGap":"var:preset|spacing|small"}},"layout":{"type":"constrained","contentSize":"800px"}} -->
<div class="wp-block-group"><!-- wp:details {"style":{"spacing":{"padding":{"top":"var:preset|spacing|medium","bottom":"var:preset|spacing|medium","left":"var:preset|spacing|medium","right":"var:preset|spacing|medium"}},"border":{"radius":"8px","width":"1px"}}} -->
<details class="wp-block-details" style="border-width:1px;border-radius:8px;padding-top:var(--wp--preset--spacing--medium);padding-right:var(--wp--preset--spacing--medium);padding-bottom:var(--wp--preset--spacing--medium);padding-left:var(--wp--preset--spacing--medium)"><summary><?php esc_html_e( 'What services do you offer?', 'snn' ); ?></summary><!-- wp:paragraph {"style":{"spacing":{"padding":{"top":"var:preset|spacing|small"}},"color":{"text":"#545473"},"typography":{"lineHeight":"1.7"}}} -->
<p style="color:#545473;line-height:1.7;padding-top:var(--wp--preset--spacing--small)"><?php esc_html_e( 'We offer a full range of digital services including custom WordPress development, UI/UX design, SEO strategy, performance optimization, and ongoing maintenance and support.', 'snn' ); ?></p>
<!-- /wp:paragraph --></details>
<!-- /wp:details -->

<!-- wp:details {"style":{"spacing":{"padding":{"top":"var:preset|spacing|medium","bottom":"var:preset|spacing|medium","left":"var:preset|spacing|medium","right":"var:preset|spacing|medium"}},"border":{"radius":"8px","width":"1px"}}} -->
<details class="wp-block-details" style="border-width:1px;border-radius:8px;padding-top:var(--wp--preset--spacing--medium);padding-right:var(--wp--preset--spacing--medium);padding-bottom:var(--wp--preset--spacing--medium);padding-left:var(--wp--preset--spacing--medium)"><summary><?php esc_html_e( 'How long does a typical project take?', 'snn' ); ?></summary><!-- wp:paragraph {"style":{"spacing":{"padding":{"top":"var:preset|spacing|small"}},"color":{"text":"#545473"},"typography":{"lineHeight":"1.7"}}} -->
<p style="color:#545473;line-height:1.7;padding-top:var(--wp--preset--spacing--small)"><?php esc_html_e( 'Project timelines vary based on scope and complexity. A typical website project takes 4-8 weeks from kickoff to launch. We\'ll provide a detailed timeline during our initial consultation.', 'snn' ); ?></p>
<!-- /wp:paragraph --></details>
<!-- /wp:details -->

<!-- wp:details {"style":{"spacing":{"padding":{"top":"var:preset|spacing|medium","bottom":"var:preset|spacing|medium","left":"var:preset|spacing|medium","right":"var:preset|spacing|medium"}},"border":{"radius":"8px","width":"1px"}}} -->
<details class="wp-block-details" style="border-width:1px;border-radius:8px;padding-top:var(--wp--preset--spacing--medium);padding-right:var(--wp--preset--spacing--medium);padding-bottom:var(--wp--preset--spacing--medium);padding-left:var(--wp--preset--spacing--medium)"><summary><?php esc_html_e( 'Do you provide ongoing support?', 'snn' ); ?></summary><!-- wp:paragraph {"style":{"spacing":{"padding":{"top":"var:preset|spacing|small"}},"color":{"text":"#545473"},"typography":{"lineHeight":"1.7"}}} -->
<p style="color:#545473;line-height:1.7;padding-top:var(--wp--preset--spacing--small)"><?php esc_html_e( 'Yes! We offer monthly maintenance and support plans that include security updates, performance monitoring, content updates, and priority support. We\'re here for the long haul.', 'snn' ); ?></p>
<!-- /wp:paragraph --></details>
<!-- /wp:details -->

<!-- wp:details {"style":{"spacing":{"padding":{"top":"var:preset|spacing|medium","bottom":"var:preset|spacing|medium","left":"var:preset|spacing|medium","right":"var:preset|spacing|medium"}},"border":{"radius":"8px","width":"1px"}}} -->
<details class="wp-block-details" style="border-width:1px;border-radius:8px;padding-top:var(--wp--preset--spacing--medium);padding-right:var(--wp--preset--spacing--medium);padding-bottom:var(--wp--preset--spacing--medium);padding-left:var(--wp--preset--spacing--medium)"><summary><?php esc_html_e( 'Can you work with my existing WordPress site?', 'snn' ); ?></summary><!-- wp:paragraph {"style":{"spacing":{"padding":{"top":"var:preset|spacing|small"}},"color":{"text":"#545473"},"typography":{"lineHeight":"1.7"}}} -->
<p style="color:#545473;line-height:1.7;padding-top:var(--wp--preset--spacing--small)"><?php esc_html_e( 'Absolutely. We can audit, optimize, and enhance your existing WordPress site. Whether it\'s a redesign, performance fix, or new feature, we\'re happy to jump in and help.', 'snn' ); ?></p>
<!-- /wp:paragraph --></details>
<!-- /wp:details -->

<!-- wp:details {"style":{"spacing":{"padding":{"top":"var:preset|spacing|medium","bottom":"var:preset|spacing|medium","left":"var:preset|spacing|medium","right":"var:preset|spacing|medium"}},"border":{"radius":"8px","width":"1px"}}} -->
<details class="wp-block-details" style="border-width:1px;border-radius:8px;padding-top:var(--wp--preset--spacing--medium);padding-right:var(--wp--preset--spacing--medium);padding-bottom:var(--wp--preset--spacing--medium);padding-left:var(--wp--preset--spacing--medium)"><summary><?php esc_html_e( 'What is your pricing model?', 'snn' ); ?></summary><!-- wp:paragraph {"style":{"spacing":{"padding":{"top":"var:preset|spacing|small"}},"color":{"text":"#545473"},"typography":{"lineHeight":"1.7"}}} -->
<p style="color:#545473;line-height:1.7;padding-top:var(--wp--preset--spacing--small)"><?php esc_html_e( 'We offer both project-based pricing and monthly retainer options. Each project is unique, so we provide custom quotes after understanding your specific needs and goals.', 'snn' ); ?></p>
<!-- /wp:paragraph --></details>
<!-- /wp:details --></div>
<!-- /wp:group --></div>
<!-- /wp:group -->