const config = require('config');
const mailgun = require('mailgun-js')(config.get('api').mailgun);
const request = require('request');
const dmail = require('./../../utils.js').dmail;
const r = require('./../../../db');

const regex = /(\w{8}-\w{4}-\w{4}-\w{4}-\w{12}) *([\w\W]+)/;

module.exports.info = {
	name: 'Reply to E-Mail',
	category: 'mail',
	aliases: [
		'reply'
	]
};

module.exports.command = (message) => {
	const name = message.author.username
		.replace(/ /g, '+')
		.replace(/\W/g, '=')
		.toLowerCase();

	const email = regex.exec(message.input);

	// Check for registrations
	dmail.check(message.author.id)
		.then(() => {
			if (!email) {
				message.channel.createMessage(`Invalid use of command. Expected input: \`dmail ${message.command} Reply-ID content\``);
			} else {
				r.table('replies')
					.get(email[1])
					.run(r.conn, (err, res) => {
						if (err) {
							message.channel.createMessage(`An error occured looking up your reply: ${err.message}`);
						} else if (!res) {
							message.channel.createMessage('Could not find your Reply-ID');
						} else if (res.to !== `${name}#${message.author.discriminator}`) {
							message.channel.createMessage('You are not allowed to reply with other user\'s IDs');
						} else {
							const data = {
								from: `${message.author.username}#${message.author.discriminator} <${name}#${message.author.discriminator}@discordmail.com>`,
								to: res.from,
								'h:In-Reply-To': res.reply,
								'h:References': res.reference,
								subject: res.subject,
								text: email[2]
							};

							if (message.attachments && message.attachments[0]) {
								data.attachment = request(message.attachments[0].url);
							}

							mailgun.messages().send(data, (err2) => {
								if (err2) {
									message.channel.createMessage(`Failed to send E-Mail: ${err2.message}`);
									console.log(`Failed to send an email from ${name}#${message.author.discriminator}`);
								} else {
									message.channel.createMessage('Successfully sent E-Mail.');
									console.log(`Sent an email by ${name}#${message.author.discriminator}`);
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
