const r = require('./../../../db');
const config = require('config');
const mailgun = require('mailgun-js')(config.get('api').mailgun);

module.exports.info = {
	name: 'Agree to Terms and Conditions',
	category: 'mail',
	aliases: [
		'agree',
		'consent',
		'takemyfuckinglifeaway'
	]
};

module.exports.command = (message) => {
	if (message.context === 'user') {
		r.table('registrations')
			.insert({
				id: message.inbox,
				type: 'user',
				details: {
					name: message.name,
					discrim: message.author.discriminator
				},
				display: `${message.author.username}#${message.author.discriminator}`,
				email: `${message.name}#${message.author.discriminator}`,
				block: []
			}, {
				conflict: 'update'
			})
			.run(r.conn, (err) => {
				if (err) {
					message.channel.createMessage('An error occured writing your registration to the database.');
				} else {
					const data = {
						from: `${config.get('name')} Mail Server <noreply@${config.get('api').mailgun.domain}>`,
						to: `${message.name}#${message.author.discriminator}@${config.get('api').mailgun.domain}`,
						subject: `Welcome to ${config.get('name')}!`,
						html: config.get('welcome')
					};

					mailgun.messages().send(data, (err2) => {
						if (err2) {
							message.channel.createMessage(`Failed to send E-Mail: ${err2.message}`);
							console.log(`Failed to send an introductory email to ${message.name}#${message.author.discriminator}@${config.get('api').mailgun.domain}`);
						} else {
							message.channel.createMessage('Welcome! You should be receiving an E-Mail to your DMs. If you do not recieve one, make sure you have allowed DMs to your account.');
							console.log((new Date()).toUTCString(), `Sent introductory email to ${message.name}#${message.author.discriminator}@${config.get('api').mailgun.domain}`);
						}
					});
				}
			});
	} else {
		message.channel.createMessage(`To register the guild, please fill this form in. ${config.get('webserver').domain}/url/guild`);
	}
};
