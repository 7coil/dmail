const express = require('express');
const config = require('config');
const mailgun = require('mailgun-js')(config.get('api').mailgun);
const r = require('./db.js');
const multer = require('multer');
const discord = require('./discord/');
const fs = require('fs');

const emails = [];

// Register valid commands from "cogs"
fs.readdir('./server/emails/', (err, items) => {
	items.forEach((item) => {
		const file = item.replace(/['"]+/g, '');
		const email = require(`./emails/${file}/`); // eslint-disable-line global-require, import/no-dynamic-require
		email.info.aliases.forEach((name) => {
			if (emails[name]) console.log(`Alias ${name} from ${file} was already assigned to another email! Overwriting...`.red);
			emails[name] = require(`./emails/${file}/`); // eslint-disable-line global-require, import/no-dynamic-require
		});
	});
});

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
		'h:X-Failed-Recipients': email.recipient,
		subject: `Re: ${email.Subject}`,
		text: message
	};

	if (email.from.toLowerCase() === `${name}#${discord.user.discriminator}@${config.get('api').mailgun.domain}`.toLowerCase()) {
		console.log('Detected server is sending error message to itself. Giving up.');
	} else if (email.recipient.toLowerCase() === `${name}#${discord.user.discriminator}@${config.get('api').mailgun.domain}`.toLowerCase()) {
		console.log('Detected recipient is also mail server. Giving up');
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

const services = (req, res, next) => {
	const to = req.body.recipient.split('@').shift().toLowerCase().replace(/%23/g, '#');
	if (emails[to]) {
		console.log((new Date()).toUTCString(), `Recieved special email for ${to}`);
		emails[to].command(req.body);
		res.status(200).json({ success: { message: 'Successfully recieved special email.' } });
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
			})
			.run();

		if (!result[0]) {
			console.log('The E-Mail doesn\'t exist');
			res.status(406).json({ error: { message: 'Invalid user - Not found in database.' } });
			sendError(body, 'The email address does not exist.');
		} else if (config.get('ban').in.some(email => body.sender.toLowerCase().includes(email))) {
			res.status(406).json({ success: { message: `The domain this email was sent from is not allowed to send to DiscordMail. Visit ${config.get('webserver').domain}/docs/blocked` } });
			console.log('The E-Mail was blocked by the owner.');
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
			res.status(406).json({ error: { message: `The email was detected as spam. Visit ${config.get('webserver').domain}/docs/blocked` } });
		} else if (result[0].type === 'user') {
			try {
				res.locals.channel = await discord.getDMChannel(result[0].id);
				res.locals.inbox = result[0].id;
				next();
			} catch (e) {
				console.log('Could not get DM Channel');
				res.status(406).json({ error: { message: 'DiscordMail failed to fetch a DM channel' } });
			}
		} else if (result[0].type === 'guild') {
			const guild = discord.guilds.get(result[0].id);
			if (guild) {
				const channel = guild.channels.get(result[0].details.channel);
				if (channel) {
					res.locals.channel = discord.guilds.get(result[0].id).channels.get(result[0].details.channel);
					res.locals.inbox = result[0].id;
					next();
				} else {
					res.status(406).json({ error: { message: 'Could not send mail to guild.' } });
					sendError(body, 'The guild\'s channel could not be found');
				}
			} else {
				res.status(406).json({ error: { message: 'Could not send mail to guild.' } });
				sendError(body, 'The guild could not be found');
			}
		}
	} catch (e) {
		console.dir(e);
		console.log('Could not fetch RethinkDB');
		res.status(500).json({ error: { message: 'Could not fetch RethinkDB' } });
	}
};

router.post('/mail', upload.single('attachment-1'), validate, services, check, async (req, res) => {
	const body = req.body;
	body.dmail = res.locals.inbox;
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
		console.log((new Date()).toUTCString(), `Failed to send DM to ${res.locals.inbox}`);
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
