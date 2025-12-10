const http = require('http');
const fs = require('fs');
const path = require('path');

const distDir = path.join(__dirname, 'build');
const port = parseInt(process.env.PORT || '4173', 10);

if (!fs.existsSync(distDir)) {
  console.error('Build output not found at', distDir);
}

const mimeTypes = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.eot': 'application/vnd.ms-fontobject'
};

const fallbackFile = path.join(distDir, 'index.html');

const server = http.createServer((req, res) => {
  const urlPath = decodeURIComponent(req.url.split('?')[0]);
  const filePath = path.join(distDir, urlPath.replace(/\/+$/, '') || '/');
  let resolvedPath = filePath;

  try {
    const stats = fs.statSync(resolvedPath);
    if (stats.isDirectory()) {
      resolvedPath = path.join(resolvedPath, 'index.html');
    }
  } catch (err) {
    resolvedPath = fallbackFile;
  }

  const ext = path.extname(resolvedPath).toLowerCase();
  const contentType = mimeTypes[ext] || 'application/octet-stream';

  fs.readFile(resolvedPath, (readErr, content) => {
    if (readErr) {
      res.writeHead(404);
      res.end('Not Found');
      return;
    }

    res.writeHead(200, { 'Content-Type': contentType });
    res.end(content);
  });
});

server.listen(port, '0.0.0.0', () => {
  console.log(`Server running at http://0.0.0.0:${port}`);
});
