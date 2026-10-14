import { build } from 'esbuild';
import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { root } from './build.mjs';
import { assertValidLexicon } from './validate-lexicon.mjs';

export async function buildSDK(output = path.join(root, 'artifacts/sdk')) {
  const { version } = JSON.parse(await readFile(path.join(root, 'package.json'), 'utf8'));
  for (const file of ['data/health.json', 'data/pilots/public-service.json']) {
    const lexicon = assertValidLexicon(JSON.parse(await readFile(path.join(root, file), 'utf8')));
    if (lexicon.version !== version) throw new Error(`${file} and package version must match.`);
  }
  await rm(output, { recursive: true, force: true });
  await mkdir(path.join(output, 'data/pilots'), { recursive: true });
  await build({ absWorkingDir: root, entryPoints: { index: 'src/core/text.js', browser: 'src/content/controller.js' }, outdir: output, bundle: true, format: 'esm', target: 'es2022', legalComments: 'none' });
  const pkg = { name: 'openplainenglish-core', version, description: 'Local phrase matching and reversible plain reading. Experimental; independently unreviewed.', type: 'module', license: 'MIT', exports: { '.': './index.js', './browser': './browser.js', './data/*': './data/*' }, files: ['index.js', 'browser.js', 'data', 'README.md', 'LICENSE'], engines: { node: '>=22' }, repository: { type: 'git', url: 'https://github.com/jakezwang/openplainenglish.git' } };
  await writeFile(path.join(output, 'package.json'), `${JSON.stringify(pkg, null, 2)}\n`);
  for (const file of ['LICENSE', 'data/LICENSE', 'data/health.json', 'data/pilots/public-service.json']) await cp(path.join(root, file), path.join(output, file));
  await cp(path.join(root, 'docs/SDK.md'), path.join(output, 'README.md'));
  console.log(`Built independent engine and data → ${path.relative(root, output)}`);
  return output;
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await buildSDK();
