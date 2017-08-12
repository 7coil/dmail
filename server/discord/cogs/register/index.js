const r = require('./../../../db');
const config = require('config');

module.exports.info = {
	name: 'Register for DiscordMail',
	category: 'mail',
	aliases: [
		'register',
		'reg'
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
			.run(r.conn, (err, res) => {
				if (err) {
					message.channel.createMessage('An error occured writing your registration to the database.');
				} else {
					message.channel.createMessage({
						embed: {
							title: `Welcome to ${config.get('name')}!`,
							description: `${res.replaced ? 'Reassigned' : 'Assigned'} \`${message.name}#${message.author.discriminator}@${config.get('api').mailgun.domain}\` to your account.\nPlease consult the [DiscordMail Terms of Service](https://${config.get('api').mailgun.domain}/docs/terms) and [Privacy Agreement](https://${config.get('api').mailgun.domain}/docs/privacy) before continuting.`
						}
					});
				}
			});
	} else {
		message.channel.createMessage(`To register the guild, please fill this form in. https://${config.get('api').mailgun.domain}/url/guild`);
	}
};
