/**
 * Global styles: the modal and the toolbar button. See includes/blocks/global-styles.php.
 *
 * The modal is plain DOM (no React), so it works the same in wp-admin and in the block editor
 * and the Site Editor. The button sits in the editors' pinned items area at the top right, next
 * to Settings. Values are read and saved through REST (snn/v1/global-styles), and fonts are
 * downloaded through snn/v1/global-styles/fonts.
 */
( function () {
	'use strict';

	if ( window.snnGlobalStylesLoaded ) {
		return;
	}
	window.snnGlobalStylesLoaded = true;

	var cfg = window.snnGlobalStyles || {};
	var t = cfg.i18n || {};
	var schema = cfg.schema || [];
	var maxColors = cfg.maxColors || 12;
	var maxFonts = cfg.maxFonts || 12;
	var maxSizes = cfg.maxSizes || 12;
	// Starting values for a fluid size: 16 px at 380 px of viewport, 24 px at 1400 px.
	var FLUID_DEFAULT = { min: 16, max: 24, minVp: 380, maxVp: 1400 };
	var subsetChoices = cfg.subsets || [ 'latin' ];
	var weightChoices = [ '300', '400', '500', '600', '700', '800', '900' ];
	var state = null; // { draft, saved, tab, opener }
	var overlay = null;

	var LENGTH_RE = /^(0|\d+(\.\d+)?(px|rem|em|%|vw|vh|ch|vmin|vmax))$/;

	/* ------------------------------------------------------------------
	 * Helpers
	 * ---------------------------------------------------------------- */

	function clone( value ) {
		return JSON.parse( JSON.stringify( value ) );
	}

	function getPath( obj, path ) {
		return path.split( '.' ).reduce( function ( node, key ) {
			return node === null || node === undefined ? undefined : node[ key ];
		}, obj );
	}

	function setPath( obj, path, value ) {
		var keys = path.split( '.' );
		var last = keys.pop();
		var node = keys.reduce( function ( parent, key ) {
			if ( ! parent[ key ] || typeof parent[ key ] !== 'object' ) {
				parent[ key ] = {};
			}
			return parent[ key ];
		}, obj );
		node[ last ] = value;
	}

	function el( tag, attrs, children ) {
		var node = document.createElement( tag );
		attrs = attrs || {};
		Object.keys( attrs ).forEach( function ( key ) {
			var value = attrs[ key ];
			if ( value === null || value === undefined || value === false ) {
				return;
			}
			if ( key === 'on' ) {
				Object.keys( value ).forEach( function ( type ) {
					node.addEventListener( type, value[ type ] );
				} );
			} else if ( key === 'text' ) {
				node.textContent = value;
			} else if ( key === 'value' ) {
				node.value = value;
			} else if ( key === 'disabled' ) {
				node.disabled = true;
			} else {
				node.setAttribute( key, value === true ? '' : value );
			}
		} );
		( children || [] ).forEach( function ( child ) {
			if ( child ) {
				node.appendChild( typeof child === 'string' ? document.createTextNode( child ) : child );
			}
		} );
		return node;
	}

	function labelise( key ) {
		var text = String( key ).replace( /[-_]+/g, ' ' );
		return text.charAt( 0 ).toUpperCase() + text.slice( 1 );
	}

	function api( options ) {
		return window.wp.apiFetch( Object.assign( { url: cfg.restUrl }, options ) );
	}

	function inEditor() {
		return !! cfg.inEditor;
	}

	/** The post open in the block editor, when it is a page or post (its ID is a number). Null in the Site Editor. */
	function currentPageId() {
		if ( ! inEditor() || ! window.wp || ! window.wp.data ) {
			return null;
		}
		var id = null;
		try {
			id = window.wp.data.select( 'core/editor' ).getCurrentPostId();
		} catch ( error ) {
			id = null;
		}
		return /^\d+$/.test( String( id ) ) ? String( id ) : null;
	}

	/** The page styles from the server, as an object (an empty PHP array is read as nothing). */
	function pageValues( values ) {
		return values && typeof values === 'object' && ! Array.isArray( values ) ? clone( values ) : {};
	}

	/** The draft without the page styles: those are saved to their own route. */
	function globalValues( draft ) {
		var out = clone( draft );
		delete out.page;
		return out;
	}

	/** A slug for a new colour: lower case, dashes, unique among the colours in the draft. */
	function newSlug( name, colors ) {
		var base = String( name ).toLowerCase().replace( /[^a-z0-9]+/g, '-' ).replace( /^-+|-+$/g, '' ) || 'colour';
		var slug = base;
		var n = 2;
		var taken = colors.map( function ( c ) {
			return c.slug;
		} );
		while ( taken.indexOf( slug ) !== -1 ) {
			slug = base + '-' + n;
			n++;
		}
		return slug;
	}

	/* ------------------------------------------------------------------
	 * Validation (the server sanitises too; this tells the user what is wrong)
	 * ---------------------------------------------------------------- */

	function validate( draft ) {
		var errors = [];
		if ( ! draft.colors.length || draft.colors.some( function ( c ) {
			return ! String( c.slug || '' ).trim();
		} ) ) {
			errors.push( t.nameNeeded );
		}
		schema.forEach( function ( tab ) {
			( tab.groups || [] ).forEach( function ( group ) {
				( group.fields || [] ).forEach( function ( field ) {
					var raw = getPath( draft, field.path );
					var value = String( raw === null || raw === undefined ? '' : raw ).trim().toLowerCase();
					if ( value === '' && field.optional ) {
						return;
					}
					if ( ( field.type === 'length' || ( field.type === 'size' && ! draft.fluid[ field.path ] ) ) && ! LENGTH_RE.test( value ) ) {
						errors.push( field.label + ': ' + t.lengthError );
					} else if ( field.type === 'number' ) {
						var n = parseFloat( value.replace( ',', '.' ) );
						if ( isNaN( n ) || n < field.min || n > field.max ) {
							errors.push( field.label + ': ' + t.lineError );
						}
					}
				} );
			} );
		} );
		// Spacing sizes: a plain length unless fluid. Fluid settings must be in range.
		Object.keys( draft.sizes ).forEach( function ( slug ) {
			var key = 'sizes.' + slug;
			var value = String( draft.sizes[ slug ] ).trim().toLowerCase();
			if ( ! draft.fluid[ key ] && ! LENGTH_RE.test( value ) ) {
				errors.push( slug + ': ' + t.lengthError );
			}
		} );
		if ( Object.keys( draft.fluid ).some( function ( key ) {
			return ! fluidValid( draft.fluid[ key ] );
		} ) ) {
			errors.push( t.fluidError );
		}
		return errors;
	}

	/* ------------------------------------------------------------------
	 * Form fields
	 * ---------------------------------------------------------------- */

	/* ------------------------------------------------------------------
	 * Sizes: a length, or a fluid clamp between two viewport widths
	 * ---------------------------------------------------------------- */

	/** A draft from the server's values. PHP sends an empty array for an empty fluid map; it must be an object. */
	function prepare( values ) {
		var v = clone( values );
		if ( ! v.fluid || Array.isArray( v.fluid ) ) {
			v.fluid = {};
		}
		return v;
	}

	function round2( x ) {
		return Math.round( x * 100 ) / 100;
	}

	/** The CSS of a fluid size. Mirrors SNN_Global_Styles::fluid_css(); the server writes the final value. */
	function fluidCss( f ) {
		var lo = Math.min( f.min, f.max );
		var hi = Math.max( f.min, f.max );
		if ( f.maxVp === f.minVp ) {
			return round2( f.min ) + 'px';
		}
		var slope = ( f.max - f.min ) / ( f.maxVp - f.minVp );
		var intercept = f.min - slope * f.minVp;
		var vw = slope * 100;
		return 'clamp(' + round2( lo ) + 'px, calc(' + round2( intercept ) + 'px' + ( vw < 0 ? ' - ' : ' + ' ) + round2( Math.abs( vw ) ) + 'vw), ' + round2( hi ) + 'px)';
	}

	/** The four settings are in range and the two viewport widths differ. */
	function fluidValid( f ) {
		var nums = [ f.min, f.max, f.minVp, f.maxVp ];
		return nums.every( function ( n ) {
			return typeof n === 'number' && isFinite( n );
		} ) && f.min >= 0 && f.min <= 1000 && f.max >= 0 && f.max <= 1000 &&
			f.minVp >= 1 && f.minVp <= 4000 && f.maxVp >= 1 && f.maxVp <= 4000 && f.minVp !== f.maxVp;
	}

	function toNumber( value ) {
		var n = parseFloat( String( value ).replace( ',', '.' ) );
		return isNaN( n ) ? NaN : n;
	}

	/** The four fields of a fluid size. Each valid change rewrites the value (the clamp). */
	function fluidFields( key, f ) {
		var preview = el( 'code', { class: 'snn-gs-slug snn-gs-clamp', text: fluidCss( f ) } );
		var fields = [
			[ 'min', t.minSize ],
			[ 'max', t.maxSize ],
			[ 'minVp', t.minViewport ],
			[ 'maxVp', t.maxViewport ],
		];
		return el( 'div', { class: 'snn-gs-field snn-gs-fluid' }, [
			el( 'div', { class: 'snn-gs-fluid-grid' }, fields.map( function ( pair ) {
				return el( 'label', { class: 'snn-gs-fluid-field' }, [
					el( 'span', { text: pair[ 1 ] } ),
					el( 'input', {
						type: 'text',
						inputmode: 'decimal',
						value: String( f[ pair[ 0 ] ] ),
						on: { input: function ( event ) {
							f[ pair[ 0 ] ] = toNumber( event.target.value );
							if ( fluidValid( f ) ) {
								var css = fluidCss( f );
								setPath( state.draft, key, css );
								preview.textContent = css;
							}
						} },
					} ),
				] );
			} ) ),
			el( 'p', { class: 'snn-gs-hint' }, [ preview ] ),
		] );
	}

	/**
	 * The controls of one size: its value, and the Fluid switch. Fluid, the value is the clamp and the
	 * four fields below set it. Returns the parts, so a row can place them.
	 */
	function sizeControls( key, idBase ) {
		var fluid = state.draft.fluid[ key ] || null;
		var id = idBase + '-' + key.replace( /[^A-Za-z0-9_-]+/g, '-' );
		var value = getPath( state.draft, key );
		var input = el( 'input', {
			id: id,
			type: 'text',
			value: value === null || value === undefined ? '' : String( value ),
			spellcheck: 'false',
			disabled: fluid ? true : null,
			on: { input: function ( event ) {
				setPath( state.draft, key, event.target.value );
			} },
		} );
		var toggle = el( 'input', {
			type: 'checkbox',
			checked: fluid ? true : null,
			on: { change: function ( event ) {
				var f = state.draft.fluid[ key ];
				if ( event.target.checked ) {
					state.draft.fluid[ key ] = clone( FLUID_DEFAULT );
					setPath( state.draft, key, fluidCss( FLUID_DEFAULT ) );
				} else if ( f ) {
					// Off again: the size is the minimum, as a plain length the user can change.
					delete state.draft.fluid[ key ];
					setPath( state.draft, key, round2( f.min ) + 'px' );
				}
				showTab( state.tab );
			} },
		} );
		return {
			id: id,
			input: input,
			toggle: toggle,
			fluid: fluid ? fluidFields( key, fluid ) : null,
		};
	}

	/** A size in a form: its label, the Fluid switch, the value and (when fluid) the four fields. */
	function sizeField( field ) {
		var c = sizeControls( field.path, 'snn-gs' );
		return el( 'div', { class: 'snn-gs-field snn-gs-size' }, [
			el( 'div', { class: 'snn-gs-size-head' }, [
				el( 'label', { for: c.id, text: field.label } ),
				el( 'label', { class: 'snn-gs-fluid-switch' }, [ c.toggle, el( 'span', { text: t.fluid } ) ] ),
			] ),
			c.input,
			c.fluid,
		] );
	}

	function nextSizeSlug( slugs ) {
		var top = 0;
		slugs.forEach( function ( s ) {
			var m = /^size-(\d+)$/.exec( s );
			if ( m ) {
				top = Math.max( top, parseInt( m[ 1 ], 10 ) );
			}
		} );
		var n = top ? top + 10 : 10;
		while ( slugs.indexOf( 'size-' + n ) !== -1 ) {
			n += 10;
		}
		return 'size-' + n;
	}

	/** Rename a spacing size (its variable name). The name becomes the key, and its fluid settings follow. */
	function renameSize( slug, raw ) {
		var next = String( raw || '' ).trim().toLowerCase().replace( /[^a-z0-9-]+/g, '-' ).replace( /^-+|-+$/g, '' );
		var sizes = state.draft.sizes;
		if ( next === slug ) {
			return;
		}
		if ( ! next || Object.prototype.hasOwnProperty.call( sizes, next ) ) {
			setStatus( t.sizeNameError, 'error' );
			showTab( 'sizes' );
			return;
		}
		var rebuilt = {};
		Object.keys( sizes ).forEach( function ( k ) {
			rebuilt[ k === slug ? next : k ] = sizes[ k ];
		} );
		state.draft.sizes = rebuilt;
		retarget( 'sizes', slug, next );
		var from = 'sizes.' + slug;
		if ( state.draft.fluid[ from ] ) {
			state.draft.fluid[ 'sizes.' + next ] = state.draft.fluid[ from ];
			delete state.draft.fluid[ from ];
		}
		showTab( 'sizes' );
	}

	/** The spacing sizes: one row per size variable (name, value, fluid), and a button to add one. */
	function sizeListEditor() {
		var sizes = state.draft.sizes;
		var slugs = Object.keys( sizes );
		var rows = slugs.map( function ( slug ) {
			var key = 'sizes.' + slug;
			var c = sizeControls( key, 'snn-gs-sp-' + slug );
			return el( 'div', { class: 'snn-gs-field snn-gs-size-row' }, [
				el( 'div', { class: 'snn-gs-size-head' }, [
					el( 'input', {
						type: 'text',
						class: 'snn-gs-size-name',
						value: slug,
						maxlength: 40,
						spellcheck: 'false',
						'aria-label': t.sizeName,
						on: { change: function ( event ) {
							renameSize( slug, event.target.value );
						} },
					} ),
					el( 'label', { class: 'snn-gs-fluid-switch' }, [ c.toggle, el( 'span', { text: t.fluid } ) ] ),
					el( 'button', {
						type: 'button',
						class: 'snn-gs-link',
						text: t.remove,
						disabled: slugs.length <= 1,
						on: { click: function () {
							delete sizes[ slug ];
							delete state.draft.fluid[ key ];
							showTab( 'sizes' );
						} },
					} ),
				] ),
				c.input,
				c.fluid,
			] );
		} );

		var add = el( 'button', {
			type: 'button',
			class: 'snn-gs-button',
			text: t.addSize,
			disabled: slugs.length >= maxSizes,
			on: { click: function () {
				sizes[ nextSizeSlug( slugs ) ] = '1rem';
				showTab( 'sizes' );
			} },
		} );

		return el( 'div', { class: 'snn-gs-sizes' }, [
			el( 'p', { class: 'snn-gs-hint', text: t.sizesHint } ),
			el( 'div', { class: 'snn-gs-size-list' }, rows ),
			add,
		] );
	}

	/** The choices of a select. Optional fields start with "Inherit" (the empty value). */
	function fieldOptions( field ) {
		var list = field.optional ? [ { value: '', label: t.inherit } ] : [];
		var draft = state.draft;
		switch ( field.options_from ) {
			case 'palette':
				return list.concat( draft.colors.map( function ( c ) {
					return { value: c.slug, label: c.slug };
				} ) );
			case 'fonts':
				return list.concat( [ { value: 'system', label: t.system } ], ( draft.fonts || [] ).map( function ( f ) {
					return { value: f.slug, label: f.name };
				} ) );
			case 'sizes':
				return list.concat( Object.keys( draft.sizes ).map( function ( k ) {
					return { value: k, label: labelise( k ) };
				} ) );
		}
		return list.concat( field.options || [] );
	}

	function fieldNode( field ) {
		if ( field.type === 'size' ) {
			return sizeField( field );
		}
		var id = 'snn-gs-' + field.path.replace( /[^A-Za-z0-9_-]+/g, '-' );
		var value = getPath( state.draft, field.path );
		var current = value === null || value === undefined ? '' : String( value );
		var input;
		// Read state.draft when a change happens, not when the field was drawn: a save replaces the draft.
		var update = function ( next ) {
			setPath( state.draft, field.path, next );
		};

		if ( field.type === 'switch' ) {
			var box = el( 'input', {
				id: id,
				type: 'checkbox',
				checked: value === true ? true : null,
				on: { change: function ( event ) {
					update( event.target.checked );
				} },
			} );
			return el( 'div', { class: 'snn-gs-field snn-gs-field-switch' }, [
				el( 'label', { class: 'snn-gs-switch', for: id }, [ box, el( 'span', { text: field.label } ) ] ),
				field.hint ? el( 'p', { class: 'snn-gs-hint', text: field.hint } ) : null,
			] );
		}

		if ( field.type === 'select' ) {
			input = el( 'select', {
				id: id,
				on: { change: function ( event ) {
					update( event.target.value );
				} },
			}, fieldOptions( field ).map( function ( option ) {
				return el( 'option', {
					value: option.value,
					text: option.label,
					selected: String( option.value ) === current ? true : null,
				} );
			} ) );
		} else if ( field.type === 'number' ) {
			// A text field, not type=number: some locales show and type a comma, so a comma is read as a dot.
			input = el( 'input', {
				id: id,
				type: 'text',
				inputmode: 'decimal',
				value: current,
				placeholder: field.optional ? t.inherit : '',
				on: { input: function ( event ) {
					update( event.target.value.replace( ',', '.' ) );
				} },
			} );
		} else {
			input = el( 'input', {
				id: id,
				type: 'text',
				value: current,
				spellcheck: 'false',
				placeholder: field.optional ? t.inherit : '',
				on: { input: function ( event ) {
					update( event.target.value );
				} },
			} );
		}

		return el( 'div', { class: 'snn-gs-field' }, [
			el( 'label', { for: id, text: field.label } ),
			input,
		] );
	}

	/** A variable name: lower case letters, digits and dashes. Empty when nothing usable is left. */
	function variableName( raw ) {
		return String( raw || '' ).trim().toLowerCase().replace( /[^a-z0-9-]+/g, '-' ).replace( /^-+|-+$/g, '' );
	}

	/**
	 * A renamed variable keeps its block defaults: every field whose choices come from `optionsFrom`
	 * and that holds `from` now holds `to`.
	 */
	function retarget( optionsFrom, from, to ) {
		( function walk( nodes ) {
			( nodes || [] ).forEach( function ( node ) {
				( node.fields || [] ).forEach( function ( field ) {
					if ( field.options_from === optionsFrom && getPath( state.draft, field.path ) === from ) {
						setPath( state.draft, field.path, to );
					}
				} );
				walk( node.groups );
			} );
		} )( schema );
	}

	/** Rename a colour variable. Its name is its slug, and the block defaults that use it follow. */
	function renameColour( oldSlug, raw ) {
		var next = variableName( raw );
		var colors = state.draft.colors;
		if ( next === oldSlug ) {
			return;
		}
		if ( ! next || colors.some( function ( c ) {
			return c.slug === next;
		} ) ) {
			setStatus( t.sizeNameError, 'error' );
			showTab( 'colors' );
			return;
		}
		colors.forEach( function ( c ) {
			if ( c.slug === oldSlug ) {
				c.slug = next;
			}
		} );
		retarget( 'palette', oldSlug, next );
		showTab( 'colors' );
	}

	/** The colour list: the colour, its variable name (the name is the variable, --black), and remove. */
	function paletteEditor() {
		var colors = state.draft.colors;
		var rows = colors.map( function ( c, index ) {
			return el( 'div', { class: 'snn-gs-swatch' }, [
				el( 'input', {
					type: 'color',
					value: c.color,
					'aria-label': t.colourValue,
					on: { input: function ( event ) {
						c.color = event.target.value;
					} },
				} ),
				el( 'input', {
					type: 'text',
					class: 'snn-gs-size-name',
					value: c.slug,
					maxlength: 40,
					spellcheck: 'false',
					'aria-label': t.sizeName,
					on: { change: function ( event ) {
						renameColour( c.slug, event.target.value );
					} },
				} ),
				el( 'code', { class: 'snn-gs-slug', text: '--' + c.slug } ),
				el( 'button', {
					type: 'button',
					class: 'snn-gs-link',
					text: t.remove,
					disabled: colors.length <= 1,
					on: { click: function () {
						colors.splice( index, 1 );
						showTab( 'colors' );
					} },
				} ),
			] );
		} );

		var add = el( 'button', {
			type: 'button',
			class: 'snn-gs-button',
			text: t.addColour,
			disabled: colors.length >= maxColors,
			on: { click: function () {
				colors.push( { slug: newSlug( t.newColour, colors ), color: '#808080' } );
				showTab( 'colors' );
			} },
		} );

		return el( 'div', { class: 'snn-gs-palette' }, [
			el( 'p', { class: 'snn-gs-hint', text: t.paletteHint } ),
			el( 'div', { class: 'snn-gs-swatches' }, rows ),
			add,
		] );
	}

	/** Install and remove Google Fonts. Changes are saved at once, so they are not part of the draft. */
	function fontLibraryGroup( group ) {
		var fonts = state.draft.fonts || [];
		var list = fonts.length
			? el( 'ul', { class: 'snn-gs-fonts' }, fonts.map( function ( font ) {
				var weights = [];
				font.faces.forEach( function ( face ) {
					if ( weights.indexOf( face.weight ) === -1 ) {
						weights.push( face.weight );
					}
				} );
				return el( 'li', { class: 'snn-gs-font' }, [
					el( 'span', { class: 'snn-gs-font-name', text: font.name } ),
					el( 'span', { class: 'snn-gs-hint', text: weights.join( ', ' ) } ),
					el( 'button', {
						type: 'button',
						class: 'snn-gs-link',
						text: t.fontRemove,
						on: { click: function () {
							removeFont( font.slug );
						} },
					} ),
				] );
			} ) )
			: el( 'p', { class: 'snn-gs-hint', text: t.noFonts } );

		var nameInput = el( 'input', {
			type: 'text',
			id: 'snn-gs-font-family',
			placeholder: 'Inter',
			spellcheck: 'false',
			'aria-describedby': 'snn-gs-font-family-hint',
		} );
		var weightBoxes = weightChoices.map( function ( w ) {
			return el( 'label', { class: 'snn-gs-check' }, [
				el( 'input', { type: 'checkbox', value: w, checked: w === '400' || w === '700' ? true : null } ),
				w,
			] );
		} );
		var subsetBoxes = subsetChoices.map( function ( s, index ) {
			return el( 'label', { class: 'snn-gs-check' }, [
				el( 'input', { type: 'checkbox', value: s, checked: index === 0 ? true : null } ),
				labelise( s ),
			] );
		} );
		var download = el( 'button', {
			type: 'button',
			class: 'snn-gs-button snn-gs-primary',
			text: t.fontDownload,
		} );
		download.addEventListener( 'click', function () {
			var family = nameInput.value.trim();
			var weights = checkedValues( weightBoxes ).map( Number );
			var subsets = checkedValues( subsetBoxes );
			if ( ! family ) {
				setStatus( t.fontNameNeeded, 'error' );
				return;
			}
			if ( ! weights.length || ! subsets.length ) {
				setStatus( t.fontError, 'error' );
				return;
			}
			if ( fonts.length >= maxFonts ) {
				setStatus( t.fontLimit, 'error' );
				return;
			}
			download.disabled = true;
			setStatus( t.fontDownloading, '' );
			api( { url: cfg.restUrl + '/fonts', method: 'POST', data: { family: family, weights: weights, subsets: subsets } } ).then( function ( response ) {
				applyFonts( response.values.fonts, inEditor() ? t.fontInstalledEditor : t.fontInstalled );
			} ).catch( function ( error ) {
				download.disabled = false;
				setStatus( ( error && error.message ) || t.fontError, 'error' );
			} );
		} );

		return el( 'section', { class: 'snn-gs-group' }, [
			el( 'h3', { class: 'snn-gs-group-title', text: group.title } ),
			el( 'p', { class: 'snn-gs-hint snn-gs-note', text: t.fontsHint } ),
			list,
			el( 'div', { class: 'snn-gs-font-form' }, [
				el( 'div', { class: 'snn-gs-field' }, [
					el( 'label', { for: 'snn-gs-font-family', text: t.fontFamily } ),
					nameInput,
					el( 'p', { class: 'snn-gs-hint', id: 'snn-gs-font-family-hint', text: t.fontFamilyHint } ),
				] ),
				el( 'div', { class: 'snn-gs-field' }, [
					el( 'span', { class: 'snn-gs-label', text: t.fontWeights } ),
					el( 'div', { class: 'snn-gs-checks' }, weightBoxes ),
				] ),
				el( 'div', { class: 'snn-gs-field' }, [
					el( 'span', { class: 'snn-gs-label', text: t.fontSubsets } ),
					el( 'div', { class: 'snn-gs-checks' }, subsetBoxes ),
				] ),
				el( 'div', { class: 'snn-gs-font-actions' }, [ download ] ),
			] ),
		] );
	}

	function checkedValues( boxes ) {
		return boxes.filter( function ( label ) {
			return label.querySelector( 'input' ).checked;
		} ).map( function ( label ) {
			return label.querySelector( 'input' ).value;
		} );
	}

	/**
	 * A schema group: the font library, a collapsible card, or a plain section. A group holds its
	 * own fields and/or nested groups (the blocks tab nests cards in sections).
	 */
	function groupNode( group ) {
		if ( group.fonts ) {
			return fontLibraryGroup( group );
		}
		if ( group.sizes ) {
			return el( 'section', { class: 'snn-gs-group' }, [
				el( 'h3', { class: 'snn-gs-group-title', text: group.title } ),
				sizeListEditor(),
			] );
		}
		var children = [];
		if ( group.fields && group.fields.length ) {
			children.push( el( 'div', { class: 'snn-gs-grid' }, group.fields.map( fieldNode ) ) );
		}
		( group.groups || [] ).forEach( function ( child ) {
			children.push( groupNode( child ) );
		} );
		var note = group.note ? el( 'p', { class: 'snn-gs-hint snn-gs-note', text: group.note } ) : null;
		if ( group.collapsible ) {
			return el( 'details', { class: 'snn-gs-card', open: group.open ? true : null }, [
				el( 'summary', { class: 'snn-gs-card-title', text: group.title } ),
				note,
			].concat( children ) );
		}
		return el( 'section', { class: 'snn-gs-group' }, [
			el( 'h3', { class: 'snn-gs-group-title', text: group.title } ),
			note,
		].concat( children ) );
	}

	function renderPanel( tabId ) {
		var tab = schema.filter( function ( item ) {
			return item.id === tabId;
		} )[ 0 ];
		var panel = el( 'div', {
			class: 'snn-gs-panel',
			role: 'tabpanel',
			id: 'snn-gs-panel-' + tabId,
			'aria-labelledby': 'snn-gs-tab-' + tabId,
			tabindex: '0',
		} );
		if ( tab.page && ! state.pageId ) {
			panel.appendChild( el( 'p', { class: 'snn-gs-hint', text: state.pageError ? t.pageLoadError : t.pageNone } ) );
			return panel;
		}
		if ( tab.palette ) {
			panel.appendChild( paletteEditor() );
		}
		( tab.groups || [] ).forEach( function ( group ) {
			panel.appendChild( groupNode( group ) );
		} );
		return panel;
	}

	/* ------------------------------------------------------------------
	 * Fonts: install and remove (saved at once)
	 * ---------------------------------------------------------------- */

	function applyFonts( fonts, message ) {
		state.draft.fonts = clone( fonts );
		state.saved.fonts = clone( fonts );
		showTab( state.tab );
		setStatus( message, 'ok', inEditor() );
	}

	function removeFont( slug ) {
		setStatus( t.loading, '' );
		api( { url: cfg.restUrl + '/fonts/' + encodeURIComponent( slug ), method: 'DELETE' } ).then( function ( response ) {
			applyFonts( response.values.fonts, t.fontRemoved );
		} ).catch( function ( error ) {
			setStatus( ( error && error.message ) || t.error, 'error' );
		} );
	}

	/* ------------------------------------------------------------------
	 * Modal
	 * ---------------------------------------------------------------- */

	function setStatus( text, kind, withReload ) {
		var node = overlay && overlay.querySelector( '.snn-gs-status' );
		if ( ! node ) {
			return;
		}
		node.textContent = text || '';
		node.className = 'snn-gs-status' + ( kind ? ' is-' + kind : '' );
		if ( withReload ) {
			node.appendChild( document.createTextNode( ' ' ) );
			node.appendChild( el( 'button', {
				type: 'button',
				class: 'snn-gs-link',
				text: t.reload,
				on: { click: reloadEditor },
			} ) );
		}
	}

	function showTab( id ) {
		state.tab = id;
		var bar = overlay.querySelector( '.snn-gs-tabs' );
		Array.prototype.forEach.call( bar.children, function ( button ) {
			var on = button.id === 'snn-gs-tab-' + id;
			button.setAttribute( 'aria-selected', on ? 'true' : 'false' );
			button.tabIndex = on ? 0 : -1;
		} );
		var body = overlay.querySelector( '.snn-gs-body' );
		body.innerHTML = '';
		body.appendChild( renderPanel( id ) );
	}

	function renderTabs() {
		var bar = overlay.querySelector( '.snn-gs-tabs' );
		bar.innerHTML = '';
		schema.forEach( function ( tab ) {
			bar.appendChild( el( 'button', {
				type: 'button',
				role: 'tab',
				id: 'snn-gs-tab-' + tab.id,
				class: 'snn-gs-tab',
				'aria-controls': 'snn-gs-panel-' + tab.id,
				text: tab.label,
				on: { click: function () {
					showTab( tab.id );
				} },
			} ) );
		} );
	}

	function isDirty() {
		return !! ( state && state.draft && JSON.stringify( state.draft ) !== JSON.stringify( state.saved ) );
	}

	function closeNow() {
		if ( ! overlay ) {
			return;
		}
		var opener = state && state.opener;
		overlay.parentNode.removeChild( overlay );
		overlay = null;
		state = null;
		if ( opener && typeof opener.focus === 'function' ) {
			opener.focus();
		}
	}

	function requestClose() {
		if ( isDirty() && ! window.confirm( t.discard ) ) {
			return;
		}
		closeNow();
	}

	function reloadEditor() {
		var dirty = false;
		try {
			dirty = !! ( window.wp.data.select( 'core/editor' ).isEditedPostDirty() );
		} catch ( error ) {
			dirty = false;
		}
		if ( dirty && ! window.confirm( t.reloadDirty ) ) {
			return;
		}
		window.location.reload();
	}

	function resetDraft() {
		var fonts = state.draft.fonts; // Installed fonts are not defaults: they stay.
		var page = state.draft.page; // The page styles are not global defaults: they stay too.
		state.draft = prepare( cfg.defaults );
		state.draft.fonts = fonts;
		state.draft.page = page;
		showTab( state.tab );
		setStatus( t.resetDone, '' );
	}

	function save() {
		var errors = validate( state.draft );
		if ( errors.length ) {
			setStatus( errors[ 0 ] + ( errors.length > 1 ? ' (+' + ( errors.length - 1 ) + ')' : '' ), 'error' );
			return;
		}
		setStatus( t.saving, '' );
		var page = pageValues( state.draft.page );
		api( { method: 'POST', data: { values: globalValues( state.draft ) } } ).then( function ( response ) {
			if ( ! state.pageId ) {
				return { global: response, page: page };
			}
			return api( { url: cfg.pageUrl + state.pageId, method: 'POST', data: { values: page } } ).then( function ( saved ) {
				return { global: response, page: pageValues( saved.values ) };
			} );
		} ).then( function ( result ) {
			state.draft = prepare( result.global.values );
			state.saved = prepare( result.global.values );
			state.draft.page = clone( result.page );
			state.saved.page = clone( result.page );
			showTab( state.tab ); // Redraw, so the fields and the colour list work on the new draft.
			if ( inEditor() ) {
				setStatus( t.savedEditor, 'ok', true );
			} else {
				setStatus( t.saved, 'ok' );
			}
		} ).catch( function () {
			setStatus( t.error, 'error' );
		} );
	}

	function tabKeys( event ) {
		var ids = schema.map( function ( tab ) {
			return tab.id;
		} );
		var index = ids.indexOf( state.tab );
		var next = null;
		if ( event.key === 'ArrowRight' ) {
			next = ids[ ( index + 1 ) % ids.length ];
		} else if ( event.key === 'ArrowLeft' ) {
			next = ids[ ( index - 1 + ids.length ) % ids.length ];
		}
		if ( next ) {
			event.preventDefault();
			showTab( next );
			overlay.querySelector( '#snn-gs-tab-' + next ).focus();
		}
	}

	function onKeydown( event ) {
		if ( event.key === 'Escape' ) {
			event.stopPropagation();
			requestClose();
			return;
		}
		if ( event.key !== 'Tab' ) {
			return;
		}
		var dialog = overlay.querySelector( '.snn-gs-modal' );
		var items = Array.prototype.filter.call( dialog.querySelectorAll( 'button, input, select, textarea' ), function ( node ) {
			return ! node.disabled && node.tabIndex >= 0;
		} );
		if ( ! items.length ) {
			return;
		}
		var first = items[ 0 ];
		var last = items[ items.length - 1 ];
		if ( event.shiftKey && document.activeElement === first ) {
			event.preventDefault();
			last.focus();
		} else if ( ! event.shiftKey && document.activeElement === last ) {
			event.preventDefault();
			first.focus();
		}
	}

	function buildShell() {
		var close = el( 'button', {
			type: 'button',
			class: 'snn-gs-close',
			'aria-label': t.close,
			text: '×',
			on: { click: function () {
				requestClose();
			} },
		} );
		var dialog = el( 'div', {
			class: 'snn-gs-modal',
			role: 'dialog',
			'aria-modal': 'true',
			'aria-labelledby': 'snn-gs-title',
		}, [
			el( 'header', { class: 'snn-gs-head' }, [
				el( 'div', {}, [
					el( 'h2', { id: 'snn-gs-title', text: t.title } ),
					el( 'p', { class: 'snn-gs-intro', text: t.intro } ),
				] ),
				close,
			] ),
			el( 'div', { class: 'snn-gs-tabs', role: 'tablist', 'aria-label': t.tabs, on: { keydown: tabKeys } } ),
			el( 'div', { class: 'snn-gs-body' } ),
			el( 'footer', { class: 'snn-gs-foot' }, [
				el( 'div', { class: 'snn-gs-foot-left' }, [
					el( 'button', { type: 'button', class: 'snn-gs-link', text: t.reset, on: { click: resetDraft } } ),
					el( 'p', { class: 'snn-gs-status', role: 'status', 'aria-live': 'polite' } ),
				] ),
				el( 'div', { class: 'snn-gs-foot-right' }, [
					el( 'button', { type: 'button', class: 'snn-gs-button', text: t.cancel, on: { click: function () {
						requestClose();
					} } } ),
					el( 'button', { type: 'button', class: 'snn-gs-button snn-gs-primary', text: t.save, on: { click: save } } ),
				] ),
			] ),
		] );
		var root = el( 'div', { class: 'snn-gs-overlay' }, [ dialog ] );
		root.addEventListener( 'keydown', onKeydown );
		root.addEventListener( 'mousedown', function ( event ) {
			if ( event.target === root ) {
				requestClose();
			}
		} );
		return root;
	}

	/**
	 * The page styles of the post open in the editor. A page that cannot be read is treated as not
	 * editable, so a save cannot overwrite its stored styles with empty ones.
	 */
	function loadPage() {
		if ( ! state.pageId ) {
			return Promise.resolve( {} );
		}
		return api( { url: cfg.pageUrl + state.pageId, method: 'GET' } ).then( function ( response ) {
			return pageValues( response.values );
		} ).catch( function () {
			state.pageId = null;
			state.pageError = true;
			return {};
		} );
	}

	function openModal() {
		if ( overlay || ! window.wp || ! window.wp.apiFetch ) {
			return;
		}
		state = {
			draft: null,
			saved: null,
			tab: schema.length ? schema[ 0 ].id : '',
			opener: document.activeElement,
			pageId: currentPageId(),
			pageError: false,
		};
		overlay = buildShell();
		document.body.appendChild( overlay );
		setStatus( t.loading, '' );
		api( { method: 'GET' } ).then( function ( response ) {
			state.draft = prepare( response.values );
			state.saved = prepare( response.values );
			return loadPage().then( function ( page ) {
				state.draft.page = clone( page );
				state.saved.page = clone( page );
			} );
		} ).then( function () {
			renderTabs();
			showTab( state.tab );
			setStatus( '', '' );
			var first = overlay && overlay.querySelector( '.snn-gs-tab[aria-selected="true"]' );
			if ( first ) {
				first.focus();
			}
		} ).catch( function () {
			setStatus( t.loadError, 'error' );
		} );
	}

	/* ------------------------------------------------------------------
	 * Entry points: the editor's top-right button and the admin bar item
	 * ---------------------------------------------------------------- */

	/*
	 * The block editor's canvas is an iframe with its own html element, so the root font size
	 * (the base size, which rem units follow) is set there too. Core's own styles do not reach html.
	 */
	function watchCanvas() {
		if ( ! inEditor() || ! cfg.rootSize ) {
			return;
		}
		var watched = null;
		function apply( frame ) {
			try {
				var doc = frame.contentDocument;
				if ( ! doc || ! doc.head || doc.getElementById( 'snn-root-size' ) ) {
					return;
				}
				var style = doc.createElement( 'style' );
				style.id = 'snn-root-size';
				style.textContent = 'html{font-size:' + cfg.rootSize + '}';
				doc.head.appendChild( style );
			} catch ( error ) {
				// The canvas is not reachable yet. The load listener tries again.
			}
		}
		function check() {
			var frame = document.querySelector( 'iframe[name="editor-canvas"]' );
			if ( ! frame ) {
				return;
			}
			if ( frame !== watched ) {
				watched = frame;
				frame.addEventListener( 'load', function () {
					apply( frame );
				} );
			}
			apply( frame );
		}
		check();
		new MutationObserver( check ).observe( document.body, { childList: true, subtree: true } );
	}

	/*
	 * The editors' pinned items area (where Settings sits) is a SlotFill slot named
	 * PinnedItems/<scope>. The editor bundle does not export its PinnedItems fill, so we fill
	 * the same slot directly with wp.components.Fill, as that component does.
	 */
	function registerToolbarButton() {
		if ( ! inEditor() || ! window.wp || ! wp.plugins || ! wp.plugins.registerPlugin || ! wp.components || ! wp.components.Fill || ! wp.element ) {
			return;
		}
		var h = wp.element.createElement;
		wp.plugins.registerPlugin( 'snn-global-styles', {
			render: function () {
				return h(
					wp.components.Fill,
					{ name: 'PinnedItems/core' },
					h( 'button', {
						type: 'button',
						className: 'components-button has-icon snn-gs-toolbar-button',
						'aria-label': t.button,
						title: t.button,
						onClick: function () {
							openModal();
						},
					}, h( 'svg', {
						xmlns: 'http://www.w3.org/2000/svg',
						width: 24,
						height: 24,
						viewBox: '0 0 24 24',
						'aria-hidden': 'true',
						focusable: 'false',
					}, [
						// A palette: the body with three holes for the paint dots (even-odd fill).
						h( 'path', {
							key: 'palette',
							fill: 'currentColor',
							fillRule: 'evenodd',
							d: 'M12 3a9 9 0 0 0 0 18c1.1 0 1.6-.8 1.6-1.6 0-.4-.2-.8-.4-1-.3-.3-.4-.6-.4-1 0-.9.7-1.6 1.6-1.6H16c2.2 0 4-1.8 4-4 0-4.4-3.6-8.8-8-8.8z' +
								'M7.5 9.5a1.2 1.2 0 1 0 0 2.4 1.2 1.2 0 1 0 0-2.4z' +
								'M10.5 5.8a1.2 1.2 0 1 0 0 2.4 1.2 1.2 0 1 0 0-2.4z' +
								'M15 6.3a1.2 1.2 0 1 0 0 2.4 1.2 1.2 0 1 0 0-2.4z',
						} ),
					] ) )
				);
			},
		} );
	}

	if ( cfg.nonce && window.wp && wp.apiFetch && wp.apiFetch.createNonceMiddleware ) {
		wp.apiFetch.use( wp.apiFetch.createNonceMiddleware( cfg.nonce ) );
	}

	registerToolbarButton();
	watchCanvas();

	document.addEventListener( 'click', function ( event ) {
		var link = event.target && event.target.closest ? event.target.closest( '#wp-admin-bar-snn-global-styles a' ) : null;
		if ( link ) {
			event.preventDefault();
			openModal();
		}
	} );

	cfg.open = openModal;
} )();
