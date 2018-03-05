const { SMTPServer } = require('smtp-server');
const { simpleParser } = require('mailparser');
const nodemailer = require('nodemailer');
const fs = require('fs');
const config = require('config');

const clamav = require('clamav.js');

const transporter = nodemailer.createTransport(config.get('mail.nodemailer'));

transporter.on('error', (err) => {
	console.dir(err);
});

const server = new SMTPServer({
	key: fs.readFileSync(config.get('mail.smtp-server.key')),
	cert: fs.readFileSync(config.get('mail.smtp-server.cert')),
	authOptional: true,
	async onData(stream, session, callback) {
		const mail = await simpleParser(stream);
		let error;
		console.dir(JSON.stringify(mail));
		console.dir(mail);

		// Iterate through attatchments, and validate each one
		for (let i = 0; i < mail.attachments.length; i += 1) {
			// If an attachment is too large, throw it out of the window.
			// Also check for viruses
			if (mail.attachments[i].size > 8000000) {
				error = new Error('Your files are too powerful! Max file size 8.00Mb please.');
				error.responseCode = 552;
				return callback(error);
			}

			clamav.createScanner(config.get('api.clamav.port'), config.get('api.clamav.host'))
		}

		// Success!
		return callback();
	}
});
server.listen(25);

module.exports = transporter;
