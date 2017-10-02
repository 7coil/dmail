const r = require('../../../db');
const config = require('config');
const mailgun = require('mailgun-js')(config.get('api').mailgun);
const client = require('../../');

module.exports.info = {
	aliases: [
		'agree',
		'consent',
		'takemyfuckinglifeaway'
	],
	ratelimit: 500
};

module.exports.command = (message) => {
	if (message.context === 'user') {
		client.getDMChannel(message.inbox)
			.then((channel) => {
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
					})
					.run(r.conn, (err, res) => {
						if (err) {
							message.channel.createMessage(message.__('err_generic'));
						} else if (res.errors) {
							message.channel.createMessage(message.__('err_registered'));
						} else {
							const data = {
								from: `${config.get('name')} Mail Server <noreply@${config.get('api').mailgun.domain}>`,
								to: `${message.name}#${message.author.discriminator}@${config.get('api').mailgun.domain}`,
								subject: message.__('consent_subject', { name: message.__('name') }),
								html: config.get('welcome')
							};

							channel.createMessage(`${message.name}#${message.author.discriminator}@${config.get('api').mailgun.domain}`)
								.then(() => {
									message.channel.createMessage(message.__('consent_message'));
									mailgun.messages().send(data, (err2) => {
										if (err2) {
											message.channel.createMessage(message.__('err_generic'));
											console.log(`Failed to send an introductory email to ${message.name}#${message.author.discriminator}@${config.get('api').mailgun.domain}`);
										} else {
											console.log((new Date()).toUTCString(), `Sent introductory email to ${message.name}#${message.author.discriminator}@${config.get('api').mailgun.domain}`);
										}
									});
								})
								.catch(() => {
									message.channel.createMessage(message.__('err_dm'));
									r.table('registrations')
										.get(message.inbox)
										.delete()
										.run(r.conn);
								});
						}
					});
			})
			.catch(() => {
				message.channel.createMessage(message.__('err_dm'));
			});
	} else {
		message.channel.createMessage(message.__('consent_guild', { url: `${config.get('webserver').domain}/url/guild` }));
	}
};
