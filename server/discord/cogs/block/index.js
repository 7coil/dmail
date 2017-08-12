const r = require('./../../../db');
const dmail = require('./../../utils.js').dmail;
const isadmin = require('./../../utils.js').isadmin;

module.exports.info = {
	name: 'Block email. Send emails separated by ;',
	category: 'mail',
	aliases: [
		'block',
		'blk'
	]
};

module.exports.command = (message) => {
	if (message.context === 'guild' && !message.channel.guild) {
		message.channel.createMessage('You can only use this context within a guild!');
	} else if (message.context === 'guild' && !isadmin(message.member)) {
		message.channel.createMessage('Only administrators can control the guild\'s dmail!');
	} else {
		// Check for registrations
		dmail.check(message.inbox)
			.then(() => {
				if (!message.input) {
					message.channel.createMessage('Please submit emails to be blocked. Separate emails with semicolons if required.');
				} else {
					const emails = message.input.toLowerCase().split(';');
					r.table('registrations')
						.get(message.inbox)
						.update({
							block: r.row('block').union(emails).default([emails])
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
	}
};
