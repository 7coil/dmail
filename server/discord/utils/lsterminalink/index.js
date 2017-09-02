const request = require('request');
const config = require('config');

module.exports = function lsterminalink(client) {
	const data = {
		url: `https://ls.terminal.ink/api/bots/${client.user.id}`,
		method: 'POST',
		json: true,
		headers: {
			'User-Agent': config.get('useragent'),
			authorization: config.get('api').lsterminalink
		},
		body: {
			server_count: client.guilds.size
		}
	};

	request.post(data);
};
