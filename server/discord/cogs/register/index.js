const r = require('./../../../db');

module.exports.alias = [
	'reg',
	'register',
];

module.exports.command = (message) => {
	const name = message.author.username
		.replace(/ /g, '+')
		.replace(/\W/g, '=');

	r.table('users')
		.insert({
			id: message.author.id,
			name: `${name}#${message.author.discriminator}`
		}, {
			conflict: 'update'
		})
		.run(r.conn, (err, res) => {
			if (err) {
				message.channel.createMessage('An error occured writing your registration to the database.');
			} else if (res.replaced) {
				message.channel.createMessage(`Reassigned \`${name}#${message.author.discriminator}@discordmail.com\` to your account.`);
			} else {
				message.channel.createMessage(`Assigned \`${name}#${message.author.discriminator}@discordmail.com\` to your account.`);
			}
		});
};
