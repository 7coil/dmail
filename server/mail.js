const r = require('./db');
const express = require('express');

const router = express.Router();

const registered = (req, res, next) => {
	if (!req.user) {
		res.redirect('/auth');
	} else if (!req.user.dmail) {
		res.status(401).render('error.pug', { status: 401 });
	} else {
		next();
	}
};

router.get('/', registered, async (req, res) => {
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
	.get('/terminate', registered, (req, res) => {
		res.render('terminate.pug');
	})
	.post('/terminate', registered, async (req, res) => {
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
			res.status(500).render('error.pug', { status: 500 });
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
