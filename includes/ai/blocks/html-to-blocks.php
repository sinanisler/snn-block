<?php
/**
 * HTML to block markup converter.
 *
 * Turns an HTML design (a section, a page, a fragment) into block editor markup.
 * A core block is used wherever it can hold the content exactly: headings,
 * paragraphs, lists (with list-item blocks), images, buttons, groups, quotes,
 * details, tables, code and separators. Anything else (SVG, forms, media, elements
 * with data-* or aria-* attributes, empty decorative elements) is kept verbatim in
 * a Custom HTML block, so the editor opens it without "invalid block" errors and
 * nothing from the design is lost.
 *
 * Styling is moved out of the markup:
 *  - every inline style="" becomes a generated class (snn-xxxxxxxx) and a rule in
 *    the returned CSS, so the block keeps its look and stays valid;
 *  - <style> elements are returned as CSS, and <link> to Google Fonts as a font
 *    request (see snn/install-font);
 *  - <script> elements are returned as scripts, but only when allow_code is true,
 *    because scripts need unfiltered_html.
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

class SNN_HTML_To_Blocks {

    /** Tags a rich-text block (paragraph, heading, list item) can hold. */
    const RICH_TAGS = array( 'a', 'code', 'em', 'strong', 's', 'sub', 'sup', 'span', 'br' );

    /** Tags that are read as the rich-text tag they stand for. */
    const RICH_ALIAS = array( 'b' => 'strong', 'i' => 'em', 'del' => 's', 'strike' => 's' );

    /** Inline (phrasing) tags. A run of these between blocks becomes one paragraph or one HTML block. */
    const INLINE_TAGS = array(
        'a', 'abbr', 'b', 'bdi', 'bdo', 'br', 'cite', 'code', 'del', 'dfn', 'em', 'i', 'img', 'input', 'ins',
        'kbd', 'label', 'mark', 'q', 's', 'samp', 'select', 'small', 'span', 'strike', 'strong', 'sub', 'sup',
        'svg', 'textarea', 'time', 'u', 'var', 'button', 'wbr',
    );

    /** Wrapper tags a group can keep (core/group tagName). */
    const GROUP_TAGS = array( 'div', 'section', 'header', 'footer', 'main', 'article', 'aside' );

    /** Attributes a rich-text run can keep on its tags. Everything else is dropped. */
    const RICH_ATTRS = array( 'href', 'target', 'rel' );

    private $allow_code;
    /** @var DOMDocument */
    private $doc;
    private $raw_svg      = array();
    private $css_blocks   = array();
    private $css_rules    = array();
    private $scripts_src  = array();
    private $scripts_js   = array();
    private $fonts        = array();
    private $counts       = array();
    private $fallbacks    = 0;
    private $warnings     = array();
    private $dropped_attr = 0;

    /**
     * Convert HTML to block markup.
     *
     * @param string $html Design markup. Block markup (containing "<!-- wp:") is passed through normalized.
     * @param array  $args allow_code (bool): keep <script> tags as page scripts.
     * @return array { markup, css, scripts: { src, inline }, fonts, report: { blocks, html_fallbacks, warnings } }
     */
    public static function convert( $html, $args = array() ) {
        $converter = new self( ! empty( $args['allow_code'] ) );
        return $converter->run( (string) $html );
    }

    private function __construct( $allow_code ) {
        $this->allow_code = (bool) $allow_code;
    }

    private function run( $html ) {
        if ( false !== strpos( $html, '<!-- wp:' ) ) {
            $blocks = parse_blocks( $html );
            return $this->result( serialize_blocks( $blocks ), array(), $this->count_parsed( $blocks ) );
        }

        // Keep the SVG source as written: the HTML parser lowercases attributes such as viewBox.
        $html = preg_replace_callback(
            '#<svg\b.*?</svg>#is',
            function ( $match ) {
                $this->raw_svg[] = $match[0];
                return '<span data-snn-raw="' . ( count( $this->raw_svg ) - 1 ) . '"></span>';
            },
            $html
        );

        // Page wrappers are not content: the head part is still parsed for <style> and <link>.
        $html = preg_replace( '#<!doctype[^>]*>|</?html\b[^>]*>|</?body\b[^>]*>|</?head\b[^>]*>#i', '', $html );

        $doc  = new DOMDocument( '1.0', 'UTF-8' );
        $prev = libxml_use_internal_errors( true );
        $doc->loadHTML(
            '<!DOCTYPE html><html><head><meta charset="utf-8"></head><body><div id="snn-root">' . $html . '</div></body></html>',
            LIBXML_HTML_NODEFDTD | LIBXML_NOERROR | LIBXML_NOWARNING
        );
        libxml_clear_errors();
        libxml_use_internal_errors( $prev );
        $this->doc = $doc;

        $xpath = new DOMXPath( $doc );
        $root  = $xpath->query( '//*[@id="snn-root"]' )->item( 0 );
        if ( ! $root ) {
            return $this->result( '', array(), array() );
        }

        $this->extract_page_code( $root );

        $blocks = $this->nodes_to_blocks( iterator_to_array( $root->childNodes ) );

        return $this->result( implode( "\n\n", $blocks ), $blocks, null );
    }

    private function result( $markup, $blocks, $counts ) {
        $css = array();
        foreach ( $this->css_blocks as $block ) {
            $css[] = trim( $block );
        }
        foreach ( $this->css_rules as $class => $declarations ) {
            $css[] = '.' . $class . '{' . $declarations . '}';
        }

        return array(
            'markup'  => $markup,
            'css'     => implode( "\n", array_filter( $css ) ),
            'scripts' => array(
                'src'    => array_values( array_unique( $this->scripts_src ) ),
                'inline' => implode( "\n;\n", $this->scripts_js ),
            ),
            'fonts'   => $this->fonts,
            'report'  => array(
                'blocks'         => null !== $counts ? $counts : $this->counts,
                'html_fallbacks' => $this->fallbacks,
                'dropped_attributes' => $this->dropped_attr,
                'warnings'       => array_values( array_unique( $this->warnings ) ),
            ),
        );
    }

    private function count_parsed( array $blocks ) {
        $counts = array();
        $walk   = function ( $list ) use ( &$walk, &$counts ) {
            foreach ( $list as $block ) {
                if ( ! empty( $block['blockName'] ) ) {
                    $counts[ $block['blockName'] ] = ( $counts[ $block['blockName'] ] ?? 0 ) + 1;
                }
                if ( ! empty( $block['innerBlocks'] ) ) {
                    $walk( $block['innerBlocks'] );
                }
            }
        };
        $walk( $blocks );
        return $counts;
    }

    /* ----------------------------------------------------------------------
     * Page-level code: <style>, <link> (Google Fonts) and <script>
     * ------------------------------------------------------------------- */

    private function extract_page_code( DOMElement $root ) {
        foreach ( array( 'style', 'script', 'link', 'meta', 'title', 'noscript', 'template' ) as $tag ) {
            foreach ( iterator_to_array( $root->getElementsByTagName( $tag ) ) as $el ) {
                if ( 'style' === $tag ) {
                    $this->css_blocks[] = $el->textContent;
                } elseif ( 'script' === $tag ) {
                    $src = trim( (string) $el->getAttribute( 'src' ) );
                    if ( '' !== $src ) {
                        if ( preg_match( '#^https://#i', $src ) ) {
                            $this->scripts_src[] = $src;
                        } else {
                            $this->warnings[] = 'Script src dropped (only https:// is kept): ' . $src;
                        }
                    } elseif ( $this->allow_code ) {
                        $this->scripts_js[] = $el->textContent;
                    } else {
                        $this->warnings[] = 'Inline script dropped: pass allow_code (unfiltered_html) to keep page scripts.';
                    }
                } elseif ( 'link' === $tag ) {
                    $href = (string) $el->getAttribute( 'href' );
                    if ( false !== strpos( $href, 'fonts.googleapis.com' ) ) {
                        $this->collect_google_fonts( $href );
                    }
                }
                if ( $el->parentNode ) {
                    $el->parentNode->removeChild( $el );
                }
            }
        }
    }

    /** Font families and weights requested by a Google Fonts css2 link. */
    private function collect_google_fonts( $href ) {
        if ( preg_match_all( '/family=([^&:]+):wght@([0-9;]+)/', rawurldecode( $href ), $m, PREG_SET_ORDER ) ) {
            foreach ( $m as $match ) {
                $family = str_replace( '+', ' ', $match[1] );
                $this->fonts[ $family ] = array_values( array_unique( array_merge( $this->fonts[ $family ] ?? array(), explode( ';', $match[2] ) ) ) );
            }
        } elseif ( preg_match_all( '/family=([^&:]+)/', rawurldecode( $href ), $m ) ) {
            foreach ( $m[1] as $family ) {
                $this->fonts[ str_replace( '+', ' ', $family ) ] = array( '400' );
            }
        }
    }

    /* ----------------------------------------------------------------------
     * Walking the tree
     * ------------------------------------------------------------------- */

    /** Convert a list of sibling nodes into block markup strings. */
    private function nodes_to_blocks( array $nodes ) {
        $blocks = array();
        $run    = array();

        foreach ( $nodes as $node ) {
            if ( XML_COMMENT_NODE === $node->nodeType || XML_ELEMENT_NODE !== $node->nodeType && XML_TEXT_NODE !== $node->nodeType ) {
                continue;
            }
            if ( $this->is_inline( $node ) ) {
                $run[] = $node;
                continue;
            }
            $this->flush_run( $run, $blocks );
            $run = array();
            foreach ( $this->element_blocks( $node ) as $block ) {
                $blocks[] = $block;
            }
        }
        $this->flush_run( $run, $blocks );

        return $blocks;
    }

    private function is_inline( DOMNode $node ) {
        if ( XML_TEXT_NODE === $node->nodeType ) {
            return true;
        }
        return XML_ELEMENT_NODE === $node->nodeType && in_array( strtolower( $node->nodeName ), self::INLINE_TAGS, true );
    }

    /** Turn a run of inline nodes (text and phrasing elements) into one block. */
    private function flush_run( array $run, array &$blocks ) {
        $nodes = array_values( array_filter( $run, function ( $node ) {
            return ! ( XML_TEXT_NODE === $node->nodeType && '' === trim( $node->nodeValue ) );
        } ) );
        if ( ! $nodes ) {
            return;
        }

        if ( 1 === count( $nodes ) && $this->is_element( $nodes[0], 'img' ) ) {
            $blocks[] = $this->image( $nodes[0] );
            return;
        }

        if ( $this->all_buttons( $nodes ) ) {
            $blocks[] = $this->buttons( $nodes );
            return;
        }

        $text = trim( preg_replace( '/\s+/u', ' ', implode( '', array_map( function ( $n ) {
            return $n->textContent;
        }, $nodes ) ) ) );

        if ( '' === $text ) {
            $blocks[] = $this->fallback_nodes( $nodes );
            return;
        }

        $rich = $this->rich_nodes( $nodes );
        if ( null === $rich || '' === trim( $rich ) ) {
            $blocks[] = $this->fallback_nodes( $nodes );
            return;
        }

        $blocks[] = $this->block( 'paragraph', array(), '<p>' . trim( $rich ) . '</p>' );
    }

    /** Markup blocks for one block-level element. */
    private function element_blocks( DOMElement $el ) {
        $tag = strtolower( $el->nodeName );

        if ( $el->hasAttribute( 'data-snn-raw' ) ) {
            return array( $this->fallback( $el ) );
        }
        if ( $this->needs_html( $el ) ) {
            return array( $this->fallback( $el ) );
        }

        switch ( $tag ) {
            case 'h1':
            case 'h2':
            case 'h3':
            case 'h4':
            case 'h5':
            case 'h6':
                return array( $this->heading( $el ) );

            case 'p':
                return array_filter( array( $this->paragraph( $el ) ) );

            case 'ul':
            case 'ol':
                return array( $this->list_block( $el ) );

            case 'blockquote':
                return array( $this->quote( $el ) );

            case 'figure':
                return array( $this->figure( $el ) );

            case 'hr':
                list( $attrs, $classes ) = $this->common( $el );
                return array( $this->block( 'separator', $attrs, '<hr' . $this->class_attr( array_merge( array( 'wp-block-separator', 'has-alpha-channel-opacity' ), $classes ) ) . $this->id_attr( $attrs ) . '/>' ) );

            case 'pre':
                return array( $this->code( $el ) );

            case 'table':
                return array( $this->table( $el ) );

            case 'details':
                return array( $this->details( $el ) );

            case 'div':
            case 'section':
            case 'header':
            case 'footer':
            case 'main':
            case 'article':
            case 'aside':
                return array( $this->container( $el ) );
        }

        return array( $this->fallback( $el ) );
    }

    /** Elements and attributes that a native block cannot keep, so the element stays as HTML. */
    private function needs_html( DOMElement $el ) {
        $tag = strtolower( $el->nodeName );
        if ( in_array( $tag, array( 'nav', 'form', 'iframe', 'video', 'audio', 'canvas', 'object', 'embed', 'picture', 'template', 'dialog', 'dl', 'noscript', 'math', 'select', 'textarea', 'input', 'button', 'svg' ), true ) ) {
            return true;
        }
        if ( $el->hasAttribute( 'hidden' ) ) {
            return true;
        }
        foreach ( $el->attributes as $attr ) {
            $name = strtolower( $attr->nodeName );
            if ( 0 === strpos( $name, 'data-' ) && 'data-snn-raw' !== $name ) {
                return true;
            }
            if ( 0 === strpos( $name, 'on' ) ) {
                $this->dropped_attr++;
                return true;
            }
        }
        return false;
    }

    private function is_element( DOMNode $node, $tag ) {
        return XML_ELEMENT_NODE === $node->nodeType && strtolower( $node->nodeName ) === $tag;
    }

    /* ----------------------------------------------------------------------
     * Block builders
     * ------------------------------------------------------------------- */

    private function heading( DOMElement $el ) {
        $level = (int) substr( strtolower( $el->nodeName ), 1 );
        $rich  = $this->rich_nodes( iterator_to_array( $el->childNodes ) );
        if ( null === $rich ) {
            return $this->fallback( $el );
        }
        list( $attrs, $classes ) = $this->common( $el );
        if ( 2 !== $level ) {
            $attrs = array( 'level' => $level ) + $attrs;
        }
        $tag = 'h' . $level;
        $html = '<' . $tag . $this->class_attr( array_merge( array( 'wp-block-heading' ), $classes ) ) . $this->id_attr( $attrs ) . '>' . trim( $rich ) . '</' . $tag . '>';
        return $this->block( 'heading', $attrs, $html );
    }

    private function paragraph( DOMElement $el ) {
        $children = iterator_to_array( $el->childNodes );
        $meaningful = array_filter( $children, function ( $n ) {
            return ! ( XML_TEXT_NODE === $n->nodeType && '' === trim( $n->nodeValue ) ) && XML_COMMENT_NODE !== $n->nodeType;
        } );
        if ( 1 === count( $meaningful ) && $this->is_element( reset( $meaningful ), 'img' ) ) {
            return $this->image( reset( $meaningful ), $el );
        }
        if ( ! $this->only_inline( $children ) ) {
            return $this->fallback( $el );
        }
        $rich = $this->rich_nodes( $children );
        if ( null === $rich ) {
            return $this->fallback( $el );
        }
        if ( '' === trim( strip_tags( $rich ) ) && false === strpos( $rich, '<br' ) ) {
            return null;
        }
        list( $attrs, $classes ) = $this->common( $el );
        $html = '<p' . $this->class_attr( $classes ) . $this->id_attr( $attrs ) . '>' . trim( $rich ) . '</p>';
        return $this->block( 'paragraph', $attrs, $html );
    }

    private function list_block( DOMElement $el ) {
        $tag     = strtolower( $el->nodeName );
        $ordered = 'ol' === $tag;
        list( $attrs, $classes ) = $this->common( $el );
        if ( $ordered ) {
            $attrs = array( 'ordered' => true ) + $attrs;
        }

        $items = array();
        foreach ( iterator_to_array( $el->childNodes ) as $li ) {
            if ( XML_TEXT_NODE === $li->nodeType && '' === trim( $li->nodeValue ) ) {
                continue;
            }
            if ( ! $this->is_element( $li, 'li' ) || $li->hasAttributes() ) {
                return $this->fallback( $el );
            }
            $inline = array();
            $nested = array();
            foreach ( iterator_to_array( $li->childNodes ) as $child ) {
                if ( $this->is_element( $child, 'ul' ) || $this->is_element( $child, 'ol' ) ) {
                    $nested[] = $this->list_block( $child );
                } else {
                    $inline[] = $child;
                }
            }
            $rich = $this->rich_nodes( $inline );
            if ( null === $rich ) {
                return $this->fallback( $el );
            }
            $inner = '<li>' . trim( $rich ) . ( $nested ? "\n" . implode( "\n", $nested ) . "\n" : '' ) . '</li>';
            $items[] = $this->block( 'list-item', array(), $inner );
        }

        $html = '<' . $tag . $this->class_attr( array_merge( array( 'wp-block-list' ), $classes ) ) . $this->id_attr( $attrs ) . '>' . implode( "\n", $items ) . '</' . $tag . '>';
        return $this->block( 'list', $attrs, $html );
    }

    private function quote( DOMElement $el ) {
        list( $attrs, $classes ) = $this->common( $el );
        $citation = null;
        $body     = array();
        foreach ( iterator_to_array( $el->childNodes ) as $child ) {
            if ( $this->is_element( $child, 'cite' ) ) {
                $citation = $this->rich_nodes( iterator_to_array( $child->childNodes ) );
                if ( null === $citation ) {
                    return $this->fallback( $el );
                }
            } else {
                $body[] = $child;
            }
        }
        $inner_blocks = $this->nodes_to_blocks( $body );
        $html = '<blockquote' . $this->class_attr( array_merge( array( 'wp-block-quote' ), $classes ) ) . $this->id_attr( $attrs ) . '>'
            . implode( "\n\n", $inner_blocks )
            . ( null !== $citation && '' !== trim( $citation ) ? '<cite>' . trim( $citation ) . '</cite>' : '' )
            . '</blockquote>';
        return $this->block( 'quote', $attrs, $html );
    }

    /** figure holding one img and optionally one figcaption. Anything else stays HTML. */
    private function figure( DOMElement $el ) {
        $img     = null;
        $caption = '';
        foreach ( iterator_to_array( $el->childNodes ) as $child ) {
            if ( XML_TEXT_NODE === $child->nodeType && '' === trim( $child->nodeValue ) ) {
                continue;
            }
            if ( XML_COMMENT_NODE === $child->nodeType ) {
                continue;
            }
            if ( $this->is_element( $child, 'img' ) && null === $img ) {
                $img = $child;
            } elseif ( $this->is_element( $child, 'figcaption' ) && '' === $caption ) {
                $caption = $this->rich_nodes( iterator_to_array( $child->childNodes ) );
                if ( null === $caption ) {
                    return $this->fallback( $el );
                }
            } else {
                return $this->fallback( $el );
            }
        }
        if ( null === $img ) {
            return $this->fallback( $el );
        }
        return $this->image( $img, $el, $caption );
    }

    /** core/image. $wrapper supplies the figure classes and anchor when the image sits in a figure or p. */
    private function image( DOMElement $img, $wrapper = null, $caption = null ) {
        $src = trim( (string) $img->getAttribute( 'src' ) );
        if ( '' === $src ) {
            return $this->fallback( $img );
        }
        $alt     = (string) $img->getAttribute( 'alt' );
        $attrs   = array();
        $source  = $wrapper ?: $img;
        list( $common, $classes ) = $this->common( $source );
        $attrs   = $common;

        $id = (int) attachment_url_to_postid( $src );
        $img_classes = array();
        $figure_classes = array_merge( array( 'wp-block-image' ), $classes );
        if ( $id > 0 ) {
            $attrs = array( 'id' => $id, 'sizeSlug' => 'full' ) + $attrs;
            $figure_classes[] = 'size-full';
            $img_classes[]    = 'wp-image-' . $id;
        }

        $img_attrs = ' src="' . $this->attr( $src ) . '" alt="' . $this->attr( $alt ) . '"';
        if ( $img_classes ) {
            $img_attrs .= ' class="' . implode( ' ', $img_classes ) . '"';
        }
        foreach ( array( 'width', 'height' ) as $dim ) {
            if ( preg_match( '/^\d+$/', (string) $img->getAttribute( $dim ) ) ) {
                $img_attrs .= ' ' . $dim . '="' . (int) $img->getAttribute( $dim ) . '"';
            }
        }

        $inner = '<figure' . $this->class_attr( $figure_classes ) . $this->id_attr( $attrs ) . '><img' . $img_attrs . '/>';
        if ( null !== $caption && '' !== trim( $caption ) ) {
            $inner .= '<figcaption class="wp-element-caption">' . trim( $caption ) . '</figcaption>';
        }
        $inner .= '</figure>';
        return $this->block( 'image', $attrs, $inner );
    }

    private function code( DOMElement $el ) {
        list( $attrs, $classes ) = $this->common( $el );
        $code = $el->getElementsByTagName( 'code' )->item( 0 );
        $text = $code ? $code->textContent : $el->textContent;
        $html = '<pre' . $this->class_attr( array_merge( array( 'wp-block-code' ), $classes ) ) . $this->id_attr( $attrs ) . '><code>' . htmlspecialchars( $text, ENT_NOQUOTES, 'UTF-8' ) . '</code></pre>';
        return $this->block( 'code', $attrs, $html );
    }

    private function table( DOMElement $el ) {
        list( $attrs, $classes ) = $this->common( $el );
        $sections = array();
        foreach ( iterator_to_array( $el->childNodes ) as $child ) {
            if ( XML_ELEMENT_NODE !== $child->nodeType ) {
                continue;
            }
            $name = strtolower( $child->nodeName );
            if ( 'tr' === $name ) {
                $sections['tbody'][] = $child;
            } elseif ( in_array( $name, array( 'thead', 'tbody', 'tfoot' ), true ) ) {
                foreach ( iterator_to_array( $child->childNodes ) as $row ) {
                    if ( $this->is_element( $row, 'tr' ) ) {
                        $sections[ $name ][] = $row;
                    }
                }
            } else {
                return $this->fallback( $el );
            }
        }

        $body = '';
        foreach ( array( 'thead', 'tbody', 'tfoot' ) as $name ) {
            if ( empty( $sections[ $name ] ) ) {
                continue;
            }
            $rows = '';
            foreach ( $sections[ $name ] as $tr ) {
                $cells = '';
                foreach ( iterator_to_array( $tr->childNodes ) as $cell ) {
                    if ( XML_TEXT_NODE === $cell->nodeType && '' === trim( $cell->nodeValue ) ) {
                        continue;
                    }
                    if ( ! $this->is_element( $cell, 'td' ) && ! $this->is_element( $cell, 'th' ) ) {
                        return $this->fallback( $el );
                    }
                    if ( $cell->hasAttribute( 'colspan' ) || $cell->hasAttribute( 'rowspan' ) ) {
                        return $this->fallback( $el );
                    }
                    $rich = $this->rich_nodes( iterator_to_array( $cell->childNodes ) );
                    if ( null === $rich ) {
                        return $this->fallback( $el );
                    }
                    $cell_tag = strtolower( $cell->nodeName );
                    $cells   .= '<' . $cell_tag . '>' . trim( $rich ) . '</' . $cell_tag . '>';
                }
                $rows .= '<tr>' . $cells . '</tr>';
            }
            $body .= '<' . $name . '>' . $rows . '</' . $name . '>';
        }

        $html = '<figure' . $this->class_attr( array_merge( array( 'wp-block-table' ), $classes ) ) . $this->id_attr( $attrs ) . '><table>' . $body . '</table></figure>';
        return $this->block( 'table', $attrs, $html );
    }

    private function details( DOMElement $el ) {
        list( $attrs, $classes ) = $this->common( $el );
        $summary = null;
        $body    = array();
        foreach ( iterator_to_array( $el->childNodes ) as $child ) {
            if ( null === $summary && $this->is_element( $child, 'summary' ) ) {
                $summary = $this->rich_nodes( iterator_to_array( $child->childNodes ) );
                if ( null === $summary ) {
                    return $this->fallback( $el );
                }
                continue;
            }
            $body[] = $child;
        }
        if ( $el->hasAttribute( 'open' ) ) {
            $attrs['showContent'] = true;
        }
        $html = '<details' . $this->class_attr( array_merge( array( 'wp-block-details' ), $classes ) ) . $this->id_attr( $attrs ) . ( $el->hasAttribute( 'open' ) ? ' open' : '' ) . '>'
            . '<summary>' . trim( (string) $summary ) . '</summary>'
            . implode( "\n\n", $this->nodes_to_blocks( $body ) )
            . '</details>';
        return $this->block( 'details', $attrs, $html );
    }

    /** div, section, header, footer, main, article, aside: a group, or a paragraph when they only hold text. */
    private function container( DOMElement $el ) {
        $tag      = strtolower( $el->nodeName );
        $children = iterator_to_array( $el->childNodes );

        $links = array_values( array_filter( $children, function ( $n ) {
            return ! ( XML_TEXT_NODE === $n->nodeType && '' === trim( $n->nodeValue ) ) && XML_COMMENT_NODE !== $n->nodeType;
        } ) );
        if ( $links && $this->all_buttons( $links ) ) {
            return $this->buttons( $links, $el );
        }

        if ( $this->only_inline( $children ) ) {
            $meaningful = array_filter( $children, function ( $n ) {
                return ! ( XML_TEXT_NODE === $n->nodeType && '' === trim( $n->nodeValue ) ) && XML_COMMENT_NODE !== $n->nodeType;
            } );
            if ( 1 === count( $meaningful ) && $this->is_element( reset( $meaningful ), 'img' ) ) {
                return $this->image( reset( $meaningful ), $el );
            }
            // Several inline elements in one box (a number and its label, for example) are laid out by CSS,
            // so they stay as HTML; joining them into one paragraph would lose the layout.
            $elements = array_filter( $meaningful, function ( $n ) {
                return XML_ELEMENT_NODE === $n->nodeType;
            } );
            if ( count( $elements ) >= 2 ) {
                return $this->fallback( $el );
            }
            $text = trim( preg_replace( '/\s+/u', ' ', $el->textContent ) );
            if ( '' !== $text ) {
                $rich = $this->rich_nodes( $children );
                if ( null !== $rich ) {
                    list( $attrs, $classes ) = $this->common( $el );
                    return $this->block( 'paragraph', $attrs, '<p' . $this->class_attr( $classes ) . $this->id_attr( $attrs ) . '>' . trim( $rich ) . '</p>' );
                }
            }
            return $this->fallback( $el );
        }

        $inner = $this->nodes_to_blocks( $children );
        if ( ! $inner ) {
            return $this->fallback( $el );
        }

        list( $attrs, $classes ) = $this->common( $el );
        $wrap = in_array( $tag, self::GROUP_TAGS, true ) ? $tag : 'div';
        if ( 'div' !== $wrap ) {
            $attrs = array( 'tagName' => $wrap ) + $attrs;
        }
        $html = '<' . $wrap . $this->class_attr( array_merge( array( 'wp-block-group' ), $classes ) ) . $this->id_attr( $attrs ) . '>'
            . implode( "\n\n", $inner )
            . '</' . $wrap . '>';
        return $this->block( 'group', $attrs, $html );
    }

    /** core/buttons with one core/button per link. $wrapper, when given, is the element that held the links. */
    private function buttons( array $links, DOMElement $wrapper = null ) {
        $buttons = array();
        foreach ( $links as $link ) {
            list( $attrs, $classes ) = $this->common( $link );
            $text = trim( preg_replace( '/\s+/u', ' ', $link->textContent ) );
            $href = (string) $link->getAttribute( 'href' );
            $html = '<div' . $this->class_attr( array_merge( array( 'wp-block-button' ), $classes ) ) . $this->id_attr( $attrs ) . '>'
                . '<a class="wp-block-button__link wp-element-button" href="' . $this->attr( $href ) . '">' . htmlspecialchars( $text, ENT_NOQUOTES, 'UTF-8' ) . '</a></div>';
            $buttons[] = $this->block( 'button', $attrs, $html );
        }

        $attrs   = array();
        $classes = array();
        if ( $wrapper ) {
            list( $attrs, $classes ) = $this->common( $wrapper );
        }
        $html = '<div' . $this->class_attr( array_merge( array( 'wp-block-buttons' ), $classes ) ) . $this->id_attr( $attrs ) . '>' . implode( "\n", $buttons ) . '</div>';
        return $this->block( 'buttons', $attrs, $html );
    }

    /** True when every node is a link with the btn class and text-only content. Icons (svg, img) keep the link as HTML. */
    private function all_buttons( array $nodes ) {
        foreach ( $nodes as $node ) {
            if ( XML_TEXT_NODE === $node->nodeType && '' === trim( $node->nodeValue ) ) {
                continue;
            }
            if ( ! $this->is_element( $node, 'a' ) || ! preg_match( '/(^|\s)btn(\s|$)/', (string) $node->getAttribute( 'class' ) ) ) {
                return false;
            }
            foreach ( iterator_to_array( $node->getElementsByTagName( '*' ) ) as $child ) {
                // An svg inside the link shows up as a raw-SVG placeholder span, so that counts as an icon too.
                if ( ! in_array( strtolower( $child->nodeName ), array( 'span', 'strong', 'em' ), true ) || $child->hasAttribute( 'data-snn-raw' ) ) {
                    return false;
                }
            }
        }
        return true;
    }

    /** Raw HTML of the given nodes, in a Custom HTML block. */
    private function fallback_nodes( array $nodes ) {
        $this->fallbacks++;
        $html = '';
        foreach ( $nodes as $node ) {
            $html .= $this->doc->saveHTML( $node );
        }
        return $this->block( 'html', array(), $this->restore_raw( $html ) );
    }

    private function fallback( DOMNode $node ) {
        $this->fallbacks++;
        return $this->block( 'html', array(), $this->restore_raw( $this->doc->saveHTML( $node ) ) );
    }

    private function restore_raw( $html ) {
        return preg_replace_callback(
            '#<span data-snn-raw="(\d+)"></span>#',
            function ( $m ) {
                return $this->raw_svg[ (int) $m[1] ] ?? '';
            },
            trim( $html )
        );
    }

    /* ----------------------------------------------------------------------
     * Rich text
     * ------------------------------------------------------------------- */

    /** True when every node is text or an inline tag without block content. */
    private function only_inline( array $nodes ) {
        foreach ( $nodes as $node ) {
            if ( XML_COMMENT_NODE === $node->nodeType || XML_TEXT_NODE === $node->nodeType ) {
                continue;
            }
            if ( XML_ELEMENT_NODE !== $node->nodeType || ! in_array( strtolower( $node->nodeName ), self::INLINE_TAGS, true ) ) {
                return false;
            }
        }
        return true;
    }

    /**
     * Rich-text HTML for inline nodes, or null when a node cannot be kept as rich text.
     * Keeps a, code, em, strong, s, sub, sup, span, br. Elements with a class or style
     * become spans (so the class is kept), and styles move to generated classes.
     */
    private function rich_nodes( array $nodes ) {
        $out = '';
        foreach ( $nodes as $node ) {
            if ( XML_COMMENT_NODE === $node->nodeType ) {
                continue;
            }
            if ( XML_TEXT_NODE === $node->nodeType ) {
                $out .= htmlspecialchars( preg_replace( '/\s+/u', ' ', $node->nodeValue ), ENT_NOQUOTES, 'UTF-8' );
                continue;
            }
            if ( XML_ELEMENT_NODE !== $node->nodeType ) {
                continue;
            }

            $tag = strtolower( $node->nodeName );
            if ( isset( self::RICH_ALIAS[ $tag ] ) ) {
                $tag = self::RICH_ALIAS[ $tag ];
            }
            if ( in_array( $tag, array( 'button', 'img', 'svg', 'input', 'select', 'textarea', 'label', 'small', 'mark', 'u', 'abbr', 'cite', 'q', 'time', 'kbd', 'var', 'samp', 'bdi', 'bdo', 'dfn', 'ins', 'wbr' ), true ) ) {
                return null;
            }
            if ( ! in_array( $tag, self::RICH_TAGS, true ) || $this->needs_html( $node ) ) {
                return null;
            }

            if ( 'br' === $tag ) {
                $out .= '<br>';
                continue;
            }

            $attrs   = '';
            $classes = $this->classes( $node );
            $this->style_class( $node, $classes );

            if ( 'a' === $tag ) {
                if ( $classes || preg_match( '#^\s*javascript:#i', (string) $node->getAttribute( 'href' ) ) ) {
                    return null;
                }
                foreach ( self::RICH_ATTRS as $name ) {
                    if ( '' !== $node->getAttribute( $name ) ) {
                        $attrs .= ' ' . $name . '="' . $this->attr( $node->getAttribute( $name ) ) . '"';
                    }
                }
            } elseif ( $classes ) {
                // Anything that carries a class or style is kept as a span, so the look survives.
                $tag = 'span';
            }

            if ( 'span' === $tag && ! $classes ) {
                $inner = $this->rich_nodes( iterator_to_array( $node->childNodes ) );
                if ( null === $inner ) {
                    return null;
                }
                $out .= $inner;
                continue;
            }

            if ( $classes ) {
                $attrs = ' class="' . implode( ' ', $classes ) . '"' . $attrs;
            }

            $inner = $this->rich_nodes( iterator_to_array( $node->childNodes ) );
            if ( null === $inner ) {
                return null;
            }
            $out .= '<' . $tag . $attrs . '>' . $inner . '</' . $tag . '>';
        }
        return $out;
    }

    /* ----------------------------------------------------------------------
     * Attributes, classes and styles
     * ------------------------------------------------------------------- */

    /** Attributes common to the block-level builders: className, anchor and the generated style class. Returns [attrs, classes]. */
    private function common( DOMElement $el ) {
        $classes = $this->classes( $el );
        $this->style_class( $el, $classes );

        $attrs = array();
        $id    = trim( (string) $el->getAttribute( 'id' ) );
        if ( '' !== $id && preg_match( '/^[A-Za-z][A-Za-z0-9_\-:.]*$/', $id ) ) {
            $attrs['anchor'] = $id;
        }
        if ( $classes ) {
            $attrs['className'] = implode( ' ', $classes );
        }
        foreach ( array( 'aria-label', 'role', 'tabindex', 'title' ) as $name ) {
            if ( $el->hasAttribute( $name ) ) {
                $this->dropped_attr++;
            }
        }
        return array( $attrs, $classes );
    }

    /** Usable classes of an element. Classes WordPress writes itself are left out. */
    private function classes( DOMElement $el ) {
        $out = array();
        foreach ( preg_split( '/\s+/', trim( (string) $el->getAttribute( 'class' ) ), -1, PREG_SPLIT_NO_EMPTY ) as $class ) {
            if ( preg_match( '/^(wp-block-|wp-element-|wp-image-|is-layout-|has-alpha-channel)/', $class ) ) {
                continue;
            }
            if ( preg_match( '/^[A-Za-z_-][A-Za-z0-9_-]*$/', $class ) ) {
                $out[] = $class;
            } else {
                $this->warnings[] = 'Class dropped (not a plain class name): ' . $class;
            }
        }
        return array_values( array_unique( $out ) );
    }

    /** Move an inline style into a generated class. Adds the class to $classes. */
    private function style_class( DOMElement $el, array &$classes ) {
        $style = trim( (string) $el->getAttribute( 'style' ) );
        if ( '' === $style ) {
            return;
        }
        $style = trim( preg_replace( '/\s+/', ' ', str_replace( array( '<', '>', '{', '}', '@' ), '', $style ) ), " ;\t" );
        if ( '' === $style ) {
            return;
        }
        $class                    = 'snn-' . substr( md5( $style ), 0, 8 );
        $this->css_rules[ $class ] = $style;
        $classes[]                 = $class;
    }

    private function class_attr( array $classes ) {
        $classes = array_values( array_unique( array_filter( $classes ) ) );
        return $classes ? ' class="' . implode( ' ', $classes ) . '"' : '';
    }

    private function id_attr( array $attrs ) {
        return isset( $attrs['anchor'] ) ? ' id="' . $this->attr( $attrs['anchor'] ) . '"' : '';
    }

    private function attr( $value ) {
        return htmlspecialchars( (string) $value, ENT_QUOTES, 'UTF-8' );
    }

    /** One block: its comment delimiters around the given markup. Attributes are written as JSON. */
    private function block( $name, array $attrs, $inner ) {
        $key                 = 'core/' . $name;
        $this->counts[ $key ] = ( $this->counts[ $key ] ?? 0 ) + 1;

        $json = $attrs ? ' ' . wp_json_encode( $attrs, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_HEX_TAG | JSON_HEX_AMP ) : '';
        return '<!-- wp:' . $name . $json . " -->\n" . $inner . "\n<!-- /wp:" . $name . ' -->';
    }
}
