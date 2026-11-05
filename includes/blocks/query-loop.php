<?php
/**
 * Query loop: a block (section, container or div) with the query switched on repeats itself for
 * every post the query finds. The query settings are one attribute, "query", kept as one object.
 *
 * Fields that take a number or a list of IDs (per page, offset, child of, include, exclude and the
 * author lists) accept dynamic tags and are resolved before the query runs, so {post_id} in
 * "Child of" means the post the outer loop is showing.
 *
 * Not in this version: Terms and Users query types, the query editor (PHP), query merge, and
 * pagination. They are planned.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class SNN_Query_Loop {

	/** Bricks-style labels in the editor, WordPress orderby values here. */
	const ORDER_BY = array(
		'date'          => 'date',
		'modified'      => 'modified',
		'title'         => 'title',
		'menu_order'    => 'menu_order',
		'rand'          => 'rand',
		'ID'            => 'ID',
		'comment_count' => 'comment_count',
		'name'          => 'name',
	);

	/** The default query. Per page 10, newest first, like the Bricks defaults. */
	public static function defaults() {
		return array(
			'enabled'        => false,
			'postType'       => 'post',
			'orderBy'        => 'date',
			'order'          => 'DESC',
			'perPage'        => '10',
			'offset'         => '0',
			'parent'         => '',
			'ignoreSticky'   => false,
			'include'        => '',
			'exclude'        => '',
			'includeAuthors' => '',
			'excludeAuthors' => '',
			'isMain'         => false,
		);
	}

	/** Clean a stored query. Unknown keys go; text fields keep their braces for dynamic tags. */
	public static function sanitize( $input ) {
		$input = is_array( $input ) ? $input : array();
		$out   = self::defaults();

		$out['enabled']      = ! empty( $input['enabled'] );
		$out['isMain']       = ! empty( $input['isMain'] );
		$out['ignoreSticky'] = ! empty( $input['ignoreSticky'] );

		$post_type         = isset( $input['postType'] ) && is_string( $input['postType'] ) ? sanitize_key( $input['postType'] ) : 'post';
		$out['postType']   = post_type_exists( $post_type ) ? $post_type : 'post';
		$order_by          = $input['orderBy'] ?? 'date';
		$out['orderBy']    = is_string( $order_by ) && array_key_exists( $order_by, self::ORDER_BY ) ? $order_by : 'date';
		$order             = isset( $input['order'] ) && is_string( $input['order'] ) ? strtoupper( $input['order'] ) : 'DESC';
		$out['order']      = 'ASC' === $order ? 'ASC' : 'DESC';

		foreach ( array( 'perPage', 'offset', 'parent', 'include', 'exclude', 'includeAuthors', 'excludeAuthors' ) as $key ) {
			if ( isset( $input[ $key ] ) && is_scalar( $input[ $key ] ) ) {
				$out[ $key ] = substr( trim( wp_strip_all_tags( (string) $input[ $key ] ) ), 0, 500 );
			}
		}
		return $out;
	}

	/** The post types the Post type field offers: public ones, attachments left out. */
	public static function post_type_options() {
		$out = array();
		foreach ( get_post_types( array( 'public' => true ), 'objects' ) as $name => $type ) {
			if ( 'attachment' === $name ) {
				continue;
			}
			$out[] = array(
				'value' => $name,
				'label' => $type->labels->singular_name,
			);
		}
		return $out;
	}

	/** The Order by field's options, in the editor's labels. */
	public static function order_by_options() {
		return array(
			array( 'value' => 'date', 'label' => __( 'Date', 'snn' ) ),
			array( 'value' => 'modified', 'label' => __( 'Modified date', 'snn' ) ),
			array( 'value' => 'title', 'label' => __( 'Title', 'snn' ) ),
			array( 'value' => 'menu_order', 'label' => __( 'Menu order', 'snn' ) ),
			array( 'value' => 'rand', 'label' => __( 'Random', 'snn' ) ),
			array( 'value' => 'ID', 'label' => __( 'ID', 'snn' ) ),
			array( 'value' => 'comment_count', 'label' => __( 'Comment count', 'snn' ) ),
			array( 'value' => 'name', 'label' => __( 'Slug', 'snn' ) ),
		);
	}

	/**
	 * The posts a loop shows, in order, and the total the query found.
	 *
	 * @return array{posts: WP_Post[], found: int}
	 */
	public static function posts( array $query, array $ctx = array() ) {
		if ( ! empty( $query['isMain'] ) ) {
			global $wp_query;
			if ( ! $wp_query instanceof WP_Query ) {
				return array( 'posts' => array(), 'found' => 0 );
			}
			return array(
				'posts' => array_values( $wp_query->posts ),
				'found' => (int) $wp_query->found_posts,
			);
		}
		$result = new WP_Query( self::args( $query, $ctx ) );
		return array(
			'posts' => array_values( $result->posts ),
			'found' => (int) $result->found_posts,
		);
	}

	/** The WP_Query arguments for a stored query. Dynamic tags are resolved here. */
	public static function args( array $query, array $ctx = array() ) {
		$text = function ( $value ) use ( $ctx ) {
			return trim( SNN_Dynamic_Data::render( (string) $value, $ctx, 'plain' ) );
		};

		$post_type = isset( $query['postType'] ) ? sanitize_key( $query['postType'] ) : 'post';
		if ( ! post_type_exists( $post_type ) ) {
			$post_type = 'post';
		}

		$per_page = $text( $query['perPage'] ?? '' );
		$per_page = ctype_digit( $per_page ) ? (int) $per_page : 10;
		$per_page = min( 100, max( 1, $per_page ) );

		$offset = $text( $query['offset'] ?? '' );
		$offset = ctype_digit( $offset ) ? (int) $offset : 0;

		$order_by = $query['orderBy'] ?? 'date';
		$args     = array(
			'post_type'           => $post_type,
			'post_status'         => 'publish',
			'posts_per_page'      => $per_page,
			'offset'              => $offset,
			'orderby'             => self::ORDER_BY[ $order_by ] ?? 'date',
			'order'               => 'ASC' === ( $query['order'] ?? 'DESC' ) ? 'ASC' : 'DESC',
			'ignore_sticky_posts' => ! empty( $query['ignoreSticky'] ),
		);

		$parent = $text( $query['parent'] ?? '' );
		if ( ctype_digit( $parent ) && (int) $parent > 0 ) {
			$args['post_parent'] = (int) $parent;
		}

		// WordPress ignores post__not_in when post__in is set, so excluded IDs are taken out of
		// the include list instead. An include list that ends up empty matches nothing (post 0).
		$include = self::ids( $text( $query['include'] ?? '' ) );
		$exclude = self::ids( $text( $query['exclude'] ?? '' ) );
		if ( $include ) {
			$include          = array_values( array_diff( $include, $exclude ) );
			$args['post__in'] = $include ? $include : array( 0 );
		} elseif ( $exclude ) {
			$args['post__not_in'] = $exclude;
		}
		$authors = self::ids( $text( $query['includeAuthors'] ?? '' ) );
		if ( $authors ) {
			$args['author__in'] = $authors;
		}
		$not_authors = self::ids( $text( $query['excludeAuthors'] ?? '' ) );
		if ( $not_authors ) {
			$args['author__not_in'] = $not_authors;
		}

		return $args;
	}

	/** "12, 45 67" becomes array( 12, 45, 67 ). Zero and words are dropped. */
	public static function ids( $string ) {
		$parts = preg_split( '/[\s,]+/', (string) $string, -1, PREG_SPLIT_NO_EMPTY );
		$ids   = array_filter( array_map( 'absint', $parts ) );
		return array_values( array_unique( $ids ) );
	}
}
