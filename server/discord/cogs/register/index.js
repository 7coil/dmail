const config = require('config');

module.exports.info = {
	aliases: [
		'register',
		'registur'
	],
	ratelimit: 5000
};

module.exports.command = (message) => {
	message.channel.createMessage({
		embed: {
			title: message.__('consent_subject', { name: message.__('name') }),
			description: message.__('consent_needed', { prefix: message.prefix }),
			fields: [
				{
					name: message.__('documentation'),
					value: `[${message.__('tos')}](${config.get('webserver').domain}/docs/terms) - [${message.__('pa')}](${config.get('webserver').domain}/docs/privacy)`
				}
			]
		}
	});
};
