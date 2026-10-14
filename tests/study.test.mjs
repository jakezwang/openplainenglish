import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { JSDOM } from 'jsdom';
import { build } from 'esbuild';
import { studyPlan, STUDY_PASSAGES } from '../demo/study.js';

const pause = () => new Promise((resolve) => setTimeout(resolve, 15));
test('six study sequences balance every passage across all conditions without repeats', () => {
  const allocations = new Map(STUDY_PASSAGES.map((passage) => [passage.id, []]));
  for (let sequence = 1; sequence <= 6; sequence++) {
    const plan = studyPlan(sequence);
    assert.equal(new Set(plan.map((item) => item.id)).size, 6);
    for (const condition of ['original', 'annotate', 'plain']) assert.equal(plan.filter((item) => item.condition === condition).length, 2);
    for (const item of plan) allocations.get(item.id).push(item.condition);
  }
  for (const values of allocations.values()) for (const condition of ['original', 'annotate', 'plain']) assert.equal(values.filter((item) => item === condition).length, 2);
  for (const sequence of [0, 7, '1', 1.5, null]) assert.throws(() => studyPlan(sequence), TypeError);
});

test('study requires consent, uses the real modes and keeps results local until reviewed export', async () => {
  const html = await readFile(new URL('../demo/study.html', import.meta.url), 'utf8');
  const lexicon = JSON.parse(await readFile(new URL('../data/health.json', import.meta.url), 'utf8'));
  const bundle = await build({ entryPoints: [new URL('../demo/study.js', import.meta.url).pathname], bundle: true, write: false, format: 'iife', define: { 'import.meta.url': JSON.stringify('https://study.test/demo/study.js') } });
  const dom = new JSDOM(html, { runScripts: 'outside-only', url: 'https://study.test/demo/study.html', pretendToBeVisual: true });
  const downloads = [], fetches = [];
  dom.window.fetch = async (url) => { fetches.push(String(url)); assert.equal(String(url), 'https://study.test/data/health.json'); return { ok: true, json: async () => lexicon }; };
  dom.window.localStorage.setItem('untouched', 'original');
  dom.window.URL.createObjectURL = () => 'blob:local-results';
  dom.window.URL.revokeObjectURL = () => {};
  dom.window.HTMLAnchorElement.prototype.click = function () { downloads.push(this.download); };
  try {
    dom.window.eval(bundle.outputFiles[0].text); await pause();
    const doc = dom.window.document;
    const submit = (id) => doc.getElementById(id).dispatchEvent(new dom.window.Event('submit', { cancelable: true }));
    submit('setup-form'); assert.equal(doc.getElementById('session').hidden, true);
    doc.getElementById('consent').checked = true;
    submit('setup-form');
    assert.equal(doc.getElementById('session').hidden, false);
    assert.equal(doc.querySelectorAll('[data-ope-term]').length, 0);
    for (let index = 0; index < 6; index++) {
      if (index === 1) {
        assert.equal(doc.querySelector('[data-ope-term]').textContent, 'blood glucose');
        doc.querySelector('[data-ope-term]').dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
        assert.ok(doc.querySelector('[data-ope-owned=panel]'));
        doc.dispatchEvent(new dom.window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
        doc.getElementById('interruption').checked = true;
        doc.getElementById('facilitator-notes').value = 'Synthetic interruption note';
      }
      if (index === 2) assert.equal(doc.querySelector('[data-ope-term]').textContent, 'long-term disease');
      doc.getElementById('answer').value = 'Synthetic test response';
      doc.getElementById('confidence').value = '3';
      submit('answer-form');
    }
    assert.equal(downloads.length, 0);
    assert.equal(fetches.length, 1);
    assert.equal(doc.getElementById('complete').hidden, false);
    const exported = JSON.parse(doc.getElementById('result-json').value);
    assert.equal(exported.results.length, 6);
    assert.equal(exported.completed, true);
    assert.equal(exported.consent, true);
    assert.equal(exported.results[1].explanationOpens, 1);
    assert.equal(exported.results[0].explanationOpens, 0);
    assert.equal(exported.results[1].interrupted, true);
    assert.equal(exported.results[1].facilitatorNotes, 'Synthetic interruption note');
    assert.deepEqual(Object.keys(exported.results[1]).sort(), ['passage', 'condition', 'answer', 'skipped', 'seconds', 'confidence', 'originalConsulted', 'explanationOpens', 'interrupted', 'facilitatorNotes'].sort());
    assert.equal(JSON.stringify(exported).includes('study.test'), false);
    assert.equal(dom.window.localStorage.length, 1);
    doc.getElementById('download-results').click();
    assert.equal(downloads.length, 1);
  } finally { dom.window.close(); }
});
