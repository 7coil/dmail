const { SMTPServer } = require('smtp-server');
const { simpleParser } = require('mailparser');
const fs = require('fs');
const config = require('config');
const { inspect } = require('util');

const server = new SMTPServer({
	key: fs.readFileSync(config.get('certificate').key),
	cert: fs.readFileSync(config.get('certificate').cert),
	authOptional: true,
	onData(stream, session, callback) {
		simpleParser(stream).then((mail) => {
			console.dir(inspect(mail, {
				showHidden: false,
				depth: null
			}));
			for (let i = 0; i < mail.attachments.length; i += 1) {
				if (mail.attachments[i].size > 8000000) {
					console.log('Attatchments must be less than 8MB in size');
					return callback(new Error('Attatchments must be less than 8MB in size'));
				}
			}
			return callback();
		});
	}
});
server.listen(25);
