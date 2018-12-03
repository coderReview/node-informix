/* jshint expr: true */

'use strict';

var expect = require( 'chai' ).expect;
var Ifx    = require( '../' ).Ifx;


describe( 'ifx', function () {

	before( function () {
		process.env.INFORMIXSERVER = 'informixoltp_tcp';
	} );


	context( 'when username and password is not specified', function () {

		var ifx = new Ifx();

		it( 'should handle connection errors', function ( done ) {
			ifx.connect( {
				id : 'conn:id:1001',
				database : 'test',
				username : 'dummy',
				password : 'dummy',
			}, function ( err, conn ) {
				expect( err ).to.be.an.instanceof( Error );
				expect( err.message ).to.be.string( '[-951] Incorrect password or user %s is not known on the database server.' );
				expect( conn ).to.be.undefined;
				done();
			} );
		} );

	} );


	context( 'connect', function () {

		var ifx = new Ifx();

		it( 'should validate input arguments', function () {

			try {
				ifx.connect();
			} catch ( e ) {
				expect( e ).to.be.an.instanceof( Error );
				expect( e.message ).to.be.string( 'Invalid number of arguments' );
			}

			try {
				ifx.connect( 1, 2, 3 );
			} catch ( e ) {
				expect( e ).to.be.an.instanceof( Error );
				expect( e.message ).to.be.string( 'Invalid number of arguments' );
			}

			try {
				ifx.connect( 'value', function () {} );
			} catch ( e ) {
				expect( e ).to.be.an.instanceof( TypeError );
				expect( e.message ).to.be.string( 'Connection parameters must be an object' );
			}

			try {
				ifx.connect( {}, 'function' );
			} catch ( e ) {
				expect( e ).to.be.an.instanceof( TypeError );
				expect( e.message ).to.be.string( 'Callback must be a function' );
			}

			try {
				ifx.connect( {}, function () {} );
			} catch ( e ) {
				expect( e ).to.be.an.instanceof( TypeError );
				expect( e.message ).to.be.string( "Connection parameter 'id' and 'database' are mandatory" );
			}

		} );


		/**
		*   Note: This test assumes there is a 'test' database and a 'informix' user.
		*/
		it( 'should be able to connect to a database', function ( done ) {
			ifx.connect( {
				id : 'conn:id:2001',
				database : 'test',
				username : 'informix',
				password : '1nf0rm1x'
			}, function ( err, conn ) {
				expect( err ).to.be.null;
				expect( conn ).to.be.string( 'conn:id:2001' );
				done();
			} );
		} );

	} );


	context( 'prepare', function () {

		var ifx  = new Ifx();
		var conn = 'conn:id:3001';

		before( function ( done ) {
			ifx.connect( {
				id : conn,
				database : 'test',
				username : 'informix',
				password : '1nf0rm1x'
			}, function ( err, conn ) {
				done( err );
			} );
		} );


		it( 'should be able to prepare a statement', function ( done ) {

			var sql = 'select tabname from systables where tabname like ?;';

			ifx.prepare( conn, 'stmt_id_1001', sql, function ( err, sid ) {
				expect( err ).to.be.null;
				expect( sid ).to.be.string( 'stmt_id_1001' );
				done();
			} );

		} );

	} );


	context( 'exec', function () {

		var ifx    = new Ifx();
		var connid = 'conn:id:4001';

		before( function ( done ) {
			ifx.connect( {
				id : connid,
				database : 'test',
				username : 'informix',
				password : '1nf0rm1x'
			}, function ( err, connid ) {
				done( err );
			} );
		} );


		context( 'when a select statement is prepared', function () {

			var stmtid = 'statement_4001';
			var curid  = 'cursor_4001';
			var sql    = 'select tabname from systables where tabname like ?;';

			before( function ( done ) {
				ifx.prepare( connid, stmtid, sql, function ( err, stmtid ) {
					done( err );
				} );
			} );

			it( 'should be able to execute the prepared statement', function ( done ) {
				ifx.exec( connid, stmtid, curid, 'sys%auth', function ( err, id ) {
					expect( err ).to.be.null;
					expect( id ).to.eql( curid );
					done();
				} );
			} );

		} );


		context( 'when an insert statement is prepared', function () {

			var stmtid = 'statement_4002';
			var curid  = 'cursor_4002';
			var sql    = 'insert into tcustomers( fname, lname ) values( ?, ? );';

			before( function ( done ) {
				ifx.prepare( connid, stmtid, sql, function ( err, stmtid ) {
					done( err );
				} );
			} );

			it( 'should be able to execute the prepared statement', function ( done ) {
				ifx.exec( connid, stmtid, curid, [ 'First', 'Last' ], function ( err, id ) {
					expect( err ).to.be.null;
					expect( id ).to.eql( curid );
					done();
				} );
			} );

		} );


		context( 'when an execute procedure statement is prepared which returns a value', function () {

			var stmtid = 'statement_4003';
			var curid  = 'cursor_4003';
			var sql    = 'execute procedure pinscustomer( ?, ? );';

			before( function ( done ) {
				ifx.prepare( connid, stmtid, sql, function ( err, stmtid ) {
					done( err );
				} );
			} );

			it( 'should be able to execute the prepared statement', function ( done ) {
				ifx.exec( connid, stmtid, curid, [ 'First', 'Last' ], function ( err, id ) {
					expect( err ).to.be.null;
					expect( id ).to.eql( curid );
					done();
				} );
			} );

		} );


		context( 'when an execute procedure statement is prepared which does not return any values', function () {

			var stmtid = 'statement_4004';
			var curid  = 'cursor_4004';
			var sql    = 'execute procedure ppurgecustomers();';

			before( function ( done ) {
				ifx.prepare( connid, stmtid, sql, function ( err, stmtid ) {
					done( err );
				} );
			} );

			it( 'should be able to execute the prepared statement', function ( done ) {
				ifx.exec( connid, stmtid, curid, function ( err, id ) {
					expect( err ).to.be.null;
					expect( id ).to.eql( curid );
					done();
				} );
			} );

		} );

	} );


	context( 'fetch', function () {

		var ifx    = new Ifx();
		var sql    = 'select tabname from systables where tabname like ?;';

		context( 'when there are results', function () {

			var connid = 'conn:id:5001';
			var stmtid = 'statement_5001';
			var curid  = 'cursor_5001';

			before( function ( done ) {
				ifx.connect( {
					id : connid,
					database : 'test',
					username : 'informix',
					password : '1nf0rm1x'
				}, function ( err, conn ) {
					expect( err ).to.be.null;

					ifx.prepare( connid, stmtid, sql, function ( err, stmtid ) {
						expect( err ).to.be.null;

						ifx.exec( connid, stmtid, curid, 'sys%auth', function ( err, id ) {
							done( err );
						} );
					} );
				} );
			} );

			it( 'should return a results array', function ( done ) {
				ifx.fetch( curid, function ( err, result ) {
					expect( err ).to.be.null;
					expect( result ).to.be.an.instanceof( Array );
					expect( result ).to.have.length( 1 );
					done();
				} );
			} );

		} );


		context( 'when there are no results', function () {

			var connid = 'conn:id:5002';
			var stmtid = 'statement_5002';
			var curid  = 'cursor_5002';

			before( function ( done ) {
				ifx.connect( {
					id : connid,
					database : 'test',
					username : 'informix',
					password : '1nf0rm1x'
				}, function ( err, conn ) {
					expect( err ).to.be.null;

					ifx.prepare( connid, stmtid, sql, function ( err, stmtid ) {
						expect( err ).to.be.null;

						ifx.exec( connid, stmtid, curid, 'sys%authxxxxxx', function ( err, id ) {
							done( err );
						} );
					} );
				} );
			} );

			it( 'should return a null result', function ( done ) {
				ifx.fetch( curid, function ( err, result ) {
					expect( err ).to.be.null;
					expect( result ).to.be.null;
					done();
				} );
			} );

		} );

	} );

} );

