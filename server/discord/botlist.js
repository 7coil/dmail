const request = require('request');
const config = require('config');

module.exports = (client) => {
	if (config.get('api').botsdiscordpw) {
		const botsdiscordpw = {
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
		request.post(botsdiscordpw);
	}
	if (config.get('api').discordbotsorg) {
		const discordbotsorg = {
			url: `https://discordbots.org/api/bots/${client.user.id}/stats`,
			method: 'POST',
			json: true,
			headers: {
				'User-Agent': config.get('useragent'),
				authorization: config.get('api').discordbotsorg
			},
			body: {
				server_count: client.guilds.size
			}
		};
		request.post(discordbotsorg);
	}
};
