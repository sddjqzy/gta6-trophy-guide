// Tiny static server for the trophy guide, for local previews only.
//
//   node serve.ts            serves app/ on http://localhost:8080
//   node serve.ts --port 3000   serves it on port 3000 instead
//
// Node's standard library only. It answers GET and HEAD, sends the right
// content type for the files the app uses, and refuses any path that would
// climb out of app/.

import { createReadStream, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const appDir = resolve(join(fileURLToPath(new URL('.', import.meta.url)), 'app'));

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

function portFromArgs() {
  const args = process.argv.slice(2);
  const flag = args.indexOf('--port');
  if (flag === -1) return 8080;
  const value = Number.parseInt(args[flag + 1] ?? '', 10);
  if (!Number.isInteger(value) || value < 1 || value > 65535) {
    throw new Error('usage: node serve.ts [--port <number>]');
  }
  return value;
}

const port = portFromArgs();

const server = createServer((req, res) => {
  const method = req.method ?? 'GET';
  if (method !== 'GET' && method !== 'HEAD') {
    res.writeHead(405, { 'content-type': 'text/plain; charset=utf-8' });
    res.end('Method not allowed.\n');
    return;
  }

  let path;
  try {
    path = decodeURIComponent(new URL(req.url ?? '/', 'http://localhost').pathname);
  } catch {
    res.writeHead(400, { 'content-type': 'text/plain; charset=utf-8' });
    res.end('Bad request.\n');
    return;
  }
  if (path === '/') path = '/index.html';

  // Join the request path onto app/ and check the result is still inside
  // it: anything with .. that escapes the folder is refused outright.
  const file = resolve(join(appDir, normalize(path).replace(/^(\.\.[/\\])+/, '')));
  if (file !== appDir && !file.startsWith(appDir + sep)) {
    res.writeHead(403, { 'content-type': 'text/plain; charset=utf-8' });
    res.end('Forbidden.\n');
    return;
  }

  let stat;
  try {
    stat = statSync(file);
  } catch {
    res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
    res.end('Not found.\n');
    return;
  }
  if (!stat.isFile()) {
    res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
    res.end('Not found.\n');
    return;
  }

  res.writeHead(200, {
    'content-type': TYPES[extname(file).toLowerCase()] ?? 'application/octet-stream',
    'content-length': stat.size,
    'cache-control': 'no-cache',
  });
  if (method === 'GET') createReadStream(file).pipe(res);
  else res.end();
});

server.listen(port, () => {
  console.log(`GTA VI trophy guide: http://localhost:${port}`);
});
