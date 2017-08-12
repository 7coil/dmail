const config = require('config');

module.exports.info = {
	name: 'Restart',
	description: 'Restart the bot, and all of it\'s shards.',
	category: 'Owner',
	aliases: [
		'restart',
		'reboot'
	],
	use: [
		{
			name: '',
			value: 'Restart the bot'
		}
	]
};

module.exports.command = (message) => {
	if (config.get('discord').admins.includes(message.author.id)) {
		message.channel.createMessage('Restarting...')
			.then(() =>
				process.exit(0)
			);
	}
};
