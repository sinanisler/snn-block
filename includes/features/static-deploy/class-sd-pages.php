<?php
/**
 * Static Deploy: the page table.
 *
 * One row per URL in the export. The row is the queue (state = pending) and the
 * export log (status code, file, message) at the same time. A full export empties
 * the table at its start.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class SNN_Static_Deploy_Pages {

	const SCHEMA_VERSION = '1';
	const SCHEMA_OPTION  = 'snn_static_deploy_schema';
	const MAX_ATTEMPTS   = 3;

	const STATE_PENDING  = 'pending';
	const STATE_DONE     = 'done';      // Fetched and saved (or copied).
	const STATE_REDIRECT = 'redirect';  // Redirect followed or written as a page.
	const STATE_MISSING  = 'missing';   // Answered 404 or a non-200 status without a file.
	const STATE_FAILED   = 'failed';    // Gave up after MAX_ATTEMPTS.
	const STATE_SKIPPED  = 'skipped';   // Excluded or not a local URL.

	public static function table() {
		global $wpdb;
		return $wpdb->prefix . 'snn_static_pages';
	}

	/**
	 * Create or update the table when the schema version changes.
	 *
	 * @return void
	 */
	public static function install() {
		if ( self::SCHEMA_VERSION === get_option( self::SCHEMA_OPTION ) ) {
			return;
		}

		global $wpdb;
		require_once ABSPATH . 'wp-admin/includes/upgrade.php';

		$table   = self::table();
		$charset = $wpdb->get_charset_collate();

		dbDelta(
			"CREATE TABLE {$table} (
				id BIGINT(20) UNSIGNED NOT NULL AUTO_INCREMENT,
				url_hash CHAR(40) NOT NULL,
				url TEXT NOT NULL,
				source_path TEXT NULL,
				file_path VARCHAR(1024) NULL,
				handler VARCHAR(20) NOT NULL DEFAULT 'page',
				state VARCHAR(12) NOT NULL DEFAULT 'pending',
				found_on_id BIGINT(20) UNSIGNED NULL,
				http_status_code SMALLINT(6) NULL,
				content_type VARCHAR(190) NULL,
				redirect_url TEXT NULL,
				status_message VARCHAR(255) NULL,
				error_message TEXT NULL,
				fetch_attempts TINYINT(3) UNSIGNED NOT NULL DEFAULT 0,
				fetched_at DATETIME NULL,
				PRIMARY KEY  (id),
				UNIQUE KEY url_hash (url_hash),
				KEY state (state)
			) {$charset};"
		);

		update_option( self::SCHEMA_OPTION, self::SCHEMA_VERSION, false );
	}

	/**
	 * Empty the table before a full export.
	 *
	 * @return void
	 */
	public static function reset() {
		global $wpdb;
		$wpdb->query( 'TRUNCATE TABLE ' . self::table() );
	}

	/**
	 * Add a URL to the queue. Existing rows are left alone.
	 *
	 * @param string $url         Normalized absolute URL.
	 * @param int    $found_on_id Row ID of the page where the URL was found (0 = crawler).
	 * @param string $handler     page | file | 404.
	 * @param string $source_path Absolute disk path to copy (handler file only).
	 * @param string $status      Short note for the log.
	 * @return int Row ID, or 0 on failure.
	 */
	public static function add( $url, $found_on_id = 0, $handler = 'page', $source_path = '', $status = '' ) {
		global $wpdb;
		$table = self::table();
		$hash  = sha1( $url );

		$existing = $wpdb->get_var( $wpdb->prepare( "SELECT id FROM {$table} WHERE url_hash = %s", $hash ) );
		if ( $existing ) {
			return (int) $existing;
		}

		$inserted = $wpdb->insert(
			$table,
			array(
				'url_hash'     => $hash,
				'url'          => $url,
				'source_path'  => '' !== $source_path ? $source_path : null,
				'handler'      => $handler,
				'state'        => self::STATE_PENDING,
				'found_on_id'  => $found_on_id > 0 ? (int) $found_on_id : null,
				'status_message' => '' !== $status ? substr( $status, 0, 255 ) : null,
			),
			array( '%s', '%s', '%s', '%s', '%s', '%d', '%s' )
		);

		return false === $inserted ? 0 : (int) $wpdb->insert_id;
	}

	/**
	 * A row by ID.
	 *
	 * @param int $id Row ID.
	 * @return object|null
	 */
	public static function get( $id ) {
		global $wpdb;
		return $wpdb->get_row( $wpdb->prepare( 'SELECT * FROM ' . self::table() . ' WHERE id = %d', (int) $id ) );
	}

	/**
	 * A row by URL.
	 *
	 * @param string $url URL.
	 * @return object|null
	 */
	public static function get_by_url( $url ) {
		global $wpdb;
		return $wpdb->get_row( $wpdb->prepare( 'SELECT * FROM ' . self::table() . ' WHERE url_hash = %s', sha1( $url ) ) );
	}

	/**
	 * Update columns of one row.
	 *
	 * @param int   $id     Row ID.
	 * @param array $fields Column => value. Use null to clear a column.
	 * @return void
	 */
	public static function update( $id, array $fields ) {
		global $wpdb;
		$formats = array();
		foreach ( $fields as $key => $value ) {
			if ( null === $value ) {
				$formats[] = '%s';
			} elseif ( is_int( $value ) ) {
				$formats[] = '%d';
			} else {
				$formats[] = '%s';
			}
		}
		// wpdb::update() writes NULL for null values when the format is %s.
		$wpdb->update( self::table(), $fields, array( 'id' => (int) $id ), $formats, array( '%d' ) );
	}

	/**
	 * Rows waiting to be fetched, oldest first.
	 *
	 * @param int $limit Number of rows.
	 * @return object[]
	 */
	public static function next_pending( $limit ) {
		global $wpdb;
		return $wpdb->get_results( $wpdb->prepare(
			'SELECT * FROM ' . self::table() . ' WHERE state = %s AND fetch_attempts < %d ORDER BY id ASC LIMIT %d',
			self::STATE_PENDING,
			self::MAX_ATTEMPTS,
			(int) $limit
		) );
	}

	/**
	 * Number of rows that are still pending (including ones that may retry).
	 *
	 * @return int
	 */
	public static function count_pending() {
		global $wpdb;
		return (int) $wpdb->get_var( $wpdb->prepare( 'SELECT COUNT(*) FROM ' . self::table() . ' WHERE state = %s', self::STATE_PENDING ) );
	}

	/**
	 * Row counts by state.
	 *
	 * @return array state => count
	 */
	public static function counts() {
		global $wpdb;
		$rows   = $wpdb->get_results( 'SELECT state, COUNT(*) AS n FROM ' . self::table() . ' GROUP BY state', ARRAY_A );
		$counts = array(
			self::STATE_PENDING  => 0,
			self::STATE_DONE     => 0,
			self::STATE_REDIRECT => 0,
			self::STATE_MISSING  => 0,
			self::STATE_FAILED   => 0,
			self::STATE_SKIPPED  => 0,
		);
		foreach ( (array) $rows as $row ) {
			$counts[ $row['state'] ] = (int) $row['n'];
		}
		$counts['total'] = array_sum( $counts );
		return $counts;
	}

	/**
	 * Rows with a file on disk in the export (for delivery and the file count).
	 *
	 * @return object[]
	 */
	public static function with_files() {
		global $wpdb;
		return $wpdb->get_results( 'SELECT id, url, file_path FROM ' . self::table() . " WHERE file_path IS NOT NULL AND file_path <> '' ORDER BY id ASC" );
	}

	/**
	 * Log page: rows for the admin table.
	 *
	 * @param array $args Keys: per_page, page, state, search.
	 * @return array { rows, total }
	 */
	public static function log_page( array $args ) {
		global $wpdb;
		$table    = self::table();
		$per_page = max( 1, min( 200, (int) ( isset( $args['per_page'] ) ? $args['per_page'] : 50 ) ) );
		$page     = max( 1, (int) ( isset( $args['page'] ) ? $args['page'] : 1 ) );
		$where    = array( '1=1' );
		$params   = array();

		$state = isset( $args['state'] ) ? (string) $args['state'] : '';
		if ( '' !== $state && 'all' !== $state ) {
			$where[]  = 'state = %s';
			$params[] = $state;
		}

		$search = isset( $args['search'] ) ? trim( (string) $args['search'] ) : '';
		if ( '' !== $search ) {
			$where[]  = '(url LIKE %s OR status_message LIKE %s OR error_message LIKE %s)';
			$like     = '%' . $wpdb->esc_like( $search ) . '%';
			$params[] = $like;
			$params[] = $like;
			$params[] = $like;
		}

		$where_sql = implode( ' AND ', $where );
		$total_sql = "SELECT COUNT(*) FROM {$table} WHERE {$where_sql}";
		$total     = (int) ( empty( $params ) ? $wpdb->get_var( $total_sql ) : $wpdb->get_var( $wpdb->prepare( $total_sql, $params ) ) );

		$offset   = ( $page - 1 ) * $per_page;
		$rows_sql = "SELECT * FROM {$table} WHERE {$where_sql} ORDER BY id ASC LIMIT %d OFFSET %d";
		$rows     = $wpdb->get_results( $wpdb->prepare( $rows_sql, array_merge( $params, array( $per_page, $offset ) ) ) );

		return array(
			'rows'  => (array) $rows,
			'total' => $total,
		);
	}
}
