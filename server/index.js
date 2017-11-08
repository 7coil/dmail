console.log('Welcome to Moustacheminer Server Services');

const r = require('./db');
const path = require('path');
const cors = require('cors');
const i18n = require('i18n');
const api = require('./api');
const url = require('./url');
const docs = require('./docs');
const mail = require('./mail');
const lang = require('./lang');
const auth = require('./auth');
const config = require('config');
const express = require('express');
const discord = require('./discord');
const bodyParser = require('body-parser');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const authentication = require('./auth/auth');

const app = express();

i18n.configure({
	directory: path.join(__dirname, '..', 'locales'),
	cookie: 'lang',
	defaultLocale: 'en-gb',
	autoReload: true,
	updateFiles: false
});

// Middleware
app.enable('trust proxy')
	.use(bodyParser.json({
		limit: '20mb'
	}))
	.use(bodyParser.urlencoded({
		extended: true,
		limit: '20mb'
	}))
	.use(cookieParser(config.get('webserver').secret))
	.use(session({
		secret: config.get('webserver').secret,
		resave: true,
		saveUninitialized: true,
		proxy: true
	}))
	.use(i18n.init)
	.set('views', path.join(__dirname, '/dynamic'))
	.set('view engine', 'pug')
	.use(cors())
	.use(authentication.initialize())
	.use(authentication.session())
	.use(async (req, res, next) => {
		res.locals.domain = config.get('api').mailgun.domain;
		if (req.user) {
			const result = (await r.table('registrations')
				.filter({
					location: req.user.id
				}))[0] || null;
			req.user.dmail = result;
			res.locals.user = req.user;
			next();
		} else {
			next();
		}
	})
	.get('/', async (req, res) => {
		const count = await r.table('registrations').count().run();
		res.status(200).render('index.pug', {
			discord,
			count
		});
	})
	.use('/api', api)
	.use('/docs', docs)
	.use('/url', url)
	.use('/mail', mail)
	.use('/lang', lang)
	.use('/auth', auth)
	.use(express.static(path.join(__dirname, '/static')))
	.use('*', (req, res) => res.status(404).render('error.pug', { status: 404 }));

console.log('Listening on', config.get('webserver').port);
app.listen(config.get('webserver').port);

process.on('unhandledRejection', (reason) => {
	console.dir(reason);
});
