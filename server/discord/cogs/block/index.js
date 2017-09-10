const r = require('./../../../db');
const dmail = require('./../../utils.js').dmail;

module.exports.info = {
	name: 'Block E-Mail. Send E-Mails separated by ;',
	category: 'mail',
	aliases: [
		'block',
		'blk'
	]
};

module.exports.command = (message) => {
	// Check for registrations
	dmail.check(message.inbox)
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
