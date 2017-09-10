const config = require('config');
const mailgun = require('mailgun-js')(config.get('api').mailgun);
const request = require('request');
const dmail = require('./../../utils.js').dmail;

const regex = /([\w!#$%&'*+\-/=?^_`{|}~.]+@[\w.!#$%&'*+\-/=?^_`{|}~]+) *"(.*?)" *([\w\W]+)/;

module.exports.info = {
	name: 'Send an E-Mail',
	category: 'mail',
	aliases: [
		'send'
	]
};

module.exports.command = (message) => {
	const email = regex.exec(message.input);
	// Check for registrations
	dmail.check(message)
		.then((details) => {
			if (!email) {
				message.channel.createMessage(message.__('send_incorrect', { prefix: message.prefix, command: message.command }));
			} else if (config.get('ban').email.some(mail => email[1].toLowerCase().includes(mail))) {
				message.channel.createMessage(message.__('send_blocked'));
			} else {
				const data = {
					from: `${details.display} <${details.email}@${config.get('api').mailgun.domain}>`,
					to: email[1],
					subject: email[2],
					text: email[3]
				};

				if (message.attachments && message.attachments[0]) {
					data.attachment = request(message.attachments[0].url);
				}

				mailgun.messages().send(data, (err2) => {
					if (err2) {
						message.channel.createMessage(message.__('err_generic'));
						console.log(`Failed to send an email from ${details.email}`);
					} else {
						message.channel.createMessage(message.__('send_sent'));
						console.log((new Date()).toUTCString(), `Sent email by ${details.email}`);
					}
				});
			}
		})
		.catch((err) => {
			message.channel.createMessage(err.message || err || message.__('err_generic'));
		});
};
