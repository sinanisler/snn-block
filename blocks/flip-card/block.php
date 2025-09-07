<?php
// Register Flip Card Block
add_action('init', function() {
    register_block_type(__DIR__, [
        'render_callback' => 'snn_flip_card_render',
    ]);
});

function snn_flip_card_render($attributes) {
    $front = $attributes['frontText'] ?? 'Front';
    $back = $attributes['backText'] ?? 'Back';
    $direction = esc_html($attributes['flipDirection'] ?? 'horizontal');
    ob_start();
    ?>
    <div class="snn-flip-card snn-flip-<?php echo $direction; ?>">
        <div class="snn-flip-card-inner">
            <div class="snn-flip-card-front"><?php echo $front; ?></div>
            <div class="snn-flip-card-back"><?php echo $back; ?></div>
        </div>
    </div>
    <?php
    return ob_get_clean();
}

// Enqueue styles
add_action('enqueue_block_assets', function() {
    wp_enqueue_style('snn-flip-card', get_template_directory_uri() . '/blocks/flip-card/block.css');
});

// Enqueue block editor script with JSX
add_action('enqueue_block_editor_assets', function() {
    // Add the JSX script with Babel transformation
    add_action('admin_footer', function() {
        $jsx_content = file_get_contents(__DIR__ . '/editor.jsx');
        echo '<script type="text/babel">' . $jsx_content . '</script>';
    });
});
