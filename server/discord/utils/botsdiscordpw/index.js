const request = require('request');
const config = require('config');

module.exports = function dbotsupdate(client) {
	const data = {
		url: `https://bots.discord.pw/api/bots/${client.user.id}/stats`,
		method: 'POST',
		json: true,
		headers: {
			'User-Agent': config.get('useragent'),
			authorization: config.get('api').botsdiscordpw
		},
		body: {
			server_count: client.guilds.size
		}
	};

	request.post(data, (err, res, body) => {
		console.log(err, body);
	});
};
