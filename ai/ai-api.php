<?php
/**
 * SNN AI API Helper
 *
 * File: ai-api.php
 *
 * Purpose: This file serves as the core API configuration helper for the AI integration system.
 * It retrieves and consolidates all AI-related settings configured in ai-settings.php and prepares
 * them for use throughout the theme's AI features.
 *
 * Main Functions:
 * - snn_get_ai_api_config(): Retrieves and returns a complete configuration array containing:
 *   * API credentials (keys for OpenAI, OpenRouter, or custom providers)
 *   * Selected AI provider (OpenAI, OpenRouter, or Custom)
 *   * Model selection (e.g., gpt-4o-mini, or custom model names)
 *   * API endpoints (provider-specific URLs for API calls)
 *   * System prompts (instructions that guide the AI's behavior)
 *   * Action presets (user-defined quick prompts for common tasks)
 *   * Response format settings (JSON object, text, or other structured formats)
 *
 * Integration:
 * - Works in tandem with ai-settings.php which handles the admin UI and settings storage
 * - Used by AI feature files to make API calls to the selected provider
 * - Ensures consistent configuration across all AI-powered features in the theme
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit; // Exit if accessed directly.
}


function snn_get_ai_api_config() {
    $ai_provider          = get_option('snn_ai_provider', 'openai');
    $openai_api_key       = get_option('snn_openai_api_key', '');
    $openai_model         = get_option('snn_openai_model', 'gpt-4.1-mini');
    $openrouter_api_key   = get_option('snn_openrouter_api_key', '');
    $openrouter_model     = get_option('snn_openrouter_model', '');
    $system_prompt        = get_option(
        'snn_system_prompt',
        'You are a helpful assistant that helps with content creation or manipulation. You work inside a wordpress visual builder. User usually changes a website content. Keep the content length as similar the existing content when you are editing or follow the users instructions accordingly. Dont generate markdown. Only respond with the needed content and nothing else always!'
    );

    // NEW: Retrieve the desired response format type from settings
    // You would have added 'snn_ai_response_format_type' in ai-settings.php
    $response_format_type = get_option('snn_ai_response_format_type', 'none'); // e.g., 'none', 'json_object'

    $apiKey      = '';
    $model       = '';
    $apiEndpoint = '';

    if ($ai_provider === 'custom') {
        $apiKey      = get_option('snn_custom_api_key', '');
        $model       = get_option('snn_custom_model', '');
        $apiEndpoint = get_option('snn_custom_api_endpoint', '');
    } elseif ($ai_provider === 'openrouter') {
        $apiKey      = $openrouter_api_key;
        $model       = $openrouter_model;
        $apiEndpoint = 'https://openrouter.ai/api/v1/chat/completions';
    } else { // Default to 'openai'
        $apiKey      = $openai_api_key;
        $model       = $openai_model;
        $apiEndpoint = 'https://api.openai.com/v1/chat/completions';
    }

    $action_presets = get_option('snn_ai_action_presets', []);
    if (!is_array($action_presets)) {
        $action_presets = [];
    }

    // Prepare the response format payload based on the setting
    $responseFormat = [];
    if ($response_format_type === 'json_object') {
        $responseFormat = ['type' => 'json_object'];
    }
    // You could expand this for other structured formats if needed in the future,
    // e.g., 'json_schema' if you also store a schema definition.

    return [
        'apiKey'          => $apiKey,
        'model'           => $model,
        'apiEndpoint'     => $apiEndpoint,
        'systemPrompt'    => $system_prompt,
        'actionPresets'   => array_values($action_presets),
        'responseFormat'  => $responseFormat, 
    ];
}