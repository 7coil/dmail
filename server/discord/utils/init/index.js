const i18n = require('i18n');
const utils = require('../../utils.js');
const config = require('config');
const r = require('../../../db.js');

const init = (message, pre, clean, next) => {
	message.prefix = pre[1];
	message.command = pre[2];
	message.input = pre[3] || null;
	message.words = (pre[3] || '').split(' ');
	message.name = utils.dmail.name(message.author.username);
	message.context = config.get('discord').prefix.user.includes(message.prefix.toLowerCase()) ? 'user' : 'guild';
	message.inbox = message.context === 'user' ? message.author.id : (message.channel.guild && message.channel.guild.id) || 'Not inside a guild';
	message.clean = {
		prefix: clean[1],
		command: clean[2],
		input: clean[3],
		words: (pre[3] || '').split(' ')
	};
	r.table('i18n')
		.get(message.inbox)
		.run(r.conn, (err1, res1) => {
			if (err1) {
				console.dir(err1);
			} else if (res1 && res1.lang) {
				message.setLocale(res1.lang);
			}
			i18n.init(message);
			r.table('ratelimit')
				.get(message.author.id)
				.run(r.conn, (err2, res2) => {
					if (err2) {
						message.channel.createMessage(message.__('err_generic'));
					} else if (res2 && (res2.timeout - Date.now()) > 0) {
						message.channel.createMessage(message.__('err_ratelimit', { time: (res2.timeout - Date.now()) / 1000 }));
					} else {
						next();
					}
				});
		});
};

module.exports = init;
