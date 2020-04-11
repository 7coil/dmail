import { Buffer } from 'buffer';

const discordmailhooksLegacyBrailleRegex = /([\u2800-\u28FF]+)(?:.)([\u2800-\u28FF]+)/;

class DiscordMailHooks {
  email: string
  constructor(email: string) {
    this.email = email;
  }

  matches() {
    return discordmailhooksLegacyBrailleRegex.test(this.email);
  }

  toWebhook(): string | undefined {
    if (this.matches()) {
      const [idBraillePart, tokenBraillePart] = discordmailhooksLegacyBrailleRegex.exec(this.email);

      const id = idBraillePart.split('')
        .map(encoded => encoded.codePointAt(0) - 0x2800)
        .reduce((previous: bigint, currentChar: number, index: number, array: number[]): BigInt => {
          previous |= BigInt(currentChar)
          
          if (array.length - 1 !== index) previous = previous << BigInt(8)

          return previous
        }, BigInt(0))
      
      const token = Buffer.from(tokenBraillePart.split('').map(encoded => encoded.codePointAt(0) - 0x2800)).toString('base64').replace(/\+/g, '-').replace(/\//g, '_');

      return `https://discordapp.com/api/webhooks/${id}/${token}`
    } else {
      return;
    }
  }
}

export default DiscordMailHooks
