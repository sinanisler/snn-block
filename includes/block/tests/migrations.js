/**
 * The editor's copy of the migrations (editor/migrations.js) on the cases tests/migrations-test.php wrote, compared with
 * the PHP result. An empty PHP array is [] in JSON where the editor has {}: both count as empty.
 *
 *   node includes/block/tests/migrations.js <path to migration-cases.json>
 */
const fs = require( 'fs' );
const path = require( 'path' );

const file = process.argv[ 2 ];
if ( ! file ) {
	console.log( 'usage: node migrations.js migration-cases.json' );
	process.exit( 2 );
}
const data = JSON.parse( fs.readFileSync( file, 'utf8' ) );
globalThis.snn = { data: { migrations: { version: data.version, key: data.key } }, blocks: {} };
require( path.join( __dirname, '..', 'editor', 'migrations.js' ) );

/** A value with empty lists as empty objects and the keys in order, so PHP's and the editor's JSON compare. */
function norm( v ) {
	if ( Array.isArray( v ) ) {
		return v.length ? v.map( norm ) : {};
	}
	if ( v && typeof v === 'object' ) {
		const out = {};
		Object.keys( v )
			.sort()
			.forEach( ( k ) => {
				out[ k ] = norm( v[ k ] );
			} );
		return out;
	}
	return v;
}

let agree = 0;
let differ = 0;
data.cases.forEach( ( c ) => {
	const js = JSON.stringify( norm( globalThis.snn.migrations.run( c.raw, 'snn/div' ) ) );
	const php = JSON.stringify( norm( c.php ) );
	if ( js === php ) {
		agree++;
	} else {
		differ++;
		console.log( 'DIFFER ' + c.label + '\n  php ' + php + '\n  js  ' + js );
	}
} );
console.log( agree + ' agree, ' + differ + ' differ' );
process.exit( differ ? 1 : 0 );
