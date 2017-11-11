const client = require('./..');
const cogs = require('./../cogs');
const { exec } = require('child_process');
const r = require('./../../db');
const i18n = require('i18n');
const os = require('os');
const config = require('config');

const hardwareinfo = `(${os.arch()}) ${os.cpus()[0].model} @ ${os.cpus()[0].speed} MHz`;
const softwareinfo = `[${os.type()}] ${os.release()}`;

module.exports = [{
	aliases: [
		'ping'
	],
	name: 'ping',
	uses: 1,
	admin: 0,
	register: false,
	ratelimit: 1000,
	command: (message) => {
		let s = 0;

		if (message.channel.guild) {
			s = client.guildShardMap[message.channel.guild.id];
		}

		message.channel.createMessage(`\`\`\`\n${client.shards.map(shard => `${s === shard.id ? '>' : ' '}Shard ${shard.id} | ${shard.latency}ms`).join('\n')}\n\`\`\``);
	}
}, {
	aliases: [
		'eval'
	],
	name: 'eval',
	uses: 1,
	admin: 3,
	register: false,
	ratelimit: 0,
	command: (message) => {
		eval(message.mss.input); // eslint-disable-line no-eval
	}
}, {
	aliases: [
		'exec'
	],
	name: 'exec',
	uses: 1,
	admin: 3,
	register: false,
	ratelimit: 0,
	command: (message) => {
		if (message.mss.input) {
			exec(message.mss.input, (error, stdout, stderr) => {
				let output = '';

				if (stdout) {
					output += '=== stdout ===\n';
					output += `${stdout.replace(/`/g, '\'')}\n`;
				}

				if (stderr) {
					output += '=== stderr ===\n';
					output += `${stderr.replace(/`/g, '\'')}\n`;
				}

				message.channel.createMessage(`\n${message.__('exec_output')}\n\`\`\`\n${output}\`\`\``);
			});
		}
	}
}, {
	aliases: [
		'help'
	],
	name: 'help',
	uses: 3,
	admin: 0,
	register: false,
	ratelimit: 5000,
	command: (message) => {
		if (message.mss.input && cogs.commands[message.mss.input]) {
			const command = cogs.commands[message.mss.input];
			const fields = [];
			for (let i = 1; i <= command.uses; i += 1) {
				fields.push({
					name: message.__(`${command.name}_${i}_in`, { prefix: message.mss.prefix, command: command.name }),
					value: message.__(`${command.name}_${i}_out`)
				});
			}

			message.channel.createMessage({
				embed: {
					title: message.__(command.name),
					description: message.__(`${command.name}_desc`),
					fields
				}
			});
		} else if (message.mss.input && cogs.categories[message.mss.input]) {
			message.channel.createMessage({
				embed: {
					title: message.mss.input,
					fields: cogs.categories[message.mss.input]
						.filter(command => message.mss.admin >= command.admin)
						.map(command => ({
							name: command.aliases[0],
							value: message.__(`${command.name}_desc`)
						}))
				}
			});
		} else if (!message.mss.input) {
			let reply = `${message.__('help_intro', { name: message.__('name') })}\n`;
			reply += `${message.__('help_prefixuser', { prefixes: `${config.get('discord').prefix.user.join('; ')}` })}\n`;
			reply += `${message.__('help_prefixguild', { prefixes: `${config.get('discord').prefix.guild.join('; ')}` })}\n`;
			reply += message.__('help_type', { prefix: message.mss.prefix, command: message.mss.command });
			reply += `\n[${message.__('github')}](${config.get('webserver').domain}/url/github)`;
			reply += ` - [${message.__('invite')}](${config.get('webserver').domain}/url/invite)`;
			reply += ` - [${message.__('help_guild')}](${config.get('webserver').domain}/url/help)`;
			reply += ` - [${message.__('guildapp')}](${config.get('webserver').domain}/url/guild)`;
			Object.keys(cogs.categories).forEach((category) => {
				message.channel.createMessage({
					embed: {
						title: category,
						fields: cogs.categories[category]
							.filter(command => message.mss.admin >= command.admin)
							.map(command => ({
								name: command.aliases[0],
								value: message.__(`${command.name}_desc`)
							}))
					}
				});
			});
			message.channel.createMessage({
				embed: {
					description: reply
				}
			});
		} else {
			message.channel.createMessage(message.__('help_invalid'));
		}
	}
}, {
	aliases: [
		'locale'
	],
	name: 'locale',
	uses: 2,
	admin: 0,
	register: false,
	ratelimit: 5000,
	command: async (message) => {
		if (message.mss.input && Object.keys(i18n.getCatalog()).includes(message.mss.input)) {
			await r.table('i18n')
				.insert({
					id: message.author.id,
					lang: message.mss.input
				}, {
					conflict: 'update'
				});
			message.setLocale(message.mss.input);
			message.channel.createMessage(message.__('locale_set', { locale: message.__(`lang_${message.mss.input.replace(/-/g, '_')}`) }));
		} else {
			message.channel.createMessage(`${message.__('locale_incorrect')}\n${Object.keys(i18n.getCatalog()).map(lang => `\`${lang}\` - ${message.__(`lang_${lang.replace(/-/g, '_')}`)}`).join('\n')}`);
		}
	}
}, {
	aliases: [
		'info'
	],
	name: 'info',
	uses: 1,
	admin: 0,
	register: false,
	ratelimit: 5000,
	command: (message) => {
		const embed = {
			embed: {
				fields: [
					{
						name: message.__('info_nodejs'),
						value: process.version,
						inline: true
					},
					{
						name: message.__('info_guilds'),
						value: client.guilds.size,
						inline: true
					},
					{
						name: message.__('info_pid'),
						value: process.pid,
						inline: true
					},
					{
						name: message.__('info_hard'),
						value: hardwareinfo
					},
					{
						name: message.__('info_soft'),
						value: softwareinfo
					},
					{
						name: message.__('info_licence'),
						value: message.__('info_licencedesc', { name: message.__('name') })
					}
				]
			}
		};

		message.channel.createMessage(embed);
	}
}];
