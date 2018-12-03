
'use strict';


var expect = require( 'chai' ).expect;
var sinon  = require( 'sinon' );

var Context   = require( '../lib/context' );
var Pool      = require( '../lib/pool' );
var Statement = require( '../lib/statement' );


describe( 'lib/Context', function () {

	var pool = new Pool( {
		max : 1,
		database : 'test@informixoltp_tcp',
    username : 'informix',
    password : '1nf0rm1x'
	} );


	it( 'should be possible to execute a query', function () {
		var ctx = new Context( pool );
		return ctx.query( 'select count(*) from systables;' )
			.then( function ( cursor ) {
				return cursor.fetchAll( { close : true } );
			} )
			.then( function ( results ) {
				expect( results ).to.have.length( 1 );
				return ctx.end();
			} );
	} );

	it( 'should be possible to prepare a query', function () {
		var ctx = new Context( pool );
		return ctx.prepare( 'select count(*) from systables where tabname like ?;' )
			.then( function ( stmt ) {
				expect( stmt ).to.be.an.instanceof( Statement );
				return stmt.free();
			} )
			.then( function ( stmtid ) {
				return ctx.end();
			} );
	} );


	context( 'when working with transactions', function () {

		var ctx = {};
		before( function () {
			ctx = new Context( pool );
		} );

		after( function () {
			return ctx.end();
		} );


		it( 'should be possible to commit transactions', function () {
			var serial;
			return ctx.begin()
				.then( function () {
					return ctx.query( "execute procedure pinscustomer( 'Name', '" + ctx.id() +  "' );" );
				} )
				.then( function ( cursor ) {
					return cursor.fetchAll( { close : true } );
				} )
				.then( function ( results ) {
					serial = results[0][0];
					return ctx.commit();
				} )
				.then( function () {
					return ctx.query( 'select * from tcustomers where id = ' + serial + ';' );
				} )
				.then( function ( cursor ) {
					return cursor.fetchAll( { close : true } );
				} )
				.then( function ( results ) {
					expect( results ).to.have.length( 1 );
					expect( results[0][0] ).to.eq( serial );
				} );
		} );

		it( 'should be possible to rollback transactions', function () {
			var count, stmt;
			return ctx.prepare( 'select count(*) from tcustomers;' )
				.then( function ( s ) {
					stmt = s;
					return stmt.exec();
				} )
				.then( function ( cursor ) {
					return cursor.fetchAll( { close : true } );
				} )
				.then( function ( results ) {
					count = results[0][0];
					expect( count ).to.be.at.least( 0 );
				} )
				.then( function () {
					return ctx.begin();
				} )
				.then( function () {
					return ctx.query( "insert into tcustomers( fname, lname ) values( 'Name', '" + ctx.id() +  "' );" );
				} )
				.then( function ( cursor ) {
					expect( cursor.serial() ).to.be.gt( count );
					return cursor.close();
				} )
				.then( function () {
					return ctx.rollback();
				} )
				.then( function () {
					return stmt.exec();
				} )
				.then( function ( cursor ) {
					return cursor.fetchAll( { close : true } );
				} )
				.then( function ( results ) {
					expect( results[0][0] ).to.eq( count );
				} );
		} );

	} );


	context( 'when ending the context', function () {

		var ctx = {};
		beforeEach( function () {
			ctx = new Context( pool );
		} );


		it ( 'should cleanup any cached statements', function () {
			return ctx.begin()
				.then( function () {
					return ctx.commit();
				} )
				.then( function () {
					return ctx.begin();
				} )
				.then( function () {
					return ctx.rollback();
				} )
				.then( function () {
					expect( ctx.$.stmts.begin ).to.be.an.instanceof( Promise );
					expect( ctx.$.stmts.commit ).to.be.an.instanceof( Promise );
					expect( ctx.$.stmts.rollback ).to.be.an.instanceof( Promise );
				} )
				.then( function () {
					return ctx.end();
				} );
		} );


		it( 'should rollback if there is an open transaction', function () {
			var spy = sinon.spy( ctx, 'rollback' );
			return ctx.begin()
				.then( function () {
					expect( ctx.$.transaction ).to.eq( true );
				} )
				.then( function () {
					return ctx.end();
				} )
				.then( function () {
					expect( spy.calledOnce ).to.eq( true );
					spy.reset();
				} );
		} );

	} );

} );

