const name = user => `${user.username.replace(/ /g, '+').replace(/\W/g, '=').toLowerCase()}#${user.discriminator}`;

module.exports = name;
