<?php
/**
 * The Image block's photo search (Browse Pixabay, Browse Unsplash): two REST routes for the editor.
 *
 *   GET  /snn/v1/images/search?provider=pixabay|unsplash&q=...&page=N   the results, in one shape
 *   POST /snn/v1/images/pick                                             what a pick does
 *
 * Pixabay: a pick imports the photo into the media library (SNN_Pixabay::import, the theme's own rule, which keeps
 * a local copy), and the block uses that attachment. Unsplash: a pick sends the download request Unsplash asks for,
 * and the block hotlinks the photo's own URL with its credit (image.php). The keys stay on the server, and only
 * users who can edit posts can search. A provider with no key, or no integration, gives an error.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class SNN_Image_Search {

	const REST_NS = 'snn/v1';

	public static function init() {
		add_action( 'rest_api_init', array( __CLASS__, 'register_routes' ) );
	}

	public static function register_routes() {
		register_rest_route(
			self::REST_NS,
			'/images/search',
			array(
				'methods'             => 'GET',
				'callback'            => array( __CLASS__, 'rest_search' ),
				'permission_callback' => array( __CLASS__, 'can_use' ),
				'args'                => array(
					'provider' => array(
						'type'     => 'string',
						'required' => true,
						'enum'     => array( 'pixabay', 'unsplash' ),
					),
					'q'        => array(
						'type'    => 'string',
						'default' => '',
					),
					'page'     => array(
						'type'    => 'integer',
						'default' => 1,
						'minimum' => 1,
						'maximum' => 50,
					),
				),
			)
		);
		register_rest_route(
			self::REST_NS,
			'/images/pick',
			array(
				'methods'             => 'POST',
				'callback'            => array( __CLASS__, 'rest_pick' ),
				'permission_callback' => array( __CLASS__, 'can_use' ),
				'args'                => array(
					'provider'    => array(
						'type'     => 'string',
						'required' => true,
						'enum'     => array( 'pixabay', 'unsplash' ),
					),
					'pixabay_id'  => array(
						'type'    => 'integer',
						'default' => 0,
					),
					'alt'         => array(
						'type'    => 'string',
						'default' => '',
					),
					'download'    => array(
						'type'    => 'string',
						'default' => '',
					),
				),
			)
		);
	}

	public static function can_use() {
		return current_user_can( 'edit_posts' );
	}

	/** The results of one page, in the editor's shape: thumb, alt, author and the links a pick needs. */
	public static function rest_search( WP_REST_Request $request ) {
		$provider = (string) $request['provider'];
		$query    = (string) $request['q'];
		$page     = (int) $request['page'];

		if ( 'pixabay' === $provider ) {
			if ( ! class_exists( 'SNN_Pixabay' ) ) {
				return new WP_Error( 'snn_images_off', 'Pixabay is not available on this site.', array( 'status' => 404 ) );
			}
			$hits  = SNN_Pixabay::search( array( 'query' => $query, 'per_page' => SNN_Pixabay::MAX_PER_PAGE, 'page' => $page, 'order' => 'popular' ) );
			if ( is_wp_error( $hits ) ) {
				return $hits;
			}
			$items = array();
			foreach ( $hits as $hit ) {
				if ( '' === (string) ( $hit['preview_url'] ?? '' ) ) {
					continue;
				}
				$items[] = array(
					'provider'   => 'pixabay',
					'id'         => (int) $hit['pixabay_id'],
					'thumb'      => (string) $hit['preview_url'],
					'alt'        => sanitize_text_field( (string) $hit['tags'] ),
					'author'     => sanitize_text_field( (string) $hit['photographer'] ),
					'author_url' => '',
					'photo_url'  => '',
					'download'   => '',
				);
			}
			return array(
				'provider' => 'pixabay',
				'page'     => $page,
				'items'    => $items,
				'more'     => count( $hits ) >= SNN_Pixabay::MAX_PER_PAGE,
			);
		}

		if ( ! class_exists( 'SNN_Unsplash' ) ) {
			return new WP_Error( 'snn_images_off', 'Unsplash is not available on this site.', array( 'status' => 404 ) );
		}
		$items = SNN_Unsplash::search( $query, $page );
		if ( is_wp_error( $items ) ) {
			return $items;
		}
		return array(
			'provider' => 'unsplash',
			'page'     => $page,
			'items'    => $items,
			'more'     => count( $items ) >= SNN_Unsplash::PER_PAGE,
		);
	}

	/**
	 * A pick. Pixabay: the photo is imported into the media library, and its attachment is returned. Unsplash: the
	 * download request is sent; the editor keeps the hotlinked URL it already has.
	 */
	public static function rest_pick( WP_REST_Request $request ) {
		$provider = (string) $request['provider'];

		if ( 'pixabay' === $provider ) {
			$id = (int) $request['pixabay_id'];
			if ( $id < 1 || ! class_exists( 'SNN_Pixabay' ) ) {
				return new WP_Error( 'snn_images_pick', 'Choose a Pixabay image first.', array( 'status' => 400 ) );
			}
			$saved = SNN_Pixabay::import( $id, sanitize_text_field( (string) $request['alt'] ) );
			if ( is_wp_error( $saved ) ) {
				return $saved;
			}
			return array(
				'id'  => (int) $saved['id'],
				'url' => (string) $saved['url'],
			);
		}

		if ( ! class_exists( 'SNN_Unsplash' ) ) {
			return new WP_Error( 'snn_images_off', 'Unsplash is not available on this site.', array( 'status' => 404 ) );
		}
		$tracked = SNN_Unsplash::track_download( (string) $request['download'] );
		if ( is_wp_error( $tracked ) ) {
			return $tracked;
		}
		return array( 'tracked' => true );
	}
}

SNN_Image_Search::init();
