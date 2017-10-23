const r = require('./db');
const i18n = require('i18n');
const config = require('config');
const express = require('express');
const request = require('request');
const discord = require('./discord');
const mailgun = require('mailgun-js')(config.get('api').mailgun);
const fs = require('fs');
const path = require('path');

const name = string => string.replace(/ /g, '+').replace(/[^\w\d!#$&'*+\-/=?^_`{|}~\u007F-\uFFFF]+/g, '=').toLowerCase();
const router = express.Router();

const registered = (req, res, next) => {
	if (!req.user.dmail) {
		res.status(403).render('error.pug', {
			status: 403,
			message: 'You are not registered for DiscordMail'
		});
	} else {
		next();
	}
};

const notregistered = (req, res, next) => {
	if (req.user.dmail) {
		res.status(403).render('error.pug', {
			status: 403,
			message: 'You are already registered for DiscordMail'
		});
	} else {
		next();
	}
};

const authed = (req, res, next) => {
	if (!req.user) {
		req.session.redirect = req.originalUrl;
		res.redirect('/auth');
	} else {
		next();
	}
};

const captcha = (req, res, next) => {
	if (!req.body['g-recaptcha-response'] || typeof req.body['g-recaptcha-response'] !== 'string') {
		res.status(400).render('error.pug', {
			status: 400,
			message: 'Invalid reCAPTCHA response'
		});
	} else {
		request({
			url: 'https://google.com/recaptcha/api/siteverify',
			qs: {
				secret: config.get('api').captcha.private,
				response: req.body['g-recaptcha-response'],
				remoteip: req.connection.remoteAddress
			},
			json: true
		}, (error, response, body) => {
			if (body.success) {
				next();
			} else {
				res.status(400).render('error.pug', {
					status: 400,
					message: 'Incorrect reCAPTCHA response'
				});
			}
		});
	}
};

router.get('/', authed, registered, async (req, res) => {
	try {
		const cursor = await r.table('emails')
			.filter({
				dmail: req.user.id
			})
			.orderBy(r.desc('timestamp'))
			.run(r.conn);

		const result = await cursor.toArray();

		res.render('client.pug', {
			emails: result.map((email) => {
				email.datestamp = new Date(email.timestamp * 1000).toUTCString();
				return email;
			})
		});
	} catch (e) {
		res.status(500).render('error.pug', { status: 500 });
	}
})
	.get('/terminate', authed, registered, (req, res) => {
		res.render('terminate.pug');
	})
	.post('/terminate', authed, registered, async (req, res) => {
		try {
			await r.table('registrations')
				.get(req.user.id)
				.delete()
				.run(r.conn);
			await r.table('emails')
				.filter({
					dmail: req.user.id
				})
				.delete()
				.run(r.conn);
			await r.table('i18n')
				.get(req.user.id)
				.delete()
				.run(r.conn);
			res.redirect('/');
		} catch (e) {
			res.status(500).render('error.pug', {
				status: 500,
				message: 'An error occured while deleting your details. Please contact the owner'
			});
		}
	})
	.get('/register', authed, notregistered, (req, res) => {
		res.render('register.pug', {
			captcha: config.get('api').captcha.public
		});
	})
	.post('/register', captcha, authed, notregistered, async (req, res) => {
		if (!req.body.agree) {
			res.status(401).render('error.pug', {
				status: 401,
				message: 'You did not agree to the Terms of Service and Privacy Agreement'
			});
		} else {
			try {
				const dm = await discord.getDMChannel(req.user.id);
				const email = name(`${req.user.username}#${req.user.discriminator}`);
				await dm.createMessage(`${email}@${config.get('api').mailgun.domain}`);
				await r.table('registrations')
					.insert({
						id: req.user.id,
						type: 'user',
						details: {
							name: req.user.username,
							discrim: req.user.discriminator
						},
						display: `${req.user.username}#${req.user.discriminator}`,
						email,
						block: []
					}).run(r.conn);
				const data = {
					from: `${config.get('name')} Mail Server <noreply@${config.get('api').mailgun.domain}>`,
					to: `${email}@${config.get('api').mailgun.domain}`,
					subject: i18n.__('consent_subject', { name: i18n.__('name') }),
					html: fs.readFileSync(path.join('./', 'promo', 'userwelcome.html'), 'utf8'),
					text: fs.readFileSync(path.join('./', 'promo', 'userwelcome.md'), 'utf8')
				};
				await mailgun.messages().send(data);
				res.redirect('/');
			} catch (e) {
				let error = '';
				if (e.resonse && e.response.includes('50007')) {
					error = 'Could not send DM. Check that you have allowed DMs, are in a shared guild, or have not blocked DiscordMail.';
				} else {
					console.dir(e);
				}
				res.status(500).render('error.pug', {
					status: 500,
					message: error || 'An error occured while attempting to register your account.'
				});
				r.table('registrations')
					.get(req.user.id)
					.delete()
					.run(r.conn);
			}
		}
	})
	.get('/:id', async (req, res) => {
		try {
			const result = await r.table('emails')
				.get(req.params.id)
				.run(r.conn);
			if (!result) {
				res.status(404).render('error.pug', { status: 404 });
			} else {
				const date = new Date(result.timestamp * 1000);
				res.render('mail.pug', { email: result, datestamp: date.toUTCString() });
			}
		} catch (e) {
			res.status(500).render('error.pug', { status: 500 });
		}
	})
	.get('/view/:id', async (req, res) => {
		try {
			const result = await r.table('emails')
				.get(req.params.id)
				.run(r.conn);
			if (!result) {
				res.status(404).render('error.pug', { status: 404 });
			} else {
				res.render('mailiframe.pug', { email: result });
			}
		} catch (e) {
			res.status(500).render('error.pug', { status: 500 });
		}
	});

module.exports = router;
