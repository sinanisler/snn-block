<?php
/**
 * SNN AI Block Editor Integration
 *
 * File: ai-block-editor.php
 *
 * Purpose: This file integrates AI-powered text generation and regeneration capabilities
 * directly into the WordPress block editor (Gutenberg). It adds AI action buttons to text-based
 * blocks such as Paragraph, Heading, List, Quote, and other text blocks.
 *
 * Features:
 * - Adds "AI Generate" buttons to text blocks in the block editor
 * - Provides a modal interface with action presets from ai-settings.php
 * - Allows users to generate, regenerate, or modify block content using AI
 * - Supports all configured AI providers (OpenAI, OpenRouter, Custom)
 * - Works with system prompts and action presets configured in settings
 *
 * Integration:
 * - Uses snn_get_ai_api_config() from ai-api.php for API configuration
 * - Provides REST API endpoint for block editor to communicate with AI
 * - Injects React/JavaScript code inline for block editor UI modifications
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit; // Exit if accessed directly.
}

/**
 * Register REST API endpoint for AI text generation in block editor
 */
function snn_register_block_editor_ai_endpoint() {
    register_rest_route('snn/v1', '/block-editor-ai', [
        'methods'  => 'POST',
        'callback' => 'snn_handle_block_editor_ai_request',
        'permission_callback' => function() {
            return current_user_can('edit_posts');
        },
    ]);
}
add_action('rest_api_init', 'snn_register_block_editor_ai_endpoint');

/**
 * Handle AI generation request from block editor
 */
function snn_handle_block_editor_ai_request($request) {
    $ai_enabled = get_option('snn_ai_enabled', 'no');
    if ($ai_enabled !== 'yes') {
        return new WP_REST_Response([
            'success' => false,
            'error'   => __('AI features are not enabled.', 'snn'),
        ], 403);
    }

    $params = $request->get_json_params();
    $user_prompt = isset($params['prompt']) ? sanitize_textarea_field($params['prompt']) : '';
    $existing_content = isset($params['existingContent']) ? $params['existingContent'] : '';
    $block_type = isset($params['blockType']) ? sanitize_text_field($params['blockType']) : 'paragraph';

    if (empty($user_prompt)) {
        return new WP_REST_Response([
            'success' => false,
            'error'   => __('Prompt cannot be empty.', 'snn'),
        ], 400);
    }

    // Get AI configuration
    $config = snn_get_ai_api_config();
    
    if (empty($config['apiKey']) || empty($config['model']) || empty($config['apiEndpoint'])) {
        return new WP_REST_Response([
            'success' => false,
            'error'   => __('AI API is not properly configured.', 'snn'),
        ], 500);
    }

    // Build the messages array
    $messages = [];
    
    // Add system prompt
    if (!empty($config['systemPrompt'])) {
        $messages[] = [
            'role'    => 'system',
            'content' => $config['systemPrompt'],
        ];
    }

    // Build user message with context
    $user_message = $user_prompt;
    if (!empty($existing_content)) {
        $user_message .= "\n\nExisting content to work with:\n" . $existing_content;
    }
    $user_message .= "\n\nBlock type: " . $block_type;

    $messages[] = [
        'role'    => 'user',
        'content' => $user_message,
    ];

    // Prepare API request body
    $body = [
        'model'    => $config['model'],
        'messages' => $messages,
    ];

    // Add response format if configured
    if (!empty($config['responseFormat'])) {
        $body['response_format'] = $config['responseFormat'];
    }

    // Prepare headers
    $headers = [
        'Content-Type'  => 'application/json',
        'Authorization' => 'Bearer ' . $config['apiKey'],
    ];

    // Make API request
    $response = wp_remote_post($config['apiEndpoint'], [
        'headers' => $headers,
        'body'    => wp_json_encode($body),
        'timeout' => 60,
    ]);

    if (is_wp_error($response)) {
        return new WP_REST_Response([
            'success' => false,
            'error'   => $response->get_error_message(),
        ], 500);
    }

    $response_code = wp_remote_retrieve_response_code($response);
    $response_body = wp_remote_retrieve_body($response);
    $data = json_decode($response_body, true);

    if ($response_code !== 200) {
        $error_message = isset($data['error']['message']) 
            ? $data['error']['message'] 
            : __('Unknown API error occurred.', 'snn');
        
        return new WP_REST_Response([
            'success' => false,
            'error'   => $error_message,
        ], $response_code);
    }

    // Extract generated content
    $generated_content = '';
    if (isset($data['choices'][0]['message']['content'])) {
        $generated_content = $data['choices'][0]['message']['content'];
    }

    if (empty($generated_content)) {
        return new WP_REST_Response([
            'success' => false,
            'error'   => __('No content generated by AI.', 'snn'),
        ], 500);
    }

    return new WP_REST_Response([
        'success' => true,
        'content' => $generated_content,
    ], 200);
}

/**
 * Enqueue block editor assets
 */
function snn_enqueue_block_editor_ai_assets() {
    $ai_enabled = get_option('snn_ai_enabled', 'no');
    if ($ai_enabled !== 'yes') {
        return;
    }

    // Get AI configuration for passing to JavaScript
    $config = snn_get_ai_api_config();
    
    // Enqueue inline script with React code
    add_action('admin_footer', 'snn_render_block_editor_ai_script');
    
    // Add inline styles
    add_action('admin_head', 'snn_render_block_editor_ai_styles');
}
add_action('enqueue_block_editor_assets', 'snn_enqueue_block_editor_ai_assets');

/**
 * Render inline styles for AI block editor interface
 */
function snn_render_block_editor_ai_styles() {
    ?>
    <style>
        /* AI Toolbar Button Styling */
        .snn-ai-toolbar-button {
            position: relative;
        }
        
        .snn-ai-toolbar-button:hover {
            color: #8b5cf6 !important;
        }
        
        .snn-ai-toolbar-button svg {
            transition: transform 0.2s ease;
        }
        
        .snn-ai-toolbar-button:hover svg {
            transform: scale(1.1);
        }
        
        .snn-ai-modal-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            display: flex;
            align-items: flex-end;
            justify-content: center;
            z-index: 999999;
            animation: snnFadeIn 0.2s ease;
        }
        
        @keyframes snnFadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        
        .snn-ai-modal {
            background: white;
            border-radius: 8px 8px 0 0;
            box-shadow: 0 -10px 40px rgba(0, 0, 0, 0.3);
            max-width: 800px;
            width: 100%;
            max-height: 70vh;
            overflow: hidden;
            display: flex;
            flex-direction: column;
            animation: snnSlideUp 0.3s ease;
            margin: 0;
        }
        
        @keyframes snnSlideUp {
            from {
                opacity: 0;
                transform: translateY(20px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
        
        .snn-ai-modal-header {
            padding: 20px;
            border-bottom: 1px solid #e0e0e0;
            display: flex;
            align-items: center;
            justify-content: space-between;
        }
        
        .snn-ai-modal-header h2 {
            margin: 0;
            font-size: 18px;
            font-weight: 600;
            color: #1e1e1e;
        }
        
        .snn-ai-modal-close {
            background: none;
            border: none;
            font-size: 24px;
            cursor: pointer;
            color: #666;
            padding: 0;
            width: 32px;
            height: 32px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 4px;
            transition: all 0.2s ease;
        }
        
        .snn-ai-modal-close:hover {
            background: #f0f0f0;
            color: #1e1e1e;
        }
        
        .snn-ai-modal-body {
            padding: 20px;
            overflow-y: auto;
            flex: 1;
        }
        
        .snn-ai-presets {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
            gap: 8px;
            margin-bottom: 16px;
        }
        
        .snn-ai-preset-button {
            padding: 8px 12px;
            background: #f5f5f5;
            border: 1px solid #e0e0e0;
            border-radius: 4px;
            cursor: pointer;
            font-size: 13px;
            transition: all 0.2s ease;
            text-align: center;
        }
        
        .snn-ai-preset-button:hover {
            background: var(--wp-admin-theme-color);
            color: white;
            border-color: var(--wp-admin-theme-color);
            transform: translateY(-1px);
        }
        
        .snn-ai-custom-prompt {
            margin-top: 16px;
        }
        
        .snn-ai-custom-prompt label {
            display: block;
            margin-bottom: 8px;
            font-weight: 500;
            font-size: 13px;
            color: #1e1e1e;
        }
        
        .snn-ai-custom-prompt textarea {
            width: 100%;
            min-height: 100px;
            padding: 12px;
            border: 1px solid #e0e0e0;
            border-radius: 4px;
            font-size: 14px;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen-Sans, Ubuntu, Cantarell, 'Helvetica Neue', sans-serif;
            resize: vertical;
            transition: border-color 0.2s ease;
        }
        
        .snn-ai-custom-prompt textarea:focus {
            outline: none;
            border-color: var(--wp-admin-theme-color);
         
        }
        
        .snn-ai-modal-footer {
            padding: 16px 20px;
            border-top: 1px solid #e0e0e0;
            display: flex;
            gap: 12px;
            justify-content: flex-end;
        }
        
        .snn-ai-modal-footer button {
            padding: 10px 20px;
            border-radius: 4px;
            font-size: 14px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.2s ease;
            border: none;
        }
        
        .snn-ai-cancel-button {
            background: #f5f5f5;
            color: #666;
        }
        
        .snn-ai-cancel-button:hover {
            background: #e0e0e0;
            color: #1e1e1e;
        }
        
        .snn-ai-generate-button {
            background: var(--wp-admin-theme-color);
            color: white;
        }
        
        .snn-ai-generate-button:hover {
            transform: translateY(-1px); 
        }
        
        .snn-ai-generate-button:disabled {
            opacity: 0.6;
            cursor: not-allowed;
            transform: none;
        }
        
        .snn-ai-loading {
            display: inline-flex;
            align-items: center;
            gap: 8px;
        }
        
        .snn-ai-spinner {
            width: 16px;
            height: 16px;
            border: 2px solid rgba(255, 255, 255, 0.3);
            border-top-color: white;
            border-radius: 50%;
            animation: snnSpin 0.8s linear infinite;
        }
        
        @keyframes snnSpin {
            to { transform: rotate(360deg); }
        }
        
        .snn-ai-error {
            margin-top: 12px;
            padding: 12px;
            background: #fff3f3;
            border: 1px solid #ffcdd2;
            border-radius: 4px;
            color: #c62828;
            font-size: 13px;
        }
        
        .snn-ai-existing-content {
            margin-bottom: 16px;
            padding: 12px;
            background: #f9f9f9;
            border: 1px solid #e0e0e0;
            border-radius: 4px;
        }
        
        .snn-ai-existing-content label {
            display: block;
            margin-bottom: 4px;
            font-weight: 500;
            font-size: 12px;
            color: #666;
        }
        
        .snn-ai-existing-content-text {
            font-size: 13px;
            color: #1e1e1e;
            line-height: 1.5;
            max-height: 100px;
            overflow-y: auto;
        }
        
        .snn-ai-generated-preview {
            margin-top: 16px;
            padding: 16px;
            background: #f0f9ff;
            border: 2px solid #3b82f6;
            border-radius: 4px;
            animation: snnFadeIn 0.3s ease;
        }
        
        .snn-ai-generated-preview label {
            display: block;
            margin-bottom: 8px;
            font-weight: 600;
            font-size: 13px;
            color: #1e40af;
        }
        
        .snn-ai-generated-preview-text {
            font-size: 14px;
            color: #1e1e1e;
            line-height: 1.6;
            max-height: 200px;
            overflow-y: auto;
            white-space: pre-wrap;
            padding: 12px;
            background: white;
            border-radius: 4px;
        }
        
        .snn-ai-apply-button {
            background: #10b981;
            color: white;
        }
        
        .snn-ai-apply-button:hover {
            background: #059669;
            transform: translateY(-1px);
        }
        
        .snn-ai-regenerate-button {
            background: #f59e0b;
            color: white;
        }
        
        .snn-ai-regenerate-button:hover {
            background: #d97706;
        }
    </style>
    <?php
}

/**
 * Render inline JavaScript for AI block editor integration
 */
function snn_render_block_editor_ai_script() {
    $config = snn_get_ai_api_config();
    ?>
    <script>
    (function() {
        'use strict';
        
        // Prevent multiple initializations
        if (window.snnAIInitialized) {
            console.log('SNN AI: Already initialized, skipping...');
            return;
        }
        
        console.log('SNN AI: Script loaded, waiting for editor initialization...');
        
        // Function to initialize AI features
        function initializeSNNAI() {
            // Check if already initialized
            if (window.snnAIInitialized) {
                return true;
            }
            
            // Check if WordPress is ready
            if (typeof wp === 'undefined' || !wp.data || !wp.element || !wp.blocks || !wp.hooks || !wp.compose) {
                return false;
            }
            
            // Check if block editor is initialized
            const editorStore = wp.data.select('core/editor');
            const blockEditorStore = wp.data.select('core/block-editor');
            
            if (!editorStore || !blockEditorStore) {
                return false;
            }
            
            console.log('SNN AI: WordPress editor is ready, initializing...');
            
            const { Component, createElement: el, Fragment } = wp.element;
            const { registerPlugin } = wp.plugins;
            const { select, dispatch } = wp.data;
            const { createHigherOrderComponent } = wp.compose;
            const { addFilter } = wp.hooks;
            const { BlockControls } = wp.blockEditor;
            const { ToolbarGroup, ToolbarButton } = wp.components;
            
            // AI Configuration from PHP
            const aiConfig = <?php echo wp_json_encode([
                'actionPresets' => $config['actionPresets'],
                'restUrl' => rest_url('snn/v1/block-editor-ai'),
                'nonce' => wp_create_nonce('wp_rest'),
            ]); ?>;
            
            // Text-based blocks that support AI generation
            const supportedBlocks = [
                'core/paragraph',
                'core/heading',
                'core/list',
                'core/list-item',
                'core/quote',
                'core/verse',
                'core/preformatted',
            ];
            
            // AI Modal Component
            class AIModal extends Component {
                constructor(props) {
                    super(props);
                    this.state = {
                        customPrompt: '',
                        isLoading: false,
                        error: null,
                        generatedContent: null,
                        hasGenerated: false,
                    };
                }
                
                componentDidMount() {
                    console.log('SNN AI: 🎨 Modal opened');
                }
            
            handlePresetClick(preset) {
                console.log('SNN AI: 📝 Preset selected:', preset.name);
                this.setState({ customPrompt: preset.prompt });
            }
            
            async handleGenerate() {
                const { customPrompt } = this.state;
                const { existingContent, blockType } = this.props;
                
                if (!customPrompt.trim()) {
                    this.setState({ error: 'Please enter a prompt or select a preset.' });
                    return;
                }
                
                console.log('SNN AI: 🚀 Generating content...');
                this.setState({ isLoading: true, error: null });
                
                try {
                    const response = await fetch(aiConfig.restUrl, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'X-WP-Nonce': aiConfig.nonce,
                        },
                        body: JSON.stringify({
                            prompt: customPrompt,
                            existingContent: existingContent,
                            blockType: blockType,
                        }),
                    });
                    
                    const data = await response.json();
                    
                    if (data.success && data.content) {
                        console.log('SNN AI: ✅ Content generated successfully');
                        this.setState({
                            generatedContent: data.content,
                            hasGenerated: true,
                            isLoading: false,
                        });
                    } else {
                        console.error('SNN AI: ❌ Generation failed:', data.error);
                        this.setState({
                            error: data.error || 'Failed to generate content.',
                            isLoading: false,
                        });
                    }
                } catch (error) {
                    console.error('SNN AI: ❌ Network error:', error);
                    this.setState({
                        error: 'Network error: ' + error.message,
                        isLoading: false,
                    });
                }
            }
            
            handleApply() {
                const { generatedContent } = this.state;
                const { onGenerate, onClose } = this.props;
                
                if (generatedContent) {
                    console.log('SNN AI: ✅ Applying generated content');
                    onGenerate(generatedContent);
                    onClose();
                }
            }
            
            render() {
                const { onClose, existingContent } = this.props;
                const { customPrompt, isLoading, error, generatedContent, hasGenerated } = this.state;
                
                return el('div', { className: 'snn-ai-modal-overlay', onClick: (e) => {
                    if (e.target.className === 'snn-ai-modal-overlay') onClose();
                }},
                    el('div', { className: 'snn-ai-modal' },
                        // Header
                        el('div', { className: 'snn-ai-modal-header' },
                            el('h2', {}, 'AI Content Generator'),
                            el('button', {
                                className: 'snn-ai-modal-close',
                                onClick: onClose,
                            }, '×')
                        ),
                        
                        // Body
                        el('div', { className: 'snn-ai-modal-body' },
                            // Existing content preview
                            existingContent && el('div', { className: 'snn-ai-existing-content' },
                                el('label', {}, 'Current Content:'),
                                el('div', { className: 'snn-ai-existing-content-text' }, existingContent)
                            ),
                            
                            // Action presets
                            aiConfig.actionPresets.length > 0 && el('div', { className: 'snn-ai-presets' },
                                aiConfig.actionPresets.map((preset, index) =>
                                    el('button', {
                                        key: index,
                                        className: 'snn-ai-preset-button',
                                        onClick: () => this.handlePresetClick(preset),
                                        disabled: isLoading,
                                    }, preset.name)
                                )
                            ),
                            
                            // Custom prompt
                            el('div', { className: 'snn-ai-custom-prompt' },
                                el('label', {}, 'Custom Prompt:'),
                                el('textarea', {
                                    value: customPrompt,
                                    onChange: (e) => this.setState({ customPrompt: e.target.value }),
                                    placeholder: 'Enter your instructions for the AI...',
                                    disabled: isLoading,
                                })
                            ),
                            
                            // Generated content preview
                            generatedContent && el('div', { className: 'snn-ai-generated-preview' },
                                el('label', {}, '✨ Generated Content:'),
                                el('div', { className: 'snn-ai-generated-preview-text' }, generatedContent)
                            ),
                            
                            // Error message
                            error && el('div', { className: 'snn-ai-error' }, error)
                        ),
                        
                        // Footer
                        el('div', { className: 'snn-ai-modal-footer' },
                            el('button', {
                                className: 'snn-ai-cancel-button',
                                onClick: onClose,
                                disabled: isLoading,
                            }, 'Cancel'),
                            
                            // Generate or Regenerate button
                            el('button', {
                                className: hasGenerated ? 'snn-ai-regenerate-button' : 'snn-ai-generate-button',
                                onClick: () => this.handleGenerate(),
                                disabled: isLoading,
                            }, isLoading
                                ? el('span', { className: 'snn-ai-loading' },
                                    el('span', { className: 'snn-ai-spinner' }),
                                    'Generating...'
                                )
                                : (hasGenerated ? '🔄 Regenerate' : '✨ Generate')
                            ),
                            
                            // Apply button (only shown after generation)
                            generatedContent && !isLoading && el('button', {
                                className: 'snn-ai-apply-button',
                                onClick: () => this.handleApply(),
                            }, '✓ Apply')
                        )
                    )
                );
            }
        }
            
            // Add AI button to block toolbar
            const withAIButton = createHigherOrderComponent((BlockEdit) => {
                return (props) => {
                    const { name, clientId, attributes, isSelected } = props;
                    
                    // Only show for supported blocks
                    if (!supportedBlocks.includes(name)) {
                        return el(BlockEdit, props);
                    }
                    
                    const { useState, useEffect } = wp.element;
                    const [showModal, setShowModal] = useState(false);
                    
                    // Extract text content from block
                    const getBlockContent = () => {
                        if (attributes.content) return attributes.content.replace(/<[^>]*>/g, '');
                        if (attributes.value) return attributes.value.replace(/<[^>]*>/g, '');
                        if (attributes.values) return attributes.values.map(v => v.replace(/<[^>]*>/g, '')).join('\n');
                        if (attributes.citation) return attributes.citation.replace(/<[^>]*>/g, '');
                        return '';
                    };
                    
                    // Update block content
                    const handleGenerate = (newContent) => {
                        console.log('SNN AI: 💾 Updating block with generated content');
                        const blockType = select('core/block-editor').getBlockName(clientId);
                        
                        // Strip any HTML tags from AI response
                        const cleanContent = newContent.replace(/<[^>]*>/g, '');
                        
                        // Update the appropriate attribute based on block type
                        if (blockType === 'core/list' || blockType === 'core/list-item') {
                            // For lists, split by newlines and create array
                            const lines = cleanContent.split('\n').filter(line => line.trim());
                            dispatch('core/block-editor').updateBlockAttributes(clientId, {
                                values: lines.join('</li><li>'),
                                value: '<li>' + lines.join('</li><li>') + '</li>',
                            });
                        } else if (blockType === 'core/quote') {
                            dispatch('core/block-editor').updateBlockAttributes(clientId, {
                                value: cleanContent,
                                citation: cleanContent,
                            });
                        } else {
                            // For paragraph, heading, etc.
                            dispatch('core/block-editor').updateBlockAttributes(clientId, {
                                content: cleanContent,
                            });
                        }
                    };
                    
                    return el(Fragment, {},
                        // BlockControls adds button to the block toolbar (only when selected)
                        isSelected && el(BlockControls, { group: 'block' },
                            el(ToolbarButton, {
                                icon: el('svg', {
                                    xmlns: 'http://www.w3.org/2000/svg',
                                    viewBox: '0 0 512 512',
                                    width: '20',
                                    height: '20',
                                    style: { fill: '#000000ff' }
                                },
                                    el('path', {
                                        d: 'M 376.218 17.663 C 370.487 20.488, 369.194 23.614, 363.433 48.566 C 360.410 61.657, 356.800 74.677, 355.319 77.826 C 351.805 85.301, 341.301 95.805, 333.826 99.319 C 330.677 100.800, 317.657 104.410, 304.566 107.433 C 289.523 110.906, 279.941 113.618, 278.113 114.920 C 270.034 120.672, 270.034 135.328, 278.113 141.080 C 279.941 142.382, 289.523 145.094, 304.566 148.567 C 317.657 151.590, 330.677 155.200, 333.826 156.681 C 341.301 160.195, 351.805 170.699, 355.319 178.174 C 356.800 181.323, 360.410 194.343, 363.433 207.434 C 366.906 222.477, 369.618 232.059, 370.920 233.887 C 376.672 241.966, 391.328 241.966, 397.080 233.887 C 398.382 232.059, 401.094 222.477, 404.567 207.434 C 407.590 194.343, 411.200 181.323, 412.681 178.174 C 416.195 170.699, 426.699 160.195, 434.174 156.681 C 437.323 155.200, 450.343 151.590, 463.434 148.567 C 478.477 145.094, 488.059 142.382, 489.887 141.080 C 497.966 135.328, 497.966 120.672, 489.887 114.920 C 488.059 113.618, 478.477 110.906, 463.434 107.433 C 450.343 104.410, 437.323 100.800, 434.174 99.319 C 426.699 95.805, 416.195 85.301, 412.681 77.826 C 411.200 74.677, 407.590 61.657, 404.567 48.566 C 401.094 33.523, 398.382 23.941, 397.080 22.113 C 392.984 16.360, 383.127 14.258, 376.218 17.663 M 24.218 177.663 C 18.726 180.370, 16.500 184.505, 16.500 192 C 16.500 199.466, 18.197 202.555, 24.163 205.948 C 27.812 208.022, 28.186 208.029, 121.163 207.765 L 214.500 207.500 217.712 205.090 C 224.300 200.147, 225.924 190.959, 221.534 183.468 C 216.866 175.503, 223.617 175.997, 119.849 176.023 C 36.827 176.043, 27.169 176.209, 24.218 177.663 M 24.218 273.663 C 18.726 276.370, 16.500 280.505, 16.500 288 C 16.500 295.461, 18.198 298.555, 24.148 301.939 L 27.795 304.013 257.148 303.756 L 486.500 303.500 489.712 301.090 C 496.300 296.147, 497.924 286.959, 493.534 279.468 C 488.731 271.271, 511.903 271.997, 255.849 272.023 C 47.545 272.044, 27.212 272.188, 24.218 273.663 M 24.218 369.663 C 18.726 372.370, 16.500 376.505, 16.500 384 C 16.500 391.461, 18.198 394.555, 24.148 397.939 L 27.795 400.013 257.148 399.756 L 486.500 399.500 489.712 397.090 C 496.300 392.147, 497.924 382.959, 493.534 375.468 C 488.731 367.271, 511.903 367.997, 255.849 368.023 C 47.545 368.044, 27.212 368.188, 24.218 369.663 M 24.218 465.663 C 18.726 468.370, 16.500 472.505, 16.500 480 C 16.500 487.461, 18.198 490.555, 24.148 493.939 L 27.795 496.013 257.148 495.756 L 486.500 495.500 489.712 493.090 C 496.300 488.147, 497.924 478.959, 493.534 471.468 C 488.731 463.271, 511.903 463.997, 255.849 464.023 C 47.545 464.044, 27.212 464.188, 24.218 465.663',
                                        fillRule: 'evenodd'
                                    })
                                ),
                                label: 'AI Generate',
                                onClick: () => {
                                    console.log('SNN AI: ⚡ AI button clicked for', name);
                                    setShowModal(true);
                                },
                                className: 'snn-ai-toolbar-button'
                            })
                        ),
                        
                        el(BlockEdit, props),
                        
                        // AI Modal (rendered in React portal)
                        showModal && el(AIModal, {
                            existingContent: getBlockContent(),
                            blockType: name,
                            onGenerate: handleGenerate,
                            onClose: () => {
                                console.log('SNN AI: 🔒 Modal closed');
                                setShowModal(false);
                            },
                        })
                    );
                };
            }, 'withAIButton');
            
            // Register the filter ONCE
            addFilter(
                'editor.BlockEdit',
                'snn/with-ai-button',
                withAIButton
            );
            
            // Mark as initialized
            window.snnAIInitialized = true;
            
            console.log('SNN AI: ✓ Block Editor integration initialized successfully');
            return true;
        }
        
        // Single initialization strategy using polling
        let attempts = 0;
        const maxAttempts = 30; // Try for 6 seconds
        const pollInterval = setInterval(function() {
            attempts++;
            
            if (initializeSNNAI()) {
                clearInterval(pollInterval);
                console.log('SNN AI: ✓ Ready in ' + (attempts * 200) + 'ms');
            } else if (attempts >= maxAttempts) {
                console.error('SNN AI: ✗ Failed to initialize - editor not ready');
                clearInterval(pollInterval);
            }
        }, 200);
        
    })();
    </script>
    <?php
}
