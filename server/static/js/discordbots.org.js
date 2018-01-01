// Your old long description
const description = `
<style>
	#longdesc {
		margin: 0;
	}

	#discordmail {
		z-index: 100;
		width: 100vw;
		border: none;
		overflow: hidden;
		display: flex;
		flex-direction: column;
	}

	h1,h2,h3,h4,h5,h6,div,button,p {
		font-family: "Whitney", "Roboto", sans-serif !important;
	}

	body {
		background-color: #7289DA !important;
	}

	@font-face {
		font-family: "Whitney";
		src: url(https://discordmail.com/font/whitney.woff);
	}

	.profile {
		color: #FFFFFF;
	}

	#shortDESU {
		font-size: 0;
		padding-top: 5px;
	}

	.dmh1,.dmh2,.dmh3,.dmh4,.dmh5,.dmh6 {
		font-weight: 400;
		line-height: 1.1;
	}

	.dmh2 {
		font-size: 3.56rem;
		line-height: 110%;
		margin: 1.78rem 0 1.424rem 0;
	}

	.dmh3 {
		font-size: 2.92rem;
		line-height: 110%;
		margin: 1.46rem 0 1.168rem 0;
	}

	.dmh4 {
		font-size: 2.28rem;
	}

	.dmh5 {
		font-size: 1.64rem;
	}

	.profile .dmp {
		font-size: 12pt;
	}

	.dmcontainer {
		margin: 25px auto;
		max-width: 1280px;
		width: 90%;
	}

	@media only screen and (min-width: 993px) {
		.dmcontainer {
			width: 70%;
		}
	}

	@media only screen and (min-width: 601px) {
		.dmcontainer {
			width: 85%;
		}
	}

	.burple {
		background-color: #7289DA !important;
	}

	.burplef {
		fill: #7289DA;
	}

	.greyple {
		background-color: #99AAB5 !important;
	}

	.greyplef {
		fill: #99AAB5;
	}

	.dgrey {
		background-color: #36393E !important;
	}

	.blacktext {
		color: #000000;
	}

	.dark {
		background-color: #2C2F33 !important;
	}

	.dblack {
		background-color: #23272A !important;
	}

	.bordering {
		height: 25px;
		width: 100vw;
		display: block;
	}

	.dmbutton {
		margin: 10px 0 !important;
	}

	ul {
		padding: 0px;
		list-style-type: none;
	}

	.left {
		text-align: left;
	}
</style>

<div id="discordmail" class="burple">
	<div class="dmcontainer">
		<h2 class="dmh2">The Discord to E-Mail Bot, powered by Mailgun</h2>
		<h5 class="dmh5">DiscordMail links your Discord account to a unique E-Mail address, opening the reach of Discord to be able to communicate to a wider range of of people.</h5>
	</div>
	<svg class="bordering greyple" viewBox="0 0 100 100" preserveAspectRatio="none"><polygon class="burplef" points="0,0 0,100 100,0"></polygon></svg>
	<div class="greyple">
		<div class="dmcontainer blacktext">
			<h4 class="dmh4">Statistics</h4>
			<p id="dmguilds">Loading Guilds</p>
			<p id="dmusers">Loading Users</p>
			<p id="dmregistered">Loading Registrations</p>
		</div>
	</div>
	<svg class="bordering dgrey" viewBox="0 0 100 100" preserveAspectRatio="none"><polygon class="greyplef" points="0,0 0,100 100,0"></polygon></svg>
	<div class="dgrey lastbox">
		<div class="dmcontainer">
			<h3 class="dmh3">Create an account today!</h3>
			<h4 class="dmh4">Invite the bot and type 'dmail register'</h4>
			<button onclick="window.open('https://discordapp.com/oauth2/authorize?client_id=330003632298917889&amp;scope=bot&amp;permissions=0', '_blank')" class="ui labeled icon button dmbutton">
				<i class="mouse pointer icon"></i>
				Invite
			</button>
			<p>By registering with DiscordMail, you fully agree to the contents of the Terms of Service and Privacy Agreement, found in the documentation.</p>
			<p><a href="https://discordmail.com/docs">Documentation</a></p>
			<p><a href="https://discordmail.com/docs/url/github">GitHub</a></p>
		</div>
	</div>
	<div class="dark">
		<div class="dmcontainer left">
			<ul>
				<li><a href="https://discordmail.com/docs/terms">Terms of Service</a></li>
				<li><a href="https://discordmail.com/docs/privacy">Privacy Agreement</a></li>
				<li><a href="https://discordmail.com/url/github" target="_blank">GitHub</a></li>
				<li><a href="https://moustacheminer.com/" target="_blank">Moustacheminer Server Services</a></li>
				<li><a href="https://discordmail.com/lang">Languages / Internationalisation</a></li>
			</ul>
		</div>
	</div>
	<div class="dblack">
		<div class="dmcontainer left">
			<p class="dmp">
				Copyright 2015 - 2018, Moustacheminer Server Services<br>
				Moustacheminer Server Services are not associated with Discord Inc.
			</p>
			<a href="https://ls.terminal.ink/bot/330003632298917889">
				<img src="https://ls.terminal.ink/api/v1/bots/330003632298917889/embed?width=300" alt="ls.terminal.ink">
			</a>
			<a href="https://discordbots.org/bot/330003632298917889">
				<img src="https://discordbots.org/api/widget/330003632298917889.png" alt="discordbots.org" />
			</a>
		</div>
	</div>
</div>
`;

// Things to do after finishing up
const onload = () => {
	const dmguilds = document.getElementById('dmguilds');
	const dmusers = document.getElementById('dmusers');
	const dmregistered = document.getElementById('dmregistered');
	const dblservers = [... document.getElementsByClassName('ui label blue')][0];

	dblrequest({
		url: "https://discordmail.com/api/stats",
		method: "GET",
		headers: {
			"Content-Type": "application/json"
		}
	}, (err, res) => {
		if (err) {
			console.log(err);
		} else {
			dblservers.innerHTML = `${res.guilds} SERVERS`
			dmguilds.innerHTML = `${res.guilds} guilds`;
			dmusers.innerHTML = `${res.users} users`;
			dmregistered.innerHTML = `${res.registered} registered accounts`;
		}
	});
}

const getClass = name => [...document.getElementsByClassName(name)][0];
const load = () => {
	// Remove new stylesheets
	[...document.getElementsByTagName('link')]
		.filter(elem => elem.rel === 'stylesheet')
		.forEach((elem) => {
			elem.parentElement.removeChild(elem);
		});

	// Gather all information required to reconstruct the older page.
	const dbl = {
		desc: description,
		image: getClass('bot-img').firstChild.src,
		header: getClass('bot-name').innerHTML,
		lib: getClass('lib').innerHTML,
		servers: getClass('servers btn btn-orange btn-2x').innerHTML,
		statustext: getClass('status').innerHTML,
		statustype: getClass('status').classList[1],
		shortdesc: getClass('bot-description').innerHTML,
		website: document.getElementById('websitelink') ? document.getElementById('websitelink').href : null,
		invite: document.getElementById('invite') ? document.getElementById('invite').href : null,
		edit: document.getElementById('edit') ? document.getElementById('edit').href : null,
		delete: document.getElementById('delete') ? document.getElementById('delete').href : null,
		report: [...document.getElementsByClassName('btn color-red')].find(elem => elem.innerHTML === 'Report') ? [...document.getElementsByClassName('btn color-red')].find(elem => elem.innerHTML === 'Report').href : null,
		support: document.getElementById('support') ? document.getElementById('support').href : null,
		github: document.getElementById('github') ? document.getElementById('github').href : null,
		points: document.getElementById('points').innerHTML,
		disabled: !document.getElementById('userloggedin') || document.getElementById('upvotebutton').style.display === 'none' || false,
		prefix: document.getElementById('prefix').firstChild.innerHTML,
		upvotescript: document.getElementById('upvotebutton').getAttribute('onclick'),
		owners: [...document.getElementById('createdby').children].map((elem) => ({
			url: elem.firstChild.href,
			img: elem.firstChild.children[0].src,
			name: elem.firstChild.children[1].innerText
		})),
		upvoted: [...document.getElementById('upvotebutton').classList].includes('voted') || false,
		username: document.getElementById('userloggedin') ? document.getElementById('userloggedin').innerHTML : null,
	};

	// Replace the body of the page with a blank DBL page
	[...document.getElementsByTagName('body')][0].innerHTML = `
	<link rel="stylesheet" href="/stylesheets/style.css">
	<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/semantic-ui/2.2.6/semantic.min.css">
	<header id="site-header">
		<div class="site-header-toprow">
			<a class="site-logo" href="/">
				<div class="logotype">
					<img alt="discord bot list logo" src="/images/logotrans.png" data-rjs="3"> 
				</div>
			</a>
			<nav id="site-nav">
				<a href="#" class="menu-icon">
					<svg viewBox="0 0 18 15">
						<path d="M18,1.484c0,0.82-0.665,1.484-1.484,1.484H1.484C0.665,2.969,0,2.304,0,1.484l0,0C0,0.665,0.665,0,1.484,0 h15.031C17.335,0,18,0.665,18,1.484L18,1.484z"></path>
						<path d="M18,7.516C18,8.335,17.335,9,16.516,9H1.484C0.665,9,0,8.335,0,7.516l0,0c0-0.82,0.665-1.484,1.484-1.484 h15.031C17.335,6.031,18,6.696,18,7.516L18,7.516z"></path>
						<path d="M18,13.516C18,14.335,17.335,15,16.516,15H1.484C0.665,15,0,14.335,0,13.516l0,0 c0-0.82,0.665-1.484,1.484-1.484h15.031C17.335,12.031,18,12.696,18,13.516L18,13.516z"></path>
					</svg>
				</a>
				<div class="site-nav-wrapper" id="dblnav">
					<a href="/" id="center">Bot List</a>
					<a href="https://patreon.com/discordbots" id="center">Support on Patreon</a>
					<a href="https://discord.gg/KYZsaFb" id="center">Join DBL Server</a>
					<a href="/api/docs" id="center">API</a>
					<a href="/certification" id="center">Certification</a>
				</div>
			</nav>
		</div>
	</header>
	<div class="profile">
		<img id="dblimage" class="profilebotimage" width="128px" height="128px" style="margin-top:80px;border-radius:50%;">
		<h1 id="dblheader"></h1>
		<div id="dbllib" class="ui label"></div>
		<div id="dblservers" class="ui label blue"></div>
		<div id="dblstatus" class="ui label"></div>
		<p id="shortDESU"></p>
		<div id="dblbuttons"></div>
		<p id="bottprefix"></p>
		<p id="createdby">
			<b id="dblowners"></b>
		</p>
		<p id="longdesc"></p>
		<p></p>
	</div>
	`

	const dblbuttons = document.getElementById('dblbuttons');
	const dblowners = document.getElementById('dblowners');
	const dblnav = document.getElementById('dblnav');
	document.getElementById('longdesc').innerHTML = dbl.desc;
	document.getElementById('dblimage').src = dbl.image;
	document.getElementById('dblheader').innerHTML = dbl.header;
	document.getElementById('dbllib').innerHTML = dbl.lib;
	document.getElementById('dblservers').innerHTML = dbl.servers;
	document.getElementById('dblstatus').innerHTML = dbl.statustext;
	document.getElementById('dblstatus').classList.add(dbl.statustype);
	document.getElementById('shortDESU').innerHTML = dbl.shortdesc;
	
	if (dbl.report) dblbuttons.innerHTML += `<a class="ui google plus button" href="${dbl.report}"><i class="flag outline icon"></i>Report</a>`;
	if (dbl.delete) dblbuttons.innerHTML += `<a class="ui google plus button" href="${dbl.delete}"><i class="archive icon"></i>Delete</a>`;
	if (dbl.edit) dblbuttons.innerHTML += `<a class="ui labeled icon button" href="${dbl.edit}"><i class="write icon"></i>Edit</a>`;
	if (dbl.website) dblbuttons.innerHTML += `<a class="ui labeled icon button" href="${dbl.website}"><i class="mail forward icon"></i>Visit Website</a>`;
	if (dbl.invite) dblbuttons.innerHTML += `<a class="ui labeled icon button" href="${dbl.invite}"><i class="mouse pointer icon"></i>Invite</a>`;
	if (dbl.github) dblbuttons.innerHTML += `<a class="ui labeled icon button" href="${dbl.github}"><i class="github icon"></i>GitHub Repo</a>`;
	if (dbl.support) dblbuttons.innerHTML += `<a class="ui labeled icon button" href="${dbl.support}"><i class="mail forward icon"></i>Join Support Server</a>`;
	dblbuttons.innerHTML += `<div class="ui left labeled button" tabindex="0"><a class="ui basic right pointing label" id="upvotecounterprofile">${dbl.points}</a><button onclick="dbl${dbl.upvotescript}" class="ui button ${dbl.upvoted ? 'positive' : ''}" ${dbl.disabled ? 'disabled' : ''} id="upvotebutton"><i class="angle up icon"></i> Upvote</button></div>`,
	document.getElementById('bottprefix').innerHTML = `Bot Prefix: <b>${dbl.prefix}</b>`;
	if (dbl.owners) dbl.owners.forEach((owner) => {
		dblowners.innerHTML += `<a class="ui label" id="ownerthing" style="padding: 5px;" href="${owner.url}"><img class="ui right spaced avatar image" src="${owner.img}" style="border-radius:250px;">${owner.name}</a>`
	});
	
	if (dbl.username) {
		dblnav.innerHTML += `
		<a href="/logout">Logout</a>
		<a href="/me">${dbl.username}</a>
		<a href="/newbot">Add Bot</a>
		`;
	} else {
		dblnav.innerHTML += '<a href="/login">Login</a>';
	}
	onload();
};

const dblupvote = (id, elem) => {
	const upBtn = document.getElementById('upvotebutton');
	const pointTxt = document.getElementById('upvotecounterprofile');
	const upvote = !upBtn.classList.contains('positive');
	dblrequest({
		url: `${window.location.protocol}//${window.location.hostname}/api/vote`,
		method: 'POST',
		data: JSON.stringify({
			bot: id,
			type: upvote ? 'upvote' : 'none'
		}),
		headers:{
			'Content-Type': 'application/json'
		}
	}, (err, res) => {
		if (err) {
			throw err;
		} else {
			if (upvote) {
				upBtn.classList.add('positive');
			} else {
				upBtn.classList.remove('positive');
			}
			
			pointTxt.innerHTML = res.points;
		}
	});
};

const dblrequest = (opts, callback) => {
	var xhr = new XMLHttpRequest()
	xhr.onreadystatechange = function(){
		if(xhr.readyState != 4) return
		if (xhr.status >= 200 && xhr.status < 400) {
			return callback(null, xhr.getResponseHeader("Content-Type") != null && xhr.getResponseHeader("Content-Type").indexOf("application/json") != -1 ? JSON.parse(xhr.responseText) : xhr.responseText, xhr)
		}
		var msg = xhr.responseText || "Error"
		callback(Error(msg), null, xhr)
	}
	xhr.open(opts.method || "GET", opts.url)
	for (var key in opts.headers) {
		xhr.setRequestHeader(key, opts.headers[key])
	}
	xhr.send(opts.data)
	return xhr
};

document.addEventListener('DOMContentLoaded', load);