const config = require('config');
const mailgun = require('mailgun-js')(config.get('api').mailgun);
const messages = require('./messages.json');

module.exports.info = {
	aliases: [
		'b1nzy',
		'b1nzy#1337'
	]
};

module.exports.command = (body) => {
	const data = {
		from: `b1nzy <b1nzy#1337@${config.get('api').mailgun.domain}>`,
		to: body.From,
		'h:In-Reply-To': body['Message-Id'],
		'h:References': body['Message-Id'],
		subject: `Re: ${body.Subject}`,
		text: messages.messages[Math.floor(Math.random() * messages.messages.length)]
	};

	mailgun.messages().send(data, (err) => {
		if (err) {
			console.log('Failed to send special message. Giving up.');
		} else {
			console.log('Sent special message to person.');
		}
	});
};
