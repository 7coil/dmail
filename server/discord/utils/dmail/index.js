const r = require('./../../../db');

const check = message =>
	new Promise((resolve, reject) => {
		r.table('registrations')
			.get(message.inbox)
			.run(r.conn, (err1, res) => {
				if (err1) {
					reject(message.__('err_generic'));
				} else if (!res) {
					reject(message.__('what_user_noreg', { prefix: message.prefix }));
				} else {
					resolve(res);
				}
			});
	});

const name = string => string.replace(/ /g, '+').replace(/[^\w\d!#$&'*+\-/=?^_`{|}~\u007F-\uFFFF]+/g, '=').toLowerCase();

module.exports.check = check;
module.exports.name = name;
