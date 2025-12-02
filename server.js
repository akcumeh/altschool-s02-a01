const http = require('http');
const fs = require('fs');
const path = require('path');

const port = 2010;

const server = http.createServer((req, res) => {
    let filePath = req.url === '/' ? '/index.html' : req.url;

    const fullPath = path.join(__dirname, filePath);

    fs.readFile(fullPath, (e, content) => {
        if (e) {
            res.writeHead(404, { 'content-type': 'text/html' });
            res.end('<h1>404 - Page Not Found</h1>');
        } else {
            res.writeHead(200, { 'content-type': `text/${path.extname(filePath).slice(1)}` });
            res.end(content);
        }
    });
});

server.listen(port, () => {
    console.log(`Server runs on http://localhost:${port}`);
});