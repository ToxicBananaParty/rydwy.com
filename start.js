const { exec } = require('child_process');

exec('docsify serve /opt/bitnami/projects/rydwy', (err, stdout, stderr) => {
	if(error) {
		console.error(`Error: ${error.message}`);
	}

	if(stderr) {
		console.error(`stderr: ${stderr}`);
	}

	console.log(stdout);
});
