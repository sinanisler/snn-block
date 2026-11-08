<?php
/**
 * Button (snn/button): the text, the link and the icon, as the Bricks button element: Text, HTML tag (when there is
 * no link), Link, and Icon with its position, gap, space between, size and colour. Bricks' Size, Style, Circle and
 * Outline come from its theme styles; here the Style tab does that job.
 *
 * The engine (../../layout-blocks.php) calls attributes(), clean(), element() and render(). The editor's canvas
 * (button-editor.js) draws the same button: keep the two in step.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class SNN_Button_Block {

	/** The tags without a link. With a link the element is an a. */
	const TAGS = array( 'span', 'button', 'div', 'a' );

	const ICON_POSITION = array( 'right', 'left' );

	public static function init() {
		add_action( 'init', array( __CLASS__, 'register_style' ) );
		add_action( 'enqueue_block_assets', array( __CLASS__, 'enqueue_in_editor' ) );
	}

	/** The look a new button starts with (button.css). Every rule is in :where(), so any Style setting wins. */
	public static function register_style() {
		$file = 'includes/block/blocks/button/button.css';
		wp_register_style( 'snn-button', SNN_URL . $file, array(), SNN_Block_Tools::version( $file ) );
	}

	public static function enqueue_in_editor() {
		if ( is_admin() ) {
			wp_enqueue_style( 'snn-button' );
		}
	}

	public static function attributes() {
		return array(
			'text'         => array( 'type' => 'string', 'default' => 'Button' ),
			'icon'         => array( 'type' => 'object', 'default' => array() ),
			'iconPosition' => array( 'type' => 'string', 'default' => 'right' ),
			'iconGap'      => array( 'type' => 'string', 'default' => '' ),
			'iconSpace'    => array( 'type' => 'boolean', 'default' => false ),
			'iconSize'     => array( 'type' => 'string', 'default' => '' ),
			'iconColor'    => array( 'type' => 'string', 'default' => '' ),
		) + SNN_Block_Link::attributes();
	}

	public static function clean( $raw ) {
		$raw = is_array( $raw ) ? $raw : array();
		$out = array(
			'text'         => is_string( $raw['text'] ?? null ) ? $raw['text'] : 'Button',
			'icon'         => SNN_Icons::clean( $raw['icon'] ?? array() ),
			'iconPosition' => in_array( $raw['iconPosition'] ?? '', self::ICON_POSITION, true ) ? $raw['iconPosition'] : 'right',
			'iconGap'      => is_scalar( $raw['iconGap'] ?? '' ) ? (string) ( $raw['iconGap'] ?? '' ) : '',
			'iconSpace'    => true === ( $raw['iconSpace'] ?? false ),
			'iconSize'     => is_scalar( $raw['iconSize'] ?? '' ) ? (string) ( $raw['iconSize'] ?? '' ) : '',
			'iconColor'    => is_scalar( $raw['iconColor'] ?? '' ) ? (string) ( $raw['iconColor'] ?? '' ) : '',
		);
		return $out + SNN_Block_Link::clean( $raw );
	}

	/**
	 * What the engine changes on the element: the tag (a with a link, and never a without one), the link attributes,
	 * and the gap and space between of the icon.
	 */
	public static function element( array $a, array $dyn ) {
		wp_enqueue_style( 'snn-button' );
		$link  = SNN_Block_Link::element_attrs( $a, $dyn );
		$tag   = $link ? 'a' : ( 'a' === $a['tagName'] ? 'span' : $a['tagName'] );
		$attrs = $link ? $link : array();
		if ( 'button' === $tag ) {
			$attrs['type'] = 'button';
		}
		$css = array();
		if ( $a['icon'] ) {
			$gap = SNN_Layout_Blocks::size_value( SNN_Dynamic_Data::render( $a['iconGap'], $dyn, 'plain' ) );
			if ( '' !== $gap ) {
				$css[] = 'gap:' . $gap;
			}
			if ( $a['iconSpace'] ) {
				$css[] = 'justify-content:space-between';
			}
		}
		return array( 'tag' => $tag, 'attrs' => $attrs, 'style' => $css );
	}

	/** The text (tags filled in, the formats wp_kses_post allows) and the icon on its side. */
	public static function render( array $a, array $dyn ) {
		$text = '' !== $a['text'] ? '<span class="snn-button-text">' . wp_kses_post( SNN_Dynamic_Data::render( $a['text'], $dyn, 'html' ) ) . '</span>' : '';
		$icon = SNN_Icons::html( $a['icon'], SNN_Icons::style( $a['iconSize'], $a['iconColor'] ) );
		return 'left' === $a['iconPosition'] ? $icon . $text : $text . $icon;
	}
}

SNN_Button_Block::init();
