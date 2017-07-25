const os = require('os');
const utils = require('./../../utils.js');
const client = require('./../../');
const config = require('config');

// Non-changing statistics
// (x64) AMD Athlon (x3) Something @ 3ghz (clocked at ????MHz)
const hardwareinfo = `(${os.arch()}) ${os.cpus()[0].model} clocked at ${os.cpus()[0].speed} MHz`;
const softwareinfo = `[${os.type()}] ${os.release()}`;

module.exports.info = {
	name: 'Info about DiscordMail',
	category: 'info',
	aliases: [
		'info'
	]
};

module.exports.command = (message) => {
	const embed = {
		embed: {
			title: 'discordmail',
			fields: [
				{
					name: 'Node.js',
					value: process.version,
					embed: true
				},
				{
					name: 'Uptime',
					value: utils.timestamp(process.uptime()),
					embed: true
				},
				{
					name: 'Guilds',
					value: client.guilds.size,
					embed: true
				},
				{
					name: 'PID',
					value: process.pid,
					embed: true
				},
				{
					name: 'Hardware',
					value: hardwareinfo
				},
				{
					name: 'Software',
					value: softwareinfo
				},
				{
					name: 'Licence',
					value: `This copy of [Discord Mail](https://discordmail.com/) is licenced under the MIT Licence. View the [GitHub repository here](https://${config.get('api').mailgun.domain}/github) or [our guild](https://${config.get('api').mailgun.domain}/help) for more information.`
				}
			]
		}
	};

	message.channel.createMessage(embed);
};
