import { createServer } from 'node:http';
import { readFileSync, statSync } from 'node:fs';
import { join, extname, resolve, normalize } from 'node:path';

const args = process.argv.slice(2);
let port = 8080;
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--port' && args[i + 1]) {
    port = parseInt(args[i + 1]!, 10) || 8080;
  }
}

const root = resolve('./game');

const MIME_TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

const server = createServer((req, res) => {
  try {
    const urlPath = req.url?.split('?')[0] || '/';
    let safePath = normalize(urlPath).replace(/^(\.\.[\/\\])+/, '');
    if (safePath === '/' || safePath === '') {
      safePath = '/index.html';
    }
    const filePath = join(root, safePath);
    const resolvedPath = resolve(filePath);

    if (!resolvedPath.startsWith(root)) {
      res.writeHead(403, { 'Content-Type': 'text/plain' });
      res.end('Forbidden');
      return;
    }

    const stats = statSync(resolvedPath);
    if (!stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not Found');
      return;
    }

    const ext = extname(resolvedPath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    const data = readFileSync(resolvedPath);

    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
  }
});

server.listen(port, () => {
  console.log(`Panjat Pinang server running at http://localhost:${port}/`);
});
