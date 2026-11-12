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

	/** The icon a new block starts with, a Font Awesome heart. */
	const DEFAULT_ICON = array(
		'library' => 'fontawesome-solid',
		'name'    => 'fa-heart',
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
			// The Link group (SNN_Block_Link): the registry adds its attributes and cleans them.
			'supports' => array( 'link' => true ),
		);
	}

	public static function attributes() {
		return array(
			'icon' => array( 'type' => 'object', 'default' => self::DEFAULT_ICON ),
		);
	}

	public static function clean( $raw ) {
		$raw = is_array( $raw ) ? $raw : array();
		// The icon's size and colour are style values (the property table), cleaned by the engine.
		return array(
			'icon' => SNN_Icons::clean( $raw['icon'] ?? self::DEFAULT_ICON ),
		);
	}

	/** The tag (a with a link) and the link attributes. The size and colour are CSS variables of the block (the table, style-props.php). */
	public static function element( array $a, array $dyn ) {
		$link = SNN_Block_Link::element_attrs( $a, $dyn );
		$tag  = $link ? 'a' : ( 'a' === $a['tagName'] ? 'span' : $a['tagName'] );
		return array(
			'tag'   => $tag,
			'attrs' => $link ? $link : array(),
			'style' => array(),
		);
	}

	public static function render( array $a, array $dyn ) {
		return SNN_Icons::html( $a['icon'] );
	}
}
