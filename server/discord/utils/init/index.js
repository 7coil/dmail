const i18n = require('i18n');
const utils = require('../../utils.js');
const config = require('config');
const r = require('../../../db.js');

const init = (message, pre, clean, next) => {
	i18n.init(message);
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
		.run(r.conn, (err, res) => {
			if (err) {
				console.dir(err);
			} else if (res && res.lang) {
				message.setLocale(res.lang);
			}
			next();
		});
};

module.exports = init;
