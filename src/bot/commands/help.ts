import Eris from 'eris';
import HaSeul from 'haseul';

const helpCommand = new HaSeul<Eris.Message>();

helpCommand
  .command(({ message }) => {
    message.channel.createMessage({
      content: `
It's okay to ask for help.

\`discordmail register myself\` - Set up your DMs as an inbox.
\`discordmail register channel\` - Set up this channel as an inbox.

**Advanced Setup**
\`discordmail register webhook\` - Set up this channel as an inbox, using webhooks as the transport layer.
\`discordmail register webhook https://discordapp.com/api/webhooks/123/abcdefg\` - Set up the webhook as an inbox.
\`discordmail mei\` - Print a picture from /r/wholesomeyuri

**Deactivate** (aka delete your online presence)
\`discordmail deactivate myself\` - Deactivate DiscordMail for DMs
\`discordmail deactivate channel\` - Deactivate DiscordMail for this channel

To deactivate webhooks, simply delete the webhook from the Discord channel.
`
    })
  })

export default helpCommand;
