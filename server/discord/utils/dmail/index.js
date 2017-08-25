const r = require('./../../../db');
const config = require('config');

const check = id =>
	new Promise((resolve, reject) => {
		r.table('registrations')
			.get(id)
			.run(r.conn, (err1, res) => {
				if (err1) {
					reject('Could not search RethonkDB');
				} else if (!res) {
					reject(`You or the guild are not registered! Please register for ${config.get('name')} using the \`register\` command`);
				} else {
					resolve(res);
				}
			});
	});

const name = string => string.replace(/ /g, '+').replace(/[^\w\d!#$&'*+\-/=?^_`{|}~\u007F-\uFFFF]+/g, '=').toLowerCase();

module.exports.check = check;
module.exports.name = name;
