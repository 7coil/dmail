import fs from 'fs';
import { simpleParser } from "mailparser";
import mysql from 'mysql';
import { SMTPServer } from "smtp-server";
import Mail from "./Mail";

const sqlConnection = mysql.createConnection({
  host: 'database',
  user: 'discordmail',
  password: 'discordmail',
  database: 'discordmail',
  multipleStatements: true
})

sqlConnection.query(`
  CREATE TABLE IF NOT EXISTS accounts (
    id          VARCHAR(512)  PRIMARY KEY,
    type        TINYINT(1)     NOT NULL,
    payload     VARCHAR(512)  NOT NULL
  );
`);

if (fs.existsSync('/run/secrets/startup_sql')) {
  console.log('Running startup SQL query.')
  sqlConnection.query({
    sql: fs.readFileSync('/run/secrets/startup_sql', { encoding: 'UTF-8' })
  });
}

const server = new SMTPServer({
  banner: 'DiscordMail 2.0',
  authOptional: true,
  onData(stream, session, callback) {
    simpleParser(stream)
      .then(mail => new Mail({ mail, stream, session, callback, sqlConnection }))
      .then(async (mail) => {
        const recipient = await mail.getRecipient();
        if (recipient) {
          await recipient.sendMail(mail);
          callback()
        } else {
          const err = new Error('No Such User Here');
          err.responseCode = 550
          callback(err);
        }
        return;
      })
      .catch((error) => {
        const err = error instanceof Error ? error : new Error(error);
        err.responseCode = 552;
        console.log(err);
        callback(err);
      })
  }
});

server.listen(25);
server.on('error', (err) => {
  console.log(err.message);
});
