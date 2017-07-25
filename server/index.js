require('colors');

console.log('  Welcome to "Moustacheminer Server Services"!  '.inverse.bold);
console.log('Loading modules:');

const config = require('config');
const express = require('express');
const bodyParser = require('body-parser');
const engines = require('consolidate');
const path = require('path');
const mailgun = require('mailgun-js')(config.get('api').mailgun);
const discord = require('./discord/');
const r = require('./db');
const multer = require('multer');
const gist = require('./discord/utils.js').gist;

const upload = multer({
	storage: multer.memoryStorage()
});

const app = express();

const sendError = (email, message) => {
	const name = discord.user.username
		.replace(/ /g, '+')
		.replace(/\W/g, '=')
		.toLowerCase();

	const data = {
		from: `DiscordMail Mail Server <${name}#${discord.user.discriminator}@discordmail.com>`,
		to: email.sender,
		'h:In-Reply-To': email['Message-Id'],
		'h:References': email['Message-Id'],
		subject: `Re: ${email.Subject}`,
		text: message
	};

	mailgun.messages().send(data, (err) => {
		if (err) {
			console.log('Failed to send error message. Giving up.');
		} else {
			console.log('Sent error message to person.');
		}
	});
};

// Middleware
app.use(bodyParser.json())
	.use(bodyParser.urlencoded({
		extended: true
	}))
	.set('views', path.join(__dirname, '/views'))
	.engine('html', engines.mustache)
	.set('view engine', 'html')
	.get('/', (req, res) => {
		res.status(200).render('index.html', { user: req.user, guilds: discord.guilds.size, users: discord.users.size, promo: req.query.promo });
	})
	.post(`/api/${config.get('api').auth}`, upload.single('attachment-1'), (req, res) => {
		const name = discord.user.username
			.replace(/ /g, '+')
			.replace(/\W/g, '=')
			.toLowerCase();

		const body = req.body;
		const to = body.recipient.split('@').shift().toLowerCase().replace(/%23/g, '#');
		console.log(`Recieved mail for ${to}`);

		r.table('registrations')
			.filter({
				email: to
			})
			.run(r.conn, (err1, cursor) => {
				if (to === `${name}#${discord.user.discriminator}`) {
					console.log('Somehow we have engaged in a loop. Ignoring message from "SERVER"');
				} else if (err1) {
					res.status(500).send({ error: { message: 'Failed to search RethonkDB for registered users.' } });
					sendError(body, 'The mail server failed to fetch registered users from the RethonkDB database. Sorry for the inconvenience.');
				} else {
					cursor.toArray((err2, result) => {
						const cont = (channel) => {
							const db = {
								to,
								from: body['Reply-To'] || body.From || body.sender,
								subject: `Re: ${body.Subject}`,
								reply: body['Message-Id'],
								reference: body.References ? `${body.References} ${body['Message-Id']}` : body['Message-Id']
							};

							const dm = (plaintext) => {
								r.table('replies')
									.insert(db)
									.run(r.conn, (err, res1) => {
										if (err) {
											res.status(406).send({ error: { message: 'An error occured while inserting details into the RethonkDB database.' } });
											sendError(body, 'An error occured while inserting details into the RethonkDB database. Sorry for the inconvenience.');
										} else {
											const content = {
												embed: {
													title: body.subject || 'Untitled E-Mail',
													description: plaintext || 'Empty E-Mail',
													timestamp: new Date(body.timestamp * 1000),
													author: {
														name: body.from || 'No Author'
													},
													fields: [
														{
															name: 'Reply ID',
															value: res1.generated_keys[0]
														}
													]
												}
											};

											if (req.file && req.file.buffer.length < 8000000) {
												content.file = req.file;
												channel.createMessage(content, {
													file: req.file.buffer,
													name: req.file.originalname || 'unnamed_file'
												})
													.then(() => {
														res.status(200).send({ success: { message: 'Successfully sent message to user.' } });
													}).catch(() => {
														res.status(406).send({ error: { message: 'Could not send mail to user.' } });
														sendError(body, 'The mail server could not DM the user.');
													});
											} else {
												channel.createMessage(content)
													.then(() => {
														res.status(200).send({ success: { message: 'Successfully sent message to user.' } });
													}).catch(() => {
														res.status(406).send({ error: { message: 'Could not send mail to user.' } });
														sendError(body, 'The mail server could not DM the user.');
													});
											}
										}
									});
							};

							if (body['body-plain'].length > 2000) {
								sendError(body, 'The E-Mail was sent successfully, but DiscordMail recommends less than 2000 characters per message for messages to be displayed correctly within Discord.');
								gist(body['body-plain'], (url) => {
									dm(`[The E-Mail was too long to be displayed in Discord.](${url})`);
								});
							} else {
								dm(body['body-plain']);
							}
						};

						if (err2) {
							res.status(500).send({ error: { message: 'Failed to search RethonkDB for registered users.' } });
							sendError(body, 'The mail server failed to fetch registered users from the RethonkDB database. Sorry for the inconvenience.');
						} else if (!result[0]) {
							res.status(406).send({ error: { message: 'Invalid user - Not found in database.' } });
							sendError(body, 'The email address does not exist.');
						} else if (result[0].block && Array.isArray(result[0].block) && result[0].block.some(email => body.sender.toLowerCase().includes(email))) {
							res.status(406).send({ success: { message: 'Sender is blocked by recipient' } });
							console.log('The E-Mail was blocked by the recipient.');
						} else if (body.subject.length > 128) {
							console.log('The subject was too long');
							res.status(406).send({ error: { message: 'The subject was too long' } });
							sendError(body, 'The subject of your E-Mail was too long to be sent to Discord.');
						} else if (body.from > 128) {
							console.log('The author name was too long');
							res.status(406).send({ error: { message: 'The author name was too long' } });
							sendError(body, 'Your author name was too long to be sent to Discord.');
						} else if (config.get('ban').word.some(word => body['body-plain'].toLowerCase().includes(word))) {
							console.log('The email was detected as spam.');
							res.status(406).send({ error: { message: 'The email was detected as spam.' } });
						} else if (result[0].type === 'user') {
							discord.getDMChannel(result[0].id)
								.then((channel) => {
									cont(channel);
								})
								.catch(() => {
									res.status(406).send({ error: { message: 'Could not send mail to user.' } });
									sendError(body, 'The mail server could not obtain a DM channel to send a DM to the user.');
								});
						} else if (result[0].type === 'guild') {
							cont(discord.guilds.get(result[0].id).channels.get(result[0].details.channel));
						}
					});
				}
			});
	})
	.use('/github', (req, res) => {
		res.redirect(config.get('url').github);
	})
	.use('/invite', (req, res) => {
		res.redirect(`https://discordapp.com/oauth2/authorize?=&client_id=${discord.user.id}&scope=bot&permissions=0`);
	})
	.use('/guild', (req, res) => {
		res.redirect(config.get('url').guild);
	})
	.use('/help', (req, res) => {
		res.redirect(config.get('url').help);
	})
	.use(express.static(`${__dirname}/../client`))
	.use('*', (req, res) => res.status(404).render('error.html', { user: req.user, status: 404 }));

console.log('Listening on', config.get('webserver').port);
app.listen(config.get('webserver').port);
