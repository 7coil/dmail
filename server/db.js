const r = require('rethinkdb');
const config = require('config');

r.connect(config.get('api').rethinkdb).then((conn) => {
	r.conn = conn;
	r.conn.use(config.get('api').rethinkdb.db);
});

module.exports = r;
