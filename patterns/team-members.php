<?php
/**
 * Title: Team Members (4-Column)
 * Slug: snn-block/team-members
 * Categories: team, about, columns
 * Description: A four-column team section with avatars, names, roles, and social links.
 * Keywords: team, members, staff, people, about
 * Viewport Width: 1200
 */
?>
<!-- wp:group {"align":"full","style":{"spacing":{"padding":{"top":"var:preset|spacing|xxx-large","bottom":"var:preset|spacing|xxx-large"}}},"layout":{"type":"constrained"}} -->
<div class="wp-block-group alignfull" style="padding-top:var(--wp--preset--spacing--xxx-large);padding-bottom:var(--wp--preset--spacing--xxx-large)"><!-- wp:group {"style":{"spacing":{"blockGap":"var:preset|spacing|small"}},"layout":{"type":"constrained","contentSize":"700px"}} -->
<div class="wp-block-group"><!-- wp:heading {"textAlign":"center","style":{"typography":{"fontSize":"var:preset|font-size|custom-4"}},"textColor":"main"} -->
<h2 class="wp-block-heading has-text-align-center has-main-color has-text-color" style="font-size:var(--wp--preset--font-size--custom-4)"><?php esc_html_e( 'Meet Our Team', 'snn' ); ?></h2>
<!-- /wp:heading -->

<!-- wp:paragraph {"align":"center","style":{"color":{"text":"#545473"}}} -->
<p class="has-text-align-center has-text-color" style="color:#545473"><?php esc_html_e( 'Passionate people building amazing digital experiences.', 'snn' ); ?></p>
<!-- /wp:paragraph --></div>
<!-- /wp:group -->

<!-- wp:spacer {"height":"var:preset|spacing|x-large"} -->
<div style="height:var(--wp--preset--spacing--x-large)" aria-hidden="true" class="wp-block-spacer"></div>
<!-- /wp:spacer -->

<!-- wp:columns {"style":{"spacing":{"blockGap":{"top":"var:preset|spacing|x-large","left":"var:preset|spacing|large"}}}} -->
<div class="wp-block-columns"><!-- wp:column -->
<div class="wp-block-column"><!-- wp:group {"style":{"spacing":{"blockGap":"var:preset|spacing|small"}},"layout":{"type":"flex","orientation":"vertical","justifyContent":"center"}} -->
<div class="wp-block-group"><!-- wp:avatar {"size":120,"style":{"border":{"radius":"100px"}}} /-->

<!-- wp:heading {"level":3,"textAlign":"center","style":{"typography":{"fontSize":"var:preset|font-size|custom-1"}},"textColor":"main"} -->
<h3 class="wp-block-heading has-text-align-center has-main-color has-text-color" style="font-size:var(--wp--preset--font-size--custom-1)"><?php esc_html_e( 'Alex Morgan', 'snn' ); ?></h3>
<!-- /wp:heading -->

<!-- wp:paragraph {"align":"center","style":{"color":{"text":"#5344F4"},"typography":{"fontWeight":"500"}},"fontSize":"small"} -->
<p class="has-text-align-center has-text-color" style="color:#5344F4;font-size:var(--wp--preset--font-size--small);font-weight:500"><?php esc_html_e( 'Founder & CEO', 'snn' ); ?></p>
<!-- /wp:paragraph -->

<!-- wp:social-links {"iconBackgroundColor":"primary","iconBackgroundColorValue":"#e9e7ff","style":{"spacing":{"blockGap":{"top":"var:preset|spacing|small","left":"var:preset|spacing|small"}}},"layout":{"type":"flex","justifyContent":"center"}} -->
<ul class="wp-block-social-links has-icon-background-color"><!-- wp:social-link {"url":"#","service":"linkedin"} /-->

<!-- wp:social-link {"url":"#","service":"x"} /-->

<!-- wp:social-link {"url":"#","service":"github"} /--></ul>
<!-- /wp:social-links --></div>
<!-- /wp:group --></div>
<!-- /wp:column -->

<!-- wp:column -->
<div class="wp-block-column"><!-- wp:group {"style":{"spacing":{"blockGap":"var:preset|spacing|small"}},"layout":{"type":"flex","orientation":"vertical","justifyContent":"center"}} -->
<div class="wp-block-group"><!-- wp:avatar {"size":120,"style":{"border":{"radius":"100px"}}} /-->

<!-- wp:heading {"level":3,"textAlign":"center","style":{"typography":{"fontSize":"var:preset|font-size|custom-1"}},"textColor":"main"} -->
<h3 class="wp-block-heading has-text-align-center has-main-color has-text-color" style="font-size:var(--wp--preset--font-size--custom-1)"><?php esc_html_e( 'Jamie Park', 'snn' ); ?></h3>
<!-- /wp:heading -->

<!-- wp:paragraph {"align":"center","style":{"color":{"text":"#5344F4"},"typography":{"fontWeight":"500"}},"fontSize":"small"} -->
<p class="has-text-align-center has-text-color" style="color:#5344F4;font-size:var(--wp--preset--font-size--small);font-weight:500"><?php esc_html_e( 'Lead Designer', 'snn' ); ?></p>
<!-- /wp:paragraph -->

<!-- wp:social-links {"iconBackgroundColor":"primary","iconBackgroundColorValue":"#e9e7ff","style":{"spacing":{"blockGap":{"top":"var:preset|spacing|small","left":"var:preset|spacing|small"}}},"layout":{"type":"flex","justifyContent":"center"}} -->
<ul class="wp-block-social-links has-icon-background-color"><!-- wp:social-link {"url":"#","service":"linkedin"} /-->

<!-- wp:social-link {"url":"#","service":"dribbble"} /-->

<!-- wp:social-link {"url":"#","service":"behance"} /--></ul>
<!-- /wp:social-links --></div>
<!-- /wp:group --></div>
<!-- /wp:column -->

<!-- wp:column -->
<div class="wp-block-column"><!-- wp:group {"style":{"spacing":{"blockGap":"var:preset|spacing|small"}},"layout":{"type":"flex","orientation":"vertical","justifyContent":"center"}} -->
<div class="wp-block-group"><!-- wp:avatar {"size":120,"style":{"border":{"radius":"100px"}}} /-->

<!-- wp:heading {"level":3,"textAlign":"center","style":{"typography":{"fontSize":"var:preset|font-size|custom-1"}},"textColor":"main"} -->
<h3 class="wp-block-heading has-text-align-center has-main-color has-text-color" style="font-size:var(--wp--preset--font-size--custom-1)"><?php esc_html_e( 'Sam Rivera', 'snn' ); ?></h3>
<!-- /wp:heading -->

<!-- wp:paragraph {"align":"center","style":{"color":{"text":"#5344F4"},"typography":{"fontWeight":"500"}},"fontSize":"small"} -->
<p class="has-text-align-center has-text-color" style="color:#5344F4;font-size:var(--wp--preset--font-size--small);font-weight:500"><?php esc_html_e( 'Senior Developer', 'snn' ); ?></p>
<!-- /wp:paragraph -->

<!-- wp:social-links {"iconBackgroundColor":"primary","iconBackgroundColorValue":"#e9e7ff","style":{"spacing":{"blockGap":{"top":"var:preset|spacing|small","left":"var:preset|spacing|small"}}},"layout":{"type":"flex","justifyContent":"center"}} -->
<ul class="wp-block-social-links has-icon-background-color"><!-- wp:social-link {"url":"#","service":"github"} /-->

<!-- wp:social-link {"url":"#","service":"x"} /-->

<!-- wp:social-link {"url":"#","service":"wordpress"} /--></ul>
<!-- /wp:social-links --></div>
<!-- /wp:group --></div>
<!-- /wp:column -->

<!-- wp:column -->
<div class="wp-block-column"><!-- wp:group {"style":{"spacing":{"blockGap":"var:preset|spacing|small"}},"layout":{"type":"flex","orientation":"vertical","justifyContent":"center"}} -->
<div class="wp-block-group"><!-- wp:avatar {"size":120,"style":{"border":{"radius":"100px"}}} /-->

<!-- wp:heading {"level":3,"textAlign":"center","style":{"typography":{"fontSize":"var:preset|font-size|custom-1"}},"textColor":"main"} -->
<h3 class="wp-block-heading has-text-align-center has-main-color has-text-color" style="font-size:var(--wp--preset--font-size--custom-1)"><?php esc_html_e( 'Taylor Kim', 'snn' ); ?></h3>
<!-- /wp:heading -->

<!-- wp:paragraph {"align":"center","style":{"color":{"text":"#5344F4"},"typography":{"fontWeight":"500"}},"fontSize":"small"} -->
<p class="has-text-align-center has-text-color" style="color:#5344F4;font-size:var(--wp--preset--font-size--small);font-weight:500"><?php esc_html_e( 'SEO Strategist', 'snn' ); ?></p>
<!-- /wp:paragraph -->

<!-- wp:social-links {"iconBackgroundColor":"primary","iconBackgroundColorValue":"#e9e7ff","style":{"spacing":{"blockGap":{"top":"var:preset|spacing|small","left":"var:preset|spacing|small"}}},"layout":{"type":"flex","justifyContent":"center"}} -->
<ul class="wp-block-social-links has-icon-background-color"><!-- wp:social-link {"url":"#","service":"linkedin"} /-->

<!-- wp:social-link {"url":"#","service":"x"} /-->

<!-- wp:social-link {"url":"#","service":"mail"} /--></ul>
<!-- /wp:social-links --></div>
<!-- /wp:group --></div>
<!-- /wp:column --></div>
<!-- /wp:columns --></div>
<!-- /wp:group -->