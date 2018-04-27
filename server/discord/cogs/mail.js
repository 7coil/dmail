const validator = require('validator');
const r = require('./../../db');
const config = require('config');
const mailgun = require('mailgun-js')(config.get('api').mailgun);
const marked = require('marked');
const request = require('request');

marked.setOptions({
	sanitize: true
});
const emailRegex = /([\w!#$%&'*+\-/=?^_`{|}~.]+@[\w.!#$%&'*+\-/=?^_`{|}~]+) (?:"(.*?)")? *([\w\W]+)?/;
const replyRegex = /(\w{8}-\w{4}-\w{4}-\w{4}-\w{12}|) *([\w\W]+)/;
const banRegex = /(\d+)>? ?([\w\W]+)/;

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
		'ban'
	],
	name: 'ban',
	uses: 1,
	admin: 3,
	register: false,
	ratelimit: 0,
	command: async (message) => {
		const input = banRegex.exec(message.mss.input);
		if (input) {
			await r.table('bans')
				.insert({
					id: input[1],
					reason: input[2]
				});
			message.channel.createMessage(message.__('ban_banned'));
		} else {
			message.channel.createMessage(message.__('ban_invalid'));
		}
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
		'register'
	],
	name: 'register',
	uses: 1,
	admin: 0,
	register: false,
	ratelimit: 1000,
	command: (message) => {
		message.channel.createMessage('DiscordMail is no longer taking registrations.');
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
			} else if (res.dmail !== message.mss.dmail.id) {
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
					dmail: message.mss.dmail.id
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
}, {
	aliases: [
		'terminate'
	],
	name: 'terminate',
	uses: 1,
	admin: 0,
	register: true,
	ratelimit: 5000,
	command: async (message) => {
		if (message.mss.context === 'guild') {
			message.channel.createMessage(message.__('terminate_guild'));
		} else if (message.mss.context === 'user') {
			message.channel.createMessage(message.__('terminate_user', { url: `${config.get('webserver').domain}/mail/terminate` }));
		}
	}
}];
