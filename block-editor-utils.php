<?php


function snn_change_default_block() {
    $post_type_object = get_post_type_object( 'post' );
    $post_type_object->template = array(
        array( 'custom/section' ),
    );
}
add_action( 'init', 'snn_change_default_block' );












