const r = require('./../../../db');
const config = require('config');
const name = require('./../../utils').dmail.name;

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
						message.channel.createMessage('An error occured writing the registration to the database.');
					} else {
						message.channel.createMessage('Successfully added guild to DiscordMail.');
					}
				});
		}
	}
};
