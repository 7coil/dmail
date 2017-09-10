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
	r.table('registrations')
		.get((id && id[1]) || message.inbox)
		.run(r.conn, (err1, res) => {
			if (err1) {
				message.channel.createMessage(message.__('err_generic'));
			} else if (message.context === 'guild') {
				if (!res) {
					message.channel.createMessage(message.__('what_guild_noexist', { url: `${config.get('webserver').domain}/url/guild` }));
				} else {
					message.channel.createMessage(message.__('what_guild_exist', { email: `${res.email}@${config.get('api').mailgun.domain}` }));
				}
			} else if (message.context === 'user') {
				if (id && !res) {
					message.channel.createMessage(message.__('what_user_noexist'));
				} else if (id && res) {
					message.channel.createMessage(message.__('what_user_exist', { email: `${res.email}@${config.get('api').mailgun.domain}` }));
				} else if (!res) {
					message.channel.createMessage(message.__('what_user_noreg', { prefix: message.prefix }));
				} else {
					message.channel.createMessage(message.__('what_self_exist', { email: `${res.email}@${config.get('api').mailgun.domain}` }));
				}
			}
		});
};
