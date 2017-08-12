const r = require('rethinkdb');
const config = require('config');
require('rethinkdb-init')(r);

r.connections = [];
r.getNewConnection = () =>
	r.connect(config.get('api').rethinkdb)
		.then((conn) => {
			conn.use(config.get('api').rethinkdb.db);
			r.connections.push(conn);
			return conn;
		});


r.connect(config.get('api').rethinkdb).then((conn) => {
	r.conn = conn;
	r.connections.push(conn);
	r.conn.use(config.get('api').rethinkdb.db);
});

module.exports = r;
