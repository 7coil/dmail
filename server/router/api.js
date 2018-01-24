const express = require('express');
const r = require('./../db.js');
const multer = require('multer');
const discord = require('./../discord/');

const router = express.Router();

const upload = multer({
	storage: multer.memoryStorage()
});

router.post('/mail', async (req, res) => {
	res.status(404).json({
		error: 'This endpoint no longer exists in DiscordMail v2'
	});
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
