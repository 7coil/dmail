const execFile = require('child_process').execFile;
const config = require('config');

module.exports.info = {
	name: 'Git Execution',
	description: 'Execute git commands.',
	category: 'owner',
	aliases: [
		'git'
	],
	use: [
		{
			name: '<command>',
			value: 'Execute the git command.'
		}
	]
};

module.exports.command = (message) => {
	if (config.get('discord').admins.includes(message.author.id)) {
		execFile('git', message.words, (error, result) => {
			message.channel.createMessage(`\`\`\`${result}\`\`\``);
		});
	}
};
