import Eris from 'eris';
import HaSeul from 'haseul';

const helpCommand = new HaSeul<Eris.Message>();

helpCommand
  .command(({ message }) => {
    message.channel.createMessage({
      content: `
It's okay to ask for help.

\`dmail register myself\` - Set up your DMs as an inbox.
\`dmail register channel\` - Set up this channel as an inbox.

**Advanced Setup**
\`dmail register webhook\` - Set up this channel as an inbox, using webhooks as the transport layer.
\`dmail register webhook https://discordapp.com/api/webhooks/123/abcdefg\` - Set up the webhook as an inbox.
\`dmail mei\` - Print a picture from /r/wholesomeyuri

**Deactivate** (aka delete your online presence)
\`dmail deactivate myself\` - Deactivate Dmail for DMs
\`dmail deactivate channel\` - Deactivate Dmail for this channel

To deactivate webhooks, simply delete the webhook from the Discord channel.
`
    })
  })

export default helpCommand;
