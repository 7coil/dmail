const validator = require('validator');
const r = require('./../../db');
const config = require('config');
const fs = require('fs');
const path = require('path');
const marked = require('marked');
const request = require('request');

marked.setOptions({
	sanitize: true
});
const name = string => string.replace(/ /g, '+').replace(/[^\w\d!#$&'*+\-/=?^_`{|}~\u007F-\uFFFF]+/g, '=').toLowerCase();
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
		'guild'
	],
	name: 'guild',
	uses: 1,
	admin: 3,
	register: false,
	ratelimit: 0,
	command: async (message) => {
		// TODO: Rewrite sending mail
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
		// TODO: Rewrite sending mail
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
		// TODO: Rewrite sending mail
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
		// TODO: Rewrite sending mail
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
