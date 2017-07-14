const config = require('config');
const mailgun = require('mailgun-js')(config.get('api').mailgun);
const request = require('request');
const dmail = require('./../../utils.js').dmail;

const regex = /([\w#]+@[\w.!#$%&'*+\-/=?^_`{|}~]+) *"(.*?)" *([\w\W]+)/;

module.exports.info = {
	name: 'Send an email',
	category: 'mail',
	aliases: [
		'send'
	]
};

module.exports.command = (message) => {
	const email = regex.exec(message.input);

	// Check for registrations
	dmail.check(message.inbox)
		.then((details) => {
			if (!email) {
				message.channel.createMessage(`Invalid use of command.\nExpected input: \`dmail ${message.command} email@example.com "subject" content\`\nThe "quotes" around the subject are required.`);
			} else {
				const data = {
					from: `${details.display} <${details.email}@discordmail.com>`,
					to: email[1],
					subject: email[2],
					text: email[3] + config.get('footer')
				};

				if (message.attachments && message.attachments[0]) {
					data.attachment = request(message.attachments[0].url);
				}

				mailgun.messages().send(data, (err2) => {
					if (err2) {
						message.channel.createMessage(`Failed to send E-Mail: ${err2.message}`);
						console.log(`Failed to send an email from ${details.email}`);
					} else {
						message.channel.createMessage('Successfully sent E-Mail.');
						console.log(`Sent an email by ${details.email}`);
					}
				});
			}
		})
		.catch((err) => {
			message.channel.createMessage(err);
		});
};
