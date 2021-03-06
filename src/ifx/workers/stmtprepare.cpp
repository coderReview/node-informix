
#include "stmtprepare.h"
#include "../../esqlc.h"


namespace ifx {
namespace workers {

	StmtPrepare::StmtPrepare( ifx::stmt_t * stmt, Nan::Callback * cb ) : Nan::AsyncWorker( cb ), _stmt( stmt ) {
		// constructor
	}


	StmtPrepare::~StmtPrepare() {
		// destructor
	}


	void StmtPrepare::Execute() {

		int32_t code = 0;

		code = esqlc::acquire( _stmt->conn->id.c_str() );
		if ( code < 0 ) {
			return SetErrorMessage( esqlc::errmsg( code ).c_str() );
		}

		// Not ideal to access _stmt->(in|out)sqlda pointers directly here since we are
		// out of the main event loop. However it is unlikely we'll have two threads
		// with the same statement ID coming here due to the uniqueue checks we have
		// in the main event loop code.
		code = esqlc::prepare(
				_stmt->id.c_str(),
				_stmt->stmt.c_str(),
				_stmt->insqlda,
				_stmt->outsqlda );

		if ( code < 0 ) {
			SetErrorMessage( esqlc::errmsg( code ).c_str() );
		} else {
			// 0 or a positive code represents the type of statement
			_stmt->type = code;
		}

		// release the connection
		esqlc::release( _stmt->conn->id.c_str() );

	}

	void StmtPrepare::HandleOKCallback() {

		// stack-allocated handle scope
		Nan::HandleScope scope;

		// calculate the size of the output data buffer we need
		_stmt->size = 0;
		ifx_sqlvar_t * sqlvar = _stmt->outsqlda->sqlvar;
		for ( int8_t i = 0; i < _stmt->outsqlda->sqld; i++, sqlvar++ ) {
			if ( sqlvar->sqltype == SQLCHAR ) {
				sqlvar->sqllen += 1;
			}

			_stmt->size = rtypalign( _stmt->size, sqlvar->sqltype );
			_stmt->size += rtypmsize( sqlvar->sqltype, sqlvar->sqllen );
		}


		v8::Local< v8::Value > argv[] = {
			Nan::Null(),
			Nan::New< v8::String >( _stmt->id ).ToLocalChecked()
		};

		callback->Call( 2, argv, async_resource );

	}

} /* end of namespace workers */
} /* end of namespace ifx */

