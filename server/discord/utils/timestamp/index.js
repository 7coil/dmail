module.exports = function timestamp(input) {
	let d = 0;
	let h = 0;
	let m = 0;
	let s = 0;

	m = Math.floor(input / 60);
	s = Math.floor(input % 60);

	h = Math.floor(m / 60);
	m %= 60;

	d = Math.floor(h / 24);
	h %= 24;

	let message = '';
	if (d === 1) {
		message += `${d} day `;
	} else if (d > 1) {
		message += `${d} days `;
	}

	if (h === 1) {
		message += `${h} hour `;
	} else if (h > 1) {
		message += `${h} hours `;
	}

	if (m === 1) {
		message += `${m} minute `;
	} else if (m > 1) {
		message += `${m} minutes `;
	}

	if (s === 1) {
		message += `${s} second `;
	} else if (s > 1) {
		message += `${s} seconds `;
	}

	return message || 'Literally no time whatsoever';
};
