<?php

add_action('wp_enqueue_scripts', function () {
  wp_enqueue_style('snn-block', get_stylesheet_uri(), [], filemtime(SNN_PATH . 'style.css'));
});
