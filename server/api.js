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

const validate = (req, res, next) => {
	if (!mailgun.validateWebhook(req.body.timestamp, req.body.token, req.body.signature)) {
		console.log('Request not from Mailgun recieved.');
		res.status(400).json({ error: { message: 'Invalid signature. Are you even Mailgun?' } });
	} else {
		next();
	}
};

const check = async (req, res, next) => {
	const body = req.body;
	const to = body.recipient.split('@').shift().toLowerCase().replace(/%23/g, '#');
	console.log((new Date()).toUTCString(), `Recieved mail for ${to}`);

	try {
		const result = await r.table('registrations')
			.filter({
				email: to
			});
		res.locals.dmail = result[0];

		if (!result[0]) {
			console.log('The E-Mail doesn\'t exist');
			res.status(406).json({ error: { message: 'Invalid user - Not found in database.' } });
		} else if (config.get('ban').in.some(email => body.sender.toLowerCase().includes(email))) {
			res.status(406).json({ success: { message: `The domain this email was sent from is not allowed to send to DiscordMail. Visit ${config.get('webserver').domain}/docs/blocked` } });
			console.log('The E-Mail was blocked by the owner.');
		} else if (result[0].block && Array.isArray(result[0].block) && result[0].block.some(email => body.sender.toLowerCase().includes(email))) {
			res.status(406).json({ success: { message: 'Sender is blocked by recipient' } });
			console.log('The E-Mail was blocked by the recipient.');
		} else if (body.subject.length > 128) {
			console.log('The subject was too long');
			res.status(406).json({ error: { message: 'The subject was too long' } });
		} else if (body.from > 128) {
			console.log('The author name was too long');
			res.status(406).json({ error: { message: 'The author name was too long' } });
		} else if (config.get('ban').word.some(word => body['body-plain'].toLowerCase().includes(word))) {
			console.log('The email was detected as spam.');
			res.status(406).json({ error: { message: `The email was detected as spam. Visit ${config.get('webserver').domain}/docs/blocked` } });
		} else if (result[0].type === 'user') {
			try {
				console.log(result[0].location);
				const channel = await discord.getDMChannel(result[0].location);
				res.locals.channel = channel.id;
				next();
			} catch (e) {
				console.log('Could not get DM Channel');
				res.status(406).json({ error: { message: 'DiscordMail failed to fetch a DM channel' } });
			}
		} else if (result[0].type === 'guild') {
			res.locals.channel = result[0].location;
			next();
		}
	} catch (e) {
		console.dir(e);
		console.log('Could not fetch RethinkDB');
		res.status(500).json({ error: { message: 'Could not fetch RethinkDB' } });
	}
};

router.post('/mail', upload.single('attachment-1'), validate, check, async (req, res) => {
	const body = req.body;
	body.dmail = res.locals.dmail.id;
	const info = await r.table('emails')
		.insert(req.body)
		.run();
	const content = {
		content: info.generated_keys[0],
		embed: {
			title: body.subject || 'Untitled E-Mail',
			description: body['body-plain'].length > 2000 ? `Too long to display. View full E-Mail at ${config.get('webserver').domain}/mail/${info.generated_keys[0]}` : body['body-plain'] || 'Empty E-Mail',
			timestamp: new Date(body.timestamp * 1000),
			url: `${config.get('webserver').domain}/mail/${info.generated_keys[0]}`,
			author: {
				name: body.from || 'No Author'
			},
			fields: [
				{
					name: 'E-Mail ID',
					value: info.generated_keys[0]
				}
			]
		}
	};

	const success = () => {
		res.status(200).json({ success: { message: 'Successfully sent message to user or guild.' } });
	};

	const failure = () => {
		console.log((new Date()).toUTCString(), `Failed to send DM to ${res.locals.dmail.location}`);
		res.status(406).json({ error: { message: 'Could not send mail to user or guild.' } });
	};

	if (req.file && req.file.buffer.length < 8000000) {
		const file = {
			file: req.file.buffer,
			name: req.file.originalname || 'unnamed_file'
		};
		discord.createMessage(res.locals.channel, content, file).then(success).catch(failure);
	} else {
		discord.createMessage(res.locals.channel, content).then(success).catch(failure);
	}
})
	.get('/stats', async (req, res) => {
		const count = await r.table('registrations')
			.count()
			.run();
		res.status(200).json({ guilds: discord.guilds.size, users: discord.users.size, registered: count });
	})
	.get('/', (req, res) => {
		res.redirect('/docs/api');
	});

module.exports = router;
