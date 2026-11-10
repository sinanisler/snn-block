<?php
/**
 * Code (snn/code): HTML, CSS and JavaScript, printed as written: no filter runs on them here. WordPress itself filters
 * the block attributes of users who may not post unfiltered HTML when they save, so only administrators and editors
 * (on a single site) can save scripts. The settings are Bricks' code element without PHP and its theme: the three
 * code fields and Render without wrapper.
 *
 * The CSS is printed in a style element and the JavaScript in a script element after the HTML.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class SNN_Code_Block extends SNN_Block {

	const TAGS = array( 'div', 'section', 'span', 'header', 'footer', 'main', 'article', 'aside', 'nav' );

	public static function definition() {
		return array(
			'name'   => 'snn/code',
			'title'  => __( 'Code', 'snn' ),
			'tag'    => 'div',
			'tags'   => self::TAGS,
			'icon'   => 'editor-code',
			'order'  => 80,
			'kind'   => 'code',
			'layout' => array(
				'display'       => 'block',
				'flexDirection' => 'row',
			),
		);
	}

	/** The settings of the three code editors (false for one when syntax highlighting is off), and whether scripts are saved. */
	public static function editor_data() {
		return array(
			'editors'       => array(
				'html' => wp_enqueue_code_editor( array( 'type' => 'text/html' ) ),
				'css'  => wp_enqueue_code_editor( array( 'type' => 'text/css' ) ),
				'js'   => wp_enqueue_code_editor( array( 'type' => 'application/javascript' ) ),
			),
			'canUnfiltered' => current_user_can( 'unfiltered_html' ),
		);
	}

	public static function attributes() {
		return array(
			'code'      => array( 'type' => 'string', 'default' => '' ),
			'cssCode'   => array( 'type' => 'string', 'default' => '' ),
			'jsCode'    => array( 'type' => 'string', 'default' => '' ),
			'noWrapper' => array( 'type' => 'boolean', 'default' => false ),
		);
	}

	public static function clean( $raw ) {
		$raw = is_array( $raw ) ? $raw : array();
		$str = function ( $key ) use ( $raw ) {
			return is_string( $raw[ $key ] ?? null ) ? $raw[ $key ] : '';
		};
		return array(
			'code'      => $str( 'code' ),
			'cssCode'   => $str( 'cssCode' ),
			'jsCode'    => $str( 'jsCode' ),
			'noWrapper' => true === ( $raw['noWrapper'] ?? false ),
		);
	}

	public static function element( array $a, array $dyn ) {
		return array( 'tag' => $a['tagName'], 'attrs' => array(), 'style' => array() );
	}

	/** True when the code is printed without the element around it (Render without wrapper). */
	public static function bare( array $a ) {
		return $a['noWrapper'];
	}

	public static function render( array $a, array $dyn ) {
		$html = $a['code'];
		if ( '' !== trim( $a['cssCode'] ) ) {
			$html .= '<style>' . $a['cssCode'] . '</style>';
		}
		if ( '' !== trim( $a['jsCode'] ) ) {
			$html .= '<script>' . $a['jsCode'] . '</script>';
		}
		return $html;
	}
}
