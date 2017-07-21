const r = require('./../../../db');

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
				} else if (res.replaced) {
					message.channel.createMessage(`Overwrote \`${message.name}#${message.author.discriminator}@discordmail.com\` to your account.`);
				} else {
					message.channel.createMessage(`Assigned \`${message.name}#${message.author.discriminator}@discordmail.com\` to your account.`);
				}
			});
	} else {
		message.channel.createMessage('To register the guild, please fill this form in. https://docs.google.com/forms/d/e/1FAIpQLScv7zgws6RoCIlRMZwNt-IEt3h-z9i4TrXKAflFInAxDvLZRQ/viewform?usp=sf_link');
	}
};
