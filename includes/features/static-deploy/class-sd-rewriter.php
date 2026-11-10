<?php
/**
 * Static Deploy: link rewriting and discovery.
 *
 * Every link to this site inside a document is rewritten to the destination form
 * (absolute, relative or offline). Each local URL found is also recorded, so that
 * the exporter can queue it. Links to pages are queued only when smart_crawl is off,
 * because the crawlers already list the pages. Assets (images, CSS, JS, fonts, files)
 * are always queued.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class SNN_Static_Deploy_Rewriter {

	/** Attributes whose value is a single URL. */
	const URL_ATTRIBUTES = array( 'href', 'src', 'poster', 'data', 'cite', 'longdesc', 'background', 'usemap', 'xlink:href', 'icon', 'manifest', 'codebase', 'archive', 'classid', 'profile', 'lowsrc', 'dynsrc' );

	/** Attributes whose value is a list of "URL descriptor" pairs. */
	const SRCSET_ATTRIBUTES = array( 'srcset', 'imagesrcset', 'data-srcset', 'data-lazy-srcset' );

	/** Meta tags whose content is a URL. */
	const META_URL_PATTERN = '/^(og:url|og:image|og:image:url|og:video|twitter:image|twitter:image:src|msapplication-TileImage)$/i';

	/** @var string Absolute URL of the document being rewritten. */
	private $page_url = '';

	/** @var string Export-relative path of the file that will hold the result. */
	private $from_file = '';

	/** @var array Settings (see SNN_Static_Deploy_Options). */
	private $settings = array();

	/** @var array<string,bool> Local URLs that the exporter should queue. */
	private $found = array();

	/**
	 * @param string $page_url  Absolute URL of the document.
	 * @param string $from_file Export-relative file path of the output.
	 * @param array  $settings  Settings.
	 */
	public function __construct( $page_url, $from_file, array $settings ) {
		$this->page_url  = $page_url;
		$this->from_file = $from_file;
		$this->settings  = $settings;
	}

	/**
	 * Local URLs found by the last rewrite.
	 *
	 * @return string[]
	 */
	public function found() {
		return array_keys( $this->found );
	}

	/**
	 * Rewrite an HTML document.
	 *
	 * @param string $html Document.
	 * @return string
	 */
	public function html( $html ) {
		if ( '' === trim( (string) $html ) ) {
			return (string) $html;
		}

		// Non-ASCII characters become numeric entities first. The document then keeps every
		// attribute (for example <html lang="...">), which a leading <meta> tag would lose.
		$input = function_exists( 'mb_encode_numericentity' )
			? mb_encode_numericentity( $html, array( 0x80, 0x10ffff, 0, 0x1fffff ), 'UTF-8' )
			: '<meta http-equiv="Content-Type" content="text/html; charset=utf-8">' . $html;

		$previous = libxml_use_internal_errors( true );
		$dom      = new DOMDocument( '1.0', 'UTF-8' );
		$dom->preserveWhiteSpace = true;
		$dom->formatOutput       = false;
		$loaded = $dom->loadHTML( $input, LIBXML_NOERROR | LIBXML_NOWARNING );
		libxml_clear_errors();
		libxml_use_internal_errors( $previous );

		if ( ! $loaded ) {
			return $this->text( $html );
		}
		$dom->encoding = 'UTF-8';

		$xpath = new DOMXPath( $dom );

		// Head links that point at endpoints which are not exported (REST API, oEmbed,
		// XML-RPC, shortlinks) are removed. Stylesheets and icons are kept.
		foreach ( iterator_to_array( $xpath->query( '//link[@rel]' ) ) as $link ) {
			$rel  = strtolower( (string) $link->getAttribute( 'rel' ) );
			$type = strtolower( (string) $link->getAttribute( 'type' ) );
			$href = (string) $link->getAttribute( 'href' );

			if ( 'shortlink' === $rel ) {
				$link->parentNode->removeChild( $link );
				continue;
			}

			// Feed autodiscovery tags point at per-post and per-archive feeds. Only the feeds the
			// crawler lists are exported (add_feeds), so these tags are removed rather than left
			// pointing at files that may not exist.
			if ( 'alternate' === $rel && ( false !== strpos( $type, 'rss' ) || false !== strpos( $type, 'atom' ) ) ) {
				$link->parentNode->removeChild( $link );
				continue;
			}

			if ( in_array( $rel, array( 'preconnect', 'dns-prefetch' ), true ) && '' !== $href ) {
				$abs = SNN_Static_Deploy_URL::resolve( $href, $this->page_url );
				if ( '' !== $abs && SNN_Static_Deploy_URL::is_local( $abs ) ) {
					$link->parentNode->removeChild( $link );
					continue;
				}
			}

			if ( false === strpos( $rel, 'stylesheet' ) && 'icon' !== $rel && '' !== $href ) {
				$abs = SNN_Static_Deploy_URL::resolve( $href, $this->page_url );
				if ( '' !== $abs && SNN_Static_Deploy_URL::is_local( $abs ) && SNN_Static_Deploy_URL::is_excluded( SNN_Static_Deploy_URL::normalize( $abs ), $this->settings ) ) {
					$link->parentNode->removeChild( $link );
					continue;
				}
			}
		}

		foreach ( iterator_to_array( $xpath->query( '//*[@*]' ) ) as $element ) {
			$tag = strtolower( $element->nodeName );

			foreach ( iterator_to_array( $element->attributes ) as $attribute ) {
				$name  = strtolower( $attribute->nodeName );
				$value = (string) $attribute->nodeValue;

				if ( '' === trim( $value ) ) {
					continue;
				}

				if ( 'style' === $name ) {
					$element->setAttribute( 'style', $this->css( $value, $this->page_url ) );
					continue;
				}

				if ( in_array( $name, self::SRCSET_ATTRIBUTES, true ) ) {
					$element->setAttribute( $attribute->nodeName, $this->srcset( $value ) );
					continue;
				}

				if ( 'meta' === $tag && 'content' === $name ) {
					$key = (string) ( $element->getAttribute( 'property' ) ?: $element->getAttribute( 'name' ) );
					if ( '' !== $key && preg_match( self::META_URL_PATTERN, $key ) ) {
						$element->setAttribute( 'content', $this->rewrite_url( $value, 'og:url' === strtolower( $key ) ) );
						continue;
					}
					if ( 'refresh' === strtolower( (string) $element->getAttribute( 'http-equiv' ) ) ) {
						$element->setAttribute( 'content', $this->refresh( $value ) );
						continue;
					}
				}

				if ( in_array( $name, self::URL_ATTRIBUTES, true ) || 0 === strpos( $name, 'data-' ) && $this->looks_like_url( $value ) ) {
					if ( 'a' === $tag || 'iframe' === $tag || ( 'link' === $tag && 'canonical' === strtolower( (string) $element->getAttribute( 'rel' ) ) ) ) {
						$element->setAttribute( $attribute->nodeName, $this->rewrite_url( $value, true ) );
					} else {
						$element->setAttribute( $attribute->nodeName, $this->rewrite_url( $value, false ) );
					}
					continue;
				}

				// Form actions and other values: rewrite only absolute local URLs.
				if ( false !== strpos( $value, '//' ) ) {
					$element->setAttribute( $attribute->nodeName, $this->text( $value ) );
				}
			}
		}

		foreach ( iterator_to_array( $xpath->query( '//style' ) ) as $style ) {
			$style->nodeValue = $this->css( (string) $style->nodeValue, $this->page_url );
		}

		foreach ( iterator_to_array( $xpath->query( '//script' ) ) as $script ) {
			if ( ! $script->hasAttribute( 'src' ) ) {
				$script->nodeValue = $this->text( (string) $script->nodeValue );
			}
		}

		$out = $dom->saveHTML();
		return false === $out ? (string) $html : $out;
	}

	/**
	 * Rewrite a stylesheet. Relative URLs are resolved against $base_url.
	 *
	 * @param string $css      Stylesheet text.
	 * @param string $base_url Absolute URL of the stylesheet (or of the page for inline styles).
	 * @return string
	 */
	public function css( $css, $base_url = '' ) {
		$base = '' !== $base_url ? $base_url : $this->page_url;

		$css = preg_replace_callback(
			'/url\(\s*([\'"]?)([^\'")]*?)\1\s*\)/i',
			function ( $m ) use ( $base ) {
				$raw = trim( $m[2] );
				if ( '' === $raw || 0 === stripos( $raw, 'data:' ) ) {
					return $m[0];
				}
				return 'url(' . $m[1] . $this->rewrite_url( $raw, false, $base ) . $m[1] . ')';
			},
			(string) $css
		);

		$css = preg_replace_callback(
			'/@import\s+([\'"])([^\'"]+)\1/i',
			function ( $m ) use ( $base ) {
				return '@import ' . $m[1] . $this->rewrite_url( $m[2], false, $base ) . $m[1];
			},
			(string) $css
		);

		return $this->text( (string) $css, $base );
	}

	/**
	 * Rewrite plain text that may contain absolute URLs: scripts, JSON, XML, robots.txt,
	 * _redirects and the like. Escaped slashes (https:\/\/) are handled as well.
	 *
	 * @param string $text Text.
	 * @param string $base Base URL for protocol-relative links.
	 * @return string
	 */
	public function text( $text, $base = '' ) {
		$base = '' !== $base ? $base : $this->page_url;

		// Plain URLs.
		$text = preg_replace_callback(
			'#(?:https?:)?//[a-z0-9.\-]+(?::\d+)?(?:/[^\s"\'<>\)\]\}`,;\\\\]*)?#i',
			function ( $m ) use ( $base ) {
				// URLs in scripts and data are treated like links: pages only when smart crawl is off.
				return $this->rewrite_url( $m[0], true, $base );
			},
			(string) $text
		);

		// URLs with escaped slashes, as in JSON strings: https:\/\/example.com\/a.
		$text = preg_replace_callback(
			'#https?:\\\\/\\\\/[a-z0-9.\-]+(?::\d+)?(?:\\\\/[^\s"\'<>\)\]\}`,;]*)?#i',
			function ( $m ) use ( $base ) {
				$plain     = str_replace( '\\/', '/', $m[0] );
				$rewritten = $this->rewrite_url( $plain, true, $base );
				if ( $rewritten === $plain ) {
					return $m[0];
				}
				return str_replace( '/', '\\/', $rewritten );
			},
			(string) $text
		);

		return (string) $text;
	}

	/**
	 * Rewrite a text file that lists URLs (robots.txt, _redirects, _headers, llms.txt).
	 *
	 * @param string $text Text.
	 * @return string
	 */
	public function text_file( $text ) {
		return $this->text( (string) $text );
	}

	/**
	 * Rewrite one URL.
	 *
	 * @param string $raw          URL as written.
	 * @param bool   $is_page_link True for links to pages (a, iframe, canonical).
	 * @param string $base         Base URL for relative values (default: the document).
	 * @return string The value to write.
	 */
	public function rewrite_url( $raw, $is_page_link = false, $base = '' ) {
		$base = '' !== $base ? $base : $this->page_url;
		$raw  = (string) $raw;

		$absolute = SNN_Static_Deploy_URL::resolve( $raw, $base );
		if ( '' === $absolute || ! SNN_Static_Deploy_URL::is_local( $absolute ) ) {
			return $raw;
		}

		$fragment = SNN_Static_Deploy_URL::fragment( $absolute );
		$normal   = SNN_Static_Deploy_URL::normalize( $absolute );
		if ( '' === $normal ) {
			return $raw;
		}

		// Excluded endpoints (wp-admin, wp-json, xmlrpc.php, ?replytocom=...) are not exported,
		// so their links stay as they were rather than pointing at a file that does not exist.
		if ( SNN_Static_Deploy_URL::is_excluded( $normal, $this->settings ) ) {
			return $raw;
		}

		$is_page = $is_page_link && ! SNN_Static_Deploy_URL::is_asset( $normal ) && ! SNN_Static_Deploy_URL::is_attachment( $normal );
		$this->note( $normal, $is_page );

		$target = '' !== $fragment ? $normal . '#' . $fragment : $normal;
		return SNN_Static_Deploy_URL::link_for( $target, $this->from_file, $this->settings );
	}

	/**
	 * Rewrite a srcset value ("a.jpg 300w, b.jpg 768w").
	 *
	 * @param string $value Attribute value.
	 * @return string
	 */
	private function srcset( $value ) {
		$entries = array_filter( array_map( 'trim', explode( ',', (string) $value ) ), 'strlen' );
		$out     = array();
		foreach ( $entries as $entry ) {
			$parts      = preg_split( '/\s+/', $entry, 2 );
			$url        = isset( $parts[0] ) ? $parts[0] : '';
			$descriptor = isset( $parts[1] ) ? ' ' . $parts[1] : '';
			$out[]      = $this->rewrite_url( $url, false ) . $descriptor;
		}
		return implode( ', ', $out );
	}

	/**
	 * Rewrite the URL inside a meta refresh ("0;url=https://...").
	 *
	 * @param string $content Content attribute.
	 * @return string
	 */
	private function refresh( $content ) {
		if ( ! preg_match( '/^(\s*\d+\s*;\s*url\s*=\s*)(.+)$/i', (string) $content, $m ) ) {
			return (string) $content;
		}
		return $m[1] . $this->rewrite_url( trim( $m[2], " '\"" ), true );
	}

	/**
	 * Whether a value looks like a URL (not a JSON object, not free text).
	 *
	 * @param string $value Value.
	 * @return bool
	 */
	private function looks_like_url( $value ) {
		$value = trim( (string) $value );
		return (bool) preg_match( '#^(?:https?:)?//|^/[^\s{}\[\]"]*$#i', $value );
	}

	/**
	 * Record a local URL that the exporter should queue.
	 *
	 * @param string $url     Normalized absolute URL.
	 * @param bool   $is_page Whether the URL is a page (not a file).
	 * @return void
	 */
	private function note( $url, $is_page ) {
		if ( ! SNN_Static_Deploy_URL::is_local( $url ) ) {
			return;
		}
		if ( SNN_Static_Deploy_URL::is_excluded( $url, $this->settings ) ) {
			return;
		}
		if ( $is_page && ! empty( $this->settings['smart_crawl'] ) ) {
			return;
		}
		$this->found[ $url ] = true;
	}
}
