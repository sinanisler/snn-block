<?php
// Register Section Block
add_action('init', function() {
    register_block_type(__DIR__, [
        'render_callback' => 'snn_section_render',
    ]);
});

function snn_section_render($attributes, $content, $block) {
    $layoutType = $attributes['layoutType'] ?? 'flex';
    $style = '';
    if ($layoutType === 'flex') {
        $style .= 'display:flex;';
        $style .= 'flex-direction:' . ($attributes['flexDirection'] ?? 'row') . ';';
        $style .= 'flex-wrap:' . ($attributes['flexWrap'] ?? 'nowrap') . ';';
        $style .= 'justify-content:' . ($attributes['justifyContent'] ?? 'flex-start') . ';';
        $style .= 'align-items:' . ($attributes['alignItems'] ?? 'stretch') . ';';
        $style .= 'gap:' . (isset($attributes['gap']) ? intval($attributes['gap']) . 'px' : '0px') . ';';
    } else {
        $style .= 'display:grid;';
        $style .= 'grid-template-columns:repeat(' . ($attributes['gridColumns'] ?? 2) . ',1fr);';
        $style .= 'grid-template-rows:repeat(' . ($attributes['gridRows'] ?? 1) . ',1fr);';
        $style .= 'gap:' . (isset($attributes['gridGap']) ? intval($attributes['gridGap']) . 'px' : '0px') . ';';
        $style .= 'align-items:' . ($attributes['gridAlign'] ?? 'stretch') . ';';
        $style .= 'justify-items:' . ($attributes['gridJustify'] ?? 'stretch') . ';';
    }
    
    // Render inner blocks if content is empty
    if (empty($content) && !empty($block->inner_blocks)) {
        $content = '';
        foreach ($block->inner_blocks as $inner_block) {
            $content .= render_block($inner_block);
        }
    }
    
    ob_start();
    ?>
    <section class="snn-section" style="<?php echo esc_attr($style); ?>">
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
