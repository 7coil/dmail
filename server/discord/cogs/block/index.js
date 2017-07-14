const r = require('./../../../db');
const dmail = require('./../../utils.js').dmail;

module.exports.info = {
	name: 'Block email. Send emails separated by ;',
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
				message.channel.createMessage('Please send an email to block!');
			} else {
				const emails = message.input.toLowerCase().split(';');
				r.table('registrations')
					.get(message.author.id)
					.update({
						block: r.row('block').union(emails)
					})
					.run(r.conn, (err) => {
						if (err) {
							message.channel.createMessage(`A fatal error occured: ${err.message}`);
						} else {
							message.channel.createMessage(`Blocked ${emails.length} email${emails.length > 1 ? 's' : ''}.`);
						}
					});
			}
		})
		.catch((err) => {
			message.channel.createMessage(err);
		});
};
