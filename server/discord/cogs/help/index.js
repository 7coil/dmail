module.exports.alias = [
	'help',
	'imdyinginavatinthegarage'
];

module.exports.command = (message) => {
	message.channel.createMessage('Discord Mail Valid Commands:\n`dmail help` - Get help about Discord Mail\n`dmail info` - Get info about Discord Mail\n`dmail register` - Register for Discord Mail\n`dmail send email@example.com "subject" content` - Send an email. The "quotes" around the subject are required.`');
};
