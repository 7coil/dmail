import Eris, { TextChannel } from 'eris';
import HaSeul from 'haseul';

const pingCommand = new HaSeul<Eris.Message>();

pingCommand
  .command(({ message, req }) => {
    const client: Eris.Client = req.locals.client;
    if (client.guildShardMap) {
      let s = 0;

      if (message.channel instanceof TextChannel) {
        s = client.guildShardMap[message.channel.guild.id];
      }

      message.channel.createMessage(`\`\`\`\n${client.shards.map(shard => `${s === shard.id ? '>' : ' '}Shard ${shard.id} | ${shard.latency}ms`).join('\n')}\n\`\`\``);
    } else {
      message.channel.createMessage(`\`\`\`\nLatency information not found\n\`\`\`\n`);
    }
  })

export default pingCommand;
