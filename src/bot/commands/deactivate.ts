import Eris, { TextChannel } from 'eris';
import HaSeul from 'haseul';
import { Connection } from 'mysql';
import AccountTypes from '../AccountTypes';

const deactivateCommand = new HaSeul<Eris.Message>();

deactivateCommand
  .command('myself', ({ message, req, next }) => {
    const sqlConnection: Connection = req.locals.sqlConnection;
    sqlConnection.query(`DELETE FROM accounts WHERE type = ? AND payload = ?`, [AccountTypes.USER_ACCOUNT, message.author.id], (err) => {
      if (err) {
        next(err);
      } else {
        message.channel.createMessage('Deleted all emails for your account.')
      }
    })
  })
  .command('channel', ({ message, req, next }) => {
    if (message.channel instanceof TextChannel) {
      if (req.locals.userHasPermission) {
        const sqlConnection: Connection = req.locals.sqlConnection;
        sqlConnection.query(`DELETE FROM accounts WHERE type = ? AND payload = ?`, [AccountTypes.GUILD_ACCOUNT, message.channel.id], (err) => {
          if (err) {
            next(err);
          } else {
            message.channel.createMessage('Deleted all emails for this channel.')
          }
        })
      } else {
        next(new Error('You don\'t have enough permissions to do this! Ask your administrator for the "manageWebhooks" or "administrator" permission.'))
      }
    } else {
      next(new Error('You cannot delete a text channel account outside a Guild.'))
    }
  })
  .command('webhook', ({ message, req, next, content }) => {
    if (/^https:\/\/(canary.|ptb.)?discord(app)?.com\/api\/webhooks\/\d+\/[\w-_]{50,70}$/.test(content)) {
      const sqlConnection: Connection = req.locals.sqlConnection;
      sqlConnection.query(`DELETE FROM accounts WHERE type = ? AND payload = ?`, [AccountTypes.WEBHOOK_ACCOUNT, content], (err) => {
        if (err) {
          next(err);
        } else {
          message.channel.createMessage('Deleted all emails for this webhook.')
        }
      })
    } else {
      next(new Error('This webhook does not match the format of a Discord webhook. Try entering the channel settings and deleting the webhook instead.'))
    }
  })
  .command(({ message }) => {
    message.channel.createMessage({
      content: `
It's okay to leave. Enter a command to deactivate a specific service.

\`dmail deactivate myself\` - Deactivate Dmail for DMs
\`dmail deactivate channel\` - Deactivate Dmail for this channel

To deactivate webhooks, simply delete the webhook from the Discord channel.
`
    })
  })

export default deactivateCommand;
