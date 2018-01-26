const { SMTPServer } = require('smtp-server');
const { simpleParser } = require('mailparser');
const nodemailer = require('nodemailer');
const fs = require('fs');
const config = require('config');
const { inspect } = require('util');

const transporter = nodemailer.createTransport(config.get('mail.nodemailer'));

transporter.on('error', (err) => {
	console.dir(err);
});

// const bounce = (mail, error) => {
// 	if (mail.from && mail.from.value[0]) {
// 		// References string, to reply to the original E-Mail
// 		let references;

// 		// Reply subject
// 		let subject = 'Non-Delivery Report';

// 		if (typeof mail.references === 'object' && Array.isArray(mail.references) && mail.references.length === 0) {
// 			references = [mail.headers['Message-Id'], ...mail.references].join(' ');
// 		} else {
// 			references = mail.headers['Message-Id'];
// 		}

// 		if (mail.subject) {
// 			subject += ' for: ';
// 			subject += mail.subject;
// 		}

// 		transporter.sendMail({
// 			from: 'noreply@mss.ovh',
// 			to: mail.from.value[0].address,
// 			subject,
// 			text: error,
// 			headers: {
// 				'In-Reply-To': mail.headers['Message-Id'],
// 				References: references
// 			}
// 		}, (err, info) => {
// 			console.dir(info);
// 			console.dir(err);
// 		});
// 	}
// };

const server = new SMTPServer({
	key: fs.readFileSync(config.get('mail.smtp-server.key')),
	cert: fs.readFileSync(config.get('mail.smtp-server.cert')),
	authOptional: true,
	onData(stream, session, callback) {
		simpleParser(stream).then((mail) => {
			let error;
			console.dir(inspect(mail, {
				showHidden: false,
				depth: null
			}));

			// Iterate through attatchments
			for (let i = 0; i < mail.attachments.length; i += 1) {
				// If an attachment is too large, throw it out of the window.
				if (mail.attachments[i].size > 8000000) {
					error = new Error('Your files are too powerful! Max file size 8.00Mb please.');
					error.responseCode = 552;
					return callback(error);
				}
			}
			return callback();
		});
	}
});
server.listen(25);

module.exports = transporter;
