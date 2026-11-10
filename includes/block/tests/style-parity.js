// Parity test, JavaScript side: runs the editor's copy of the style table (editor/style-props.js) on the cases written
// by style-parity.php, and compares each result with the PHP's own declarations. Run with Node:
//   node includes/block/tests/style-parity.js cases.json
// Exits 0 when every case agrees, 1 otherwise, and prints the first disagreements.
'use strict';
const fs = require( 'fs' );
const path = require( 'path' );
const vm = require( 'vm' );

const file = process.argv[ 2 ];
if ( ! file ) {
	console.error( 'usage: node style-parity.js cases.json' );
	process.exit( 2 );
}
const data = JSON.parse( fs.readFileSync( file, 'utf8' ) );

// The editor's copy, as the browser loads it: it sets globalThis.snn.styleProps.
globalThis.snn = { data: { styleTable: data.table } };
vm.runInThisContext( fs.readFileSync( path.join( __dirname, '..', 'editor', 'style-props.js' ), 'utf8' ) );
const sp = globalThis.snn.styleProps;

let pass = 0;
let fail = 0;
const shown = [];
data.cases.forEach( ( c, i ) => {
	const got = sp.declarations( c.a, data.table, { view: !! c.view } ).map( ( d ) => d[ 0 ] + ':' + d[ 1 ] ).join( ';' );
	if ( got === c.expect ) {
		pass++;
	} else {
		fail++;
		if ( shown.length < 5 ) {
			shown.push( { case: i, attrs: c.a, view: c.view, php: c.expect, js: got } );
		}
	}
} );

shown.forEach( ( s ) => console.log( 'FAIL case ' + s.case + JSON.stringify( s ) ) );
console.log( pass + ' agree, ' + fail + ' differ' );
process.exit( fail ? 1 : 0 );
