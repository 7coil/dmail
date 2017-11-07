const config = require('config');
const { commands } = require('./cogs');
const client = require('./');
const r = require('./../db');
const i18n = require('i18n');

const usrPrefix = config.get('discord').prefix.user;
const guildPrefix = config.get('discord').prefix.guild;
const prefixes = usrPrefix.concat(guildPrefix);

/*
 * Modified Eris Code - https://github.com/abalabahaha/eris
 * Allows me to clean any message content
 */
const clean = (message, content) => {
	let cleanContent = content;

	if (message.mentions) {
		message.mentions.forEach((mention) => {
			if (message.channel.guild) {
				const member = message.channel.guild.members.get(mention.id);
				if (member) {
					cleanContent = cleanContent.replace(new RegExp(`<@!${mention.id}>`, 'g'), `@${member.nick}` || mention.username);
				}
			}
			cleanContent = cleanContent.replace(new RegExp(`<@!?${mention.id}>`, 'g'), `@${mention.username}`);
		});
	}

	if (message.channel.guild && message.roleMentions) {
		message.roleMentions.forEach((roleID) => {
			const role = message.channel.guild.roles.get(roleID);
			const roleName = role ? role.name : 'deleted-role';
			cleanContent = cleanContent.replace(new RegExp(`<@&${roleID}>`, 'g'), `@${roleName}`);
		});
	}

	message.channelMentions.forEach((id) => {
		const channel = client.getChannel(id);
		if (channel && channel.name && channel.mention) {
			cleanContent = cleanContent.replace(channel.mention, `#${channel.name}`);
		}
	});

	return cleanContent.replace(/@everyone/g, '@\u200beveryone').replace(/@here/g, '@\u200bhere');
};

module.exports = async (message, callback) => {
	const mss = {};

	// Set default values
	mss.content = message.content.trim() || '';
	mss.prefix = prefixes.find(prefix => mss.content.toLowerCase().startsWith(prefix)) || '';
	mss.context = null;
	mss.command = '';
	mss.input = '';
	mss.cleanInput = '';
	mss.clean = clean;
	mss.admin = 0;
	mss.inbox = '0';
	mss.dmail = null;
	mss.ratelimit = 0;

	i18n.init(message);

	// If there's a prefix, get rid of the prefix and check for any command
	if (mss.prefix && !message.author.bot) {
		mss.context = usrPrefix.includes(mss.prefix) ? 'user' : 'guild';
		mss.inbox = mss.context === 'user' ? message.author.id : (message.channel.guild && message.channel.guild.id) || '0';
		const noprefix = mss.content.substring(mss.prefix.length).trim();
		mss.command = Object.keys(commands).find(command => noprefix.startsWith(command)) || '';
		if (mss.command) {
			mss.input = noprefix.substring(mss.command.length).trim();
			mss.cleanInput = clean(message, mss.input);

			if (config.get('discord').admins.includes(message.author.id)) {
				mss.admin = 3;
			} else if (message.member && message.member.permission.has('administrator')) {
				mss.admin = 2;
			} else if (message.member && (message.member.permission.has('kickMembers') || message.member.permission.has('banMembers'))) {
				mss.admin = 1;
			}

			mss.dmail = await r.table('registrations')
				.get(mss.inbox)
				.run();

			const ratelimit = await r.table('ratelimit')
				.get(message.author.id)
				.run();

			mss.timeout = (((ratelimit && ratelimit.timeout) || 0) - Date.now()) / 1000;

			const locale = await r.table('i18n')
				.get(message.author.id)
				.run();

			message.setLocale(locale || 'en-gb');
		}
	}

	message.mss = mss;
	callback();
};
