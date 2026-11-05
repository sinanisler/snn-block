<?php
/**
 * Block tools for our layout blocks, as Bricks has them on every element:
 *
 *   Conditions    the block shows only when its conditions hold. Sets are alternatives (any set may hold);
 *                 the conditions inside a set must all hold. Checked here, when the page is rendered.
 *   Interactions  when a trigger happens (a click, hover, the viewport, the page loading), an action runs on
 *                 the block or on the element with a CSS ID. The front end script is assets/interactions.js.
 *
 * The editor side is assets/block-tools.js (the panel's parts) and the panel itself is assets/layout-blocks.js.
 * The catalogs below are the single list both sides use: the editor reads them through editor_data().
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class SNN_Block_Tools {

	const MAX_SETS         = 10;
	const MAX_CONDITIONS   = 10;
	const MAX_INTERACTIONS = 20;

	const TRIGGERS      = array( 'click', 'mouseenter', 'mouseleave', 'enterView', 'pageLoad' );
	const ACTIONS       = array( 'show', 'hide', 'toggleClass', 'addClass', 'removeClass', 'scrollTo', 'animate' );
	const CLASS_ACTIONS = array( 'toggleClass', 'addClass', 'removeClass' );

	const STATUSES = array( 'publish', 'draft', 'pending', 'private' );

	/** Set on the first block that has interactions, so the script loads once. */
	private static $front_ready = false;

	/* ------------------------------------------------------------------
	 * Catalogs
	 * ---------------------------------------------------------------- */

	/** The groups of the condition list, in order. */
	public static function groups() {
		return array(
			'post'  => __( 'Post', 'snn' ),
			'user'  => __( 'User', 'snn' ),
			'date'  => __( 'Date and time', 'snn' ),
			'other' => __( 'Other', 'snn' ),
		);
	}

	/**
	 * The conditions. key => group, label, compare (operator => label), value (the kind of the value field)
	 * and left (true when the condition has its own left side, the dynamic data text).
	 */
	public static function catalog() {
		$is   = array(
			'==' => __( 'is', 'snn' ),
			'!=' => __( 'is not', 'snn' ),
		);
		$text = $is + array(
			'contains'     => __( 'contains', 'snn' ),
			'contains_not' => __( 'does not contain', 'snn' ),
		);
		return array(
			'post_id'        => array( 'group' => 'post', 'label' => __( 'Post ID', 'snn' ), 'compare' => $is, 'value' => 'text' ),
			'post_title'     => array( 'group' => 'post', 'label' => __( 'Post title', 'snn' ), 'compare' => $text, 'value' => 'text' ),
			'post_type'      => array( 'group' => 'post', 'label' => __( 'Post type', 'snn' ), 'compare' => $is, 'value' => 'post_type' ),
			'post_status'    => array( 'group' => 'post', 'label' => __( 'Post status', 'snn' ), 'compare' => $is, 'value' => 'status' ),
			'user_logged_in' => array( 'group' => 'user', 'label' => __( 'User login', 'snn' ), 'compare' => array( '==' => __( 'is', 'snn' ) ), 'value' => 'login' ),
			'user_role'      => array( 'group' => 'user', 'label' => __( 'User role', 'snn' ), 'compare' => $is, 'value' => 'role' ),
			'weekday'        => array( 'group' => 'date', 'label' => __( 'Weekday', 'snn' ), 'compare' => $is, 'value' => 'weekday' ),
			'date'           => array(
				'group'   => 'date',
				'label'   => __( 'Date (today)', 'snn' ),
				'compare' => array(
					'<' => __( 'before', 'snn' ),
					'>' => __( 'after', 'snn' ),
				),
				'value'   => 'date',
			),
			'dynamic_data'   => array(
				'group'   => 'other',
				'label'   => __( 'Dynamic data', 'snn' ),
				'compare' => $is + array(
					'contains'     => __( 'contains', 'snn' ),
					'contains_not' => __( 'does not contain', 'snn' ),
					'empty'        => __( 'is empty', 'snn' ),
					'empty_not'    => __( 'is not empty', 'snn' ),
					'<'            => __( 'less than', 'snn' ),
					'>'            => __( 'more than', 'snn' ),
				),
				'value'   => 'text',
				'left'    => true,
			),
		);
	}

	public static function trigger_labels() {
		return array(
			'click'      => __( 'Click', 'snn' ),
			'mouseenter' => __( 'Hover (mouse enters)', 'snn' ),
			'mouseleave' => __( 'Mouse leaves', 'snn' ),
			'enterView'  => __( 'Enters the viewport', 'snn' ),
			'pageLoad'   => __( 'Page loads', 'snn' ),
		);
	}

	public static function action_labels() {
		return array(
			'show'        => __( 'Show element', 'snn' ),
			'hide'        => __( 'Hide element', 'snn' ),
			'toggleClass' => __( 'Toggle class', 'snn' ),
			'addClass'    => __( 'Add class', 'snn' ),
			'removeClass' => __( 'Remove class', 'snn' ),
			'scrollTo'    => __( 'Scroll to element', 'snn' ),
			'animate'     => __( 'Animate (entrance preset)', 'snn' ),
		);
	}

	/** The choices of a select value field, by its kind. Empty for the free-text and date kinds. */
	private static function options( $kind ) {
		switch ( $kind ) {
			case 'login':
				return self::pairs(
					array(
						'1' => __( 'Logged in', 'snn' ),
						'0' => __( 'Logged out', 'snn' ),
					)
				);
			case 'status':
				return self::pairs(
					array(
						'publish' => __( 'Published', 'snn' ),
						'draft'   => __( 'Draft', 'snn' ),
						'pending' => __( 'Pending', 'snn' ),
						'private' => __( 'Private', 'snn' ),
					)
				);
			case 'weekday':
				return self::pairs(
					array(
						'1' => __( 'Monday', 'snn' ),
						'2' => __( 'Tuesday', 'snn' ),
						'3' => __( 'Wednesday', 'snn' ),
						'4' => __( 'Thursday', 'snn' ),
						'5' => __( 'Friday', 'snn' ),
						'6' => __( 'Saturday', 'snn' ),
						'7' => __( 'Sunday', 'snn' ),
					)
				);
			case 'role':
				return self::pairs( wp_roles()->get_names() );
			case 'post_type':
				return SNN_Query_Loop::post_type_options();
		}
		return array();
	}

	private static function pairs( array $map ) {
		$out = array();
		foreach ( $map as $value => $label ) {
			$out[] = array(
				'value' => (string) $value,
				'label' => $label,
			);
		}
		return $out;
	}

	/** Everything the editor needs: the catalogs and their choices. Passed to block-tools.js. */
	public static function editor_data() {
		$conditions = array();
		foreach ( self::catalog() as $key => $def ) {
			$conditions[] = array(
				'key'     => $key,
				'group'   => $def['group'],
				'label'   => $def['label'],
				'value'   => $def['value'],
				'left'    => ! empty( $def['left'] ),
				'compare' => self::pairs( $def['compare'] ),
				'options' => self::options( $def['value'] ),
			);
		}
		return array(
			'groups'       => self::groups(),
			'conditions'   => $conditions,
			'triggers'     => self::pairs( self::trigger_labels() ),
			'actions'      => self::pairs( self::action_labels() ),
			'classActions' => self::CLASS_ACTIONS,
		);
	}

	/* ------------------------------------------------------------------
	 * Sanitizing (the saved values, checked against the catalogs)
	 * ---------------------------------------------------------------- */

	/** Sets of conditions: a list of lists. Unknown keys and operators are dropped or replaced by the first choice. */
	public static function sanitize_conditions( $value ) {
		$sets = array();
		if ( ! is_array( $value ) ) {
			return $sets;
		}
		foreach ( array_slice( $value, 0, self::MAX_SETS ) as $set ) {
			if ( ! is_array( $set ) ) {
				continue;
			}
			$clean = array();
			foreach ( array_slice( $set, 0, self::MAX_CONDITIONS ) as $condition ) {
				$one = self::sanitize_condition( $condition );
				if ( null !== $one ) {
					$clean[] = $one;
				}
			}
			if ( $clean ) {
				$sets[] = $clean;
			}
		}
		return $sets;
	}

	private static function sanitize_condition( $c ) {
		if ( ! is_array( $c ) ) {
			return null;
		}
		$catalog = self::catalog();
		$key     = isset( $c['key'] ) && is_string( $c['key'] ) ? $c['key'] : '';
		if ( ! isset( $catalog[ $key ] ) ) {
			return null;
		}
		$def = $catalog[ $key ];

		$compare = isset( $c['compare'] ) && is_string( $c['compare'] ) ? $c['compare'] : '';
		if ( ! array_key_exists( $compare, $def['compare'] ) ) {
			$compare = (string) array_key_first( $def['compare'] );
		}

		$raw   = isset( $c['value'] ) && is_scalar( $c['value'] ) ? (string) $c['value'] : '';
		$value = self::value_for( $def['value'], $raw );

		$out = array(
			'key'     => $key,
			'compare' => $compare,
			'value'   => $value,
		);
		if ( ! empty( $def['left'] ) ) {
			$out['dynamic'] = isset( $c['dynamic'] ) && is_scalar( $c['dynamic'] ) ? mb_substr( sanitize_text_field( (string) $c['dynamic'] ), 0, 300 ) : '';
		}
		return $out;
	}

	/** One value, checked against its kind. Text may hold dynamic tags. */
	private static function value_for( $kind, $raw ) {
		switch ( $kind ) {
			case 'login':
				return in_array( $raw, array( '0', '1' ), true ) ? $raw : '1';
			case 'status':
				return in_array( $raw, self::STATUSES, true ) ? $raw : 'publish';
			case 'weekday':
				return in_array( $raw, array( '1', '2', '3', '4', '5', '6', '7' ), true ) ? $raw : '1';
			case 'role':
			case 'post_type':
				return sanitize_key( $raw );
			case 'date':
				return ( preg_match( '/^\d{4}-\d{2}-\d{2}$/', $raw ) && checkdate( (int) substr( $raw, 5, 2 ), (int) substr( $raw, 8, 2 ), (int) substr( $raw, 0, 4 ) ) ) ? $raw : '';
		}
		return mb_substr( sanitize_text_field( $raw ), 0, 300 );
	}

	/** Interactions: trigger, action, target (self or a CSS ID) and, for class actions, the class names. */
	public static function sanitize_interactions( $value ) {
		$out = array();
		if ( ! is_array( $value ) ) {
			return $out;
		}
		foreach ( array_slice( $value, 0, self::MAX_INTERACTIONS ) as $item ) {
			if ( ! is_array( $item ) ) {
				continue;
			}
			$trigger = isset( $item['trigger'] ) && is_string( $item['trigger'] ) ? $item['trigger'] : '';
			$action  = isset( $item['action'] ) && is_string( $item['action'] ) ? $item['action'] : '';
			if ( ! in_array( $trigger, self::TRIGGERS, true ) || ! in_array( $action, self::ACTIONS, true ) ) {
				continue;
			}

			$target = isset( $item['target'] ) && is_scalar( $item['target'] ) ? preg_replace( '/[^A-Za-z0-9_-]/', '', (string) $item['target'] ) : 'self';
			if ( 'self' !== $target && '' === $target ) {
				continue; // An element picked by ID but no ID given: nothing to act on.
			}

			$names = '';
			if ( in_array( $action, self::CLASS_ACTIONS, true ) ) {
				$names = self::class_names( isset( $item['value'] ) && is_scalar( $item['value'] ) ? (string) $item['value'] : '' );
				if ( '' === $names ) {
					continue;
				}
			}

			// The entrance animation: one preset from the Select Animation list (animation.php), and nothing else.
			if ( 'animate' === $action ) {
				$preset = SNN_Animation::clean_tokens( array( isset( $item['value'] ) && is_string( $item['value'] ) ? $item['value'] : '' ) );
				if ( array() === $preset ) {
					continue;
				}
				$names = $preset[0];
			}

			$out[] = array(
				'trigger' => $trigger,
				'action'  => $action,
				'target'  => '' === $target ? 'self' : $target,
				'value'   => $names,
			);
		}
		return $out;
	}

	/** Class names separated by spaces, each cleaned as a CSS class. */
	private static function class_names( $raw ) {
		$names = array_filter( array_map( 'sanitize_html_class', preg_split( '/\s+/', trim( $raw ) ) ) );
		return implode( ' ', array_unique( $names ) );
	}

	/* ------------------------------------------------------------------
	 * Conditions: evaluated when the page is rendered
	 * ---------------------------------------------------------------- */

	/**
	 * True when the block should show. $dyn is the dynamic data context (post_id, index, count); with no
	 * post in it, the current post is used. No sets means the block always shows.
	 */
	public static function passes( array $sets, array $dyn = array() ) {
		if ( empty( $sets ) ) {
			return true;
		}
		$post_id = (int) ( $dyn['post_id'] ?? 0 );
		if ( ! $post_id ) {
			$post_id = (int) get_the_ID();
		}
		foreach ( $sets as $set ) {
			$all = true;
			foreach ( $set as $condition ) {
				if ( ! self::holds( $condition, $post_id, $dyn ) ) {
					$all = false;
					break;
				}
			}
			if ( $all ) {
				return true;
			}
		}
		return false;
	}

	private static function holds( array $c, $post_id, array $dyn ) {
		$op    = $c['compare'];
		$right = trim( SNN_Dynamic_Data::render( (string) $c['value'], $dyn, 'plain' ) );

		switch ( $c['key'] ) {
			case 'post_id':
				return self::compare( (string) $post_id, $op, $right );
			case 'post_title':
				return self::compare( (string) get_the_title( $post_id ), $op, $right );
			case 'post_type':
				return self::compare( (string) get_post_type( $post_id ), $op, $right );
			case 'post_status':
				return self::compare( (string) get_post_status( $post_id ), $op, $right );
			case 'user_logged_in':
				return self::compare( is_user_logged_in() ? '1' : '0', $op, $right );
			case 'user_role':
				$has = in_array( $right, (array) wp_get_current_user()->roles, true );
				return '!=' === $op ? ! $has : $has;
			case 'weekday':
				return self::compare( (string) current_time( 'N' ), $op, $right );
			case 'date':
				return self::compare( (string) current_time( 'Y-m-d' ), $op, $right );
			case 'dynamic_data':
				$left = trim( SNN_Dynamic_Data::render( (string) ( $c['dynamic'] ?? '' ), $dyn, 'plain' ) );
				return self::compare( $left, $op, $right );
		}
		return false;
	}

	private static function compare( $left, $op, $right ) {
		$left  = (string) $left;
		$right = (string) $right;
		switch ( $op ) {
			case '==':
				return self::equal( $left, $right );
			case '!=':
				return ! self::equal( $left, $right );
			case 'contains':
				return self::contains( $left, $right );
			case 'contains_not':
				return ! self::contains( $left, $right );
			case 'empty':
				return '' === $left;
			case 'empty_not':
				return '' !== $left;
			case '<':
				return self::order( $left, $right ) < 0;
			case '>':
				return self::order( $left, $right ) > 0;
		}
		return false;
	}

	private static function equal( $a, $b ) {
		return is_numeric( $a ) && is_numeric( $b ) ? (float) $a === (float) $b : $a === $b;
	}

	private static function contains( $haystack, $needle ) {
		return '' === $needle || false !== strpos( $haystack, $needle );
	}

	private static function order( $a, $b ) {
		return is_numeric( $a ) && is_numeric( $b ) ? ( (float) $a <=> (float) $b ) : strcmp( $a, $b );
	}

	/* ------------------------------------------------------------------
	 * Interactions: the front end
	 * ---------------------------------------------------------------- */

	/** The value of data-snn-interactions for a block, or '' when it has none. */
	public static function interactions_attribute( array $items ) {
		if ( empty( $items ) ) {
			return '';
		}
		$json = wp_json_encode( $items );
		return false === $json ? '' : $json;
	}

	/** Loads the interactions script in the footer, once per page. */
	public static function enqueue_front() {
		if ( self::$front_ready ) {
			return;
		}
		self::$front_ready = true;
		$js                = 'includes/blocks/assets/interactions.js';
		wp_enqueue_script( 'snn-interactions', SNN_URL . $js, array(), self::version( $js ), true );
	}

	private static function version( $file ) {
		return file_exists( SNN_PATH . $file ) ? (string) filemtime( SNN_PATH . $file ) : '1';
	}
}
