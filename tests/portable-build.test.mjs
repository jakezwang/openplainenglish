import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, rm, readdir, writeFile } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { createHash } from 'node:crypto';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { buildSDK } from '../scripts/build-sdk.mjs';
import { buildExtension } from '../scripts/build.mjs';
import { packageSDK } from '../scripts/package-sdk.mjs';

const exec = promisify(execFile);

test('independent SDK runs from its built artifact and ships only code, data and licenses', async (t) => {
  const temporary = await mkdtemp(path.join(tmpdir(), 'ope-sdk-'));
  t.after(() => rm(temporary, { recursive: true, force: true }));
  await buildSDK(temporary);
  const pkg = JSON.parse(await readFile(path.join(temporary, 'package.json')));
  const health = JSON.parse(await readFile(path.join(temporary, 'data/health.json')));
  const pilot = JSON.parse(await readFile(path.join(temporary, 'data/pilots/public-service.json')));
  const { createTextEngine } = await import(pathToFileURL(path.join(temporary, 'index.js')));
  assert.equal(createTextEngine(health.entries).analyze('Hypertension').text, 'High blood pressure');
  assert.equal(createTextEngine(pilot.entries).analyze('at a later date').text, 'later');
  assert.equal(typeof (await import(pathToFileURL(path.join(temporary, 'browser.js')))).createReader, 'function');
  assert.equal(pkg.dependencies, undefined);
  assert.equal(pkg.version, health.version);
  const files = await readdir(temporary, { recursive: true });
  assert.deepEqual(files.filter((file) => /\.(?:js|json)$/u.test(file)).sort(), ['browser.js', 'data/health.json', 'data/pilots/public-service.json', 'index.js', 'package.json']);
});

test('packed SDK installs offline in an empty consumer and resolves documented exports', async (t) => {
  const temporary = await mkdtemp(path.join(tmpdir(), 'ope-sdk-consumer-'));
  t.after(() => rm(temporary, { recursive: true, force: true }));
  const directory = await buildSDK(path.join(temporary, 'build'));
  const packed = await packageSDK({ directory, outputDir: path.join(temporary, 'release') });
  assert.deepEqual(packed.files.sort(), ['LICENSE', 'README.md', 'browser.js', 'data/LICENSE', 'data/health.json', 'data/pilots/public-service.json', 'index.js', 'package.json'].sort());
  const digest = createHash('sha256').update(await readFile(packed.packagePath)).digest('hex');
  assert.equal(await readFile(packed.checksumPath, 'utf8'), `${digest}  ${path.basename(packed.packagePath)}\n`);
  const consumer = path.join(temporary, 'consumer');
  await mkdir(consumer);
  await writeFile(path.join(consumer, 'package.json'), JSON.stringify({ private: true, type: 'module' }));
  await exec('npm', ['install', packed.packagePath, '--offline', '--ignore-scripts', '--no-audit', '--no-fund', '--package-lock=false'], { cwd: consumer });
  const script = `
    import assert from 'node:assert/strict';
    import { createTextEngine } from 'openplainenglish-core';
    import { createReader } from 'openplainenglish-core/browser';
    import health from 'openplainenglish-core/data/health.json' with { type: 'json' };
    import pilot from 'openplainenglish-core/data/pilots/public-service.json' with { type: 'json' };
    assert.equal(typeof createReader, 'function');
    assert.equal(createTextEngine(health.entries).analyze('Hypertension and biopsy are health terms.').text, 'High blood pressure and biopsy are health terms.');
    assert.equal(createTextEngine(pilot.entries).analyze('at a later date').text, 'later');
    assert.equal(health.version, pilot.version);
  `;
  await exec(process.execPath, ['--input-type=module', '--eval', script], { cwd: consumer });
});

test('Firefox draft build uses its own background manifest and preserves least-privilege permissions', async (t) => {
  const temporary = await mkdtemp(path.join(tmpdir(), 'ope-firefox-'));
  t.after(() => rm(temporary, { recursive: true, force: true }));
  await buildExtension(temporary, { browser: 'firefox' });
  const manifest = JSON.parse(await readFile(path.join(temporary, 'manifest.json')));
  assert.deepEqual(manifest.background, { scripts: ['background.js'] });
  assert.equal(manifest.minimum_chrome_version, undefined);
  assert.deepEqual(manifest.permissions, ['activeTab', 'scripting', 'storage']);
  assert.deepEqual(manifest.browser_specific_settings.gecko.data_collection_permissions.required, ['none']);
  assert.equal(manifest.browser_specific_settings.gecko_android, undefined, 'mobile compatibility is not claimed');
  assert.equal(manifest.host_permissions, undefined);
  assert.match(await readFile(path.join(temporary, 'background.js'), 'utf8'), /globalThis.browser \|\| globalThis.chrome/u);
});
