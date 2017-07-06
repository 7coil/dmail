const config = require('config');
const cogs = require('./../../cogs.js');

const column = 14;

const capitalise = string =>
	string.charAt(0).toUpperCase() + string.slice(1);

module.exports.info = {
	name: 'Help about DiscordMail',
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

	let reply = '```\n';
	reply += 'DiscordMail sends e-mails via MailGun to real e-mail addresses and other DiscordMail accounts.\n';
	reply += `Available prefixes are: ${config.get('discord').prefix.join(', ')}\n`;

	Object.keys(categories).forEach((key) => {
		reply += `\n${capitalise(key)}:\n`;
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

	reply += `\nType ${config.get('discord').prefix[0]} ${message.command} command for more info on a command.\n`;
	reply += `You can also type ${config.get('discord').prefix[0]} ${message.command} category for more info on a category.\n`;
	reply += '\n```';

	// Send the REDBOT reply
	message.channel.createMessage(reply);
};
