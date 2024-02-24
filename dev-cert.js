const fs = require('fs');
const devcert = require('devcert');

// or if its just one domain - devcert.certificateFor('local.example.com')
devcert.certificateFor('dev.xstoregames.com')
	.then(({key, cert}) => {
		fs.writeFileSync('./cert/tls.key', key);
		fs.writeFileSync('./cert/tls.cert', cert);
	})
	.catch(console.error);
