const r = require('./../../../db');
const config = require('config');
const mailgun = require('mailgun-js')(config.get('api').mailgun);

module.exports.info = {
	aliases: [
		'agree',
		'consent',
		'takemyfuckinglifeaway'
	],
	ratelimit: 30000
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
					message.channel.createMessage(message.__('err_generic'));
				} else {
					const data = {
						from: `${config.get('name')} Mail Server <noreply@${config.get('api').mailgun.domain}>`,
						to: `${message.name}#${message.author.discriminator}@${config.get('api').mailgun.domain}`,
						subject: message.__('consent_subject', { name: message.__('name') }),
						html: config.get('welcome')
					};

					mailgun.messages().send(data, (err2) => {
						if (err2) {
							message.channel.createMessage(message.__('err_generic'));
							console.log(`Failed to send an introductory email to ${message.name}#${message.author.discriminator}@${config.get('api').mailgun.domain}`);
						} else {
							message.channel.createMessage(message.__('consent_message'));
							console.log((new Date()).toUTCString(), `Sent introductory email to ${message.name}#${message.author.discriminator}@${config.get('api').mailgun.domain}`);
						}
					});
				}
			});
	} else {
		message.channel.createMessage(message.__('consent_guild', { url: `${config.get('webserver').domain}/url/guild` }));
	}
};
