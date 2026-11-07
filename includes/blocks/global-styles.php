<?php
/**
 * Global styles: the site's colours, fonts, sizes, widths and the default styles of the blocks.
 * Part of includes/blocks (see blocks.php).
 *
 * How it works
 * - One option, snn_global_styles, holds the values. Every save is sanitised.
 * - The values go into the theme layer of theme.json (filter wp_theme_json_data_theme). Core
 *   then emits them everywhere it reads theme.json: the front end, the block editor (
 *   font families, widths) and the Site Editor.
 *   Fonts keep their WordPress names (--wp--preset--font-family--{slug}). Colours and sizes are plain variables (--black, --size-20).
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
	const MAX_SIZES  = 12;
	/** The paths a fluid size can belong to: a size variable, or a heading size. */
	const FLUID_PATH_RE = '/^(sizes\.[a-z0-9-]+|typography\.headings\.h[1-6])$/';
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
		add_action( 'wp_head', array( __CLASS__, 'front_root_size' ), 5 );
		add_action( 'wp_head', array( __CLASS__, 'front_variables' ), 5 );
		add_filter( 'block_editor_settings_all', array( __CLASS__, 'editor_styles' ) );
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
			// A colour's name is its variable name (--black). There is no separate label.
			'colors'     => array(
				array( 'slug' => 'black', 'color' => '#000000' ),
				array( 'slug' => 'white', 'color' => '#ffffff' ),
			),
			'fonts'      => array(),
			// One list of size variables, for spacing and font sizes. Each name is the variable (--size-20).
			'sizes'      => array(
				'size-10' => '0.5rem',
				'size-20' => '0.875rem',
				'size-30' => '1rem',
				'size-40' => '1.5rem',
				'size-50' => '2.25rem',
				'size-60' => '3rem',
				'size-70' => '4rem',
			),
			'typography' => array(
				'headings' => array(
					'h1' => '2.5rem',
					'h2' => '2rem',
					'h3' => '1.5rem',
					'h4' => '1.25rem',
					'h5' => '1.125rem',
					'h6' => '1rem',
				),
			),
			// Fluid sizes: a clamp between two viewport widths, keyed by path (see fluid_css()).
			'fluid'      => array(),
			'blocks'     => SNN_Block_Defaults::defaults(),
			'editor'     => SNN_Block_Editor_Settings::defaults(),
		);
	}

	/** Heading and button weights. */
	public static function weights() {
		return array( '300', '400', '500', '600', '700', '800', '900' );
	}

	/** The stored values, sanitised. Fonts come from the stored list. */
	public static function get_values() {
		$stored = get_option( self::OPTION, array() );
		$values = self::sanitize( is_array( $stored ) ? $stored : array(), true );
		// The editor switches live in the block editor option, shared with the settings page.
		$values['editor'] = SNN_Block_Editor_Settings::values();
		return $values;
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
			// The variable name is the slug. An old "name" field is read only when there is no slug.
			$slug = sanitize_title( (string) ( $item['slug'] ?? ( $item['name'] ?? '' ) ) );
			if ( null === $hex || '' === $slug ) {
				continue;
			}
			$unique = $slug;
			$n      = 2;
			while ( in_array( $unique, array_column( $colors, 'slug' ), true ) ) {
				$unique = $slug . '-' . $n;
				$n++;
			}
			$colors[] = array( 'slug' => $unique, 'color' => $hex );
		}
		if ( ! $colors ) {
			$colors = $d['colors'];
		}

		// Fonts: the installed Google Fonts (see the font routes).
		$fonts = self::clean_fonts( $fonts_from_input ? ( $input['fonts'] ?? array() ) : self::stored_fonts() );

		// Typography sizes and heading sizes.
		$t          = is_array( $input['typography'] ?? null ) ? $input['typography'] : array();
		$typography = array(
			'headings' => self::lengths( $t['headings'] ?? null, $d['typography']['headings'] ),
		);


		// Fluid sizes: a clamp between two viewport widths, for a size variable or a heading. The value
		// is written from these settings below, so the two cannot disagree (a stored clamp is read back
		// through them, since a clamp is not a plain length).
		$fluid = array();
		foreach ( is_array( $input['fluid'] ?? null ) ? $input['fluid'] : array() as $path => $f ) {
			$settings = self::fluid_settings( $f );
			if ( is_string( $path ) && preg_match( self::FLUID_PATH_RE, $path ) && null !== $settings ) {
				$fluid[ $path ] = $settings;
			}
		}

		// Size variables: one list for spacing and font sizes (any slug, up to MAX_SIZES). Empty input keeps the defaults.
		$sizes = array();
		foreach ( is_array( $input['sizes'] ?? null ) ? $input['sizes'] : array() as $key => $value ) {
			if ( count( $sizes ) >= self::MAX_SIZES ) {
				break;
			}
			$slug = sanitize_title( (string) $key );
			$path = 'sizes.' . $slug;
			$len  = isset( $fluid[ $path ] ) ? self::fluid_css( $fluid[ $path ] ) : self::length( is_scalar( $value ) ? $value : '', '' );
			if ( '' === $slug || '' === $len || isset( $sizes[ $slug ] ) ) {
				continue;
			}
			$sizes[ $slug ] = $len;
		}
		if ( ! $sizes ) {
			$sizes = $d['sizes'];
		}

		// Block defaults, against the choices above.
		$refs   = array(
			'colors'  => array_column( $colors, 'slug' ),
			'fonts'   => array_merge( array( 'system' ), array_column( $fonts, 'slug' ) ),
			'sizes'   => array_keys( $sizes ),
			'weights' => self::weights(),
		);
		$blocks = SNN_Block_Defaults::sanitize( $input['blocks'] ?? array(), $refs );

		$out = array(
			'colors'     => $colors,
			'fonts'      => $fonts,
			'sizes'      => $sizes,
			'typography' => $typography,
			'fluid'      => array(),
			'blocks'     => $blocks,
		);
		// A fluid setting is kept only when its size exists, and its value becomes the clamp.
		foreach ( $fluid as $path => $settings ) {
			$parts = explode( '.', $path );
			// "sizes.size-20" is one level down; "typography.headings.h1" is two.
			if ( 2 === count( $parts ) && isset( $out[ $parts[0] ][ $parts[1] ] ) ) {
				$out[ $parts[0] ][ $parts[1] ] = self::fluid_css( $settings );
				$out['fluid'][ $path ]         = $settings;
			} elseif ( 3 === count( $parts ) && isset( $out[ $parts[0] ][ $parts[1] ][ $parts[2] ] ) ) {
				$out[ $parts[0] ][ $parts[1] ][ $parts[2] ] = self::fluid_css( $settings );
				$out['fluid'][ $path ]                      = $settings;
			}
		}
		return $out;
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
		$input = is_array( $input ) ? $input : array();
		$clean = self::sanitize( $input );
		self::write( $clean );
		if ( is_array( $input['editor'] ?? null ) ) {
			SNN_Block_Editor_Settings::save( $input['editor'] );
		}
		$clean['editor'] = SNN_Block_Editor_Settings::values();
		return $clean;
	}

	/** The root font size: the base size of the site, set on the html element too (rem units follow it). */
	public static function root_size() {
		$values = self::get_values();
		return (string) ( $values['blocks']['site']['base_size'] ?? '' );
	}

	/** The front end: html takes the base size, so rem-based sizes match the body. */
	public static function front_root_size() {
		$size = self::root_size();
		if ( '' !== $size ) {
			echo '<style id="snn-root-size">html{font-size:' . esc_attr( $size ) . '}</style>' . "\n";
		}
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

		// Colours and sizes are not theme presets (no --wp--preset-- names). They are our own variables,
		// written as plain custom properties by variables_css().
		$data = array(
			'version'  => 3,
			'settings' => array(
				'typography' => array( 'fontFamilies' => $families ),
			),
			'styles'   => $styles,
		);
		return self::prune( $data );
	}

	/**
	 * The variables as CSS custom properties: --size-20 and --black. The names are the variable names, with
	 * no WordPress prefix. The front end and the block editor both load this (see below).
	 */
	public static function variables_css( array $v ) {
		$declarations = array();
		foreach ( $v['sizes'] as $slug => $size ) {
			$declarations[] = '--' . $slug . ':' . $size;
		}
		foreach ( $v['colors'] as $c ) {
			$declarations[] = '--' . $c['slug'] . ':' . $c['color'];
		}
		return ':root{' . implode( ';', $declarations ) . '}';
	}

	/** The front end: the variables, in the head. The values are checked when they are saved. */
	public static function front_variables() {
		echo '<style id="snn-variables">' . self::variables_css( self::get_values() ) . "</style>\n"; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
	}

	/** The block editor: the variables, as a style of the canvas (its :root becomes the canvas wrapper). */
	public static function editor_styles( $settings ) {
		if ( is_array( $settings ) && isset( $settings['styles'] ) && is_array( $settings['styles'] ) ) {
			$settings['styles'][] = array(
				'css'            => self::variables_css( self::get_values() ),
				'__unstableType' => 'snn-variables',
				'isGlobalStyles' => false,
			);
		}
		return $settings;
	}

	/**
	 * The CSS of a fluid size: clamp(min, calc(intercept + slope * 100vw), max). The size is min at the
	 * minimum viewport and max at the maximum viewport, and it stays between min and max outside them.
	 * All numbers are px. The editor (global-styles.js) writes the same string, so both show one value.
	 */
	public static function fluid_css( array $f ) {
		$lo = min( $f['min'], $f['max'] );
		$hi = max( $f['min'], $f['max'] );
		if ( $f['maxVp'] === $f['minVp'] ) {
			return self::css_px( $f['min'] );
		}
		$slope     = ( $f['max'] - $f['min'] ) / ( $f['maxVp'] - $f['minVp'] );
		$intercept = $f['min'] - $slope * $f['minVp'];
		$vw        = $slope * 100;
		$operator  = $vw < 0 ? ' - ' : ' + ';
		return 'clamp(' . self::css_px( $lo ) . ', calc(' . self::css_px( $intercept ) . $operator . self::css_px( abs( $vw ), 'vw' ) . '), ' . self::css_px( $hi ) . ')';
	}

	/** A fluid size's four settings as numbers (px), or null when one is missing or out of range. */
	private static function fluid_settings( $f ) {
		if ( ! is_array( $f ) ) {
			return null;
		}
		$read = function ( $value, $min, $max ) {
			return is_numeric( $value ) && (float) $value >= $min && (float) $value <= $max ? round( (float) $value, 2 ) : null;
		};
		$min   = $read( $f['min'] ?? null, 0, 1000 );
		$max   = $read( $f['max'] ?? null, 0, 1000 );
		$min_v = $read( $f['minVp'] ?? null, 1, 4000 );
		$max_v = $read( $f['maxVp'] ?? null, 1, 4000 );
		if ( null === $min || null === $max || null === $min_v || null === $max_v || $min_v === $max_v ) {
			return null;
		}
		return array(
			'min'   => $min,
			'max'   => $max,
			'minVp' => $min_v,
			'maxVp' => $max_v,
		);
	}

	/** A number in px (or another unit), without trailing zeros. */
	private static function css_px( $x, $unit = 'px' ) {
		$x = abs( $x ) < 0.005 ? 0 : $x; // no "-0"
		return self::number( $x, -100000, 100000 ) . $unit;
	}

	/** The theme.json value for one block field. Colours and sizes are variables; fonts are presets. */
	private static function style_value( array $field, $value, array $v ) {
		switch ( $field['type'] ) {
			case 'color':
				return 'var(--' . $value . ')';
			case 'font':
				return 'var:preset|font-family|' . $value;
			case 'size':
				return 'var(--' . $value . ')';
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

		// A size: a length, or a fluid clamp (the Fluid switch under it).
		$size = function ( $path, $label ) {
			return array( 'path' => $path, 'label' => $label, 'type' => 'size' );
		};

		$cards = self::cards( $weights );

		return array(
			self::global_tab( $cards ),
			SNN_Page_Styles::tab( $weights ),
			self::blocks_tab( $cards ),
			array(
				'id'      => 'colors',
				'label'   => __( 'Colours', 'snn' ),
				'palette' => true,
			),
			array(
				'id'     => 'sizes',
				'label'  => __( 'Sizes', 'snn' ),
				'groups' => array(
					array(
						'title' => __( 'Size variables', 'snn' ),
						'sizes' => true,
					),
				),
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
						'title'  => __( 'Heading sizes', 'snn' ),
						'fields' => array(
							$size( 'typography.headings.h1', 'H1' ),
							$size( 'typography.headings.h2', 'H2' ),
							$size( 'typography.headings.h3', 'H3' ),
							$size( 'typography.headings.h4', 'H4' ),
							$size( 'typography.headings.h5', 'H5' ),
							$size( 'typography.headings.h6', 'H6' ),
						),
					),
				),
			),
		);
	}

	/**
	 * The block cards, split by kind: the site card (the global site styles), the global cards (links,
	 * headings), our own blocks and the core blocks.
	 */
	private static function cards( array $weights ) {
		$cards = array(
			'site'   => null,
			'global' => array(),
			'ours'   => array(),
			'core'   => array(),
		);
		foreach ( SNN_Block_Defaults::entries() as $key => $entry ) {
			$card = self::entry_card( $key, $entry, $weights );
			if ( 0 === strpos( $key, 'core/' ) ) {
				$cards['core'][] = $card;
			} elseif ( 0 === strpos( $key, 'snn/' ) ) {
				$cards['ours'][] = $card;
			} elseif ( 'site' === $key ) {
				$cards['site'] = $card;
			} else {
				$cards['global'][] = $card;
			}
		}
		return $cards;
	}

	/** The Global styles tab: the editor switches, then the global site styles with links and headings inside. */
	private static function global_tab( array $cards ) {
		return array(
			'id'     => 'global',
			'label'  => __( 'Global styles', 'snn' ),
			'groups' => array(
				array(
					'title'  => __( 'Editor', 'snn' ),
					'fields' => array(
						array(
							'path'  => 'editor.disable_core_blocks',
							'label' => __( 'Disable core blocks', 'snn' ),
							'type'  => 'switch',
							'hint'  => __( 'Core blocks are not offered in the inserter. Content that already uses them still shows and edits.', 'snn' ),
						),
						array(
							'path'  => 'editor.enable_top_toolbar',
							'label' => __( 'Top toolbar: all blocks and document tools in one place', 'snn' ),
							'type'  => 'switch',
							'hint'  => __( 'The top toolbar is on in every block editor.', 'snn' ),
						),
						array(
							'path'  => 'editor.disable_fullscreen',
							'label' => __( 'Disable full screen mode', 'snn' ),
							'type'  => 'switch',
							'hint'  => __( 'Full screen mode is off in every block editor, so the admin menu stays visible.', 'snn' ),
						),
					),
				),
				array(
					'title'  => $cards['site']['title'],
					'fields' => $cards['site']['fields'],
					'groups' => $cards['global'],
				),
			),
		);
	}

	/** The Block styles tab: our blocks, then the core block styles (collapsed, at the bottom). */
	private static function blocks_tab( array $cards ) {
		return array(
			'id'     => 'blocks',
			'label'  => __( 'Block styles', 'snn' ),
			'groups' => array(
				array(
					'title'  => __( 'Our blocks', 'snn' ),
					'groups' => $cards['ours'],
				),
				array(
					'title'       => __( 'Core Block Styles', 'snn' ),
					'collapsible' => true,
					'open'        => false,
					'note'        => __( 'WordPress core blocks, collapsed. Most sites do not need them. The Disable core blocks switch on the Global styles tab hides them from the inserter.', 'snn' ),
					'groups'      => $cards['core'],
				),
			),
		);
	}

	/**
	 * The schema items of some fields. $base is the path they sit under: blocks.{name} for a block.
	 * Every field is optional: an empty value means "inherit".
	 */
	public static function field_items( $base, array $names, array $weights ) {
		$fields = SNN_Block_Defaults::fields();
		$items  = array();
		foreach ( $names as $name ) {
			$item = array(
				'path'     => $base . '.' . $name,
				'label'    => $fields[ $name ]['label'],
				'optional' => true,
			);
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
				case 'line':
					$item += array( 'type' => 'number', 'step' => 0.05, 'min' => 0.8, 'max' => 3 );
					break;
				default:
					$item += array( 'type' => 'length' );
			}
			$items[] = $item;
		}
		return $items;
	}

	/** One block or element of the registry, as a card: its title, its note and its fields. */
	private static function entry_card( $key, array $entry, array $weights ) {
		return array(
			'title'       => $entry['label'],
			'collapsible' => true,
			'open'        => $entry['open'],
			'note'        => $entry['planned'] ? __( 'Not built yet. These defaults apply once the block exists.', 'snn' ) : '',
			'fields'      => self::field_items( 'blocks.' . $key, $entry['fields'], $weights ),
		);
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
					'pageUrl'   => rest_url( SNN_Page_Styles::REST_NS . '/page-styles/' ),
				'nonce'     => wp_create_nonce( 'wp_rest' ),
				'defaults'  => self::defaults(),
				'schema'    => self::schema(),
				'maxColors' => self::MAX_COLORS,
				'maxSizes'  => self::MAX_SIZES,
				'maxFonts'  => self::MAX_FONTS,
				'rootSize'  => self::root_size(),
				'subsets'   => self::SUBSETS,
				'inEditor'  => (bool) $in_editor,
				'i18n'      => array(
					'button'           => __( 'Global styles', 'snn' ),
					'title'            => __( 'Global styles', 'snn' ),
					'intro'            => __( 'Global styles apply to the whole site, page styles to one page, and block styles to every block of a kind. Saved values apply on the front end and in the block editor.', 'snn' ),
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
					'addSize'          => __( 'Add size', 'snn' ),
					'sizesHint'        => __( 'Each size is a variable named by its name, for example --size-20. It is used for gaps, padding, margins, widths, heights and font sizes. A fluid size scales between two viewport widths; its values are in px.', 'snn' ),
					'fluid'            => __( 'Fluid', 'snn' ),
					'minSize'          => __( 'Min size', 'snn' ),
					'maxSize'          => __( 'Max size', 'snn' ),
					'minViewport'      => __( 'Min viewport', 'snn' ),
					'maxViewport'      => __( 'Max viewport', 'snn' ),
					'fluidError'       => __( 'A fluid size needs numbers: sizes from 0 to 1000 px, viewports from 1 to 4000 px, and two different viewport widths.', 'snn' ),
					'sizeName'         => __( 'Variable name', 'snn' ),
					'sizeNameError'    => __( 'A variable name can use letters, digits and dashes. It must be new.', 'snn' ),
					'newColour'        => __( 'Colour', 'snn' ),
					'remove'           => __( 'Remove', 'snn' ),
					'colourName'       => __( 'Colour name', 'snn' ),
					'colourValue'      => __( 'Colour value', 'snn' ),
					'paletteHint'      => __( 'Each colour is a variable named by its name, for example --black. It is used in every colour field, on the front end and in the editor.', 'snn' ),
					'nameNeeded'       => __( 'Every colour needs a name.', 'snn' ),
					'lengthError'      => __( 'Use a number with a unit, for example 1rem, 16px or 0.', 'snn' ),
					'lineError'        => __( 'Line height must be between 0.8 and 3.', 'snn' ),
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
					'pageNone'         => __( 'Open a page or post in the block editor to style it. Its styles apply to that page only.', 'snn' ),
					'pageLoadError'    => __( 'Could not load the page styles. Reopen the editor and try again.', 'snn' ),
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
