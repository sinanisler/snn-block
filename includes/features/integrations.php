<?php
/**
 * Integrations: the API keys of the outside services the theme uses.
 *
 * Pixabay and Unsplash: the photo search of the Image block and of the featured image (the P and U buttons). The
 * options keep their names (snn_pixabay_api_key, snn_unsplash_api_key), so keys saved earlier on the AI Agent page
 * still work. The keys stay on the server: the editor only learns whether a key is saved.
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

function snn_add_integrations_submenu() {
    add_submenu_page(
        'snn-settings',
        __( 'Integrations', 'snn' ),
        __( 'Integrations', 'snn' ),
        'manage_options',
        'snn-integrations',
        'snn_integrations_page_callback'
    );
}
add_action( 'admin_menu', 'snn_add_integrations_submenu' );

function snn_register_integrations_settings() {
    $args = array(
        'type'              => 'string',
        'sanitize_callback' => 'sanitize_text_field',
        'default'           => '',
    );
    register_setting( 'snn_integrations_group', 'snn_pixabay_api_key', $args );
    register_setting( 'snn_integrations_group', 'snn_unsplash_api_key', $args );
}
add_action( 'admin_init', 'snn_register_integrations_settings' );

function snn_integrations_page_callback() {
    $pixabay_api_key  = get_option( 'snn_pixabay_api_key', '' );
    $unsplash_api_key = get_option( 'snn_unsplash_api_key', '' );
    ?>
    <div class="wrap">
        <h1><?php echo esc_html__( 'Integrations', 'snn' ); ?></h1>
        <p><?php echo esc_html__( 'API keys for the outside services the theme uses.', 'snn' ); ?></p>

        <form method="post" action="options.php">
            <?php settings_fields( 'snn_integrations_group' ); ?>

            <table class="form-table" role="presentation">
                <tbody>
                    <!-- Pixabay API Key -->
                    <tr>
                        <th scope="row">
                            <label for="snn_pixabay_api_key"><?php echo esc_html__( 'Pixabay API Key', 'snn' ); ?></label>
                        </th>
                        <td>
                            <input type="text"
                                   id="snn_pixabay_api_key"
                                   name="snn_pixabay_api_key"
                                   value="<?php echo esc_attr( $pixabay_api_key ); ?>"
                                   class="regular-text"
                                   placeholder="<?php echo esc_attr__( 'Paste your Pixabay API key here', 'snn' ); ?>">
                            <p class="description">
                                <?php echo esc_html__( 'Used for image search in the AI agent, the Image block and the featured image (P). Get your free API key from', 'snn' ); ?>
                                <a href="https://pixabay.com/api/docs/" target="_blank" rel="noopener noreferrer">pixabay.com/api/docs/</a>
                                <?php echo esc_html__( '(your API key is shown there when logged in).', 'snn' ); ?>
                            </p>
                        </td>
                    </tr>

                    <!-- Unsplash API Key -->
                    <tr>
                        <th scope="row">
                            <label for="snn_unsplash_api_key"><?php echo esc_html__( 'Unsplash API Key', 'snn' ); ?></label>
                        </th>
                        <td>
                            <input type="text"
                                   id="snn_unsplash_api_key"
                                   name="snn_unsplash_api_key"
                                   value="<?php echo esc_attr( $unsplash_api_key ); ?>"
                                   class="regular-text"
                                   placeholder="<?php echo esc_attr__( 'Paste your Unsplash access key here', 'snn' ); ?>">
                            <p class="description">
                                <?php echo esc_html__( 'Used for photo search in the Image block and the featured image (U). Get your access key from', 'snn' ); ?>
                                <a href="https://unsplash.com/developers" target="_blank" rel="noopener noreferrer">unsplash.com/developers</a>
                                <?php echo esc_html__( '(create an app, then copy its Access Key).', 'snn' ); ?>
                            </p>
                        </td>
                    </tr>
                </tbody>
            </table>

            <?php submit_button(); ?>
        </form>
    </div>
    <?php
}
