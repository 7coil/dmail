const dblupvote = (positive) => {
	const type = positive ? 'upvote' : 'none';
	$.post('https://discordbots.org/api/vote', { bot: '330003632298917889', type }, (data, status, xhr) => {
		console.log(data);
		console.log(xhr.status);
	}, 'json');
};

document.getElementById('promo').innerHTML = profile.innerHTML;
