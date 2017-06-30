// Get the required shit together
const Discord = require('eris');
const config = require('config');
const utils = require('./utils.js');

const client = new Discord.Client(config.get('api').discord.token);
const prefixes = config.get('discord').prefix;
let prefix = null;

// Setup commands and util objects.
const commands = require('./cogs.js');

// Just plop all valid commands in for other cogs to look at it.
client.commands = commands;

client.on('ready', () => {
	// Set up regex for the bot.
	// It's "man's essential illness"
	// Use this regex for testing in regexr.com
	// /^(mss).?(ping)\s?([\s\S]*)/
	// /(\w+)rly/
	prefix = new RegExp(`^(${prefixes.join('|')}).?(${Object.keys(commands).join('|')})\\s?([\\s\\S]*)`);

	// Add mentions to the prefix list
	prefixes.push(`<@${client.user.id}>`);
	console.log('Connected to Discord!');

	// Send DBOTS info if it was provided.
	if (config.get('api').botsdiscordpw) {
		utils.botsdiscordpw(client);
		setInterval(() => {
			utils.botsdiscordpw(client);
		}, 1800000);
	}

	// Send FAKEDBOTS info if it was provided.
	if (config.get('api').discordbotsorg) {
		utils.discordbotsorg(client);
		setInterval(() => {
			utils.discordbotsorg(client);
		}, 1800000);
	}
});

client.on('messageCreate', (message) => {
	// It crashed on this before. No explaination.
	if (!message.author) return;
	// Disallow if the author is a bot
	if (message.author.bot) return;

	// Test the message content on the regular expression for prefixed commands and the suffixed commands
	const pre = prefix.exec(message.content);

	// If there's a result, do this crap.
	if (pre) {
		// Bake some cool extra crap into the message
		message.prefix = pre[1];
		message.command = pre[2];
		message.input = pre[3] || null;
		// message.words = pre[3].split(/\n+|\s+/g);

		// Run the actual command
		commands[message.command].command(message, client);
	}
});

// Connect to Discord
console.log('Discord loaded');
client.connect();

module.exports = client;
