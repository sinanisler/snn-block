<?php
/**
 * HTML to our own blocks (the converter's "snn" mode, the default for MCP).
 *
 * Every element of the design becomes one of our blocks, so the page opens in our panel and each part can be edited:
 *
 *   section, header, footer, main, article, aside, nav  Section at the top of the page, Div inside (with that tag)
 *   div wrappers                                        Div; the first div wrapper inside a Section is a Container
 *   a wrapping blocks (a card)                          Div or Container with the a tag and a link
 *   h1-h6, p, span, and boxes of text only              Text with that tag; the inline formats are kept
 *   ul, ol                                              Text with the div tag, holding the list
 *   links and buttons with a text (and an icon)         Button (link URL, icon, its position)
 *   i.fa-*, i.ti-*, i.ion-*, small inline SVGs          Icon (an element holding only an icon is the Icon itself)
 *   img, figure with one img                            Image (URL, alt text, caption)
 *   form, iframe, table, video, canvas, details, ...    Code, printed without a wrapper, exactly as written
 *   anything else                                       Code, and the tag is listed in the report
 *
 * The design's classes go in cssClasses and its id in htmlId (every block gets an ID, as the editor gives one). Other
 * attributes (data-*, aria-*, role) go in customAttributes. Each block starts with display block, so nothing inline
 * is written and the design's CSS decides the layout. Buttons get the snn-plain class: no starting look, the design's
 * CSS draws them. The <style> of the design and its inline styles become page CSS, as in the other modes (see
 * html-to-blocks.php); mapping CSS into block settings is a later step.
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

class SNN_HTML_To_Snn_Blocks {

    /** Tags of the layout blocks (Section, Container, Div). */
    const LAYOUT_TAGS = array( 'section', 'div', 'header', 'footer', 'main', 'article', 'aside', 'nav' );

    /** Layout tags that make a section of the page. A top-level wrapper holding these is a Div, not a Section. */
    const SECTION_LIKE = array( 'section', 'header', 'footer', 'nav', 'article', 'aside', 'main' );

    /** Tags a Text block can be. */
    const TEXT_TAGS = array( 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'div', 'span' );

    /** Inline tags a Text keeps in its content. */
    const RICH_TAGS = array( 'a', 'abbr', 'b', 'bdi', 'bdo', 'br', 'cite', 'code', 'del', 'dfn', 'em', 'i', 'ins', 'kbd', 'mark', 'q', 's', 'samp', 'small', 'span', 'strike', 'strong', 'sub', 'sup', 'time', 'u', 'var', 'wbr' );

    /** Attributes an inline tag keeps in a Text (besides class, id, aria-* and data-*). */
    const RICH_ATTRS = array( 'href', 'target', 'rel', 'title', 'datetime', 'lang', 'dir', 'cite' );

    /** Tags that are kept as written, in a Code block. */
    const CODE_TAGS = array( 'form', 'iframe', 'table', 'video', 'audio', 'canvas', 'details', 'dl', 'picture', 'select', 'textarea', 'input', 'blockquote', 'pre', 'object', 'embed', 'dialog', 'template', 'math', 'noscript', 'hr', 'br', 'label', 'fieldset', 'map', 'progress', 'meter', 'output', 'menu' );

    /** Font Awesome classes that are not an icon name. */
    const FA_MODIFIERS = '/^fa-(solid|regular|brands|light|thin|duotone|fw|lg|xs|sm|xl|2xs|2xl|\d+x|spin|spin-pulse|pulse|beat|fade|bounce|flip|shake|border|pull-left|pull-right|inverse|stack|stack-1x|stack-2x|rotate-\d+|flip-horizontal|flip-vertical|li|ul)$/';

    /** An SVG wider or taller than this (its width or height attribute) is a picture, not an icon: it stays in a Code block. */
    const ICON_MAX = 64;

    /** @var SNN_HTML_To_Blocks */
    private $c;
    private $ids        = array();
    private $code       = 0;
    private $code_tags  = array();
    private $unknown    = array();
    private $dropped    = array();

    public static function convert_nodes( SNN_HTML_To_Blocks $converter, array $nodes ) {
        $self = new self( $converter );
        // The design's own IDs are taken first, so a generated ID never repeats one of them.
        foreach ( $nodes as $node ) {
            if ( $node instanceof DOMElement ) {
                $self->reserve_ids( $node );
            }
        }
        $blocks = $self->children( $nodes, 'root' );
        $converter->set_report( 'code_fallbacks', $self->code );
        $converter->set_report( 'code_tags', $self->code_tags );
        $converter->set_report( 'unknown_tags', $self->unknown );
        $converter->set_report( 'dropped', array_values( array_unique( $self->dropped ) ) );
        return $blocks;
    }

    private function __construct( SNN_HTML_To_Blocks $converter ) {
        $this->c = $converter;
    }

    /* ----------------------------------------------------------------------
     * The tree
     * ------------------------------------------------------------------- */

    /**
     * Blocks for sibling nodes. $ctx: root (the page), section (inside a Section) or inner. Inside a Section the first
     * div wrapper is its Container.
     */
    private function children( array $nodes, $ctx ) {
        $out       = array();
        $container = 'section' !== $ctx;
        foreach ( $nodes as $node ) {
            if ( XML_TEXT_NODE === $node->nodeType ) {
                $text = trim( preg_replace( '/\s+/u', ' ', $node->nodeValue ) );
                if ( '' !== $text ) {
                    $out[] = $this->text_block( null, 'span', htmlspecialchars( $text, ENT_NOQUOTES, 'UTF-8' ) );
                }
                continue;
            }
            if ( ! $node instanceof DOMElement ) {
                continue;
            }
            $first = false;
            if ( ! $container && 'div' === strtolower( $node->nodeName ) && $this->is_layout( $node ) ) {
                $first     = true;
                $container = true;
            }
            foreach ( $this->element( $node, $ctx, $first ) as $block ) {
                $out[] = $block;
            }
        }
        return $out;
    }

    /** Blocks for one element. */
    private function element( DOMElement $el, $ctx, $first = false ) {
        $tag = strtolower( $el->nodeName );

        if ( $el->hasAttribute( 'data-snn-raw' ) ) {
            return array( $this->svg( $el ) );
        }
        if ( in_array( $tag, array( 'script', 'style', 'link', 'meta', 'title', 'base' ), true ) ) {
            return array();
        }
        if ( 'img' === $tag ) {
            return array( $this->image( $el ) );
        }
        if ( 'figure' === $tag ) {
            return array( $this->figure( $el ) );
        }
        if ( 'a' === $tag ) {
            return array( $this->link( $el, $ctx ) );
        }
        if ( 'button' === $tag ) {
            return array( $this->button( $el, null ) );
        }
        if ( in_array( $tag, array( 'ul', 'ol' ), true ) ) {
            return array( $this->list_block( $el ) );
        }
        if ( in_array( $tag, self::CODE_TAGS, true ) ) {
            return array( $this->code( $el, $tag ) );
        }
        $icon = $this->only_icon( $el );
        if ( null !== $icon && in_array( $tag, array( 'i', 'span', 'div' ), true ) ) {
            return array( $this->icon_block( $el, $icon ) );
        }

        if ( in_array( $tag, self::LAYOUT_TAGS, true ) ) {
            if ( ! $this->significant( $el ) ) {
                // An empty box (a shape drawn by CSS): kept as written, so the editor draws it as the front end does.
                return array( $this->code( $el, 'empty ' . $tag ) );
            }
            if ( 'div' === $tag && $this->text_like( $el ) ) {
                return array( $this->text_from( $el, 'div' ) );
            }
            if ( $this->only_inline( $el ) && '' === trim( $el->textContent ) ) {
                // Decoration made of empty inline elements (orbs, dots, lines).
                return array( $this->code( $el, 'decoration' ) );
            }
            return array( $this->layout( $el, $ctx, $first ) );
        }

        if ( in_array( $tag, self::TEXT_TAGS, true ) ) {
            $rich = $this->rich( iterator_to_array( $el->childNodes ) );
            if ( null === $rich ) {
                return array( $this->code( $el, $tag . ' with blocks inside' ) );
            }
            if ( '' === trim( $el->textContent ) && false === strpos( $rich, '<br' ) ) {
                // No words: a shape or a dot drawn by CSS. A Text would show its placeholder in the editor.
                return array( $this->code( $el, 'empty ' . $tag ) );
            }
            return array( $this->text_from( $el, $tag ) );
        }

        if ( in_array( $tag, self::RICH_TAGS, true ) ) {
            // A formatting element on its own (b, em, small): a Text span that holds it.
            $rich = $this->rich( array( $el ) );
            if ( null !== $rich && '' !== trim( $el->textContent ) ) {
                return array( $this->text_block( null, 'span', $rich ) );
            }
            return array( $this->code( $el, $tag ) );
        }

        $this->unknown[ $tag ] = ( $this->unknown[ $tag ] ?? 0 ) + 1;
        return array( $this->code( $el, 'unknown ' . $tag ) );
    }

    /** Section (at the top), Container (the first div in a Section) or Div, with the element's tag and its children. */
    private function layout( DOMElement $el, $ctx, $first, array $link = array() ) {
        $tag   = strtolower( $el->nodeName );
        $child = 'inner';
        if ( 'root' === $ctx ) {
            // A page wrapper (main, or a div) around the sections is a Div, and its sections stay Sections.
            if ( in_array( $tag, array( 'div', 'main' ), true ) && $this->has_section_child( $el ) ) {
                $name  = 'snn/div';
                $child = 'root';
            } else {
                $name  = 'snn/section';
                $child = 'section';
            }
        } else {
            $name = $first ? 'snn/container' : 'snn/div';
        }
        $skip  = $link ? array( 'href', 'target', 'rel' ) : array();
        $attrs = $this->common( $el, $name, $skip );
        $attrs = array( 'tagName' => $link ? 'a' : $tag, 'display' => 'block' ) + $attrs + $link;
        if ( 'snn/section' === $name && $link ) {
            $name = 'snn/div'; // a Section has no link
        }
        return $this->wrap( $name, $attrs, $this->children( iterator_to_array( $el->childNodes ), $child ) );
    }

    private function has_section_child( DOMElement $el ) {
        foreach ( $el->childNodes as $child ) {
            if ( $child instanceof DOMElement && in_array( strtolower( $child->nodeName ), self::SECTION_LIKE, true ) ) {
                return true;
            }
        }
        return false;
    }

    /** A box that only holds text (and inline formats): it becomes one Text. A box of links without text of its own is a layout. */
    private function text_like( DOMElement $el ) {
        if ( ! $this->only_inline( $el ) || '' === trim( $el->textContent ) ) {
            return false;
        }
        $own_text = false;
        $links    = false;
        foreach ( $el->childNodes as $child ) {
            if ( XML_TEXT_NODE === $child->nodeType && '' !== trim( $child->nodeValue ) ) {
                $own_text = true;
            }
            if ( $child instanceof DOMElement && in_array( strtolower( $child->nodeName ), array( 'a', 'button' ), true ) ) {
                $links = true;
            }
        }
        return ( $own_text || ! $links ) && null !== $this->rich( iterator_to_array( $el->childNodes ) );
    }

    /** True when every child is text or an inline element a Text can hold. */
    private function only_inline( DOMElement $el ) {
        foreach ( $el->childNodes as $child ) {
            if ( $child instanceof DOMElement && ( ! in_array( strtolower( $child->nodeName ), self::RICH_TAGS, true ) || $child->hasAttribute( 'data-snn-raw' ) ) ) {
                return false;
            }
        }
        return true;
    }

    private function is_layout( DOMElement $el ) {
        return $this->significant( $el ) && ! $this->text_like( $el ) && null === $this->only_icon( $el ) && ! ( $this->only_inline( $el ) && '' === trim( $el->textContent ) );
    }

    /** True when the element has an element child or some text. */
    private function significant( DOMElement $el ) {
        foreach ( $el->childNodes as $child ) {
            if ( $child instanceof DOMElement || ( XML_TEXT_NODE === $child->nodeType && '' !== trim( $child->nodeValue ) ) ) {
                return true;
            }
        }
        return false;
    }

    /** Child nodes that count: elements and text that is not only white space. */
    private function parts( DOMElement $el ) {
        $out = array();
        foreach ( $el->childNodes as $child ) {
            if ( $child instanceof DOMElement || ( XML_TEXT_NODE === $child->nodeType && '' !== trim( $child->nodeValue ) ) ) {
                $out[] = $child;
            }
        }
        return $out;
    }

    /* ----------------------------------------------------------------------
     * Text
     * ------------------------------------------------------------------- */

    private function text_from( DOMElement $el, $tag ) {
        $rich = $this->rich( iterator_to_array( $el->childNodes ) );
        return $this->text_block( $el, $tag, trim( (string) $rich ) );
    }

    private function text_block( $el, $tag, $content ) {
        $attrs = $el ? $this->common( $el, 'snn/text' ) : $this->common( null, 'snn/text' );
        $this->c->note_text();
        return $this->leaf( 'snn/text', array( 'tagName' => $tag ) + $attrs + array( 'content' => trim( $content ) ) );
    }

    /**
     * The inline HTML of nodes, for a Text: text, and the inline tags with their class, id, link and aria and data
     * attributes. Inline styles become classes. Null when a node cannot be inline text (a block, an image, an SVG).
     */
    private function rich( array $nodes ) {
        $out = '';
        foreach ( $nodes as $node ) {
            if ( XML_TEXT_NODE === $node->nodeType ) {
                $out .= htmlspecialchars( preg_replace( '/\s+/u', ' ', $node->nodeValue ), ENT_NOQUOTES, 'UTF-8' );
                continue;
            }
            if ( ! $node instanceof DOMElement ) {
                continue;
            }
            $tag = strtolower( $node->nodeName );
            if ( ! in_array( $tag, self::RICH_TAGS, true ) || $node->hasAttribute( 'data-snn-raw' ) ) {
                return null;
            }
            if ( 'br' === $tag || 'wbr' === $tag ) {
                $out .= '<' . $tag . '>';
                continue;
            }
            $inner = $this->rich( iterator_to_array( $node->childNodes ) );
            if ( null === $inner ) {
                return null;
            }
            $out .= '<' . $tag . $this->inline_attrs( $node ) . '>' . $inner . '</' . $tag . '>';
        }
        return $out;
    }

    /** The attributes an inline tag keeps, written out. */
    private function inline_attrs( DOMElement $node ) {
        $classes = $this->c->classes( $node );
        $this->c->style_class( $node, $classes );
        $out = $classes ? ' class="' . esc_attr( implode( ' ', $classes ) ) . '"' : '';
        foreach ( $node->attributes as $attr ) {
            $name = strtolower( $attr->nodeName );
            if ( in_array( $name, array( 'class', 'style' ), true ) ) {
                continue;
            }
            if ( 0 === strpos( $name, 'on' ) ) {
                $this->drop( 'on* attribute ' . $name );
                continue;
            }
            if ( 'href' === $name && preg_match( '#^\s*javascript:#i', $attr->nodeValue ) ) {
                $this->drop( 'javascript: link' );
                continue;
            }
            if ( 'id' === $name || in_array( $name, self::RICH_ATTRS, true ) || preg_match( '/^(aria|data)-[a-z0-9_-]+$/', $name ) ) {
                $out .= ' ' . $name . '="' . esc_attr( $attr->nodeValue ) . '"';
            }
        }
        return $out;
    }

    /** A list as one Text with the div tag. Items with blocks inside keep the list as written (Code). */
    private function list_block( DOMElement $el ) {
        $tag   = strtolower( $el->nodeName );
        $items = '';
        foreach ( $el->childNodes as $li ) {
            if ( XML_TEXT_NODE === $li->nodeType && '' === trim( $li->nodeValue ) ) {
                continue;
            }
            if ( ! $li instanceof DOMElement || 'li' !== strtolower( $li->nodeName ) ) {
                return $this->code( $el, $tag . ' with other children' );
            }
            $rich = $this->rich( iterator_to_array( $li->childNodes ) );
            if ( null === $rich ) {
                return $this->code( $el, $tag . ' with blocks in an item' );
            }
            $items .= '<li' . $this->inline_attrs( $li ) . '>' . trim( $rich ) . '</li>';
        }
        $html = '<' . $tag . $this->inline_attrs( $el ) . '>' . $items . '</' . $tag . '>';
        return $this->text_block( null, 'div', $html );
    }

    /* ----------------------------------------------------------------------
     * Links, buttons and icons
     * ------------------------------------------------------------------- */

    /** A link: a card (Div with the a tag), a linked picture, a linked icon, a Button, or Code when none fits. */
    private function link( DOMElement $el, $ctx ) {
        $link = $this->link_attrs( $el );
        $parts = $this->parts( $el );
        foreach ( $parts as $part ) {
            if ( $part instanceof DOMElement && ! in_array( strtolower( $part->nodeName ), array_merge( self::RICH_TAGS, array( 'img', 'svg' ) ), true ) && ! $part->hasAttribute( 'data-snn-raw' ) ) {
                return $this->layout( $el, 'root' === $ctx ? 'inner' : $ctx, false, $link );
            }
        }
        if ( 1 === count( $parts ) && $parts[0] instanceof DOMElement && 'img' === strtolower( $parts[0]->nodeName ) ) {
            return $this->image( $parts[0], $link, $el );
        }
        $icon = $this->only_icon( $el );
        if ( null !== $icon ) {
            return $this->icon_block( $el, $icon, $link );
        }
        return $this->button( $el, $link );
    }

    /** The link settings of an a: URL, new tab, rel, aria label. */
    private function link_attrs( DOMElement $el ) {
        $href = trim( (string) $el->getAttribute( 'href' ) );
        if ( preg_match( '#^\s*javascript:#i', $href ) ) {
            $this->drop( 'javascript: link' );
            $href = '';
        }
        $out = array( 'linkUrl' => $href );
        if ( '_blank' === $el->getAttribute( 'target' ) ) {
            $out['linkNewTab'] = true;
        }
        $rel = trim( preg_replace( '/\b(noopener|noreferrer)\b/', '', strtolower( (string) $el->getAttribute( 'rel' ) ) ) );
        if ( '' !== $rel ) {
            $out['linkRel'] = preg_replace( '/\s+/', ' ', $rel );
        }
        return $out;
    }

    /**
     * A Button from a link or a button element: its text (plain words, bold and italic) and one icon at its start or
     * end. A text wrapped in one plain span is taken out of it (the Button writes its own text span there). Anything
     * else keeps the element as written (Code), since the Button would draw it differently.
     */
    private function button( DOMElement $el, $link ) {
        $parts = $this->parts( $el );
        $icon  = null;
        $pos   = 'right';
        if ( $parts ) {
            foreach ( array_unique( array( 0, count( $parts ) - 1 ) ) as $i ) {
                $found = isset( $parts[ $i ] ) ? $this->icon_of( $parts[ $i ] ) : null;
                if ( null !== $found && null === $icon ) {
                    $icon = $found;
                    $pos  = 0 === $i ? 'left' : 'right';
                    unset( $parts[ $i ] );
                }
            }
        }
        $parts = array_values( $parts );
        // One span around the whole text: the Button's own text span stands in for it.
        if ( 1 === count( $parts ) && $parts[0] instanceof DOMElement && 'span' === strtolower( $parts[0]->nodeName ) && ! $parts[0]->attributes->length ) {
            $parts = iterator_to_array( $parts[0]->childNodes );
        }
        $text = '';
        foreach ( $parts as $part ) {
            if ( XML_TEXT_NODE === $part->nodeType ) {
                $text .= htmlspecialchars( preg_replace( '/\s+/u', ' ', $part->nodeValue ), ENT_NOQUOTES, 'UTF-8' );
                continue;
            }
            if ( ! $part instanceof DOMElement ) {
                continue;
            }
            $tag = strtolower( $part->nodeName );
            if ( ! in_array( $tag, array( 'b', 'strong', 'em', 'i', 'br' ), true ) || $part->attributes->length || null !== $this->icon_of( $part ) ) {
                return $this->code( $el, ( $link ? 'a' : 'button' ) . ' with ' . $tag . ' inside' );
            }
            $inner = 'br' === $tag ? '' : $this->rich( iterator_to_array( $part->childNodes ) );
            if ( null === $inner ) {
                return $this->code( $el, ( $link ? 'a' : 'button' ) . ' with blocks inside' );
            }
            $text .= 'br' === $tag ? '<br>' : '<' . $tag . '>' . $inner . '</' . $tag . '>';
        }
        $text = trim( $text );
        if ( '' === $text && null === $icon ) {
            return $this->code( $el, ( $link ? 'a' : 'button' ) . ' without text' );
        }

        $skip  = $link ? array( 'href', 'target', 'rel' ) : array( 'type' );
        $attrs = $this->common( $el, 'snn/button', $skip, array( 'snn-plain' ) );
        $attrs = array( 'tagName' => $link ? 'a' : 'button', 'display' => 'block' ) + $attrs + array( 'text' => $text );
        if ( $icon ) {
            $attrs['icon']         = $icon;
            $attrs['iconPosition'] = $pos;
        }
        $this->c->note_text();
        return $this->leaf( 'snn/button', $attrs + ( $link ? $link : array() ) );
    }

    /** The icon an element holds and nothing else (no text), or null. */
    private function only_icon( DOMElement $el ) {
        $own = $this->icon_of( $el );
        if ( null !== $own ) {
            return $own;
        }
        $parts = $this->parts( $el );
        if ( 1 !== count( $parts ) || ! $parts[0] instanceof DOMElement ) {
            return null;
        }
        return $this->icon_of( $parts[0] );
    }

    /** The icon value of a font icon (i.fa-star, i.ti-home, i.ion-ios-add) or a small inline SVG, or null. */
    private function icon_of( $node ) {
        if ( ! $node instanceof DOMElement ) {
            return null;
        }
        if ( $node->hasAttribute( 'data-snn-raw' ) ) {
            $svg = $this->c->raw_svg( $node->getAttribute( 'data-snn-raw' ) );
            return $this->small_svg( $svg ) ? array( 'library' => 'svg', 'svg' => $svg ) : null;
        }
        if ( 'i' !== strtolower( $node->nodeName ) || '' !== trim( $node->textContent ) ) {
            return null;
        }
        $classes = preg_split( '/\s+/', strtolower( trim( (string) $node->getAttribute( 'class' ) ) ), -1, PREG_SPLIT_NO_EMPTY );
        foreach ( $classes as $class ) {
            if ( preg_match( '/^ti-[a-z0-9-]+$/', $class ) ) {
                return array( 'library' => 'themify', 'name' => $class );
            }
            if ( preg_match( '/^ion-[a-z0-9-]+$/', $class ) ) {
                return array( 'library' => 'ionicons', 'name' => $class );
            }
        }
        $library = '';
        if ( array_intersect( $classes, array( 'fa-brands', 'fab' ) ) ) {
            $library = 'fontawesome-brands';
        } elseif ( array_intersect( $classes, array( 'fa-regular', 'far' ) ) ) {
            $library = 'fontawesome-regular';
        } elseif ( array_intersect( $classes, array( 'fa-solid', 'fas', 'fa' ) ) || preg_grep( '/^fa-/', $classes ) ) {
            $library = 'fontawesome-solid';
        }
        if ( '' === $library ) {
            return null;
        }
        foreach ( $classes as $class ) {
            if ( preg_match( '/^fa-[a-z0-9-]+$/', $class ) && ! preg_match( self::FA_MODIFIERS, $class ) ) {
                return array( 'library' => $library, 'name' => $class );
            }
        }
        return null;
    }

    /** True for an SVG with no width or height over ICON_MAX. */
    private function small_svg( $svg ) {
        if ( ! preg_match( '#<svg\b[^>]*>#i', $svg, $open ) ) {
            return false;
        }
        foreach ( array( 'width', 'height' ) as $dim ) {
            if ( preg_match( '/\s' . $dim . '\s*=\s*["\']?\s*(\d+(\.\d+)?)/i', $open[0], $m ) && (float) $m[1] > self::ICON_MAX ) {
                return false;
            }
        }
        return true;
    }

    /** An Icon block. $el is the element that holds the icon (its tag and classes), or the icon itself. */
    private function icon_block( DOMElement $el, array $icon, $link = array() ) {
        $tag  = strtolower( $el->nodeName );
        $self = null !== $this->icon_of( $el );
        $skip = $link ? array( 'href', 'target', 'rel' ) : array();
        if ( $self && 'svg' !== $icon['library'] ) {
            // The i itself: its icon classes are the icon, its other classes go on the block.
            $attrs = $this->common( $el, 'snn/icon', array_merge( $skip, array( 'aria-hidden' ) ), array(), true );
        } else {
            $attrs = $this->common( $el, 'snn/icon', $skip );
        }
        $attrs = array( 'tagName' => $link ? 'a' : ( 'div' === $tag ? 'div' : 'span' ), 'display' => 'block' ) + $attrs + array( 'icon' => $icon );
        return $this->leaf( 'snn/icon', $attrs + ( $link ? $link : array() ) );
    }

    /** A raw SVG on its own: an Icon when it is small, else Code. */
    private function svg( DOMElement $el ) {
        $svg = $this->c->raw_svg( $el->getAttribute( 'data-snn-raw' ) );
        if ( $this->small_svg( $svg ) ) {
            $attrs = array( 'tagName' => 'span', 'display' => 'block' ) + $this->common( null, 'snn/icon' ) + array( 'icon' => array( 'library' => 'svg', 'svg' => $svg ) );
            return $this->leaf( 'snn/icon', $attrs );
        }
        return $this->code( $el, 'svg picture' );
    }

    /* ----------------------------------------------------------------------
     * Images
     * ------------------------------------------------------------------- */

    /** A figure with one img and an optional caption of plain text. */
    private function figure( DOMElement $el ) {
        $img     = null;
        $caption = '';
        foreach ( $this->parts( $el ) as $part ) {
            $tag = $part instanceof DOMElement ? strtolower( $part->nodeName ) : '#text';
            if ( 'img' === $tag && null === $img ) {
                $img = $part;
            } elseif ( 'figcaption' === $tag && '' === $caption && 0 === $part->getElementsByTagName( '*' )->length ) {
                $caption = trim( preg_replace( '/\s+/u', ' ', $part->textContent ) );
            } else {
                return $this->code( $el, 'figure with ' . $tag );
            }
        }
        if ( null === $img ) {
            return $this->code( $el, 'figure without img' );
        }
        return $this->image( $img, array(), $el, $caption );
    }

    /**
     * An Image. $wrapper (a figure, or the a around the picture) gives the block its classes and tag. The picture keeps
     * its URL (an attachment of this site keeps its ID) and alt text.
     */
    private function image( DOMElement $img, $link = array(), $wrapper = null, $caption = '' ) {
        $src = trim( (string) $img->getAttribute( 'src' ) );
        if ( '' === $src ) {
            return $this->code( $img, 'img without src' );
        }
        $skip   = array( 'src', 'alt', 'loading', 'width', 'height', 'srcset', 'sizes', 'decoding', 'href', 'target', 'rel' );
        $figure = $wrapper && 'figure' === strtolower( $wrapper->nodeName );
        $attrs  = $this->common( $figure ? $wrapper : $img, 'snn/image', $skip );
        $attrs  = array( 'tagName' => $figure ? 'figure' : 'div', 'display' => 'block' ) + $attrs;
        $id     = (int) attachment_url_to_postid( $src );
        if ( $id > 0 ) {
            $attrs['imageId'] = $id;
        } else {
            $attrs['imageUrl'] = $src;
        }
        $attrs['imageAlt']    = (string) $img->getAttribute( 'alt' );
        $attrs['captionType'] = '' !== $caption ? 'custom' : 'none';
        if ( '' !== $caption ) {
            $attrs['captionCustom'] = $caption;
        }
        if ( 'eager' === $img->getAttribute( 'loading' ) ) {
            $attrs['loading'] = 'eager';
        }
        if ( $link && '' !== $link['linkUrl'] ) {
            $attrs['linkTo']  = 'url';
            $attrs['linkUrl'] = $link['linkUrl'];
            if ( ! empty( $link['linkNewTab'] ) ) {
                $attrs['linkNewTab'] = true;
            }
        }
        if ( '' !== $img->getAttribute( 'srcset' ) ) {
            $this->drop( 'img srcset (the Image block uses its own sources)' );
        }
        return $this->leaf( 'snn/image', $attrs );
    }

    /* ----------------------------------------------------------------------
     * Code
     * ------------------------------------------------------------------- */

    /** The element as written, in a Code block without a wrapper. Inline styles become classes, fixed decoration is marked. */
    private function code( DOMNode $node, $reason ) {
        if ( $node instanceof DOMElement ) {
            $this->prepare_html( $node );
        }
        $html = $this->c->restore_raw( $this->c->doc()->saveHTML( $node ) );
        $this->code++;
        $this->code_tags[ $reason ] = ( $this->code_tags[ $reason ] ?? 0 ) + 1;
        $attrs = array(
            'htmlId'    => $this->new_id(),
            'metadata'  => array( 'name' => $node instanceof DOMElement ? $this->label( $node, 'Code' ) : 'Code' ),
            'code'      => $html,
            'noWrapper' => true,
        );
        return $this->leaf( 'snn/code', $attrs );
    }

    /** Inline styles to classes and the decoration class, on an element and everything inside it. */
    private function prepare_html( DOMElement $el ) {
        $nodes = iterator_to_array( $el->getElementsByTagName( '*' ) );
        array_unshift( $nodes, $el );
        $fixed = $this->c->fixed_classes();
        foreach ( $nodes as $node ) {
            $classes = $this->c->classes( $node );
            $before  = $classes;
            $this->c->style_class( $node, $classes );
            if ( $this->is_decor( $node, $fixed ) ) {
                $classes[] = 'snn-decor';
            }
            if ( $classes !== $before || $node->hasAttribute( 'style' ) ) {
                $node->setAttribute( 'class', implode( ' ', array_values( array_unique( $classes ) ) ) );
                $node->removeAttribute( 'style' );
            }
        }
    }

    private function is_decor( DOMElement $el, array $fixed ) {
        if ( 'true' !== $el->getAttribute( 'aria-hidden' ) || ! $fixed ) {
            return false;
        }
        foreach ( preg_split( '/\s+/', trim( (string) $el->getAttribute( 'class' ) ), -1, PREG_SPLIT_NO_EMPTY ) as $class ) {
            if ( isset( $fixed[ $class ] ) ) {
                return true;
            }
        }
        return false;
    }

    /* ----------------------------------------------------------------------
     * Attributes
     * ------------------------------------------------------------------- */

    /**
     * htmlId, cssClasses, customAttributes and the List View name of a block. $skip: attributes the block writes
     * itself. $add: classes to add. $icon_classes_out: leave the icon's own classes out (an i that is the icon).
     */
    private function common( $el, $name, array $skip = array(), array $add = array(), $icon_classes_out = false ) {
        $attrs = array();
        if ( ! $el ) {
            return array( 'htmlId' => $this->new_id() ) + ( $add ? array( 'cssClasses' => implode( ' ', $add ) ) : array() );
        }
        $id = trim( (string) $el->getAttribute( 'id' ) );
        if ( '' !== $id && preg_match( '/^[A-Za-z][A-Za-z0-9_-]*$/', $id ) ) {
            $attrs['htmlId'] = $id;
        } else {
            if ( '' !== $id ) {
                $this->drop( 'id "' . $id . '" (only letters, digits, - and _)' );
            }
            $attrs['htmlId'] = $this->new_id();
        }
        $attrs['metadata'] = array( 'name' => $this->label( $el, $this->title( $name ) ) );

        $classes = $this->c->classes( $el );
        if ( $icon_classes_out ) {
            $classes = array_values( array_filter( $classes, function ( $class ) {
                return ! preg_match( '/^(fa|fas|far|fab|fa-.+|ti-.+|ion-.+)$/', $class );
            } ) );
        }
        $this->c->style_class( $el, $classes );
        if ( $this->is_decor( $el, $this->c->fixed_classes() ) ) {
            $classes[] = 'snn-decor';
        }
        $classes = array_values( array_unique( array_merge( $classes, $add ) ) );
        if ( $classes ) {
            $attrs['cssClasses'] = implode( ' ', $classes );
        }

        $custom = array();
        foreach ( $el->attributes as $attr ) {
            $an = strtolower( $attr->nodeName );
            if ( in_array( $an, array_merge( array( 'class', 'id', 'style', 'data-snn-raw' ), $skip ), true ) ) {
                continue;
            }
            if ( 0 === strpos( $an, 'on' ) ) {
                $this->drop( 'on* attribute ' . $an );
                continue;
            }
            if ( 'aria-label' === $an && in_array( $name, array( 'snn/button', 'snn/icon' ), true ) && in_array( 'href', $skip, true ) ) {
                $attrs['linkAriaLabel'] = (string) $attr->nodeValue;
                continue;
            }
            if ( ! preg_match( '/^(data-|aria-)?[a-z][a-z0-9_-]{0,58}$/', $an ) ) {
                $this->drop( 'attribute ' . $an );
                continue;
            }
            if ( count( $custom ) >= 20 ) {
                $this->drop( 'attribute ' . $an . ' (more than 20)' );
                continue;
            }
            $custom[] = array( 'name' => $an, 'value' => substr( sanitize_text_field( (string) $attr->nodeValue ), 0, 300 ) );
        }
        if ( $custom ) {
            $attrs['customAttributes'] = $custom;
        }
        return $attrs;
    }

    /** The block title for its List View name. */
    private function title( $name ) {
        $titles = array(
            'snn/section'   => 'Section',
            'snn/container' => 'Container',
            'snn/div'       => 'Div',
            'snn/text'      => 'Text',
            'snn/button'    => 'Button',
            'snn/icon'      => 'Icon',
            'snn/image'     => 'Image',
        );
        return $titles[ $name ] ?? 'Block';
    }

    /** The List View name: the first usable class ("hero__title" is "Hero / title"), then the id, then $fallback. */
    private function label( DOMElement $el, $fallback ) {
        foreach ( $this->c->classes( $el ) as $class ) {
            if ( preg_match( '/^(container|wrap|wrapper|inner|grid|row|col|is-|has-|js-|snn-|fa|fa-|ti-|ion-)/i', $class ) ) {
                continue;
            }
            return $this->humanize( $class );
        }
        $id = trim( (string) $el->getAttribute( 'id' ) );
        if ( '' !== $id ) {
            return $this->humanize( $id );
        }
        $tag = strtolower( $el->nodeName );
        return in_array( $tag, array( 'div', 'span', 'a', 'i' ), true ) ? $fallback : $fallback . ' ' . $tag;
    }

    private function humanize( $text ) {
        $name = str_replace( array( '__', '--' ), ' / ', (string) $text );
        $name = str_replace( array( '-', '_' ), ' ', $name );
        return mb_substr( ucfirst( trim( $name ) ), 0, 60 );
    }

    /** A new block ID, as the editor makes them (snn- and eight letters or digits), not used yet on this page. */
    private function new_id() {
        do {
            $id = 'snn-' . substr( strtolower( wp_generate_password( 12, false, false ) ), 0, 8 );
        } while ( isset( $this->ids[ $id ] ) );
        $this->ids[ $id ] = true;
        return $id;
    }

    private function reserve_ids( DOMElement $el ) {
        $nodes = iterator_to_array( $el->getElementsByTagName( '*' ) );
        array_unshift( $nodes, $el );
        foreach ( $nodes as $node ) {
            $id = trim( (string) $node->getAttribute( 'id' ) );
            if ( '' !== $id ) {
                $this->ids[ $id ] = true;
            }
        }
    }

    private function drop( $what ) {
        $this->dropped[] = $what;
        $this->c->note_dropped();
    }

    /* ----------------------------------------------------------------------
     * Block markup
     * ------------------------------------------------------------------- */

    /** A block with inner blocks. Our blocks save only their inner blocks, so nothing else goes between the comments. */
    private function wrap( $name, array $attrs, array $inner ) {
        $this->c->note_block( $name );
        return get_comment_delimited_block_content( $name, $attrs, implode( '', $inner ) );
    }

    /** A block without inner blocks: its settings are all in its attributes (self-closing comment). */
    private function leaf( $name, array $attrs ) {
        $this->c->note_block( $name );
        return get_comment_delimited_block_content( $name, $attrs, '' );
    }
}
