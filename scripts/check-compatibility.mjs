import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { JSDOM } from 'jsdom';
import { createReader } from '../src/content/controller.js';
import { root } from './build.mjs';

// Public information only. Scripts/resources are never executed or downloaded by JSDOM.
const targets = [
  { id: 'medline-lab-tests', url: 'https://medlineplus.gov/lab-tests/how-to-understand-your-lab-results/' },
  { id: 'medline-cholesterol', url: 'https://medlineplus.gov/lab-tests/cholesterol-levels/' },
  { id: 'cpsc-plain-language', url: 'https://www.cpsc.gov/About-CPSC/Policies-Statements-and-Directives/plain-language-principles' },
];
const report = { schemaVersion: 1, generatedAt: new Date().toISOString(), runtime: process.version, method: 'JSDOM on downloaded public HTML; no browser layout, extension permission, assistive technology or external page script execution', pages: [] };
const { entries } = JSON.parse(await readFile(path.join(root, 'data/health.json')));
const pilot = JSON.parse(await readFile(path.join(root, 'data/pilots/public-service.json')));
const output = path.join(root, 'artifacts/compatibility');
await mkdir(output, { recursive: true });
for (const target of targets) {
  const result = { ...target };
  try {
    const response = await fetch(target.url, { signal: AbortSignal.timeout(25000) });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const html = await response.text();
    if (html.length > 5000000) throw new Error('Snapshot exceeds 5 MB limit');
    await writeFile(path.join(output, `${target.id}.html`), html);
    result.sha256 = createHash('sha256').update(html).digest('hex');
    const dom = new JSDOM(html, { url: target.url, pretendToBeVisual: true });
    try {
      const document = dom.window.document;
      const beforeText = document.body.textContent;
      const beforeHTML = document.body.innerHTML;
      const reader = createReader({ document, entries: target.id.startsWith('cpsc') ? pilot.entries : entries });
      const start = performance.now();
      result.state = reader.enable({ mode: 'plain' });
      result.scanMs = Number((performance.now() - start).toFixed(2));
      result.textLength = beforeText.length;
      const segments = [...document.querySelectorAll('[data-ope-term]')];
      const primary = segments.filter((mark) => mark.getAttribute('role') === 'button');
      result.markerSegments = segments.length;
      result.keyboardTargets = primary.length;
      result.accessibleMarks = primary.length === result.state.count
        && primary.every((mark) => mark.getAttribute('tabindex') === '0' && Boolean(mark.getAttribute('aria-label')) && Boolean(mark.textContent))
        && segments.filter((mark) => !primary.includes(mark)).every((mark) => mark.getAttribute('aria-hidden') === 'true' && !mark.hasAttribute('tabindex'));
      const restore = performance.now();
      reader.disable();
      result.restoreMs = Number((performance.now() - restore).toFixed(2));
      result.exactTextRestored = document.body.textContent === beforeText;
      result.exactMarkupRestored = document.body.innerHTML === beforeHTML;
      reader.destroy();
      if (!result.exactTextRestored || !result.exactMarkupRestored || !result.accessibleMarks) process.exitCode = 1;
    } finally { dom.window.close(); }
  } catch (error) { result.error = error.message; process.exitCode = 1; }
  report.pages.push(result);
  console.log(`${target.id}: ${result.error || `${result.state.count} marks; ${result.scanMs} ms scan; exact restore ${result.exactTextRestored && result.exactMarkupRestored}`}`);
}
await writeFile(path.join(output, 'report.json'), `${JSON.stringify(report, null, 2)}\n`);
console.log('Saved artifacts/compatibility/report.json');
