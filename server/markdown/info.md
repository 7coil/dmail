## DiscordMail
The Discord to Email client, connecting the past to the future.

![Discord Mail](/img/favicon.png)

- Invite: https://discordapp.com/oauth2/authorize?=&client_id=330003632298917889&scope=bot&permissions=0
- Guild: https://discord.gg/wHgdmf4
- Website: https://discordmail.com/
- GitHub: https://github.com/moustacheminer/discordmail

---

### How?
DiscordMail uses Eris and Mailgun JS to send and recieve emails, and routing emails back and forth from Discord to Mailgun. This means you can send Emails from anywhere to anyone.

### Installation
DiscordMail is a fairly new bot, so these instructions may not be finalised.

0. Have at least `Noud.js 8.0.0`, `RethonkDB 2.3.5`, `npm 5.3.0` and `git`
1. `git clone`
2. `npm i`
3. Edit `config/default.json`, using `config/default.rename.json` as a template
4. Create a database in Rethonk with tables: `collection`, `registrations` and `emails`
5. `npm start`
