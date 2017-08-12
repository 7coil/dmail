const express = require('express');
const config = require('config');

const router = express.Router();

router.get('/', (req, res) => {
	res.redirect('/');
})
	.get('/:page', (req, res, next) => {
		if (config.get('url')[req.params.page]) {
			res.redirect(config.get('url')[req.params.page]);
		} else {
			next();
		}
	});

module.exports = router;
