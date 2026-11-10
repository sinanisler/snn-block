<?php
/**
 * Static Deploy: settings storage.
 *
 * All settings live in one option. Defaults are merged on read, so a new setting
 * never needs a migration. The running export keeps its own copy of the settings
 * (see SNN_Static_Deploy_Exporter), so editing the form mid-export changes nothing.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class SNN_Static_Deploy_Options {

	const OPTION = 'snn_static_deploy_settings';

	/**
	 * Default values for every setting.
	 *
	 * @return array
	 */
	public static function defaults() {
		return array(
			'destination_type'   => 'relative',   // relative | absolute | offline.
			'destination_scheme' => 'https://',   // Used by absolute only.
			'destination_host'   => '',           // Used by absolute only.
			'relative_path'      => '',           // Used by relative only, e.g. '' or '/sub'.
			'origin_url'         => '',           // WordPress URL to crawl. Empty = home_url().
			'delivery_method'    => 'zip',        // zip | local.
			'local_dir'          => '',           // Used by local only.
			'clear_local_dir'    => false,        // Empty the local folder before a local export.
			'crawl_posts'        => true,
			'post_types'         => array( 'post', 'page' ),
			'crawl_taxonomies'   => true,
			'taxonomies'         => array( 'category', 'post_tag' ),
			'crawl_archives'     => true,         // Post type archives and taxonomy term archives.
			'crawl_authors'      => true,
			'crawl_dates'        => true,         // Yearly and monthly archives.
			'crawl_pagination'   => true,         // /page/N/ of every archive.
			'crawl_sitemap'      => true,         // wp-sitemap.xml and the sitemaps it lists.
			'crawl_robots'       => true,         // /robots.txt.
			'add_feeds'          => false,        // RSS and Atom feeds, with feed/index.html redirect.
			'generate_404'       => true,         // Writes 404.html.
			'custom_404_page'    => 0,            // Post ID whose permalink is fetched as 404.html.
			'smart_crawl'        => true,         // Pages come from the crawlers; links only add assets.
			'additional_urls'    => '',           // One URL or path per line.
			'additional_files'   => '',           // One absolute file path per line (under ABSPATH).
			'exclude_urls'       => '',           // One substring or /regex/ per line.
			'basic_auth_user'    => '',           // For sites behind HTTP Basic Auth.
			'basic_auth_pass'    => '',
			'batch_pages'        => 10,           // Pages fetched per step.
			'batch_seconds'      => 8,            // Time budget per step, in seconds.
			'run_in_background'  => true,         // WP-Cron keeps an export going when the tab is closed.
		);
	}

	/**
	 * All settings, saved values over defaults.
	 *
	 * @return array
	 */
	public static function get_all() {
		$stored = get_option( self::OPTION, array() );
		return array_merge( self::defaults(), is_array( $stored ) ? $stored : array() );
	}

	/**
	 * One setting.
	 *
	 * @param string $key Setting name.
	 * @return mixed
	 */
	public static function get( $key ) {
		$all = self::get_all();
		return array_key_exists( $key, $all ) ? $all[ $key ] : null;
	}

	/**
	 * Save changed settings. Missing boolean keys count as off, because an unchecked
	 * checkbox is not posted at all.
	 *
	 * @param array $input Raw input, e.g. $_POST.
	 * @return bool
	 */
	public static function update( array $input ) {
		$current = self::get_all();
		$clean   = self::sanitize( $input, $current );
		return update_option( self::OPTION, array_merge( $current, $clean ), false );
	}

	/**
	 * Sanitize raw input. Keys not in defaults() are dropped.
	 *
	 * @param array $input   Raw input.
	 * @param array $current Current settings (used for keys that are not posted).
	 * @return array
	 */
	public static function sanitize( array $input, array $current = array() ) {
		$defaults = self::defaults();
		$clean    = array();
		$bools    = array( 'crawl_posts', 'crawl_taxonomies', 'crawl_archives', 'crawl_authors', 'crawl_dates', 'crawl_pagination', 'crawl_sitemap', 'crawl_robots', 'add_feeds', 'generate_404', 'smart_crawl', 'clear_local_dir', 'run_in_background' );

		foreach ( $defaults as $key => $default ) {
			if ( ! array_key_exists( $key, $input ) && ! in_array( $key, $bools, true ) ) {
				// Not posted: keep the current value (e.g. a REST call that sends only some keys).
				$clean[ $key ] = array_key_exists( $key, $current ) ? $current[ $key ] : $default;
				continue;
			}

			$value = isset( $input[ $key ] ) ? $input[ $key ] : null;

			switch ( $key ) {
				case 'destination_type':
					$clean[ $key ] = in_array( $value, array( 'relative', 'absolute', 'offline' ), true ) ? $value : 'relative';
					break;

				case 'destination_scheme':
					$clean[ $key ] = in_array( $value, array( 'https://', 'http://' ), true ) ? $value : 'https://';
					break;

				case 'destination_host':
					$clean[ $key ] = self::clean_host( (string) $value );
					break;

				case 'relative_path':
					$clean[ $key ] = self::clean_relative_path( (string) $value );
					break;

				case 'origin_url':
					$clean[ $key ] = esc_url_raw( trim( (string) $value ) );
					break;

				case 'delivery_method':
					$clean[ $key ] = 'local' === $value ? 'local' : 'zip';
					break;

				case 'local_dir':
					$clean[ $key ] = self::clean_local_dir( (string) $value );
					break;

				case 'post_types':
					// Attachments are never offered in the form (their pages are not exported).
					$allowed       = array_diff( array_keys( get_post_types( array( 'public' => true ), 'names' ) ), array( 'attachment' ) );
					$clean[ $key ] = self::clean_list_of_keys( $value, $allowed );
					break;

				case 'taxonomies':
					$clean[ $key ] = self::clean_list_of_keys( $value, array_keys( get_taxonomies( array( 'public' => true ), 'names' ) ) );
					break;

				case 'additional_urls':
				case 'additional_files':
				case 'exclude_urls':
					$clean[ $key ] = self::clean_multiline( (string) $value );
					break;

				case 'basic_auth_user':
				case 'basic_auth_pass':
					$clean[ $key ] = sanitize_text_field( (string) $value );
					break;

				case 'custom_404_page':
					$clean[ $key ] = absint( $value );
					break;

				case 'batch_pages':
					$clean[ $key ] = max( 1, min( 200, absint( $value ) ) );
					break;

				case 'batch_seconds':
					$clean[ $key ] = max( 2, min( 25, absint( $value ) ) );
					break;

				default:
					// Boolean switches: an unchecked box is absent from the input.
					$clean[ $key ] = in_array( $key, $bools, true ) ? ! empty( $input[ $key ] ) : $value;
			}
		}

		return $clean;
	}

	/**
	 * Host name or IP, without scheme, path or spaces.
	 *
	 * @param string $host Raw host.
	 * @return string
	 */
	public static function clean_host( $host ) {
		$host = strtolower( trim( $host ) );
		$host = preg_replace( '#^https?://#', '', $host );
		$host = preg_replace( '#[/\s].*$#', '', $host );
		return preg_replace( '/[^a-z0-9.\-:\[\]]/', '', (string) $host );
	}

	/**
	 * Relative path with no leading or trailing slash and no dot segments.
	 * '' means the site is at the root.
	 *
	 * @param string $path Raw path.
	 * @return string Path starting with '/' or ''.
	 */
	public static function clean_relative_path( $path ) {
		$parts = array_filter(
			explode( '/', str_replace( '\\', '/', trim( $path ) ) ),
			static function ( $segment ) {
				return '' !== $segment && '.' !== $segment && '..' !== $segment;
			}
		);
		$parts = array_map( 'sanitize_title_with_dashes', $parts );
		$parts = array_filter( $parts, 'strlen' );

		return empty( $parts ) ? '' : '/' . implode( '/', $parts );
	}

	/**
	 * Local folder: an absolute path without a trailing slash. Relative paths are rejected.
	 *
	 * @param string $dir Raw path.
	 * @return string
	 */
	public static function clean_local_dir( $dir ) {
		$dir = trim( $dir );
		if ( '' === $dir ) {
			return '';
		}
		$dir = wp_normalize_path( $dir );
		if ( ! preg_match( '#^([a-zA-Z]:/|/)#', $dir ) ) {
			return '';
		}
		return untrailingslashit( $dir );
	}

	/**
	 * Keep only the values that are in the allowed list.
	 *
	 * @param mixed $value   Raw list.
	 * @param array $allowed Allowed keys.
	 * @return array
	 */
	public static function clean_list_of_keys( $value, array $allowed ) {
		if ( ! is_array( $value ) ) {
			return array();
		}
		$clean = array();
		foreach ( $value as $item ) {
			$item = sanitize_key( (string) $item );
			if ( '' !== $item && in_array( $item, $allowed, true ) ) {
				$clean[] = $item;
			}
		}
		return array_values( array_unique( $clean ) );
	}

	/**
	 * Textarea lines: trimmed, empty lines removed, length capped.
	 *
	 * @param string $text Raw text.
	 * @return string
	 */
	public static function clean_multiline( $text ) {
		$lines = preg_split( '/\r\n|\r|\n/', (string) $text );
		$lines = array_map( 'trim', $lines );
		$lines = array_filter( $lines, static function ( $line ) {
			return '' !== $line && strlen( $line ) <= 2048;
		} );
		return implode( "\n", array_slice( $lines, 0, 2000 ) );
	}
}
