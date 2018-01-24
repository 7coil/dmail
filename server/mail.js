const SMTPServer = require('smtp-server');
const fs = require('fs');

const server = new SMTPServer({
	secure: true,
	key: fs.readFileSync('private.key'),
	cert: fs.readFileSync('server.crt')
});
server.listen(465);
