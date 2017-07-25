const config = require('config');

module.exports.info = {
	name: 'Obtain Invite',
	category: 'info',
	aliases: [
		'invite',
		'where'
	]
};

module.exports.command = (message) => {
	message.channel.createMessage(`To add the bot to your guild, go to https://${config.get('api').mailgun.domain}/invite`);
};
