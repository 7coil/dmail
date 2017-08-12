const request = require('request');
const config = require('config');

module.exports = function gist(input, callback) {
	const data = {
		url: 'https://api.github.com/gists',
		method: 'POST',
		json: true,
		headers: {
			'User-Agent': config.get('useragent'),
		},
		body: {
			description: 'DiscordMail',
			public: true,
			files: {
				discordmail: {
					content: input,
				}
			}
		}
	};

	request.post(data, (err, res, body) => {
		if (err) {
			throw new Error('Error in posting GitHub Gist');
		}

		callback(body.files.discordmail.raw_url);
	});
};
