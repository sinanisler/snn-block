<?php
/**
 * Unsplash: the search API, for the Image block's Browse Unsplash modal.
 *
 * Unsplash's API guidelines this follows: every use of a photo uses the hotlinked URLs the API returns (so the
 * photo is never copied into the media library), a pick sends a request to the photo's download_location, and the
 * photographer and Unsplash are credited with utm links (see blocks/image/image.php). The access key stays on the
 * server: the editor only gets the results.
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

	/** The access key the settings page saves (Settings > AI Agent & Chat Overlay). */
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
		return new WP_Error( 'snn_unsplash_no_key', 'No Unsplash access key is set. Add it under AI Agent & Chat Overlay Settings.', array( 'status' => 400 ) );
	}
}
