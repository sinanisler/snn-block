<?php
/**
 * Links: the link settings a block can have (Button and Icon today), as the Bricks link control without its link
 * types: a URL (dynamic tags such as {post_url} work), open in a new tab, rel and an ARIA label. With a URL the block's
 * element becomes an a.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class SNN_Block_Link {

	/** The attributes, with their defaults. */
	public static function attributes() {
		return array(
			'linkUrl'       => array( 'type' => 'string', 'default' => '' ),
			'linkNewTab'    => array( 'type' => 'boolean', 'default' => false ),
			'linkRel'       => array( 'type' => 'string', 'default' => '' ),
			'linkAriaLabel' => array( 'type' => 'string', 'default' => '' ),
		);
	}

	/** The settings, cleaned. */
	public static function clean( array $raw ) {
		$text = function ( $value, $max ) {
			return is_string( $value ) ? substr( trim( $value ), 0, $max ) : '';
		};
		$rel  = strtolower( $text( $raw['linkRel'] ?? '', 200 ) );
		return array(
			'linkUrl'       => $text( $raw['linkUrl'] ?? '', 2000 ),
			'linkNewTab'    => true === ( $raw['linkNewTab'] ?? false ) || 1 === ( $raw['linkNewTab'] ?? false ) || 'true' === ( $raw['linkNewTab'] ?? false ),
			// rel words only: nofollow, sponsored, ugc and so on.
			'linkRel'       => trim( preg_replace( '/[^a-z\s-]/', '', $rel ) ),
			'linkAriaLabel' => $text( $raw['linkAriaLabel'] ?? '', 300 ),
		);
	}

	/**
	 * The attributes of the a: href, target, rel and aria-label. Null when there is no link (no URL, or one that is
	 * empty once its tags are filled in or once esc_url drops it, such as a javascript: URL).
	 */
	public static function element_attrs( array $a, array $dyn ) {
		if ( '' === $a['linkUrl'] ) {
			return null;
		}
		$href = esc_url( SNN_Dynamic_Data::render( $a['linkUrl'], $dyn, 'plain' ) );
		if ( '' === $href ) {
			return null;
		}
		$out = array( 'href' => $href );
		$rel = '' !== $a['linkRel'] ? preg_split( '/\s+/', $a['linkRel'] ) : array();
		if ( $a['linkNewTab'] ) {
			$out['target'] = '_blank';
			$rel[]         = 'noopener';
		}
		if ( $rel ) {
			$out['rel'] = implode( ' ', array_unique( $rel ) );
		}
		if ( '' !== $a['linkAriaLabel'] ) {
			$out['aria-label'] = SNN_Dynamic_Data::render( $a['linkAriaLabel'], $dyn, 'plain' );
		}
		return $out;
	}
}
