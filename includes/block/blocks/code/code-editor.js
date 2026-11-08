/**
 * SNN Code block, the editor side: the Content tab (HTML, CSS and JavaScript in code editors, the HTML tag and Render
 * without wrapper, as the Bricks code element without PHP) and the code on the canvas. The canvas shows the HTML and
 * the CSS; the JavaScript runs on the front end only. The front end is ./code.php. Registers window.snnBlockKinds.code.
 *
 * The code editors are the ones WordPress uses for its own code fields (wp.codeEditor, CodeMirror); their settings come
 * from window.snnCodeBlockData (layout-blocks.php). Without them (syntax highlighting off) the fields are textareas.
 */
( function ( wp ) {
	const { createElement: h, useEffect, useRef } = wp.element;
	const { __ } = wp.i18n;
	const { Group, Row, SwitchRow, Select } = window.snnControls;
	const data = window.snnCodeBlockData || {};
	// The empty box on the canvas (the canvas is an iframe, so its look is written here, as the Image block does).
	const EMPTY = { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', minHeight: 40, padding: '8px 12px', border: '1px dashed #8c8f94', color: '#646970', fontSize: 12, fontFamily: 'system-ui, sans-serif' };
	const TAG_OPTIONS = [ 'div', 'section', 'span', 'header', 'footer', 'main', 'article', 'aside', 'nav' ].map( ( v ) => ( { value: v, label: v } ) );

	/** One code field. mode: html, css or js (its settings in snnCodeBlockData.editors). */
	function CodeArea( { value, onChange, mode, label } ) {
		const area = useRef( null );
		const cm = useRef( null );
		const latest = useRef( onChange );
		latest.current = onChange;
		const settings = data.editors && data.editors[ mode ];
		const useCode = !! ( settings && wp.codeEditor );

		useEffect( () => {
			const node = area.current;
			if ( ! useCode || ! node ) {
				return undefined;
			}
			node.value = value || '';
			const ed = wp.codeEditor.initialize( node, settings ).codemirror;
			ed.on( 'change', () => latest.current( ed.getValue() ) );
			cm.current = ed;
			return () => {
				cm.current = null;
				ed.toTextArea();
			};
		}, [] );

		// A value set from outside (another block, an undo) reaches the open editor.
		useEffect( () => {
			const ed = cm.current;
			if ( ed && ( value || '' ) !== ed.getValue() ) {
				ed.setValue( value || '' );
			}
		}, [ value ] );

		return h(
			'div',
			{ className: 'snn-code-area' },
			h( 'div', { className: 'snn-code-label' }, label ),
			useCode
				? h( 'textarea', { ref: area, 'aria-label': label, defaultValue: value || '' } )
				: h( 'textarea', { className: 'snn-code-plain', 'aria-label': label, spellCheck: false, value: value || '', onChange: ( e ) => onChange( e.target.value ) } )
		);
	}

	function Pane( { a, set } ) {
		return h(
			'div',
			{ className: 'snn-pane' },
			h(
				Group,
				{ title: __( 'Code', 'snn' ) },
				data.canUnfiltered === false
					? h( 'p', { className: 'snn-code-note' }, __( 'Your role cannot save scripts: WordPress removes them when the page is saved.', 'snn' ) )
					: null,
				h( CodeArea, { mode: 'html', label: 'HTML', value: a.code, onChange: ( v ) => set( { code: v } ) } ),
				h( CodeArea, { mode: 'css', label: 'CSS', value: a.cssCode, onChange: ( v ) => set( { cssCode: v } ) } ),
				h( CodeArea, { mode: 'js', label: 'JavaScript', value: a.jsCode, onChange: ( v ) => set( { jsCode: v } ) } ),
				h( 'p', { className: 'snn-code-note' }, __( 'The code is printed as written. JavaScript runs on the front end only.', 'snn' ) ),
				h( SwitchRow, { label: __( 'No wrapper', 'snn' ), checked: !! a.noWrapper, onChange: ( v ) => set( { noWrapper: v } ) } ),
				a.noWrapper
					? null
					: h(
							Row,
							{ label: __( 'HTML tag', 'snn' ), changed: a.tagName !== 'div' },
							h( Select, { value: a.tagName, options: TAG_OPTIONS, label: __( 'HTML tag', 'snn' ), onChange: ( v ) => set( { tagName: v } ) } )
					  )
			)
		);
	}

	/**
	 * The HTML and the CSS on the canvas, in the block's element. Empty: a dashed box that says where the code goes.
	 * Without a wrapper the element is display: contents, so the code's own elements sit in the parent's layout (a
	 * grid cell, a flex item) as they do on the front end, where nothing is around them.
	 */
	function Canvas( { a, tag, rootProps } ) {
		const root = rootProps || {};
		const props = { ...root, className: [ root.className, 'snn-code-root' ].filter( Boolean ).join( ' ' ) };
		const html = ( a.code || '' ) + ( a.cssCode && a.cssCode.trim() ? '<style>' + a.cssCode + '</style>' : '' );
		if ( ! html.trim() ) {
			return h( tag, props, h( 'span', { className: 'snn-code-empty', style: EMPTY }, __( 'Code: write HTML, CSS and JavaScript in the panel', 'snn' ) ) );
		}
		if ( a.noWrapper ) {
			props.style = { ...( root.style || {} ), display: 'contents' };
		}
		return h( a.noWrapper ? 'div' : tag, { ...props, dangerouslySetInnerHTML: { __html: html } } );
	}

	window.snnBlockKinds = window.snnBlockKinds || {};
	window.snnBlockKinds.code = { Pane, Canvas };
} )( window.wp );
