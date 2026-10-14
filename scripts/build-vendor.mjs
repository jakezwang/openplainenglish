import { cp, mkdir, readdir, rm, writeFile, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { root } from './build.mjs';

// Website-only dependencies. Never copied into the activeTab extension or SDK.
export async function buildVendor(output = path.join(root, 'vendor')) {
  await rm(output, { recursive: true, force: true });
  await mkdir(path.join(output, 'ocr/core'), { recursive: true });
  await mkdir(path.join(output, 'ocr/lang'), { recursive: true });
  await mkdir(path.join(output, 'pdf'), { recursive: true });
  const modules = path.join(root, 'node_modules');
  for (const file of ['pdf.mjs', 'pdf.worker.mjs']) await cp(path.join(modules, 'pdfjs-dist/build', file), path.join(output, 'pdf', file));
  for (const dir of ['cmaps', 'standard_fonts', 'wasm', 'iccs']) await cp(path.join(modules, 'pdfjs-dist', dir), path.join(output, 'pdf', dir), { recursive: true });
  await cp(path.join(modules, 'pdfjs-dist/web/pdf_viewer.css'), path.join(output, 'pdf/pdf_viewer.css'));
  for (const file of ['tesseract.esm.min.js', 'worker.min.js', 'worker.min.js.LICENSE.txt', 'tesseract.min.js.LICENSE.txt']) await cp(path.join(modules, 'tesseract.js/dist', file), path.join(output, 'ocr', file));
  for (const file of await readdir(path.join(modules, 'tesseract.js-core'))) if (/\.wasm(?:\.js)?$/u.test(file)) await cp(path.join(modules, 'tesseract.js-core', file), path.join(output, 'ocr/core', file));
  await cp(path.join(modules, '@tesseract.js-data/eng/4.0.0_best_int/eng.traineddata.gz'), path.join(output, 'ocr/lang/eng.traineddata.gz'));
  for (const [pkg, dest, file] of [['pdfjs-dist', 'pdf', 'LICENSE'], ['tesseract.js', 'ocr', 'LICENSE.md'], ['tesseract.js-core', 'ocr/core', 'LICENSE']]) await cp(path.join(modules, pkg, file), path.join(output, dest, 'LICENSE'));
  // Upstream tessdata_best uses the same complete Apache-2.0 license text.
  await cp(path.join(modules, 'tesseract.js-core/LICENSE'), path.join(output, 'ocr/lang/LICENSE'));
  const versions = {};
  for (const pkg of ['pdfjs-dist', 'tesseract.js', 'tesseract.js-core', '@tesseract.js-data/eng']) versions[pkg] = JSON.parse(await readFile(path.join(modules, pkg, 'package.json'))).version;
  await writeFile(path.join(output, 'NOTICE.txt'), `Website-only local document processing.\n${JSON.stringify(versions, null, 2)}\nPDF.js and Tesseract code: Apache-2.0, included LICENSE files. English model packaged by @tesseract.js-data/eng (MIT package metadata); upstream tessdata is Apache-2.0: https://github.com/tesseract-ocr/tessdata_best/blob/main/LICENSE\nNo CDN runtime fallback is used by our document reader.\n`);
  console.log(`Built website PDF/OCR assets → ${path.relative(root, output)}`);
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await buildVendor();
