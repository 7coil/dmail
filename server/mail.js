const r = require('./db');
const express = require('express');

const router = express.Router();

router.get('/', (req, res) => {
	res.redirect('/');
})
	.get('/:id', (req, res) => {
		r.table('replies')
			.get(req.params.id)
			.run(r.conn, (err, result) => {
				if (err) {
					res.status(500).render('error.html', { status: 500 });
				} else if (!result) {
					res.status(404).render('error.html', { status: 404 });
				} else {
					res.render('mail.html', { email: result });
				}
			});
	});

module.exports = router;
