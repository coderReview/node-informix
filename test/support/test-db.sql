
connect to '@informixoltp_tcp' user 'informix' using '1nf0rm1x';

drop database if exists test;
create database test with buffered log;


create table tcustomers (
	id       serial,
	fname    varchar(255),
	lname    varchar(255)
);

create unique index icustomers_x1 on tcustomers(id);

alter table tcustomers add constraint primary key (id)
	constraint ccustomers_pk;


create procedure pinscustomer(
	p_fname like tcustomers.fname,
	p_lname like tcustomers.lname
)
returning int;

	define v_id like tcustomers.id;

	insert into tcustomers(
		fname,
		lname
	) values (
		p_fname,
		p_lname
	);

	let v_id = DBINFO('sqlca.sqlerrd1');
	return v_id;

end procedure;


create procedure ppurgecustomers()
	delete from tcustomers;
end procedure;



create table tdatatypes (
	id        serial8,
	dt        datetime year to fraction,
	date      date,
	decimal   decimal,
	bigint    bigint,
	atext     text
);

