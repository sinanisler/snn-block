/**
 * SNN block editor: the Query rows of a query loop: post type, order, filters and the meta query.
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
	const { ORDER_BY_OPTIONS, ORDER_OPTIONS, POST_TYPE_OPTIONS, options } = snn.panel;

	/** The meta query's compare operators, value types, and the operators that take no value. */
	const META_COMPARE_OPTIONS = [
		{ value: '=', label: __( 'Equals', 'snn' ) },
		{ value: '!=', label: __( 'Not equal', 'snn' ) },
		{ value: '>', label: __( 'Greater than', 'snn' ) },
		{ value: '>=', label: __( 'Greater or equal', 'snn' ) },
		{ value: '<', label: __( 'Less than', 'snn' ) },
		{ value: '<=', label: __( 'Less or equal', 'snn' ) },
		{ value: 'LIKE', label: __( 'Contains', 'snn' ) },
		{ value: 'NOT LIKE', label: __( 'Does not contain', 'snn' ) },
		{ value: 'IN', label: __( 'One of', 'snn' ) },
		{ value: 'NOT IN', label: __( 'None of', 'snn' ) },
		{ value: 'EXISTS', label: __( 'Exists', 'snn' ) },
		{ value: 'NOT EXISTS', label: __( 'Does not exist', 'snn' ) },
	];

	const META_TYPE_OPTIONS = [
		{ value: 'CHAR', label: __( 'Text', 'snn' ) },
		{ value: 'NUMERIC', label: __( 'Number', 'snn' ) },
		{ value: 'DECIMAL', label: __( 'Decimal', 'snn' ) },
		{ value: 'SIGNED', label: __( 'Signed integer', 'snn' ) },
		{ value: 'UNSIGNED', label: __( 'Unsigned integer', 'snn' ) },
		{ value: 'DATE', label: __( 'Date', 'snn' ) },
		{ value: 'DATETIME', label: __( 'Date and time', 'snn' ) },
	];

	const META_NO_VALUE = [ 'EXISTS', 'NOT EXISTS' ];

	function changedQuery( q ) {
		return (
			q.enabled &&
			( q.postType !== 'post' ||
				q.orderBy !== 'date' ||
				q.order !== 'DESC' ||
				q.perPage !== '10' ||
				q.offset !== '0' ||
				!! q.parent ||
				q.ignoreSticky ||
				!! q.include ||
				!! q.exclude ||
				!! q.includeAuthors ||
				!! q.excludeAuthors ||
				q.isMain || !! q.taxonomy || !! q.termsInclude || !! q.termsExclude || !! q.excludeCurrent || ( q.metaQuery || [] ).length > 0 || q.metaRelation === 'OR' )
		);
	}

	function QueryFields( { q, setQ } ) {
		const metaRows = Array.isArray( q.metaQuery ) ? q.metaQuery : [];
		const TAXONOMY_OPTIONS = [ { value: '', label: __( 'None', 'snn' ) } ].concat( data.taxonomies || [] );
		const writeMeta = ( rows ) => setQ( { metaQuery: rows } );
		const updateMeta = ( i, patch ) => writeMeta( metaRows.map( ( r, j ) => ( j === i ? Object.assign( {}, r, patch ) : r ) ) );
		const removeMeta = ( i ) => writeMeta( metaRows.filter( ( r, j ) => j !== i ) );
		const addMeta = () => writeMeta( metaRows.concat( [ { key: '', compare: '=', value: '', type: 'CHAR' } ] ) );
		return h(
			Fragment,
			null,
			h(
				Row,
				{ label: __( 'Post type', 'snn' ), changed: q.postType !== 'post', tip: 'postType' },
				h( Select, {
					label: __( 'Post type', 'snn' ),
					value: q.postType,
						tip: 'postType',
					options: POST_TYPE_OPTIONS,
					onChange: ( v ) => setQ( { postType: v } ),
				} )
			),
			h(
				Row,
				{ label: __( 'Order by', 'snn' ), changed: q.orderBy !== 'date', tip: 'orderBy' },
				h( Select, {
					label: __( 'Order by', 'snn' ),
					value: q.orderBy,
						tip: 'orderBy',
					options: ORDER_BY_OPTIONS,
					onChange: ( v ) => setQ( { orderBy: v } ),
				} )
			),
			h(
				Row,
				{ label: __( 'Order', 'snn' ), changed: q.order !== 'DESC', tip: 'queryOrder' },
				h( Select, {
					label: __( 'Order', 'snn' ),
					value: q.order,
						tip: 'queryOrder',
					options: ORDER_OPTIONS,
					onChange: ( v ) => setQ( { order: v } ),
				} )
			),
			h(
				Row,
				{ label: __( 'Per page', 'snn' ), changed: q.perPage !== '10', tip: 'perPage' },
				h( TextField, {
					label: __( 'Posts per page', 'snn' ),
					value: q.perPage,
						tip: 'perPage',
					inputMode: 'numeric',
					onChange: ( v ) => setQ( { perPage: v } ),
				} )
			),
			h(
				Row,
				{ label: __( 'Offset', 'snn' ), changed: q.offset !== '0', tip: 'offset' },
				h( TextField, {
					label: __( 'Offset', 'snn' ),
					value: q.offset,
						tip: 'offset',
					inputMode: 'numeric',
					onChange: ( v ) => setQ( { offset: v } ),
				} )
			),
			h(
				Row,
				{ label: __( 'Child of', 'snn' ), changed: !! q.parent, tip: 'parent' },
				h( TextField, {
					label: __( 'Child of', 'snn' ),
					value: q.parent,
						tip: 'parent',
					placeholder: __( 'Post ID', 'snn' ),
					onChange: ( v ) => setQ( { parent: v } ),
				} )
			),
			h( SwitchRow, {
				label: __( 'Ignore sticky', 'snn' ), tip: 'ignoreSticky',
				checked: q.ignoreSticky,
				onChange: ( v ) => setQ( { ignoreSticky: v } ),
			} ),
			h(
				Row,
				{ label: __( 'Include', 'snn' ), changed: !! q.include, tip: 'include' },
				h( TextField, {
					label: __( 'Include posts', 'snn' ),
					value: q.include,
						tip: 'include',
					placeholder: __( 'IDs', 'snn' ),
					onChange: ( v ) => setQ( { include: v } ),
				} )
			),
			h(
				Row,
				{ label: __( 'Exclude', 'snn' ), changed: !! q.exclude, tip: 'exclude' },
				h( TextField, {
					label: __( 'Exclude posts', 'snn' ),
					value: q.exclude,
						tip: 'exclude',
					placeholder: __( 'IDs', 'snn' ),
					onChange: ( v ) => setQ( { exclude: v } ),
				} )
			),
			h(
				Row,
				{ label: __( 'Authors', 'snn' ), changed: !! q.includeAuthors, tip: 'authorsIn' },
				h( TextField, {
					label: __( 'Include authors', 'snn' ),
					value: q.includeAuthors,
						tip: 'authorsIn',
					placeholder: __( 'User IDs', 'snn' ),
					onChange: ( v ) => setQ( { includeAuthors: v } ),
				} )
			),
			h(
				Row,
				{ label: __( 'Not authors', 'snn' ), changed: !! q.excludeAuthors, tip: 'authorsOut' },
				h( TextField, {
					label: __( 'Exclude authors', 'snn' ),
					value: q.excludeAuthors,
						tip: 'authorsOut',
					placeholder: __( 'User IDs', 'snn' ),
					onChange: ( v ) => setQ( { excludeAuthors: v } ),
				} )
			),
			h(
				Row,
				{ label: __( 'Taxonomy', 'snn' ), changed: !! q.taxonomy, tip: 'taxonomy' },
				h( Select, {
					label: __( 'Taxonomy', 'snn' ),
					value: q.taxonomy || '',
						tip: 'taxonomy',
					options: TAXONOMY_OPTIONS,
					onChange: ( v ) => setQ( { taxonomy: v } ),
				} )
			),
			h(
				Row,
				{ label: __( 'Terms in', 'snn' ), changed: !! q.termsInclude, tip: 'termsIn' },
				h( TextField, {
					label: __( 'Include terms', 'snn' ),
					value: q.termsInclude,
						tip: 'termsIn',
					placeholder: __( 'Term IDs', 'snn' ),
					onChange: ( v ) => setQ( { termsInclude: v } ),
				} )
			),
			h(
				Row,
				{ label: __( 'Terms out', 'snn' ), changed: !! q.termsExclude, tip: 'termsOut' },
				h( TextField, {
					label: __( 'Exclude terms', 'snn' ),
					value: q.termsExclude,
						tip: 'termsOut',
					placeholder: __( 'Term IDs', 'snn' ),
					onChange: ( v ) => setQ( { termsExclude: v } ),
				} )
			),
			...metaRows.map( ( r, i ) =>
				h(
					Fragment,
					{ key: 'meta-' + i },
					h(
						Row,
						{ label: __( 'Meta key', 'snn' ), changed: !! r.key, tip: 'metaKey' },
						h( TextField, {
							label: __( 'Meta key', 'snn' ),
							value: r.key,
								tip: 'metaKey',
							placeholder: __( 'field_name', 'snn' ),
							onChange: ( v ) => updateMeta( i, { key: v } ),
						} )
					),
					h(
						Row,
						{ label: __( 'Compare', 'snn' ), changed: r.compare !== '=', tip: 'metaCompare' },
						h( Select, {
							label: __( 'Compare', 'snn' ),
							value: r.compare,
								tip: 'metaCompare',
							options: META_COMPARE_OPTIONS,
							onChange: ( v ) => updateMeta( i, { compare: v } ),
						} )
					),
					META_NO_VALUE.indexOf( r.compare ) === -1
						? h(
								Row,
								{ label: __( 'Value', 'snn' ), changed: !! r.value, tip: 'metaValue' },
								h( TextField, {
									label: __( 'Meta value', 'snn' ),
									value: r.value,
									placeholder: __( 'value', 'snn' ),
									onChange: ( v ) => updateMeta( i, { value: v } ),
								} )
						  )
						: null,
					h(
						Row,
						{ label: __( 'Type', 'snn' ), changed: r.type !== 'CHAR', tip: 'metaType' },
						h( Select, {
							label: __( 'Value type', 'snn' ),
							value: r.type,
								tip: 'metaType',
							options: META_TYPE_OPTIONS,
							onChange: ( v ) => updateMeta( i, { type: v } ),
						} )
					),
					h(
						Row,
						{ label: '' },
						h(
							'button',
							{ type: 'button', className: 'snn-reset', onClick: () => removeMeta( i ), ...tipAttr( 'metaRemove' ) },
							__( 'Remove rule', 'snn' )
						)
					)
				)
			),
			h(
				Row,
				{ label: __( 'Meta query', 'snn' ), changed: metaRows.length > 0, tip: 'metaAdd' },
				h(
					'button',
					{ type: 'button', className: 'snn-reset', onClick: addMeta, ...tipAttr( 'metaAdd' ) },
					metaRows.length ? __( 'Add another rule', 'snn' ) : __( 'Add rule', 'snn' )
				)
			),
			metaRows.length > 1
				? h(
						Row,
						{ label: __( 'Rules', 'snn' ), changed: q.metaRelation !== 'AND', tip: 'metaRelation' },
						h( Segmented, {
							label: __( 'Rules must match', 'snn' ), tip: 'metaRelation',
							value: q.metaRelation || 'AND',
							options: [
								{ value: 'AND', label: __( 'All', 'snn' ) },
								{ value: 'OR', label: __( 'Any', 'snn' ) },
							],
							onChange: ( v ) => setQ( { metaRelation: v } ),
						} )
				  )
				: null,
			h( SwitchRow, {
				label: __( 'Exclude current', 'snn' ), tip: 'excludeCurrent',
				checked: !! q.excludeCurrent,
				onChange: ( v ) => setQ( { excludeCurrent: v } ),
			} ),
			h( SwitchRow, {
				label: __( 'Main query', 'snn' ), tip: 'isMain',
				checked: q.isMain,
				onChange: ( v ) => setQ( { isMain: v } ),
			} )
		);
	}


	Object.assign( snn.panel, { changedQuery, QueryFields } );
} )( window.wp );
