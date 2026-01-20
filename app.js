const express = require('express');
const path = require('path');

const server = express();

server.get('/', (req, res) => {
	res.sendFile(path.join(__dirname, '/index.html'));
});

server.get('/README.md', (req, res) => {
	res.sendFile(path.join(__dirname, '/README.md'));
});

server.get('/_sidebar.md', (req, res) => {
	res.sendFile(path.join(__dirname, '/_sidebar.md'));
});


server.get('/resume.md', (req, res) => {
	res.sendFile(path.join(__dirname, '/resume.md'));
});

server.get('/portfolio.md', (req, res) => {
	res.sendFile(path.join(__dirname, '/portfolio.md'));
});

server.get('/img/:imgName', (req, res) => {
	console.log("Image Requested: ", req.params.imgName);
	res.sendFile(path.join(__dirname, '/img/', req.params.imgName));
});

server.listen(3000);
console.log("Server listening on port 3000");
