const r = require('./server/db');

const convert = async () => {
	let result = await r.table('registrations');
	result = result.map((element) => {
		element.location = element.id;
		delete element.id;
		if (element.type === 'guild') {
			const channel = element.details.channel;
			const guild = element.location;
			element.location = channel;
			element.details = {
				guild
			};
		}
		return element;
	});
	await r.table('registrations').delete();
	await r.table('registrations').insert(result);
	console.log(result);
};
convert();
