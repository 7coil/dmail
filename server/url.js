const express = require('express');
const config = require('config');
const discord = require('./discord');

const router = express.Router();

router.get('/', (req, res) => {
	res.redirect('/');
})
	.use('/invite', (req, res) => {
		res.redirect(`https://discordapp.com/oauth2/authorize?=&client_id=${discord.user.id}&scope=bot&permissions=0`);
	})
	.get('/:page', (req, res, next) => {
		if (config.get('url')[req.params.page]) {
			res.redirect(config.get('url')[req.params.page]);
		} else {
			next();
		}
	});

module.exports = router;
