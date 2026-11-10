<?php
/**
 * Static Deploy: the export job.
 *
 * A job goes through these stages:
 *   discover  list the URLs (crawlers)
 *   fetch     fetch and save pending pages in batches (the fetcher queues the links it finds)
 *   not_found write 404.html (once; new assets it links to are fetched after this)
 *   deliver   copy the files to the local folder, or add them to the ZIP, in batches
 *   wrapup    remove the working files and mark the job done
 *
 * A step runs for a short time budget (settings: batch_seconds, batch_pages) and then
 * returns. The admin page calls the step again and again, and WP-Cron continues the job
 * when the page is closed. A lock stops two steps from running at the same time. The
 * job is kept in one option, so pause, resume and cancel are simple state changes.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class SNN_Static_Deploy_Exporter {

	const JOB_OPTION   = 'snn_static_deploy_job';
	const LOCK_OPTION  = 'snn_static_deploy_lock';
	const LOCK_TTL     = 90;
	const MAX_MESSAGES = 400;
	const CRON_HOOK    = 'snn_static_deploy_cron';
	const ZIP_NAME     = 'export.zip';

	/**
	 * The saved job, or null.
	 *
	 * @return array|null
	 */
	public static function job() {
		$job = get_option( self::JOB_OPTION, null );
		return is_array( $job ) ? $job : null;
	}

	/**
	 * Snapshot for the admin page and the REST API.
	 *
	 * @return array
	 */
	public static function status() {
		$job   = self::job();
		$pages = SNN_Static_Deploy_Pages::counts();

		if ( null === $job ) {
			return array(
				'status'   => 'idle',
				'stage'    => '',
				'percent'  => 0,
				'counts'   => array(),
				'pages'    => $pages,
				'messages' => array(),
				'zip_ready' => false,
				'error'    => '',
				'job_id'   => '',
			);
		}

		$zip_ready = 'done' === $job['status'] && 'zip' === $job['settings']['delivery_method'] && is_file( (string) $job['zip_path'] );

		return array(
			'job_id'      => $job['id'],
			'status'      => $job['status'],
			'stage'       => $job['stage'],
			'percent'     => self::percent( $job, $pages ),
			'counts'      => $job['counts'],
			'pages'       => $pages,
			'messages'    => array_values( array_slice( $job['messages'], -200 ) ),
			'started_at'  => $job['started_at'],
			'finished_at' => $job['finished_at'],
			'error'       => $job['error'],
			'delivery'    => $job['settings']['delivery_method'],
			'local_dir'   => $job['settings']['local_dir'],
			'zip_ready'   => $zip_ready,
			'files'       => (int) $job['files'],
			'delivered'   => (int) $job['delivered'],
		);
	}

	/**
	 * Start a new export. The previous job's files are removed.
	 *
	 * @return array|WP_Error Status snapshot, or an error.
	 */
	public static function start() {
		$current = self::job();
		if ( null !== $current && in_array( $current['status'], array( 'running', 'paused' ), true ) ) {
			// A running job that has not saved anything for five minutes has no worker left
			// (the PHP process ended). It is replaced; a paused job is kept until it is cancelled.
			$idle = time() - (int) ( isset( $current['updated_at'] ) ? $current['updated_at'] : 0 );
			if ( 'running' !== $current['status'] || $idle < 300 ) {
				return new WP_Error( 'snn_sd_busy', __( 'An export is already running. Pause or cancel it first.', 'snn' ) );
			}
		}

		$settings = SNN_Static_Deploy_Options::get_all();
		if ( 'local' === $settings['delivery_method'] ) {
			$check = SNN_Static_Deploy_Delivery::prepare_local_dir( $settings['local_dir'], false );
			if ( is_wp_error( $check ) ) {
				return $check;
			}
		}

		if ( ! self::acquire_lock() ) {
			return new WP_Error( 'snn_sd_locked', __( 'Another step is running. Try again in a moment.', 'snn' ) );
		}

		try {
			self::delete_work_folders();
			SNN_Static_Deploy_Pages::install();
			SNN_Static_Deploy_Pages::reset();

			$id    = wp_generate_uuid4();
			$root  = trailingslashit( SNN_Static_Deploy_Delivery::work_root() ) . 'job-' . $id;
			$site  = $root . '/site';
			$tmp   = $root . '/tmp';
			if ( ! wp_mkdir_p( $site ) || ! wp_mkdir_p( $tmp ) ) {
				return new WP_Error( 'snn_sd_mkdir', __( 'The working folder could not be created.', 'snn' ) );
			}

			$job = array(
				'id'          => $id,
				'status'      => 'running',
				'stage'       => 'discover',
				'cursor'      => SNN_Static_Deploy_Crawler::new_cursor(),
				'settings'    => $settings,
				'root'        => $root,
				'site_dir'    => $site,
				'tmp_dir'     => $tmp,
				'zip_path'    => trailingslashit( $root ) . self::ZIP_NAME,
				'files'       => 0,
				'delivered'   => 0,
				'deliver_ready' => false,
				'not_found_done' => false,
				'counts'      => array( 'fetched' => 0, 'redirects' => 0, 'missing' => 0, 'failed' => 0, 'skipped' => 0, 'retries' => 0, 'discovered' => 0 ),
				'messages'    => array(),
				'error'       => '',
				'started_at'  => current_time( 'mysql' ),
				'finished_at' => '',
			);

			self::log( $job, 'info', __( 'Export started.', 'snn' ) );
			self::log( $job, 'info', sprintf(
				/* translators: 1: delivery method, 2: destination type. */
				__( 'Delivery: %1$s. Links: %2$s.', 'snn' ),
				'local' === $settings['delivery_method'] ? __( 'local folder', 'snn' ) : 'ZIP',
				$settings['destination_type']
			) );

			self::save( $job );
		} finally {
			self::release_lock();
		}

		return self::status();
	}

	/**
	 * Run one batch of work. Safe to call at any time: it does nothing when the job is
	 * not running or another step holds the lock.
	 *
	 * @return array Status snapshot.
	 */
	public static function step() {
		$job = self::job();
		if ( null === $job || 'running' !== $job['status'] ) {
			return self::status();
		}

		if ( ! self::acquire_lock() ) {
			return self::status();
		}

		try {
			$job      = self::job();
			$deadline = microtime( true ) + (float) max( 2, (int) $job['settings']['batch_seconds'] );

			switch ( $job['stage'] ) {
				case 'discover':
					$done = SNN_Static_Deploy_Crawler::run( $job['cursor'], $job['settings'], $deadline );
					if ( $done ) {
						$pending = SNN_Static_Deploy_Pages::count_pending();
						self::log( $job, 'success', sprintf(
							/* translators: %d: number of URLs queued. */
							__( 'Discovery finished: %d URLs queued.', 'snn' ),
							$pending
						) );
						$job['stage'] = 'fetch';
					}
					break;

				case 'fetch':
					self::fetch_batch( $job, $deadline );
					break;

				case 'not_found':
					self::generate_not_found( $job );
					$job['not_found_done'] = true;
					$job['stage']          = 'fetch';
					break;

				case 'deliver':
					self::deliver_batch( $job, $deadline );
					break;

				case 'wrapup':
					self::wrapup( $job );
					break;
			}

			self::save( $job );
		} catch ( \Throwable $e ) {
			$fresh = self::job();
			if ( null === $fresh ) {
				$fresh = array();
			}
			self::fail( $fresh, $e->getMessage() );
		} finally {
			self::release_lock();
		}

		self::maybe_schedule_cron();

		return self::status();
	}

	/**
	 * Pause: the next step does nothing until resume().
	 *
	 * @return array|WP_Error
	 */
	public static function pause() {
		$job = self::job();
		if ( null === $job || 'running' !== $job['status'] ) {
			return new WP_Error( 'snn_sd_not_running', __( 'The export is not running.', 'snn' ) );
		}
		$job['status'] = 'paused';
		self::log( $job, 'warning', __( 'Export paused.', 'snn' ) );
		self::save( $job );
		return self::status();
	}

	/**
	 * Resume a paused export.
	 *
	 * @return array|WP_Error
	 */
	public static function resume() {
		$job = self::job();
		if ( null === $job || 'paused' !== $job['status'] ) {
			return new WP_Error( 'snn_sd_not_paused', __( 'The export is not paused.', 'snn' ) );
		}
		$job['status'] = 'running';
		self::log( $job, 'info', __( 'Export resumed.', 'snn' ) );
		self::save( $job );
		self::maybe_schedule_cron();
		return self::status();
	}

	/**
	 * Cancel: the working files are removed. Finished deliveries (copied files) stay.
	 *
	 * @return array|WP_Error
	 */
	public static function cancel() {
		$job = self::job();
		if ( null === $job || ! in_array( $job['status'], array( 'running', 'paused' ), true ) ) {
			return new WP_Error( 'snn_sd_not_running', __( 'There is no running export to cancel.', 'snn' ) );
		}
		$job['status']      = 'cancelled';
		$job['finished_at'] = current_time( 'mysql' );
		self::log( $job, 'warning', __( 'Export cancelled. Working files removed.', 'snn' ) );
		SNN_Static_Deploy_Delivery::remove_tree( (string) $job['root'] );
		self::save( $job );
		wp_clear_scheduled_hook( self::CRON_HOOK );
		return self::status();
	}

	/**
	 * WP-Cron entry point.
	 *
	 * @return void
	 */
	public static function cron_step() {
		self::step();
	}

	/**
	 * Path of the finished ZIP for the download handler, or ''.
	 *
	 * @param string $job_id Job ID the caller asked for.
	 * @return string
	 */
	public static function zip_path_for( $job_id ) {
		$job = self::job();
		if ( null === $job || $job['id'] !== (string) $job_id || 'done' !== $job['status'] ) {
			return '';
		}
		return is_file( $job['zip_path'] ) ? (string) $job['zip_path'] : '';
	}

	// ---------------------------------------------------------------------
	// Stages
	// ---------------------------------------------------------------------

	/** Fetch the next pending pages until the deadline. */
	private static function fetch_batch( array &$job, $deadline ) {
		$settings = $job['settings'];
		$rows     = SNN_Static_Deploy_Pages::next_pending( (int) $settings['batch_pages'] );

		if ( empty( $rows ) ) {
			if ( ! $job['not_found_done'] && ! empty( $settings['generate_404'] ) ) {
				$job['stage'] = 'not_found';
			} else {
				$job['stage'] = 'deliver';
			}
			return;
		}

		$ctx = array(
			'site_dir' => $job['site_dir'],
			'tmp_dir'  => $job['tmp_dir'],
			'settings' => $settings,
		);

		foreach ( $rows as $row ) {
			if ( microtime( true ) >= $deadline ) {
				break;
			}

			$result   = SNN_Static_Deploy_Fetcher::process( $row, $ctx );
			$attempts = (int) $row->fetch_attempts + 1;

			$fields = array(
				'http_status_code' => $result['status'],
				'content_type'     => $result['content_type'],
				'file_path'        => $result['file_path'],
				'redirect_url'     => $result['redirect_url'],
				'status_message'   => '' !== $result['message'] ? substr( $result['message'], 0, 255 ) : null,
				'error_message'    => '' !== $result['error'] ? $result['error'] : null,
				'fetch_attempts'   => $attempts,
				'fetched_at'       => current_time( 'mysql' ),
			);

			if ( $result['retry'] ) {
				$job['counts']['retries']++;
				if ( $attempts >= SNN_Static_Deploy_Pages::MAX_ATTEMPTS ) {
					$fields['state'] = SNN_Static_Deploy_Pages::STATE_FAILED;
					$job['counts']['failed']++;
					self::log( $job, 'error', sprintf( __( 'Gave up after %1$d attempts: %2$s', 'snn' ), $attempts, $result['error'] ), $row->url );
				} else {
					$fields['state'] = SNN_Static_Deploy_Pages::STATE_PENDING;
					self::log( $job, 'warning', sprintf( __( 'Will retry (attempt %1$d): %2$s', 'snn' ), $attempts, $result['error'] ), $row->url );
				}
			} else {
				$fields['state'] = $result['state'];
				self::count_result( $job, $result['state'] );
				self::log_result( $job, $row->url, $result );
			}

			// Only rows that hold a file on disk keep a file path (the delivery and the checks rely on it).
			if ( ! in_array( $fields['state'], array( SNN_Static_Deploy_Pages::STATE_DONE, SNN_Static_Deploy_Pages::STATE_REDIRECT ), true ) || null === $result['file_path'] ) {
				$fields['file_path'] = null;
			}

			SNN_Static_Deploy_Pages::update( (int) $row->id, $fields );

			foreach ( (array) $result['discovered'] as $found ) {
				if ( SNN_Static_Deploy_Crawler::enqueue( $found, $settings, 'page', '', (int) $row->id ) ) {
					$job['counts']['discovered']++;
				}
			}
		}
	}

	/** Write 404.html from a custom 404 page or from an address that does not exist. */
	private static function generate_not_found( array &$job ) {
		$settings = $job['settings'];
		$custom   = (int) $settings['custom_404_page'];
		$permalink = $custom > 0 ? get_permalink( $custom ) : '';

		$candidates = array();
		if ( is_string( $permalink ) && '' !== $permalink ) {
			$candidates[] = array( 'url' => $permalink, 'accept' => array( 200, 404 ) );
		}
		$candidates[] = array(
			'url'    => trailingslashit( home_url( '/' ) ) . 'snn-static-404-' . strtolower( wp_generate_password( 10, false, false ) ) . '/',
			'accept' => array( 404 ),
		);

		foreach ( $candidates as $candidate ) {
			$resp = wp_remote_get( $candidate['url'], SNN_Static_Deploy_Fetcher::request_args( $candidate['url'], $settings ) );
			if ( is_wp_error( $resp ) ) {
				continue;
			}
			$code = (int) wp_remote_retrieve_response_code( $resp );
			if ( ! in_array( $code, $candidate['accept'], true ) ) {
				continue;
			}

			$rewriter = new SNN_Static_Deploy_Rewriter( $candidate['url'], '404.html', $settings );
			$html     = $rewriter->html( (string) wp_remote_retrieve_body( $resp ) );
			if ( false === file_put_contents( trailingslashit( $job['site_dir'] ) . '404.html', $html ) ) {
				self::log( $job, 'error', __( 'Unable to write 404.html.', 'snn' ) );
				return;
			}
			foreach ( $rewriter->found() as $found ) {
				SNN_Static_Deploy_Crawler::enqueue( $found, $settings );
			}
			self::log( $job, 'success', sprintf( __( '404 page written from %s', 'snn' ), $candidate['url'] ) );
			return;
		}

		self::log( $job, 'warning', __( 'No 404 page could be written. Check the custom 404 page setting.', 'snn' ) );
	}

	/** Copy or zip the finished files, in batches. */
	private static function deliver_batch( array &$job, $deadline ) {
		$settings = $job['settings'];
		$list     = trailingslashit( $job['root'] ) . 'files.json';

		if ( ! $job['deliver_ready'] ) {
			// An export without its home page is not a site: stop instead of delivering nothing.
			$home = SNN_Static_Deploy_Pages::get_by_url( SNN_Static_Deploy_URL::normalize( trailingslashit( home_url( '/' ) ) ) );
			if ( ! $home || ! in_array( $home->state, array( SNN_Static_Deploy_Pages::STATE_DONE, SNN_Static_Deploy_Pages::STATE_REDIRECT ), true ) || '' === (string) $home->file_path ) {
				$detail = $home && '' !== (string) $home->error_message ? ' ' . $home->error_message : '';
				self::fail( $job, sprintf(
					/* translators: %s: the error reported for the home page, if any. */
					__( 'The home page was not saved, so the export is incomplete.%s Check that this site answers its own requests from this server (it must be able to load its pages while the export runs).', 'snn' ),
					$detail
				) );
				return;
			}

			$files = SNN_Static_Deploy_Delivery::list_files( $job['site_dir'] );
			file_put_contents( $list, wp_json_encode( $files ) );
			$job['files']         = count( $files );
			$job['delivered']     = 0;
			$job['deliver_ready'] = true;

			if ( 'local' === $settings['delivery_method'] ) {
				$ready = SNN_Static_Deploy_Delivery::prepare_local_dir( $settings['local_dir'], ! empty( $settings['clear_local_dir'] ) );
				if ( is_wp_error( $ready ) ) {
					self::fail( $job, $ready->get_error_message() );
					return;
				}
				self::log( $job, 'info', sprintf( __( 'Copying %1$d files to %2$s', 'snn' ), $job['files'], $settings['local_dir'] ) );
			} else {
				if ( is_file( $job['zip_path'] ) ) {
					@unlink( $job['zip_path'] );
				}
				self::log( $job, 'info', sprintf( __( 'Adding %d files to the ZIP archive', 'snn' ), $job['files'] ) );
			}
		}

		$files = json_decode( (string) file_get_contents( $list ), true );
		$files = is_array( $files ) ? $files : array();
		$batch = max( 20, (int) $settings['batch_pages'] * 20 );

		while ( (int) $job['delivered'] < count( $files ) && microtime( true ) < $deadline ) {
			if ( 'local' === $settings['delivery_method'] ) {
				$res = SNN_Static_Deploy_Delivery::copy_batch( $job['site_dir'], $settings['local_dir'], $files, (int) $job['delivered'], $batch );
			} else {
				$res = SNN_Static_Deploy_Delivery::zip_batch( $job['site_dir'], $job['zip_path'], $files, (int) $job['delivered'], $batch );
			}

			if ( '' !== $res['error'] ) {
				self::fail( $job, $res['error'] );
				return;
			}
			$before           = (int) $job['delivered'];
			$job['delivered'] = (int) $res['next'];
			if ( (int) $res['next'] <= $before ) {
				// No progress: stop here rather than loop until the deadline.
				break;
			}
		}

		if ( (int) $job['delivered'] >= count( $files ) ) {
			@unlink( $list );
			$job['stage'] = 'wrapup';
		}
	}

	/** Remove the working files and mark the job done. */
	private static function wrapup( array &$job ) {
		SNN_Static_Deploy_Delivery::remove_tree( $job['site_dir'] );
		@unlink( trailingslashit( $job['root'] ) . 'files.json' );
		SNN_Static_Deploy_Delivery::remove_tree( $job['tmp_dir'] );

		$job['status']      = 'done';
		$job['stage']       = 'finished';
		$job['finished_at'] = current_time( 'mysql' );

		$counts = SNN_Static_Deploy_Pages::counts();
		self::log( $job, 'success', sprintf(
			/* translators: 1: pages saved, 2: number of files delivered. */
			__( 'Done: %1$d URLs saved, %2$d files delivered.', 'snn' ),
			(int) $counts[ SNN_Static_Deploy_Pages::STATE_DONE ] + (int) $counts[ SNN_Static_Deploy_Pages::STATE_REDIRECT ],
			(int) $job['delivered']
		) );
		if ( 'zip' === $job['settings']['delivery_method'] ) {
			self::log( $job, 'success', __( 'The ZIP archive is ready to download.', 'snn' ) );
		}
		wp_clear_scheduled_hook( self::CRON_HOOK );
	}

	// ---------------------------------------------------------------------
	// Helpers
	// ---------------------------------------------------------------------

	private static function count_result( array &$job, $state ) {
		if ( SNN_Static_Deploy_Pages::STATE_DONE === $state ) {
			$job['counts']['fetched']++;
		} elseif ( SNN_Static_Deploy_Pages::STATE_REDIRECT === $state ) {
			$job['counts']['redirects']++;
		} elseif ( SNN_Static_Deploy_Pages::STATE_MISSING === $state ) {
			$job['counts']['missing']++;
		} elseif ( SNN_Static_Deploy_Pages::STATE_FAILED === $state ) {
			$job['counts']['failed']++;
		} elseif ( SNN_Static_Deploy_Pages::STATE_SKIPPED === $state ) {
			$job['counts']['skipped']++;
		}
	}

	private static function log_result( array &$job, $url, array $result ) {
		$code = null === $result['status'] ? '' : ' ' . (int) $result['status'];
		switch ( $result['state'] ) {
			case SNN_Static_Deploy_Pages::STATE_DONE:
				self::log( $job, 'info', sprintf( '%s%s', __( 'Saved', 'snn' ), $code ), $url );
				break;
			case SNN_Static_Deploy_Pages::STATE_REDIRECT:
				self::log( $job, 'info', sprintf( '%s%s: %s', __( 'Redirect', 'snn' ), $code, $result['message'] ), $url );
				break;
			case SNN_Static_Deploy_Pages::STATE_MISSING:
				self::log( $job, 'warning', sprintf( '%s%s: %s', __( 'Not saved', 'snn' ), $code, $result['message'] ), $url );
				break;
			case SNN_Static_Deploy_Pages::STATE_SKIPPED:
				self::log( $job, 'info', sprintf( '%s: %s', __( 'Skipped', 'snn' ), $result['message'] ), $url );
				break;
			case SNN_Static_Deploy_Pages::STATE_FAILED:
				self::log( $job, 'error', sprintf( '%s: %s', __( 'Failed', 'snn' ), $result['error'] ), $url );
				break;
		}
	}

	/**
	 * Append a message to the job log.
	 *
	 * @param array  $job  Job (by reference).
	 * @param string $type info | success | warning | error.
	 * @param string $text Message.
	 * @param string $url  Optional URL.
	 * @return void
	 */
	public static function log( array &$job, $type, $text, $url = '' ) {
		$job['messages'][] = array(
			't'    => current_time( 'H:i:s' ),
			'type' => $type,
			'text' => wp_strip_all_tags( (string) $text ),
			'url'  => (string) $url,
		);
		if ( count( $job['messages'] ) > self::MAX_MESSAGES ) {
			$job['messages'] = array_slice( $job['messages'], -self::MAX_MESSAGES );
		}
	}

	/** Mark the job failed with a message. The caller's copy is updated too. */
	private static function fail( array &$job, $message ) {
		$job['status']      = 'failed';
		$job['error']       = (string) $message;
		$job['finished_at'] = current_time( 'mysql' );
		self::log( $job, 'error', (string) $message );
		self::save( $job );
		wp_clear_scheduled_hook( self::CRON_HOOK );
	}

	/** Progress from 0 to 100, weighted by stage. */
	private static function percent( array $job, array $pages ) {
		switch ( $job['stage'] ) {
			case 'discover':
				return 3;
			case 'fetch':
				$total = (int) $pages['total'];
				$done  = $total - (int) $pages[ SNN_Static_Deploy_Pages::STATE_PENDING ];
				return $total > 0 ? (int) floor( 5 + 85 * $done / $total ) : 5;
			case 'not_found':
				return 91;
			case 'deliver':
				$files = max( 1, (int) $job['files'] );
				return (int) floor( 92 + 7 * min( 1, (int) $job['delivered'] / $files ) );
			case 'finished':
				return 100;
			default:
				return 95;
		}
	}

	/** Store the job. */
	private static function save( array $job ) {
		$job['updated_at'] = time();
		update_option( self::JOB_OPTION, $job, false );
	}

	/** Schedule a WP-Cron continuation while the job runs in the background. */
	private static function maybe_schedule_cron() {
		$job = self::job();
		if ( null === $job || 'running' !== $job['status'] || empty( $job['settings']['run_in_background'] ) ) {
			return;
		}
		if ( ! wp_next_scheduled( self::CRON_HOOK ) ) {
			wp_schedule_single_event( time() + 20, self::CRON_HOOK );
		}
	}

	/** Atomic lock: one step at a time, stale after LOCK_TTL seconds. */
	private static function acquire_lock() {
		$now = time();
		if ( add_option( self::LOCK_OPTION, $now, '', false ) ) {
			return true;
		}
		$held = (int) get_option( self::LOCK_OPTION, 0 );
		if ( $held > 0 && ( $now - $held ) < self::LOCK_TTL ) {
			return false;
		}
		delete_option( self::LOCK_OPTION );
		return (bool) add_option( self::LOCK_OPTION, $now, '', false );
	}

	private static function release_lock() {
		delete_option( self::LOCK_OPTION );
	}

	/** Remove the working folders of earlier jobs. */
	private static function delete_work_folders() {
		$root = trailingslashit( SNN_Static_Deploy_Delivery::work_root() );
		foreach ( (array) glob( $root . 'job-*', GLOB_ONLYDIR ) as $dir ) {
			SNN_Static_Deploy_Delivery::remove_tree( $dir );
		}
	}
}
