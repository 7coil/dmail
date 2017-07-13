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
	}));

// Views
app.set('views', path.join(__dirname, '/views'))
	.engine('html', engines.mustache)
	.set('view engine', 'html');

// Routes
app.get('/', (req, res) => {
	res.status(200).render('index.html', { user: req.user, guilds: discord.guilds.size, users: discord.users.size });
})
	.post(`/api/${config.get('api').auth}`, upload.single('attachment-1'), (req, res) => {
		const name = discord.user.username
			.replace(/ /g, '+')
			.replace(/\W/g, '=')
			.toLowerCase();

		const body = req.body;
		const to = body.recipient.split('@').shift().toLowerCase().replace(/%23/g, '#');
		console.log(`Recieved mail for ${to}`);

		r.table('users')
			.filter({
				name: to
			})
			.run(r.conn, (err1, cursor) => {
				if (to === `${name}#${discord.user.discriminator}`) {
					console.log('Somehow we have engaged in a loop. Ignoring message from "SERVER"');
				} else if (err1) {
					res.status(500).send({ error: { message: 'Failed to search RethonkDB for registered users.' } });
					sendError(body, 'The mail server failed to fetch registered users from the RethonkDB database. Sorry for the inconvenience.');
				} else {
					cursor.toArray((err2, result) => {
						if (err2) {
							res.status(500).send({ error: { message: 'Failed to search RethonkDB for registered users.' } });
							sendError(body, 'The mail server failed to fetch registered users from the RethonkDB database. Sorry for the inconvenience.');
						} else if (!result[0]) {
							res.status(406).send({ error: { message: 'Invalid user - Not found in database.' } });
							sendError(body, 'The email address does not exist.');
						} else {
							discord.getDMChannel(result[0].id)
								.then((channel) => {
									if (result.block && Array.isArray(result.block) && result.block.includes(body.sender.toLowerCase())) {
										res.status(406).send({ success: { message: 'Sender is blocked by recipient' } });
									} else if (body['body-plain'].length > 2000) {
										res.status(406).send({ error: { message: 'The content was too long' } });
										sendError(body, 'The content of your E-Mail was too long to be sent to Discord.');
									} else if (body.subject.length > 128) {
										res.status(406).send({ error: { message: 'The subject was too long' } });
										sendError(body, 'The subject of your E-Mail was too long to be sent to Discord.');
									} else if (body.from > 128) {
										res.status(406).send({ error: { message: 'The author name was too long' } });
										sendError(body, 'Your author name was too long to be sent to Discord.');
									} else {
										const db = {
											to,
											from: body['Reply-To'] || body.sender,
											subject: `Re: ${body.Subject}`,
											reply: body['Message-Id'],
											reference: body.References ? `${body.References} ${body['Message-Id']}` : body['Message-Id']
										};

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
															description: body['body-plain'] || 'Empty E-Mail',
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
									}
								})
								.catch(() => {
									res.status(406).send({ error: { message: 'Could not send mail to user.' } });
									sendError(body, 'The mail server could not obtain a DM channel to send a DM to the user.');
								});
						}
					});
				}
			});
	})
	.use(express.static(`${__dirname}/../client`))
	.use('*', (req, res) => res.status(404).render('error.html', { user: req.user, status: 404 }));

console.log('Listening on', config.get('webserver').port);
app.listen(config.get('webserver').port);
