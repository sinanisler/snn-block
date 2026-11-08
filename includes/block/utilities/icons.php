<?php
/**
 * Icons: the icon libraries (Font Awesome Free 6 Solid, Regular and Brands, Ionicons 4, Themify) and SVG, shared by
 * every block that shows an icon (Button and Icon today). An icon value is an array:
 *
 *   array( 'library' => 'fontawesome-solid', 'name' => 'fa-star' )   a font icon, by its class name
 *   array( 'library' => 'svg', 'svg' => '<svg ...>...</svg>' )      an SVG written or pasted in
 *   array( 'library' => 'svg', 'svgId' => 123 )                     an SVG file from the media library
 *
 * The fonts and their stylesheets are in ../assets/icons (see LICENSES.md there). A library's stylesheet is loaded on
 * a page only when an icon of that library is printed. The editor loads all of them, for the picker
 * (../controls/icon-picker.js) and the canvas.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class SNN_Icons {

	/** The libraries: the stylesheet each one needs, and the class written before the icon name. */
	const LIBRARIES = array(
		'fontawesome-solid'   => array( 'styles' => array( 'snn-icons-fontawesome' ), 'prefix' => 'fa-solid' ),
		'fontawesome-regular' => array( 'styles' => array( 'snn-icons-fontawesome' ), 'prefix' => 'fa-regular' ),
		'fontawesome-brands'  => array( 'styles' => array( 'snn-icons-fontawesome', 'snn-icons-fontawesome-brands' ), 'prefix' => 'fa-brands' ),
		'ionicons'            => array( 'styles' => array( 'snn-icons-ionicons' ), 'prefix' => '' ),
		'themify'             => array( 'styles' => array( 'snn-icons-themify' ), 'prefix' => '' ),
		'svg'                 => array( 'styles' => array(), 'prefix' => '' ),
	);

	/** An icon's class name: letters, digits and dashes, as every library writes them (fa-star, ion-ios-add, ti-star). */
	const NAME = '/^[a-z0-9][a-z0-9-]{0,80}$/';

	/** The largest SVG kept, in bytes. */
	const MAX_SVG = 200000;

	public static function init() {
		add_action( 'init', array( __CLASS__, 'register_styles' ) );
		// The canvas is an iframe: its stylesheets come from enqueue_block_assets. The front end loads only what it prints.
		add_action( 'enqueue_block_assets', array( __CLASS__, 'enqueue_in_editor' ) );
		add_action( 'enqueue_block_editor_assets', array( __CLASS__, 'enqueue_all' ) );
	}

	/** The library stylesheets, and the small base sheet every icon uses (an SVG icon is 1em square). */
	public static function register_styles() {
		$dir = 'includes/block/assets/icons/';
		$files = array(
			'snn-icons-base'               => $dir . 'icons.css',
			'snn-icons-fontawesome'        => $dir . 'css/font-awesome-6.min.css',
			'snn-icons-fontawesome-brands' => $dir . 'css/font-awesome-6-brands.min.css',
			'snn-icons-ionicons'           => $dir . 'css/ionicons.min.css',
			'snn-icons-themify'            => $dir . 'css/themify-icons.min.css',
		);
		foreach ( $files as $handle => $file ) {
			wp_register_style( $handle, SNN_URL . $file, array(), SNN_Block_Tools::version( $file ) );
		}
	}

	/** Every library, in the editor. */
	public static function enqueue_all() {
		wp_enqueue_style( 'snn-icons-base' );
		foreach ( self::LIBRARIES as $lib ) {
			foreach ( $lib['styles'] as $handle ) {
				wp_enqueue_style( $handle );
			}
		}
	}

	/** enqueue_block_assets runs on the front end too: there, the libraries load only with an icon (see html()). */
	public static function enqueue_in_editor() {
		if ( is_admin() ) {
			self::enqueue_all();
		}
	}

	/** The library names, for the editor. */
	public static function libraries() {
		return array_keys( self::LIBRARIES );
	}

	/** An icon value, cleaned. An empty array means no icon. */
	public static function clean( $icon ) {
		if ( ! is_array( $icon ) ) {
			return array();
		}
		$library = isset( $icon['library'] ) && is_string( $icon['library'] ) ? $icon['library'] : '';
		if ( ! isset( self::LIBRARIES[ $library ] ) ) {
			return array();
		}
		if ( 'svg' === $library ) {
			$id  = isset( $icon['svgId'] ) ? absint( $icon['svgId'] ) : 0;
			$svg = isset( $icon['svg'] ) && is_string( $icon['svg'] ) ? trim( $icon['svg'] ) : '';
			if ( $id ) {
				return array( 'library' => 'svg', 'svgId' => $id );
			}
			if ( '' !== $svg && strlen( $svg ) <= self::MAX_SVG && false !== stripos( $svg, '<svg' ) ) {
				return array( 'library' => 'svg', 'svg' => $svg );
			}
			return array();
		}
		$name = isset( $icon['name'] ) && is_string( $icon['name'] ) ? strtolower( trim( $icon['name'] ) ) : '';
		if ( ! preg_match( self::NAME, $name ) ) {
			return array();
		}
		return array( 'library' => $library, 'name' => $name );
	}

	/** The class list of a font icon: the library's prefix and the name (fa-solid fa-star, ti-star). */
	public static function font_class( array $icon ) {
		$prefix = self::LIBRARIES[ $icon['library'] ]['prefix'] ?? '';
		return trim( $prefix . ' ' . $icon['name'] );
	}

	/**
	 * The icon's HTML: an <i> for a font icon, or the SVG itself. Its library stylesheet is queued for the page. An SVG
	 * is printed as it was written: only users who may post unfiltered HTML can save one (WordPress filters the block
	 * attributes of everyone else on save). $style is a checked inline style for the icon (its size and colour).
	 * Empty when there is no icon.
	 */
	public static function html( $icon, $style = '' ) {
		$icon = self::clean( $icon );
		if ( ! $icon ) {
			return '';
		}
		wp_enqueue_style( 'snn-icons-base' );
		$style_attr = '' !== $style ? ' style="' . esc_attr( $style ) . '"' : '';
		if ( 'svg' === $icon['library'] ) {
			$svg = isset( $icon['svgId'] ) ? self::svg_file( $icon['svgId'] ) : $icon['svg'];
			$svg = self::add_class( $svg, 'snn-icon' );
			return '' !== $svg && '' !== $style_attr ? preg_replace( '/<svg\b/i', '<svg' . $style_attr, $svg, 1 ) : $svg;
		}
		foreach ( self::LIBRARIES[ $icon['library'] ]['styles'] as $handle ) {
			wp_enqueue_style( $handle );
		}
		return '<i class="snn-icon ' . esc_attr( self::font_class( $icon ) ) . '"' . $style_attr . ' aria-hidden="true"></i>';
	}

	/** The inline style of an icon: its size (a length or a variable) and its colour (also its SVG fill). */
	public static function style( $size, $color ) {
		$css  = array();
		$size = SNN_Layout_Blocks::size_value( $size );
		if ( '' !== $size ) {
			$css[] = 'font-size:' . $size;
		}
		$color = SNN_Layout_Blocks::color( $color );
		if ( '' !== $color ) {
			$css[] = 'color:' . $color;
			$css[] = 'fill:' . $color;
		}
		return implode( ';', $css );
	}

	/** The markup of an SVG file in the media library, or '' when the attachment is not an SVG. */
	private static function svg_file( $id ) {
		if ( 'image/svg+xml' !== get_post_mime_type( $id ) ) {
			return '';
		}
		$path = get_attached_file( $id );
		if ( ! $path || ! is_readable( $path ) || filesize( $path ) > self::MAX_SVG ) {
			return '';
		}
		$svg = (string) file_get_contents( $path );
		// The XML declaration and a doctype are not allowed inside HTML.
		$svg = preg_replace( '/^\s*<\?xml[^>]*>\s*|<!DOCTYPE[^>]*>\s*/i', '', $svg );
		return false !== stripos( $svg, '<svg' ) ? trim( $svg ) : '';
	}

	/** The SVG with a class added to its root element. */
	private static function add_class( $svg, $class ) {
		if ( '' === $svg ) {
			return '';
		}
		if ( preg_match( '/<svg\b[^>]*\sclass\s*=\s*("|\')/i', $svg ) ) {
			return preg_replace( '/(<svg\b[^>]*\sclass\s*=\s*("|\'))/i', '$1' . $class . ' ', $svg, 1 );
		}
		return preg_replace( '/<svg\b/i', '<svg class="' . $class . '"', $svg, 1 );
	}
}

SNN_Icons::init();
