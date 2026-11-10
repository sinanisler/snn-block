<?php
/**
 * Button (snn/button): the text, the link and the icon, as the Bricks button element: Text, HTML tag (when there is
 * no link), Link, and Icon with its position, gap, space between, size and colour. Bricks' Size, Style, Circle and
 * Outline come from its theme styles; here the Style tab does that job.
 *
 * The look a new button starts with is style.css in this folder (every rule in :where(), so any Style setting wins).
 * The editor's canvas (editor.js) draws the same button: keep the two in step.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class SNN_Button_Block extends SNN_Block {

	/** The tags without a link. With a link the element is an a. */
	const TAGS = array( 'span', 'button', 'div', 'a' );

	const ICON_POSITION = array( 'right', 'left' );

	public static function definition() {
		return array(
			'name'   => 'snn/button',
			'title'  => __( 'Button', 'snn' ),
			'tag'    => 'span',
			'tags'   => self::TAGS,
			'icon'   => 'button',
			'order'  => 60,
			'kind'   => 'button',
			// The text and the icon sit in a row, centred on each other.
			'layout' => array(
				'display'       => 'inline-flex',
				'flexDirection' => 'row',
			),
		);
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
		$link  = SNN_Block_Link::element_attrs( $a, $dyn );
		$tag   = $link ? 'a' : ( 'a' === $a['tagName'] ? 'span' : $a['tagName'] );
		$attrs = $link ? $link : array();
		if ( 'button' === $tag ) {
			$attrs['type'] = 'button';
		}
		$css = array();
		if ( $a['icon'] ) {
			$gap = SNN_Style::size_value( SNN_Dynamic_Data::render( $a['iconGap'], $dyn, 'plain' ) );
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
