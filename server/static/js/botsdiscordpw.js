function request(opts, callback) {
	const xhr = new XMLHttpRequest();
	xhr.onreadystatechange = function () {
		if (xhr.readyState !== 4) return;
		if (xhr.status >= 200 && xhr.status < 400) {
			return callback(null, xhr.getResponseHeader('Content-Type') != null && xhr.getResponseHeader('Content-Type').indexOf('application/json') !== -1 ? JSON.parse(xhr.responseText) : xhr.responseText, xhr);
		}
		const msg = xhr.responseText || 'Error';
		callback(Error(msg), null, xhr);
	};
	xhr.open(opts.method || 'GET', opts.url);
	for (const key in opts.headers) {
		xhr.setRequestHeader(key, opts.headers[key]);
	}
	xhr.send(opts.data);
	return xhr;
}

const dmguilds = document.getElementById('dmguilds');
const dmusers = document.getElementById('dmusers');

request({
	url: 'https://discordmail.com/api/stats',
	method: 'GET',
	headers: {
		'Content-Type': 'application/json'
	}
}, (err, res) => {
	if (err) {
		console.log(err);
	} else {
		dmguilds.innerHTML = `${res.guilds} guilds`;
		dmusers.innerHTML = `${res.users} users`;
	}
});
