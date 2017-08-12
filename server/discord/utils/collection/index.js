const r = require('./../../../db');
const client = require('./../../');
const config = require('config');

function guildStats(guild) {
	// Guild stats!
	const bots = guild.members.filter(member => member.user.bot).length;
	const users = guild.memberCount - bots;
	const percentage = Math.floor((bots / guild.memberCount) * 100);
	const timestamp = Date.now();
	const collection = percentage > config.get('discord').collection.percentage && guild.memberCount > config.get('discord').collection.users;

	// Owner!
	const owner = client.users.get(guild.ownerID);

	return {
		guildID: guild.id,
		ownerID: owner.id,
		owner: {
			id: guild.ownerID,
			avatar: owner.dynamicAvatarURL('webp', 2048),
			name: owner.username,
			discriminator: owner.discriminator,
			bot: owner.bot,
			createdAt: owner.createdAt,
		},
		guild: {
			id: guild.id,
			name: guild.name,
			createdAt: guild.createdAt,
			icon: guild.iconURL,
			members: guild.memberCount,
			region: guild.region,
			users,
			bots,
			collection,
		},
		timestamp
	};
}

function banGuild(id, reason) {
	const guild = client.guilds.get(id);
	const stats = guildStats(guild);

	stats.reason = reason;
	r.table('collection')
		.insert(stats)
		.run(r.conn, (err) => {
			if (err) throw new Error('Could not save banned guild.');
			console.log(`Banned ${client.guilds.get(id).name}`);
			guild.leave();
		});
}

function checkGuilds(bot) {
	bot.guilds.filter(guild => guildStats(guild).guild.collection).forEach(guild => banGuild(guild.id, {
		message: 'Bot collection guild',
		maxUsers: config.get('discord').collection.users,
		maxPercentage: config.get('discord').collection.percentage
	}));
}

client.on('guildCreate', (guild) => {
	const report = guildStats(guild);
	console.log(report);

	if (report.guild.collection) {
		console.log(`${guild.name} failed the authentication test`);
		banGuild(guild.id, {
			message: 'Bot collection guild',
			maxUsers: config.get('discord').collection.users,
			maxPercentage: config.get('discord').collection.percentage
		});
	} else {
		r.table('collection')
			.filter(
				r.row('guildID').eq(guild.id).or(r.row('ownerID').eq(guild.ownerID))
			)
			.run(r.conn, (err1, cursor) => {
				if (err1) throw new Error('Failed to search banned guild database.');
				cursor.toArray((err2, result) => {
					if (err2) throw new Error('Failed to convert banned cursor to results.');
					if (result.length < 1) {
						console.log(`${guild.name} passed the authentication test`);
					} else {
						console.log(`${guild.name} was already banned!`);
						banGuild(guild.id, {
							message: 'Already banned',
							refer: result.map(reason => reason.id) || []
						});
					}
				});
			});
	}
});

exports.ban = banGuild;
exports.check = checkGuilds;
