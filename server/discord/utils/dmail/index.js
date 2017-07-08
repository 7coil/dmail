const r = require('./../../../db');

const check = id =>
	new Promise((resolve, reject) => {
		r.table('users')
			.get(id)
			.run(r.conn, (err1, res) => {
				if (err1) {
					reject('Could not search RethonkDB');
				} else if (!res) {
					reject('You are not registered!');
				} else {
					resolve(true);
				}
			});
	});

module.exports.check = check;
