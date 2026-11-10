<?php
/**
 * Static Deploy: URL rules.
 *
 * One place decides four things: whether a URL belongs to the site, the file a URL
 * is saved to, the link that points to that file from another file, and whether a URL
 * is excluded. The file names and the links are built by the same functions, so they
 * always agree.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class SNN_Static_Deploy_URL {

	/** File extensions that are copied as they are (no link rewriting, no discovery of links). */
	const BINARY_EXTENSIONS = array(
		'png', 'jpg', 'jpeg', 'gif', 'webp', 'avif', 'bmp', 'ico', 'tif', 'tiff', 'svg', 'heic',
		'mp4', 'webm', 'ogv', 'ogg', 'mp3', 'm4a', 'm4v', 'wav', 'oga', 'mov',
		'woff', 'woff2', 'ttf', 'otf', 'eot',
		'pdf', 'zip', 'gz', 'rar', '7z', 'csv', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx',
	);

	/** Text formats whose links are rewritten. */
	const TEXT_EXTENSIONS = array( 'css', 'js', 'mjs', 'json', 'map', 'txt', 'xml', 'xsl' );

	/** Last path segments that mean a feed. */
	const FEED_SEGMENTS = array( 'feed', 'rss', 'rss2', 'atom', 'rdf' );

	/**
	 * Base URLs of this site. A URL under one of them is local.
	 *
	 * @return string[] Without trailing slash, longest path first.
	 */
	public static function local_bases() {
		$bases = array();

		$origin = trim( (string) SNN_Static_Deploy_Options::get( 'origin_url' ) );
		if ( '' !== $origin ) {
			$bases[] = untrailingslashit( $origin );
		}

		$bases[] = untrailingslashit( home_url( '/' ) );
		$bases[] = untrailingslashit( site_url( '/' ) );

		$bases = array_values( array_unique( array_filter( $bases ) ) );

		usort(
			$bases,
			static function ( $a, $b ) {
				return strlen( (string) wp_parse_url( $b, PHP_URL_PATH ) ) <=> strlen( (string) wp_parse_url( $a, PHP_URL_PATH ) );
			}
		);

		return $bases;
	}

	/**
	 * The base URL a local URL belongs to, or '' when the URL is not local.
	 *
	 * @param string $url Absolute URL.
	 * @return string
	 */
	public static function matching_base( $url ) {
		$parts = wp_parse_url( $url );
		if ( ! is_array( $parts ) || empty( $parts['host'] ) || empty( $parts['scheme'] ) ) {
			return '';
		}
		if ( ! in_array( strtolower( $parts['scheme'] ), array( 'http', 'https' ), true ) ) {
			return '';
		}

		$host = strtolower( $parts['host'] );
		$path = isset( $parts['path'] ) ? $parts['path'] : '/';

		foreach ( self::local_bases() as $base ) {
			$bparts = wp_parse_url( $base );
			if ( ! is_array( $bparts ) || empty( $bparts['host'] ) || strtolower( $bparts['host'] ) !== $host ) {
				continue;
			}
			$bpath = isset( $bparts['path'] ) ? rtrim( $bparts['path'], '/' ) : '';
			if ( '' === $bpath || $path === $bpath || 0 === strpos( $path, $bpath . '/' ) ) {
				return $base;
			}
		}

		return '';
	}

	/**
	 * Whether a URL is on this site (scheme-independent).
	 *
	 * @param string $url Absolute URL.
	 * @return bool
	 */
	public static function is_local( $url ) {
		return '' !== self::matching_base( $url );
	}

	/**
	 * Path of a URL relative to the site's install path, always starting with '/'.
	 * Example: https://example.com/blog/about/ on an install at /blog -> /about/
	 *
	 * @param string $url Absolute URL.
	 * @return string
	 */
	public static function public_path( $url ) {
		$parts = wp_parse_url( $url );
		$path  = is_array( $parts ) && isset( $parts['path'] ) ? $parts['path'] : '/';
		$base  = self::matching_base( $url );
		if ( '' !== $base ) {
			$bpath = (string) wp_parse_url( $base, PHP_URL_PATH );
			$bpath = rtrim( $bpath, '/' );
			if ( '' !== $bpath && 0 === strpos( $path, $bpath ) ) {
				$path = substr( $path, strlen( $bpath ) );
			}
		}
		return '/' . ltrim( (string) $path, '/' );
	}

	/**
	 * Remove fragment, keep the rest.
	 *
	 * @param string $url URL.
	 * @return string
	 */
	public static function strip_fragment( $url ) {
		$pos = strpos( $url, '#' );
		return false === $pos ? $url : substr( $url, 0, $pos );
	}

	/**
	 * Fragment of a URL without the '#', or ''.
	 *
	 * @param string $url URL.
	 * @return string
	 */
	public static function fragment( $url ) {
		$pos = strpos( $url, '#' );
		return false === $pos ? '' : substr( $url, $pos + 1 );
	}

	/**
	 * Absolute URL for a link found in a document.
	 *
	 * @param string $href Link as written in the document.
	 * @param string $base Absolute URL of the document.
	 * @return string '' when the link cannot be used.
	 */
	public static function resolve( $href, $base ) {
		$href = trim( html_entity_decode( (string) $href, ENT_QUOTES | ENT_HTML5, 'UTF-8' ) );
		if ( '' === $href || '#' === $href[0] ) {
			return '';
		}
		if ( preg_match( '#^[a-z][a-z0-9+.\-]*:#i', $href ) ) {
			// Absolute URL, or mailto:, tel:, data:, javascript:.
			return preg_match( '#^https?://#i', $href ) ? $href : '';
		}

		$b      = wp_parse_url( $base );
		$scheme = is_array( $b ) && ! empty( $b['scheme'] ) ? $b['scheme'] : 'https';
		$host   = is_array( $b ) && ! empty( $b['host'] ) ? $b['host'] : '';
		$port   = is_array( $b ) && ! empty( $b['port'] ) ? ':' . $b['port'] : '';
		$bpath  = is_array( $b ) && ! empty( $b['path'] ) ? $b['path'] : '/';

		if ( 0 === strpos( $href, '//' ) ) {
			return $scheme . ':' . $href;
		}

		$authority = $scheme . '://' . $host . $port;

		if ( '?' === $href[0] ) {
			return $authority . $bpath . $href;
		}

		$fragment = '';
		$pos      = strpos( $href, '#' );
		if ( false !== $pos ) {
			$fragment = substr( $href, $pos );
			$href     = substr( $href, 0, $pos );
		}

		if ( '/' === $href[0] ) {
			$path = $href;
		} else {
			$dir  = substr( $bpath, 0, (int) strrpos( $bpath, '/' ) + 1 );
			$path = $dir . $href;
		}

		$query = '';
		$qpos  = strpos( $path, '?' );
		if ( false !== $qpos ) {
			$query = substr( $path, $qpos );
			$path  = substr( $path, 0, $qpos );
		}

		return $authority . self::normalize_dots( $path ) . $query . $fragment;
	}

	/**
	 * Remove '.' and '..' segments from a path that starts with '/'.
	 *
	 * @param string $path Path.
	 * @return string
	 */
	public static function normalize_dots( $path ) {
		$trailing = ( '/' === substr( $path, -1 ) ) || preg_match( '#/\.\.?$#', $path );
		$out      = array();
		foreach ( explode( '/', $path ) as $segment ) {
			if ( '' === $segment || '.' === $segment ) {
				continue;
			}
			if ( '..' === $segment ) {
				array_pop( $out );
				continue;
			}
			$out[] = $segment;
		}
		$result = '/' . implode( '/', $out );
		if ( $trailing && '/' !== $result ) {
			$result .= '/';
		}
		return $result;
	}

	/**
	 * Normalized absolute URL for crawling: lower-case scheme and host, no fragment,
	 * default port removed, dot segments removed. '' when it is not usable.
	 *
	 * @param string $url URL, absolute.
	 * @return string
	 */
	public static function normalize( $url ) {
		$url = self::strip_fragment( trim( (string) $url ) );
		$parts = wp_parse_url( $url );
		if ( ! is_array( $parts ) || empty( $parts['host'] ) || empty( $parts['scheme'] ) ) {
			return '';
		}
		$scheme = strtolower( $parts['scheme'] );
		if ( ! in_array( $scheme, array( 'http', 'https' ), true ) ) {
			return '';
		}
		$host = strtolower( $parts['host'] );
		$port = '';
		if ( ! empty( $parts['port'] ) && ! ( ( 'http' === $scheme && 80 === (int) $parts['port'] ) || ( 'https' === $scheme && 443 === (int) $parts['port'] ) ) ) {
			$port = ':' . (int) $parts['port'];
		}
		$path  = self::normalize_dots( isset( $parts['path'] ) ? $parts['path'] : '/' );
		$query = isset( $parts['query'] ) && '' !== $parts['query'] ? '?' . $parts['query'] : '';

		return $scheme . '://' . $host . $port . $path . $query;
	}

	/**
	 * Whether the path (no query) ends in a file extension.
	 *
	 * @param string $url URL.
	 * @return string Lower-case extension, or ''.
	 */
	public static function extension( $url ) {
		$path = (string) wp_parse_url( $url, PHP_URL_PATH );
		$last = substr( $path, (int) strrpos( $path, '/' ) + 1 );
		if ( preg_match( '/\.([A-Za-z0-9]{1,10})$/', $last, $m ) ) {
			return strtolower( $m[1] );
		}
		return '';
	}

	/**
	 * Whether the URL points to a file that is not an HTML page.
	 *
	 * @param string $url URL.
	 * @return bool
	 */
	public static function is_asset( $url ) {
		$ext = self::extension( $url );
		return '' !== $ext && 'html' !== $ext && 'htm' !== $ext && 'php' !== $ext;
	}

	/**
	 * Whether the URL is a binary asset (copied, never rewritten).
	 *
	 * @param string $url URL.
	 * @return bool
	 */
	public static function is_binary_asset( $url ) {
		return in_array( self::extension( $url ), self::BINARY_EXTENSIONS, true );
	}

	/**
	 * Whether a text asset (CSS, JS, JSON, XML, plain text) may contain links to rewrite.
	 *
	 * @param string $url          URL.
	 * @param string $content_type Response content type.
	 * @return bool
	 */
	public static function is_text_document( $url, $content_type = '' ) {
		$ext = self::extension( $url );
		if ( in_array( $ext, self::TEXT_EXTENSIONS, true ) ) {
			return true;
		}
		return (bool) preg_match( '#^(text/|application/(xml|rss\+xml|atom\+xml|javascript|json|xhtml\+xml))#i', (string) $content_type );
	}

	/**
	 * Whether the URL names a feed (RSS, Atom or RDF).
	 *
	 * @param string $url URL.
	 * @return bool
	 */
	public static function is_feed( $url ) {
		$path     = rtrim( (string) wp_parse_url( $url, PHP_URL_PATH ), '/' );
		$segments = explode( '/', $path );
		$last     = end( $segments );
		return in_array( strtolower( (string) $last ), self::FEED_SEGMENTS, true ) || ( 'xml' === self::extension( $url ) && false !== stripos( $path, 'feed' ) );
	}

	/**
	 * One path segment made safe for a file name. Plain ASCII is kept as it is,
	 * other characters are transliterated, and an empty result gets a short hash.
	 *
	 * @param string $segment Raw segment (already percent-decoded).
	 * @return string
	 */
	public static function safe_segment( $segment ) {
		if ( '' === $segment ) {
			return '';
		}
		if ( preg_match( '/^[a-zA-Z0-9\-_.]+$/', $segment ) && '.' !== substr( $segment, -1 ) ) {
			return $segment;
		}
		$clean = html_entity_decode( $segment, ENT_QUOTES, 'UTF-8' );
		if ( function_exists( 'remove_accents' ) ) {
			$clean = remove_accents( $clean );
		}
		$clean = preg_replace( '/[\x{2022}\x{2026}\x{00A9}\x{E000}-\x{F8FF}]/u', '-', (string) $clean );
		$clean = sanitize_file_name( (string) $clean );
		$clean = trim( $clean, '. ' );
		if ( '' === $clean ) {
			$clean = 'x-' . substr( md5( $segment ), 0, 8 );
		}
		return $clean;
	}

	/**
	 * Relative file path (forward slashes, no leading slash) that holds the content of a URL.
	 *
	 *   /                  -> index.html
	 *   /about/            -> about/index.html
	 *   /feed/             -> feed/index.xml
	 *   /wp-content/a.css  -> wp-content/a.css
	 *   /?s=x              -> __qs/<hash>/index.html
	 *
	 * @param string $url Normalized absolute URL.
	 * @return string
	 */
	public static function file_path_for( $url ) {
		$public   = rawurldecode( self::public_path( $url ) );
		$query    = (string) wp_parse_url( $url, PHP_URL_QUERY );
		$segments = array_values( array_filter(
			explode( '/', trim( $public, '/' ) ),
			static function ( $s ) {
				return '' !== $s && '.' !== $s && '..' !== $s;
			}
		) );

		$last = empty( $segments ) ? '' : end( $segments );
		$ext  = self::extension( $url );
		// A trailing slash means a directory, even when its name contains a dot (2026.11/).
		if ( '/' === substr( $public, -1 ) ) {
			$ext = '';
		}

		if ( '' !== $ext && 'php' !== $ext ) {
			$file = array_pop( $segments );
		} elseif ( '' !== $last && self::is_feed( $url ) ) {
			$file = 'index.xml';
		} else {
			$file = 'index.html';
		}

		// Assets and PHP endpoints keep their own file name; only pages get a query folder.
		$is_asset = ( self::is_asset( $url ) && '' !== $ext ) || 'php' === $ext;
		if ( '' !== $query && ! $is_asset ) {
			$segments[] = '__qs';
			$segments[] = substr( md5( $query ), 0, 12 );
		}

		$segments = array_map( array( __CLASS__, 'safe_segment' ), $segments );
		$segments[] = self::safe_segment( (string) $file );

		return implode( '/', array_filter( $segments, 'strlen' ) );
	}

	/**
	 * Relative path from a directory to a file, both relative to the export root.
	 *
	 * @param string $from_dir Directory of the linking file ('' for the root).
	 * @param string $to_file  File being linked to.
	 * @return string
	 */
	public static function relative_file_path( $from_dir, $to_file ) {
		$from = '' === $from_dir ? array() : explode( '/', $from_dir );
		$to   = explode( '/', $to_file );

		while ( ! empty( $from ) && count( $to ) > 1 && $from[0] === $to[0] ) {
			array_shift( $from );
			array_shift( $to );
		}

		$parts = array_merge( array_fill( 0, count( $from ), '..' ), $to );
		return implode( '/', $parts );
	}

	/**
	 * The link written into a document for a target URL.
	 *
	 * @param string $target    Absolute local URL (any fragment is kept on the link).
	 * @param string $from_file Export file that contains the link (relative path).
	 * @param array  $settings  Settings (destination_type, destination_scheme, destination_host, relative_path).
	 * @return string
	 */
	public static function link_for( $target, $from_file, array $settings ) {
		$fragment = self::fragment( $target );
		$clean    = self::strip_fragment( $target );
		$file     = self::file_path_for( $clean );
		$type     = isset( $settings['destination_type'] ) ? $settings['destination_type'] : 'relative';

		if ( 'offline' === $type ) {
			$from_dir = '' === $from_file ? '' : dirname( $from_file );
			$from_dir = '.' === $from_dir ? '' : $from_dir;
			$link     = self::relative_file_path( $from_dir, $file );
		} else {
			$base_name = basename( $file );
			$dir       = dirname( $file );
			$dir       = '.' === $dir ? '' : $dir;
			$link_path = 'index.html' === $base_name ? '/' . ( '' !== $dir ? $dir . '/' : '' ) : '/' . $file;

			if ( 'absolute' === $type && ! empty( $settings['destination_host'] ) ) {
				$scheme = ! empty( $settings['destination_scheme'] ) ? $settings['destination_scheme'] : 'https://';
				$link   = $scheme . $settings['destination_host'] . $link_path;
			} else {
				$prefix = isset( $settings['relative_path'] ) ? rtrim( (string) $settings['relative_path'], '/' ) : '';
				$link   = $prefix . $link_path;
			}
		}

		return '' !== $fragment ? $link . '#' . $fragment : $link;
	}

	/**
	 * Disk path of a local asset URL, so that small files can be copied without an HTTP request.
	 * Only files inside ABSPATH or WP_CONTENT_DIR qualify.
	 *
	 * @param string $url Local URL.
	 * @return string Absolute path, or ''.
	 */
	public static function disk_path( $url ) {
		if ( ! self::is_local( $url ) ) {
			return '';
		}
		$clean  = self::strip_fragment( $url );
		$clean  = strtok( $clean, '?' );
		$public = rawurldecode( self::public_path( $clean ) );
		if ( false !== strpos( $public, '..' ) || false !== strpos( $public, "\0" ) ) {
			return '';
		}

		// Content URL first: wp-content may be moved or renamed.
		$content_path = rtrim( (string) wp_parse_url( content_url( '/' ), PHP_URL_PATH ), '/' );
		$home_path    = rtrim( (string) wp_parse_url( home_url( '/' ), PHP_URL_PATH ), '/' );
		$rel_content  = '' !== $home_path && 0 === strpos( $content_path, $home_path ) ? substr( $content_path, strlen( $home_path ) ) : $content_path;

		$candidate = '';
		if ( '' !== $rel_content && 0 === strpos( $public, $rel_content . '/' ) ) {
			$candidate = trailingslashit( WP_CONTENT_DIR ) . ltrim( substr( $public, strlen( $rel_content ) ), '/' );
		} else {
			$candidate = trailingslashit( ABSPATH ) . ltrim( $public, '/' );
		}

		$candidate = wp_normalize_path( $candidate );
		if ( ! is_file( $candidate ) || ! is_readable( $candidate ) ) {
			return '';
		}

		// Checked as WordPress sees the path, not after symlinks are resolved: a theme folder
		// may be a junction to a development copy outside the install.
		if ( self::inside_wordpress( $candidate ) ) {
			return $candidate;
		}
		return '';
	}

	/**
	 * Whether a URL is the page of a WordPress attachment (for example a gallery link to
	 * /photo-name/). These are not crawled, but a link to one is exported like a file.
	 *
	 * @param string $url Normalized local URL.
	 * @return bool
	 */
	public static function is_attachment( $url ) {
		static $cache = array();
		if ( ! array_key_exists( $url, $cache ) ) {
			$id              = url_to_postid( $url );
			$cache[ $url ]   = $id > 0 && 'attachment' === get_post_type( $id );
		}
		return $cache[ $url ];
	}

	/**
	 * Whether a normalized path lies inside ABSPATH or WP_CONTENT_DIR (string check, no symlinks).
	 *
	 * @param string $path Path with forward slashes.
	 * @return bool
	 */
	public static function inside_wordpress( $path ) {
		$path = strtolower( wp_normalize_path( (string) $path ) );
		foreach ( array( ABSPATH, WP_CONTENT_DIR ) as $root ) {
			$root = strtolower( trailingslashit( wp_normalize_path( untrailingslashit( (string) $root ) ) ) );
			if ( '' !== $root && 0 === strpos( $path, $root ) ) {
				return true;
			}
		}
		return false;
	}

	/**
	 * Whether a URL is excluded by a built-in rule or by the user's patterns.
	 *
	 * @param string $url      Absolute URL.
	 * @param array  $settings Settings.
	 * @return bool
	 */
	public static function is_excluded( $url, array $settings ) {
		$path  = (string) wp_parse_url( $url, PHP_URL_PATH );
		$query = (string) wp_parse_url( $url, PHP_URL_QUERY );

		// wp-includes is not excluded: block styles and scripts that pages load live there.
		if ( preg_match( '#/(wp-admin|wp-json)(/|$)#i', $path ) ) {
			return true;
		}
		if ( preg_match( '#/(wp-login\.php|xmlrpc\.php|wp-cron\.php|wp-comments-post\.php)$#i', $path ) ) {
			return true;
		}
		if ( preg_match( '/\.php$/i', $path ) ) {
			return true;
		}
		if ( preg_match( '#/trackback/?$#i', $path ) || preg_match( '#/comments/?$#i', $path ) ) {
			return true;
		}
		if ( '' !== $query ) {
			parse_str( $query, $args );
			// Search results, comment replies, previews and the plain-permalink forms
			// (?p=, ?page_id=, ?attachment_id=) that WordPress uses as shortlinks.
			$plain_forms = array( 's', 'replytocom', 'preview', 'p', 'page_id', 'attachment_id' );
			if ( array_intersect( $plain_forms, array_keys( $args ) ) ) {
				return true;
			}
		}
		if ( empty( $settings['add_feeds'] ) && self::is_feed( $url ) ) {
			return true;
		}

		$patterns = preg_split( '/\r\n|\r|\n/', (string) ( isset( $settings['exclude_urls'] ) ? $settings['exclude_urls'] : '' ) );
		foreach ( $patterns as $pattern ) {
			$pattern = trim( $pattern );
			if ( '' === $pattern ) {
				continue;
			}
			if ( strlen( $pattern ) > 2 && '/' === $pattern[0] && '/' === substr( $pattern, -1 ) ) {
				$inner = str_replace( '~', '\~', substr( $pattern, 1, -1 ) );
				if ( @preg_match( '~' . $inner . '~i', $url ) ) {
					return true;
				}
				continue;
			}
			if ( false !== stripos( $url, $pattern ) ) {
				return true;
			}
		}

		return false;
	}
}
