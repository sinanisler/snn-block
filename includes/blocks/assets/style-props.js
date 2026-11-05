/**
 * The editor's copy of SNN_Style_Props (includes/blocks/style-props.php): the same checks and the same
 * declarations, so the canvas shows what the front end writes. The table itself comes from PHP
 * (window.snnStyleTable, one row per property: attribute, css property or null, type, options).
 * Keep check() and declarations() in step with the PHP.
 */
( function ( root ) {
	'use strict';

	const UNIT = 'px|rem|em|%|vw|vh|vmin|vmax|ch';
	const SIZE_WORDS = [ 'auto', 'max-content', 'min-content', 'fit-content' ];
	const VAR_OK = /^var\(--[a-z][a-z0-9-]*\)$/;
	const COLOR_OK = /^(#([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})|(rgba?|hsla?)\([0-9a-z.,%\s\/+-]{1,60}\)|var\(--[a-z][a-z0-9-]*\)|transparent)$/i;

	const str = ( v ) => ( v === undefined || v === null ? '' : String( v ) );
	const isVar = ( v ) => VAR_OK.test( v );

	/** A length with a unit, or 0, or a variable. A plain number gets px. signed: negative values allowed. */
	function length( v, signed ) {
		let t = v;
		if ( ( signed ? /^-?\d+(\.\d+)?$/ : /^\d+(\.\d+)?$/ ).test( t ) && t !== '0' ) {
			t += 'px';
		}
		const unit = new RegExp( '^' + ( signed ? '-?' : '' ) + '\\d+(\\.\\d+)?(' + UNIT + ')$' );
		if ( t === '0' || isVar( t ) || unit.test( t ) ) {
			return t;
		}
		return '';
	}

	/** A value checked for its type (the same names as the PHP). Returns the value to write, or ''. */
	function check( type, value, options ) {
		const v = str( value ).trim();
		if ( v === '' ) {
			return '';
		}
		const opts = options || [];
		switch ( type ) {
			case 'keyword':
				return opts.indexOf( v ) !== -1 ? v : '';
			case 'keywordlength':
				return opts.indexOf( v ) !== -1 ? v : length( v, false );
			case 'length':
				return length( v, true );
			case 'margin':
				return v === 'auto' ? v : length( v, true );
			case 'lengthnormal':
				return v === 'normal' ? v : length( v, true );
			case 'size':
				return length( v, false );
			case 'sizenone':
				return v === 'none' ? v : length( v, false );
			case 'width':
				return SIZE_WORDS.indexOf( v ) !== -1 ? v : length( v, false );
			case 'lineheight':
				if ( v === 'normal' || isVar( v ) || /^\d+(\.\d+)?$/.test( v ) ) {
					return v;
				}
				return length( v, false );
			case 'integer':
				return /^-?\d{1,4}$/.test( v ) || isVar( v ) ? v : '';
			case 'number':
				return /^-?\d+(\.\d+)?$/.test( v ) || isVar( v ) ? v : '';
			case 'percent':
				return /^\d+(\.\d+)?$/.test( v ) && parseFloat( v ) <= 100 ? v : '';
			case 'percentnumber':
				return /^\d+(\.\d+)?$/.test( v ) || isVar( v ) ? v : '';
			case 'ratio':
				return v === 'auto' || /^\d+(\.\d+)?\s*\/\s*\d+(\.\d+)?$/.test( v ) || isVar( v ) ? v : '';
			case 'time':
				return /^\d+(\.\d+)?m?s$/.test( v ) || isVar( v ) ? v : '';
			case 'color':
				return COLOR_OK.test( v ) ? v : '';
			case 'text':
				return /^[A-Za-z0-9 .,()%#+\-*\/]{1,200}$/.test( v ) ? v : '';
			case 'family':
				return /^[A-Za-z0-9 ,'"\-]{1,120}$/.test( v ) ? v : '';
			case 'url':
				return /^url\(("|')?(https?:\/\/|\/)[^"'()\s<>]{1,500}("|')?\)$/.test( v ) ? v : '';
		}
		return '';
	}

	/** A plain number (no variable, no unit): the composed parts that add their own unit take only these. */
	function plainNumber( value ) {
		const t = str( value ).trim();
		return /^-?\d+(\.\d+)?$/.test( t ) ? t : '';
	}

	/** box-shadow: x, y, blur, spread and colour, each with a default. null when no part is set. */
	function boxShadow( a ) {
		const x = check( 'length', a.boxShadowX );
		const y = check( 'length', a.boxShadowY );
		const blur = check( 'size', a.boxShadowBlur );
		const spread = check( 'length', a.boxShadowSpread );
		const colour = check( 'color', a.boxShadowColor );
		if ( ! x && ! y && ! blur && ! spread && ! colour ) {
			return null;
		}
		return [ 'box-shadow', [ x || '0', y || '0', blur || '0', spread || '0', colour || 'rgba(0,0,0,0.25)' ].join( ' ' ) ];
	}

	/** transform: translate, rotate, scale and skew, in that order. null when no part is set. */
	function transform( a ) {
		const parts = [];
		const tx = check( 'length', a.translateX );
		const ty = check( 'length', a.translateY );
		if ( tx || ty ) {
			parts.push( 'translate(' + ( tx || '0' ) + ', ' + ( ty || '0' ) + ')' );
		}
		const rotate = plainNumber( a.rotate );
		if ( rotate ) {
			parts.push( 'rotate(' + rotate + 'deg)' );
		}
		const scale = check( 'number', a.scale );
		if ( scale ) {
			parts.push( 'scale(' + scale + ')' );
		}
		const skewX = plainNumber( a.skewX );
		const skewY = plainNumber( a.skewY );
		if ( skewX || skewY ) {
			parts.push( 'skew(' + ( skewX || '0' ) + 'deg, ' + ( skewY || '0' ) + 'deg)' );
		}
		return parts.length ? [ 'transform', parts.join( ' ' ) ] : null;
	}

	/** filter: blur, brightness, contrast, grayscale, invert, saturate, sepia, then hue-rotate. null when no part is set. */
	function filter( a ) {
		const parts = [];
		const blur = check( 'size', a.filterBlur );
		if ( blur ) {
			parts.push( 'blur(' + blur + ')' );
		}
		[
			[ 'filterBrightness', 'brightness' ],
			[ 'filterContrast', 'contrast' ],
			[ 'filterGrayscale', 'grayscale' ],
			[ 'filterInvert', 'invert' ],
			[ 'filterSaturate', 'saturate' ],
			[ 'filterSepia', 'sepia' ],
		].forEach( ( pair ) => {
			const v = check( 'percentnumber', a[ pair[ 0 ] ] );
			if ( v ) {
				parts.push( pair[ 1 ] + '(' + v + ( isVar( v ) ? '' : '%' ) + ')' );
			}
		} );
		const hue = plainNumber( a.filterHueRotate );
		if ( hue ) {
			parts.push( 'hue-rotate(' + hue + 'deg)' );
		}
		return parts.length ? [ 'filter', parts.join( ' ' ) ] : null;
	}

	/** background-image: a gradient from two colour stops. Needs both colours; the stops default to 0% and 100%. */
	function gradient( a ) {
		const c1 = check( 'color', a.gradientColor1 );
		const c2 = check( 'color', a.gradientColor2 );
		if ( ! c1 || ! c2 ) {
			return null;
		}
		const s1 = check( 'percent', a.gradientStop1 );
		const s2 = check( 'percent', a.gradientStop2 );
		const stops = c1 + ' ' + ( s1 || '0' ) + '%, ' + c2 + ' ' + ( s2 || '100' ) + '%';
		if ( a.gradientType === 'radial' ) {
			return [ 'background-image', 'radial-gradient(' + stops + ')' ];
		}
		const angle = plainNumber( a.gradientAngle );
		return [ 'background-image', 'linear-gradient(' + ( angle || '180' ) + 'deg, ' + stops + ')' ];
	}

	/**
	 * The declarations for the table's properties, in the table's order, then the composed ones: the box shadow,
	 * the transform, the filter and the gradient (last, so a gradient wins over a background image).
	 * @return {Array<[string, string]>} [ css property, value ] pairs.
	 */
	function declarations( a, table ) {
		const out = [];
		( table || [] ).forEach( ( row ) => {
			const css = row[ 1 ];
			if ( ! css ) {
				return;
			}
			const value = check( row[ 2 ], a[ row[ 0 ] ], row[ 3 ] || [] );
			if ( value ) {
				out.push( [ css, value ] );
			}
		} );
		[ boxShadow( a ), transform( a ), filter( a ), gradient( a ) ].forEach( ( d ) => {
			if ( d ) {
				out.push( d );
			}
		} );
		return out;
	}

	/** 'margin-top' becomes 'marginTop', as React's style objects name them. */
	function camel( prop ) {
		return prop.replace( /-([a-z])/g, ( m, c ) => c.toUpperCase() );
	}

	root.snnStyleProps = { check, declarations, camel };
} )( typeof window !== 'undefined' ? window : globalThis );
