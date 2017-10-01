console.log('Welcome to Moustacheminer Server Services');

const config = require('config');
const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const engines = require('consolidate');
const path = require('path');
const request = require('request');
const cors = require('cors');
const i18n = require('i18n');
const discord = require('./discord');
const api = require('./api');
const docs = require('./docs');
const url = require('./url');
const mail = require('./mail');
const lang = require('./lang');
const auth = require('./auth');
const r = require('./db');
const authentication = require('./auth/auth');
const session = require('express-session');

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
	.engine('html', engines.pug)
	.set('view engine', 'html')
	.use(cors())
	.use(authentication.initialize())
	.use(authentication.session())
	.use((req, res, next) => {
		res.locals.domain = config.get('api').mailgun.domain;
		if (req.user) {
			r.table('registrations')
				.get(req.user.id)
				.run(r.conn, (err, result) => {
					if (err) {
						res.status(500).render('error.pug', { status: 500 });
					} else {
						req.user.dmail = result;
						res.locals.user = req.user;
					}
					next();
				});
		} else {
			next();
		}
	})
	.get('/', (req, res) => {
		request({
			method: 'GET',
			url: `https://api:${config.get('api').mailgun.apiKey}@api.mailgun.net/v3/${config.get('api').mailgun.domain}/stats/total?event=accepted&event=delivered&resolution=month`,
			json: true
		}, (err, response, body) => {
			let incoming = null;
			let outgoing = null;

			if (err || response.statusCode !== 200) {
				incoming = 'Error';
				outgoing = 'Error';
			} else {
				incoming = body.stats.reduce((total, time) => total + time.accepted.incoming, 0);
				outgoing = body.stats.reduce((total, time) => total + time.accepted.outgoing, 0);
			}

			res.status(200).render('index.pug', {
				discord,
				incoming,
				outgoing
			});
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
