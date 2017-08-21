const config = require('config');
const cogs = require('./../../cogs.js');

const column = 10;

const capitalise = string =>
	string.charAt(0).toUpperCase() + string.slice(1);

module.exports.info = {
	name: 'Help on DiscordMail',
	category: 'info',
	aliases: [
		'help',
		'commands'
	]
};

module.exports.command = (message) => {
	const categories = {};
	const commands = [];

	// Get the categories for each bot
	Object.keys(cogs).forEach((key) => {
		// If the category doesn't exist, make an array for it
		if (!categories[cogs[key].info.category]) categories[cogs[key].info.category] = [];

		if (!commands.includes(cogs[key].info.aliases[0])) {
			commands.push(cogs[key].info.aliases[0]);
			categories[cogs[key].info.category].push({
				command: key,
				description: cogs[key].info.name
			});
		}
	});

	let reply = `${config.get('name')} allows you to send and recieve emails from within Discord.\n`;
	reply += `Prefixes for users: \`${config.get('discord').prefix.user.join('; ')}\`\n`;
	reply += `Prefixes for guilds: \`${config.get('discord').prefix.guild.join('; ')}\`\n`;
	reply += '```\n';
	Object.keys(categories).forEach((key) => {
		reply += `${capitalise(key)}:\n`;
		categories[key].forEach((command) => {
			const spaces = column - command.command.length;
			reply += '  ';
			reply += command.command;

			// Fill in spaces to the description
			let i = 0;
			do {
				i += 1;
				reply += ' ';
			} while (i < spaces);

			reply += command.description;
			reply += '\n';
		});
	});

	reply += `\n\`\`\`\n[GitHub](${config.get('webserver').domain}/url/github) - [Moustacheminer Server Services Guild](${config.get('webserver').domain}/url/help) - [Guild Applications](${config.get('webserver').domain}/url/guild)`;

	const embed = {
		embed: {
			description: reply
		}
	};

	message.channel.createMessage(embed);
};
