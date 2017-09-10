const r = require('./../../../db');
const config = require('config');
const name = require('./../../utils').dmail.name;
const mailgun = require('mailgun-js')(config.get('api').mailgun);

module.exports.info = {
	name: 'Register a Guild',
	category: 'owner',
	aliases: [
		'guild'
	]
};

module.exports.command = (message) => {
	if (config.get('discord').admins.includes(message.author.id) && message.channel.guild) {
		if (!message.input) {
			message.channel.createMessage('No email was provided.');
		} else {
			r.table('registrations')
				.insert({
					id: message.channel.guild.id,
					type: 'guild',
					details: {
						channel: message.channel.id
					},
					display: message.channel.guild.name,
					email: name(message.input),
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
		}
	}
};
