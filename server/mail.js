const { SMTPServer } = require('smtp-server');
const fs = require('fs');
const config = require('config');

const server = new SMTPServer({
	key: fs.readFileSync(config.get('certificate').key),
	cert: fs.readFileSync(config.get('certificate').cert),
	onData(stream, session, callback) {
		stream.pipe(process.stdout);
		stream.on('end', callback);
	}
});
server.listen(465);
