const config = require('config');
const r = require('../../../db');

module.exports.info = {
	aliases: [
		'register',
		'registur',
		'registro'
	],
	ratelimit: 5000
};

module.exports.command = (message) => {
	if (message.context === 'user') {
		r.table('registrations')
			.get(message.inbox)
			.run(r.conn, (err, res) => {
				if (err) {
					message.channel.createMessage(message.__('err_generic'));
				} else if (res) {
					message.channel.createMessage(message.__('err_registered'));
				} else {
					message.channel.createMessage({
						embed: {
							title: message.__('consent_subject', { name: message.__('name') }),
							description: `[${message.__('register')}](${config.get('webserver').domain}/mail/register)`,
						}
					});
				}
			});
	} else {
		message.channel.createMessage(message.__('consent_guild', { url: `${config.get('webserver').domain}/url/guild` }));
	}
};
