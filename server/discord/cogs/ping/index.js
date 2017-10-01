const client = require('./../../');

module.exports.info = {
	aliases: [
		'ping',
		'pong'
	]
};

module.exports.command = (message) => {
	let s = 0;

	if (message.channel.guild) {
		s = client.guildShardMap[message.channel.guild.id];
	}

	message.channel.createMessage(`\`\`\`\n${client.shards.map(shard => `${s === shard.id ? '>' : ' '}Shard ${shard.id} | ${shard.latency}ms`).join('\n')}\n\`\`\``);
};
