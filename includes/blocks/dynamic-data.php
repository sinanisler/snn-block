<?php
/**
 * Dynamic data: tags such as {post_title} that a field fills in when the page is shown.
 *
 * The names follow Bricks, so they are familiar: {post_title}, {author_name}, {site_title},
 * {cf_price} (a custom field), {wp_user_email} (the logged-in user). An argument comes after a
 * colon: {post_excerpt:20}, {post_date:F j, Y}. Modifiers come before the closing brace:
 *   {post_excerpt:20 @fallback:'No excerpt yet'}
 *   {format_date:2026-01-31 @from:Y-m-d @to:d/m/Y}
 *   {query_loop_index @start-at:1 @pad:2}
 * A tag that is not known stays as typed, so a mistake shows in the editor.
 *
 * Built from WordPress core only. Plugin tags (ACF, WooCommerce and so on) are not here yet.
 * Bricks's "output a PHP function" and do_action tags are left out on purpose: they run code.
 *
 * Modes of render():
 *   plain  text with no HTML (attributes, query fields, the editor preview)
 *   html   HTML is kept where a tag produces it (post content, links), everything else escaped
 *   url    the result passed through esc_url_raw()
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class SNN_Dynamic_Data {

	const REST_NS = 'snn/v1';

	/** Nested dynamic posts stop here, so a post cannot show itself forever. */
	const MAX_DEPTH = 5;

	/** {name}, {name:argument} and modifiers before the closing brace. */
	const PATTERN = '/\{([a-z][a-z0-9_]*)(?::([^{}]*?))?((?:\s+@[a-z-]+(?::(?:\'[^\']*\'|[^\s{}]*))?)*)\s*\}/';

	private static $depth = 0;

	public static function init() {
		add_action( 'rest_api_init', array( __CLASS__, 'register_routes' ) );
	}

	/** The groups of the picker, in order. */
	public static function groups() {
		return array(
			'post'    => __( 'Post', 'snn' ),
			'author'  => __( 'Author', 'snn' ),
			'site'    => __( 'Site', 'snn' ),
			'archive' => __( 'Archive', 'snn' ),
			'terms'   => __( 'Terms', 'snn' ),
			'date'    => __( 'Date', 'snn' ),
			'query'   => __( 'Query loop', 'snn' ),
			'user'    => __( 'Logged-in user', 'snn' ),
			'custom'  => __( 'Custom fields', 'snn' ),
			'misc'    => __( 'Misc', 'snn' ),
		);
	}

	/**
	 * The tags: key => array( group, label, hint ). The hint says what goes after the colon.
	 * cf_ is a prefix: {cf_price} reads the custom field "price" of the current post.
	 */
	public static function tags() {
		return array(
			// Post
			'post_title'          => array( 'post', __( 'Post title', 'snn' ), __( 'add :link to make it a link', 'snn' ) ),
			'post_id'             => array( 'post', __( 'Post ID', 'snn' ) ),
			'post_url'            => array( 'post', __( 'Post link', 'snn' ) ),
			'post_slug'           => array( 'post', __( 'Post slug', 'snn' ) ),
			'post_type'           => array( 'post', __( 'Post type', 'snn' ) ),
			'post_date'           => array( 'post', __( 'Post date', 'snn' ), __( 'PHP date format, for example F j, Y', 'snn' ) ),
			'post_modified'       => array( 'post', __( 'Post modified date', 'snn' ), __( 'PHP date format', 'snn' ) ),
			'post_time'           => array( 'post', __( 'Post time', 'snn' ), __( 'PHP time format, for example H:i', 'snn' ) ),
			'post_comments_count' => array( 'post', __( 'Post comments count', 'snn' ) ),
			'post_comments'       => array( 'post', __( 'Post comments', 'snn' ) ),
			'post_content'        => array( 'post', __( 'Post content', 'snn' ) ),
			'post_excerpt'        => array( 'post', __( 'Post excerpt', 'snn' ), __( 'number of words', 'snn' ) ),
			'read_more'           => array( 'post', __( 'Read more link', 'snn' ) ),
			'featured_image'      => array( 'post', __( 'Featured image URL', 'snn' ), __( 'image size, for example large', 'snn' ) ),
			// Author
			'author_id'           => array( 'author', __( 'Author ID', 'snn' ) ),
			'author_name'         => array( 'author', __( 'Author name', 'snn' ) ),
			'author_bio'          => array( 'author', __( 'Author bio', 'snn' ) ),
			'author_email'        => array( 'author', __( 'Author email', 'snn' ) ),
			'author_website'      => array( 'author', __( 'Author website', 'snn' ) ),
			'author_archive_url'  => array( 'author', __( 'Author archive URL', 'snn' ) ),
			'author_avatar'       => array( 'author', __( 'Author avatar URL', 'snn' ), __( 'image size in pixels', 'snn' ) ),
			'author_meta'         => array( 'author', __( 'Author meta', 'snn' ), __( 'add the meta key after a colon', 'snn' ) ),
			// Site
			'site_title'          => array( 'site', __( 'Site title', 'snn' ) ),
			'site_tagline'        => array( 'site', __( 'Site tagline', 'snn' ) ),
			'site_url'            => array( 'site', __( 'Site URL', 'snn' ) ),
			'site_login'          => array( 'site', __( 'Login URL', 'snn' ) ),
			'site_logout'         => array( 'site', __( 'Logout URL', 'snn' ) ),
			'url_parameter'       => array( 'site', __( 'URL parameter', 'snn' ), __( 'add the parameter name after a colon', 'snn' ) ),
			// Archive
			'archive_title'       => array( 'archive', __( 'Archive title', 'snn' ) ),
			'archive_description' => array( 'archive', __( 'Archive description', 'snn' ) ),
			// Terms (the term of the archive, or the term of a query loop item)
			'term_id'             => array( 'terms', __( 'Term ID', 'snn' ) ),
			'term_name'           => array( 'terms', __( 'Term name', 'snn' ) ),
			'term_taxonomy_slug'  => array( 'terms', __( 'Term taxonomy slug', 'snn' ) ),
			'term_slug'           => array( 'terms', __( 'Term slug', 'snn' ) ),
			'term_count'          => array( 'terms', __( 'Term count', 'snn' ) ),
			'term_url'            => array( 'terms', __( 'Term archive URL', 'snn' ) ),
			'term_parent'         => array( 'terms', __( 'Term parent', 'snn' ) ),
			'term_children'       => array( 'terms', __( 'Term children', 'snn' ) ),
			'term_description'    => array( 'terms', __( 'Term description', 'snn' ) ),
			'term_meta'           => array( 'terms', __( 'Term meta', 'snn' ), __( 'add the meta key after a colon', 'snn' ) ),
			// Date
			'current_date'        => array( 'date', __( 'Current date (UTC)', 'snn' ), __( 'PHP date format', 'snn' ) ),
			'current_wp_date'     => array( 'date', __( 'Current date (site time zone)', 'snn' ), __( 'PHP date format', 'snn' ) ),
			'format_date'         => array( 'date', __( 'Format a date', 'snn' ), __( 'type the date after the colon; @from and @to set the formats', 'snn' ) ),
			// Query loop
			'query_loop_index'    => array( 'query', __( 'Query loop index', 'snn' ), __( 'modifiers @start-at and @pad', 'snn' ) ),
			'query_results_count' => array( 'query', __( 'Query results count', 'snn' ) ),
			// Logged-in user
			'wp_user_id'              => array( 'user', __( 'User ID', 'snn' ) ),
			'wp_user_login'           => array( 'user', __( 'Username', 'snn' ) ),
			'wp_user_email'           => array( 'user', __( 'Email', 'snn' ) ),
			'wp_user_url'             => array( 'user', __( 'Website', 'snn' ) ),
			'wp_user_role'            => array( 'user', __( 'Role', 'snn' ) ),
			'wp_user_registered_date' => array( 'user', __( 'Registered date', 'snn' ), __( 'PHP date format', 'snn' ) ),
			'wp_user_nicename'        => array( 'user', __( 'Nicename', 'snn' ) ),
			'wp_user_nickname'        => array( 'user', __( 'Nickname', 'snn' ) ),
			'wp_user_description'     => array( 'user', __( 'Bio', 'snn' ) ),
			'wp_user_first_name'      => array( 'user', __( 'First name', 'snn' ) ),
			'wp_user_last_name'       => array( 'user', __( 'Last name', 'snn' ) ),
			'wp_user_display_name'    => array( 'user', __( 'Display name', 'snn' ) ),
			'wp_user_picture'         => array( 'user', __( 'Profile picture URL', 'snn' ), __( 'image size in pixels', 'snn' ) ),
			'wp_user_meta'            => array( 'user', __( 'User meta', 'snn' ), __( 'add the meta key after a colon', 'snn' ) ),
			// Custom fields
			'cf_'                 => array( 'custom', __( 'Custom field of this post', 'snn' ), __( 'type the field name after cf_, for example cf_price', 'snn' ) ),
			// Misc
			'search_term'         => array( 'misc', __( 'Search term', 'snn' ) ),
		);
	}

	/** The picker's data for the block editor. */
	public static function for_editor() {
		$tags = array();
		foreach ( self::tags() as $key => $tag ) {
			$tags[] = array(
				'key'   => $key,
				'group' => $tag[0],
				'label' => $tag[1],
				'hint'  => $tag[2] ?? '',
			);
		}
		return array(
			'groups' => self::groups(),
			'tags'   => $tags,
		);
	}

	/**
	 * Replace every tag in a string.
	 *
	 * @param string $input Text with tags, for example "By {author_name}".
	 * @param array  $ctx   post_id, term, index, count. Empty values come from the current page.
	 * @param string $mode  plain, html or url (see the top of this file).
	 */
	public static function render( $input, array $ctx = array(), $mode = 'plain' ) {
		$input = (string) $input;
		if ( false === strpos( $input, '{' ) ) {
			return 'url' === $mode ? esc_url_raw( $input ) : $input;
		}
		$ctx = self::context( $ctx );
		return preg_replace_callback(
			self::PATTERN,
			function ( $m ) use ( $ctx, $mode ) {
				return self::replace( $m, $ctx, $mode );
			},
			$input
		);
	}

	/**
	 * Run a callback with a post as the global post, so the WordPress functions and filters
	 * (the_content and so on) read that post. Restores the previous one afterwards.
	 */
	public static function with_post( $post, callable $callback ) {
		if ( self::$depth >= self::MAX_DEPTH ) {
			return '';
		}
		$previous = $GLOBALS['post'] ?? null;
		$GLOBALS['post'] = $post;
		setup_postdata( $post );
		self::$depth++;
		try {
			$result = $callback();
		} finally {
			self::$depth--;
			$GLOBALS['post'] = $previous;
			if ( $previous instanceof WP_Post ) {
				setup_postdata( $previous );
			}
		}
		return $result;
	}

	/** Fill in the post, term and loop data a tag may need, from the current page when missing. */
	public static function context( array $ctx = array() ) {
		$ctx = wp_parse_args(
			$ctx,
			array(
				'post_id' => 0,
				'term'    => null,
				'index'   => null,
				'count'   => null,
			)
		);
		if ( empty( $ctx['post_id'] ) ) {
			$ctx['post_id'] = (int) get_the_ID();
		}
		if ( empty( $ctx['term'] ) ) {
			$object         = get_queried_object();
			$ctx['term']    = $object instanceof WP_Term ? $object : null;
		}
		return $ctx;
	}

	/* ------------------------------------------------------------------
	 * Parsing and output
	 * ---------------------------------------------------------------- */

	private static function replace( array $m, array $ctx, $mode ) {
		$tag  = $m[1];
		$arg  = isset( $m[2] ) ? trim( $m[2] ) : '';
		$mods = self::modifiers( $m[3] ?? '' );

		$value = self::value( $tag, $arg, $mods, $ctx );
		if ( null === $value ) {
			return $m[0]; // Unknown tag: left as typed.
		}
		list( $text, $is_html ) = $value;

		if ( '' === trim( wp_strip_all_tags( $text ) ) && isset( $mods['fallback'] ) ) {
			$text    = $mods['fallback'];
			$is_html = false;
		}
		if ( ! $is_html ) {
			// Plain text is stored escaped (&amp;, &hellip;); decode it once, so each output escapes it once.
			$text = html_entity_decode( $text, ENT_QUOTES, 'UTF-8' );
		}

		switch ( $mode ) {
			case 'html':
				return $is_html ? wp_kses_post( $text ) : esc_html( $text );
			case 'url':
				return esc_url_raw( wp_strip_all_tags( $text ) );
			default:
				return wp_strip_all_tags( $text );
		}
	}

	/** @fallback:'text' @from:Y-m-d and so on, as key => value. */
	private static function modifiers( $string ) {
		$out = array();
		if ( preg_match_all( '/@([a-z-]+)(?::(?:\'([^\']*)\'|([^\s{}]*)))?/', (string) $string, $all, PREG_SET_ORDER ) ) {
			foreach ( $all as $mod ) {
				$value = '';
				if ( isset( $mod[2] ) && '' !== $mod[2] ) {
					$value = $mod[2];
				} elseif ( isset( $mod[3] ) ) {
					$value = $mod[3];
				}
				$out[ $mod[1] ] = $value;
			}
		}
		return $out;
	}

	/**
	 * The value of one tag: array( text, is_html ), or null when the tag is not known.
	 */
	private static function value( $tag, $arg, array $mods, array $ctx ) {
		$post = $ctx['post_id'] ? get_post( $ctx['post_id'] ) : null;
		$term = $ctx['term'];

		// Custom field: cf_ and the field name.
		if ( 0 === strpos( $tag, 'cf_' ) ) {
			if ( strlen( $tag ) === 3 ) {
				return null;
			}
			return self::t( $post ? self::scalar( get_post_meta( $post->ID, substr( $tag, 3 ), true ) ) : '' );
		}

		switch ( $tag ) {
			// Post
			case 'post_title':
				if ( ! $post ) {
					return self::t( '' );
				}
				$title = get_the_title( $post );
				if ( 'link' === $arg ) {
					return self::h( '<a href="' . esc_url( get_permalink( $post ) ) . '">' . esc_html( $title ) . '</a>' );
				}
				return self::t( $title );
			case 'post_id':
				return self::t( $post ? (string) $post->ID : '' );
			case 'post_url':
				return self::t( $post ? get_permalink( $post ) : '' );
			case 'post_slug':
				return self::t( $post ? $post->post_name : '' );
			case 'post_type':
				if ( ! $post ) {
					return self::t( '' );
				}
				$type = get_post_type_object( $post->post_type );
				return self::t( $type ? $type->labels->singular_name : $post->post_type );
			case 'post_date':
				return self::t( $post ? get_the_date( $arg, $post ) : '' );
			case 'post_modified':
				return self::t( $post ? get_the_modified_date( $arg, $post ) : '' );
			case 'post_time':
				return self::t( $post ? get_the_time( $arg, $post ) : '' );
			case 'post_comments_count':
				return self::t( $post ? (string) get_comments_number( $post ) : '' );
			case 'post_comments':
				if ( ! $post ) {
					return self::h( '' );
				}
				$comments = get_comments(
					array(
						'post_id' => $post->ID,
						'status'  => 'approve',
					)
				);
				return self::h( wp_kses_post( (string) wp_list_comments( array( 'echo' => false ), $comments ) ) );
			case 'post_content':
				if ( ! $post ) {
					return self::h( '' );
				}
				return self::h( (string) self::with_post( $post, function () use ( $post ) {
					return apply_filters( 'the_content', $post->post_content );
				} ) );
			case 'post_excerpt':
				if ( ! $post ) {
					return self::t( '' );
				}
				if ( '' !== $arg && ctype_digit( $arg ) ) {
					$source = '' !== $post->post_excerpt ? $post->post_excerpt : $post->post_content;
					return self::t( wp_trim_words( wp_strip_all_tags( $source ), (int) $arg ) );
				}
				return self::t( get_the_excerpt( $post ) );
			case 'read_more':
				if ( ! $post ) {
					return self::h( '' );
				}
				return self::h( '<a class="more-link" href="' . esc_url( get_permalink( $post ) ) . '">' . esc_html__( 'Read more', 'snn' ) . '</a>' );
			case 'featured_image':
				if ( ! $post ) {
					return self::t( '' );
				}
				$url = get_the_post_thumbnail_url( $post, '' !== $arg ? $arg : 'full' );
				return self::t( $url ? $url : '' );

			// Author (the post's author, or the author of an author archive)
			case 'author_id':
			case 'author_name':
			case 'author_bio':
			case 'author_email':
			case 'author_website':
			case 'author_archive_url':
			case 'author_avatar':
			case 'author_meta':
				$map = array(
					'author_id'          => 'id',
					'author_name'        => 'display_name',
					'author_bio'         => 'description',
					'author_email'       => 'email',
					'author_website'     => 'url',
					'author_archive_url' => 'archive_url',
					'author_avatar'      => 'avatar',
					'author_meta'        => 'meta',
				);
				return self::t( self::user_value( self::author_user( $post ), $map[ $tag ], $arg ) );

			// Site
			case 'site_title':
				return self::t( get_bloginfo( 'name', 'display' ) );
			case 'site_tagline':
				return self::t( get_bloginfo( 'description', 'display' ) );
			case 'site_url':
				return self::t( home_url( '/' ) );
			case 'site_login':
				return self::t( wp_login_url() );
			case 'site_logout':
				return self::t( wp_logout_url() );
			case 'url_parameter':
				if ( '' === $arg ) {
					return self::t( '' );
				}
				// phpcs:ignore WordPress.Security.NonceVerification.Recommended -- read only, shown as text.
				return self::t( isset( $_GET[ $arg ] ) ? sanitize_text_field( wp_unslash( (string) $_GET[ $arg ] ) ) : '' );

			// Archive
			case 'archive_title':
				return self::t( wp_strip_all_tags( get_the_archive_title() ) );
			case 'archive_description':
				return self::h( wp_kses_post( get_the_archive_description() ) );

			// Terms
			case 'term_id':
				return self::t( $term ? (string) $term->term_id : '' );
			case 'term_name':
				return self::t( $term ? $term->name : '' );
			case 'term_taxonomy_slug':
				return self::t( $term ? $term->taxonomy : '' );
			case 'term_slug':
				return self::t( $term ? $term->slug : '' );
			case 'term_count':
				return self::t( $term ? (string) $term->count : '' );
			case 'term_url':
				$link = $term ? get_term_link( $term ) : '';
				return self::t( is_string( $link ) ? $link : '' );
			case 'term_parent':
				$parent = $term && $term->parent ? get_term( $term->parent, $term->taxonomy ) : null;
				return self::t( $parent instanceof WP_Term ? $parent->name : '' );
			case 'term_children':
				if ( ! $term ) {
					return self::t( '' );
				}
				$names = get_terms(
					array(
						'taxonomy'   => $term->taxonomy,
						'parent'     => $term->term_id,
						'hide_empty' => false,
						'fields'     => 'names',
					)
				);
				return self::t( is_array( $names ) ? implode( ', ', $names ) : '' );
			case 'term_description':
				return self::h( $term ? wp_kses_post( $term->description ) : '' );
			case 'term_meta':
				return self::t( $term && '' !== $arg ? self::scalar( get_term_meta( $term->term_id, $arg, true ) ) : '' );

			// Date
			case 'current_date':
				return self::t( gmdate( '' !== $arg ? $arg : 'Y-m-d' ) );
			case 'current_wp_date':
				return self::t( wp_date( '' !== $arg ? $arg : get_option( 'date_format' ) ) );
			case 'format_date':
				return self::t( self::format_date( $arg, $mods ) );

			// Query loop
			case 'query_loop_index':
				if ( null === $ctx['index'] ) {
					return self::t( '' );
				}
				$number = (int) $ctx['index'] + (int) ( $mods['start-at'] ?? 0 );
				return self::t( str_pad( (string) $number, (int) ( $mods['pad'] ?? 0 ), '0', STR_PAD_LEFT ) );
			case 'query_results_count':
				return self::t( null === $ctx['count'] ? '' : (string) $ctx['count'] );

			// Logged-in user
			case 'wp_user_id':
			case 'wp_user_login':
			case 'wp_user_email':
			case 'wp_user_url':
			case 'wp_user_role':
			case 'wp_user_registered_date':
			case 'wp_user_nicename':
			case 'wp_user_nickname':
			case 'wp_user_description':
			case 'wp_user_first_name':
			case 'wp_user_last_name':
			case 'wp_user_display_name':
			case 'wp_user_picture':
			case 'wp_user_meta':
				$map = array(
					'wp_user_id'              => 'id',
					'wp_user_login'           => 'login',
					'wp_user_email'           => 'email',
					'wp_user_url'             => 'url',
					'wp_user_role'            => 'role',
					'wp_user_registered_date' => 'registered_date',
					'wp_user_nicename'        => 'nicename',
					'wp_user_nickname'        => 'nickname',
					'wp_user_description'     => 'description',
					'wp_user_first_name'      => 'first_name',
					'wp_user_last_name'       => 'last_name',
					'wp_user_display_name'    => 'display_name',
					'wp_user_picture'         => 'avatar',
					'wp_user_meta'            => 'meta',
				);
				return self::t( self::user_value( wp_get_current_user(), $map[ $tag ], $arg ) );

			// Misc
			case 'search_term':
				return self::t( get_search_query() );
		}
		return null;
	}

	/* ------------------------------------------------------------------
	 * Helpers
	 * ---------------------------------------------------------------- */

	private static function t( $text ) {
		return array( (string) $text, false );
	}

	private static function h( $html ) {
		return array( (string) $html, true );
	}

	/** A value that is a string or number. Arrays and objects read as empty. */
	private static function scalar( $value ) {
		return is_scalar( $value ) ? (string) $value : '';
	}

	/** The post's author, or the author of an author archive. */
	private static function author_user( $post ) {
		if ( $post ) {
			$user = get_userdata( (int) $post->post_author );
			return $user ? $user : false;
		}
		$object = get_queried_object();
		return $object instanceof WP_User ? $object : false;
	}

	/** One field of a user. Used by the author tags and the logged-in user tags. */
	private static function user_value( $user, $field, $arg ) {
		if ( ! $user instanceof WP_User || ! $user->exists() ) {
			return '';
		}
		switch ( $field ) {
			case 'id':
				return (string) $user->ID;
			case 'login':
				return $user->user_login;
			case 'email':
				return $user->user_email;
			case 'url':
				return $user->user_url;
			case 'role':
				return implode( ', ', $user->roles );
			case 'registered_date':
				return mysql2date( '' !== $arg ? $arg : get_option( 'date_format' ), $user->user_registered );
			case 'nicename':
				return $user->user_nicename;
			case 'nickname':
				return self::scalar( get_user_meta( $user->ID, 'nickname', true ) );
			case 'description':
				return self::scalar( get_user_meta( $user->ID, 'description', true ) );
			case 'first_name':
				return self::scalar( get_user_meta( $user->ID, 'first_name', true ) );
			case 'last_name':
				return self::scalar( get_user_meta( $user->ID, 'last_name', true ) );
			case 'display_name':
				return $user->display_name;
			case 'avatar':
				return (string) get_avatar_url( $user->ID, array( 'size' => ctype_digit( $arg ) ? (int) $arg : 96 ) );
			case 'archive_url':
				return (string) get_author_posts_url( $user->ID, $user->user_nicename );
			case 'meta':
				return '' !== $arg ? self::scalar( get_user_meta( $user->ID, $arg, true ) ) : '';
		}
		return '';
	}

	/** {format_date:2026-01-31 @from:Y-m-d @to:d/m/Y}: read the date, print it in the new format. */
	private static function format_date( $date, array $mods ) {
		if ( '' === $date ) {
			return '';
		}
		$to = isset( $mods['to'] ) && '' !== $mods['to'] ? $mods['to'] : get_option( 'date_format' );
		if ( ! empty( $mods['from'] ) ) {
			$parsed = DateTime::createFromFormat( $mods['from'], $date, wp_timezone() );
			if ( ! $parsed ) {
				return '';
			}
			$stamp = $parsed->getTimestamp();
		} else {
			$stamp = strtotime( $date );
			if ( false === $stamp ) {
				return '';
			}
		}
		return wp_date( $to, $stamp );
	}

	/* ------------------------------------------------------------------
	 * REST: the editor's preview of a field
	 * ---------------------------------------------------------------- */

	public static function register_routes() {
		register_rest_route(
			self::REST_NS,
			'/dynamic-data/preview',
			array(
				'methods'             => 'POST',
				'callback'            => array( __CLASS__, 'rest_preview' ),
				'permission_callback' => array( __CLASS__, 'can_preview' ),
				'args'                => array(
					'text'    => array(
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

	public static function can_preview( WP_REST_Request $request ) {
		$post_id = (int) $request['post_id'];
		if ( $post_id ) {
			return current_user_can( 'edit_post', $post_id );
		}
		return current_user_can( 'edit_posts' );
	}

	public static function rest_preview( WP_REST_Request $request ) {
		$text = self::render( (string) $request['text'], array( 'post_id' => (int) $request['post_id'] ), 'plain' );
		return rest_ensure_response( array( 'text' => $text ) );
	}
}

SNN_Dynamic_Data::init();
