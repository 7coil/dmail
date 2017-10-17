const r = require('./../../../db');
const config = require('config');
const name = require('./../../utils').dmail.name;
const mailgun = require('mailgun-js')(config.get('api').mailgun);

module.exports.info = {
	aliases: [
		'guild'
	],
	ratelimit: 0
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
							to: `${name(message.input)}@${config.get('api').mailgun.domain}`,
							subject: message.__('consent_subject', { name: message.__('name') }),
							html: config.get('welcome').html,
							text: config.get('welcome').text
						};

						mailgun.messages().send(data, (err2) => {
							if (err2) {
								message.channel.createMessage(message.__('err_generic'));
								console.log(`Failed to send an introductory email to ${name(message.input)}@${config.get('api').mailgun.domain}`);
							} else {
								console.log((new Date()).toUTCString(), `Sent introductory email to ${name(message.input)}@${config.get('api').mailgun.domain}`);
							}
						});
					}
				});
		}
	}
};
