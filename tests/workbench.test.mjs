import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { JSDOM } from 'jsdom';
import { build } from 'esbuild';
import { createReader } from '../src/content/controller.js';

const pause = () => new Promise((resolve) => setTimeout(resolve, 15));
async function harness({ defer = false, clipboard } = {}) {
  const [html, health, pilot] = await Promise.all([
    readFile(new URL('../demo/workbench.html', import.meta.url), 'utf8'),
    readFile(new URL('../data/health.json', import.meta.url), 'utf8').then(JSON.parse),
    readFile(new URL('../data/pilots/public-service.json', import.meta.url), 'utf8').then(JSON.parse),
  ]);
  const built = await build({ entryPoints: [new URL('../demo/workbench.js', import.meta.url).pathname], bundle: true, format: 'esm', write: false, define: { 'import.meta.url': JSON.stringify('https://workshop.test/demo/workbench.js') } });
  const dom = new JSDOM(html, { runScripts: 'outside-only', url: 'https://workshop.test/demo/workbench.html', pretendToBeVisual: true });
  const requests = [], copied = [];
  dom.window.fetch = (url) => {
    const address = String(url);
    assert.ok(['https://workshop.test/data/health.json', 'https://workshop.test/data/pilots/public-service.json'].includes(address));
    return new Promise((resolve, reject) => {
      const record = { url: address, resolve: (data) => resolve({ ok: true, json: async () => data }), reject };
      requests.push(record);
      if (!defer) record.resolve(address.includes('/pilots/') ? pilot : health);
    });
  };
  Object.defineProperty(dom.window.navigator, 'clipboard', { value: { writeText: clipboard || (async (text) => { copied.push(text); }) } });
  dom.window.localStorage.setItem('sentinel', 'untouched');
  dom.window.sessionStorage.setItem('sentinel', 'untouched');
  const boot = dom.window.eval(`(async () => {${built.outputFiles[0].text}\n})()`);
  if (!defer) await boot;
  await pause();
  const paste = (text) => { const input = dom.window.document.getElementById('original'); input.value = text; input.dispatchEvent(new dom.window.Event('input', { bubbles: true })); };
  return { dom, requests, copied, paste, health, pilot, boot };
}

test('local workshop replaces and restores pasted text, invalidates stale previews and never persists input', async () => {
  const { dom, requests, copied, paste } = await harness();
  try {
    const doc = dom.window.document;
    const original = 'Hypertension and a biopsy.\n\n  Keep spacing.';
    paste(original); doc.getElementById('apply').click();
    assert.equal(doc.getElementById('reading-output').textContent, 'High blood pressure and a biopsy.\n\n  Keep spacing.');
    assert.equal(doc.getElementById('result-label').textContent, '1 replaced · 1 explained');
    doc.getElementById('copy-reading').click(); await pause();
    assert.equal(copied[0], doc.getElementById('reading-output').textContent);
    doc.getElementById('restore').click();
    assert.equal(doc.getElementById('reading-output').textContent, original);
    paste('A revised input.');
    assert.equal(doc.getElementById('reading-output').textContent, '');
    assert.equal(doc.getElementById('copy-reading').disabled, true);
    assert.equal(doc.getElementById('restore').disabled, true);
    doc.getElementById('copy-original').click(); await pause();
    assert.equal(copied.at(-1), 'A revised input.');
    assert.equal(requests.length, 1);
    assert.equal(dom.window.localStorage.length, 1);
    assert.equal(dom.window.sessionStorage.length, 1);
    assert.equal(dom.window.localStorage.getItem('sentinel'), 'untouched');
    doc.getElementById('clear').click();
    assert.equal(doc.getElementById('original').value, '');
    assert.equal(doc.getElementById('copy-original').disabled, true);
  } finally { dom.window.close(); }
});

test('rapid opt-in domain changes ignore stale loads and stale errors', async () => {
  const { dom, requests, paste, health, pilot, boot } = await harness({ defer: true });
  try {
    const doc = dom.window.document;
    assert.equal(requests.length, 1);
    assert.equal(requests[0].url.includes('/pilots/'), false);
    const domain = doc.getElementById('domain');
    domain.value = 'public-service'; domain.dispatchEvent(new dom.window.Event('change'));
    assert.equal(doc.getElementById('apply').disabled, true);
    requests[1].resolve(pilot); await pause();
    requests[0].resolve(health); await boot; await pause();
    paste('At the present time, please respond.'); doc.getElementById('apply').click();
    assert.match(doc.getElementById('reading-output').textContent, /^Now,/);
    domain.value = 'health'; domain.dispatchEvent(new dom.window.Event('change'));
    domain.value = 'public-service'; domain.dispatchEvent(new dom.window.Event('change'));
    requests[3].resolve(pilot); await pause();
    requests[2].reject(new Error('Late old request')); await pause();
    assert.equal(doc.getElementById('apply').disabled, false);
    assert.match(doc.getElementById('status').textContent, /entries ready/);
  } finally { dom.window.close(); }
});

test('malformed glossary stays disabled and clipboard refusal offers selected local text', async () => {
  const bad = await harness({ defer: true });
  try {
    bad.requests[0].resolve({ entries: null }); await bad.boot;
    assert.equal(bad.dom.window.document.getElementById('apply').disabled, true);
    assert.match(bad.dom.window.document.getElementById('status').textContent, /could not load/);
  } finally { bad.dom.window.close(); }
  const { dom, paste } = await harness({ clipboard: async () => { throw new Error('Denied'); } });
  try {
    const doc = dom.window.document;
    paste('Private synthetic test text.');
    doc.getElementById('copy-original').click(); await pause();
    const fallback = doc.getElementById('copy-fallback');
    assert.equal(doc.getElementById('copy-fallback-label').hidden, false);
    assert.equal(fallback.value, 'Private synthetic test text.');
    assert.equal(fallback.selectionStart, 0);
    assert.equal(fallback.selectionEnd, fallback.value.length);
    doc.getElementById('clear').click();
    assert.equal(fallback.value, '');
    assert.equal(doc.getElementById('copy-fallback-label').hidden, true);
  } finally { dom.window.close(); }
});

test('clearing text prevents a pending clipboard rejection from resurrecting old input', async () => {
  let rejectCopy;
  const { dom, paste } = await harness({ clipboard: () => new Promise((_resolve, reject) => { rejectCopy = reject; }) });
  try {
    const doc = dom.window.document;
    paste('Discard this synthetic text.'); doc.getElementById('copy-original').click();
    doc.getElementById('clear').click();
    rejectCopy(new Error('Late denial')); await pause();
    assert.equal(doc.getElementById('copy-fallback').value, '');
    assert.equal(doc.getElementById('copy-fallback-label').hidden, true);
    assert.match(doc.getElementById('status').textContent, /Text cleared/);
  } finally { dom.window.close(); }
});


test('formatted reading phrases count once and copying/restoring preserves complete words across segments', async () => {
  const { dom, paste, copied } = await harness();
  try {
    const doc = dom.window.document, output = doc.getElementById('reading-output');
    const original = 'blood glucose and magnetic resonance imaging.';
    paste(original); doc.getElementById('apply').click();
    // Simulate host formatting after activation; the input remains ordinary text.
    output.innerHTML = 'blood <strong data-check="kept">glucose</strong> and magnetic <em>resonance</em> imaging.';
    const strong = output.querySelector('strong');
    await new Promise((resolve) => setTimeout(resolve, 120));
    assert.equal(output.textContent, 'blood sugar and magnetic resonance imaging.');
    assert.equal(doc.getElementById('result-label').textContent, '1 replaced · 1 explained');
    assert.equal(output.querySelectorAll('[data-ope-term][role=button]').length, 2);
    assert.ok(output.querySelectorAll('[data-ope-term]').length > 2);
    doc.getElementById('copy-reading').click(); await pause();
    doc.getElementById('copy-original').click(); await pause();
    assert.deepEqual(copied, ['blood sugar and magnetic resonance imaging.', original]);
    doc.getElementById('restore').click();
    assert.equal(output.textContent, original);
    assert.equal(output.querySelector('strong'), strong);
    assert.equal(strong.dataset.check, 'kept');
    assert.equal(strong.textContent, 'glucose');
  } finally { dom.window.close(); }
});

test('read-only original extraction reconstructs formatted phrases without disturbing the current reading view', async () => {
  const lexicon = JSON.parse(await readFile(new URL('../data/health.json', import.meta.url), 'utf8'));
  const dom = new JSDOM('<body><header data-ope-owned="test-ui">Private control text</header><p>blood <strong>glucose</strong> and magnetic <em>resonance</em> imaging.</p></body>', { pretendToBeVisual: true });
  const reader = createReader({ document: dom.window.document, entries: lexicon.entries });
  try {
    const state = reader.enable({ mode: 'plain' });
    assert.equal(state.count, 2);
    assert.equal(state.replacedCount, 1);
    const paragraph = dom.window.document.querySelector('p');
    const rendered = paragraph.innerHTML;
    assert.equal(reader.getOriginalText(), 'blood glucose and magnetic resonance imaging.');
    assert.equal(paragraph.innerHTML, rendered);
    dom.window.dispatchEvent(new dom.window.Event('beforeprint'));
    assert.equal(paragraph.textContent, 'blood glucose and magnetic resonance imaging.');
    dom.window.dispatchEvent(new dom.window.Event('afterprint'));
    assert.equal(paragraph.textContent, 'blood sugar and magnetic resonance imaging.');
  } finally { reader.destroy(); dom.window.close(); }
});
