const r = require('./db');
const express = require('express');

const router = express.Router();

router.get('/', (req, res) => {
	if (!req.user) {
		res.redirect('/auth');
	} else if (!req.user.dmail) {
		res.status(401).render('error.pug', { status: 401 });
	} else {
		r.table('emails')
			.filter({
				dmail: req.user.id
			})
			.orderBy(r.desc('timestamp'))
			.run(r.conn, (err1, cursor) => {
				if (err1) {
					res.status(500).render('error.pug', { status: 500 });
				} else {
					cursor.toArray((err2, result) => {
						if (err2) {
							res.status(500).render('error.pug', { status: 500 });
						} else {
							res.render('client.pug', {
								emails: result.map((email) => {
									email.datestamp = new Date(email.timestamp * 1000).toUTCString();
									return email;
								})
							});
						}
					});
				}
			});
	}
})
	.get('/terminate', (req, res) => {
		if (!req.user) {
			res.redirect('/auth');
		} else if (!req.user.dmail) {
			res.status(401).render('error.pug', { status: 401 });
		} else {
			res.render('terminate.pug');
		}
	})
	.post('/terminate', (req, res) => {
		if (!req.user) {
			res.redirect('/auth');
		} else if (!req.user.dmail) {
			res.status(401).render('error.pug', { status: 401 });
		} else {
			r.table('registrations')
				.get(req.user.id)
				.delete()
				.run(r.conn);
			r.table('emails')
				.filter({
					dmail: req.user.id
				})
				.delete()
				.run(r.conn);
			r.table('i18n')
				.get(req.user.id)
				.delete()
				.run(r.conn);
			res.redirect('/');
		}
	})
	.get('/:id', (req, res) => {
		r.table('emails')
			.get(req.params.id)
			.run(r.conn, (err, result) => {
				if (err) {
					res.status(500).render('error.pug', { status: 500 });
				} else if (!result) {
					res.status(404).render('error.pug', { status: 404 });
				} else {
					const date = new Date(result.timestamp * 1000);
					res.render('mail.pug', { email: result, datestamp: date.toUTCString() });
				}
			});
	})
	.get('/view/:id', (req, res) => {
		r.table('emails')
			.get(req.params.id)
			.run(r.conn, (err, result) => {
				if (err) {
					res.status(500).render('error.pug', { status: 500 });
				} else if (!result) {
					res.status(404).render('error.pug', { status: 404 });
				} else {
					res.render('mailiframe.pug', { email: result });
				}
			});
	});

module.exports = router;
