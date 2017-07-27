require('colors');

console.log('  Welcome to "Moustacheminer Server Services"!  '.inverse.bold);
console.log('Loading modules:');

const config = require('config');
const express = require('express');
const bodyParser = require('body-parser');
const engines = require('consolidate');
const path = require('path');
const cors = require('cors');
const discord = require('./discord/');
const apiRouter = require('./api');

const app = express();

// Middleware
app.use(bodyParser.json({
	limit: '20mb'
}))
	.use(bodyParser.urlencoded({
		extended: true,
		limit: '20mb'
	}))
	.set('views', path.join(__dirname, '/views'))
	.engine('html', engines.mustache)
	.set('view engine', 'html')
	.use(cors())
	.get('/', (req, res) => {
		res.status(200).render('index.html', {
			guilds: discord.guilds.size,
			users: discord.users.size,
			domain: config.get('api').mailgun.domain
		});
	})
	.use('/github', (req, res) => {
		res.redirect(config.get('url').github);
	})
	.use('/invite', (req, res) => {
		res.redirect(`https://discordapp.com/oauth2/authorize?=&client_id=${discord.user.id}&scope=bot&permissions=0`);
	})
	.use('/guild', (req, res) => {
		res.redirect(config.get('url').guild);
	})
	.use('/help', (req, res) => {
		res.redirect(config.get('url').help);
	})
	.use('/api', apiRouter)
	.use(express.static(`${__dirname}/../client`))
	.use('*', (req, res) => res.status(404).render('error.html', { status: 404, domain: config.get('api').mailgun.domain }));

console.log('Listening on', config.get('webserver').port);
app.listen(config.get('webserver').port);
