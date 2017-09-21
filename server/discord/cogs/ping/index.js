const client = require('./../../');

module.exports.info = {
	aliases: [
		'ping',
		'pong'
	]
};

module.exports.command = message =>
	message.channel.createMessage(`\`\`\`\n${client.shards.map(shard => `Shard ${shard.id} | ${shard.latency}ms`).join('\n')}\n\`\`\``);
