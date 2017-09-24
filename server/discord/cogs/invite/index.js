const config = require('config');

module.exports.info = {
	aliases: [
		'invite',
		'links'
	]
};

module.exports.command = (message) => {
	const embed = {
		embed: {
			description: `[${message.__('github')}](${config.get('webserver').domain}/url/github) - [${message.__('invite')}](${config.get('webserver').domain}/url/invite) - [${message.__('guild')}](${config.get('webserver').domain}/url/help) - [${message.__('guildapp')}](${config.get('webserver').domain}/url/guild)`
		}
	};

	message.channel.createMessage(embed);
};
