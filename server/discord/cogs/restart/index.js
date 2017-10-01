const config = require('config');

module.exports.info = {
	aliases: [
		'restart',
		'reboot'
	],
	ratelimit: 0
};

module.exports.command = (message) => {
	if (config.get('discord').admins.includes(message.author.id)) {
		message.channel.createMessage('Restarting...')
			.then(() =>
				process.exit(0)
			);
	}
};
