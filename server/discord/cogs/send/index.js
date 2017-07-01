const r = require('./../../../db');
const config = require('config');
const mailgun = require('mailgun-js')(config.get('api').mailgun);

const regex = /([\w#]+@[\w.!#$%&'*+\-/=?^_`{|}~]+) *"(.*?)" *([\w\W]+)/;

module.exports.alias = [
	'send',
	'mail'
];

module.exports.command = (message) => {
	const name = message.author.username
		.replace(/ /g, '+')
		.replace(/\W/g, '=');

	const email = regex.exec(message.input);

	r.table('users')
		.get(message.author.id)
		.run(r.conn, (err1, res) => {
			if (err1) {
				message.channel.createMessage('An error occured while searching for registrations.');
			} else if (!res) {
				message.channel.createMessage('You have not registered yet. Please run `dmail register` to register an E-Mail with your account.');
			} else if (!email) {
				message.channel.createMessage(`Invalid use of command. Expected input: \`dmail ${message.command} email@example.com "subject" content\`\nThe "quotes" around the subject are required.`);
			} else {
				const data = {
					from: `${message.author.username}#${message.author.discriminator} <${name}#${message.author.discriminator}@discordmail.com>`,
					to: email[1],
					subject: email[2],
					text: email[3]
				};

				mailgun.messages().send(data, (err2) => {
					if (err2) {
						message.channel.createMessage(`Failed to send E-Mail: ${err2.message}`);
					} else {
						message.channel.createMessage('Successfully sent E-Mail.');
					}
				});
			}
		});
};
