const config = require('config');
const mailgun = require('mailgun-js')(config.get('api').mailgun);
const request = require('request');
const dmail = require('./../../utils.js').dmail;
const r = require('./../../../db');
const marked = require('marked');

marked.setOptions({
	sanitize: true
});

const regex = /(\w{8}-\w{4}-\w{4}-\w{4}-\w{12}|) *([\w\W]+)/;

module.exports.info = {
	aliases: [
		'reply'
	],
	ratelimit: 15000
};

module.exports.command = (message) => {
	const email = regex.exec(message.clean.input);
	// Check for registrations
	dmail.check(message)
		.then((details) => {
			const send = (err, res) => {
				if (err) {
					message.channel.createMessage(message.__('err_generic'));
				} else if (!res) {
					message.channel.createMessage(message.__('reply_noexist'));
				} else if (res.dmail !== message.inbox) {
					message.channel.createMessage(message.__('reply_conflict'));
				} else {
					const data = {
						from: `${details.display} <${details.email}@${config.get('api').mailgun.domain}>`,
						to: res.from || res.sender,
						'h:In-Reply-To': res['Message-Id'],
						'h:References': res.References ? `${res.References} ${res['Message-Id']}` : res['Message-Id'],
						subject: `Re: ${res.Subject}`,
						html: marked(email[2].replace(/\n(?=.)/g, '  \n')),
						text: email[2]
					};

					if (message.attachments && message.attachments[0]) {
						data.attachment = request(message.attachments[0].url);
					}

					mailgun.messages().send(data, (err2) => {
						if (err2) {
							message.channel.createMessage(message.__('err_generic'));
							console.log(`Failed to send an email from ${details.email}`);
						} else {
							message.channel.createMessage(message.__('reply_sent'));
							console.log((new Date()).toUTCString(), `Sent reply by ${details.email}`);
						}
					});
				}
			};

			if (!email) {
				message.channel.createMessage(message.__('reply_incorrect', { prefix: message.prefix, command: message.command }));
			} else if (email[1]) {
				r.table('emails')
					.get(email[1])
					.run(r.conn, send);
			} else {
				r.table('emails')
					.orderBy('timestamp')
					.filter({
						dmail: message.inbox
					})
					.nth(-1)
					.run(r.conn, send);
			}
		})
		.catch((err) => {
			message.channel.createMessage(err);
		});
};
