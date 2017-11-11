// Get the required shit together
const Discord = require('eris');
const config = require('config');
const { commands } = require('./cogs');
const handler = require('./handler');
const botlist = require('./botlist');
const r = require('./../db');

const client = new Discord.Client(config.get('api').discord.token, {
	maxShards: config.get('discord').shards
});

const prefixes = config.get('discord').prefix.user;

client.once('ready', () => {
	console.log('All shards are online');

	// Set up currently playing game
	//	client.editStatus('online', {
	//		name: `${prefixes[0]} help`,
	//		type: 0
	//	});

	setInterval(() => {
		botlist(client);
	}, 1800000);
	botlist(client);

	client.on('messageCreate', (message) => {
		handler(message, () => {
			// Run command if it exists, and if their permissions level is good enough
			if (message.mss.command && message.mss.context === 'guild' && !message.channel.guild) {
				message.channel.createMessage(message.__('err_guild'));
			} else if (message.mss.command && message.mss.context === 'guild' && message.mss.admin < 1) {
				message.channel.createMessage(message.__('err_admin'));
			} else if (message.mss.command && config.get('discord').disable) {
				message.channel.createMessage(message.__('err_quota'));
			} else if (message.mss.command && message.mss.context === 'guild' && !message.mss.dmail && commands[message.mss.command].register) {
				message.channel.createMessage(message.__('what_guild_noexist', { url: `${config.get('webserver').domain}/url/guild` }));
			} else if (message.mss.command && message.mss.context === 'user' && !message.mss.dmail && commands[message.mss.command].register) {
				message.channel.createMessage(message.__('what_user_noreg', { prefix: message.mss.prefix }));
			} else if (message.mss.command && message.mss.timeout > 0) {
				message.channel.createMessage(message.__('err_ratelimit', { time: message.mss.timeout }));
			} else if (message.mss.command && message.mss.admin >= commands[message.mss.command].admin) {
				commands[message.mss.command].command(message);
				r.table('ratelimit')
					.insert({
						id: message.author.id,
						timeout: Date.now() + (typeof commands[message.mss.command].ratelimit === 'number' ? commands[message.mss.command].ratelimit : 5000)
					}, {
						conflict: 'replace'
					})
					.run();
			}
		});
	});
});

client.connect();
module.exports = client;
