<?php
/**
 * Image (snn/image): one picture from the media library, a dynamic value or a custom URL, with sources for other
 * breakpoints, the aspect ratio, object fit and position, a caption, loading, stretch and a link. The settings are the
 * Bricks image element's, without its overlay and without Unsplash.
 *
 * The shared engine (../../layout-blocks.php) draws the element around this picture, with its Style groups.
 * The panel is image-editor.js in this folder and the lightbox is image-lightbox.js. The editor's canvas
 * (image-editor.js) draws the same picture: keep the two in step.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class SNN_Image_Block {

	/** The HTML tags the element offers. figure is the default. */
	const TAGS = array( 'figure', 'div' );

	/** Object fit: the CSS words. fill is the browser's own default. */
	const OBJECT_FIT = array( 'fill', 'contain', 'cover', 'scale-down', 'none' );

	const CAPTION = array( 'none', 'attachment', 'custom' );
	const LOADING = array( 'lazy', 'eager' );

	/** Link to: none, a lightbox on the page, the attachment page, the media file, or a custom URL. */
	const LINK = array( 'none', 'lightbox', 'attachment', 'media', 'url' );

	/** A source's breakpoint: one of the two views of the panel (SNN_Layout_Blocks::VIEW_WIDTHS), or a custom media query. */
	const SOURCE = array( 'tablet', 'mobile', 'custom' );

	const MAX_SOURCES = 10;

	/** Aspect ratio: auto, a ratio such as 16 / 9 or 1.5, or a variable. */
	const ASPECT = '/^(auto|\d+(\.\d+)?(\s*\/\s*\d+(\.\d+)?)?|var\(--[a-z][a-z0-9-]*\))$/i';

	/** Object position: one or two lengths or keywords, such as 50% 50% or center top. */
	const POSITION = '/^(-?\d+(\.\d+)?(px|%|em|rem|vw|vh)?|left|right|top|bottom|center)(\s+(-?\d+(\.\d+)?(px|%|em|rem|vw|vh)?|left|right|top|bottom|center))?$/i';

	/**
	 * A custom media query: one or more (feature: value) conditions joined by and, with an optional media type first,
	 * such as (min-width: 1200px) or screen and (max-width: 600px). Anything else is dropped.
	 */
	const MEDIA = '/^(?:(?:all|screen|print|speech)\s+and\s+)?(?:\([a-z-]{1,30}\s*:\s*[a-z0-9.%-]{1,20}\)(?:\s+and\s+)?)+$/i';

	/**
	 * The attributes, with their defaults. The engine registers them, and the editor gets the same list in its
	 * block definitions (see SNN_Layout_Blocks::definitions()).
	 */
	public static function attributes() {
		return array(
			'imageId'        => array( 'type' => 'number', 'default' => 0 ),
			'imageUrl'       => array( 'type' => 'string', 'default' => '' ),
			'imageDynamic'   => array( 'type' => 'string', 'default' => '' ),
			'imageCustomUrl' => array( 'type' => 'string', 'default' => '' ),
			'sources'        => array( 'type' => 'array', 'default' => array() ),
			'aspectRatio'    => array( 'type' => 'string', 'default' => '' ),
			'objectFit'      => array( 'type' => 'string', 'default' => 'fill' ),
			'objectPosition' => array( 'type' => 'string', 'default' => '50% 50%' ),
			'captionType'    => array( 'type' => 'string', 'default' => 'attachment' ),
			'captionCustom'  => array( 'type' => 'string', 'default' => '' ),
			'loading'        => array( 'type' => 'string', 'default' => 'lazy' ),
			'stretch'        => array( 'type' => 'boolean', 'default' => false ),
			'linkTo'         => array( 'type' => 'string', 'default' => 'none' ),
			'linkUrl'        => array( 'type' => 'string', 'default' => '' ),
			'linkNewTab'     => array( 'type' => 'boolean', 'default' => false ),
		);
	}

	/** The settings, cleaned: the right type, allowed values, and the defaults for anything missing. */
	public static function clean( $raw ) {
		$raw = is_array( $raw ) ? $raw : array();
		$out = array();
		foreach ( self::attributes() as $key => $spec ) {
			$out[ $key ] = $raw[ $key ] ?? $spec['default'];
		}
		$out['imageId']        = absint( $out['imageId'] );
		$out['imageUrl']       = self::url( $out['imageUrl'] );
		$out['imageDynamic']   = self::text( $out['imageDynamic'], 300 );
		$out['imageCustomUrl'] = self::text( $out['imageCustomUrl'], 2000 );
		$out['sources']        = self::clean_sources( $out['sources'] );
		$out['aspectRatio']    = self::matching( $out['aspectRatio'], self::ASPECT );
		$out['objectFit']      = self::pick( $out['objectFit'], self::OBJECT_FIT, 'fill' );
		$out['objectPosition'] = self::matching( $out['objectPosition'], self::POSITION );
		$out['captionType']    = self::pick( $out['captionType'], self::CAPTION, 'attachment' );
		$out['captionCustom']  = self::text( $out['captionCustom'], 300 );
		$out['loading']        = self::pick( $out['loading'], self::LOADING, 'lazy' );
		$out['stretch']        = self::flag( $out['stretch'] );
		$out['linkTo']         = self::pick( $out['linkTo'], self::LINK, 'none' );
		$out['linkUrl']        = self::text( $out['linkUrl'], 2000 );
		$out['linkNewTab']     = self::flag( $out['linkNewTab'] );
		return $out;
	}

	/**
	 * The HTML inside the element: the picture (with its sources when there are any), the link around it, and the
	 * caption. Empty when there is no picture. $dyn is the loop's post, index and count, which the tags read.
	 */
	public static function render( array $a, array $dyn ) {
		$main = self::main_image( $a, $dyn );
		if ( null === $main ) {
			return '';
		}
		$html    = self::img_tag( $main, $a, self::img_style( $a ) );
		$sources = self::sources_html( $a['sources'] );
		if ( '' !== $sources ) {
			$html = '<picture>' . $sources . $html . '</picture>';
		}
		$link = self::link( $a, $dyn, $main );
		if ( null !== $link ) {
			$href = esc_url( $link['href'] );
			if ( '' !== $href ) {
				$html = '<a href="' . $href . '"' . $link['attrs'] . '>' . $html . '</a>';
			}
		}
		$caption = self::caption( $a, $dyn, $main );
		if ( '' !== $caption ) {
			$html .= '<figcaption>' . esc_html( $caption ) . '</figcaption>';
		}
		return $html;
	}

	/**
	 * The picture: the dynamic value first (a URL or a tag such as {featured_image}), then the custom URL, then the
	 * picture from the library. Returns array( 'id' => attachment ID or 0, 'url' => a plain URL ), or null for none.
	 */
	private static function main_image( array $a, array $dyn ) {
		if ( '' !== $a['imageDynamic'] ) {
			$picture = self::from_url( SNN_Dynamic_Data::render( $a['imageDynamic'], $dyn, 'plain' ) );
			if ( $picture ) {
				return $picture;
			}
		}
		if ( '' !== $a['imageCustomUrl'] ) {
			$picture = self::from_url( SNN_Dynamic_Data::render( $a['imageCustomUrl'], $dyn, 'plain' ) );
			if ( $picture ) {
				return $picture;
			}
		}
		if ( $a['imageId'] && wp_attachment_is_image( $a['imageId'] ) ) {
			return array( 'id' => $a['imageId'], 'url' => '' );
		}
		return '' !== $a['imageUrl'] ? self::from_url( $a['imageUrl'] ) : null;
	}

	/**
	 * A URL as a picture, or null when the text is not one. It must be an absolute or protocol-relative address, or a
	 * root-relative path, so a tag that resolves to plain text (a title, say) gives no picture. An attachment of this
	 * site gets its sizes and alt text.
	 */
	private static function from_url( $url ) {
		$url = trim( (string) $url );
		if ( ! preg_match( '#^(https?:)?//|^/#i', $url ) ) {
			return null;
		}
		$url = esc_url_raw( $url );
		if ( '' === $url ) {
			return null;
		}
		$id = attachment_url_to_postid( $url );
		if ( $id && wp_attachment_is_image( $id ) ) {
			return array( 'id' => $id, 'url' => '' );
		}
		return array( 'id' => 0, 'url' => $url );
	}

	/**
	 * The img element. A library picture comes from WordPress, with its sizes and alt text. A URL gets an empty alt,
	 * as the panel has no alt field for it.
	 */
	private static function img_tag( array $main, array $a, $style ) {
		if ( $main['id'] ) {
			return wp_get_attachment_image(
				$main['id'],
				'full',
				false,
				array(
					'loading'  => $a['loading'],
					'decoding' => 'async',
					'style'    => $style,
				)
			);
		}
		return '<img src="' . esc_url( $main['url'] ) . '" alt="" loading="' . esc_attr( $a['loading'] ) . '" decoding="async" style="' . esc_attr( $style ) . '">';
	}

	/**
	 * The inline style of the picture: stretch, object fit and position, and the aspect ratio. Each value was checked
	 * by clean(). Vertical align top stops the gap under an inline picture. The display is not set here, because the
	 * accessibility widget (assets/js/snn-accessibility.js) clears the inline display of every image on the page.
	 */
	private static function img_style( array $a ) {
		$css = $a['stretch']
			? array( 'vertical-align:top', 'width:100%', 'height:100%', 'max-width:100%' )
			: array( 'vertical-align:top', 'max-width:100%', 'height:auto' );
		if ( '' !== $a['objectFit'] ) {
			$css[] = 'object-fit:' . $a['objectFit'];
		}
		if ( '' !== $a['objectPosition'] ) {
			$css[] = 'object-position:' . $a['objectPosition'];
		}
		if ( '' !== $a['aspectRatio'] ) {
			$css[] = 'aspect-ratio:' . $a['aspectRatio'];
		}
		return implode( ';', $css );
	}

	/**
	 * The source elements of the picture. A named breakpoint is a max-width query of that view's width. The browser
	 * takes the first source that matches, so the narrowest comes first, then the custom queries in their order.
	 */
	private static function sources_html( array $sources ) {
		$widths = SNN_Layout_Blocks::VIEW_WIDTHS;
		$named  = array();
		$custom = array();
		foreach ( $sources as $row ) {
			$url = $row['imageId'] && wp_attachment_is_image( $row['imageId'] ) ? wp_get_attachment_image_url( $row['imageId'], 'full' ) : $row['imageUrl'];
			if ( ! $url ) {
				continue;
			}
			if ( 'custom' === $row['breakpoint'] ) {
				$custom[] = array( 'media' => $row['media'], 'url' => $url );
			} else {
				$named[] = array( 'width' => (int) $widths[ $row['breakpoint'] ], 'url' => $url );
			}
		}
		usort(
			$named,
			function ( $x, $y ) {
				return $x['width'] <=> $y['width'];
			}
		);
		$html = '';
		foreach ( $named as $s ) {
			$html .= '<source media="(max-width: ' . $s['width'] . 'px)" srcset="' . esc_url( $s['url'] ) . '">';
		}
		foreach ( $custom as $s ) {
			$html .= '<source media="' . esc_attr( $s['media'] ) . '" srcset="' . esc_url( $s['url'] ) . '">';
		}
		return $html;
	}

	/**
	 * The link around the picture, or null for none. Lightbox opens the picture on the page (image-lightbox.js), and
	 * the other links open their page or file, in a new tab when set.
	 */
	private static function link( array $a, array $dyn, array $main ) {
		$full = $main['id'] ? (string) wp_get_attachment_url( $main['id'] ) : $main['url'];
		$new  = $a['linkNewTab'] ? ' target="_blank" rel="noopener"' : '';
		switch ( $a['linkTo'] ) {
			case 'lightbox':
				if ( '' === $full ) {
					return null;
				}
				self::enqueue_lightbox();
				return array( 'href' => $full, 'attrs' => ' data-snn-lightbox' );
			case 'media':
				return '' === $full ? null : array( 'href' => $full, 'attrs' => $new );
			case 'attachment':
				return $main['id'] ? array( 'href' => get_attachment_link( $main['id'] ), 'attrs' => $new ) : null;
			case 'url':
				$href = trim( SNN_Dynamic_Data::render( $a['linkUrl'], $dyn, 'plain' ) );
				return '' === $href ? null : array( 'href' => $href, 'attrs' => $new );
		}
		return null;
	}

	/** The caption: the attachment's caption, or the custom caption (with its tags filled in). */
	private static function caption( array $a, array $dyn, array $main ) {
		if ( 'attachment' === $a['captionType'] ) {
			return $main['id'] ? trim( (string) wp_get_attachment_caption( $main['id'] ) ) : '';
		}
		if ( 'custom' === $a['captionType'] ) {
			return trim( SNN_Dynamic_Data::render( $a['captionCustom'], $dyn, 'plain' ) );
		}
		return '';
	}

	/** The lightbox script, only on pages that have a lightbox link. */
	private static function enqueue_lightbox() {
		$file = 'includes/block/blocks/image/image-lightbox.js';
		wp_enqueue_script( 'snn-image-lightbox', SNN_URL . $file, array(), file_exists( SNN_PATH . $file ) ? (string) filemtime( SNN_PATH . $file ) : '1', true );
	}

	/** The sources, cleaned: a breakpoint, a media query for a custom one, and an image (library or URL). Rows without an image are dropped. */
	private static function clean_sources( $rows ) {
		$out  = array();
		$rows = is_array( $rows ) ? array_slice( array_values( $rows ), 0, self::MAX_SOURCES ) : array();
		foreach ( $rows as $row ) {
			if ( ! is_array( $row ) ) {
				continue;
			}
			$kind  = self::pick( $row['breakpoint'] ?? '', self::SOURCE, 'tablet' );
			$media = 'custom' === $kind ? self::matching( $row['media'] ?? '', self::MEDIA ) : '';
			$id    = absint( $row['imageId'] ?? 0 );
			$url   = self::url( $row['imageUrl'] ?? '' );
			if ( ( ! $id && '' === $url ) || ( 'custom' === $kind && '' === $media ) ) {
				continue;
			}
			$out[] = array(
				'breakpoint' => $kind,
				'media'      => $media,
				'imageId'    => $id,
				'imageUrl'   => $url,
			);
		}
		return $out;
	}

	private static function pick( $value, array $allowed, $default ) {
		return is_string( $value ) && in_array( $value, $allowed, true ) ? $value : $default;
	}

	/** The trimmed value when it matches the pattern, or '' when it does not. */
	private static function matching( $value, $pattern ) {
		$value = is_string( $value ) ? trim( $value ) : '';
		return preg_match( $pattern, $value ) ? $value : '';
	}

	private static function text( $value, $max ) {
		return is_scalar( $value ) ? mb_substr( sanitize_text_field( (string) $value ), 0, $max ) : '';
	}

	private static function url( $value ) {
		return is_string( $value ) ? mb_substr( esc_url_raw( $value ), 0, 2000 ) : '';
	}

	private static function flag( $value ) {
		return true === $value || 1 === $value || '1' === $value || 'true' === $value;
	}
}
