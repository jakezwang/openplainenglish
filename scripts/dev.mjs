import http from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { root } from './build.mjs';

const siteMode = process.argv.includes('--site');
const serveRoot = siteMode ? path.join(root, 'site') : root;
const mount = siteMode ? '/openplainenglish/' : '/demo/';
const mime = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.png': 'image/png', '.svg': 'image/svg+xml' };
const server = http.createServer(async (request, response) => {
  try {
    const requested = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    if (requested === '/' || (siteMode && requested === '/openplainenglish')) { response.writeHead(302, { Location: mount }); response.end(); return; }
    if (siteMode && !requested.startsWith(mount)) { response.writeHead(404); response.end('Not found'); return; }
    const relative = (siteMode ? requested.slice(mount.length) : requested.replace(/^\//, '')) + (requested.endsWith('/') ? 'index.html' : '');
    const filename = path.resolve(serveRoot, relative);
    if (!filename.startsWith(`${serveRoot}${path.sep}`) || (!siteMode && !['demo/', 'src/', 'data/', 'assets/', 'dist/'].some((prefix) => relative.startsWith(prefix))) || relative.split('/').some((part) => part.startsWith('.'))) {
      response.writeHead(403); response.end('Not available'); return;
    }
    const content = await readFile(filename);
    response.writeHead(200, { 'Content-Type': mime[path.extname(filename)] || 'application/octet-stream', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
    response.end(content);
  } catch { response.writeHead(404); response.end('Not found'); }
});
server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') server.listen(0, '127.0.0.1');
  else { console.error(error); process.exitCode = 1; }
});
server.listen(Number(process.env.PORT || 4173), '127.0.0.1', () => console.log(`OpenPlainEnglish demo: http://127.0.0.1:${server.address().port}${mount}\nPress Ctrl+C to stop.`));
process.on('SIGTERM', () => server.close());
process.on('SIGINT', () => server.close());
