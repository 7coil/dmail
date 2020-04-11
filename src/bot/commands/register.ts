import datauri from 'datauri';
import Eris, { Client, TextChannel } from 'eris';
import HaSeul from 'haseul';
import { Connection } from 'mysql';
import path from 'path';
import { v4 as uuid4 } from 'uuid';
import pictureFileLocation from '../images/favicon.png';
import AccountTypes from '../AccountTypes';

const registerCommand = new HaSeul<Eris.Message>();

const createEmail = ({
  req, email, accountType, payload, message, next
}) => {
  const sqlConnection: Connection = req.locals.sqlConnection;
  const client: Client = req.locals.client;

  client.getDMChannel(message.author.id)
    .then((privateChannel) => {
      sqlConnection.query(`INSERT INTO accounts (id, type, payload) VALUES (?, ?, ?);`, [email, accountType, payload], (err) => {
        if (err) {
          next(err);
        } else {
          message.channel.createMessage('Thanks for joining! For privacy reasons, please look into your DMs.')
          privateChannel.createMessage(`Thanks for joining! Your email address is \`${email}@${process.env.DOMAIN_NAME}\`.`);
        }
      })
    })
    .catch((err) => {
      next(err);
    })
}

registerCommand
  .command('myself', ({ message, req, next }) => {
    const email = uuid4();

    createEmail({
      req,
      email,
      accountType: AccountTypes.USER_ACCOUNT,
      payload: message.author.id,
      message,
      next
    })
  })
  .command('channel', ({ message, req, next }) => {
    if (message.channel instanceof TextChannel) {
      if (req.locals.userHasPermission) {
        const email = uuid4();
        createEmail({
          req,
          email,
          accountType: AccountTypes.GUILD_ACCOUNT,
          payload: message.channel.id,
          message,
          next
        })
      } else {
        next(new Error('You don\'t have enough permissions to do this! Ask your administrator for the "manageWebhooks" or "administrator" permission.'))
      }
    } else {
      next(new Error('You cannot create an account outside a Guild.'))
    }
  })
  .command('webhook', ({ message, content, req, next }) => {
    const email = uuid4();
    if (content.length > 0) {
      if (/^https:\/\/(canary.|ptb.)?discordapp.com\/api\/webhooks\/\d+\/[\w-_]{50,70}$/.test(content)) {
        createEmail({
          req,
          email,
          accountType: AccountTypes.WEBHOOK_ACCOUNT,
          payload: content,
          message,
          next
        })
      }
    } else if (message.channel instanceof TextChannel) {
      if (req.locals.userHasPermission) {
        const client: Client = req.locals.client;

        const botMember = message.channel.guild.members.get(client.user.id);
        const overwrittenBotPermissions = message.channel.permissionOverwrites.get(client.user.id);
        if (
          (botMember && (botMember.permission.has('administrator') || botMember.permission.has('manageWebhooks'))) ||
          (overwrittenBotPermissions && overwrittenBotPermissions.has('manageWebhooks'))
        ) {
          message.channel.createWebhook({
            name: 'DiscordMail',
            avatar: datauri.sync(path.join(__dirname, pictureFileLocation))
          }, `Create email for user: ${message.author.username}#${message.author.discriminator} <${message.author.id}>`)
            .then((webhook) => {
              createEmail({
                req,
                email,
                accountType: AccountTypes.WEBHOOK_ACCOUNT,
                payload: `https://discordapp.com/api/webhooks/${webhook.id}/${webhook.token}`,
                message,
                next
              })
            })
            .catch(err => next(err));
        } else {
          next(new Error('This bot does not have the correct permissions to create an account within this channel.'))
        }
      } else {
        next(new Error('You don\'t have enough permissions to do this! Ask your administrator for the "manageWebhooks" or "administrator" permission.'))
      }
    } else {
      next(new Error('You cannot create an account outside a Guild.'))
    }
  })
  .command(({ message }) => {
    message.channel.createMessage({
      content: `
Welcome to DiscordMail! To register, run one of the following commands:

\`discordmail register myself\` - Set up your DMs as an inbox.
\`discordmail register channel\` - Set up this channel as an inbox.

**Advanced Setup**
\`discordmail register webhook\` - Set up this channel as an inbox, using webhooks as the transport layer.
\`discordmail register webhook https://discordapp.com/api/webhooks/123/abcdefg\` - Set up the webhook as an inbox.
`
    })
  })

export default registerCommand;
