const r = require('./../../../db');
const dmail = require('./../../utils.js').dmail;

module.exports.info = {
	aliases: [
		'block',
		'blk',
		'blok',
		'minecraft'
	],
	ratelimit: 500
};

module.exports.command = (message) => {
	// Check for registrations
	dmail.check(message)
		.then(() => {
			if (!message.input) {
				message.channel.createMessage(message.__('block_delimit'));
			} else {
				const emails = message.input.toLowerCase().split(';');
				r.table('registrations')
					.get(message.inbox)
					.update({
						block: r.row('block').union(emails).default([emails])
					})
					.run(r.conn, (err) => {
						if (err) {
							message.channel.createMessage(message.__('err_generic'));
						} else {
							message.channel.createMessage(message.__('block_blocked', { emails: emails.length }));
						}
					});
			}
		})
		.catch((err) => {
			message.channel.createMessage(err);
		});
};
