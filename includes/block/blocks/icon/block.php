<?php
/**
 * Icon (snn/icon): the icon, its colour and size, and a link, as the Bricks icon element. With a link the element is
 * an a. The editor's canvas (editor.js)
 * draws the same icon.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class SNN_Icon_Block extends SNN_Block {

	const TAGS = array( 'span', 'div', 'a' );

	/** The icon a new block starts with, as in Bricks. */
	const DEFAULT_ICON = array(
		'library' => 'themify',
		'name'    => 'ti-star',
	);

	public static function definition() {
		return array(
			'name'   => 'snn/icon',
			'title'  => __( 'Icon', 'snn' ),
			'tag'    => 'span',
			'tags'   => self::TAGS,
			'icon'   => 'star-filled',
			'order'  => 70,
			'kind'   => 'icon',
			'layout' => array(
				'display'       => 'inline-flex',
				'flexDirection' => 'row',
			),
		);
	}

	public static function attributes() {
		return array(
			'icon'      => array( 'type' => 'object', 'default' => self::DEFAULT_ICON ),
			'iconSize'  => array( 'type' => 'string', 'default' => '' ),
			'iconColor' => array( 'type' => 'string', 'default' => '' ),
		) + SNN_Block_Link::attributes();
	}

	public static function clean( $raw ) {
		$raw = is_array( $raw ) ? $raw : array();
		return array(
			'icon'      => SNN_Icons::clean( $raw['icon'] ?? self::DEFAULT_ICON ),
			'iconSize'  => is_scalar( $raw['iconSize'] ?? '' ) ? (string) ( $raw['iconSize'] ?? '' ) : '',
			'iconColor' => is_scalar( $raw['iconColor'] ?? '' ) ? (string) ( $raw['iconColor'] ?? '' ) : '',
		) + SNN_Block_Link::clean( $raw );
	}

	/** The tag (a with a link), the link attributes, and the size and colour on the element (the icon inherits them). */
	public static function element( array $a, array $dyn ) {
		$link = SNN_Block_Link::element_attrs( $a, $dyn );
		$tag  = $link ? 'a' : ( 'a' === $a['tagName'] ? 'span' : $a['tagName'] );
		$css  = SNN_Icons::style( SNN_Dynamic_Data::render( $a['iconSize'], $dyn, 'plain' ), $a['iconColor'] );
		return array(
			'tag'   => $tag,
			'attrs' => $link ? $link : array(),
			'style' => '' !== $css ? explode( ';', $css ) : array(),
		);
	}

	public static function render( array $a, array $dyn ) {
		return SNN_Icons::html( $a['icon'] );
	}
}
