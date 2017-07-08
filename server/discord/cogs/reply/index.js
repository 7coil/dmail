const config = require('config');
const mailgun = require('mailgun-js')(config.get('api').mailgun);
const request = require('request');
const dmail = require('./../../utils.js').dmail;

const regex = /([\w#]+@[\w.!#$%&'*+\-/=?^_`{|}~]+) *(<.*?>) *"(.*?)" *([\w\W]+)/;

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
				message.channel.createMessage(`Invalid use of command. Expected input: \`dmail ${message.command} email@example.com <Message-ID@example.com> "subject" content\`\nThe "quotes" around the subject are required.`);
			} else {
				const data = {
					from: `${message.author.username}#${message.author.discriminator} <${name}#${message.author.discriminator}@discordmail.com>`,
					to: email[1],
					'In-Reply-To': email[2],
					References: email[2],
					subject: email[3],
					text: email[4]
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
		})
		.catch((err) => {
			message.channel.createMessage(err);
		});
};
