<?php
/**
 * Static Deploy: URL discovery from WordPress.
 *
 * The crawlers list the URLs WordPress knows about: posts, pages, archives, terms,
 * authors, dates, sitemaps, robots.txt, feeds and the extra URLs and files set in the
 * settings. Each stage works in small chunks and keeps a cursor, so a large site is
 * listed over several short steps. Links found inside the saved pages are queued by
 * the fetcher (see SNN_Static_Deploy_Rewriter).
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class SNN_Static_Deploy_Crawler {

	const CHUNK = 200;

	/** Stages in order. The cursor's 'stage' is one of these, or 'done'. */
	const STAGES = array( 'home', 'posts', 'archives', 'taxonomies', 'authors', 'dates', 'sitemap', 'robots', 'feeds', 'additional' );

	/**
	 * Empty cursor for a new discovery.
	 *
	 * @return array
	 */
	public static function new_cursor() {
		return array(
			'stage'   => self::STAGES[0],
			'index'   => 0,
			'last_id' => 0,
			'offset'  => 0,
			'added'   => 0,
		);
	}

	/**
	 * Run discovery until it is finished or the deadline passes.
	 *
	 * @param array $cursor   Cursor, updated in place.
	 * @param array $settings Settings snapshot.
	 * @param float $deadline microtime(true) value when this step must yield.
	 * @return bool True when every stage is finished.
	 */
	public static function run( array &$cursor, array $settings, $deadline ) {
		while ( 'done' !== $cursor['stage'] ) {
			$method = 'stage_' . $cursor['stage'];
			$done   = self::$method( $cursor, $settings, $deadline );
			if ( ! $done ) {
				return false;
			}

			$index = array_search( $cursor['stage'], self::STAGES, true );
			$next  = false === $index || ! isset( self::STAGES[ $index + 1 ] ) ? 'done' : self::STAGES[ $index + 1 ];
			$cursor = array_merge( self::new_cursor(), array( 'stage' => $next, 'added' => $cursor['added'] ) );

			if ( 'done' !== $next && microtime( true ) >= $deadline ) {
				return false;
			}
		}
		return true;
	}

	/**
	 * Add a URL to the queue when it is local, not excluded and not a duplicate.
	 *
	 * @param string $url         URL (may carry a fragment).
	 * @param array  $settings    Settings.
	 * @param string $handler     page | file.
	 * @param string $source_path Disk path for handler file.
	 * @param int    $found_on_id Row ID of the page where the URL was found (0 = a crawler).
	 * @return bool
	 */
	public static function enqueue( $url, array $settings, $handler = 'page', $source_path = '', $found_on_id = 0 ) {
		$normal = SNN_Static_Deploy_URL::normalize( (string) $url );
		if ( '' === $normal || ! SNN_Static_Deploy_URL::is_local( $normal ) ) {
			return false;
		}
		if ( SNN_Static_Deploy_URL::is_excluded( $normal, $settings ) ) {
			return false;
		}
		return SNN_Static_Deploy_Pages::add( $normal, (int) $found_on_id, $handler, $source_path ) > 0;
	}

	/**
	 * Enqueue an archive and its /page/N/ pages.
	 *
	 * @param string $base     Archive URL (page 1).
	 * @param int    $count    Number of posts in the archive.
	 * @param array  $settings Settings.
	 * @return int Number of pages queued (1 + later pages).
	 */
	public static function enqueue_archive( $base, $count, array $settings ) {
		if ( '' === (string) $base ) {
			return 0;
		}
		$added = self::enqueue( $base, $settings ) ? 1 : 0;

		if ( empty( $settings['crawl_pagination'] ) ) {
			return $added;
		}

		$per_page = max( 1, (int) get_option( 'posts_per_page', 10 ) );
		$pages    = (int) ceil( max( 0, (int) $count ) / $per_page );
		for ( $n = 2; $n <= $pages; $n++ ) {
			if ( self::enqueue( self::page_url( $base, $n ), $settings ) ) {
				$added++;
			}
		}
		return $added;
	}

	/**
	 * URL of page N of an archive, following the permalink structure.
	 *
	 * @param string $base Archive URL.
	 * @param int    $n    Page number.
	 * @return string
	 */
	public static function page_url( $base, $n ) {
		if ( '' !== get_option( 'permalink_structure' ) ) {
			return trailingslashit( $base ) . 'page/' . (int) $n . '/';
		}
		return add_query_arg( 'paged', (int) $n, $base );
	}

	/** Post types to crawl: public, selected in the settings, never attachments. */
	public static function post_types( array $settings ) {
		$public   = array_keys( get_post_types( array( 'public' => true ), 'names' ) );
		$selected = isset( $settings['post_types'] ) && is_array( $settings['post_types'] ) ? $settings['post_types'] : array();
		$types    = array_values( array_intersect( $public, $selected ) );
		return array_values( array_diff( $types, array( 'attachment' ) ) );
	}

	/** Taxonomies to crawl: public, selected in the settings. */
	public static function taxonomies( array $settings ) {
		$public   = array_keys( get_taxonomies( array( 'public' => true ), 'names' ) );
		$selected = isset( $settings['taxonomies'] ) && is_array( $settings['taxonomies'] ) ? $settings['taxonomies'] : array();
		return array_values( array_intersect( $public, $selected ) );
	}

	// ---------------------------------------------------------------------
	// Stages. Each returns true when it is finished, false when it must yield.
	// ---------------------------------------------------------------------

	/** Home page (and the blog index when the front page is static). */
	private static function stage_home( array &$cursor, array $settings, $deadline ) {
		self::enqueue( home_url( '/' ), $settings );

		$base  = home_url( '/' );
		$count = (int) self::count_posts( 'post' );
		if ( 'page' === get_option( 'show_on_front' ) ) {
			$blog = (int) get_option( 'page_for_posts' );
			if ( $blog > 0 ) {
				$base = (string) get_permalink( $blog );
				self::enqueue( $base, $settings );
			}
		}
		if ( $base !== home_url( '/' ) || $count > 0 ) {
			$cursor['added'] += self::enqueue_archive( $base, $count, $settings );
		}
		return true;
	}

	/** Single posts and pages of the selected post types, in ID order. */
	private static function stage_posts( array &$cursor, array $settings, $deadline ) {
		global $wpdb;
		if ( empty( $settings['crawl_posts'] ) ) {
			return true;
		}
		$types = self::post_types( $settings );

		while ( $cursor['index'] < count( $types ) ) {
			$type = $types[ $cursor['index'] ];
			$ids  = $wpdb->get_col( $wpdb->prepare(
				"SELECT ID FROM {$wpdb->posts} WHERE post_type = %s AND post_status = 'publish' AND ID > %d ORDER BY ID ASC LIMIT %d",
				$type,
				(int) $cursor['last_id'],
				self::CHUNK
			) );

			foreach ( (array) $ids as $id ) {
				$link = get_permalink( (int) $id );
				if ( is_string( $link ) && self::enqueue( $link, $settings ) ) {
					$cursor['added']++;
				}
				$cursor['last_id'] = (int) $id;
			}

			if ( count( (array) $ids ) < self::CHUNK ) {
				$cursor['index']++;
				$cursor['last_id'] = 0;
			}
			if ( microtime( true ) >= $deadline ) {
				return false;
			}
		}
		return true;
	}

	/** Post type archives (for example /projects/) with their pages. */
	private static function stage_archives( array &$cursor, array $settings, $deadline ) {
		if ( empty( $settings['crawl_archives'] ) ) {
			return true;
		}
		foreach ( self::post_types( $settings ) as $type ) {
			$object = get_post_type_object( $type );
			if ( ! $object || empty( $object->has_archive ) ) {
				continue;
			}
			$link = get_post_type_archive_link( $type );
			if ( ! is_string( $link ) || '' === $link ) {
				continue;
			}
			$cursor['added'] += self::enqueue_archive( $link, self::count_posts( $type ), $settings );
		}
		return true;
	}

	/** Term archives (categories, tags and other public taxonomies). */
	private static function stage_taxonomies( array &$cursor, array $settings, $deadline ) {
		if ( empty( $settings['crawl_taxonomies'] ) ) {
			return true;
		}
		$taxonomies = self::taxonomies( $settings );

		while ( $cursor['index'] < count( $taxonomies ) ) {
			$taxonomy = $taxonomies[ $cursor['index'] ];
			$terms    = get_terms( array(
				'taxonomy'   => $taxonomy,
				'hide_empty' => true,
				'number'     => self::CHUNK,
				'offset'     => (int) $cursor['offset'],
				'orderby'    => 'term_id',
			) );

			if ( is_wp_error( $terms ) || ! is_array( $terms ) ) {
				$terms = array();
			}

			foreach ( $terms as $term ) {
				$link = get_term_link( $term );
				if ( is_string( $link ) ) {
					$cursor['added'] += self::enqueue_archive( $link, (int) $term->count, $settings );
				}
			}

			if ( count( $terms ) < self::CHUNK ) {
				$cursor['index']++;
				$cursor['offset'] = 0;
			} else {
				$cursor['offset'] += self::CHUNK;
			}
			if ( microtime( true ) >= $deadline ) {
				return false;
			}
		}
		return true;
	}

	/** Author archives (users with published posts). */
	private static function stage_authors( array &$cursor, array $settings, $deadline ) {
		if ( empty( $settings['crawl_authors'] ) ) {
			return true;
		}
		$users = get_users( array( 'has_published_posts' => array( 'post' ), 'fields' => 'ids' ) );
		foreach ( (array) $users as $user_id ) {
			$link = get_author_posts_url( (int) $user_id );
			if ( '' === (string) $link ) {
				continue;
			}
			$cursor['added'] += self::enqueue_archive( $link, (int) count_user_posts( (int) $user_id, 'post' ), $settings );
		}
		return true;
	}

	/** Yearly and monthly archives. */
	private static function stage_dates( array &$cursor, array $settings, $deadline ) {
		if ( empty( $settings['crawl_dates'] ) ) {
			return true;
		}
		global $wpdb;
		$rows = $wpdb->get_results( "SELECT YEAR(post_date) AS y, MONTH(post_date) AS m, COUNT(*) AS c FROM {$wpdb->posts} WHERE post_type = 'post' AND post_status = 'publish' GROUP BY y, m ORDER BY y, m" );

		$years = array();
		foreach ( (array) $rows as $row ) {
			$year  = (int) $row->y;
			$month = (int) $row->m;
			$count = (int) $row->c;

			$link = get_month_link( $year, $month );
			if ( is_string( $link ) ) {
				$cursor['added'] += self::enqueue_archive( $link, $count, $settings );
			}
			$years[ $year ] = ( isset( $years[ $year ] ) ? $years[ $year ] : 0 ) + $count;
		}

		foreach ( $years as $year => $count ) {
			$link = get_year_link( (int) $year );
			if ( is_string( $link ) ) {
				$cursor['added'] += self::enqueue_archive( $link, (int) $count, $settings );
			}
		}
		return true;
	}

	/** wp-sitemap.xml (WordPress core sitemaps). Its sub-sitemaps are found by the fetcher. */
	private static function stage_sitemap( array &$cursor, array $settings, $deadline ) {
		if ( empty( $settings['crawl_sitemap'] ) || ! function_exists( 'get_sitemap_url' ) ) {
			return true;
		}
		$index = get_sitemap_url( 'index' );
		if ( is_string( $index ) && '' !== $index && self::enqueue( $index, $settings ) ) {
			$cursor['added']++;
		}
		return true;
	}

	/** robots.txt (served by WordPress when no file exists). */
	private static function stage_robots( array &$cursor, array $settings, $deadline ) {
		if ( empty( $settings['crawl_robots'] ) ) {
			return true;
		}
		if ( self::enqueue( home_url( '/robots.txt' ), $settings ) ) {
			$cursor['added']++;
		}
		return true;
	}

	/** Feeds: the site feed and the feeds of the post type archives. */
	private static function stage_feeds( array &$cursor, array $settings, $deadline ) {
		if ( empty( $settings['add_feeds'] ) ) {
			return true;
		}
		if ( self::enqueue( get_feed_link(), $settings ) ) {
			$cursor['added']++;
		}
		foreach ( self::post_types( $settings ) as $type ) {
			$object = get_post_type_object( $type );
			if ( $object && ! empty( $object->has_archive ) ) {
				$link = get_post_type_archive_feed_link( $type );
				if ( is_string( $link ) && self::enqueue( $link, $settings ) ) {
					$cursor['added']++;
				}
			}
		}
		return true;
	}

	/** Extra URLs and files from the settings. */
	private static function stage_additional( array &$cursor, array $settings, $deadline ) {
		foreach ( self::lines( isset( $settings['additional_urls'] ) ? $settings['additional_urls'] : '' ) as $line ) {
			$url = $line;
			if ( 0 === strpos( $line, '/' ) ) {
				$url = untrailingslashit( home_url( '/' ) ) . $line;
			}
			if ( self::enqueue( $url, $settings ) ) {
				$cursor['added']++;
			}
		}

		foreach ( self::lines( isset( $settings['additional_files'] ) ? $settings['additional_files'] : '' ) as $line ) {
			$path = self::safe_file_path( $line );
			if ( '' === $path ) {
				continue;
			}
			$url = self::url_for_disk_file( $path );
			if ( '' !== $url && self::enqueue( $url, $settings, 'file', $path ) ) {
				$cursor['added']++;
			}
		}
		return true;
	}

	// ---------------------------------------------------------------------
	// Helpers
	// ---------------------------------------------------------------------

	/** Published posts of one type. */
	private static function count_posts( $type ) {
		global $wpdb;
		return (int) $wpdb->get_var( $wpdb->prepare( "SELECT COUNT(*) FROM {$wpdb->posts} WHERE post_type = %s AND post_status = 'publish'", $type ) );
	}

	/** Non-empty trimmed lines. */
	private static function lines( $text ) {
		$lines = preg_split( '/\r\n|\r|\n/', (string) $text );
		return array_values( array_filter( array_map( 'trim', $lines ), 'strlen' ) );
	}

	/**
	 * A file path from the settings, only when it is a readable file inside ABSPATH or WP_CONTENT_DIR.
	 *
	 * @param string $line Path as typed.
	 * @return string Absolute path, or ''.
	 */
	public static function safe_file_path( $line ) {
		$line = wp_normalize_path( (string) $line );
		if ( false !== strpos( $line, '..' ) || ! is_file( $line ) || ! is_readable( $line ) ) {
			return '';
		}
		return SNN_Static_Deploy_URL::inside_wordpress( $line ) ? $line : '';
	}

	/**
	 * The URL under which a disk file is served.
	 *
	 * @param string $path Absolute disk path inside ABSPATH or WP_CONTENT_DIR.
	 * @return string
	 */
	public static function url_for_disk_file( $path ) {
		$content = wp_normalize_path( (string) realpath( WP_CONTENT_DIR ) );
		if ( 0 === strpos( $path, trailingslashit( $content ) ) ) {
			return untrailingslashit( content_url() ) . substr( $path, strlen( $content ) );
		}
		$root = wp_normalize_path( (string) realpath( ABSPATH ) );
		if ( 0 === strpos( $path, trailingslashit( $root ) ) ) {
			return untrailingslashit( home_url( '/' ) ) . '/' . ltrim( substr( $path, strlen( $root ) ), '/' );
		}
		return '';
	}
}
