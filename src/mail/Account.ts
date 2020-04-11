import FormData from 'form-data';
import { Connection } from 'mysql';
import fetch from 'node-fetch';
import Mail from './Mail';

enum AccountTypes {
  WEBHOOK_ACCOUNT = 0,
  USER_ACCOUNT = 1,
  GUILD_ACCOUNT = 2,
}

class Account {
  id: string
  type: AccountTypes
  payload: string

  constructor({
    id, type, payload
  }: {
    id: string,
    type: AccountTypes,
    payload: string,
  }) {
    this.id = id;
    this.type = type;
    this.payload = payload;
  }

  sendMail(mail: Mail): Promise<any> {
    if (this.type === AccountTypes.WEBHOOK_ACCOUNT) {
      const form = new FormData();
      form.append('payload_json', JSON.stringify({ embeds: [mail.getEmbed()] }));

      return fetch(this.payload, {
        method: 'POST',
        body: form
      })
    }

    if (this.type === AccountTypes.USER_ACCOUNT) {
      return fetch(`http://bot:8080/dm/${this.payload}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          embed: mail.getEmbed()
        })
      })
    }

    if (this.type === AccountTypes.GUILD_ACCOUNT) {
      return fetch(`http://bot:8080/message/${this.payload}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          embed: mail.getEmbed()
        })
      })
    }

    return Promise.resolve();
  }

  static getAccountFromEmail(db: Connection, email: string): Promise<Account> {
    return new Promise((resolve, reject) => {
      const lowercaseEmailString = email.toLowerCase();

      if (!lowercaseEmailString.endsWith('@' + process.env.DOMAIN_NAME)) return resolve(null);
      
      const remainingPart = email.substring(0, email.length - process.env.DOMAIN_NAME.length - 1);

      db.query('SELECT * FROM accounts WHERE id = ?', [remainingPart], (err, results, fields) => {
        if (err) {
          reject(err);
        } else {
          if (results.length === 0) return resolve(null);
          return resolve(new Account(results[0]))
        }
      })
    })
  }
}

export default Account
