const config = require('config');

const isadmin = member =>
	member.permission.has('kickMembers') || member.permission.has('banMembers') || member.permission.has('administrator') || config.get('discord').admins.includes(member.id);

module.exports = isadmin;
