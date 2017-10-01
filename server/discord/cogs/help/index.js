const config = require('config');
const fs = require('fs');
const path = require('path');

module.exports.info = {
	aliases: [
		'help',
		'commands'
	],
	ratelimit: 1000
};

module.exports.command = (message) => {
	let reply = `${message.__('help_intro', { name: message.__('name') })}\n`;
	reply += `${message.__('help_prefixuser', { prefixes: `${config.get('discord').prefix.user.join('; ')}` })}\n`;
	reply += `${message.__('help_prefixguild', { prefixes: `${config.get('discord').prefix.guild.join('; ')}` })}\n`;

	if (fs.existsSync(path.join('./', 'promo', 'info', `${message.getLocale()}.md`))) {
		fs.readFile(path.join('./', 'promo', 'info', `${message.getLocale()}.md`), 'utf8', (err, data) => {
			if (err) {
				reply += message.__('err_generic');
			} else {
				reply += data;
			}
			reply += `\n[${message.__('github')}](${config.get('webserver').domain}/url/github) - [${message.__('invite')}](${config.get('webserver').domain}/url/invite) - [${message.__('guild')}](${config.get('webserver').domain}/url/help) - [${message.__('guildapp')}](${config.get('webserver').domain}/url/guild)`;

			const embed = {
				embed: {
					description: reply
				}
			};

			message.channel.createMessage(embed);
		});
	} else {
		message.channel.createMessage(message.__('help_noexist'));
	}
};
