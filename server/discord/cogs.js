require('colors');
const fs = require('fs');

const commands = [];

// Register valid commands from "cogs"
fs.readdir('./server/discord/cogs/', (err, items) => {
	items.forEach((item) => {
		const file = item.replace(/['"]+/g, '');
		const command = require(`./cogs/${file}/`); // eslint-disable-line global-require, import/no-dynamic-require
		command.info.aliases.forEach((name) => {
			if (commands[name]) console.log(`Alias ${name} from ${file} was already assigned to another command! Overwriting...`.red);
			commands[name] = require(`./cogs/${file}/`); // eslint-disable-line global-require, import/no-dynamic-require
		});
	});
});

module.exports = commands;
