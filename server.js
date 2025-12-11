const http = require('http');
const fs = require('fs');
const path = require('path');

const server = http.createServer((req, res) => {
  // URL'yi decode et ve query string'i temizle
  const url = req.url === '/' ? '/index.html' : req.url.split('?')[0];
  const decodedUrl = decodeURIComponent(url);
  const filePath = path.join(__dirname, decodedUrl);
  
  const extname = path.extname(filePath);
  const contentType = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8'
  }[extname] || 'text/plain; charset=utf-8';
  
  console.log(`Requested: ${req.url} -> Decoded: ${decodedUrl} -> File: ${filePath}`);
  
  fs.readFile(filePath, (err, content) => {
    if (err) {
      console.error(`File not found: ${filePath}`, err.code);
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('File not found: ' + decodedUrl);
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    }
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log('UTF-8 file names supported');
});