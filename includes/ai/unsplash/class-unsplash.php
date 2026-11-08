<?php
/**
 * Unsplash: the search API, for the Browse Unsplash modal of the Image block and of the featured image.
 *
 * The Image block follows Unsplash's API guidelines: it hotlinks the URLs the API returns, a pick sends a request to
 * the photo's download_location, and the photographer and Unsplash are credited with utm links (see
 * blocks/image/image.php). A featured image must be a media library item, so a featured image pick imports a copy
 * (import(), the user's choice of 8 Nov 2026), with the download request and the credit in its caption. The access
 * key stays on the server: the editor only gets the results.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class SNN_Unsplash {

	const API_URL      = 'https://api.unsplash.com/';
	const PER_PAGE     = 20;
	const MAX_PAGE     = 50;
	const CACHE_TTL    = HOUR_IN_SECONDS;
	const UTM_SOURCE   = 'snn-block';
	const MAX_BYTES    = 10485760; // 10 MB, as the Pixabay import.
	const IMPORT_WIDTH = 2000;
	const META_ID      = '_snn_unsplash_id';

	/** The access key the settings page saves (SNN Settings > Integrations). */
	public static function api_key() {
		return (string) get_option( 'snn_unsplash_api_key', '' );
	}

	/** True when a key is saved. The editor shows its Browse button only then. */
	public static function configured() {
		return '' !== self::api_key();
	}

	/**
	 * Search photos. Items come back in one shape for the editor, each with its hotlinked url, the credit and the
	 * download link the pick must send.
	 *
	 * @return array|WP_Error
	 */
	public static function search( $query, $page = 1 ) {
		$key = self::api_key();
		if ( '' === $key ) {
			return self::no_key_error();
		}

		$query = mb_substr( trim( (string) $query ), 0, 100 );
		$page  = min( self::MAX_PAGE, max( 1, (int) $page ) );
		if ( '' === $query ) {
			return new WP_Error( 'snn_unsplash_no_query', 'Type words to search Unsplash.', array( 'status' => 400 ) );
		}

		$cache = 'snn_unsplash_s_' . md5( $query . '|' . $page );
		$items = get_transient( $cache );
		if ( false !== $items ) {
			return $items;
		}

		$data = self::request(
			add_query_arg(
				array(
					'query'          => $query,
					'page'           => $page,
					'per_page'       => self::PER_PAGE,
					'content_filter' => 'high',
				),
				self::API_URL . 'search/photos'
			),
			$key
		);
		if ( is_wp_error( $data ) ) {
			return $data;
		}

		$items = array();
		foreach ( (array) ( $data['results'] ?? array() ) as $raw ) {
			$item = self::normalize( $raw );
			if ( $item ) {
				$items[] = $item;
			}
		}
		set_transient( $cache, $items, self::CACHE_TTL );

		return $items;
	}

	/**
	 * The download request Unsplash asks for when a photo is picked. The link must be the one the search returned:
	 * an https link to api.unsplash.com under /photos/{id}/download, so a link in the request cannot send it elsewhere.
	 *
	 * @return true|WP_Error
	 */
	public static function track_download( $link ) {
		$key = self::api_key();
		if ( '' === $key ) {
			return self::no_key_error();
		}

		$link = (string) $link;
		$path = (string) wp_parse_url( $link, PHP_URL_PATH );
		if ( 'https' !== wp_parse_url( $link, PHP_URL_SCHEME ) || 'api.unsplash.com' !== wp_parse_url( $link, PHP_URL_HOST ) || ! preg_match( '#^/photos/[A-Za-z0-9_-]+/download$#', $path ) ) {
			return new WP_Error( 'snn_unsplash_bad_link', 'That is not an Unsplash download link.', array( 'status' => 400 ) );
		}

		$response = wp_remote_get( $link, array( 'timeout' => 10, 'headers' => self::headers( $key ) ) );
		if ( is_wp_error( $response ) ) {
			return new WP_Error( 'snn_unsplash_unreachable', 'Could not reach Unsplash.', array( 'status' => 502 ) );
		}
		$code = (int) wp_remote_retrieve_response_code( $response );
		if ( 200 !== $code ) {
			return new WP_Error( 'snn_unsplash_download', 'Unsplash did not record the download (HTTP ' . $code . ').', array( 'status' => $code ? $code : 502 ) );
		}

		return true;
	}

	/**
	 * A copy of one photo in the media library, for a featured image. The photo is looked up by its id on the API
	 * (no link from the request is downloaded), the download request is sent, and the file comes from the photo's
	 * own image host. The credit goes in the caption, and a photo imported before is reused.
	 *
	 * @return array|WP_Error { id, url }
	 */
	public static function import( $photo_id, $alt = '' ) {
		$key = self::api_key();
		if ( '' === $key ) {
			return self::no_key_error();
		}
		$photo_id = (string) $photo_id;
		if ( ! preg_match( '#^[A-Za-z0-9_-]{1,64}$#', $photo_id ) ) {
			return new WP_Error( 'snn_unsplash_bad_id', 'Choose an Unsplash photo first.', array( 'status' => 400 ) );
		}

		$existing = get_posts(
			array(
				'post_type'      => 'attachment',
				'post_status'    => 'inherit',
				'posts_per_page' => 1,
				'fields'         => 'ids',
				'meta_key'       => self::META_ID,
				'meta_value'     => $photo_id,
			)
		);
		if ( $existing ) {
			return array( 'id' => (int) $existing[0], 'url' => (string) wp_get_attachment_url( $existing[0] ) );
		}

		$raw = self::request( self::API_URL . 'photos/' . rawurlencode( $photo_id ), $key );
		if ( is_wp_error( $raw ) ) {
			return $raw;
		}
		$item = self::normalize( $raw );
		$urls = is_array( $raw['urls'] ?? null ) ? $raw['urls'] : array();
		$file = self::image_url( $urls['raw'] ?? '' );
		if ( ! $item || '' === $file || 'images.unsplash.com' !== wp_parse_url( $file, PHP_URL_HOST ) ) {
			return new WP_Error( 'snn_unsplash_no_file', 'Unsplash did not return the photo.', array( 'status' => 502 ) );
		}

		// The download request Unsplash asks for. A failure does not stop the import.
		self::track_download( $item['download'] );

		require_once ABSPATH . 'wp-admin/includes/file.php';
		require_once ABSPATH . 'wp-admin/includes/media.php';
		require_once ABSPATH . 'wp-admin/includes/image.php';

		$tmp = download_url( add_query_arg( array( 'w' => self::IMPORT_WIDTH, 'q' => 85, 'fm' => 'jpg', 'fit' => 'max' ), $file ) );
		if ( is_wp_error( $tmp ) ) {
			return new WP_Error( 'snn_unsplash_download_failed', 'Unsplash did not return the image file.', array( 'status' => 502 ) );
		}
		if ( (int) filesize( $tmp ) > self::MAX_BYTES ) {
			wp_delete_file( $tmp );
			return new WP_Error( 'snn_unsplash_too_large', 'Image is larger than 10 MB.', array( 'status' => 400 ) );
		}

		$alt     = '' !== (string) $alt ? sanitize_text_field( (string) $alt ) : $item['alt'];
		$author  = $item['author'];
		$caption = '' !== $author
			? sprintf(
				/* translators: 1: photographer link, 2: Unsplash link */
				__( 'Photo by %1$s on %2$s', 'snn' ),
				'<a href="' . esc_url( $item['author_url'] ) . '">' . esc_html( $author ) . '</a>',
				'<a href="' . esc_url( self::home_url() ) . '">Unsplash</a>'
			)
			: '';
		$title = '' !== $alt ? mb_substr( $alt, 0, 80 ) : 'Unsplash ' . $photo_id;

		$attachment_id = media_handle_sideload(
			array( 'name' => 'unsplash-' . $photo_id . '.jpg', 'tmp_name' => $tmp ),
			0,
			null,
			array( 'post_title' => $title, 'post_excerpt' => $caption )
		);
		if ( is_wp_error( $attachment_id ) ) {
			if ( file_exists( $tmp ) ) {
				wp_delete_file( $tmp );
			}
			return $attachment_id;
		}

		update_post_meta( $attachment_id, self::META_ID, $photo_id );
		update_post_meta( $attachment_id, '_snn_unsplash_author', $author );
		update_post_meta( $attachment_id, '_snn_unsplash_author_url', esc_url_raw( $item['author_url'] ) );
		update_post_meta( $attachment_id, '_snn_unsplash_photo_url', esc_url_raw( $item['photo_url'] ) );
		if ( '' !== $alt ) {
			update_post_meta( $attachment_id, '_wp_attachment_image_alt', $alt );
		}

		return array( 'id' => (int) $attachment_id, 'url' => (string) wp_get_attachment_url( $attachment_id ) );
	}

	/** The Unsplash home page with the utm tags the guidelines ask for. */
	public static function home_url() {
		return self::utm( 'https://unsplash.com/' );
	}

	/** A link back to Unsplash, with the utm tags the guidelines ask for. */
	public static function utm( $url ) {
		return '' === (string) $url ? '' : add_query_arg( array( 'utm_source' => self::UTM_SOURCE, 'utm_medium' => 'referral' ), (string) $url );
	}

	/** One GET to the API with the key in the header. Maps rate limits and errors to a WP_Error; the key never appears in a message. */
	private static function request( $url, $key ) {
		$response = wp_remote_get( $url, array( 'timeout' => 10, 'headers' => self::headers( $key ) ) );
		if ( is_wp_error( $response ) ) {
			return new WP_Error( 'snn_unsplash_unreachable', 'Could not reach Unsplash.', array( 'status' => 502 ) );
		}

		$code = (int) wp_remote_retrieve_response_code( $response );
		if ( 429 === $code || 403 === $code ) {
			return new WP_Error( 'snn_unsplash_rate_limited', 'Unsplash rate limit reached. Try again later.', array( 'status' => 429 ) );
		}

		$data = json_decode( (string) wp_remote_retrieve_body( $response ), true );
		if ( 200 !== $code || ! is_array( $data ) ) {
			$message = is_array( $data ) && ! empty( $data['errors'][0] ) ? (string) $data['errors'][0] : 'HTTP ' . $code;
			return new WP_Error( 'snn_unsplash_http', 'Unsplash returned an error: ' . $message, array( 'status' => $code ? $code : 502 ) );
		}

		return $data;
	}

	private static function headers( $key ) {
		return array(
			'Authorization'  => 'Client-ID ' . $key,
			'Accept-Version' => 'v1',
		);
	}

	/** One raw result in the editor's shape, or null when it has no image link. */
	private static function normalize( $raw ) {
		if ( ! is_array( $raw ) || empty( $raw['id'] ) ) {
			return null;
		}
		$urls  = is_array( $raw['urls'] ?? null ) ? $raw['urls'] : array();
		$links = is_array( $raw['links'] ?? null ) ? $raw['links'] : array();
		$user  = is_array( $raw['user'] ?? null ) ? $raw['user'] : array();
		$ulink = is_array( $user['links'] ?? null ) ? $user['links'] : array();

		$url = self::image_url( $urls['regular'] ?? '' );
		if ( '' === $url ) {
			return null;
		}

		return array(
			'provider'   => 'unsplash',
			'id'         => sanitize_text_field( (string) $raw['id'] ),
			'thumb'      => self::image_url( $urls['small'] ?? '' ) ?: $url,
			'url'        => $url,
			'alt'        => mb_substr( sanitize_text_field( (string) ( $raw['alt_description'] ?? $raw['description'] ?? '' ) ), 0, 300 ),
			'author'     => mb_substr( sanitize_text_field( (string) ( $user['name'] ?? '' ) ), 0, 120 ),
			'author_url' => self::utm( self::unsplash_link( $ulink['html'] ?? '' ) ),
			'photo_url'  => self::utm( self::unsplash_link( $links['html'] ?? '' ) ),
			'download'   => self::unsplash_link( $links['download_location'] ?? '' ),
		);
	}

	/** An image address the response gives: https on unsplash.com (its image host is a subdomain). */
	private static function image_url( $value ) {
		return self::unsplash_link( $value );
	}

	/** An https link on unsplash.com or one of its subdomains, or '' for anything else. */
	private static function unsplash_link( $value ) {
		$value = is_string( $value ) ? esc_url_raw( $value ) : '';
		return preg_match( '#^https://([a-z0-9-]+\.)*unsplash\.com/#i', $value ) ? $value : '';
	}

	private static function no_key_error() {
		return new WP_Error( 'snn_unsplash_no_key', 'No Unsplash access key is set. Add it under Integrations.', array( 'status' => 400 ) );
	}
}
