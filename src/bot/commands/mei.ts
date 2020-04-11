import Eris from 'eris';
import HaSeul from 'haseul';
import fetch from 'node-fetch';

const meiCommand = new HaSeul<Eris.Message>();

const select = data => data[Math.floor(Math.random() * data.length)];
const wholesomeYuriSubreddit = 'https://www.reddit.com/r/wholesomeyuri/.json';
let lastAccessed = 0;
let cachedData = null;

const updateWholesomeYuriCache = () => new Promise((resolve, reject) => {
  fetch(wholesomeYuriSubreddit, {})
    .then(res => res.json())
    .then((body) => {
      console.log('Updating Mei Reddit Data');
      if (body.kind === 'Listing') {
        // Get posts that are kind "t3" and not nsfw
        const posts = body.data.children
          .filter(post => post.kind === 't3')
          .filter(post => post.data.over_18 === false);

        // Limit bot to request every 30 minutes
        lastAccessed = Date.now() + (1000 * 60 * 30);
        resolve(posts);
      } else {
        reject();
      }
    });
});

meiCommand
  .command(async ({ message, next }) => {
    if (lastAccessed < Date.now()) {
      try {
        cachedData = await updateWholesomeYuriCache();
        next();
      } catch(e) {
        message.channel.createMessage('An error occured while trying to access /r/wholesomeyuri')
      }
    } else {
      next();
    }
  }, ({ message }) => {
    if (Array.isArray(cachedData) && cachedData.length > 0) {
      message.channel.createMessage(select(cachedData).data.url);
    } else {
      message.channel.createMessage('/r/wholesomeyuri does not seem to have any mei.')
    }
  })

export default meiCommand;
