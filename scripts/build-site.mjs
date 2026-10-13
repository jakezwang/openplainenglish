import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { root } from './build.mjs';

/** A static allowlist: no extension installation, credentials or draft exports. */
export async function buildSite(output = path.join(root, 'site')) {
  await rm(output, { recursive: true, force: true });
  await mkdir(output, { recursive: true });
  const files = ['demo/index.html', 'demo/style.css', 'demo/demo.js', 'demo/preview.html', 'demo/preview.js', 'data/health.json', 'data/LICENSE', 'LICENSE', 'src/background/actions.js', 'src/content/controller.js', 'src/content/panel.js'];
  for (const file of files) {
    await mkdir(path.dirname(path.join(output, file)), { recursive: true });
    await cp(path.join(root, file), path.join(output, file));
  }
  for (const dir of ['core', 'shared', 'options', 'popup']) {
    await cp(path.join(root, 'src', dir), path.join(output, 'src', dir), { recursive: true });
  }
  // Relative URLs work at both a custom-domain root and a /repository/ prefix.
  const html = await readFile(path.join(root, 'demo/index.html'), 'utf8');
  await writeFile(path.join(output, 'index.html'), html.replace('<head>', '<head>\n  <base href="./demo/">'));
  await writeFile(path.join(output, '.nojekyll'), '');
  await writeFile(path.join(output, '404.html'), '<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Page not found · OpenPlainEnglish</title><h1>That page is not here.</h1><p><a href="https://jakezwang.github.io/openplainenglish/">Return to the reading demo</a></p></html>\n');
  console.log(`Built static reading demo → ${path.relative(root, output)}`);
  return output;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await buildSite();
