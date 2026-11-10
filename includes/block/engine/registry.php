<?php
/**
 * The registry: finds the blocks, and registers each with WordPress.
 *
 * A block is a folder in blocks/ with a block.php that declares its class (see block.php in this folder for the
 * class, and blocks/_template for a folder to copy). Nothing else lists the blocks: the requires, the block types,
 * the editor scripts, the styles and the translations all come from what is found here. A folder whose name starts
 * with an underscore is not a block.
 *
 * The files of a block folder, by fixed name (each is used when it exists):
 *
 *   block.php    the class: definition, attributes, clean, element, render
 *   editor.js    the editor side: its Content tab (Pane) and its canvas (Canvas); never loaded for visitors
 *   style.css    the block's look, on the front end and on the editor's canvas
 *   front.js     front-end behaviour, loaded on pages where the block is printed
 *   editor.css   editor-only styling
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class SNN_Blocks {

	/** The tags the HTML tag field offers when a block names none. */
	const TAGS = array( 'section', 'div', 'header', 'footer', 'main', 'article', 'aside', 'nav' );

	/** The context keys a query loop passes down: the post, its index and the total found. */
	const CONTEXT_POST  = 'snn/postId';
	const CONTEXT_INDEX = 'snn/queryIndex';
	const CONTEXT_COUNT = 'snn/queryCount';

	/** The block folder names => class names, once found (see load()). */
	private static $classes = array();

	/** The definitions, once read (see definitions()). Keyed by block name. */
	private static $definitions = null;

	public static function init() {
		self::load();
		add_action( 'init', array( __CLASS__, 'register' ) );
		add_action( 'init', array( __CLASS__, 'register_assets' ) );
	}

	/** The blocks folder, with a trailing slash. */
	public static function dir() {
		return dirname( __DIR__ ) . '/blocks/';
	}

	/** The class of a folder: button is SNN_Button_Block, post-title is SNN_Post_Title_Block. */
	public static function class_name( $folder ) {
		return 'SNN_' . str_replace( ' ', '_', ucwords( str_replace( array( '-', '_' ), ' ', $folder ) ) ) . '_Block';
	}

	/** Loads every blocks/<folder>/block.php and keeps the folders whose class is a block. Only classes are declared here. */
	private static function load() {
		$files = glob( self::dir() . '*/block.php' );
		foreach ( is_array( $files ) ? $files : array() as $file ) {
			$folder = basename( dirname( $file ) );
			if ( '_' === $folder[0] ) {
				continue;
			}
			require_once $file;
			$class = self::class_name( $folder );
			if ( class_exists( $class ) && is_subclass_of( $class, 'SNN_Block' ) ) {
				self::$classes[ $folder ] = $class;
			}
		}
	}

	/**
	 * The definitions, keyed by block name, in the order of their 'order' (then by name). Read once, at init or later:
	 * a definition has translated text.
	 */
	public static function definitions() {
		if ( null === self::$definitions ) {
			$all = array();
			foreach ( self::$classes as $folder => $class ) {
				$def = self::normalise( call_user_func( array( $class, 'definition' ) ), $folder, $class );
				if ( $def ) {
					// The block's own attributes, for the editor (read here, not through definition(), which needs this list).
					$def['attributes'] = (array) call_user_func( array( $class, 'attributes' ) );
					$all[ $def['name'] ] = $def;
				}
			}
			uasort(
				$all,
				function ( $x, $y ) {
					return array( $x['order'], $x['name'] ) <=> array( $y['order'], $y['name'] );
				}
			);
			self::$definitions = $all;
		}
		return self::$definitions;
	}

	/** A definition with every key set. Null when it has no name. */
	private static function normalise( $def, $folder, $class ) {
		if ( ! is_array( $def ) || empty( $def['name'] ) ) {
			return null;
		}
		$def += array(
			'title'    => $def['name'],
			'tag'      => 'div',
			'tags'     => self::TAGS,
			'icon'     => 'block-default',
			'category' => 'design',
			'order'    => 100,
			'layout'   => array(),
			'supports' => array(),
		);
		$def['layout']  += array(
			'display'       => 'block',
			'flexDirection' => 'row',
		);
		$def['supports'] += array(
			'children' => false,
			'loop'     => false,
			'link'     => false,
			'style'    => true,
		);
		// A block that can be a link offers the a tag as well.
		if ( $def['supports']['link'] && ! in_array( 'a', $def['tags'], true ) ) {
			$def['tags'][] = 'a';
		}
		$def['folder'] = $folder;
		$def['class']  = $class;
		return $def;
	}

	/** One block's definition. A name that is not a block gets the Div definition, as an unknown block always did. */
	public static function definition( $name ) {
		$all = self::definitions();
		return $all[ $name ] ?? $all['snn/div'];
	}

	/** The class of a block, by its name. */
	public static function class_of( $name ) {
		return self::definition( $name )['class'];
	}

	/** True when the block has that support (children, loop, link). */
	public static function supports( $name, $feature ) {
		return ! empty( self::definition( $name )['supports'][ $feature ] );
	}

	/** wp-block-snn-section for snn/section. The theme's block defaults are written against it. */
	public static function block_class( $name ) {
		return 'wp-block-' . str_replace( '/', '-', $name );
	}

	public static function register() {
		foreach ( array_keys( self::definitions() ) as $name ) {
			register_block_type(
				$name,
				array(
					'attributes'      => self::attributes( $name ),
					'render_callback' => array( 'SNN_Block_Render', 'render' ),
					// A loop passes its post and index to the blocks inside it, down the tree.
					'uses_context'    => array( self::CONTEXT_POST, self::CONTEXT_INDEX, self::CONTEXT_COUNT ),
					// The core panels are off: our own inspector has these settings.
					'supports'        => array(
						'html'            => false,
						'anchor'          => false,
						'className'       => false,
						'customClassName' => false,
						'color'           => false,
						'spacing'         => false,
						'dimensions'      => false,
						'typography'      => false,
						'layout'          => false,
						'background'      => false,
						'border'          => false,
						'shadow'          => false,
						'position'        => false,
					),
				)
			);
		}
	}

	/* ------------------------------------------------------------------
	 * Attributes
	 * ---------------------------------------------------------------- */

	/** The attributes every block has. The editor gets the same names and defaults (see SNN_Block_Editor_Assets). */
	private static function shared_attributes( array $def ) {
		$out = array(
			'tagName'          => array( 'type' => 'string', 'default' => $def['tag'] ),
			'htmlId'           => array( 'type' => 'string', 'default' => '' ),
			'cssClasses'       => array( 'type' => 'string', 'default' => '' ),
			'display'          => array( 'type' => 'string', 'default' => $def['layout']['display'] ),
			'flexDirection'    => array( 'type' => 'string', 'default' => $def['layout']['flexDirection'] ),
			'flexWrap'         => array( 'type' => 'string', 'default' => 'nowrap' ),
			'justifyContent'   => array( 'type' => 'string', 'default' => '' ),
			'alignItems'       => array( 'type' => 'string', 'default' => '' ),
			'gap'              => array( 'type' => 'string', 'default' => '' ),
			'columnGap'        => array( 'type' => 'string', 'default' => '' ),
			'rowGap'           => array( 'type' => 'string', 'default' => '' ),
			'gridColumns'      => array( 'type' => 'string', 'default' => '' ),
			'gridRows'         => array( 'type' => 'string', 'default' => '' ),
			'gridAutoFlow'     => array( 'type' => 'string', 'default' => 'row' ),
			'gridDense'        => array( 'type' => 'boolean', 'default' => false ),
			'justifyItems'     => array( 'type' => 'string', 'default' => '' ),
			'alignContent'     => array( 'type' => 'string', 'default' => '' ),
			'alignSelf'        => array( 'type' => 'string', 'default' => '' ),
			'justifySelf'      => array( 'type' => 'string', 'default' => '' ),
			'flexGrow'         => array( 'type' => 'string', 'default' => '' ),
			'flexShrink'       => array( 'type' => 'string', 'default' => '' ),
			'flexBasis'        => array( 'type' => 'string', 'default' => '' ),
			'columnSpan'       => array( 'type' => 'string', 'default' => '' ),
			'rowSpan'          => array( 'type' => 'string', 'default' => '' ),
			'columnStart'      => array( 'type' => 'string', 'default' => '' ),
			'rowStart'         => array( 'type' => 'string', 'default' => '' ),
			'gridArea'         => array( 'type' => 'string', 'default' => '' ),
			'gridAreas'        => array( 'type' => 'string', 'default' => '' ),
			'gridAutoColumns'  => array( 'type' => 'string', 'default' => '' ),
			'gridAutoRows'     => array( 'type' => 'string', 'default' => '' ),
			'order'            => array( 'type' => 'string', 'default' => '' ),
			'backgroundColor'  => array( 'type' => 'string', 'default' => '' ),
			'paddingTop'       => array( 'type' => 'string', 'default' => '' ),
			'paddingBottom'    => array( 'type' => 'string', 'default' => '' ),
			'maxWidth'         => array( 'type' => 'string', 'default' => '' ),
			'opacity'          => array( 'type' => 'string', 'default' => '' ),
			'overflow'         => array( 'type' => 'string', 'default' => '' ),
			// The values a view sets for itself: responsive = array( 'tablet' => array( 'gap' => '16' ), 'mobile' => ... ).
			'responsive'       => array( 'type' => 'object', 'default' => array() ),
			'conditions'       => array( 'type' => 'array', 'default' => array() ),
			'interactions'     => array( 'type' => 'array', 'default' => array() ),
			'animation'        => array( 'type' => 'array', 'default' => array() ),
			// The GSAP timeline of the pane: tweens (start, duration, stagger, ease, from and to) and the Scroll Trigger.
			'gsapTweens'       => array( 'type' => 'array', 'default' => array() ),
			'gsapScroll'       => array( 'type' => 'object', 'default' => array() ),
			'customCss'        => array( 'type' => 'string', 'default' => '' ),
			'customAttributes' => array( 'type' => 'array', 'default' => array() ),
		);
		// Every block can be printed once per post: a stored query renders on any block, as it always has. The panel
		// offers the Query group only where supports.loop is set.
		$out['query'] = array( 'type' => 'object', 'default' => SNN_Query_Loop::defaults() );
		return $out;
	}

	/** The block's own attributes: its class's, and the link settings of a block that can be a link. */
	public static function own_attributes( $name ) {
		$def = self::definition( $name );
		$own = (array) call_user_func( array( $def['class'], 'attributes' ) );
		return $def['supports']['link'] ? $own + SNN_Block_Link::attributes() : $own;
	}

	/** The attributes of one block: the shared ones, the Style properties, then its own. */
	public static function attributes( $name ) {
		return self::shared_attributes( self::definition( $name ) ) + SNN_Style_Props::attributes() + self::own_attributes( $name );
	}

	/** The attributes, cleaned: right type, allowed values, defaults for anything missing. */
	public static function clean( $attributes, $name ) {
		$attributes = is_array( $attributes ) ? $attributes : array();
		$block      = isset( self::definitions()[ $name ] ) ? $name : 'snn/div';
		$def        = self::definition( $block );
		$defaults   = self::attributes( $block );

		$out = array();
		foreach ( $defaults as $key => $spec ) {
			$out[ $key ] = $attributes[ $key ] ?? $spec['default'];
		}

		$out['tagName']        = in_array( $out['tagName'], $def['tags'], true ) ? $out['tagName'] : $def['tag'];
		$out['display']        = self::pick( $out['display'], SNN_Style::DISPLAYS, $def['layout']['display'] );
		$out['flexDirection']  = self::pick( $out['flexDirection'], SNN_Style::FLEX_DIRECTION, $def['layout']['flexDirection'] );
		$out['flexWrap']       = self::pick( $out['flexWrap'], SNN_Style::FLEX_WRAP, 'nowrap' );
		$out['justifyContent'] = self::pick( $out['justifyContent'], SNN_Style::JUSTIFY, '' );
		$out['alignItems']     = self::pick( $out['alignItems'], SNN_Style::ALIGN, '' );
		$out['gridAutoFlow']   = self::pick( $out['gridAutoFlow'], SNN_Style::GRID_FLOW, 'row' );
		$out['gridDense']      = true === $out['gridDense'] || 1 === $out['gridDense'] || 'true' === $out['gridDense'];
		$out['justifyItems']   = self::pick( $out['justifyItems'], SNN_Style::JUSTIFY_ITEMS, '' );
		$out['alignContent']   = self::pick( $out['alignContent'], SNN_Style::ALIGN_CONTENT, '' );
		$out['alignSelf']      = self::pick( $out['alignSelf'], SNN_Style::ALIGN_SELF, '' );
		$out['justifySelf']    = self::pick( $out['justifySelf'], SNN_Style::JUSTIFY_SELF, '' );
		// The text values: the table's (every layout and Style value, except the boolean grid dense) and the ID and classes.
		foreach ( array_merge( array( 'htmlId', 'cssClasses' ), SNN_Style_Props::keys() ) as $key ) {
			if ( 'gridDense' !== $key ) {
				$out[ $key ] = is_scalar( $out[ $key ] ) ? (string) $out[ $key ] : '';
			}
		}
		$out['animation']        = SNN_Animation::clean_tokens( $out['animation'] );
		$out['gsapTweens']       = SNN_Animation::clean_tweens( $out['gsapTweens'] );
		$out['gsapScroll']       = SNN_Animation::clean_scroll( $out['gsapScroll'] );
		$out['customCss']        = SNN_Style::clean_css( $out['customCss'] );
		$out['customAttributes'] = self::clean_attributes( $out['customAttributes'] );
		$out['responsive']       = SNN_Style::clean_responsive( $out['responsive'] );
		$out['conditions']       = SNN_Block_Tools::sanitize_conditions( $out['conditions'] );
		$out['interactions']     = SNN_Block_Tools::sanitize_interactions( $out['interactions'] );
		$out['query'] = SNN_Query_Loop::sanitize( $out['query'] );
		// The block's own settings, cleaned by its class.
		$out = array_merge( $out, (array) call_user_func( array( $def['class'], 'clean' ), $attributes ) );
		if ( $def['supports']['link'] ) {
			$out = array_merge( $out, SNN_Block_Link::clean( $attributes ) );
		}
		return $out;
	}

	/**
	 * Custom attributes: up to 20 rows of name and value. A name is a plain name, or data- or aria-; an event
	 * handler (on...), class, id and style are left out, so the attributes cannot change the block's own look
	 * or run script.
	 */
	public static function clean_attributes( $value ) {
		$out  = array();
		$rows = is_array( $value ) ? array_slice( array_values( $value ), 0, 20 ) : array();
		foreach ( $rows as $row ) {
			if ( ! is_array( $row ) || ! isset( $row['name'] ) || ! is_string( $row['name'] ) ) {
				continue;
			}
			$name = strtolower( trim( $row['name'] ) );
			if ( ! preg_match( '/^(data-|aria-)?[a-z][a-z0-9_-]{0,58}$/', $name ) || 0 === strpos( $name, 'on' ) || in_array( $name, array( 'class', 'id', 'style' ), true ) ) {
				continue;
			}
			$out[] = array(
				'name'  => $name,
				'value' => isset( $row['value'] ) && is_scalar( $row['value'] ) ? substr( sanitize_text_field( (string) $row['value'] ), 0, 300 ) : '',
			);
		}
		return $out;
	}

	private static function pick( $value, array $allowed, $default ) {
		return is_string( $value ) && in_array( $value, $allowed, true ) ? $value : $default;
	}

	/* ------------------------------------------------------------------
	 * The files of a block folder
	 * ---------------------------------------------------------------- */

	/** The path of one of a block's files from the theme folder (for a URL or a version), or '' when the folder has none. */
	public static function file( $folder, $file ) {
		$path = 'includes/block/blocks/' . $folder . '/' . $file;
		return file_exists( SNN_PATH . $path ) ? $path : '';
	}

	/** The handle of a block's style.css (snn-block-button) or front.js (snn-block-button-front). */
	public static function handle( $folder, $front = false ) {
		return 'snn-block-' . $folder . ( $front ? '-front' : '' );
	}

	/** Registers each block's style.css and front.js. They are enqueued where the block is printed (SNN_Block_Render). */
	public static function register_assets() {
		foreach ( self::$classes as $folder => $class ) {
			$css = self::file( $folder, 'style.css' );
			if ( '' !== $css ) {
				wp_register_style( self::handle( $folder ), SNN_URL . $css, array(), SNN_Block_Tools::version( $css ) );
			}
			$js = self::file( $folder, 'front.js' );
			if ( '' !== $js ) {
				wp_register_script( self::handle( $folder, true ), SNN_URL . $js, array(), SNN_Block_Tools::version( $js ), true );
			}
		}
	}

	/**
	 * The URL of a block's style.css, or '' when it has none. The editor's canvas loads it for each block of that type
	 * when the block is drawn there (editor/canvas-styles.js), so the canvas never loads the style of a block it does not show.
	 */
	public static function style_url( $folder ) {
		$css = self::file( $folder, 'style.css' );
		return '' === $css ? '' : SNN_URL . $css . '?ver=' . SNN_Block_Tools::version( $css );
	}

	/** The block folders found, as folder => class. */
	public static function folders() {
		return self::$classes;
	}
}
