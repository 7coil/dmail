const express = require('express');
const config = require('config');

const router = express.Router();

const isAdmin = (req, res, next) => {
	if (!req.user) {
		req.session.redirect = req.originalUrl;
		res.redirect('/auth');
	} else if (config.get('discord').admins.includes(req.user.id)) {
		next();
	} else {
		res.render('error', {
			status: 400,
			message: 'You are not an administrator for DiscordMail'
		});
	}
};

router.get('/', isAdmin, (req, res) => {
	res.render('admin');
});

module.exports = router;
