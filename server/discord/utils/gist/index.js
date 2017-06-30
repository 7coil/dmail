const request = require('request');
const config = require('config');
const utils = require('./../../utils.js');

module.exports = function gist(input, callback) {
	const text = utils.makeString(input);

	const data = {
		url: 'https://api.github.com/gists',
		method: 'POST',
		json: true,
		headers: {
			'User-Agent': config.get('useragent'),
		},
		body: {
			description: 'Collabot Discord Bot Large-Text Output',
			public: true,
			files: {
				moustacheminer: {
					content: text,
				}
			}
		}
	};

	request.post(data, (err, res, body) => {
		if (err) {
			throw new Error('Error in posting GitHub Gist');
		}

		callback(body.files.moustacheminer.raw_url);
	});
};
