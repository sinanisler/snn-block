/**
 * The editor's copy of the style table (engine/style-props.php): the same types, the same rules and the same composers,
 * so the canvas draws what the front end prints. The table comes from PHP (snn.data.styleTable, one row per property:
 * attribute, css property or null, type, options, rules). Keep check(), declarations() and the composers in step with
 * the PHP. The parity test (includes/block/tests/style-parity.js) checks the two on the same values.
 *
 * Works in the browser (window.snn) and in Node (the parity test), so it reads no WordPress object.
 */
( function ( root ) {
	'use strict';

	const snn = ( root.snn = root.snn || {} );

	const SIZE_WORDS = [ 'auto', 'max-content', 'min-content', 'fit-content' ];
	const MAX_STOPS = 12; // The most colour stops a gradient takes (MAX_STOPS in style-props.php).
	const VAR_OK = /^var\(--[a-z][a-z0-9-]*\)$/;
	const COLOR_OK = /^(#([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})|(rgba?|hsla?)\([0-9a-z.,%\s\/+-]{1,60}\)|var\(--[a-z][a-z0-9-]*\)|transparent)$/i;
	const DISPLAYS = [ 'block', 'inline-block', 'inline', 'flex', 'inline-flex', 'grid', 'inline-grid', 'none' ];
	const FLEX_WRAP = [ 'nowrap', 'wrap', 'wrap-reverse' ];
	const GRID_FLOW = [ 'row', 'column' ];

	const str = ( v ) => ( v === undefined || v === null ? '' : String( v ) );
	const isVar = ( v ) => VAR_OK.test( v );

	/** PHP's empty(): false for '', '0', 0, false, null and an empty list. The grid dense flag is read that way. */
	function phpTruthy( v ) {
		if ( v === undefined || v === null || v === '' || v === false || v === 0 || v === '0' ) {
			return false;
		}
		return ! ( Array.isArray( v ) && v.length === 0 );
	}

	/** A length as CSS takes it: the same rule as length() in style-props.php. */
	function length( v, signed ) {
		let t = v;
		if ( /^[+-]?(\d+(\.\d+)?|\.\d+)$/.test( t ) && t !== '0' ) {
			t += 'px';
		}
		if ( t === '0' ) {
			return t;
		}
		if ( ! signed && t.charAt( 0 ) === '-' ) {
			return '';
		}
		return isCssValue( t ) ? t : '';
	}

	/** A CSS value: the same rule as is_css_value() in style-props.php. */
	function isCssValue( v ) {
		if ( v.length > 200 || ! /^[A-Za-z0-9 .,%()+*\/-]+$/.test( v ) ) {
			return false;
		}
		if ( ! /[0-9(]/.test( v ) || v.indexOf( '/*' ) !== -1 || v.indexOf( '*/' ) !== -1 ) {
			return false;
		}
		if ( /(expression|url)\s*\(/i.test( v ) ) {
			return false;
		}
		let depth = 0;
		for ( let i = 0; i < v.length; i++ ) {
			if ( v.charAt( i ) === '(' ) {
				depth++;
			} else if ( v.charAt( i ) === ')' ) {
				depth--;
				if ( depth < 0 ) {
					return false;
				}
			}
		}
		return depth === 0;
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
			case 'lengthauto':
				return v === 'auto' ? v : length( v, true );
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
			case 'order':
				return /^-?\d{1,3}$/.test( v ) || isVar( v ) ? v : '';
			case 'flexnumber':
				return /^\d+(\.\d+)?$/.test( v ) || isVar( v ) ? v : '';
			case 'number':
				return /^-?\d+(\.\d+)?$/.test( v ) || isVar( v ) ? v : '';
			case 'percent':
				return /^\d+(\.\d+)?$/.test( v ) && parseFloat( v ) <= 100 ? v : '';
			case 'percentnumber':
				return /^\d+(\.\d+)?$/.test( v ) || isVar( v ) ? v : '';
			case 'opacity':
				if ( isVar( v ) ) {
					return v;
				}
				return /^\d{1,3}$/.test( v ) && Number( v ) <= 100 ? String( Number( v ) / 100 ) : '';
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
			case 'template':
				return /^[A-Za-z0-9 .,()%+-]{1,160}$/.test( v ) ? v : '';
			case 'columns':
				// A count from 1 to 12 is that many equal columns; a bare number outside that is not a template.
				if ( /^(1[0-2]|[1-9])$/.test( v ) ) {
					return 'repeat(' + v + ', minmax(0, 1fr))';
				}
				return /^\d+$/.test( v ) ? '' : check( 'template', v );
			case 'areas':
				return v.length <= 300 && AREAS_OK.test( v ) ? v : '';
			case 'ident':
				return /^[A-Za-z][A-Za-z0-9_-]{0,39}$/.test( v ) ? v : '';
			case 'line':
				return /^([1-9]\d?|var\(--[a-z][a-z0-9-]*\))$/.test( v ) ? v : '';
			case 'span':
				return /^((1[0-2]|[1-9])|var\(--[a-z][a-z0-9-]*\))$/.test( v ) ? v : '';
			case 'flag':
				return v === '1' || v === 'true' ? '1' : '';
		}
		return '';
	}

	/** The rows of a grid's areas: quoted names, one string per row (the same rule as areas() in PHP). */
	const AREAS_OK = /^"[A-Za-z0-9_.-]+(\s+[A-Za-z0-9_.-]+)*"(\s+"[A-Za-z0-9_.-]+(\s+[A-Za-z0-9_.-]+)*")*$/;

	/** A plain number (no variable, no unit): the composed parts that add their own unit take only these. */
	function plainNumber( value ) {
		const t = str( value ).trim();
		return /^-?\d+(\.\d+)?$/.test( t ) ? t : '';
	}

	/** A grid has start and end where flex has flex-start and flex-end (the same as gridWord in PHP). */
	function gridWord( v ) {
		if ( v === 'flex-start' ) {
			return 'start';
		}
		if ( v === 'flex-end' ) {
			return 'end';
		}
		return v;
	}

	/** The display of the block as the table reads it: a choice, or block. */
	function displayOf( a ) {
		return DISPLAYS.indexOf( a.display ) !== -1 ? a.display : 'block';
	}

	const isGrid = ( d ) => d === 'grid' || d === 'inline-grid';
	const isFlex = ( d ) => d === 'flex' || d === 'inline-flex';

	/** Whether a row applies: its 'when' display, and its 'cond' (the same rule as applies() in PHP). */
	function applies( rule, display, a ) {
		if ( rule.when ) {
			const ok = rule.when === 'box' ? isFlex( display ) || isGrid( display ) : rule.when === 'flex' ? isFlex( display ) : isGrid( display );
			if ( ! ok ) {
				return false;
			}
		}
		if ( rule.cond === 'packs' ) {
			const wrap = FLEX_WRAP.indexOf( a.flexWrap ) !== -1 ? a.flexWrap : 'nowrap';
			return isGrid( display ) || wrap !== 'nowrap';
		}
		return true;
	}

	/** Where an item sits on a grid line: a start, a span, or both (the same rule as placement() in PHP). */
	function placement( start, span ) {
		const line = check( 'line', start );
		const sp = check( 'span', span );
		if ( line === '' ) {
			return sp === '' ? '' : 'span ' + sp;
		}
		return line + ( sp === '' ? '' : ' / span ' + sp );
	}

	/** The composed rows of the table: the grid's auto flow, and an item's grid line (column or row). */
	function compose( name, a ) {
		if ( name === 'autoflow' ) {
			const dense = phpTruthy( a.gridDense );
			const flow = GRID_FLOW.indexOf( a.gridAutoFlow ) !== -1 ? a.gridAutoFlow : 'row';
			return dense || flow === 'column' ? [ [ 'grid-auto-flow', flow + ( dense ? ' dense' : '' ) ] ] : [];
		}
		const line = name === 'placement_column' ? 'column' : 'row';
		const at = placement( a[ line + 'Start' ], a[ line + 'Span' ] );
		return at === '' ? [] : [ [ 'grid-' + line, at ] ];
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

	/** The repeater's stops (JSON), each a colour with an optional position. The same rule as gradient_stops() in PHP. */
	function gradientStops( a ) {
		let list;
		try {
			list = JSON.parse( str( a.gradientStops ) || 'null' );
		} catch ( e ) {
			return [];
		}
		const items = Array.isArray( list ) ? list : list && typeof list === 'object' ? Object.values( list ) : [];
		const out = [];
		items.slice( 0, MAX_STOPS ).forEach( ( item ) => {
			const colour = item && typeof item === 'object' ? check( 'color', item.color ) : '';
			if ( ! colour ) {
				return;
			}
			const stop = check( 'percent', item.stop );
			out.push( stop ? colour + ' ' + stop + '%' : colour );
		} );
		return out.length >= 2 ? out : [];
	}

	/** The gradient as a CSS image. '' when it has no two colours. The same as gradient_value() in PHP. */
	function gradientValue( a ) {
		let stops = gradientStops( a );
		if ( ! stops.length ) {
			const c1 = check( 'color', a.gradientColor1 );
			const c2 = check( 'color', a.gradientColor2 );
			if ( ! c1 || ! c2 ) {
				return '';
			}
			const s1 = check( 'percent', a.gradientStop1 );
			const s2 = check( 'percent', a.gradientStop2 );
			stops = [ c1 + ' ' + ( s1 || '0' ) + '%', c2 + ' ' + ( s2 || '100' ) + '%' ];
		}
		const list = stops.join( ', ' );
		if ( a.gradientType === 'radial' ) {
			return 'radial-gradient(' + list + ')';
		}
		const angle = plainNumber( a.gradientAngle );
		return 'linear-gradient(' + ( angle || '180' ) + 'deg, ' + list + ')';
	}

	/** The background declarations of the gradient: the image, and with Apply to: Text the clip and the transparent text. None for an overlay. */
	function gradient( a ) {
		const value = gradientValue( a );
		if ( ! value || a.gradientApply === 'overlay' ) {
			return [];
		}
		const out = [ [ 'background-image', value ] ];
		if ( a.gradientApply === 'text' ) {
			out.push( [ 'background-clip', 'text' ], [ '-webkit-background-clip', 'text' ], [ 'color', 'transparent' ] );
		}
		return out;
	}

	/** The overlay's ::before declarations (Apply to: Overlay), as pairs. Empty when the block has no overlay. */
	function overlay( a ) {
		const value = gradientValue( a );
		if ( ! value || a.gradientApply !== 'overlay' ) {
			return [];
		}
		return [ [ 'content', '""' ], [ 'position', 'absolute' ], [ 'inset', '0' ], [ 'z-index', '-1' ], [ 'pointer-events', 'none' ], [ 'border-radius', 'inherit' ], [ 'background-image', value ] ];
	}

	/**
	 * The declarations of a block for a table: the table's rows in their order (as the PHP writes them), then the composed
	 * Style properties. opts.view: the declarations of a view rule (a value that is the base's default is written too).
	 * @return {Array<[string, string]>} [ css property, value ] pairs.
	 */
	function declarations( a, table, opts ) {
		const view = !! ( opts && opts.view );
		const display = displayOf( a );
		const out = [];
		( table || [] ).forEach( ( row ) => {
			const key = row[ 0 ];
			const css = row[ 1 ];
			const type = row[ 2 ];
			const options = row[ 3 ] || [];
			const rule = row[ 4 ] || {};
			if ( ! applies( rule, display, a ) ) {
				return;
			}
			if ( rule.compose ) {
				compose( rule.compose, a ).forEach( ( d ) => out.push( d ) );
				return;
			}
			if ( ! css ) {
				return;
			}
			let value = check( type, a[ key ], options );
			// The default size of an image is cover (the same rule as declarations() in PHP).
			if ( ! value && key === 'backgroundSize' && check( 'url', a.backgroundImage ) ) {
				value = 'cover';
			}
			if ( ! value && rule.default !== undefined ) {
				value = rule.default;
			}
			if ( ! value ) {
				return;
			}
			if ( rule.gridWord && ( rule.gridWord === 'always' || isGrid( display ) ) ) {
				value = gridWord( value );
			}
			if ( rule.skip !== undefined && rule.skip === value && ! view ) {
				return;
			}
			out.push( [ css, value ] );
			( rule.extra || [] ).forEach( ( e ) => out.push( [ e[ 0 ], e[ 1 ] ] ) );
		} );
		[ boxShadow( a ), transform( a ), filter( a ) ].forEach( ( d ) => {
			if ( d ) {
				out.push( d );
			}
		} );
		gradient( a ).forEach( ( d ) => out.push( d ) );
		if ( overlay( a ).length ) {
			if ( ! out.some( ( d ) => d[ 0 ] === 'position' ) ) {
				out.push( [ 'position', 'relative' ] );
			}
			out.push( [ 'isolation', 'isolate' ] );
		}
		return out;
	}

	/** 'margin-top' becomes 'marginTop', as React's style objects name them. */
	function camel( prop ) {
		return prop.replace( /-([a-z])/g, ( m, c ) => c.toUpperCase() );
	}

	/** The style of a block as a React style object, from the table in snn.data (the block's canvas uses it). */
	function styleObject( a, opts ) {
		const out = {};
		declarations( a, ( snn.data && snn.data.styleTable ) || [], opts ).forEach( ( d ) => {
			out[ camel( d[ 0 ] ) ] = d[ 1 ];
		} );
		return out;
	}

	snn.styleProps = { check, declarations, camel, overlay, styleObject, gridWord, displayOf };
} )( typeof window !== 'undefined' ? window : globalThis );
