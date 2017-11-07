const config = require('config');
const r = require('rethinkdbdash')(config.get('api').rethinkdb);

module.exports = r;
