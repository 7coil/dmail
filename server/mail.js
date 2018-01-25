const { SMTPServer } = require('smtp-server');
const { simpleParser } = require('mailparser');
const nodemailer = require('nodemailer');
const fs = require('fs');
const config = require('config');
const { inspect } = require('util');

const transporter = nodemailer.createTransport({
	host: 'localhost',
	port: 2525,
	secure: true
});

transporter.on('error', (err) => {
	console.dir(err);
});

const bounce = (mail, error) => {
	transporter.sendMail({
		from: 'noreply@mss.ovh',
		to: mail.from,
		subject: 'Non-Delivery Report',
		text: error,
		headers: {
			'In-Reply-To': mail.headers['Message-Id'],
			References: mail.References
		}
	}, (err, info) => {
		console.dir(info);
		console.dir(err);
	});
};

const server = new SMTPServer({
	key: fs.readFileSync(config.get('certificate').key),
	cert: fs.readFileSync(config.get('certificate').cert),
	authOptional: true,
	onData(stream, session, callback) {
		simpleParser(stream).then((mail) => {
			let error;
			console.dir(inspect(mail, {
				showHidden: false,
				depth: null
			}));
			for (let i = 0; i < mail.attachments.length; i += 1) {
				if (mail.attachments[i].size > 8000000) {
					error = 'Attatchments must be less than 8MB in size';
					console.error(error);
					bounce(mail, error);
					return callback(new Error('Attatchments must be less than 8MB in size'));
				}
			}
			return callback();
		});
	}
});
server.listen(25);

module.exports = transporter;
