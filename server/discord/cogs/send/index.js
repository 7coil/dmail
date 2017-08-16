const config = require('config');
const mailgun = require('mailgun-js')(config.get('api').mailgun);
const request = require('request');
const dmail = require('./../../utils.js').dmail;
const isadmin = require('./../../utils.js').isadmin;

const regex = /([\w!#$%&'*+\-/=?^_`{|}~.]+@[\w.!#$%&'*+\-/=?^_`{|}~]+) *"(.*?)" *([\w\W]+)/;

module.exports.info = {
	name: 'Send an email',
	category: 'mail',
	aliases: [
		'send'
	]
};

module.exports.command = (message) => {
	const email = regex.exec(message.input);

	if (message.context === 'guild' && !message.channel.guild) {
		message.channel.createMessage('You can only use this context within a guild!');
	} else if (message.context === 'guild' && !isadmin(message.member)) {
		message.channel.createMessage('Only administrators can control the guild\'s dmail!');
	} else {
		// Check for registrations
		dmail.check(message.inbox)
			.then((details) => {
				if (!email) {
					message.channel.createMessage(`Message not sent.\nExpected input: \`dmail ${message.command} email@example.com "subject" content\`\nThe "quotes" around the subject are required.`);
				} else if (config.get('ban').email.some(mail => email[1].toLowerCase().includes(mail))) {
					message.channel.createMessage('You are not allowed to send to this email.');
				} else {
					const data = {
						from: `${details.display} <${details.email}@${config.get('api').mailgun.domain}>`,
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
				message.channel.createMessage(err.message || err || 'An error occured.');
			});
	}
};
