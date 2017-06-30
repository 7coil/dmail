const config = require('config');

function isadmin(member) {
	return member.permission.has('kickMembers') || member.permission.has('banMembers') || member.permission.has('administrator') || config.get('admins').includes(member.id);
}

module.exports = isadmin;
