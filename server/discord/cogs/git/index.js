const execFile = require('child_process').execFile;
const config = require('config');

module.exports.info = {
	aliases: [
		'git'
	]
};

module.exports.command = (message) => {
	if (config.get('discord').admins.includes(message.author.id)) {
		execFile('git', message.words, (error, result) => {
			message.channel.createMessage(`\`\`\`${result}\`\`\``);
		});
	}
};
