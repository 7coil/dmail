const config = require('config');
const mailgun = require('mailgun-js')(config.get('api').mailgun);
const discord = require('../../discord');

module.exports.info = {
	aliases: [
		'ping'
	]
};

module.exports.command = (body) => {
	const data = {
		from: `DiscordMail Ping Client <ping@${config.get('api').mailgun.domain}>`,
		to: body.From,
		'h:In-Reply-To': body['Message-Id'],
		'h:References': body['Message-Id'],
		subject: `Re: ${body.Subject}`,
		text: discord.shards.map(shard => `Shard ${shard.id} | ${shard.latency}ms`).join('\n')
	};

	mailgun.messages().send(data, (err) => {
		if (err) {
			console.log('Failed to send special message. Giving up.');
		} else {
			console.log('Sent special message to person.');
		}
	});
};
