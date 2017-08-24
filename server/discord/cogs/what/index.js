const config = require('config');
const r = require('./../../../db.js');

const regex = /(\d+)/;

module.exports.info = {
	name: 'Check E-Mail address',
	category: 'mail',
	aliases: [
		'what',
		'check',
		'email'
	]
};

module.exports.command = (message) => {
	const id = regex.exec(message.input);
	if (message.context === 'guild' && !message.channel.guild) {
		message.channel.createMessage('You can only use this context within a guild!');
	} else {
		r.table('registrations')
			.get((id && id[1]) || message.inbox)
			.run(r.conn, (err1, res) => {
				if (err1) {
					message.channel.createMessage('Could not search RethonkDB');
				} else if (message.context === 'guild') {
					if (!res) {
						message.channel.createMessage(`The guild was not registered! Please register for ${config.get('name')} via the Google Forms at ${config.get('webserver').domain}/url/guild`);
					} else {
						message.channel.createMessage(`The Guild's E-Mail is \`${res.email}@${config.get('api').mailgun.domain}\``);
					}
				} else if (message.context === 'user') {
					if (id && !res) {
						message.channel.createMessage(`This user is not registered with ${config.get('name')}`);
					} else if (id && res) {
						message.channel.createMessage(`This user's E-Mail is \`${res.email}@${config.get('api').mailgun.domain}\``);
					} else if (!res) {
						message.channel.createMessage(`You are not registered! Please register for ${config.get('name')} using the \`register\` command`);
					} else {
						message.channel.createMessage(`Your E-Mail is \`${res.email}@${config.get('api').mailgun.domain}\``);
					}
				} else {
					message.channel.createMessage('Invalid context!');
				}
			});
	}
};
