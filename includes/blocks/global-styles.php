<?php
/**
 * Global styles: the site's colours, fonts, sizes, widths, shapes and the default styles of
 * the blocks. Part of includes/blocks (see blocks.php).
 *
 * How it works
 * - One option, snn_global_styles, holds the values. Every save is sanitised.
 * - The values go into the theme layer of theme.json (filter wp_theme_json_data_theme). Core
 *   then emits them everywhere it reads theme.json: the front end, the block editor (palette,
 *   font families, font sizes, widths, shadows) and the Site Editor. Colours become
 *   --wp--preset--color--{slug}, fonts --wp--preset--font-family--{slug}, and so on.
 * - Fonts: Google Fonts are downloaded to this site (fonts.php) and listed in the option. Each
 *   font is a theme.json font family with its @font-face files, so every block's font menu can
 *   use it, with no request to Google on the page.
 * - Block defaults: block-defaults.php lists the blocks and their fields. Each value is written
 *   under styles.blocks.{name} (or the element or site target), so every block of that type gets
 *   it, and a block's own settings still override it.
 * - Editing: one modal. It opens from a button at the top right of the block editor and the
 *   Site Editor canvas, and from the admin bar on wp-admin screens. The modal talks to REST:
 *   snn/v1/global-styles (values) and snn/v1/global-styles/fonts (install and remove a font).
 *   Capability: edit_theme_options.
 * - The user layer (the wp_global_styles post: core's Styles panel, and the MCP abilities)
 *   still overrides the theme layer.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class SNN_Global_Styles {

	const OPTION     = 'snn_global_styles';
	const REST_NS    = 'snn/v1';
	const REST_ROUTE = '/global-styles';
	const MAX_COLORS = 12;
	const MAX_FONTS  = 12;
	const LENGTH_RE  = '/^(0|\d+(\.\d+)?(px|rem|em|%|vw|vh|ch|vmin|vmax))$/';
	const FAMILY_RE  = '/^[A-Za-z][A-Za-z0-9 ]{0,59}$/';

	/** Google Fonts subsets the font routes accept. */
	const SUBSETS = array( 'latin', 'latin-ext', 'cyrillic', 'cyrillic-ext', 'greek', 'greek-ext', 'vietnamese' );

	public static function init() {
		add_filter( 'wp_theme_json_data_theme', array( __CLASS__, 'theme_json' ) );
		add_action( 'rest_api_init', array( __CLASS__, 'register_routes' ) );
		add_action( 'enqueue_block_editor_assets', array( __CLASS__, 'enqueue_editor' ) );
		add_action( 'admin_enqueue_scripts', array( __CLASS__, 'enqueue_admin' ) );
		add_action( 'admin_bar_menu', array( __CLASS__, 'admin_bar_item' ), 90 );
	}

	public static function can_edit() {
		return current_user_can( 'edit_theme_options' );
	}

	/* ------------------------------------------------------------------
	 * Values
	 * ---------------------------------------------------------------- */

	/** The defaults: black and white only. Every key here is a key of the stored values. */
	public static function defaults() {
		return array(
			'colors'     => array(
				array( 'name' => 'Black', 'slug' => 'black', 'color' => '#000000' ),
				array( 'name' => 'White', 'slug' => 'white', 'color' => '#ffffff' ),
			),
			'fonts'      => array(),
			'typography' => array(
				'sizes'    => array(
					'small'    => '0.875rem',
					'medium'   => '1.125rem',
					'large'    => '1.375rem',
					'x-large'  => '1.75rem',
					'xx-large' => '2.25rem',
				),
				'headings' => array(
					'h1' => '2.5rem',
					'h2' => '2rem',
					'h3' => '1.5rem',
					'h4' => '1.25rem',
					'h5' => '1.125rem',
					'h6' => '1rem',
				),
			),
			'layout'     => array(
				'content'   => '680px',
				'wide'      => '1200px',
				'block_gap' => '1.5rem',
			),
			'shape'      => array(
				'radius'  => array(
					'small'  => '4px',
					'medium' => '8px',
					'large'  => '16px',
					'pill'   => '999px',
				),
				'shadows' => array(
					'small'  => '0 1px 2px rgba(0, 0, 0, 0.08)',
					'medium' => '0 4px 12px rgba(0, 0, 0, 0.1)',
					'large'  => '0 12px 32px rgba(0, 0, 0, 0.14)',
				),
			),
			'blocks'     => SNN_Block_Defaults::defaults(),
		);
	}

	/** Heading and button weights. */
	public static function weights() {
		return array( '300', '400', '500', '600', '700', '800', '900' );
	}

	/** The stored values, sanitised. Fonts come from the stored list. */
	public static function get_values() {
		$stored = get_option( self::OPTION, array() );
		return self::sanitize( is_array( $stored ) ? $stored : array(), true );
	}

	/**
	 * Sanitise a whole set of values. Missing or invalid parts fall back to the defaults.
	 *
	 * @param bool $fonts_from_input Take the fonts from $input. Otherwise they are the stored
	 *                               fonts, so a palette save cannot change the font list.
	 */
	public static function sanitize( $input, $fonts_from_input = false ) {
		$input = is_array( $input ) ? $input : array();
		$d     = self::defaults();

		// Colours: the palette. A slug is kept when given (so block references survive a rename),
		// otherwise it comes from the name. Slugs stay unique.
		$colors = array();
		foreach ( is_array( $input['colors'] ?? null ) ? $input['colors'] : array() as $item ) {
			if ( count( $colors ) >= self::MAX_COLORS || ! is_array( $item ) ) {
				continue;
			}
			$hex  = self::hex( $item['color'] ?? '' );
			$name = mb_substr( trim( sanitize_text_field( (string) ( $item['name'] ?? '' ) ) ), 0, 40 );
			if ( null === $hex || '' === $name ) {
				continue;
			}
			$slug = sanitize_title( (string) ( $item['slug'] ?? '' ) );
			if ( '' === $slug ) {
				$slug = sanitize_title( $name );
			}
			if ( '' === $slug ) {
				$slug = 'color';
			}
			$unique = $slug;
			$n      = 2;
			while ( in_array( $unique, array_column( $colors, 'slug' ), true ) ) {
				$unique = $slug . '-' . $n;
				$n++;
			}
			$colors[] = array( 'name' => $name, 'slug' => $unique, 'color' => $hex );
		}
		if ( ! $colors ) {
			$colors = $d['colors'];
		}

		// Fonts: the installed Google Fonts (see the font routes).
		$fonts = self::clean_fonts( $fonts_from_input ? ( $input['fonts'] ?? array() ) : self::stored_fonts() );

		// Typography sizes and heading sizes.
		$t          = is_array( $input['typography'] ?? null ) ? $input['typography'] : array();
		$typography = array(
			'sizes'    => self::lengths( $t['sizes'] ?? null, $d['typography']['sizes'] ),
			'headings' => self::lengths( $t['headings'] ?? null, $d['typography']['headings'] ),
		);

		// Layout.
		$l      = is_array( $input['layout'] ?? null ) ? $input['layout'] : array();
		$layout = array(
			'content'   => self::length( $l['content'] ?? null, $d['layout']['content'] ),
			'wide'      => self::length( $l['wide'] ?? null, $d['layout']['wide'] ),
			'block_gap' => self::length( $l['block_gap'] ?? null, $d['layout']['block_gap'] ),
		);

		// Shape: radius and shadow presets.
		$s       = is_array( $input['shape'] ?? null ) ? $input['shape'] : array();
		$shape   = array(
			'radius'  => self::lengths( $s['radius'] ?? null, $d['shape']['radius'] ),
			'shadows' => array(),
		);
		$shadows = is_array( $s['shadows'] ?? null ) ? $s['shadows'] : array();
		foreach ( $d['shape']['shadows'] as $key => $default ) {
			$shape['shadows'][ $key ] = self::shadow( $shadows[ $key ] ?? null, $default );
		}

		// Block defaults, against the choices above.
		$refs   = array(
			'colors'  => array_column( $colors, 'slug' ),
			'fonts'   => array_merge( array( 'system' ), array_column( $fonts, 'slug' ) ),
			'sizes'   => array_keys( $typography['sizes'] ),
			'radius'  => array_keys( $shape['radius'] ),
			'shadows' => array_keys( $shape['shadows'] ),
			'weights' => self::weights(),
		);
		$blocks = SNN_Block_Defaults::sanitize( $input['blocks'] ?? array(), $refs );

		return array(
			'colors'     => $colors,
			'fonts'      => $fonts,
			'typography' => $typography,
			'layout'     => $layout,
			'shape'      => $shape,
			'blocks'     => $blocks,
		);
	}

	public static function hex( $value ) {
		$value = strtolower( trim( (string) $value ) );
		return preg_match( '/^#([0-9a-f]{3}|[0-9a-f]{6})$/', $value ) ? $value : null;
	}

	/** A CSS length with a unit, or 0. Returns $default when the value is not one. */
	public static function length( $value, $default ) {
		$value = strtolower( trim( (string) $value ) );
		return preg_match( self::LENGTH_RE, $value ) ? $value : $default;
	}

	/** A map of lengths: each key of $defaults, with its own fallback. */
	private static function lengths( $value, $defaults ) {
		$value = is_array( $value ) ? $value : array();
		$out   = array();
		foreach ( $defaults as $key => $default ) {
			$out[ $key ] = self::length( $value[ $key ] ?? null, $default );
		}
		return $out;
	}

	/** A number between $min and $max, without trailing zeros. */
	public static function number( $value, $min, $max ) {
		$x = is_numeric( $value ) ? (float) $value : $min;
		$x = min( max( $x, $min ), $max );
		return rtrim( rtrim( sprintf( '%.2f', $x ), '0' ), '.' );
	}

	private static function shadow( $value, $default ) {
		$value = trim( preg_replace( '/\s+/', ' ', (string) $value ) );
		return ( '' !== $value && strlen( $value ) <= 160 && preg_match( '/^[A-Za-z0-9 ,.()%#+\-]+$/', $value ) ) ? $value : $default;
	}

	/* ------------------------------------------------------------------
	 * Fonts: the stored list, and the install and remove steps
	 * ---------------------------------------------------------------- */

	private static function stored_fonts() {
		$stored = get_option( self::OPTION, array() );
		return is_array( $stored ) && isset( $stored['fonts'] ) && is_array( $stored['fonts'] ) ? $stored['fonts'] : array();
	}

	/** Font files live in WordPress's font directory. Only files under it are accepted. */
	private static function font_dirs() {
		$dir = wp_get_font_dir();
		return array(
			'url'  => trailingslashit( $dir['url'] ),
			'path' => trailingslashit( $dir['path'] ),
		);
	}

	private static function clean_fonts( $fonts ) {
		$out   = array();
		$slugs = array();
		$dirs  = self::font_dirs();
		foreach ( is_array( $fonts ) ? $fonts : array() as $font ) {
			if ( count( $out ) >= self::MAX_FONTS || ! is_array( $font ) ) {
				continue;
			}
			$name = trim( preg_replace( '/\s+/', ' ', (string) ( $font['name'] ?? '' ) ) );
			$slug = sanitize_title( $name );
			if ( ! preg_match( self::FAMILY_RE, $name ) || '' === $slug || in_array( $slug, $slugs, true ) ) {
				continue;
			}
			$faces = array();
			foreach ( is_array( $font['faces'] ?? null ) ? $font['faces'] : array() as $face ) {
				if ( ! is_array( $face ) ) {
					continue;
				}
				$weight = (string) ( $face['weight'] ?? '' );
				$src    = (string) ( $face['src'] ?? '' );
				$range  = (string) ( $face['unicode_range'] ?? '' );
				if ( ! preg_match( '/^[1-9]00$/', $weight ) || 0 !== strpos( $src, $dirs['url'] ) || ! preg_match( '/^[A-Za-z0-9._\-\/:%]+$/', $src ) ) {
					continue;
				}
				$faces[] = array(
					'weight'        => $weight,
					'style'         => 'normal',
					'subset'        => sanitize_key( (string) ( $face['subset'] ?? '' ) ),
					'src'           => $src,
					'unicode_range' => preg_match( '/^U\+[0-9A-Fa-f?]+(-[0-9A-Fa-f?]+)?(,\s*U\+[0-9A-Fa-f?]+(-[0-9A-Fa-f?]+)?)*$/', $range ) ? $range : '',
				);
			}
			if ( ! $faces ) {
				continue;
			}
			$out[]   = array( 'name' => $name, 'slug' => $slug, 'faces' => $faces );
			$slugs[] = $slug;
		}
		return $out;
	}

	/** Save a sanitised set of values and clear the theme.json caches. */
	private static function write( array $values ) {
		update_option( self::OPTION, $values, true );
		WP_Theme_JSON_Resolver::clean_cached_data();
		if ( function_exists( 'wp_clean_theme_json_cache' ) ) {
			wp_clean_theme_json_cache(); // Also drops the cached global stylesheet (a persistent object cache keeps it otherwise).
		}
	}

	/** Save the values sent by the modal. Returns the saved values. */
	public static function save( $input ) {
		$clean = self::sanitize( $input );
		self::write( $clean );
		return $clean;
	}

	/** Delete font files that are under the font directory. */
	private static function delete_font_files( array $urls ) {
		$dirs = self::font_dirs();
		foreach ( $urls as $url ) {
			if ( 0 === strpos( (string) $url, $dirs['url'] ) ) {
				wp_delete_file( $dirs['path'] . substr( (string) $url, strlen( $dirs['url'] ) ) );
			}
		}
	}

	/**
	 * Download a Google Font to this site and add it to the list.
	 *
	 * @return array|WP_Error The saved values.
	 */
	public static function install_font( $family, $weights, $subsets ) {
		$family = trim( preg_replace( '/\s+/', ' ', (string) $family ) );
		if ( ! preg_match( self::FAMILY_RE, $family ) ) {
			return new WP_Error( 'snn_font_name', __( 'Use the family name as on Google Fonts, with letters, digits and spaces only, for example Inter or Playfair Display.', 'snn' ), array( 'status' => 400 ) );
		}
		$slug   = sanitize_title( $family );
		$values = self::get_values();
		foreach ( $values['fonts'] as $font ) {
			if ( $font['slug'] === $slug ) {
				return new WP_Error( 'snn_font_exists', __( 'This font is already installed.', 'snn' ), array( 'status' => 409 ) );
			}
		}
		if ( count( $values['fonts'] ) >= self::MAX_FONTS ) {
			return new WP_Error( 'snn_font_limit', __( 'Remove a font before adding another.', 'snn' ), array( 'status' => 400 ) );
		}

		$weights = array_values( array_unique( array_filter( array_map( function ( $w ) {
			return preg_match( '/^[1-9]00$/', (string) $w ) ? (string) $w : null;
		}, (array) $weights ) ) ) );
		sort( $weights );
		if ( ! $weights ) {
			return new WP_Error( 'snn_font_weights', __( 'Choose at least one weight.', 'snn' ), array( 'status' => 400 ) );
		}
		$subsets = array_values( array_intersect( (array) $subsets, self::SUBSETS ) );
		if ( ! $subsets ) {
			$subsets = array( 'latin' );
		}

		// Google Fonts sometimes answers with no faces for a moment. One retry after a second.
		for ( $try = 0; $try < 2; $try++ ) {
			$faces = snn_font_google_faces( $family, $weights, array( 'normal' ), $subsets );
			$empty = is_wp_error( $faces ) ? 'google_fonts_empty' === $faces->get_error_code() : ! $faces;
			if ( ! $empty ) {
				break;
			}
			if ( 0 === $try ) {
				sleep( 1 );
			}
		}
		if ( is_wp_error( $faces ) ) {
			return $faces;
		}
		if ( ! $faces ) {
			return new WP_Error( 'snn_font_none', __( 'Google Fonts has no files for these weights and subsets.', 'snn' ), array( 'status' => 404 ) );
		}

		$stored  = array();
		$written = array();
		foreach ( $faces as $face ) {
			$bytes = snn_font_download( $face['url'] );
			if ( is_wp_error( $bytes ) ) {
				self::delete_font_files( $written );
				return $bytes;
			}
			$file = $slug . '-' . $face['weight'] . '-' . $face['subset'] . '.' . snn_font_extension( $bytes );
			$url  = snn_font_store( $bytes, $file );
			if ( is_wp_error( $url ) ) {
				self::delete_font_files( $written );
				return $url;
			}
			$written[] = $url;
			$stored[]  = array(
				'weight'        => $face['weight'],
				'style'         => 'normal',
				'subset'        => $face['subset'],
				'src'           => $url,
				'unicode_range' => $face['unicode_range'],
			);
		}

		$values['fonts'][] = array( 'name' => $family, 'slug' => $slug, 'faces' => $stored );
		$clean             = self::sanitize( $values, true );
		if ( ! in_array( $slug, array_column( $clean['fonts'], 'slug' ), true ) ) {
			self::delete_font_files( $written );
			return new WP_Error( 'snn_font_invalid', __( 'The font files could not be saved.', 'snn' ), array( 'status' => 500 ) );
		}
		self::write( $clean );
		return $clean;
	}

	/** Remove a font from the list and delete its files. Block defaults that used it fall back. */
	public static function remove_font( $slug ) {
		$values = self::get_values();
		$found  = null;
		$keep   = array();
		foreach ( $values['fonts'] as $font ) {
			if ( $font['slug'] === $slug ) {
				$found = $font;
			} else {
				$keep[] = $font;
			}
		}
		if ( null === $found ) {
			return new WP_Error( 'snn_font_missing', __( 'No installed font has that name.', 'snn' ), array( 'status' => 404 ) );
		}
		$values['fonts'] = $keep;
		$clean           = self::sanitize( $values, true );
		self::write( $clean );
		self::delete_font_files( array_column( $found['faces'], 'src' ) );
		return $clean;
	}

	/* ------------------------------------------------------------------
	 * theme.json (the theme layer)
	 * ---------------------------------------------------------------- */

	public static function theme_json( $theme_json ) {
		return $theme_json->update_with( self::theme_data( self::get_values() ) );
	}

	/** The theme.json fragment for a set of sanitised values. */
	public static function theme_data( array $v ) {
		$palette = array();
		foreach ( $v['colors'] as $c ) {
			$palette[] = array( 'slug' => $c['slug'], 'name' => $c['name'], 'color' => $c['color'] );
		}

		$families = array(
			array( 'slug' => 'system', 'name' => __( 'System', 'snn' ), 'fontFamily' => SNN_Block_Defaults::SYSTEM_FONT ),
		);
		foreach ( $v['fonts'] as $font ) {
			$faces = array();
			foreach ( $font['faces'] as $face ) {
				$faces[] = array(
					'fontFamily'   => $font['name'],
					'fontStyle'    => $face['style'],
					'fontWeight'   => $face['weight'],
					'fontDisplay'  => 'swap',
					'src'          => array( $face['src'] ),
					'unicodeRange' => $face['unicode_range'],
				);
			}
			$families[] = array(
				'slug'       => $font['slug'],
				'name'       => $font['name'],
				'fontFamily' => '"' . $font['name'] . '", sans-serif',
				'fontFace'   => $faces,
			);
		}

		$sizes = array();
		foreach ( $v['typography']['sizes'] as $slug => $size ) {
			$sizes[] = array( 'slug' => $slug, 'name' => ucwords( str_replace( '-', ' ', $slug ) ), 'size' => $size );
		}

		$shadows = array();
		foreach ( $v['shape']['shadows'] as $slug => $shadow ) {
			$shadows[] = array( 'slug' => $slug, 'name' => ucfirst( $slug ), 'shadow' => $shadow );
		}

		// Heading sizes (h1 to h6) are element styles. The block defaults add to the same tree.
		$styles = array( 'elements' => array() );
		foreach ( $v['typography']['headings'] as $tag => $size ) {
			$styles['elements'][ $tag ] = array( 'typography' => array( 'fontSize' => $size ) );
		}

		$fields = SNN_Block_Defaults::fields();
		foreach ( SNN_Block_Defaults::entries() as $key => $entry ) {
			$block = $v['blocks'][ $key ] ?? array();
			$base  = 'styles' === $entry['target'] ? array() : explode( '.', $entry['target'] );
			foreach ( $entry['fields'] as $name ) {
				$value = $block[ $name ] ?? '';
				if ( '' === $value ) {
					continue;
				}
				$field = $fields[ $name ];
				self::set_path( $styles, array_merge( $base, explode( '.', $field['path'] ) ), self::style_value( $field, $value, $v ) );
			}
		}

		$data = array(
			'version'  => 3,
			'settings' => array(
				'color'      => array( 'palette' => $palette ),
				'typography' => array( 'fontFamilies' => $families, 'fontSizes' => $sizes ),
				'layout'     => array( 'contentSize' => $v['layout']['content'], 'wideSize' => $v['layout']['wide'] ),
				'shadow'     => array( 'presets' => $shadows ),
			),
			'styles'   => $styles,
		);
		return self::prune( $data );
	}

	/** The theme.json value for one block field. Colours, fonts, sizes and shadows are presets. */
	private static function style_value( array $field, $value, array $v ) {
		switch ( $field['type'] ) {
			case 'color':
				return 'var:preset|color|' . $value;
			case 'font':
				return 'var:preset|font-family|' . $value;
			case 'size':
				return 'var:preset|font-size|' . $value;
			case 'shadow':
				return 'var:preset|shadow|' . $value;
			case 'radius':
				return $v['shape']['radius'][ $value ] ?? null;
		}
		if ( ! empty( $field['all_sides'] ) ) {
			return array( 'top' => $value, 'right' => $value, 'bottom' => $value, 'left' => $value );
		}
		return $value;
	}

	private static function set_path( array &$data, array $segments, $value ) {
		$node = &$data;
		foreach ( $segments as $segment ) {
			if ( ! isset( $node[ $segment ] ) || ! is_array( $node[ $segment ] ) ) {
				$node[ $segment ] = array();
			}
			$node = &$node[ $segment ];
		}
		$node = $value;
	}

	/** Remove empty values and empty objects, so theme.json only carries what is set. */
	private static function prune( array $data ) {
		foreach ( $data as $key => $value ) {
			if ( is_array( $value ) ) {
				$value = self::prune( $value );
				if ( array() === $value ) {
					unset( $data[ $key ] );
					continue;
				}
				$data[ $key ] = $value;
			} elseif ( null === $value || '' === $value ) {
				unset( $data[ $key ] );
			}
		}
		return $data;
	}

	/* ------------------------------------------------------------------
	 * REST
	 * ---------------------------------------------------------------- */

	public static function register_routes() {
		register_rest_route(
			self::REST_NS,
			self::REST_ROUTE,
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( __CLASS__, 'rest_read' ),
					'permission_callback' => array( __CLASS__, 'can_edit' ),
				),
				array(
					'methods'             => WP_REST_Server::EDITABLE,
					'callback'            => array( __CLASS__, 'rest_save' ),
					'permission_callback' => array( __CLASS__, 'can_edit' ),
					'args'                => array(
						'values' => array( 'type' => 'object', 'required' => true ),
					),
				),
			)
		);
		register_rest_route(
			self::REST_NS,
			self::REST_ROUTE . '/fonts',
			array(
				'methods'             => WP_REST_Server::CREATABLE,
				'callback'            => array( __CLASS__, 'rest_install_font' ),
				'permission_callback' => array( __CLASS__, 'can_edit' ),
				'args'                => array(
					'family'  => array( 'type' => 'string', 'required' => true ),
					'weights' => array( 'type' => 'array', 'required' => true ),
					'subsets' => array( 'type' => 'array', 'default' => array( 'latin' ) ),
				),
			)
		);
		register_rest_route(
			self::REST_NS,
			self::REST_ROUTE . '/fonts/(?P<slug>[a-z0-9-]+)',
			array(
				'methods'             => WP_REST_Server::DELETABLE,
				'callback'            => array( __CLASS__, 'rest_remove_font' ),
				'permission_callback' => array( __CLASS__, 'can_edit' ),
			)
		);
	}

	public static function rest_read() {
		return rest_ensure_response( self::payload() );
	}

	public static function rest_save( WP_REST_Request $request ) {
		self::save( $request->get_param( 'values' ) );
		return rest_ensure_response( self::payload() );
	}

	public static function rest_install_font( WP_REST_Request $request ) {
		$result = self::install_font( $request->get_param( 'family' ), (array) $request->get_param( 'weights' ), (array) $request->get_param( 'subsets' ) );
		if ( is_wp_error( $result ) ) {
			return $result;
		}
		return rest_ensure_response( self::payload() );
	}

	public static function rest_remove_font( WP_REST_Request $request ) {
		$result = self::remove_font( (string) $request->get_param( 'slug' ) );
		if ( is_wp_error( $result ) ) {
			return $result;
		}
		return rest_ensure_response( self::payload() );
	}

	private static function payload() {
		return array(
			'values'   => self::get_values(),
			'defaults' => self::defaults(),
		);
	}

	/* ------------------------------------------------------------------
	 * The modal's form: one schema, read by the script. Paths point into the values.
	 * ---------------------------------------------------------------- */

	public static function schema() {
		$weights = array_map( function ( $w ) {
			return array( 'value' => $w, 'label' => $w );
		}, self::weights() );

		$length = function ( $path, $label ) {
			return array( 'path' => $path, 'label' => $label, 'type' => 'length' );
		};

		$tabs = array(
			array(
				'id'      => 'colors',
				'label'   => __( 'Colours', 'snn' ),
				'palette' => true,
			),
			array(
				'id'     => 'typography',
				'label'  => __( 'Typography', 'snn' ),
				'groups' => array(
					array(
						'title' => __( 'Font library', 'snn' ),
						'fonts' => true,
					),
					array(
						'title'  => __( 'Font size presets', 'snn' ),
						'fields' => array(
							$length( 'typography.sizes.small', __( 'Small', 'snn' ) ),
							$length( 'typography.sizes.medium', __( 'Medium', 'snn' ) ),
							$length( 'typography.sizes.large', __( 'Large', 'snn' ) ),
							$length( 'typography.sizes.x-large', __( 'X large', 'snn' ) ),
							$length( 'typography.sizes.xx-large', __( 'XX large', 'snn' ) ),
						),
					),
					array(
						'title'  => __( 'Heading sizes', 'snn' ),
						'fields' => array(
							$length( 'typography.headings.h1', 'H1' ),
							$length( 'typography.headings.h2', 'H2' ),
							$length( 'typography.headings.h3', 'H3' ),
							$length( 'typography.headings.h4', 'H4' ),
							$length( 'typography.headings.h5', 'H5' ),
							$length( 'typography.headings.h6', 'H6' ),
						),
					),
				),
			),
			array(
				'id'     => 'layout',
				'label'  => __( 'Layout', 'snn' ),
				'groups' => array(
					array(
						'title'  => __( 'Widths', 'snn' ),
						'fields' => array(
							$length( 'layout.content', __( 'Content width', 'snn' ) ),
							$length( 'layout.wide', __( 'Wide width', 'snn' ) ),
						),
					),
					array(
						'title'  => __( 'Spacing', 'snn' ),
						'fields' => array(
							$length( 'layout.block_gap', __( 'Gap between blocks', 'snn' ) ),
						),
					),
				),
			),
			array(
				'id'     => 'shape',
				'label'  => __( 'Shape', 'snn' ),
				'groups' => array(
					array(
						'title'  => __( 'Radius', 'snn' ),
						'fields' => array(
							$length( 'shape.radius.small', __( 'Small', 'snn' ) ),
							$length( 'shape.radius.medium', __( 'Medium', 'snn' ) ),
							$length( 'shape.radius.large', __( 'Large', 'snn' ) ),
							$length( 'shape.radius.pill', __( 'Pill', 'snn' ) ),
						),
					),
					array(
						'title'  => __( 'Shadows', 'snn' ),
						'fields' => array(
							array( 'path' => 'shape.shadows.small', 'label' => __( 'Small', 'snn' ), 'type' => 'shadow' ),
							array( 'path' => 'shape.shadows.medium', 'label' => __( 'Medium', 'snn' ), 'type' => 'shadow' ),
							array( 'path' => 'shape.shadows.large', 'label' => __( 'Large', 'snn' ), 'type' => 'shadow' ),
						),
					),
				),
			),
		);

		// Blocks: one collapsible card per entry of the registry, with the fields it uses.
		$groups = array();
		$fields = SNN_Block_Defaults::fields();
		foreach ( SNN_Block_Defaults::entries() as $key => $entry ) {
			$items = array();
			foreach ( $entry['fields'] as $name ) {
				$item = array( 'path' => 'blocks.' . $key . '.' . $name, 'label' => $fields[ $name ]['label'], 'optional' => true );
				switch ( $fields[ $name ]['type'] ) {
					case 'color':
						$item += array( 'type' => 'select', 'options_from' => 'palette' );
						break;
					case 'font':
						$item += array( 'type' => 'select', 'options_from' => 'fonts' );
						break;
					case 'size':
						$item += array( 'type' => 'select', 'options_from' => 'sizes' );
						break;
					case 'weight':
						$item += array( 'type' => 'select', 'options' => $weights );
						break;
					case 'radius':
						$item += array( 'type' => 'select', 'options_from' => 'radius' );
						break;
					case 'shadow':
						$item += array( 'type' => 'select', 'options_from' => 'shadows' );
						break;
					case 'line':
						$item += array( 'type' => 'number', 'step' => 0.05, 'min' => 0.8, 'max' => 3 );
						break;
					default:
						$item += array( 'type' => 'length' );
				}
				$items[] = $item;
			}
			$groups[] = array(
				'title'       => $entry['label'],
				'collapsible' => true,
				'open'        => $entry['open'],
				'note'        => $entry['planned'] ? __( 'Not built yet. These defaults apply once the block exists.', 'snn' ) : '',
				'fields'      => $items,
			);
		}
		$tabs[] = array(
			'id'     => 'blocks',
			'label'  => __( 'Blocks', 'snn' ),
			'groups' => $groups,
		);

		return $tabs;
	}

	/* ------------------------------------------------------------------
	 * Scripts, admin bar
	 * ---------------------------------------------------------------- */

	public static function enqueue_editor() {
		if ( self::can_edit() ) {
			self::enqueue_assets( array( 'wp-plugins', 'wp-element', 'wp-editor', 'wp-api-fetch', 'wp-i18n', 'wp-data' ), true );
		}
	}

	public static function enqueue_admin() {
		if ( ! self::can_edit() ) {
			return;
		}
		$screen = get_current_screen();
		if ( $screen && method_exists( $screen, 'is_block_editor' ) && $screen->is_block_editor() ) {
			return; // The block editor loads its own copy (enqueue_editor).
		}
		self::enqueue_assets( array( 'wp-element', 'wp-api-fetch', 'wp-i18n' ), false );
	}

	private static function enqueue_assets( array $deps, $in_editor ) {
		$css = 'includes/blocks/assets/global-styles.css';
		$js  = 'includes/blocks/assets/global-styles.js';
		$ver_css = file_exists( SNN_PATH . $css ) ? filemtime( SNN_PATH . $css ) : '1';
		$ver_js  = file_exists( SNN_PATH . $js ) ? filemtime( SNN_PATH . $js ) : '1';

		wp_enqueue_style( 'snn-global-styles', SNN_URL . $css, array(), $ver_css );
		wp_enqueue_script( 'snn-global-styles', SNN_URL . $js, $deps, $ver_js, true );
		wp_localize_script(
			'snn-global-styles',
			'snnGlobalStyles',
			array(
				'restUrl'   => rest_url( self::REST_NS . self::REST_ROUTE ),
				'nonce'     => wp_create_nonce( 'wp_rest' ),
				'defaults'  => self::defaults(),
				'schema'    => self::schema(),
				'maxColors' => self::MAX_COLORS,
				'maxFonts'  => self::MAX_FONTS,
				'subsets'   => self::SUBSETS,
				'inEditor'  => (bool) $in_editor,
				'i18n'      => array(
					'button'           => __( 'Global styles', 'snn' ),
					'title'            => __( 'Global styles', 'snn' ),
					'intro'            => __( 'Colours, fonts, widths, shapes and the default styles of the blocks, for the whole site. Saved values apply on the front end and in the block editor.', 'snn' ),
					'close'            => __( 'Close', 'snn' ),
					'save'             => __( 'Save', 'snn' ),
					'saving'           => __( 'Saving…', 'snn' ),
					'saved'            => __( 'Saved.', 'snn' ),
					'savedEditor'      => __( 'Saved. Reload the editor to update the canvas and the colour pickers.', 'snn' ),
					'reload'           => __( 'Reload', 'snn' ),
					'reloadDirty'      => __( 'You have unsaved changes in this post. Save the post first, or reload and lose them?', 'snn' ),
					'cancel'           => __( 'Cancel', 'snn' ),
					'reset'            => __( 'Reset to defaults', 'snn' ),
					'resetDone'        => __( 'Defaults loaded. Save to apply them.', 'snn' ),
					'loading'          => __( 'Loading…', 'snn' ),
					'error'            => __( 'Could not save. Try again.', 'snn' ),
					'loadError'        => __( 'Could not load the global styles.', 'snn' ),
					'discard'          => __( 'Close without saving your changes?', 'snn' ),
					'inherit'          => __( 'Inherit', 'snn' ),
					'addColour'        => __( 'Add colour', 'snn' ),
					'newColour'        => __( 'Colour', 'snn' ),
					'remove'           => __( 'Remove', 'snn' ),
					'colourName'       => __( 'Colour name', 'snn' ),
					'colourValue'      => __( 'Colour value', 'snn' ),
					'paletteHint'      => __( 'The names show in the colour pickers. Each colour is also a CSS variable, --wp--preset--color--slug, on the front end and in the editor.', 'snn' ),
					'nameNeeded'       => __( 'Every colour needs a name.', 'snn' ),
					'lengthError'      => __( 'Use a number with a unit, for example 1rem, 16px or 0.', 'snn' ),
					'lineError'        => __( 'Line height must be between 0.8 and 3.', 'snn' ),
					'shadowError'      => __( 'A shadow can use letters, digits, spaces, commas, dots, brackets, percent signs, hashes and hyphens.', 'snn' ),
					'fontsHint'        => __( 'Google Fonts with open licences can be downloaded here. The files are saved on this site, so the page never asks Google for them. Every font then appears in the font menu of every block.', 'snn' ),
					'noFonts'          => __( 'No Google Fonts installed yet.', 'snn' ),
					'fontFamily'       => __( 'Family name', 'snn' ),
					'fontFamilyHint'   => __( 'As on Google Fonts, for example Inter or Playfair Display.', 'snn' ),
					'fontWeights'      => __( 'Weights', 'snn' ),
					'fontSubsets'      => __( 'Character sets', 'snn' ),
					'fontDownload'     => __( 'Download font', 'snn' ),
					'fontDownloading'  => __( 'Downloading from Google Fonts…', 'snn' ),
					'fontInstalled'    => __( 'Font downloaded. It is now in every font menu.', 'snn' ),
					'fontInstalledEditor' => __( 'Font downloaded. Reload the editor to use it in the font menus.', 'snn' ),
					'fontRemoved'      => __( 'Font removed.', 'snn' ),
					'fontRemove'       => __( 'Remove', 'snn' ),
					'fontNameNeeded'   => __( 'Type the family name first.', 'snn' ),
					'fontError'        => __( 'The font could not be downloaded. Check the name and the weights.', 'snn' ),
					'fontLimit'        => __( 'Remove a font before adding another.', 'snn' ),
					'system'           => __( 'System', 'snn' ),
					'tabs'             => __( 'Global styles sections', 'snn' ),
				),
			)
		);
	}

	public static function admin_bar_item( $wp_admin_bar ) {
		if ( ! is_admin() || ! self::can_edit() ) {
			return;
		}
		$wp_admin_bar->add_node(
			array(
				'id'    => 'snn-global-styles',
				'title' => '<span class="ab-icon dashicons dashicons-admin-appearance" aria-hidden="true"></span><span class="ab-label">' . esc_html__( 'Global styles', 'snn' ) . '</span>',
				'href'  => '#',
				'meta'  => array( 'class' => 'snn-gs-admin-bar' ),
			)
		);
	}
}

SNN_Global_Styles::init();
