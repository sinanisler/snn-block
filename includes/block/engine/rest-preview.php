<?php
/**
 * REST: the editor's preview of a query loop. The editor draws the loop's first item itself; the items after it come
 * from here, rendered as the front end renders them.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class SNN_Block_Preview {

	/** The most loop items the editor's preview draws. */
	const PREVIEW_LIMIT = 50;

	public static function init() {
		add_action( 'rest_api_init', array( __CLASS__, 'register_routes' ) );
	}

	public static function register_routes() {
		register_rest_route(
			SNN_Dynamic_Data::REST_NS,
			'/loop/preview',
			array(
				'methods'             => 'POST',
				'callback'            => array( __CLASS__, 'rest_loop_preview' ),
				'permission_callback' => array( 'SNN_Dynamic_Data', 'can_preview' ),
				'args'                => array(
					'block'   => array(
						'type'     => 'string',
						'required' => true,
					),
					'post_id' => array(
						'type'    => 'integer',
						'default' => 0,
					),
				),
			)
		);
	}

	/**
	 * The loop items after the first, rendered as the front end renders them. The editor draws the first item itself
	 * (its tags stay tags, so it is the one to edit) and shows these after it. The block comes as the editor's
	 * serialized markup of one of our blocks with its query on; anything else gives no items.
	 */
	public static function rest_loop_preview( WP_REST_Request $request ) {
		$parsed = parse_blocks( (string) $request['block'] );
		$parsed = $parsed[0] ?? null;
		if ( ! is_array( $parsed ) || ! isset( SNN_Blocks::definitions()[ $parsed['blockName'] ?? '' ] ) ) {
			return rest_ensure_response( array( 'items' => array(), 'styles' => '', 'found' => 0 ) );
		}
		$post_id = (int) $request['post_id'];
		$post    = $post_id ? get_post( $post_id ) : null;
		$run     = function () use ( $parsed ) {
			return self::loop_preview( $parsed );
		};
		if ( ! $post ) {
			return rest_ensure_response( $run() );
		}
		// The page being edited is the current post and the queried page, as on the front end: the tags read the
		// current post, and "Exclude current" reads the queried page. Both are put back afterwards.
		global $wp_query;
		$saved = $wp_query instanceof WP_Query ? array( $wp_query->queried_object, $wp_query->queried_object_id ) : null;
		if ( $saved ) {
			$wp_query->queried_object    = $post;
			$wp_query->queried_object_id = $post->ID;
		}
		try {
			$result = SNN_Dynamic_Data::with_post( $post, $run );
		} finally {
			if ( $saved ) {
				list( $wp_query->queried_object, $wp_query->queried_object_id ) = $saved;
			}
		}
		return rest_ensure_response( $result );
	}

	/**
	 * The loop items of one parsed block, after the first: the HTML of each, the style elements the first item
	 * printed (a loop prints each rule once, so the later items need them) and the total found.
	 */
	public static function loop_preview( array $parsed ) {
		$block = new WP_Block( $parsed );
		$a     = SNN_Blocks::clean( $block->attributes, $block->name );
		if ( empty( $a['query']['enabled'] ) ) {
			return array( 'items' => array(), 'styles' => '', 'found' => 0 );
		}
		$found = SNN_Query_Loop::posts( $a['query'], SNN_Block_Render::dynamic_context( array() ) );
		$items = SNN_Block_Render::in_loop(
			function () use ( $a, $block, $found ) {
				return SNN_Block_Render::loop_items( $a, $block, array(), $found, self::PREVIEW_LIMIT + 1 );
			}
		);
		$first = (string) array_shift( $items );
		preg_match_all( '#<style>.*?</style>#s', $first, $m );
		return array(
			'items'  => array_values( array_filter( $items, 'strlen' ) ),
			'styles' => implode( '', $m[0] ),
			'found'  => (int) $found['found'],
		);
	}
}
