const r = require('./../../../db');

const check = id =>
	new Promise((resolve, reject) => {
		r.table('registrations')
			.get(id)
			.run(r.conn, (err1, res) => {
				if (err1) {
					reject('Could not search RethonkDB');
				} else if (!res) {
					reject('You or the guild are not registered! Use `dmail register` after referring to the Terms of Service on discordmail.com');
				} else {
					resolve(res);
				}
			});
	});

module.exports.check = check;
