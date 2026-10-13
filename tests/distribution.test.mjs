import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { JSDOM } from 'jsdom';
import { buildExtension, root } from '../scripts/build.mjs';
import { packageExtension } from '../scripts/package.mjs';
import { buildSite } from '../scripts/build-site.mjs';

const FILES = ['background.js', 'content.js', 'data/health.json', 'data/LICENSE', 'icons/128.png', 'icons/16.png', 'icons/32.png', 'icons/48.png', 'LICENSE', 'manifest.json', 'options.css', 'options.html', 'options.js', 'popup.css', 'popup.html', 'popup.js'];

// Inspect central-directory records, following their offsets into local records.
// Comparing each payload with the source dist catches corruption/truncation as
// well as directory-offset mistakes, without shell-specific unzip dependencies.
function unzipStored(bytes) {
  const end = bytes.length - 22;
  assert.equal(bytes.readUInt32LE(end), 0x06054b50, 'ZIP has a complete end record');
  assert.equal(bytes.readUInt16LE(end + 20), 0, 'no hidden archive comment');
  const count = bytes.readUInt16LE(end + 10);
  let cursor = bytes.readUInt32LE(end + 16);
  assert.equal(cursor + bytes.readUInt32LE(end + 12), end);
  const files = new Map();
  for (let i = 0; i < count; i++) {
    assert.equal(bytes.readUInt32LE(cursor), 0x02014b50);
    assert.equal(bytes.readUInt16LE(cursor + 10), 0, 'stored entry');
    const size = bytes.readUInt32LE(cursor + 24);
    assert.equal(bytes.readUInt32LE(cursor + 20), size);
    const nameSize = bytes.readUInt16LE(cursor + 28);
    const extraSize = bytes.readUInt16LE(cursor + 30);
    const commentSize = bytes.readUInt16LE(cursor + 32);
    const name = bytes.subarray(cursor + 46, cursor + 46 + nameSize).toString();
    assert.ok(!files.has(name), 'unique filenames');
    assert.ok(!name.startsWith('/') && !name.includes('..') && !name.includes('\\'), 'safe paths');
    const local = bytes.readUInt32LE(cursor + 42);
    assert.equal(bytes.readUInt32LE(local), 0x04034b50);
    assert.equal(bytes.readUInt32LE(local + 14), bytes.readUInt32LE(cursor + 16), 'CRC records agree');
    assert.equal(bytes.readUInt32LE(local + 22), size);
    const localNameSize = bytes.readUInt16LE(local + 26);
    assert.equal(bytes.subarray(local + 30, local + 30 + localNameSize).toString(), name);
    const begin = local + 30 + localNameSize + bytes.readUInt16LE(local + 28);
    files.set(name, bytes.subarray(begin, begin + size));
    cursor += 46 + nameSize + extraSize + commentSize;
  }
  assert.equal(cursor, end);
  return files;
}

test('release ZIP is deterministic, complete, version-aligned and restricted to declared assets', async (t) => {
  const temporary = await mkdtemp(path.join(tmpdir(), 'ope-dist-'));
  t.after(() => rm(temporary, { recursive: true, force: true }));
  const dist = await buildExtension(path.join(temporary, 'dist'));
  const result = await packageExtension({ dist, outputDir: path.join(temporary, 'release') });
  const bytes = await readFile(result.zipPath);
  const archive = unzipStored(bytes);
  assert.deepEqual([...archive.keys()].sort(), [...FILES].sort());
  for (const [name, contents] of archive) assert.deepEqual(contents, await readFile(path.join(dist, name)), name);
  const digest = createHash('sha256').update(bytes).digest('hex');
  assert.equal(await readFile(result.checksumPath, 'utf8'), `${digest}  ${path.basename(result.zipPath)}\n`);
  await packageExtension({ dist, outputDir: path.join(temporary, 'release') });
  assert.deepEqual(await readFile(result.zipPath), bytes);
  const manifest = JSON.parse(archive.get('manifest.json'));
  const data = JSON.parse(archive.get('data/health.json'));
  const pkg = JSON.parse(await readFile(path.join(root, 'package.json')));
  assert.equal(manifest.version, pkg.version);
  assert.equal(data.version, pkg.version);
  assert.equal(manifest.manifest_version, 3);
  assert.deepEqual(manifest.permissions, ['activeTab', 'scripting', 'storage']);
  for (const key of ['host_permissions', 'optional_host_permissions', 'content_scripts', 'externally_connectable', 'web_accessible_resources']) assert.equal(manifest[key], undefined, key);
  assert.equal(manifest.content_security_policy.extension_pages, "script-src 'self'; object-src 'none'; connect-src 'self'; base-uri 'none'");
  for (const page of ['popup', 'options']) {
    const document = new JSDOM(archive.get(`${page}.html`).toString()).window.document;
    for (const element of document.querySelectorAll('script[src], link[rel=stylesheet]')) assert.ok(archive.has(element.getAttribute('src') || element.getAttribute('href')));
    assert.equal(document.querySelectorAll('script:not([src])').length, 0, 'extension CSP permits only packaged scripts');
  }
});

test('public demo builds under a repository URL prefix without shipping extension entry points or drafts', async (t) => {
  const temporary = await mkdtemp(path.join(tmpdir(), 'ope-site-'));
  t.after(() => rm(temporary, { recursive: true, force: true }));
  await buildSite(temporary);
  const html = await readFile(path.join(temporary, 'index.html'), 'utf8');
  const document = new JSDOM(html, { url: 'https://example.org/openplainenglish/' }).window.document;
  for (const attribute of ['script[src]', 'link[rel=stylesheet]']) {
    const element = document.querySelector(attribute);
    const url = new URL(element.src || element.href);
    assert.ok(url.pathname.startsWith('/openplainenglish/demo/'));
    await readFile(path.join(temporary, url.pathname.slice('/openplainenglish/'.length)));
  }
  const files = await readdir(temporary, { recursive: true });
  for (const denied of ['manifest.json', 'background.js', 'src/background/main.js', 'src/content/index.js', 'node_modules', '.git', 'release', 'artifacts']) assert.ok(!files.includes(denied), denied);
  for (const file of ['demo/demo.js', 'demo/preview.js']) {
    const source = await readFile(path.join(temporary, file), 'utf8');
    assert.doesNotMatch(source, /(?:from\s*|fetch\(\s*)['"]\//, 'no origin-root module or data requests');
  }
  assert.match(await readFile(path.join(temporary, 'demo/preview.js'), 'utf8'), /Browser preview · Test data only/);
});
