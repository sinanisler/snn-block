<?php
add_action('enqueue_block_editor_assets', function() {
    // Enqueue Babel Standalone for JSX support in editor
    wp_enqueue_script(
        'babel-standalone',
        'https://unpkg.com/@babel/standalone/babel.min.js',
        [
            'wp-blocks',           // Core blocks functionality
            'wp-element',          // React-like element creation
            'wp-components',       // UI components (TextControl, SelectControl, etc.)
            'wp-block-editor',     // Block editor APIs (useBlockProps, InspectorControls, etc.)
            'wp-i18n',            // Internationalization functions (__(), _x(), etc.)
            'wp-editor',          // Rich text editor components
            'wp-data',            // Data layer and state management
            'wp-compose',         // Higher-order components and hooks
            'wp-rich-text',       // RichText component for editable text
            'wp-api-fetch',       // API requests and WordPress REST API
            'wp-url',             // URL utilities and manipulations
            'wp-dom-ready',       // DOM ready utilities
            'wp-hooks',           // WordPress hooks system (addFilter, addAction)
            'wp-notices',         // Notice/notification system
            'wp-keycodes',        // Keyboard event handling
            'wp-viewport'         // Viewport and responsive utilities
        ],
        null,
        true
    );
});
