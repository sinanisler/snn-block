<?php
// Register Section Block
add_action('init', function() {
    register_block_type(__DIR__, [
        'render_callback' => 'snn_section_render',
    ]);
});

function snn_section_render($attributes, $content) {
    ob_start();
    ?>
    <section class="snn-section">
        <?php echo $content; ?>
    </section>
    <?php
    return ob_get_clean();
}

// Enqueue styles
add_action('enqueue_block_assets', function() {
    wp_enqueue_style('snn-section', get_template_directory_uri() . '/blocks/section/block.css');
});

// Enqueue block editor script with JSX
add_action('enqueue_block_editor_assets', function() {
    add_action('admin_footer', function() {
        $jsx_content = file_get_contents(__DIR__ . '/editor.jsx');
        echo '<script type="text/babel">' . $jsx_content . '</script>';
    });
});
