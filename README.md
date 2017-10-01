# DiscordMail
The Discord to Email client, connecting the past to the future.

![Discord Mail](server/static/img/favicon.png)

- Invite: https://discordapp.com/oauth2/authorize?=&client_id=330003632298917889&scope=bot&permissions=0
- Guild: https://discord.gg/wHgdmf4
- Website: https://discordmail.com/
- GitHub: https://github.com/moustacheminer/discordmail

---

## How?
DiscordMail uses Eris and Mailgun JS to send and recieve emails, and routing emails back and forth from Discord to Mailgun. This means you can send Emails from anywhere to anyone.

## Installation
DiscordMail is a fairly new bot, so these instructions may not be finalised.

0. Have at least `Node.js 8.4.0`, `RethinkDB 2.3.6`, `npm 5.4.1` and `git`
1. `git clone`
2. `npm i`
3. Edit `config/default.json`, using `config/default.rename.json` as a template
4. Create a database in Rethink with tables: `registrations`, `emails` and `i18n`
5. `npm start`

## Translations

Thinking of translating DiscordMail?

Language         | Code   | Progress  | Translator(s)
---------------- | ------ | --------- | --------------------------
English (GB)     | en-gb  | Main      | @lepon01 (7coil#3175)
English (USA)    | en-us  | Done      | @lepon01 (7coil#3175)
French (France)  | fr-fr  | Done      | @iDroid27210 (iDroid#4441), @lepeli (Yvan#5087)
German (Germany) | de     | Announced | TimNook#0323
English (Pirate) | pirate | Announced |
English (Txt Slang) | slang | In-Progress | @iDerp (iDerp#3616)

Translations required:

Description  | Location
------------ | ----------------------
General Text | `locales/{code}.json`
Help Menu    | `promo/info/{code}.md`

Feel free to add your name inside the help menu, and ask for extra translated aliases for commands to better suit the language's audience.
