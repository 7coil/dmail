const validator = require('validator');
const r = require('./../../db');
const config = require('config');
const fs = require('fs');
const path = require('path');
const mailgun = require('mailgun-js')(config.get('api').mailgun);
const marked = require('marked');
const request = require('request');

marked.setOptions({
	sanitize: true
});
const name = string => string.replace(/ /g, '+').replace(/[^\w\d!#$&'*+\-/=?^_`{|}~\u007F-\uFFFF]+/g, '=').toLowerCase();
const emailRegex = /([\w!#$%&'*+\-/=?^_`{|}~.]+@[\w.!#$%&'*+\-/=?^_`{|}~]+) (?:"(.*?)")? *([\w\W]+)?/;
const replyRegex = /(\w{8}-\w{4}-\w{4}-\w{4}-\w{12}|) *([\w\W]+)/;

module.exports = [{
	aliases: [
		'mss'
	],
	name: 'mss',
	uses: 1,
	admin: 3,
	register: false,
	ratelimit: 0,
	command: (message) => {
		message.channel.createMessage(JSON.stringify(message.mss));
	}
}, {
	aliases: [
		'block'
	],
	name: 'block',
	uses: 1,
	admin: 0,
	register: true,
	ratelimit: 5000,
	command: async (message) => {
		const split = message.mss.input.toLowerCase().split(';').map(email => email.trim());
		if (!message.mss.input) {
			message.channel.createMessage(message.__('block_delimit'));
		} else if (split.every(email => validator.isEmail(email))) {
			await r.table('registrations')
				.get(message.mss.inbox)
				.update({
					block: r.row('block').union(split).default([split])
				})
				.run(r.conn);
		} else {
			const invalid = split.filter(email => !validator.isEmail(email)).map(email => `\`${email}\``).join('\n');
			message.channel.createMessage(message.__('err_email', { invalid }));
		}
	}
}, {
	aliases: [
		'delete'
	],
	name: 'delete',
	uses: 1,
	admin: 0,
	register: true,
	ratelimit: 1000,
	command: async (message) => {
		if (validator.isUUID(message.mss.input)) {
			const email = await r.table('emails')
				.get(message.mss.input)
				.run(r.conn);

			if (!email) {
				message.channel.createMessage(message.__('reply_noexist'));
			} else if (email.dmail !== message.mss.inbox) {
				message.channel.createMessage(message.__('delete_conflict'));
			} else {
				await r.table('emails')
					.get(message.mss.input)
					.delete()
					.run(r.conn);
				message.channel.createMessage(message.__('delete_deleted'));
			}
		} else {
			message.channel.createMessage(message.__('delete_incorrect', { prefix: message.mss.prefix, command: message.mss.command }));
		}
	}
}, {
	aliases: [
		'guild'
	],
	name: 'guild',
	uses: 1,
	admin: 3,
	register: true,
	ratelimit: 0,
	command: async (message) => {
		if (!message.mss.input) {
			message.channel.createMessage('No email was provided.');
		} else {
			const email = name(message.mss.input);
			await r.table('registrations')
				.insert({
					id: message.channel.guild.id,
					type: 'guild',
					details: {
						channel: message.channel.id
					},
					display: message.channel.guild.name,
					email,
					block: []
				}, {
					conflict: 'update'
				})
				.run(r.conn);

			const data = {
				from: `${config.get('name')} Mail Server <noreply@${config.get('api').mailgun.domain}>`,
				to: `${email}@${config.get('api').mailgun.domain}`,
				subject: message.__('consent_subject', { name: message.__('name') }),
				html: fs.readFileSync(path.join('./', 'promo', 'guildwelcome.html'), 'utf8'),
				text: fs.readFileSync(path.join('./', 'promo', 'guildwelcome.md'), 'utf8')
			};

			mailgun.messages().send(data, (err2) => {
				if (err2) {
					message.channel.createMessage(message.__('err_generic'));
					console.log(`Failed to send an introductory email to ${email}@${config.get('api').mailgun.domain}`);
				} else {
					console.log((new Date()).toUTCString(), `Sent introductory email to ${email}@${config.get('api').mailgun.domain}`);
				}
			});
		}
	}
}, {
	aliases: [
		'register'
	],
	name: 'register',
	uses: 1,
	admin: 0,
	register: false,
	ratelimit: 1000,
	command: (message) => {
		if (message.mss.dmail) {
			message.channel.createMessage(message.__('err_registered'));
		} else if (message.mss.context === 'user') {
			message.channel.createMessage({
				embed: {
					title: message.__('consent_subject', { name: message.__('name') }),
					description: `[${message.__('register')}](${config.get('webserver').domain}/mail/register)`,
				}
			});
		} else {
			message.channel.createMessage(message.__('consent_guild', { url: `${config.get('webserver').domain}/url/guild` }));
		}
	}
}, {
	aliases: [
		'send'
	],
	name: 'send',
	uses: 1,
	admin: 0,
	register: true,
	ratelimit: 30000,
	command: (message) => {
		const email = emailRegex.exec(message.mss.cleanInput);
		if (!email) {
			message.channel.createMessage(message.__('send_incorrect', { prefix: message.prefix, command: message.command }));
		} else if (config.get('ban').out.some(mail => email[1].toLowerCase().includes(mail))) {
			message.channel.createMessage(message.__('send_blocked'));
		} else {
			const data = {
				from: `${message.mss.dmail.display} <${message.mss.dmail.email}@${config.get('api').mailgun.domain}>`,
				to: email[1],
				subject: email[2] || 'No Subject',
				html: marked((email[3] || '<p>This document is empty</p>').replace(/\n(?=.)/g, '  \n')),
				text: email[3] || 'This document is empty'
			};

			if (message.attachments && message.attachments[0]) {
				data.attachment = request(message.attachments[0].url);
			}

			mailgun.messages().send(data, (err2) => {
				if (err2) {
					message.channel.createMessage(message.__('err_generic'));
					console.log(`Failed to send an email from ${message.mss.dmail.email}`);
				} else {
					message.channel.createMessage(message.__('send_sent'));
					console.log((new Date()).toUTCString(), `Sent email by ${message.mss.dmail.email}`);
				}
			});
		}
	}
}, {
	aliases: [
		'reply'
	],
	name: 'reply',
	uses: 1,
	admin: 0,
	register: true,
	ratelimit: 5000,
	command: (message) => {
		const email = replyRegex.exec(message.mss.cleanInput);
		const send = (err, res) => {
			if (err) {
				message.channel.createMessage(message.__('err_generic'));
			} else if (!res) {
				message.channel.createMessage(message.__('reply_noexist'));
			} else if (res.dmail !== message.inbox) {
				message.channel.createMessage(message.__('reply_conflict'));
			} else {
				const data = {
					from: `${message.mss.dmail.display} <${message.mss.dmail.email}@${config.get('api').mailgun.domain}>`,
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
						console.log(`Failed to send an email from ${message.mss.dmail.email}`);
					} else {
						message.channel.createMessage(message.__('reply_sent'));
						console.log((new Date()).toUTCString(), `Sent reply by ${message.mss.dmail.email}`);
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
	}
}];
