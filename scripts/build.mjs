import { build } from 'esbuild';
import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { assertValidLexicon } from './validate-lexicon.mjs';

export const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export async function buildExtension(dist = path.join(root, 'dist'), { browser = 'chromium' } = {}) {
  if (!['chromium', 'firefox'].includes(browser)) throw new TypeError('Choose chromium or firefox.');
  const pkg = JSON.parse(await readFile(path.join(root, 'package.json'), 'utf8'));
  const manifest = JSON.parse(await readFile(path.join(root, 'manifest.json'), 'utf8'));
  const lexicon = assertValidLexicon(JSON.parse(await readFile(path.join(root, 'data/health.json'), 'utf8')));
  if (manifest.version !== pkg.version) throw new Error('Manifest and package version must match.');
  if (lexicon.version !== pkg.version) throw new Error('Lexicon and package version must match.');
  await rm(dist, { recursive: true, force: true });
  await mkdir(dist, { recursive: true });
  await build({
    entryPoints: {
      background: 'src/background/main.js',
      content: 'src/content/index.js',
      popup: 'src/popup/popup.js',
      options: 'src/options/options.js',
      guide: 'demo/guide.js',
    },
    absWorkingDir: root,
    outdir: dist,
    bundle: true,
    format: 'iife',
    target: browser === 'firefox' ? ['firefox140'] : ['chrome116'],
    // Scope the API alias locally; never overwrite either browser's native global.
    banner: { js: '(function (chrome) {' },
    footer: { js: '})(globalThis.browser || globalThis.chrome);' },
    legalComments: 'none',
    charset: 'utf8',
  });
  if (browser === 'firefox') {
    delete manifest.minimum_chrome_version;
    manifest.background = { scripts: ['background.js'] };
    manifest.browser_specific_settings = { gecko: { id: 'openplainenglish@jakezwang.github.io', strict_min_version: '140.0', data_collection_permissions: { required: ['none'] } } };
  }
  await writeFile(path.join(dist, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
  for (const area of ['popup', 'options']) {
    for (const extension of ['html', 'css']) await cp(path.join(root, `src/${area}/${area}.${extension}`), path.join(dist, `${area}.${extension}`));
  }
  for (const ext of ['html', 'css']) await cp(path.join(root, `demo/guide.${ext}`), path.join(dist, `guide.${ext}`));
  await cp(path.join(root, 'assets/icons'), path.join(dist, 'icons'), { recursive: true });
  await mkdir(path.join(dist, 'data'));
  await cp(path.join(root, 'data/feedback-config.json'), path.join(dist, 'data/feedback-config.json'));
  await cp(path.join(root, 'data/health.json'), path.join(dist, 'data/health.json'));
  // Keep license/attribution in the downloadable artifact as well as the repository.
  for (const file of ['LICENSE', 'data/LICENSE', 'data/LICENSE.md', 'data/LICENSE.txt']) {
    try { await cp(path.join(root, file), path.join(dist, file)); }
    catch (error) { if (error.code !== 'ENOENT') throw error; }
  }
  console.log(`Built OpenPlainEnglish ${pkg.version} (${browser}) → ${path.relative(root, dist)}`);
  return dist;
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await buildExtension();
