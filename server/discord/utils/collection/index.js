const r = require('./../../../db');
const client = require('./../../');

function guildStats(guild) {
	const name = guild.name;
	const id = guild.id;
	const bots = guild.members.filter(member => member.user.bot).length;
	const total = guild.members.size;
	const users = total - bots;
	const percentage = Math.floor((bots / total) * 100);
	const fail = percentage > 50 && total > 20;
	const pass = !fail;

	return { name, id, users, bots, total, percentage, pass, fail };
}

function banGuild(id) {
	client.guilds.get(id).leave();
	r.table('collection')
		.insert({
			guild: id
		})
		.run(r.conn, (err) => {
			if (err) throw new Error('Couldn\'t save banned guild.');
			console.log(`Banned ${client.guilds.get(id).name}`);
		});
}

function checkGuilds(bot) {
	bot.guilds.filter(guild => guildStats(guild).fail).forEach(guild => banGuild(guild.id));
}

client.on('guildCreate', (guild) => {
	const report = guildStats(guild);
	console.log(report);

	if (report.fail) {
		console.log(`${guild.name} failed the authentication test`);
		banGuild(guild.id);
	} else {
		r.table('collection')
			.filter({ guild: guild.id })
			.run(r.conn, (err1, cursor) => {
				if (err1) throw new Error('Failed to search banned guild database.');
				cursor.toArray((err2, result) => {
					if (err2) throw new Error('Failed to convert banned cursor to results.');
					if (result.length === 0) {
						console.log(`${guild.name} passed the authentication test`);
					} else {
						console.log(`${guild.name} was already banned!`);
						guild.leave();
					}
				});
			});
	}
});

exports.ban = banGuild;
exports.check = checkGuilds;
