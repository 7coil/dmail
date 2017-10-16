const dmail = require('./../../utils.js').dmail;
const r = require('./../../../db');

const regex = /(\w{8}-\w{4}-\w{4}-\w{4}-\w{12})/;

module.exports.info = {
	aliases: [
		'rm',
		'delete',
		'remove',
		'deleet'
	],
	ratelimit: 500
};

module.exports.command = (message) => {
	const email = regex.exec(message.input);
	// Check for registrations
	dmail.check(message)
		.then(() => {
			if (!email) {
				message.channel.createMessage(message.__('delete_incorrect', { prefix: message.prefix, command: message.command }));
			} else if (email[1]) {
				r.table('emails')
					.get(email[1])
					.run(r.conn, (err1, res) => {
						if (err1) {
							message.channel.createMessage(message.__('err_generic'));
						} else if (!res) {
							message.channel.createMessage(message.__('reply_noexist'));
						} if (res.dmail !== message.inbox) {
							message.channel.createMessage(message.__('delete_conflict'));
						} else {
							r.table('emails')
								.get(email[1])
								.delete()
								.run(r.conn, (err2) => {
									if (err2) {
										message.channel.createMessage(message.__('error_generic'));
									} else {
										message.channel.createMessage(message.__('delete_deleted'));
									}
								});
						}
					});
			}
		})
		.catch((err) => {
			message.channel.createMessage(err);
		});
};
