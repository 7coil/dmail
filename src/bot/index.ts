import bodyParser from 'body-parser';
import eris from 'eris';
import express from 'express';
import fs from 'fs';
import HaSeul from 'haseul';
import mysql from 'mysql';
import registerCommand from './commands/register';
import meiCommand from './commands/mei';
import deactivateCommand from './commands/deactivate';
import helpCommand from './commands/help';
import pingCommand from './commands/ping';

const token = fs.readFileSync('/run/secrets/discord_token', { encoding: 'UTF-8' }).trim();
const prefixes = ['discordmail', 'dmail']

const sqlConnection = mysql.createConnection({
  host: 'database',
  user: 'discordmail',
  password: 'discordmail',
  database: 'discordmail'
})

const bot = new eris.Client(token);
const router = new HaSeul<eris.Message>();
const webserver = express();

router
  .set('prefix', prefixes)
  .set('case sensitive routing', false)
  .set('json spaces', 2)
  .command(({message, next, req}) => {
    // If the user is not a bot, continue to route.
    if (message.author.bot) return;

    req.locals.sqlConnection = sqlConnection;
    req.locals.client = bot;
    req.locals.userHasPermission = (
      (message.member && (message.member.permission.has('manageWebhooks') || message.member.permission.has('administrator'))) ||
      message.author.id === '178586069351137280'
    )

    next();
  })
  .command('test', ({message}) => {
    message.channel.createMessage('Hello world!')
  })
  .command('help', helpCommand)
  .command('ping', pingCommand)
  .command('register', registerCommand)
  .command('deactivate', deactivateCommand)
  .command('mei', meiCommand)
  .error(({ message, err }) => {
    console.log(err)
    message.channel.createMessage('An error has occurred while processing your request. ```\n' + err?.stack + '\n```\n\nIf you feel this is in error, visit us on https://discordmail.com/')
  })

webserver
  .set('case sensitive routing', false)
  .set('json spaces', 2)
  .use(bodyParser.json())
  .post('/message/:id', (req, res, next) => {
    bot.createMessage(req.params.id, req.body)
      .then(() => res.status(200).end())
      .catch(err => next(err)) 
  })
  .post('/dm/:id', (req, res, next) => {
    const user = bot.users.get(req.params.id);
    if (!user) return res.status(404);

    user.getDMChannel()
      .then(channel => channel.createMessage(req.body))
      .then(() => res.status(200).end())
      .catch(err => next(err.next))
  })

bot.once('connect', () => {
  console.log('Discord Bot is now available')

  // router.set('prefix', [
  //   ...prefixes,
  //   `<@${bot.user.id}>`
  // ])
})

// Connect to Discord, make webserver
bot.connect();
bot.on('messageCreate', msg => router.route(msg.content, msg));
webserver.listen(8080);
