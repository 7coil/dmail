const express = require('express');
const config = require('config');
const mailgun = require('mailgun-js')(config.get('api').mailgun);
const r = require('./db.js');
const multer = require('multer');
const discord = require('./discord/');

const router = express.Router();

const upload = multer({
	storage: multer.memoryStorage()
});

const sendError = (email, message) => {
	const name = discord.user.username
		.replace(/ /g, '+')
		.replace(/\W/g, '=')
		.toLowerCase();

	const data = {
		from: `${config.get('name')} Mail Server <${name}#${discord.user.discriminator}@${config.get('api').mailgun.domain}>`,
		to: email.From,
		'h:In-Reply-To': email['Message-Id'],
		'h:References': email['Message-Id'],
		subject: `Re: ${email.Subject}`,
		text: message
	};

	if ((email.from || email.sender.toLowerCase()) === `${name}#${discord.user.discriminator}@${config.get('api').mailgun.domain}`.toLowerCase()) {
		console.log('Detected server is sending error message to itself. Giving up.');
	} else {
		mailgun.messages().send(data, (err) => {
			if (err) {
				console.log('Failed to send error message. Giving up.');
			} else {
				console.log(message, 'Sent error message to person.');
			}
		});
	}
};

const validate = (req, res, next) => {
	if (!mailgun.validateWebhook(req.body.timestamp, req.body.token, req.body.signature)) {
		console.log('Request not from Mailgun recieved.');
		res.status(400).json({ error: { message: 'Invalid signature. Are you even Mailgun?' } });
	} else {
		next();
	}
};

const check = (req, res, next) => {
	const body = req.body;
	const to = body.recipient.split('@').shift().toLowerCase().replace(/%23/g, '#');
	console.log((new Date()).toUTCString(), `Recieved mail for ${to}`);

	r.table('registrations')
		.filter({
			email: to
		})
		.run(r.conn, (err1, cursor) => {
			if (err1) {
				res.status(500).json({ error: { message: 'Failed to search RethonkDB for registered users.' } });
				sendError(body, 'The mail server failed to fetch registered users from the RethonkDB database. Sorry for the inconvenience.');
			} else {
				cursor.toArray((err2, result) => {
					if (err2) {
						res.status(500).json({ error: { message: 'Failed to search RethonkDB for registered users.' } });
						sendError(body, 'The mail server failed to fetch registered users from the RethonkDB database. Sorry for the inconvenience.');
					} else if (!result[0]) {
						res.status(406).json({ error: { message: 'Invalid user - Not found in database.' } });
						sendError(body, 'The email address does not exist.');
					} else if (result[0].block && Array.isArray(result[0].block) && result[0].block.some(email => body.sender.toLowerCase().includes(email))) {
						res.status(406).json({ success: { message: 'Sender is blocked by recipient' } });
						console.log('The E-Mail was blocked by the recipient.');
					} else if (body.subject.length > 128) {
						console.log('The subject was too long');
						res.status(406).json({ error: { message: 'The subject was too long' } });
						sendError(body, 'The subject of your E-Mail was too long to be sent to Discord.');
					} else if (body.from > 128) {
						console.log('The author name was too long');
						res.status(406).json({ error: { message: 'The author name was too long' } });
						sendError(body, 'Your author name was too long to be sent to Discord.');
					} else if (config.get('ban').word.some(word => body['body-plain'].toLowerCase().includes(word))) {
						console.log('The email was detected as spam.');
						res.status(406).json({ error: { message: 'The email was detected as spam.' } });
					} else if (result[0].type === 'user') {
						discord.getDMChannel(result[0].id)
							.then((channel) => {
								res.locals.inbox = result[0].id;
								res.locals.channel = channel;
								next();
							})
							.catch(() => {
								res.status(406).json({ error: { message: 'Could not send mail to user.' } });
								sendError(body, 'The mail server could not obtain a DM channel to send a DM to the user.');
							});
					} else if (result[0].type === 'guild') {
						const guild = discord.guilds.get(result[0].id);
						if (guild) {
							const channel = guild.channels.get(result[0].details.channel);
							if (channel) {
								res.locals.inbox = result[0].id;
								res.locals.channel = discord.guilds.get(result[0].id).channels.get(result[0].details.channel);
								next();
							} else {
								res.status(406).json({ error: { message: 'Could not send mail to guild.' } });
								sendError(body, 'The guild\'s channel could not be found');
							}
						} else {
							res.status(406).json({ error: { message: 'Could not send mail to guild.' } });
							sendError(body, 'The guild\'s could not be found');
						}
					}
				});
			}
		});
};

router.post('/mail', upload.single('attachment-1'), validate, check, (req, res) => {
	const body = req.body;
	body.dmail = res.locals.inbox;
	r.table('emails')
		.insert(req.body)
		.run(r.conn, (err, res1) => {
			if (err) {
				res.status(406).json({ error: { message: 'An error occured while inserting details into the RethonkDB database.' } });
				sendError(body, 'An error occured while inserting details into the RethonkDB database. Sorry for the inconvenience.');
			} else {
				const content = {
					content: res1.generated_keys[0],
					embed: {
						title: body.subject || 'Untitled E-Mail',
						description: body['body-plain'].length > 2000 ? `Too long to display. View full E-Mail at ${config.get('webserver').domain}/mail/${res1.generated_keys[0]}` : body['body-plain'] || 'Empty E-Mail',
						timestamp: new Date(body.timestamp * 1000),
						url: `${config.get('webserver').domain}/mail/${res1.generated_keys[0]}`,
						author: {
							name: body.from || 'No Author'
						},
						fields: [
							{
								name: 'E-Mail ID',
								value: res1.generated_keys[0]
							}
						]
					}
				};

				const success = () => {
					res.status(200).json({ success: { message: 'Successfully sent message to user or guild.' } });
				};

				const failure = () => {
					res.status(406).json({ error: { message: 'Could not send mail to user or guild.' } });
					sendError(body, 'The mail server could not DM the user or guild.');
				};

				if (req.file && req.file.buffer.length < 8000000) {
					content.file = req.file;
					const file = {
						file: req.file.buffer,
						name: req.file.originalname || 'unnamed_file'
					};
					res.locals.channel.createMessage(content, file).then(success).catch(failure);
				} else {
					res.locals.channel.createMessage(content).then(success).catch(failure);
				}
			}
		});
})
	.get('/stats', (req, res) => {
		res.status(200).json({ guilds: discord.guilds.size, users: discord.users.size });
	})
	.get('/collection', (req, res) => {
		r.table('collection')
			.run(r.conn, (err1, cursor) => {
				if (err1) {
					res.status(500).json(err1);
				} else {
					cursor.toArray((err2, result) => {
						if (err2) {
							res.status(500).json(err2);
						} else {
							res.status(200).json(result);
						}
					});
				}
			});
	});

module.exports = router;
