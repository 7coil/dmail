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
					reject(`You or the guild are not registered! Use \`dmail register\` after referring to the Terms of Service on ${config.get('api').mailgun.domain}`);
				} else {
					resolve(res);
				}
			});
	});

const name = string => string.replace(/ /g, '+').replace(/\W/g, '=').toLowerCase();

module.exports.check = check;
module.exports.name = name;
