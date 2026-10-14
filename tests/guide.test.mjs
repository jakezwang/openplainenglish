import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { JSDOM } from 'jsdom';
import { build } from 'esbuild';
import { DEFAULT_PREFERENCES } from '../src/shared/preferences.js';

const pause = () => new Promise((resolve) => setTimeout(resolve, 20));
async function harness({ extension = false, saveFails = false, completed = false } = {}) {
  const html = await readFile(new URL('../demo/guide.html', import.meta.url), 'utf8');
  const lexicon = JSON.parse(await readFile(new URL('../data/health.json', import.meta.url), 'utf8'));
  const bundle = await build({ entryPoints:[new URL('../demo/guide.js', import.meta.url).pathname], bundle:true, format:'iife', write:false, define:{ 'import.meta.url':JSON.stringify('https://guide.test/demo/guide.js') } });
  const dom = new JSDOM(html, { runScripts:'outside-only', url:'https://guide.test/demo/guide.html', pretendToBeVisual:true });
  const calls = [], fetches = [];
  let preferences = { ...DEFAULT_PREFERENCES, mode:'annotate', guideCompleted:completed };
  if (extension) dom.window.chrome = { runtime:{ id:'extension-test', getURL:(path) => `chrome-extension://extension-test/${path}`, sendMessage:async (message) => {
    calls.push(message);
    if (message.type === 'OPE_GET_PREFERENCES') return { ok:true, preferences };
    assert.equal(message.type, 'OPE_SET_PREFERENCES');
    if (saveFails) return { ok:false };
    preferences = { ...preferences, ...message.preferences }; return { ok:true, preferences };
  } } };
  else dom.window.localStorage.setItem('opeDemoPreferences', JSON.stringify(preferences));
  dom.window.fetch = async (url) => { fetches.push(String(url)); return { ok:true, json:async () => lexicon }; };
  dom.window.open = () => assert.fail('No external navigation');
  dom.window.eval(bundle.outputFiles[0].text); await pause();
  return { dom, calls, fetches };
}
async function completePractice(dom) {
  const doc = dom.window.document;
  const original = doc.getElementById('practice-text').textContent;
  doc.getElementById('start-guide').click();
  assert.match(doc.getElementById('practice-text').textContent, /High blood pressure/);
  assert.equal(doc.querySelectorAll('[data-ope-term]').length, 2);
  const firstMark = doc.querySelector('[data-ope-term]');
  // A real user cannot click in the same task as enabling. Let observers and
  // scheduled rescans settle; guide rendering must not create a rescan loop.
  await new Promise((resolve) => setTimeout(resolve, 150));
  assert.equal(doc.querySelector('[data-ope-term]'), firstMark);
  doc.querySelector('[data-ope-term]').dispatchEvent(new dom.window.MouseEvent('click', { bubbles:true }));
  const panel = doc.querySelector('[data-ope-owned=panel]').shadowRoot;
  assert.equal(panel.querySelector('.original-words').textContent, 'Hypertension');
  panel.querySelector('.restore-occurrence').click();
  assert.match(doc.getElementById('practice-text').textContent, /^Hypertension.*high blood pressure/);
  doc.getElementById('stop-guide').click();
  assert.equal(doc.getElementById('practice-text').textContent, original);
  assert.equal(doc.querySelectorAll('[data-ope-term]').length, 0);
  assert.equal(doc.getElementById('finish-guide').hidden, false);
  assert.equal(doc.activeElement.id, 'finish-guide');
}

test('guide uses actual reader and remembers completion only after four actions and explicit Finish', async () => {
  const { dom, fetches } = await harness();
  try {
    const doc = dom.window.document;
    assert.equal(doc.querySelectorAll('[data-ope-term]').length, 0);
    assert.equal(doc.getElementById('finish-guide').hidden, true);
    doc.getElementById('finish-guide').click();
    assert.equal(JSON.parse(dom.window.localStorage.getItem('opeDemoPreferences')).guideCompleted, false);
    await completePractice(dom);
    assert.equal(JSON.parse(dom.window.localStorage.getItem('opeDemoPreferences')).guideCompleted, false);
    doc.getElementById('finish-guide').click(); await pause();
    const saved = JSON.parse(dom.window.localStorage.getItem('opeDemoPreferences'));
    assert.deepEqual(saved, { ...DEFAULT_PREFERENCES, mode:'annotate', guideCompleted:true });
    assert.deepEqual(fetches, ['https://guide.test/data/health.json']);
    assert.equal(dom.window.localStorage.length, 1);
  } finally { dom.window.close(); }
});

test('early stop does not complete guide; extension completion never activates another page', async () => {
  const { dom, calls, fetches } = await harness({ extension:true, completed:true, saveFails:true });
  try {
    const doc = dom.window.document;
    assert.equal(doc.getElementById('guide-saved').hidden, false);
    assert.equal(doc.querySelectorAll('[data-ope-term]').length, 0);
    doc.getElementById('start-guide').click(); doc.getElementById('stop-guide').click();
    assert.equal(doc.getElementById('finish-guide').hidden, true);
    await completePractice(dom); doc.getElementById('finish-guide').click(); await pause();
    assert.equal(doc.getElementById('guide-error').hidden, false);
    assert.equal(doc.getElementById('finish-guide').disabled, false);
    assert.deepEqual(calls.map((item) => item.type), ['OPE_GET_PREFERENCES','OPE_SET_PREFERENCES']);
    assert.deepEqual(JSON.parse(JSON.stringify(calls[1].preferences)), { guideCompleted:true });
    assert.deepEqual(fetches, ['chrome-extension://extension-test/data/health.json']);
  } finally { dom.window.close(); }
});
