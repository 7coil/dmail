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
				.filter({
					location: message.mss.inbox
				})
				.update({
					block: r.row('block').union(split).default([split])
				});
			message.channel.createMessage(message.__('block_blocked', { emails: split.length }));
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
				.run();

			if (!email) {
				message.channel.createMessage(message.__('reply_noexist'));
			} else if (email.dmail !== message.mss.dmail.id) {
				message.channel.createMessage(message.__('delete_conflict'));
			} else {
				await r.table('emails')
					.get(message.mss.input)
					.delete()
					.run();
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
	register: false,
	ratelimit: 0,
	command: async (message) => {
		const email = name(message.mss.input);
		const check = await r.table('registrations')
			.filter({
				location: message.channel.id
			});
		const mail = await r.table('registrations')
			.filter({
				email
			});
		if (check.length && message.mss.context === 'user') {
			message.channel.createMessage('This channel already has an E-Mail attributed. Override using guild prefix.');
		} else if (mail.length && message.mss.context === 'user') {
			message.channel.createMessage('This E-Mail address has already been taken. Override using guild prefix.');
		} else if (!message.mss.input) {
			message.channel.createMessage('No email was provided.');
		} else if (!message.channel.guild) {
			message.channel.createMessage('This command only works in a guild.');
		} else {
			await r.table('registrations')
				.filter({
					location: message.channel.id
				})
				.delete();
			await r.table('registrations')
				.filter({
					email
				})
				.delete();
			await r.table('registrations')
				.insert({
					location: message.channel.id,
					type: 'guild',
					details: {
						guild: message.channel.guild.id
					},
					display: message.channel.guild.name,
					email,
					block: []
				});

			const data = {
				from: `${config.get('name')} Mail Server <noreply@${config.get('api').mailgun.domain}>`,
				to: `${email}@${config.get('api').mailgun.domain}`,
				subject: message.__('register_subject', { name: message.__('name') }),
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
					title: message.__('register_welcome', { name: message.__('name') }),
					description: `[${message.__('register_user')}](${config.get('webserver').domain}/mail/register)`,
				}
			});
		} else if (message.mss.context === 'guild') {
			message.channel.createMessage({
				embed: {
					title: message.__('register_welcome', { name: message.__('name') }),
					description: `[${message.__('register_guild')}](${config.get('webserver').domain}/url/guild)`,
				}
			});
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
				html: marked((email[3] || 'This document is empty').replace(/\n(?=.)/g, '  \n')),
				text: email[3] || 'This document is empty',
				'h:X-DiscordMail-Guild': message.mss.dmail.type === 'guild' ? message.mss.dmail.details.guild : null,
				'h:X-DiscordMail-Channel': message.channel.id,
				'h:X-DiscordMail-User': message.author.id
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
	uses: 2,
	admin: 0,
	register: true,
	ratelimit: 5000,
	command: (message) => {
		const email = replyRegex.exec(message.mss.cleanInput);
		const send = (res) => {
			if (!res) {
				message.channel.createMessage(message.__('reply_noexist'));
			} else if (res.dmail !== message.mss.inbox) {
				message.channel.createMessage(message.__('reply_conflict'));
			} else {
				const data = {
					from: `${message.mss.dmail.display} <${message.mss.dmail.email}@${config.get('api').mailgun.domain}>`,
					to: res.from || res.sender,
					'h:In-Reply-To': res['Message-Id'],
					'h:References': res.References ? `${res.References} ${res['Message-Id']}` : res['Message-Id'],
					'h:X-DiscordMail-Guild': message.mss.dmail.details.guild || null,
					'h:X-DiscordMail-Channel': message.channel.id,
					'h:X-DiscordMail-User': message.author.id,
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
				.run()
				.then(send);
		} else {
			r.table('emails')
				.orderBy('timestamp')
				.filter({
					dmail: message.mss.inbox
				})
				.nth(-1)
				.then(send);
		}
	}
}, {
	aliases: [
		'what'
	],
	name: 'what',
	uses: 1,
	admin: 0,
	register: true,
	ratelimit: 5000,
	command: async (message) => {
		if (message.mss.input) {
			message.channel.createMessage(message.__('what_self_only'));
		} else {
			const res = (await r.table('registrations')
				.filter({
					location: message.mss.inbox
				}))[0];
			if (message.mss.context === 'guild') {
				message.channel.createMessage(message.__('what_guild_exist', { email: `${res.email}@${config.get('api').mailgun.domain}` }));
			} else if (message.mss.context === 'user') {
				message.channel.createMessage(message.__('what_self_exist', { email: `${res.email}@${config.get('api').mailgun.domain}` }));
			}
		}
	}
}];
