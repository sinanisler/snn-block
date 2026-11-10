<?php
/**
 * The editor's scripts and styles for our blocks: the shared controls, the panel, and each block's editor.js and
 * editor.css. The block files are found by the registry, so a new block's files load without a change here.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class SNN_Block_Editor_Assets {

	/** The WordPress scripts the editor scripts use. Every script of ours gets them, so no block lists its own. */
	const WP_DEPS = array( 'wp-blocks', 'wp-element', 'wp-block-editor', 'wp-components', 'wp-data', 'wp-i18n', 'wp-rich-text', 'wp-api-fetch', 'wp-hooks', 'wp-plugins' );

	/** The handle of the joined editor script (see bundle()). */
	const BUNDLE = 'snn-editor';

	/** The folder in the uploads folder where the joined editor script is kept. */
	const CACHE_DIR = 'snn-block-cache';

	public static function init() {
		add_action( 'enqueue_block_editor_assets', array( __CLASS__, 'enqueue' ) );
		add_filter( 'pre_load_script_translations', array( __CLASS__, 'bundle_translations' ), 10, 4 );
	}

	/**
	 * The shared scripts, in load order: handle => file. The blocks' editor.js files load after 'snn-link-fields' and
	 * before 'snn-layout-blocks', which registers the block types with what each editor.js handed in.
	 */
	private static function scripts() {
		$before = array(
			'snn-core'           => 'includes/block/editor/snn.js',
			'snn-canvas-styles'  => 'includes/block/editor/canvas-styles.js',
			'snn-tooltips'       => 'includes/block/controls/tooltips.js',
			'snn-controls'       => 'includes/block/controls/controls.js',
			'snn-layout-icons'   => 'includes/block/editor/layout-icons.js',
			'snn-style-props'    => 'includes/block/editor/style-props.js',
			'snn-block-tools'    => 'includes/block/controls/block-tools.js',
			'snn-animation-pane' => 'includes/block/controls/animation-pane.js',
			'snn-icon-picker'    => 'includes/block/controls/icon-picker.js',
			'snn-link-fields'    => 'includes/block/controls/link-fields.js',
			// The panel: shared, then the parts that use it in order (each uses the ones before it).
			'snn-panel-shared'        => 'includes/block/editor/panel/shared.js',
			'snn-panel-view'          => 'includes/block/editor/panel/view.js',
			'snn-panel-layout-fields' => 'includes/block/editor/panel/layout-fields.js',
			'snn-panel-query-fields'  => 'includes/block/editor/panel/query-fields.js',
			'snn-panel-css-editor'    => 'includes/block/editor/panel/css-editor.js',
			'snn-panel-style-pages'   => 'includes/block/editor/panel/style-pages.js',
			'snn-panel-panel'         => 'includes/block/editor/panel/panel.js',
		);
		$blocks = array();
		foreach ( array_keys( SNN_Blocks::folders() ) as $folder ) {
			$file = SNN_Blocks::file( $folder, 'editor.js' );
			if ( '' !== $file ) {
				$blocks[ SNN_Blocks::handle( $folder ) . '-editor' ] = $file;
			}
		}
		$after = array(
			'snn-layout-blocks'         => 'includes/block/editor/register.js',
			'snn-block-clipboard'       => 'includes/block/editor/block-clipboard.js',
			'snn-featured-image-search' => 'includes/block/editor/featured-image-search.js',
		);
		return $before + $blocks + $after;
	}

	/** The editor stylesheets: handle => file. Each block's editor.css follows the shared ones. */
	private static function styles() {
		$out = array(
			'snn-controls'       => 'includes/block/controls/controls.css',
			'snn-animation-pane' => 'includes/block/controls/animation-pane.css',
			'snn-icon-picker'    => 'includes/block/controls/icon-picker.css',
		);
		foreach ( array_keys( SNN_Blocks::folders() ) as $folder ) {
			$file = SNN_Blocks::file( $folder, 'editor.css' );
			if ( '' !== $file ) {
				$out[ SNN_Blocks::handle( $folder ) . '-editor' ] = $file;
			}
		}
		return $out;
	}

	/** Every editor script file of the blocks, in load order (the translations builder reads this list too). */
	public static function script_files() {
		return array_values( self::scripts() );
	}

	public static function enqueue() {
		if ( ! current_user_can( 'edit_posts' ) ) {
			return;
		}
		// The media library (wp.media) opens from an image field, such as the background image.
		wp_enqueue_media();
		// The CSS group of the Style tab is a code editor, as in the code snippets. False when the user has syntax
		// highlighting off: the group then shows a plain textarea.
		$css_editor = wp_enqueue_code_editor( array( 'type' => 'text/css' ) );

		$previous = '';
		foreach ( self::styles() as $handle => $file ) {
			wp_enqueue_style( $handle, SNN_URL . $file, $previous ? array( $previous ) : array(), SNN_Block_Tools::version( $file ) );
			$previous = $handle;
		}

		$scripts = self::scripts();
		$deps    = self::WP_DEPS;
		if ( $css_editor ) {
			$deps[] = 'code-editor'; // wp.codeEditor, for the CSS group and the Code block.
		}
		$joined = self::bundle( $scripts );
		if ( $joined ) {
			// One request for every script: the joined file, with the translations of all of them (see bundle_translations()).
			wp_enqueue_script( self::BUNDLE, $joined['url'], $deps, $joined['version'], true );
			wp_set_script_translations( self::BUNDLE, 'snn', SNN_PATH . 'languages' );
			$first = self::BUNDLE;
		} else {
			// No file could be written: the scripts load one after another, each after the one before it.
			$first = 'snn-core';
			foreach ( $scripts as $handle => $file ) {
				wp_enqueue_script( $handle, SNN_URL . $file, $deps, SNN_Block_Tools::version( $file ), true );
				// Each handle has its own translations: languages/snn-<locale>-<handle>.json, made by languages/make-js-translations.php.
				wp_set_script_translations( $handle, 'snn', SNN_PATH . 'languages' );
				$deps = array( $handle );
			}
		}

		// What the scripts read, set before the first of them runs.
		wp_add_inline_script( $first, self::data_script( $css_editor ), 'before' );
	}

	/**
	 * The joined editor script: every script of scripts() in one file, in the same order. The file's name is a key of
	 * the versions of its parts, so a change to any script makes a new file (no build step). Older files are removed.
	 * Returns the URL and the version, or null when the file cannot be written.
	 */
	private static function bundle( array $scripts ) {
		$parts = array();
		foreach ( $scripts as $file ) {
			$parts[] = $file . '@' . SNN_Block_Tools::version( $file );
		}
		$key    = substr( md5( implode( '|', $parts ) ), 0, 12 );
		$name   = 'editor-' . $key . '.js';
		$upload = wp_upload_dir( null, false );
		if ( ! empty( $upload['error'] ) ) {
			return null;
		}
		$dir  = wp_normalize_path( trailingslashit( $upload['basedir'] ) . self::CACHE_DIR );
		$path = $dir . '/' . $name;
		if ( ! file_exists( $path ) ) {
			if ( ! wp_mkdir_p( $dir ) ) {
				return null;
			}
			$code = '';
			foreach ( $scripts as $file ) {
				$source = file_get_contents( SNN_PATH . $file );
				if ( false === $source ) {
					return null;
				}
				$code .= '/* ' . $file . " */\n" . $source . "\n;\n";
			}
			// Written under a temporary name and renamed, so a request never reads half of the file.
			$tmp = $path . '.' . wp_generate_password( 8, false ) . '.tmp';
			if ( false === file_put_contents( $tmp, $code ) || ! rename( $tmp, $path ) ) {
				@unlink( $tmp ); // phpcs:ignore WordPress.PHP.NoSilencedErrors.Discouraged
				return null;
			}
			foreach ( (array) glob( $dir . '/editor-*.js' ) as $old ) {
				if ( wp_normalize_path( $old ) !== $path ) {
					unlink( $old );
				}
			}
		}
		return array(
			'url'     => trailingslashit( $upload['baseurl'] ) . self::CACHE_DIR . '/' . $name,
			'version' => $key,
		);
	}

	/**
	 * The translations of the joined script: the messages of each script's own file (languages/snn-<locale>-<handle>.json),
	 * in one file. WordPress reads one file per handle, so the joined handle takes the others' messages from here.
	 */
	public static function bundle_translations( $json, $file, $handle, $domain ) {
		if ( self::BUNDLE !== $handle || null !== $json ) {
			return $json;
		}
		$locale   = determine_locale();
		$messages = array();
		foreach ( array_keys( self::scripts() ) as $part ) {
			$path = SNN_PATH . 'languages/' . $domain . '-' . $locale . '-' . $part . '.json';
			if ( ! is_readable( $path ) ) {
				continue;
			}
			$data = json_decode( (string) file_get_contents( $path ), true );
			if ( isset( $data['locale_data']['messages'] ) && is_array( $data['locale_data']['messages'] ) ) {
				// The union, not array_merge(): a numeric msgid must keep its key.
				$messages = $messages + $data['locale_data']['messages'];
			}
		}
		if ( ! $messages ) {
			return null;
		}
		return wp_json_encode(
			array(
				'domain'      => $domain,
				'locale_data' => array( 'messages' => $messages ),
			)
		);
	}

	/** The data of the editor scripts, as one script: each line sets one of the globals they read. */
	private static function data_script( $css_editor ) {
		$lists = 'includes/block/icons/icon-lists.json';
		// Each block's own data, from its class (editor_data()), keyed by its folder.
		$block_data = array();
		foreach ( SNN_Blocks::folders() as $folder => $class ) {
			$own = call_user_func( array( $class, 'editor_data' ) );
			if ( $own ) {
				$block_data[ $folder ] = $own;
			}
		}
		$data = array(
			'controls'               => array(
				'dynamic'    => SNN_Dynamic_Data::for_editor(),
				'variables'  => self::variables(),
				'postTypes'  => SNN_Query_Loop::post_type_options(),
				'taxonomies' => SNN_Query_Loop::taxonomy_options(),
				'animations' => SNN_Animation::options(),
				'cssEditor'  => $css_editor,
				'orderBy'    => SNN_Query_Loop::order_by_options(),
				'tags'       => SNN_Blocks::TAGS,
			),
			'breakpoints'            => SNN_Style::view_widths(),
			'animation'              => SNN_Animation::editor_data(),
			'blockTools'             => SNN_Block_Tools::editor_data(),
			'styleTable'             => SNN_Style_Props::for_editor(),
			'icon'                   => array( 'listsUrl' => add_query_arg( 'ver', SNN_Block_Tools::version( $lists ), SNN_URL . $lists ) ),
			'blocks'                 => (object) $block_data,
			// The block definitions, read by the editor script before it registers the blocks.
			'definitions'            => self::definitions(),
		);
		// One object on window.snn.data: the namespace the editor scripts read (editor/snn.js adds to it).
		return 'window.snn = window.snn || {}; window.snn.data = ' . wp_json_encode( $data, JSON_HEX_TAG ) . ';';
	}

	/** The definitions as the editor reads them: each with its own attributes. */
	private static function definitions() {
		$out = array();
		foreach ( SNN_Blocks::definitions() as $name => $def ) {
			unset( $def['class'] );
			$def['attributes'] = SNN_Blocks::attributes( $name );
			// The block's style.css, which the canvas loads when it draws the block (editor/canvas-styles.js).
			$def['styleUrl']   = SNN_Blocks::style_url( $def['folder'] );
			$out[]             = $def;
		}
		return $out;
	}

	/**
	 * The variables the V button offers, from Global Styles: colours and sizes, as plain variables (--black, --size-20).
	 * Each group has a kind, 'color' or 'size', so the picker can show the groups of the field's kind first (see controls.js).
	 */
	public static function variables() {
		$v      = SNN_Global_Styles::get_values();
		$colors = array();
		foreach ( $v['colors'] as $c ) {
			$colors[] = array(
				'label' => $c['slug'],
				'value' => 'var(--' . $c['slug'] . ')',
				'color' => $c['color'], // a swatch in the picker
			);
		}
		$sizes = array();
		foreach ( $v['sizes'] as $slug => $size ) {
			$sizes[] = array(
				'label' => $slug,
				'value' => 'var(--' . $slug . ')',
			);
		}
		$groups = array();
		if ( $colors ) {
			$groups[] = array(
				'key'   => 'color',
				'label' => __( 'Colours', 'snn' ),
				'kind'  => 'color',
				'items' => $colors,
			);
		}
		if ( $sizes ) {
			$groups[] = array(
				'key'   => 'size',
				'label' => __( 'Sizes', 'snn' ),
				'kind'  => 'size',
				'items' => $sizes,
			);
		}
		return $groups;
	}
}
