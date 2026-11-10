/**
 * SNN block editor: the CSS group of the Style tab: the code editor with its selectors and variable completion.
 *
 * Part of the editor split of the old layout-blocks.js (see the change notes).
 */
( function ( wp ) {
	const C = snn.controls;
	const I = snn.layoutIcons;
	const { createElement: h, Fragment, useState, useEffect, useRef, useLayoutEffect } = wp.element;
	const { __, sprintf } = wp.i18n;
	const { registerBlockType } = wp.blocks;
	const { InnerBlocks, InspectorControls, RichText, useBlockProps, useInnerBlocksProps } = wp.blockEditor;
	const { useSelect } = wp.data;
	const { main: mainPic, cross: crossPic, direction: directionPic, reverse: reversePic, columns: columnsPic } = I;
	const { Row, SwitchRow, Accordion, Select, Segmented, TextField, Group, Disclosure, Dot, Switch, ViewRow, ownValue, inheritedValue, setValue, clearValue, effectiveValues, tipAttr, ToolbarPicker } = C;
	const { HeadIcons, ClassesEditor, AttributesEditor, ConditionsEditor, InteractionsEditor } = snn.blockTools;
	const { AnimationsPane, stateOf, canvasDataAnimate } = snn.animationPane;
	const { ColorPalette, MediaUpload, MediaUploadCheck } = wp.blockEditor;
	const { Button, ColorPicker, Fill, Popover, ToolbarButton } = wp.components;
	const { applyFormat, create, getActiveFormat, insert, insertObject, removeFormat, toggleFormat } = wp.richText;
	const data = snn.data.controls || {};
	const { VARIABLE_GROUPS, options } = snn.panel;

	/** The selectors the CSS group's selector list writes: a rule with the selector goes in at the caret. */
	const CSS_SELECTORS = [
		{ value: '%root%', label: __( 'This block (%root%)', 'snn' ) },
		{ value: '%root%:hover', label: __( 'Hover', 'snn' ) },
		{ value: '%root%:focus-visible', label: __( 'Keyboard focus', 'snn' ) },
		{ value: '%root%::before', label: __( 'Before (::before)', 'snn' ) },
		{ value: '%root%::after', label: __( 'After (::after)', 'snn' ) },
		{ value: '%root% > *', label: __( 'Direct children', 'snn' ) },
	];

	/** What an empty CSS editor starts with: the block's own selector, with the caret inside the rule. */
	const CSS_STARTER = '%root% {\n\t\n}';

		/** The custom CSS as the front end prints it (clean_css in layout-blocks.php): no style or script tags, comments or imports, 4000 characters at most. */
		function cleanCss( value ) {
			let css = String( value || '' ).slice( 0, 4000 );
			let before;
			// Removed until nothing is left to remove, then any < that could open a tag becomes its CSS escape (as the PHP does).
			do {
				before = css;
				css = css.replace( /<\/?\s*(style|script)[^>]*>|<!--|-->|@import[^;]*;?/gi, '' );
			} while ( css !== before );
			return css.replace( /<(?=[A-Za-z\/!?])/g, '\\3c ' ).trim();
		}

		/** A class for one CSS text in the editor. The editor scopes the rules with it, as the front end scopes them with snn-c-<md5>. */
		function cssScope( css ) {
			let hash = 2166136261;
			for ( let i = 0; i < css.length; i++ ) {
				hash = Math.imul( hash ^ css.charCodeAt( i ), 16777619 );
			}
			return 'snn-c-' + ( hash >>> 0 ).toString( 16 );
		}

		/** The custom CSS with the block's class in place of its name: %root% and selector both mean the block (scope_css in layout-blocks.php). */
		function scopeCss( css, selector ) {
			const parts = css.split( /([{};])/ );
			let out = '';
			parts.forEach( ( part, i ) => {
				if ( i % 2 === 0 && parts[ i + 1 ] === '{' ) {
					part = part.replace( /(^|[\s,>+~(])selector(?![\w-])/gi, '$1' + selector );
				}
				out += part;
			} );
			return out.split( '%root%' ).join( selector );
		}

		/**
		 * Where the caret is in a CSS value: inside a rule, after the colon of the current declaration. Also the word
		 * before the caret (var( and the dashes count as part of it) and the place where that word starts.
		 */
		function cssValueAt( cm ) {
			const cur = cm.getCursor();
			const before = cm.getRange( { line: 0, ch: 0 }, cur );
			const open = before.lastIndexOf( '{' );
			const declaration = before.slice( Math.max( open, before.lastIndexOf( ';' ) ) + 1 );
			const line = cm.getLine( cur.line ).slice( 0, cur.ch );
			const word = /(?:var\(\s*)?[\w-]*$/.exec( line )[ 0 ];
			return {
				cur,
				word,
				line,
				from: { line: cur.line, ch: cur.ch - word.length },
				prop: ( /([a-z-]+)\s*:[^:]*$/i.exec( declaration ) || [ '', '' ] )[ 1 ].toLowerCase(),
				inValue: open > before.lastIndexOf( '}' ) && declaration.indexOf( ':' ) !== -1,
			};
		}

		/**
		 * Which kind of variable is listed first for a property (the V picker's rule): sizes for a size property, colours
		 * for everything else. Returns 0 for the kind that comes first and 1 for the other.
		 */
		function kindRank( kind, prop ) {
			const sizeProp = /^(margin|padding|gap|row-gap|column-gap|inset|top|right|bottom|left|width|height|min-width|min-height|max-width|max-height|font-size|line-height|letter-spacing|border-width|border-radius|flex-basis|text-indent|outline-offset)/;
			const sizeFirst = sizeProp.test( prop ) && ! /color|fill|stroke|shadow/.test( prop );
			return ( kind === 'size' ) === sizeFirst ? 0 : 1;
		}

		/** One variable as a completion: its name (--black), a swatch for a colour, and the var() text it writes. */
		function variableCompletion( it ) {
			const name = '--' + it.label;
			return {
				text: it.value,
				displayText: name,
				render: function ( elt ) {
					if ( it.color ) {
						const swatch = document.createElement( 'span' );
						swatch.className = 'snn-swatch';
						swatch.style.background = it.color;
						elt.appendChild( swatch );
					}
					elt.appendChild( document.createTextNode( name ) );
				},
			};
		}

		/**
		 * The autocomplete of the CSS editor. In a value (color: , padding: ) it offers the variables first: the same
		 * colours and sizes the V button lists, filtered by what is typed. Then the CodeMirror keyword list, as before.
		 * Anywhere else it is the keyword list alone.
		 */
		function cssHint( cm, options ) {
			const at = cssValueAt( cm );
			// A lone r at the start of a word is the %root% shortcut (Tab): no list opens for it, so Tab can write %root%.
			if ( /(^|[\s{};,>+~(])r$/.test( at.line ) ) {
				return undefined;
			}
			const helper = cm.getHelper( at.cur, 'hint' );
			const keywords = typeof helper === 'function' ? helper( cm, options ) : null;
			if ( ! at.inValue ) {
				return keywords;
			}
			const typed = at.word.replace( /^var\(\s*/, '' ).replace( /^-+/, '' ).toLowerCase();
			const list = [];
			VARIABLE_GROUPS.slice().sort( ( a, b ) => kindRank( a.kind, at.prop ) - kindRank( b.kind, at.prop ) ).forEach( ( g ) =>
				g.items.forEach( ( it ) => {
					if ( it.label.toLowerCase().indexOf( typed ) !== -1 ) {
						list.push( variableCompletion( it ) );
					}
				} )
			);
			// After var( only variables fit, so the keywords are left out there.
			if ( keywords && keywords.list && ! /^var\(/.test( at.word ) ) {
				keywords.list.forEach( ( word ) => list.push( word ) );
			}
			// The caret is inside an auto-closed var( ): the closing bracket after the caret is replaced with the variable.
			const closes = /^var\(/.test( at.word ) && cm.getRange( at.cur, { line: at.cur.line, ch: at.cur.ch + 1 } ) === ')';
			return { list, from: at.from, to: closes ? { line: at.cur.line, ch: at.cur.ch + 1 } : at.cur };
		}

	/**
	 * The block's CSS in the code editor the code snippets use (wp.codeEditor, CodeMirror). An empty editor starts
	 * with %root% { }. Typing r and pressing Tab writes %root%. The selector list writes a rule at the caret.
	 * Each change is saved as the block's customCss. Without the code editor (syntax highlighting off in the user's
	 * profile) it is a plain textarea.
	 */
	function CssEditor( { value, onChange, editor, label } ) {
		const area = useRef( null );
		const cm = useRef( null );
		const latest = useRef( onChange );
		const quiet = useRef( false );
		latest.current = onChange;
		const useCode = !! ( editor && window.wp && wp.codeEditor );

		useEffect( () => {
			const node = area.current;
			if ( ! useCode || ! node ) {
				return undefined;
			}
			node.value = value || '';
			const ed = wp.codeEditor.initialize( node, editor ).codemirror;
			// The autocomplete: cssHint (variables in a value, then the keywords). Typing - or ( in a value opens it as well.
			ed.setOption( 'hintOptions', Object.assign( {}, ed.getOption( 'hintOptions' ) || {}, { hint: cssHint, completeSingle: false } ) );
			ed.on( 'inputRead', ( c, change ) => {
				const typed = change.text.join( '' );
				if ( change.origin === '+input' && ( typed === '-' || typed === '(' ) && cssValueAt( c ).inValue ) {
					c.showHint( { completeSingle: false } );
				}
			} );
			cm.current = ed;
			if ( ! ed.getValue() ) {
				// The selector is there to write in. Nothing is saved until the author types.
				quiet.current = true;
				ed.setValue( CSS_STARTER );
				quiet.current = false;
				ed.setCursor( { line: 1, ch: 1 } );
			}
			ed.on( 'change', () => {
				if ( ! quiet.current ) {
					latest.current( ed.getValue() );
				}
			} );
			// Tab after a lone r (at the start of a word) writes the block's selector. Any other Tab indents.
			ed.setOption(
				'extraKeys',
				Object.assign( {}, ed.getOption( 'extraKeys' ) || {}, {
					Tab: ( c ) => {
						// A completion left open by the r (no list shows for it) would reopen on the new text: close it first.
						if ( c.state.completionActive ) {
							c.state.completionActive.close();
						}
						const at = c.getCursor();
						if ( /(^|[\s{};,>+~(])r$/.test( c.getLine( at.line ).slice( 0, at.ch ) ) ) {
							c.replaceRange( '%root%', { line: at.line, ch: at.ch - 1 }, at );
						} else {
							c.execCommand( 'defaultTab' );
						}
					},
				} )
			);
			return () => {
				cm.current = null;
				ed.toTextArea();
			};
		}, [] );

		// A value set from outside (another block selected, a copy, an undo) reaches the open editor too. An empty value
		// shows the selector again, as on opening. Clearing the text by hand is not changed here: it is already empty.
		useEffect( () => {
			const ed = cm.current;
			if ( ! ed || ( value || '' ) === ed.getValue() ) {
				return;
			}
			quiet.current = true;
			ed.setValue( value || CSS_STARTER );
			quiet.current = false;
			if ( ! value ) {
				ed.setCursor( { line: 1, ch: 1 } );
			}
		}, [ value ] );

		// Writes a rule at the caret: the selector, a brace pair and an empty middle line with the caret on it.
		// A rule starts on its own line: text before the caret on the same line gets a line break first.
		const insert = ( rule ) => {
			const ed = cm.current;
			if ( ed ) {
				const at = ed.getCursor();
				const lead = ed.getLine( at.line ).slice( 0, at.ch ).trim() ? '\n' : '';
				ed.replaceRange( lead + rule, at );
				ed.setCursor( { line: at.line + ( lead ? 1 : 0 ) + 1, ch: 1 } );
				ed.focus();
				return;
			}
			const node = area.current;
			if ( node ) {
				const start = node.selectionStart || 0;
				const end = node.selectionEnd || start;
				const before = node.value.slice( 0, start );
				const lead = before.split( '\n' ).pop().trim() ? '\n' : '';
				latest.current( before + lead + rule + node.value.slice( end ) );
			}
		};

		const field = useCode
			? h( 'textarea', { ref: area, className: 'snn-input snn-css', rows: 12, spellCheck: false, defaultValue: value || '', 'aria-label': label } )
			: h( 'textarea', {
					ref: area,
					className: 'snn-input snn-css',
					rows: 12,
					spellCheck: false,
					value: value || '',
					placeholder: CSS_STARTER,
					'aria-label': label,
					onChange: ( e ) => latest.current( e.target.value ),
			  } );

		return h(
			'div',
			{ className: 'snn-css-editor' },
			h(
				'select',
				{
					className: 'snn-select snn-css-selector',
					value: '',
					'aria-label': __( 'Insert a selector', 'snn' ),
					onChange: ( e ) => {
						if ( e.target.value ) {
							insert( e.target.value + ' {\n\t\n}' );
						}
					},
				},
				h( 'option', { value: '' }, __( 'Insert a selector', 'snn' ) ),
				CSS_SELECTORS.map( ( o ) => h( 'option', { key: o.value, value: o.value }, o.label ) )
			),
			field,
			h( 'span', { className: 'snn-css-hint' }, __( 'Use %root% for this block. Type r and press Tab to insert it. Scripts and imports are removed.', 'snn' ) )
		);
	}

	/** The CSS group's page: the code editor. */
	function CssPane( { a, set, editor } ) {
		return h(
			'div',
			{ className: 'snn-css-pane' },
			h( CssEditor, { value: a.customCss || '', onChange: ( v ) => set( { customCss: v } ), editor, label: __( 'Custom CSS', 'snn' ) } )
		);
	}


	Object.assign( snn.panel, { CssPane, cleanCss, cssScope, scopeCss } );
} )( window.wp );
