const client = require('./../../');

module.exports.info = {
	name: 'Ping',
	description: 'Get the latency for each shard from the server to Discord.',
	category: 'info',
	aliases: [
		'ping',
		'pong'
	],
	use: [
		{
			name: '',
			value: 'Fetch the ping for the bot.'
		}
	]
};

module.exports.command = message =>
	message.channel.createMessage(`\`\`\`\n${client.shards.map(shard => `Shard ${shard.id} | ${shard.latency}ms`).join('\n')}\n\`\`\``);
