const r = require('./../../../db');

module.exports = id =>
	new Promise((resolve, reject) => {
		r.table('b1nzy')
			.get(id)
			.run(r.conn, (err1, res) => {
				r.table('b1nzy')
					.insert({
						id,
						b1nzy: Date.now() + 2000
					}, {
						conflict: 'replace'
					})
					.run(r.conn);

				if (!res || (res && res.b1nzy && res.b1nzy - Date.now() < 0)) {
					resolve(true);
				} else {
					reject(res.b1nzy - Date.now());
				}
			});
	});
