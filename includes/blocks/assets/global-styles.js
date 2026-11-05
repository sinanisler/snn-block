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
	var subsetChoices = cfg.subsets || [ 'latin' ];
	var weightChoices = [ '300', '400', '500', '600', '700', '800', '900' ];
	var state = null; // { draft, saved, tab, opener }
	var overlay = null;

	var LENGTH_RE = /^(0|\d+(\.\d+)?(px|rem|em|%|vw|vh|ch|vmin|vmax))$/;
	var SHADOW_RE = /^[A-Za-z0-9 ,.()%#+\-]+$/;

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
			return ! String( c.name || '' ).trim();
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
					if ( field.type === 'length' && ! LENGTH_RE.test( value ) ) {
						errors.push( field.label + ': ' + t.lengthError );
					} else if ( field.type === 'number' ) {
						var n = parseFloat( value );
						if ( isNaN( n ) || n < field.min || n > field.max ) {
							errors.push( field.label + ': ' + t.lineError );
						}
					} else if ( field.type === 'shadow' && ! SHADOW_RE.test( value ) ) {
						errors.push( field.label + ': ' + t.shadowError );
					}
				} );
			} );
		} );
		return errors;
	}

	/* ------------------------------------------------------------------
	 * Form fields
	 * ---------------------------------------------------------------- */

	/** The choices of a select. Optional fields start with "Inherit" (the empty value). */
	function fieldOptions( field ) {
		var list = field.optional ? [ { value: '', label: t.inherit } ] : [];
		var draft = state.draft;
		switch ( field.options_from ) {
			case 'palette':
				return list.concat( draft.colors.map( function ( c ) {
					return { value: c.slug, label: c.name };
				} ) );
			case 'fonts':
				return list.concat( [ { value: 'system', label: t.system } ], ( draft.fonts || [] ).map( function ( f ) {
					return { value: f.slug, label: f.name };
				} ) );
			case 'sizes':
				return list.concat( Object.keys( draft.typography.sizes ).map( function ( k ) {
					return { value: k, label: labelise( k ) };
				} ) );
			case 'radius':
				return list.concat( Object.keys( draft.shape.radius ).map( function ( k ) {
					return { value: k, label: labelise( k ) };
				} ) );
			case 'shadows':
				return list.concat( Object.keys( draft.shape.shadows ).map( function ( k ) {
					return { value: k, label: labelise( k ) };
				} ) );
		}
		return list.concat( field.options || [] );
	}

	function fieldNode( field ) {
		var draft = state.draft;
		var id = 'snn-gs-' + field.path.replace( /[^A-Za-z0-9_-]+/g, '-' );
		var value = getPath( draft, field.path );
		var current = value === null || value === undefined ? '' : String( value );
		var input;
		var update = function ( next ) {
			setPath( draft, field.path, next );
		};

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
			input = el( 'input', {
				id: id,
				type: 'number',
				step: field.step || 0.05,
				min: field.min,
				max: field.max,
				value: current,
				placeholder: field.optional ? t.inherit : '',
				on: { input: function ( event ) {
					update( event.target.value );
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

	/** The colour list: colour, name, and the variable name the blocks refer to. */
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
					value: c.name,
					maxlength: 40,
					'aria-label': t.colourName,
					on: { input: function ( event ) {
						c.name = event.target.value;
					} },
				} ),
				el( 'code', { class: 'snn-gs-slug', text: '--wp--preset--color--' + c.slug } ),
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
				var name = t.newColour + ' ' + ( colors.length + 1 );
				colors.push( { name: name, slug: newSlug( name, colors ), color: '#808080' } );
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

	/** A schema group: a font library, a collapsible card (blocks), or a plain group. */
	function groupNode( group ) {
		if ( group.fonts ) {
			return fontLibraryGroup( group );
		}
		var grid = el( 'div', { class: 'snn-gs-grid' }, group.fields.map( fieldNode ) );
		if ( group.collapsible ) {
			return el( 'details', { class: 'snn-gs-card', open: group.open ? true : null }, [
				el( 'summary', { class: 'snn-gs-card-title', text: group.title } ),
				group.note ? el( 'p', { class: 'snn-gs-hint snn-gs-note', text: group.note } ) : null,
				grid,
			] );
		}
		return el( 'section', { class: 'snn-gs-group' }, [
			el( 'h3', { class: 'snn-gs-group-title', text: group.title } ),
			grid,
		] );
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
		state.draft = clone( cfg.defaults );
		state.draft.fonts = fonts;
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
		api( { method: 'POST', data: { values: state.draft } } ).then( function ( response ) {
			state.draft = clone( response.values );
			state.saved = clone( response.values );
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

	function openModal() {
		if ( overlay || ! window.wp || ! window.wp.apiFetch ) {
			return;
		}
		state = {
			draft: null,
			saved: null,
			tab: schema.length ? schema[ 0 ].id : '',
			opener: document.activeElement,
		};
		overlay = buildShell();
		document.body.appendChild( overlay );
		setStatus( t.loading, '' );
		api( { method: 'GET' } ).then( function ( response ) {
			state.draft = clone( response.values );
			state.saved = clone( response.values );
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

	document.addEventListener( 'click', function ( event ) {
		var link = event.target && event.target.closest ? event.target.closest( '#wp-admin-bar-snn-global-styles a' ) : null;
		if ( link ) {
			event.preventDefault();
			openModal();
		}
	} );

	cfg.open = openModal;
} )();
