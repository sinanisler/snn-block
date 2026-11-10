<?php
/**
 * Static Deploy: the admin screen (SNN Settings > Static Deploy).
 *
 * Three parts: the export controls with live progress (driven by static-deploy-admin.js
 * through the REST API), the settings form (a normal POST with a nonce), and the page
 * log, a server-rendered table of every URL in the last export.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class SNN_Static_Deploy_Settings_Page {

	const PAGE_SLUG = 'snn-static-deploy';
	const NONCE     = 'snn_sd_save_settings';

	/**
	 * Handle the settings form before any output, so the redirect works.
	 *
	 * @return void
	 */
	public static function handle_save() {
		if ( empty( $_POST['snn_sd_save'] ) || ! current_user_can( 'manage_options' ) ) {
			return;
		}
		check_admin_referer( self::NONCE );

		$input = wp_unslash( $_POST );
		SNN_Static_Deploy_Options::update( is_array( $input ) ? $input : array() );

		$settings = SNN_Static_Deploy_Options::get_all();
		$notice   = 'saved';
		if ( 'local' === $settings['delivery_method'] && '' === $settings['local_dir'] ) {
			$notice = 'saved_no_dir';
		} elseif ( 'local' === $settings['delivery_method'] ) {
			$check = SNN_Static_Deploy_Delivery::prepare_local_dir( $settings['local_dir'], false );
			if ( is_wp_error( $check ) ) {
				$notice = 'saved_bad_dir';
			}
		}

		wp_safe_redirect( add_query_arg( array( 'page' => self::PAGE_SLUG, 'sd_notice' => $notice ), admin_url( 'admin.php' ) ) );
		exit;
	}

	/**
	 * Render the screen.
	 *
	 * @return void
	 */
	public static function render() {
		if ( ! current_user_can( 'manage_options' ) ) {
			wp_die( esc_html__( 'You do not have permission to view this page.', 'snn' ) );
		}

		$settings = SNN_Static_Deploy_Options::get_all();
		$status   = SNN_Static_Deploy_Exporter::status();
		$notice   = isset( $_GET['sd_notice'] ) ? sanitize_key( wp_unslash( $_GET['sd_notice'] ) ) : '';
		?>
		<div class="wrap snn-sd" id="snn-sd">
			<h1><?php esc_html_e( 'Static Deploy', 'snn' ); ?></h1>
			<p class="snn-sd-lead"><?php esc_html_e( 'Turns this site into plain HTML, CSS, JavaScript and image files that can be hosted anywhere. Pages are saved as they are rendered now, links are rewritten, and the result is delivered as a ZIP file or copied to a local folder.', 'snn' ); ?></p>

			<?php self::notices( $notice ); ?>

			<section class="snn-sd-card" aria-labelledby="snn-sd-export-title">
				<h2 id="snn-sd-export-title"><?php esc_html_e( 'Export', 'snn' ); ?></h2>

				<div class="snn-sd-actions">
					<button type="button" class="button button-primary" id="snn-sd-start"><?php esc_html_e( 'Start export', 'snn' ); ?></button>
					<button type="button" class="button" id="snn-sd-pause" hidden><?php esc_html_e( 'Pause', 'snn' ); ?></button>
					<button type="button" class="button" id="snn-sd-resume" hidden><?php esc_html_e( 'Resume', 'snn' ); ?></button>
					<button type="button" class="button button-link-delete" id="snn-sd-cancel" hidden><?php esc_html_e( 'Cancel', 'snn' ); ?></button>
					<a class="button" id="snn-sd-download" href="#" hidden><?php esc_html_e( 'Download ZIP', 'snn' ); ?></a>
				</div>

				<div class="snn-sd-progress" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="<?php echo esc_attr( (int) $status['percent'] ); ?>" aria-label="<?php esc_attr_e( 'Export progress', 'snn' ); ?>">
					<div class="snn-sd-progress-bar" id="snn-sd-bar" style="width: <?php echo esc_attr( (int) $status['percent'] ); ?>%"></div>
				</div>
				<p class="snn-sd-status" id="snn-sd-status" aria-live="polite"><?php echo esc_html( self::status_line( $status ) ); ?></p>

				<ul class="snn-sd-counts" id="snn-sd-counts">
					<?php foreach ( self::count_labels() as $key => $label ) : ?>
						<li><span class="snn-sd-count-n" data-key="<?php echo esc_attr( $key ); ?>"><?php echo esc_html( (string) (int) ( isset( $status['pages'][ $key ] ) ? $status['pages'][ $key ] : 0 ) ); ?></span> <?php echo esc_html( $label ); ?></li>
					<?php endforeach; ?>
				</ul>

				<h3><?php esc_html_e( 'Activity', 'snn' ); ?></h3>
				<ol class="snn-sd-log" id="snn-sd-log" reversed aria-live="off">
					<?php foreach ( array_reverse( (array) $status['messages'] ) as $message ) : ?>
						<li class="snn-sd-log-<?php echo esc_attr( $message['type'] ); ?>">
							<time><?php echo esc_html( $message['t'] ); ?></time>
							<span class="snn-sd-log-text"><?php echo esc_html( $message['text'] ); ?></span>
							<?php if ( ! empty( $message['url'] ) ) : ?>
								<code class="snn-sd-log-url"><?php echo esc_html( $message['url'] ); ?></code>
							<?php endif; ?>
						</li>
					<?php endforeach; ?>
				</ol>
			</section>

			<form method="post" action="<?php echo esc_url( admin_url( 'admin.php?page=' . self::PAGE_SLUG ) ); ?>" class="snn-sd-form">
				<?php wp_nonce_field( self::NONCE ); ?>
				<input type="hidden" name="snn_sd_save" value="1">

				<section class="snn-sd-card" aria-labelledby="snn-sd-dest-title">
					<h2 id="snn-sd-dest-title"><?php esc_html_e( 'Links in the export', 'snn' ); ?></h2>
					<fieldset>
						<legend class="screen-reader-text"><?php esc_html_e( 'Link style', 'snn' ); ?></legend>
						<label class="snn-sd-radio"><input type="radio" name="destination_type" value="relative" <?php checked( $settings['destination_type'], 'relative' ); ?>> <strong><?php esc_html_e( 'Relative to the site root', 'snn' ); ?></strong> <span><?php esc_html_e( 'Links like /about/. Use when the export is served from the root of a domain.', 'snn' ); ?></span></label>
						<label class="snn-sd-radio"><input type="radio" name="destination_type" value="absolute" <?php checked( $settings['destination_type'], 'absolute' ); ?>> <strong><?php esc_html_e( 'Absolute URLs', 'snn' ); ?></strong> <span><?php esc_html_e( 'Links with the full new address, for example https://new.example.com/about/.', 'snn' ); ?></span></label>
						<label class="snn-sd-radio"><input type="radio" name="destination_type" value="offline" <?php checked( $settings['destination_type'], 'offline' ); ?>> <strong><?php esc_html_e( 'Offline', 'snn' ); ?></strong> <span><?php esc_html_e( 'Relative file links like ../about/index.html, so the folder works when opened from disk.', 'snn' ); ?></span></label>
					</fieldset>

					<div class="snn-sd-grid">
						<label><?php esc_html_e( 'Scheme', 'snn' ); ?>
							<select name="destination_scheme">
								<option value="https://" <?php selected( $settings['destination_scheme'], 'https://' ); ?>>https://</option>
								<option value="http://" <?php selected( $settings['destination_scheme'], 'http://' ); ?>>http://</option>
							</select>
						</label>
						<label><?php esc_html_e( 'Host (absolute URLs)', 'snn' ); ?>
							<input type="text" name="destination_host" value="<?php echo esc_attr( $settings['destination_host'] ); ?>" placeholder="static.example.com" class="regular-text">
						</label>
						<label><?php esc_html_e( 'Sub folder (relative links)', 'snn' ); ?>
							<input type="text" name="relative_path" value="<?php echo esc_attr( $settings['relative_path'] ); ?>" placeholder="/sub" class="regular-text">
						</label>
						<label><?php esc_html_e( 'Crawl this WordPress URL', 'snn' ); ?>
							<input type="url" name="origin_url" value="<?php echo esc_attr( $settings['origin_url'] ); ?>" placeholder="<?php echo esc_attr( home_url( '/' ) ); ?>" class="regular-text">
						</label>
					</div>
				</section>

				<section class="snn-sd-card" aria-labelledby="snn-sd-delivery-title">
					<h2 id="snn-sd-delivery-title"><?php esc_html_e( 'Delivery', 'snn' ); ?></h2>
					<fieldset>
						<legend class="screen-reader-text"><?php esc_html_e( 'Delivery method', 'snn' ); ?></legend>
						<label class="snn-sd-radio"><input type="radio" name="delivery_method" value="zip" <?php checked( $settings['delivery_method'], 'zip' ); ?>> <strong><?php esc_html_e( 'ZIP file', 'snn' ); ?></strong> <span><?php esc_html_e( 'Download one archive when the export finishes.', 'snn' ); ?></span></label>
						<label class="snn-sd-radio"><input type="radio" name="delivery_method" value="local" <?php checked( $settings['delivery_method'], 'local' ); ?>> <strong><?php esc_html_e( 'Local folder', 'snn' ); ?></strong> <span><?php esc_html_e( 'Copy the files into a folder on this server.', 'snn' ); ?></span></label>
					</fieldset>
					<div class="snn-sd-grid">
						<label><?php esc_html_e( 'Local folder (absolute path)', 'snn' ); ?>
							<input type="text" name="local_dir" value="<?php echo esc_attr( $settings['local_dir'] ); ?>" placeholder="C:/sites/static-out" class="large-text">
						</label>
					</div>
					<label class="snn-sd-check"><input type="checkbox" name="clear_local_dir" value="1" <?php checked( ! empty( $settings['clear_local_dir'] ) ); ?>> <?php esc_html_e( 'Empty the local folder before copying (only the folder you chose; WordPress folders are refused).', 'snn' ); ?></label>
				</section>

				<section class="snn-sd-card" aria-labelledby="snn-sd-what-title">
					<h2 id="snn-sd-what-title"><?php esc_html_e( 'What to include', 'snn' ); ?></h2>
					<div class="snn-sd-grid snn-sd-checks">
						<?php
						self::check( 'crawl_posts', __( 'Posts and pages of the chosen types', 'snn' ), $settings );
						self::check( 'crawl_archives', __( 'Post type archives', 'snn' ), $settings );
						self::check( 'crawl_taxonomies', __( 'Taxonomy archives (categories, tags)', 'snn' ), $settings );
						self::check( 'crawl_authors', __( 'Author archives', 'snn' ), $settings );
						self::check( 'crawl_dates', __( 'Yearly and monthly archives', 'snn' ), $settings );
						self::check( 'crawl_pagination', __( 'Pages 2, 3 and so on of every archive', 'snn' ), $settings );
						self::check( 'crawl_sitemap', __( 'WordPress sitemap (wp-sitemap.xml)', 'snn' ), $settings );
						self::check( 'crawl_robots', __( 'robots.txt', 'snn' ), $settings );
						self::check( 'add_feeds', __( 'RSS and Atom feeds', 'snn' ), $settings );
						self::check( 'generate_404', __( 'Write 404.html', 'snn' ), $settings );
						self::check( 'smart_crawl', __( 'Smart crawl: pages come from the lists above, links in content only add files (images, CSS, JS, PDFs)', 'snn' ), $settings );
						?>
					</div>

					<div class="snn-sd-grid">
						<fieldset>
							<legend><?php esc_html_e( 'Post types', 'snn' ); ?></legend>
							<?php foreach ( get_post_types( array( 'public' => true ), 'objects' ) as $type ) :
								if ( 'attachment' === $type->name ) {
									continue;
								} ?>
								<label class="snn-sd-check"><input type="checkbox" name="post_types[]" value="<?php echo esc_attr( $type->name ); ?>" <?php checked( in_array( $type->name, (array) $settings['post_types'], true ) ); ?>> <?php echo esc_html( $type->labels->name ); ?> <code><?php echo esc_html( $type->name ); ?></code></label>
							<?php endforeach; ?>
						</fieldset>
						<fieldset>
							<legend><?php esc_html_e( 'Taxonomies', 'snn' ); ?></legend>
							<?php foreach ( get_taxonomies( array( 'public' => true ), 'objects' ) as $tax ) : ?>
								<label class="snn-sd-check"><input type="checkbox" name="taxonomies[]" value="<?php echo esc_attr( $tax->name ); ?>" <?php checked( in_array( $tax->name, (array) $settings['taxonomies'], true ) ); ?>> <?php echo esc_html( $tax->labels->name ); ?> <code><?php echo esc_html( $tax->name ); ?></code></label>
							<?php endforeach; ?>
						</fieldset>
					</div>

					<label class="snn-sd-block"><?php esc_html_e( 'Custom 404 page (its permalink is saved as 404.html; empty = the theme 404 template)', 'snn' ); ?>
						<?php
						wp_dropdown_pages( array(
							'name'              => 'custom_404_page',
							'selected'          => (int) $settings['custom_404_page'],
							'show_option_none'  => __( 'Theme 404 template', 'snn' ),
							'option_none_value' => 0,
						) );
						?>
					</label>

					<label class="snn-sd-block"><?php esc_html_e( 'Additional URLs (one per line; a line starting with / is added to the site address)', 'snn' ); ?>
						<textarea name="additional_urls" rows="4" class="large-text code"><?php echo esc_textarea( $settings['additional_urls'] ); ?></textarea>
					</label>
					<label class="snn-sd-block"><?php esc_html_e( 'Additional files (absolute paths inside the WordPress folder, one per line)', 'snn' ); ?>
						<textarea name="additional_files" rows="3" class="large-text code"><?php echo esc_textarea( $settings['additional_files'] ); ?></textarea>
					</label>
					<label class="snn-sd-block"><?php esc_html_e( 'Exclude URLs (one per line: a part of the address, or /regex/)', 'snn' ); ?>
						<textarea name="exclude_urls" rows="3" class="large-text code"><?php echo esc_textarea( $settings['exclude_urls'] ); ?></textarea>
					</label>
				</section>

				<section class="snn-sd-card" aria-labelledby="snn-sd-adv-title">
					<h2 id="snn-sd-adv-title"><?php esc_html_e( 'Advanced', 'snn' ); ?></h2>
					<div class="snn-sd-grid">
						<label><?php esc_html_e( 'Basic Auth user (for a protected site)', 'snn' ); ?>
							<input type="text" name="basic_auth_user" value="<?php echo esc_attr( $settings['basic_auth_user'] ); ?>" autocomplete="off">
						</label>
						<label><?php esc_html_e( 'Basic Auth password', 'snn' ); ?>
							<input type="password" name="basic_auth_pass" value="<?php echo esc_attr( $settings['basic_auth_pass'] ); ?>" autocomplete="new-password">
						</label>
						<label><?php esc_html_e( 'Pages per step', 'snn' ); ?>
							<input type="number" name="batch_pages" min="1" max="200" value="<?php echo esc_attr( (int) $settings['batch_pages'] ); ?>">
						</label>
						<label><?php esc_html_e( 'Seconds per step', 'snn' ); ?>
							<input type="number" name="batch_seconds" min="2" max="25" value="<?php echo esc_attr( (int) $settings['batch_seconds'] ); ?>">
						</label>
					</div>
					<label class="snn-sd-check"><input type="checkbox" name="run_in_background" value="1" <?php checked( ! empty( $settings['run_in_background'] ) ); ?>> <?php esc_html_e( 'Keep the export running with WP-Cron when this page is closed', 'snn' ); ?></label>
				</section>

				<p><button type="submit" class="button button-primary"><?php esc_html_e( 'Save settings', 'snn' ); ?></button></p>
			</form>

			<?php self::page_log(); ?>
		</div>
		<?php
	}

	/** Notice after save or other redirects. */
	private static function notices( $notice ) {
		$map = array(
			'saved'         => array( 'success', __( 'Settings saved.', 'snn' ) ),
			'saved_no_dir'  => array( 'warning', __( 'Settings saved. Choose a local folder before using the local delivery.', 'snn' ) ),
			'saved_bad_dir' => array( 'warning', __( 'Settings saved, but the local folder cannot be used. Check the path and permissions.', 'snn' ) ),
		);
		if ( ! isset( $map[ $notice ] ) ) {
			return;
		}
		printf( '<div class="notice notice-%1$s is-dismissible"><p>%2$s</p></div>', esc_attr( $map[ $notice ][0] ), esc_html( $map[ $notice ][1] ) );
	}

	/** One checkbox row. */
	private static function check( $key, $label, array $settings ) {
		printf(
			'<label class="snn-sd-check"><input type="checkbox" name="%1$s" value="1" %2$s> %3$s</label>',
			esc_attr( $key ),
			checked( ! empty( $settings[ $key ] ), true, false ),
			esc_html( $label )
		);
	}

	/** Labels for the page counters. */
	private static function count_labels() {
		return array(
			'total'                                  => __( 'URLs', 'snn' ),
			SNN_Static_Deploy_Pages::STATE_PENDING   => __( 'waiting', 'snn' ),
			SNN_Static_Deploy_Pages::STATE_DONE      => __( 'saved', 'snn' ),
			SNN_Static_Deploy_Pages::STATE_REDIRECT  => __( 'redirects', 'snn' ),
			SNN_Static_Deploy_Pages::STATE_MISSING   => __( 'not found', 'snn' ),
			SNN_Static_Deploy_Pages::STATE_FAILED    => __( 'failed', 'snn' ),
			SNN_Static_Deploy_Pages::STATE_SKIPPED   => __( 'skipped', 'snn' ),
		);
	}

	/** One line under the progress bar. */
	public static function status_line( array $status ) {
		$labels = array(
			'idle'      => __( 'No export has run yet.', 'snn' ),
			'running'   => __( 'Running', 'snn' ),
			'paused'    => __( 'Paused', 'snn' ),
			'done'      => __( 'Finished', 'snn' ),
			'failed'    => __( 'Failed', 'snn' ),
			'cancelled' => __( 'Cancelled', 'snn' ),
		);
		$state = isset( $labels[ $status['status'] ] ) ? $labels[ $status['status'] ] : $status['status'];
		if ( 'idle' === $status['status'] ) {
			return $state;
		}
		$stage = array(
			'discover'  => __( 'finding URLs', 'snn' ),
			'fetch'     => __( 'saving pages', 'snn' ),
			'not_found' => __( 'writing 404 page', 'snn' ),
			'deliver'   => __( 'delivering files', 'snn' ),
			'wrapup'    => __( 'cleaning up', 'snn' ),
			'finished'  => __( 'complete', 'snn' ),
		);
		$text = $state . ( isset( $stage[ $status['stage'] ] ) ? ' - ' . $stage[ $status['stage'] ] : '' );
		if ( ! empty( $status['error'] ) ) {
			$text .= ' - ' . $status['error'];
		}
		return $text;
	}

	/** The page log: every URL of the last export, with search and a state filter. */
	private static function page_log() {
		$state  = isset( $_GET['sd_state'] ) ? sanitize_key( wp_unslash( $_GET['sd_state'] ) ) : 'all';
		$search = isset( $_GET['sd_search'] ) ? sanitize_text_field( wp_unslash( $_GET['sd_search'] ) ) : '';
		$paged  = isset( $_GET['sd_paged'] ) ? max( 1, absint( $_GET['sd_paged'] ) ) : 1;
		$per    = 50;

		$data  = SNN_Static_Deploy_Pages::log_page( array( 'state' => $state, 'search' => $search, 'page' => $paged, 'per_page' => $per ) );
		$pages = max( 1, (int) ceil( $data['total'] / $per ) );
		$base  = admin_url( 'admin.php?page=' . self::PAGE_SLUG );
		?>
		<section class="snn-sd-card" aria-labelledby="snn-sd-log-title">
			<h2 id="snn-sd-log-title"><?php esc_html_e( 'Pages in the last export', 'snn' ); ?></h2>
			<form method="get" class="snn-sd-filter">
				<input type="hidden" name="page" value="<?php echo esc_attr( self::PAGE_SLUG ); ?>">
				<select name="sd_state" aria-label="<?php esc_attr_e( 'State', 'snn' ); ?>">
					<option value="all" <?php selected( $state, 'all' ); ?>><?php esc_html_e( 'All states', 'snn' ); ?></option>
					<?php foreach ( array( 'done', 'redirect', 'missing', 'failed', 'skipped', 'pending' ) as $option ) : ?>
						<option value="<?php echo esc_attr( $option ); ?>" <?php selected( $state, $option ); ?>><?php echo esc_html( $option ); ?></option>
					<?php endforeach; ?>
				</select>
				<input type="search" name="sd_search" value="<?php echo esc_attr( $search ); ?>" placeholder="<?php esc_attr_e( 'Search URL or message', 'snn' ); ?>">
				<button type="submit" class="button"><?php esc_html_e( 'Filter', 'snn' ); ?></button>
			</form>

			<table class="widefat striped snn-sd-table">
				<thead><tr>
					<th><?php esc_html_e( 'URL', 'snn' ); ?></th>
					<th><?php esc_html_e( 'State', 'snn' ); ?></th>
					<th><?php esc_html_e( 'HTTP', 'snn' ); ?></th>
					<th><?php esc_html_e( 'File', 'snn' ); ?></th>
					<th><?php esc_html_e( 'Note', 'snn' ); ?></th>
				</tr></thead>
				<tbody>
				<?php if ( empty( $data['rows'] ) ) : ?>
					<tr><td colspan="5"><?php esc_html_e( 'Nothing to show yet.', 'snn' ); ?></td></tr>
				<?php endif; ?>
				<?php foreach ( $data['rows'] as $row ) : ?>
					<tr>
						<td><code class="snn-sd-url"><?php echo esc_html( $row->url ); ?></code></td>
						<td><?php echo esc_html( $row->state ); ?></td>
						<td><?php echo null === $row->http_status_code ? '&mdash;' : esc_html( (string) $row->http_status_code ); ?></td>
						<td><?php echo ! empty( $row->file_path ) ? '<code>' . esc_html( $row->file_path ) . '</code>' : '&mdash;'; ?></td>
						<td><?php echo esc_html( (string) ( $row->error_message ?: $row->status_message ) ); ?></td>
					</tr>
				<?php endforeach; ?>
				</tbody>
			</table>

			<?php if ( $pages > 1 ) : ?>
				<p class="snn-sd-pager">
					<?php for ( $n = 1; $n <= min( $pages, 40 ); $n++ ) :
						$link = add_query_arg( array( 'sd_state' => $state, 'sd_search' => $search, 'sd_paged' => $n ), $base ); ?>
						<a class="button <?php echo $n === $paged ? 'button-primary' : ''; ?>" href="<?php echo esc_url( $link ); ?>"><?php echo (int) $n; ?></a>
					<?php endfor; ?>
				</p>
			<?php endif; ?>
		</section>
		<?php
	}
}
