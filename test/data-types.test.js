
'use strict';

const expect = require( 'chai' ).expect;
const sinon  = require( 'sinon' );
const moment = require( 'moment' );

const Informix   = require( '../lib/informix' );


describe( 'data-types', () => {

	const informix = new Informix( {
		database : 'test@informixoltp_tcp',
		username : 'informix',
		password : '1nf0rm1x'
	} );

	const values = {
		dt : '2017-02-17 17:20:56.002',
		date : new Date( '2017-02-18' ),
		decimal : 7.964439875659,
		bigint: 2^62,
		atext: '?'
	};

  const atext = 'A TEXT';

	before( () => {
		return informix.prepare(
				'insert into tdatatypes(' +
					'dt, ' +
					'date, ' +
					'decimal, ' +
					'bigint,' +
					'atext' +
				') ' +
				'values(' +
					'"' + values.dt + '", ' +
					moment( values.date ).format( '[mdy(]MM,DD,YYYY[), ]' ) +
					values.decimal + ',' +
					values.bigint + ',' +
					values.atext +
				');'
			)
			.then( ( stmt ) => {
				return stmt.exec([ atext ]);
			})
			.then( ( cursor ) => {
				return cursor.close();
			} );
	} );

	after( () => {
		return informix.query( 'truncate tdatatypes;' )
			.then( ( cursor ) => {
				return cursor.close();
			} );
	} );


	it( 'should fetch int8/serial8 values correctly', () => {
		return informix.query( 'select id from tdatatypes;' )
			.then( ( cursor ) => {
				return cursor.fetchAll( { close : true } );
			} )
			.then( ( results ) => {
				expect( results ).to.have.length( 1 )
					.with.nested.property( '[0][0]' )
					.that.is.a( 'number' );
			} );
	} );

	it( 'should return date values in ISO format', () => {
		return informix.query( 'select date from tdatatypes;' )
			.then( ( cursor ) => {
				return cursor.fetchAll( { close : true } );
			} )
			.then( ( results ) => {
				expect( results ).to.have.length( 1 )
					.with.nested.property( '[0][0]' )
					.that.eql( values.date.toISOString() );
			} );
	} );

	it( 'should return datetime values in ISO format', () => {
		return informix.query( 'select dt from tdatatypes;' )
			.then( ( cursor ) => {
				return cursor.fetchAll( { close : true } );
			} )
			.then( ( results ) => {
				expect( results ).to.have.length( 1 )
					.with.nested.property( '[0][0]' )
					.that.eql( new Date( values.dt ).toISOString() );
			} );
	} );

	it( 'should fetch decimal values correctly', () => {
		return informix.query( 'select decimal from tdatatypes;' )
			.then( ( cursor ) => {
				return cursor.fetchAll( { close : true } );
			} )
			.then( ( results ) => {
				expect( results ).to.have.length( 1 )
					.with.nested.property( '[0][0]' )
					.that.eql( values.decimal );
			} );
	} );

	it( 'should fetch bigint values correctly', () => {
		return informix.query( 'select bigint from tdatatypes;' )
			.then( ( cursor ) => {
				return cursor.fetchAll( { close : true } );
			} )
			.then( ( results ) => {
				expect( results ).to.have.length( 1 )
					.with.nested.property( '[0][0]' )
					.that.eql( values.bigint );
			} );
	} );

	it( 'should fetch text values correctly', () => {
		return informix.query( 'select atext from tdatatypes;' )
			.then( ( cursor ) => {
				return cursor.fetchAll( { close : true } );
			} )
			.then( ( results ) => {
				expect( results ).to.have.length( 1 )
					.with.nested.property( '[0][0]' )
					.that.eql( atext );
			} );
	} );

} );

