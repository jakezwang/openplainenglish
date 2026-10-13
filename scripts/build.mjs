import { build } from 'esbuild';
import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export async function buildExtension(dist = path.join(root, 'dist')) {
  await rm(dist, { recursive: true, force: true });
  await mkdir(dist, { recursive: true });
  await build({
    entryPoints: {
      background: 'src/background/main.js',
      content: 'src/content/index.js',
      popup: 'src/popup/popup.js',
      options: 'src/options/options.js',
    },
    absWorkingDir: root,
    outdir: dist,
    bundle: true,
    format: 'iife',
    target: ['chrome116'],
    legalComments: 'none',
    charset: 'utf8',
  });
  const pkg = JSON.parse(await readFile(path.join(root, 'package.json'), 'utf8'));
  const manifest = JSON.parse(await readFile(path.join(root, 'manifest.json'), 'utf8'));
  const lexicon = JSON.parse(await readFile(path.join(root, 'data/health.json'), 'utf8'));
  if (manifest.version !== pkg.version) throw new Error('Manifest and package version must match.');
  if (lexicon.version !== pkg.version) throw new Error('Lexicon and package version must match.');
  await writeFile(path.join(dist, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
  for (const area of ['popup', 'options']) {
    for (const extension of ['html', 'css']) await cp(path.join(root, `src/${area}/${area}.${extension}`), path.join(dist, `${area}.${extension}`));
  }
  await cp(path.join(root, 'assets/icons'), path.join(dist, 'icons'), { recursive: true });
  await mkdir(path.join(dist, 'data'));
  await cp(path.join(root, 'data/health.json'), path.join(dist, 'data/health.json'));
  // Keep license/attribution in the downloadable artifact as well as the repository.
  for (const file of ['LICENSE', 'data/LICENSE', 'data/LICENSE.md', 'data/LICENSE.txt']) {
    try { await cp(path.join(root, file), path.join(dist, file)); }
    catch (error) { if (error.code !== 'ENOENT') throw error; }
  }
  console.log(`Built OpenPlainEnglish ${pkg.version} → dist/`);
  return dist;
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await buildExtension();
