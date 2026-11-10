/**
 * The Link group, shared by the blocks that can be a link (Button and Icon today): URL (dynamic tags work), Open in
 * new tab, Rel and ARIA label. With a URL the block's element is an a (utilities/links.php). Exposes snn.linkFields.
 */
( function ( wp ) {
	const { createElement: h } = wp.element;
	const { __ } = wp.i18n;
	const { Group, Row, SwitchRow, TextField } = snn.controls;

	function LinkGroup( { a, set } ) {
		const url = a.linkUrl || '';
		return h(
			Group,
			{ title: __( 'Link', 'snn' ) },
			h(
				Row,
				{ label: __( 'URL', 'snn' ), changed: !! url },
				h( TextField, { value: url, label: __( 'Link URL', 'snn' ), placeholder: 'https://', onChange: ( v ) => set( { linkUrl: v } ) } )
			),
			url
				? [
						h( SwitchRow, { key: 'tab', label: __( 'Open in new tab', 'snn' ), checked: !! a.linkNewTab, onChange: ( v ) => set( { linkNewTab: v } ) } ),
						h(
							Row,
							{ key: 'rel', label: __( 'Rel', 'snn' ), changed: !! a.linkRel },
							h( TextField, { value: a.linkRel || '', label: __( 'Rel', 'snn' ), placeholder: 'nofollow', onChange: ( v ) => set( { linkRel: v } ) } )
						),
						h(
							Row,
							{ key: 'aria', label: __( 'ARIA label', 'snn' ), changed: !! a.linkAriaLabel },
							h( TextField, { value: a.linkAriaLabel || '', label: __( 'ARIA label', 'snn' ), onChange: ( v ) => set( { linkAriaLabel: v } ) } )
						),
				  ]
				: null
		);
	}

	snn.linkFields = { LinkGroup };
} )( window.wp );
