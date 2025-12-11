const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

const { URL } = require('url');

const distDir = path.join(__dirname, 'dist');
const port = parseInt(process.env.PORT || '4173', 10);
const apiProxyTarget = process.env.API_PROXY_TARGET || 'http://localhost:8000';
const apiProxyUrl = new URL(apiProxyTarget);
const apiProxyPaths = ['/api', '/docs', '/openapi.json'];

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
  '.eot': 'application/vnd.ms-fontobject',
};

const fallbackFile = path.join(distDir, 'index.html');

const server = http.createServer((req, res) => {
  const parsedUrl = new URL(req.url, 'http://localhost');
  const urlPath = decodeURIComponent(parsedUrl.pathname);

  const shouldProxy = apiProxyPaths.some(
    (prefix) => urlPath === prefix || urlPath.startsWith(`${prefix}/`),
  );

  if (shouldProxy) {
    const proxyRequest = (apiProxyUrl.protocol === 'https:' ? https : http).request(
      {
        protocol: apiProxyUrl.protocol,
        hostname: apiProxyUrl.hostname,
        port: apiProxyUrl.port || (apiProxyUrl.protocol === 'https:' ? 443 : 80),
        method: req.method,
        path: `${urlPath}${parsedUrl.search}`,
        headers: {
          ...req.headers,
          host: apiProxyUrl.host,
        },
      },
      (proxyRes) => {
        res.writeHead(proxyRes.statusCode || 502, proxyRes.headers);
        proxyRes.pipe(res, { end: true });
      },
    );

    proxyRequest.on('error', (err) => {
      console.error('Proxy error:', err.message);
      res.writeHead(502);
      res.end('Bad Gateway');
    });

    req.pipe(proxyRequest, { end: true });
    return;
  }

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
