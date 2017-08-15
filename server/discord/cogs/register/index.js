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
	message.channel.createMessage({
		embed: {
			title: `Welcome to ${config.get('name')}!`,
			description: `Your account has not been created yet. Please read the [DiscordMail Terms of Service](https://${config.get('api').mailgun.domain}/docs/terms) and [Privacy Agreement](https://${config.get('api').mailgun.domain}/docs/privacy) before continuing. If you agree, please run the \`dmail agree\` command to complete your registration`
		}
	});
};
