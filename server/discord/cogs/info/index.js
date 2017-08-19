const os = require('os');
const client = require('./../../');
const config = require('config');

// Non-changing statistics
// (x64) AMD Athlon (x3) Something @ 3ghz (clocked at ????MHz)
const hardwareinfo = `(${os.arch()}) ${os.cpus()[0].model} clocked at ${os.cpus()[0].speed} MHz`;
const softwareinfo = `[${os.type()}] ${os.release()}`;

const timestamp = (input) => {
	let d = 0;
	let h = 0;
	let m = 0;
	let s = 0;

	m = Math.floor(input / 60);
	s = Math.floor(input % 60);

	h = Math.floor(m / 60);
	m %= 60;

	d = Math.floor(h / 24);
	h %= 24;

	let message = '';
	if (d === 1) {
		message += `${d} day `;
	} else if (d > 1) {
		message += `${d} days `;
	}

	if (h === 1) {
		message += `${h} hour `;
	} else if (h > 1) {
		message += `${h} hours `;
	}

	if (m === 1) {
		message += `${m} minute `;
	} else if (m > 1) {
		message += `${m} minutes `;
	}

	if (s === 1) {
		message += `${s} second `;
	} else if (s > 1) {
		message += `${s} seconds `;
	}

	return message || 'Literally no time whatsoever';
};

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
					name: 'Node.js',
					value: process.version,
					embed: true
				},
				{
					name: 'Uptime',
					value: timestamp(process.uptime()),
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
					value: `This copy of [Discord Mail](https://discordmail.com/) is licenced under the MIT Licence. View the [GitHub repository here](${config.get('webserver').domain}/url/github) or [our guild](${config.get('webserver').domain}/url/help) for more information.`
				}
			]
		}
	};

	message.channel.createMessage(embed);
};
