
'use strict';

var uuid = require( 'uuid' );


/**
*   Class representing a cursor to a resultset
*
*   @constructor
*   @param {Ifx} ifx - Native object instance
*   @param {Statement} [stmt] - Statement object
*/
var Cursor = function ( ifx, stmt ) {

	// privileged data
	this.$ = {
		id  : '_' + uuid.v4().replace( /\-/g, 's' ),
		ifx : ifx,
		stmt : stmt
	};

};


/**
*   Return cursor ID
*
*   @return {string} - ID generated for this cursor object.
*/
Cursor.prototype.id = function () {
	return this.$.id;
};


/**
*   Close the results cursor
*
*   @return {Promise.<string, Error>} - A promise to string which would contain
*           the ID of the closed cursor or an Error if rejected.
*/
Cursor.prototype.close = function () {

	var self = this;

	return new Promise( function ( resolve, reject ) {
		self.$.ifx.close( self.$.id, function ( err, curid ) {
			if ( err ) {
				return reject( err );
			}

			if ( self.$.stmt && ( self.$.stmt.flags().autoFree === true ) ) {
				self.$.stmt.free()
					.then( function ( stmtid ) {
						resolve( curid );
					} )
					.catch( reject );
			} else {
				resolve( curid );
			}
		} );
	} );

};


/**
*   Fetch a result
*
*   @return {Promise.<Array|null, Error>} A promise to a results array (or null
*           if no more results) or an Error if rejected.
*/
Cursor.prototype.fetch = function () {

	var self = this;

	return new Promise( function ( resolve, reject ) {
		self.$.ifx.fetch( self.$.id, function ( err, result ) {
			if ( err ) {
				return reject( err );
			}

			resolve( result );
		} );
	} );

};


/**
*   Fetch all results
*
*   @param {object} [opts] - Options
*   @param {boolean} [opts.close=false] - Flag indicating to close the cursor after
*          fetching all results.
*
*   @return {Promise.<Array, Error>} A promise to an array of results or an
*           Error if rejected.
*/
Cursor.prototype.fetchAll = function ( opts ) {

	var self = this;

	if (! opts ) { opts = {}; }

	return new Promise( function ( resolve, reject ) {
		var results = [];
		var fetcher = function ( err, result ) {
			if ( err ) {
				return reject( err );
			}

			if ( result ) {
				results.push( result );
				return self.$.ifx.fetch( self.$.id, fetcher );
			}

			if ( opts.close === true ) {

				self.close()
					.then( function ( curid ) {
						resolve( results );
					} )
					.catch( function ( err ) {
						reject( err );
					} );

			} else {
				resolve( results );
			}
		};

		self.$.ifx.fetch( self.$.id, fetcher );
	} );

};


/**
*   Return the serial value generated after executing an insert statement.
*
*   @return {number} - Generated serial value
*/
Cursor.prototype.serial = function () {
	return this.$.ifx.serial( this.$.id );
};



module.exports = Cursor;
