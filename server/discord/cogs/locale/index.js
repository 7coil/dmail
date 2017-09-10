const r = require('../../../db.js');
const i18n = require('i18n');

module.exports.info = {
	name: 'View and set locales',
	category: 'Config',
	aliases: [
		'locale',
		'lang'
	]
};

module.exports.command = (message) => {
	if (message.input) {
		r.table('i18n')
			.insert({
				id: message.inbox,
				lang: message.input
			}, {
				conflict: 'update'
			})
			.run(r.conn, (err) => {
				if (err) {
					message.channel.createMessage(message.__('err_generic'));
				} else {
					message.setLocale(message.input);
					message.channel.createMessage(message.__('locale_set', { locale: message.input }));
				}
			});
	} else {
		message.channel.createMessage(message.__('locale_incorrect', { locales: Object.keys(i18n.getCatalog()).join(', ') }));
	}
};
