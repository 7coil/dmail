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
			message: res.__('err_not_registered')
		});
	} else {
		next();
	}
};

const notregistered = (req, res, next) => {
	if (req.user.dmail) {
		res.status(403).render('error.pug', {
			status: 403,
			message: res.__('err_registered')
		});
	} else if (!req.user.email) {
		res.status(403).render('error.pug', {
			status: 403,
			message: res.__('err_no_email')
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
			message: res.__('err_recaptcha')
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
					message: res.__('err_recaptcha')
				});
			}
		});
	}
};

router.get('/', authed, registered, async (req, res) => {
	try {
		const account = (await r.table('registrations')
			.filter({
				location: req.user.id
			}))[0] || null;

		const result = await r.table('emails')
			.filter({
				dmail: account.id
			})
			.orderBy(r.desc('timestamp'));

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
			const email = (await r.table('registrations')
				.filter({
					location: req.user.id
				}))[0] || null;
			await r.table('registrations')
				.get(email.id)
				.delete();
			await r.table('emails')
				.get(email.id)
				.delete();
			await r.table('i18n')
				.get(email.id)
				.delete();
			res.redirect('/');
		} catch (e) {
			res.status(500).render('error.pug', {
				status: 500,
				message: res.__('err_delete')
			});
		}
	})
	// .get('/register', authed, notregistered, (req, res) => {
	// 	res.render('register.pug', {
	// 		captcha: config.get('api').captcha.public
	// 	});
	// })
	// .post('/register', captcha, authed, notregistered, async (req, res) => {
	// 	if (!req.body.agree) {
	// 		res.status(401).render('error.pug', {
	// 			status: 401,
	// 			message: res.__('err_no_agree')
	// 		});
	// 	} else {
	// 		try {
	// 			const dm = await discord.getDMChannel(req.user.id);
	// 			const email = name(`${req.user.username}#${req.user.discriminator}`);
	// 			await dm.createMessage(`${email}@${config.get('api').mailgun.domain}`);
	// 			await r.table('registrations')
	// 				.insert({
	// 					location: req.user.id,
	// 					type: 'user',
	// 					details: {
	// 						name: req.user.username,
	// 						discrim: req.user.discriminator,
	// 						email: req.user.email,
	// 						mfa_enabled: req.user.mfa_enabled
	// 					},
	// 					display: `${req.user.username}#${req.user.discriminator}`,
	// 					email,
	// 					block: []
	// 				});
	// 			const data = {
	// 				from: `${config.get('name')} Mail Server <noreply@${config.get('api').mailgun.domain}>`,
	// 				to: `${email}@${config.get('api').mailgun.domain}`,
	// 				subject: i18n.__('register_subject', { name: i18n.__('name') }),
	// 				html: fs.readFileSync(path.join('./', 'promo', 'userwelcome.html'), 'utf8'),
	// 				text: fs.readFileSync(path.join('./', 'promo', 'userwelcome.md'), 'utf8')
	// 			};
	// 			await mailgun.messages().send(data);
	// 			res.redirect('/');
	// 		} catch (e) {
	// 			let error = '';
	// 			if (e.resonse && e.response.includes('50007')) {
	// 				error = res.__('err_dm');
	// 			} else {
	// 				console.dir(e);
	// 			}
	// 			res.status(500).render('error.pug', {
	// 				status: 500,
	// 				message: error || res.__('err_generic')
	// 			});
	// 			r.table('registrations')
	// 				.get(req.user.id)
	// 				.delete()
	// 				.run();
	// 		}
	// 	}
	// })
	.get('/:id', async (req, res) => {
		try {
			const result = await r.table('emails')
				.get(req.params.id)
				.run();
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
				.run();
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
