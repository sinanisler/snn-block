<?php
/**
 * Block defaults: the default styles of each block. The Blocks tab of the global styles sets them.
 *
 * An entry is a block (or a site element: the whole site, links, headings) and the fields its
 * defaults use. Each value is written into theme.json, under styles.blocks.{name} for a block,
 * so every block of that type gets it. A block's own settings still win, as usual.
 *
 * Our own blocks (snn/*) are listed as they are built. Section and Container are built (see
 * layout-blocks.php); Div has no defaults. Text, image and video are planned: their defaults
 * apply as soon as the block is registered. Other code can add entries with the filter
 * snn/block_defaults.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class SNN_Block_Defaults {

	/** The browser's own font stack, the default for the whole site and the headings. */
	const SYSTEM_FONT = 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';

	/**
	 * The fields. type: colour, font, size (a preset), weight, line (line height), radius, shadow,
	 * length (any CSS length). path: where the value goes in theme.json styles. all_sides: the
	 * value is the same padding on all four sides.
	 */
	public static function fields() {
		return array(
			'color_text'       => array( 'label' => __( 'Text colour', 'snn' ), 'type' => 'color', 'path' => 'color.text' ),
			'color_background' => array( 'label' => __( 'Background colour', 'snn' ), 'type' => 'color', 'path' => 'color.background' ),
			'font'             => array( 'label' => __( 'Font', 'snn' ), 'type' => 'font', 'path' => 'typography.fontFamily' ),
			'base_size'        => array( 'label' => __( 'Base size (body and html)', 'snn' ), 'type' => 'length', 'path' => 'typography.fontSize' ),
			'size'             => array( 'label' => __( 'Size', 'snn' ), 'type' => 'size', 'path' => 'typography.fontSize' ),
			'weight'           => array( 'label' => __( 'Weight', 'snn' ), 'type' => 'weight', 'path' => 'typography.fontWeight' ),
			'line_height'      => array( 'label' => __( 'Line height', 'snn' ), 'type' => 'line', 'path' => 'typography.lineHeight' ),
			'radius'           => array( 'label' => __( 'Corner radius', 'snn' ), 'type' => 'radius', 'path' => 'border.radius' ),
			'shadow'           => array( 'label' => __( 'Shadow', 'snn' ), 'type' => 'shadow', 'path' => 'shadow' ),
			'padding'          => array( 'label' => __( 'Padding', 'snn' ), 'type' => 'length', 'path' => 'spacing.padding', 'all_sides' => true ),
			'block_gap'        => array( 'label' => __( 'Gap between items', 'snn' ), 'type' => 'length', 'path' => 'spacing.blockGap' ),
			'max_width'        => array( 'label' => __( 'Maximum width', 'snn' ), 'type' => 'length', 'path' => 'dimensions.maxWidth' ),
		);
	}

	/**
	 * The entries, in the order of the Blocks tab. target: where the defaults go in styles
	 * ('styles' for the whole site, 'elements.link', 'elements.heading', or 'blocks.{name}').
	 */
	public static function entries() {
		$entries = array(
			'site'           => array( 'label' => __( 'Global Site Styles', 'snn' ), 'target' => 'styles', 'open' => true, 'fields' => array( 'color_text', 'color_background', 'font', 'base_size', 'line_height' ) ),
			'link'           => array( 'label' => __( 'Links', 'snn' ), 'target' => 'elements.link', 'fields' => array( 'color_text' ) ),
			'heading'        => array( 'label' => __( 'Headings, all levels', 'snn' ), 'target' => 'elements.heading', 'fields' => array( 'color_text', 'font', 'weight', 'line_height' ) ),
			'core/paragraph' => array( 'label' => __( 'Paragraph', 'snn' ), 'fields' => array( 'color_text', 'font', 'size', 'weight', 'line_height' ) ),
			'core/list'      => array( 'label' => __( 'List', 'snn' ), 'fields' => array( 'color_text', 'font', 'size', 'line_height' ) ),
			'core/quote'     => array( 'label' => __( 'Quote', 'snn' ), 'fields' => array( 'color_text', 'color_background', 'font', 'size', 'radius', 'padding' ) ),
			'core/button'    => array( 'label' => __( 'Button', 'snn' ), 'fields' => array( 'color_background', 'color_text', 'font', 'size', 'weight', 'radius', 'padding' ) ),
			'core/image'     => array( 'label' => __( 'Image', 'snn' ), 'fields' => array( 'radius', 'shadow' ) ),
			'core/group'     => array( 'label' => __( 'Group', 'snn' ), 'fields' => array( 'color_background', 'padding', 'block_gap', 'radius', 'shadow' ) ),
			'snn/section'    => array( 'label' => __( 'Section (our block)', 'snn' ), 'fields' => array( 'color_background', 'color_text', 'padding' ) ),
			'snn/container'  => array( 'label' => __( 'Container (our block)', 'snn' ), 'fields' => array( 'max_width', 'block_gap', 'padding' ) ),
			'snn/text'       => array( 'label' => __( 'Text (our block)', 'snn' ), 'planned' => true, 'fields' => array( 'color_text', 'font', 'size', 'weight', 'line_height' ) ),
			'snn/image'      => array( 'label' => __( 'Image (our block)', 'snn' ), 'planned' => true, 'fields' => array( 'radius', 'shadow' ) ),
			'snn/video'      => array( 'label' => __( 'Video (our block)', 'snn' ), 'planned' => true, 'fields' => array( 'radius' ) ),
		);
		foreach ( $entries as $key => $entry ) {
			$entries[ $key ]['target'] = $entry['target'] ?? 'blocks.' . $key;
			$entries[ $key ]['open']   = ! empty( $entry['open'] );
			$entries[ $key ]['planned'] = ! empty( $entry['planned'] );
		}
		return apply_filters( 'snn/block_defaults', $entries );
	}

	/** The starting values: black text on white, black links, white text on black buttons. */
	public static function defaults() {
		$start = array(
			'site'        => array( 'color_text' => 'black', 'color_background' => 'white', 'font' => 'system', 'base_size' => '15px', 'line_height' => '1.6' ),
			'link'        => array( 'color_text' => 'black' ),
			'heading'     => array( 'font' => 'system', 'weight' => '700', 'line_height' => '1.2' ),
			'core/button' => array( 'color_background' => 'black', 'color_text' => 'white', 'weight' => '600', 'radius' => 'medium' ),
			'core/image'  => array( 'radius' => 'small' ),
		);
		$out = array();
		foreach ( self::entries() as $key => $entry ) {
			$out[ $key ] = array();
			foreach ( $entry['fields'] as $name ) {
				$out[ $key ][ $name ] = $start[ $key ][ $name ] ?? '';
			}
		}
		return $out;
	}

	/**
	 * Sanitise the block defaults. $refs holds the valid choices: colors, fonts, sizes, radius,
	 * shadows (slugs or keys) and weights. An empty value means "inherit", and is always kept.
	 * An unknown choice falls back to the field's default when that is valid, or to inherit.
	 */
	public static function sanitize( $input, array $refs ) {
		$input    = is_array( $input ) ? $input : array();
		$defaults = self::defaults();
		$fields   = self::fields();
		$out      = array();
		foreach ( self::entries() as $key => $entry ) {
			$out[ $key ] = array();
			foreach ( $entry['fields'] as $name ) {
				$default = $defaults[ $key ][ $name ] ?? '';
				$raw     = isset( $input[ $key ][ $name ] ) && is_scalar( $input[ $key ][ $name ] ) ? $input[ $key ][ $name ] : $default;
				$out[ $key ][ $name ] = self::clean_value( $fields[ $name ]['type'], $raw, $default, $refs );
			}
		}
		return $out;
	}

	private static function clean_value( $type, $value, $default, array $refs ) {
		$value = trim( (string) $value );
		if ( '' === $value ) {
			return '';
		}
		$lists = array(
			'color'  => $refs['colors'],
			'font'   => $refs['fonts'],
			'size'   => $refs['sizes'],
			'radius' => $refs['radius'],
			'shadow' => $refs['shadows'],
		);
		if ( isset( $lists[ $type ] ) ) {
			if ( in_array( $value, $lists[ $type ], true ) ) {
				return $value;
			}
			return in_array( $default, $lists[ $type ], true ) ? $default : '';
		}
		switch ( $type ) {
			case 'weight':
				return in_array( $value, $refs['weights'], true ) ? $value : '';
			case 'line':
				$value = str_replace( ',', '.', $value ); // A comma is a decimal separator in some locales.
				return is_numeric( $value ) ? SNN_Global_Styles::number( $value, 0.8, 3 ) : '';
			case 'length':
				return SNN_Global_Styles::length( $value, $default );
		}
		return '';
	}
}
