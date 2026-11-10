/**
 * SNN block editor: the Layout rows: display, direction, wrap, justify, align, gaps and the item settings, as the display shows them.
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
	const { ViewValue, options, picked, viewOwn } = snn.panel;

	const WRAP_OPTIONS = [
		{ value: 'nowrap', label: __( 'No wrap', 'snn' ) },
		{ value: 'wrap', label: __( 'Wrap', 'snn' ) },
		{ value: 'wrap-reverse', label: __( 'Wrap reverse', 'snn' ) },
	];

	const WORD = {
		start: __( 'Start', 'snn' ),
		center: __( 'Center', 'snn' ),
		end: __( 'End', 'snn' ),
		stretch: __( 'Stretch', 'snn' ),
		baseline: __( 'Baseline', 'snn' ),
		auto: __( 'Auto', 'snn' ),
		between: __( 'Space between', 'snn' ),
		around: __( 'Space around', 'snn' ),
		evenly: __( 'Space evenly', 'snn' ),
	};

	/** The choices of each setting, as [value, label] pairs (the value is the CSS keyword). */
	const CHOICES = {
		justify: [
			[ 'flex-start', WORD.start ],
			[ 'center', WORD.center ],
			[ 'flex-end', WORD.end ],
			[ 'space-between', WORD.between ],
			[ 'space-around', WORD.around ],
			[ 'space-evenly', WORD.evenly ],
		],
		align: [
			[ 'stretch', WORD.stretch ],
			[ 'flex-start', WORD.start ],
			[ 'center', WORD.center ],
			[ 'flex-end', WORD.end ],
			[ 'baseline', WORD.baseline ],
		],
		alignContent: [
			[ 'flex-start', WORD.start ],
			[ 'center', WORD.center ],
			[ 'flex-end', WORD.end ],
			[ 'stretch', WORD.stretch ],
			[ 'space-between', WORD.between ],
			[ 'space-around', WORD.around ],
			[ 'space-evenly', WORD.evenly ],
		],
		cell: [
			[ 'stretch', WORD.stretch ],
			[ 'flex-start', WORD.start ],
			[ 'center', WORD.center ],
			[ 'flex-end', WORD.end ],
		],
		alignSelf: [
			[ 'auto', WORD.auto ],
			[ 'stretch', WORD.stretch ],
			[ 'flex-start', WORD.start ],
			[ 'center', WORD.center ],
			[ 'flex-end', WORD.end ],
			[ 'baseline', WORD.baseline ],
		],
	};

	/**
	 * The values that have a picture, by setting. Baseline, space around and space evenly have no picture in the
	 * mock, so they are not offered as icons.
	 */
	const JUSTIFY_PICS = [ 'flex-start', 'center', 'flex-end', 'space-between' ];

	const ALIGN_PICS = [ 'stretch', 'flex-start', 'center', 'flex-end' ];

	const ALIGN_CONTENT_PICS = [ 'stretch', 'flex-start', 'center', 'flex-end', 'space-between' ];

	const ALIGN_SELF_PICS = [ 'auto', 'stretch', 'flex-start', 'center', 'flex-end', 'baseline' ];

	const DISPLAY_OPTIONS = [
		{ value: 'block', label: __( 'Block', 'snn' ) },
		{ value: 'flex', label: __( 'Flex', 'snn' ) },
		{ value: 'grid', label: __( 'Grid', 'snn' ) },
		{ value: 'inline-flex', label: __( 'Inline flex', 'snn' ) },
		{ value: 'inline-grid', label: __( 'Inline grid', 'snn' ) },
		{ value: 'inline-block', label: __( 'Inline block', 'snn' ) },
		{ value: 'inline', label: __( 'Inline', 'snn' ) },
		{ value: 'none', label: __( 'None (hidden)', 'snn' ) },
	];

	/** The two flows, as pictures: a row or a column. */
	const FLOW_PAIRS = [
		[ 'row', __( 'Row', 'snn' ) ],
		[ 'column', __( 'Column', 'snn' ) ],
	];

	/** The grid's columns: one to six equal columns. */
	function columnOptions() {
		return [ 1, 2, 3, 4, 5, 6 ].map( ( n ) => ( {
			value: String( n ),
			label: n === 1 ? __( '1 column', 'snn' ) : n + ' ' + __( 'columns', 'snn' ),
			glyph: columnsPic( n ),
		} ) );
	}

	/**
	 * A column count is written as a track template: repeat(4, minmax(0, 1fr)) is four equal columns that do not grow
	 * past their content. The same form as columns() in layout-blocks.php.
	 */
	function columnTemplate( n ) {
		return 'repeat(' + n + ', minmax(0, 1fr))';
	}

	/** The column count a stored value stands for: 4, or the template repeat(4, minmax(0, 1fr)). Any other value is ''. */
	function columnCount( v ) {
		const t = v === undefined || v === null ? '' : String( v ).trim();
		const m = /^repeat\((1[0-2]|[1-9]), minmax\(0, 1fr\)\)$/.exec( t ) || /^(1[0-2]|[1-9])$/.exec( t );
		return m ? m[ 1 ] : '';
	}

	/**
	 * A row of three icons, as Bricks shows the direction: column, row, and reverse. Column and row choose the flow;
	 * reverse is a toggle that flips it, so it keeps its state when the flow changes.
	 */
	function DirectionRow( { label, flow, reverse, onFlow, onReverse } ) {
		const button = ( key, on, glyph, text, press ) =>
			h(
				'button',
				{
					key,
					type: 'button',
					className: 'snn-seg-btn' + ( on ? ' is-on' : '' ),
					'aria-pressed': on ? 'true' : 'false',
					'aria-label': text,
					...tipAttr( 'direction.' + key ),
					onClick: press,
				},
				glyph
			);
		return h(
			'div',
			{ className: 'snn-seg', role: 'group', 'aria-label': label },
			button( 'column', flow === 'column', directionPic( 'column' ), __( 'Column', 'snn' ), () => onFlow( 'column' ) ),
			button( 'row', flow === 'row', directionPic( 'row' ), __( 'Row', 'snn' ), () => onFlow( 'row' ) ),
			button( 'reverse', reverse, reversePic(), __( 'Reverse', 'snn' ), () => onReverse( ! reverse ) )
		);
	}

	/**
	 * The flex or grid settings of the block's own display (none for block), in the order they are used, then the item settings for that display. Every setting is per view
	 * (ViewValue): Desktop holds the base, and Tablet and Mobile set their own. The rows follow the display the panel's
	 * view shows (effectiveValues), so a Tablet that is block shows no flex rows. Align self sits under Align: it acts on
	 * the parent's cross axis, so its pictures turn with the parent's direction.
	 */
	function LayoutFields( { a, set, base, device, parent } ) {
		const shown = effectiveValues( a, device );
		const flexDirection = shown.flexDirection || 'row';
		const flex = shown.display === 'flex' || shown.display === 'inline-flex';
		const grid = shown.display === 'grid' || shown.display === 'inline-grid';
		const box = flex || grid;
		const wrapped = shown.flexWrap !== 'nowrap';
		const parentFlex = parent.display === 'flex' || parent.display === 'inline-flex';
		const reverse = /reverse$/.test( flexDirection );
		const flow = flexDirection.replace( /-reverse$/, '' );
		const directionOwn = viewOwn( a, device, 'flexDirection', base.flexDirection ) !== undefined;
		// A flex column runs its main axis down the block, so its pictures turn a quarter turn.
		const turned = ! grid && /^column/.test( flexDirection );
		const v = ( key, k, props ) => h( ViewValue, Object.assign( { key, a, set, device, k }, props ) );
		const setDirection = ( patch ) => setValue( a, set, device, 'flexDirection', patch );
		const resetDirection = () => clearValue( a, set, device, 'flexDirection' );
		const rows = [
			v( 'display', 'display', { label: __( 'Display', 'snn' ), kind: 'select', options: DISPLAY_OPTIONS, dflt: base.display } ),
		];

		if ( flex ) {
			rows.push(
				h(
					ViewRow,
					{ key: 'direction', label: __( 'Direction', 'snn' ), tip: 'direction', device, own: directionOwn, onReset: resetDirection, css: 'flex-direction' },
					h( DirectionRow, {
						label: __( 'Direction', 'snn' ),
						flow,
						reverse,
						onFlow: ( x ) => setDirection( reverse ? x + '-reverse' : x ),
						onReverse: ( on ) => setDirection( flow + ( on ? '-reverse' : '' ) ),
					} )
				),
				v( 'wrap', 'flexWrap', { label: __( 'Wrap', 'snn' ), kind: 'select', options: WRAP_OPTIONS, dflt: 'nowrap' } )
			);
		}

		if ( grid ) {
			rows.push(
				v( 'columns', 'gridColumns', { label: __( 'Columns', 'snn' ), kind: 'icons', options: columnOptions(), pick: columnCount, store: columnTemplate } ),
				v( 'template', 'gridColumns', { label: __( 'Template', 'snn' ), tip: 'gridTemplate', placeholder: __( '1fr 2fr', 'snn' ) } ),
				v( 'rows', 'gridRows', { label: __( 'Rows', 'snn' ), placeholder: __( 'auto', 'snn' ) } ),
				v( 'auto-columns', 'gridAutoColumns', { label: __( 'Auto columns', 'snn' ), placeholder: __( 'auto', 'snn' ) } ),
				v( 'auto-rows', 'gridAutoRows', { label: __( 'Auto rows', 'snn' ), placeholder: __( 'auto', 'snn' ) } ),
				v( 'areas', 'gridAreas', { label: __( 'Areas', 'snn' ), placeholder: '"header header" "main side"', variables: null } ),
				v( 'flow', 'gridAutoFlow', { label: __( 'Flow', 'snn' ), kind: 'icons', options: options( FLOW_PAIRS, ( x ) => directionPic( x ) ), dflt: 'row', fallback: 'row' } ),
				v( 'dense', 'gridDense', { label: __( 'Dense', 'snn' ), kind: 'switch', dflt: false } )
			);
		}

		if ( box ) {
			// In a grid, justify content runs along the columns and align items along the rows.
			rows.push(
				v( 'justify', 'justifyContent', { label: __( 'Justify', 'snn' ), kind: 'icons', options: options( picked( CHOICES.justify, JUSTIFY_PICS ), ( x ) => mainPic( x, turned ) ), fallback: 'flex-start' } ),
				v( 'align', 'alignItems', { label: __( 'Align', 'snn' ), kind: 'icons', options: options( picked( CHOICES.align, ALIGN_PICS ), ( x ) => crossPic( x, turned ) ), fallback: 'stretch' } )
			);
		}

		// Align self is for a flex or grid box. Its pictures turn when the parent is a flex column (the parent's cross axis).
		if ( box ) {
			const turnedSelf = parentFlex && /^column/.test( parent.flexDirection || '' );
			rows.push(
				v( 'align-self', 'alignSelf', { label: __( 'Align self', 'snn' ), kind: 'icons', options: options( picked( CHOICES.alignSelf, ALIGN_SELF_PICS ), ( x ) => crossPic( x, turnedSelf ) ), fallback: 'auto' } )
			);
		}

		if ( flex && wrapped ) {
			rows.push(
				v( 'flex-align-content', 'alignContent', { label: __( 'Align content', 'snn' ), kind: 'icons', options: options( picked( CHOICES.alignContent, ALIGN_CONTENT_PICS ), ( x ) => mainPic( x, ! turned ) ), fallback: 'stretch' } )
			);
		}

		if ( grid ) {
			rows.push(
				v( 'justify-items', 'justifyItems', { label: __( 'Justify items', 'snn' ), kind: 'icons', options: options( picked( CHOICES.cell, ALIGN_PICS ), ( x ) => crossPic( x, true ) ), fallback: 'stretch' } ),
				v( 'align-content', 'alignContent', { label: __( 'Align content', 'snn' ), kind: 'icons', options: options( picked( CHOICES.alignContent, ALIGN_CONTENT_PICS ), ( x ) => mainPic( x, true ) ), fallback: 'stretch' } )
			);
		}

		if ( box ) {
			rows.push(
				v( 'column-gap', 'columnGap', { label: __( 'Column gap', 'snn' ), kind: 'size', placeholder: '0' } ),
				v( 'row-gap', 'rowGap', { label: __( 'Row gap', 'snn' ), kind: 'size', placeholder: '0' } )
			);
		}

		// The item settings follow the display, as the flex and grid settings do: grow, shrink and basis for flex, and the
		// place in the grid for grid. Order is for every display (the front end renders the same rules).
		if ( flex ) {
			rows.push(
				v( 'grow', 'flexGrow', { label: __( 'Flex grow', 'snn' ), placeholder: '0', inputMode: 'decimal' } ),
				v( 'shrink', 'flexShrink', { label: __( 'Flex shrink', 'snn' ), placeholder: '1', inputMode: 'decimal' } ),
				v( 'basis', 'flexBasis', { label: __( 'Flex basis', 'snn' ), placeholder: __( 'auto', 'snn' ), kind: 'size' } )
			);
		}
		if ( grid ) {
			rows.push(
				v( 'justify-self', 'justifySelf', { label: __( 'Justify self', 'snn' ), kind: 'icons', options: options( picked( CHOICES.cell, ALIGN_PICS ), ( x ) => crossPic( x, true ) ), fallback: 'stretch' } ),
				v( 'column-start', 'columnStart', { label: __( 'Column start', 'snn' ), placeholder: __( 'auto', 'snn' ), inputMode: 'numeric' } ),
				v( 'column-span', 'columnSpan', { label: __( 'Column span', 'snn' ), placeholder: '1', inputMode: 'numeric' } ),
				v( 'row-start', 'rowStart', { label: __( 'Row start', 'snn' ), placeholder: __( 'auto', 'snn' ), inputMode: 'numeric' } ),
				v( 'row-span', 'rowSpan', { label: __( 'Row span', 'snn' ), placeholder: '1', inputMode: 'numeric' } ),
				v( 'area', 'gridArea', { label: __( 'Grid area', 'snn' ), placeholder: __( 'name', 'snn' ), variables: null } )
			);
		}
		rows.push( v( 'order', 'order', { label: __( 'Order', 'snn' ), placeholder: '0', inputMode: 'numeric' } ) );

		return h( Fragment, null, rows );
	}


	Object.assign( snn.panel, { LayoutFields } );
} )( window.wp );
