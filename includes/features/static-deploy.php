<?php
/**
 * SNN Static Deploy: export this WordPress site as a static HTML site.
 *
 * A simplified version of Simply Static's free features, built into the theme:
 *   - crawl posts, pages, archives, terms, authors, dates, sitemap, robots.txt, feeds
 *   - fetch every page as rendered now, save it, rewrite links (absolute, relative or offline)
 *   - copy local CSS, JS, images, fonts and files without a request when they are on disk
 *   - 404.html, redirect pages, additional URLs and files, exclusions, Basic Auth
 *   - deliver as a ZIP download or copy to a local folder; pause, resume, cancel
 *
 * The classes live in includes/features/static-deploy/. This file wires them into
 * WordPress: the settings page, the REST API that drives an export, the download
 * handler and the WP-Cron continuation.
 *
 * Switch it off in SNN Settings > Customizations (feature slug: snn-static-deploy).
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

$snn_sd_dir = __DIR__ . '/static-deploy/';
require_once $snn_sd_dir . 'class-sd-options.php';
require_once $snn_sd_dir . 'class-sd-url.php';
require_once $snn_sd_dir . 'class-sd-pages.php';
require_once $snn_sd_dir . 'class-sd-rewriter.php';
require_once $snn_sd_dir . 'class-sd-fetcher.php';
require_once $snn_sd_dir . 'class-sd-crawler.php';
require_once $snn_sd_dir . 'class-sd-delivery.php';
require_once $snn_sd_dir . 'class-sd-exporter.php';
require_once $snn_sd_dir . 'class-sd-settings-page.php';
unset( $snn_sd_dir );

const SNN_STATIC_DEPLOY_REST_NAMESPACE = 'snn-static-deploy/v1';

/** Create or update the page table when the schema changes. */
add_action( 'init', array( 'SNN_Static_Deploy_Pages', 'install' ), 5 );

/** Settings page under SNN Settings. */
add_action( 'admin_menu', 'snn_static_deploy_add_menu' );
function snn_static_deploy_add_menu() {
	add_submenu_page(
		'snn-settings',
		__( 'Static Deploy', 'snn' ),
		__( 'Static Deploy', 'snn' ),
		'manage_options',
		SNN_Static_Deploy_Settings_Page::PAGE_SLUG,
		array( 'SNN_Static_Deploy_Settings_Page', 'render' )
	);
}

/** The settings form is saved before any output. */
add_action( 'admin_init', array( 'SNN_Static_Deploy_Settings_Page', 'handle_save' ) );

/** Scripts and styles for the settings page only. */
add_action( 'admin_enqueue_scripts', 'snn_static_deploy_enqueue' );
function snn_static_deploy_enqueue( $hook ) {
	if ( false === strpos( (string) $hook, SNN_Static_Deploy_Settings_Page::PAGE_SLUG ) ) {
		return;
	}

	$js  = 'includes/features/static-deploy/static-deploy-admin.js';
	$css = 'includes/features/static-deploy/static-deploy-admin.css';

	wp_enqueue_style( 'snn-static-deploy-admin', get_theme_file_uri( $css ), array(), (string) filemtime( get_theme_file_path( $css ) ) );
	wp_enqueue_script( 'snn-static-deploy-admin', get_theme_file_uri( $js ), array(), (string) filemtime( get_theme_file_path( $js ) ), true );

	$status = SNN_Static_Deploy_Exporter::status();
	wp_localize_script( 'snn-static-deploy-admin', 'snnStaticDeploy', array(
		'rest'          => esc_url_raw( rest_url( SNN_STATIC_DEPLOY_REST_NAMESPACE . '/' ) ),
		'nonce'         => wp_create_nonce( 'wp_rest' ),
		'downloadUrl'   => esc_url_raw( admin_url( 'admin-post.php' ) ),
		'downloadNonce' => wp_create_nonce( 'snn_sd_download' ),
		'jobId'         => isset( $status['job_id'] ) ? (string) $status['job_id'] : '',
		'status'        => $status,
		'labels'        => array(
			'states' => array(
				'idle'      => __( 'No export has run yet.', 'snn' ),
				'running'   => __( 'Running', 'snn' ),
				'paused'    => __( 'Paused', 'snn' ),
				'done'      => __( 'Finished', 'snn' ),
				'failed'    => __( 'Failed', 'snn' ),
				'cancelled' => __( 'Cancelled', 'snn' ),
			),
			'stages' => array(
				'discover'  => __( 'finding URLs', 'snn' ),
				'fetch'     => __( 'saving pages', 'snn' ),
				'not_found' => __( 'writing 404 page', 'snn' ),
				'deliver'   => __( 'delivering files', 'snn' ),
				'wrapup'    => __( 'cleaning up', 'snn' ),
				'finished'  => __( 'complete', 'snn' ),
			),
		),
		'i18n'          => array(
			'starting'      => __( 'Starting the export...', 'snn' ),
			'stepFailed'    => __( 'The export step could not be reached. It will continue when you reload the page or when WP-Cron runs.', 'snn' ),
			'confirmCancel' => __( 'Cancel this export? The working files are removed.', 'snn' ),
		),
	) );
}

/** REST API that drives an export (used by the settings page). */
add_action( 'rest_api_init', 'snn_static_deploy_register_routes' );
function snn_static_deploy_register_routes() {
	$ns = SNN_STATIC_DEPLOY_REST_NAMESPACE;
	$can = static function () {
		return current_user_can( 'manage_options' );
	};

	register_rest_route( $ns, '/status', array(
		'methods'             => WP_REST_Server::READABLE,
		'callback'            => static function () {
			return rest_ensure_response( SNN_Static_Deploy_Exporter::status() );
		},
		'permission_callback' => $can,
	) );

	register_rest_route( $ns, '/start', array(
		'methods'             => WP_REST_Server::CREATABLE,
		'callback'            => 'snn_static_deploy_rest_result',
		'args'                => array(),
		'permission_callback' => $can,
	) );

	register_rest_route( $ns, '/step', array(
		'methods'             => WP_REST_Server::CREATABLE,
		'callback'            => static function () {
			return rest_ensure_response( SNN_Static_Deploy_Exporter::step() );
		},
		'permission_callback' => $can,
	) );

	foreach ( array( 'pause', 'resume', 'cancel' ) as $action ) {
		register_rest_route( $ns, '/' . $action, array(
			'methods'             => WP_REST_Server::CREATABLE,
			'callback'            => static function () use ( $action ) {
				$method = array( 'SNN_Static_Deploy_Exporter', $action );
				return snn_static_deploy_rest_result( null, $method );
			},
			'permission_callback' => $can,
		) );
	}
}

/**
 * Turn an exporter result (status array or WP_Error) into a REST response.
 *
 * @param WP_REST_Request|null $request Unused.
 * @param callable|null        $method  Exporter method to call (default: start).
 * @return WP_REST_Response|WP_Error
 */
function snn_static_deploy_rest_result( $request = null, $method = null ) {
	if ( null === $method ) {
		$method = array( 'SNN_Static_Deploy_Exporter', 'start' );
	}
	$result = call_user_func( $method );
	if ( is_wp_error( $result ) ) {
		$code = $result->get_error_code();
		$status = in_array( $code, array( 'snn_sd_busy', 'snn_sd_locked', 'snn_sd_not_running', 'snn_sd_not_paused' ), true ) ? 409 : 400;
		return new WP_Error( $code, $result->get_error_message(), array( 'status' => $status ) );
	}
	return rest_ensure_response( $result );
}

/** Download the ZIP of the finished export. */
add_action( 'admin_post_snn_static_deploy_download', 'snn_static_deploy_download' );
function snn_static_deploy_download() {
	if ( ! current_user_can( 'manage_options' ) ) {
		wp_die( esc_html__( 'You do not have permission to download this file.', 'snn' ) );
	}
	check_admin_referer( 'snn_sd_download' );

	$job = isset( $_GET['job'] ) ? sanitize_text_field( wp_unslash( $_GET['job'] ) ) : '';
	$zip = SNN_Static_Deploy_Exporter::zip_path_for( $job );
	if ( '' === $zip ) {
		wp_die( esc_html__( 'The ZIP file is not available. Run the export again.', 'snn' ) );
	}

	nocache_headers();
	header( 'Content-Type: application/zip' );
	header( 'Content-Disposition: attachment; filename="static-export-' . gmdate( 'Ymd-His' ) . '.zip"' );
	header( 'Content-Length: ' . (string) filesize( $zip ) );
	readfile( $zip );
	exit;
}

/** WP-Cron continues an export while the admin page is closed. */
add_action( SNN_Static_Deploy_Exporter::CRON_HOOK, array( 'SNN_Static_Deploy_Exporter', 'cron_step' ) );

/** Stop scheduled work when the theme is switched away from this feature. */
add_action( 'switch_theme', static function () {
	wp_clear_scheduled_hook( SNN_Static_Deploy_Exporter::CRON_HOOK );
} );
