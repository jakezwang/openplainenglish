import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { root } from './build.mjs';
import { buildVendor } from './build-vendor.mjs';

/** A static allowlist: no extension installation, credentials or draft exports. */
export async function buildSite(output = path.join(root, 'site')) {
  await rm(output, { recursive: true, force: true });
  await mkdir(output, { recursive: true });
  const files = ['demo/index.html', 'demo/style.css', 'demo/demo.js', 'demo/preview.html', 'demo/preview.js', 'demo/install.html', 'demo/install.css', 'demo/install.js', 'demo/install-config.json', 'data/health.json', 'data/LICENSE', 'LICENSE', 'src/background/actions.js', 'src/content/controller.js', 'src/content/panel.js'];
  for (const file of files) {
    await mkdir(path.dirname(path.join(output, file)), { recursive: true });
    await cp(path.join(root, file), path.join(output, file));
  }
  for (const file of ['demo/workbench.html', 'demo/workbench.js', 'demo/workbench.css', 'demo/compatibility.html', 'demo/compatibility.js', 'demo/study.html', 'demo/study.js', 'demo/study.css', 'data/pilots/public-service.json']) {
    await mkdir(path.dirname(path.join(output, file)), { recursive: true });
    await cp(path.join(root, file), path.join(output, file));
  }
  for (const dir of ['content', 'core', 'shared', 'options', 'popup']) {
    await cp(path.join(root, 'src', dir), path.join(output, 'src', dir), { recursive: true });
  }
  await rm(path.join(output, 'src/content/index.js'), { force: true });
  for (const name of ['documents', 'guide', 'sentences']) for (const extension of ['html', 'js', 'css']) await cp(path.join(root, `demo/${name}.${extension}`), path.join(output, `demo/${name}.${extension}`));
  await cp(path.join(root, 'demo/fixtures'), path.join(output, 'demo/fixtures'), { recursive: true });
  await cp(path.join(root, 'data/feedback-config.json'), path.join(output, 'data/feedback-config.json'));
  await buildVendor(path.join(output, 'vendor'));
  // Relative URLs work at both a custom-domain root and a /repository/ prefix.
  const html = await readFile(path.join(root, 'demo/index.html'), 'utf8');
  // Fragment links must stay on this root document despite the asset base URL.
  const rootHtml = html.replace('<head>', '<head>\n  <base href="./demo/">').replaceAll('href="#', 'href="../#');
  await writeFile(path.join(output, 'index.html'), rootHtml);
  await writeFile(path.join(output, '.nojekyll'), '');
  await writeFile(path.join(output, '404.html'), '<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Page not found · OpenPlainEnglish</title><h1>That page is not here.</h1><p><a href="https://jakezwang.github.io/openplainenglish/">Return to the reading demo</a></p></html>\n');
  console.log(`Built static reading demo → ${path.relative(root, output)}`);
  return output;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await buildSite();
