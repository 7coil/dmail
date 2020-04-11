import htmlToText from 'html-to-text';
import { ParsedMail } from 'mailparser';
import { Connection } from 'mysql';
import { SMTPServerDataStream, SMTPServerSession } from 'smtp-server';
import Account from './Account';

class Mail {
  mailObject: ParsedMail;
  stream: SMTPServerDataStream;
  session: SMTPServerSession;
  callback: (err: Error) => void;
  sqlConnection: Connection
  dateLoaded: Date;

  constructor({
    mail,
    stream,
    session,
    callback,
    sqlConnection,
  }: {
    mail: ParsedMail,
    stream: SMTPServerDataStream,
    session: SMTPServerSession,
    callback: (err: Error) => void,
    sqlConnection: Connection
  }) {
    this.mailObject = mail;
    this.stream = stream;
    this.session = session;
    this.callback = callback;
    this.sqlConnection = sqlConnection;
    this.dateLoaded = new Date();
  }

  /**
   * Check if the email requires conversion from HTML to Plain Text.
   */
  contentRequiresConversion(): boolean {
    if (this.mailObject.text) return false;
    if (this.mailObject.html) return true;
    return false;
  }

  contentRequiresTruncation(): boolean {
    if (this.getContents() === null) return false;
    return this.getContents().length > 2000;
  }

  emailContainsAttachments(): boolean {
    return this.mailObject.attachments.length > 0;
  }

  getRecipient(): Promise<Account> {
    return new Promise((resolve, reject) => {
      const emails = [];

      if (this.mailObject.to) emails.push(...this.mailObject.to.value.map(email => email.address))
      if (this.mailObject.headers.get('x-forwarded-to')) emails.push(this.mailObject.headers.get('x-forwarded-to'))
      if (this.session.envelope.rcptTo.length > 0) emails.push(...this.session.envelope.rcptTo.map(email => email.address))

      Promise.all(emails.map(email => Account.getAccountFromEmail(this.sqlConnection, email)))
        .then((results) => {
          const accounts = results.filter(acc => !!acc);

          resolve(accounts[0] || null)
        })
    })
  }

  /**
   * Get the title of the email
   */
  getTitle(): string {
    return this.mailObject.subject || '_Untitled E-Mail_'
  }

  getAuthor(): string {
    if (!this.mailObject.from) return '_No Author Identified_'
    if (this.mailObject.from.text.length > 256) return this.mailObject.from.text.substring(0, 250) + '...';
    return this.mailObject.from.text
  }

  /**
   * Get the plaintext contents of the file
   */
  getContents(): string {
    if (this.contentRequiresConversion()) {
      if (this.mailObject.html === false) return null
      return htmlToText.fromString(this.mailObject.html)
    } else {
      if (this.mailObject.text.trim().length === 0) return null
      return this.mailObject.text;
    }
  }

  getTruncatedContents(): string {
    if (this.contentRequiresTruncation()) return this.getContents().substring(0, 1995) + '...';
    return this.getContents();
  }

  /**
   * Get the date of when the email was sent (or arrived)
   */
  getDate(): Date {
    return this.mailObject.date || this.dateLoaded;
  }

  getEmbed() {
    const fields = [];

    if (this.contentRequiresConversion()) {
      fields.push({
        name: 'Note',
        value: 'This email has been converted from _HTML_ to _Plain Text_.'
      })
    }

    if (this.contentRequiresTruncation()) {
      fields.push({
        name: 'Note',
        value: 'This email has been truncated to fit under 2000 characters.'
      })
    }

    if (this.emailContainsAttachments()) {
      fields.push({
        name: 'Attachments',
        value: 'This email contains attachments.'
      })
    }

    fields.push({
      name: 'Notice',
      value: 'The content of the email are affiliated with the sender of the email only, and not with this service, or Discord Inc.\nFind out what you can do to stop unwanted content at https://discordmail.com/docs/spam',
    })

    return {
      title: this.getTitle(),
      description: this.getTruncatedContents(),
      timestamp: this.getDate(),
      author: {
        name: this.getAuthor()
      },
      fields,
      footer: {
        text: 'https://discordmail.com/'
      }
    }
  }
}

export default Mail
