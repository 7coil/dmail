const fs = require('fs');

const utils = {};

// Register valid utils from "utils"
fs.readdir('./server/discord/utils/', (err, items) => {
	items.forEach((item) => {
		const file = item.replace(/['"]+/g, '');
		utils[file] = require(`./utils/${file}/`); // eslint-disable-line global-require, import/no-dynamic-require
	});
});

module.exports = utils;
