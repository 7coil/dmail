// Get the required shit together
const Discord = require('eris');
const config = require('config');
const utils = require('./utils.js');
const r = require('../db');

const client = new Discord.Client(config.get('api').discord.token, {
	maxShards: config.get('discord').shards
});
const prefixes = config.get('discord').prefix.user.concat(config.get('discord').prefix.guild);
let prefix = null;

// Setup commands and util objects.
const commands = require('./cogs.js');

client.on('shardReady', (id) => {
	console.log(`Shard ${id} is online`);
});

client.once('ready', () => {
	prefix = new RegExp(`^(${prefixes.join('|')}).?(${Object.keys(commands).join('|')})\\s?([\\s\\S]*)`, 'i');

	// Add mentions to the prefix list
	prefixes.push(`<@${client.user.id}>`);
	console.log('All shards are online');

	// Set up currently playing game
	client.editStatus('online', {
		name: `${prefixes[0]} help`,
		type: 0
	});

	// Send bots.discord.pw info if it was provided.
	if (config.get('api').botsdiscordpw) {
		utils.botsdiscordpw(client);
		setInterval(() => {
			utils.botsdiscordpw(client);
		}, 1800000);
	}

	// Send discordbots.org info if it was provided.
	if (config.get('api').discordbotsorg) {
		utils.discordbotsorg(client);
		setInterval(() => {
			utils.discordbotsorg(client);
		}, 1800000);
	}

	client.on('messageCreate', (message) => {
		// It crashed on this before. No explaination.
		if (!message.author) return;
		// Disallow if the author is a bot
		if (message.author.bot) return;

		// Test the message content on the regular expression for prefixed commands.
		const pre = prefix.exec(message.content);

		// If there's a result, do this crap.
		if (pre) {
			// Redo the message content but parsed.
			const clean = prefix.exec(message.cleanContent);
			utils.init(message, pre, clean, () => {
				if (message.context === 'guild' && !message.channel.guild) {
					message.channel.createMessage(message.__('err_guild'));
				} else if (message.context === 'guild' && !utils.isadmin(message.member)) {
					message.channel.createMessage(message.__('err_admin'));
				} else if (config.get('discord').disable) {
					message.channel.createMessage(message.__('err_quota'));
				} else if (commands[message.command.toLowerCase()]) {
					commands[message.command.toLowerCase()].command(message);
					r.table('ratelimit')
						.insert({
							id: message.inbox,
							timeout: Date.now() + commands[message.command.toLowerCase()].info.ratelimit
						}, {
							conflict: 'replace'
						})
						.run(r.conn);
				}
			});
		}
	});
});

client.connect();
module.exports = client;
