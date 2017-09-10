const os = require('os');
const client = require('./../../');

// Non-changing statistics
// (x64) AMD Athlon (x3) Something @ 3ghz (clocked at ????MHz)
const hardwareinfo = `(${os.arch()}) ${os.cpus()[0].model} @ ${os.cpus()[0].speed} MHz`;
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
};
