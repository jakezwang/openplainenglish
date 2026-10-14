import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { JSDOM } from 'jsdom';
import { build } from 'esbuild';

const pause = () => new Promise((resolve) => setTimeout(resolve, 10));
const off = { enabled: false, mode: 'plain', count: 0, replacedCount: 0, annotatedCount: 0, truncated: false };
async function popupHarness({ initial = off, failMode = false, savedPreferences = {}, failPreferences = false } = {}) {
  const html = await readFile(new URL('../src/popup/popup.html', import.meta.url), 'utf8');
  const bundled = await build({ entryPoints: [new URL('../src/popup/popup.js', import.meta.url).pathname], bundle: true, write: false, format: 'iife' });
  const script = bundled.outputFiles[0].text;
  const dom = new JSDOM(html, { runScripts: 'outside-only', url: 'https://extension.test/popup.html' });
  const messages = [];
  let state = { ...initial };
  let preferences = { language: 'en', density: 'comfortable', highlight: 'subtle', mode: 'plain', ...savedPreferences };
  const active = (mode) => ({ enabled: true, mode, count: 3, replacedCount: mode === 'plain' ? 2 : 0, annotatedCount: mode === 'plain' ? 1 : 3, truncated: false });
  dom.window.chrome = { runtime: {
    getURL: (path) => `https://extension.test/${path}`,
    sendMessage: async (message) => {
      messages.push(message);
      if (message.type === 'OPE_GET_PREFERENCES') return { ok: true, preferences };
      if (message.type === 'OPE_SET_PREFERENCES') { if (failPreferences) return { ok: false }; preferences = { ...preferences, ...message.preferences }; return { ok: true, preferences }; }
      if (message.type === 'OPE_TOGGLE_ACTIVE') state = state.enabled ? { ...off, mode: state.mode } : active(message.mode);
      if (message.type === 'OPE_SET_MODE_ACTIVE') {
        if (failMode) return { ok: false, error: 'The page changed. Please try again.' };
        state = active(message.mode);
      }
      return { ok: true, state: { ...state } };
    },
  } };
  dom.window.eval(script);
  await pause();
  return { dom, messages };
}

function chooseMode(dom, mode) {
  const input = dom.window.document.getElementById(`mode-${mode}`);
  input.checked = true;
  input.dispatchEvent(new dom.window.Event('change', { bubbles: true }));
}

test('popup mode selection while off does not activate; chosen mode is sent only on enable', async () => {
  const { dom, messages } = await popupHarness();
  try {
    const doc = dom.window.document;
    chooseMode(dom, 'annotate');
    await pause();
    assert.equal(messages.some((item) => item.type === 'OPE_TOGGLE_ACTIVE' || item.type === 'OPE_SET_MODE_ACTIVE'), false);
    assert.equal(messages.at(-1).type, 'OPE_SET_PREFERENCES');
    assert.equal(doc.getElementById('toggle').textContent, 'Explain terms on this page ↗');
    doc.getElementById('toggle').click();
    await pause();
    assert.equal(messages.at(-1).type, 'OPE_TOGGLE_ACTIVE');
    assert.equal(messages.at(-1).mode, 'annotate');
    assert.equal(doc.getElementById('toggle').textContent, 'Restore original');
    assert.match(doc.getElementById('state-label').textContent, /3 terms marked · original wording/);
    chooseMode(dom, 'plain');
    await pause();
    assert.equal(messages.at(-1).type, 'OPE_SET_MODE_ACTIVE');
    assert.equal(messages.at(-1).mode, 'plain');
    assert.equal(doc.getElementById('state-label').textContent, '2 replaced · 1 explained');
    doc.getElementById('toggle').click();
    await pause();
    assert.equal(doc.getElementById('mode-plain').checked, true);
    assert.equal(doc.getElementById('toggle').textContent, 'Read in plain English ↗');
  } finally { dom.window.close(); }
});

test('failed active mode change restores confirmed mode and exposes an actionable error', async () => {
  const { dom } = await popupHarness({ initial: { ...off, enabled: true, count: 2, replacedCount: 1, annotatedCount: 1 }, failMode: true });
  try {
    chooseMode(dom, 'annotate');
    await pause();
    const doc = dom.window.document;
    assert.equal(doc.getElementById('mode-plain').checked, true);
    assert.equal(doc.getElementById('mode-annotate').checked, false);
    assert.equal(doc.getElementById('state-label').textContent, '1 replaced · 1 explained');
    assert.equal(doc.getElementById('error').hidden, false);
    assert.match(doc.getElementById('error').textContent, /page changed/);
    assert.equal(doc.getElementById('mode-picker').disabled, false);
  } finally { dom.window.close(); }
});

test('plain reading with no replacements says so, including partial-page limits', async () => {
  const { dom } = await popupHarness({ initial: { ...off, enabled: true, count: 2, annotatedCount: 2, truncated: true } });
  try {
    const doc = dom.window.document;
    assert.equal(doc.getElementById('state-label').textContent, '0 replaced · 2 explained');
    assert.match(doc.getElementById('detail').textContent, /No reviewed substitutions/);
    assert.match(doc.getElementById('detail').textContent, /only part was checked/);
  } finally { dom.window.close(); }
});

test('glossary shows and searches only approved explicit replacement pairs, never derives them from definitions', async () => {
  const html = await readFile(new URL('../src/options/options.html', import.meta.url), 'utf8');
  const bundle = await build({ entryPoints: [new URL('../src/options/options.js', import.meta.url).pathname], bundle: true, write: false, format: 'iife' });
  const dom = new JSDOM(html, { runScripts: 'outside-only', url: 'https://extension.test/options.html' });
  const base = { aliases: [], short: 'A definition for the glossary', explanation: 'An explanation.', context: 'Use the source context.', sources: [], review: { status: 'source-checked' } };
  dom.window.chrome = {
    runtime: { sendMessage: async () => ({ ok: true, lexicon: { version: '0.3.0', entries: [
      { ...base, id: 'first', term: 'first term', inline: { replacements: [{ from: 'first term', to: 'everyday wording' }, { from: 'unrelated term', to: 'invalid replacement' }], note: 'Only this exact phrase is changed.', review: { status: 'source-checked' } } },
      { ...base, id: 'second', term: 'second term', inline: { replacements: [{ from: 'second term', to: 'unreviewed wording' }], review: { status: 'draft' } } },
    ] } }) },
    storage: { local: { get: async () => ({ opeFeedback: [] }) }, onChanged: { addListener() {} } },
  };
  try {
    dom.window.eval(bundle.outputFiles[0].text);
    await pause();
    const doc = dom.window.document;
    assert.equal(doc.querySelectorAll('.inline-pairs li').length, 1);
    assert.equal(doc.querySelector('.inline-from').textContent, 'first term');
    assert.equal(doc.querySelector('.inline-to').textContent, 'everyday wording');
    assert.match(doc.querySelectorAll('.entry')[1].textContent, /Explanation only/);
    const search = doc.getElementById('search');
    search.value = 'everyday wording';
    search.dispatchEvent(new dom.window.Event('input'));
    assert.match(doc.getElementById('result-count').textContent, /1 match/);
    search.value = 'invalid replacement';
    search.dispatchEvent(new dom.window.Event('input'));
    assert.match(doc.getElementById('result-count').textContent, /0 matches/);
  } finally { dom.window.close(); }
});


test('popup loads remembered mode without activating and rolls failed preference changes back', async () => {
  const { dom, messages } = await popupHarness({ savedPreferences: { language: 'zh-CN', mode: 'annotate', density: 'compact' }, failPreferences: true });
  try {
    const doc = dom.window.document;
    assert.equal(doc.documentElement.lang, 'zh-CN');
    assert.equal(doc.body.dataset.density, 'compact');
    assert.equal(doc.getElementById('mode-annotate').checked, true);
    assert.equal(doc.getElementById('toggle').textContent, '解释本页词语 ↗');
    assert.equal(messages.some((item) => item.type === 'OPE_TOGGLE_ACTIVE'), false);
    chooseMode(dom, 'plain'); await pause();
    assert.equal(doc.getElementById('mode-annotate').checked, true);
    assert.match(doc.getElementById('error').textContent, /无法保存偏好/);
    assert.equal(doc.getElementById('toggle').disabled, false);
  } finally { dom.window.close(); }
});

test('first-use invitation is local, optional and always reopenable without page activation', async () => {
  for (const guideCompleted of [false,true]) {
    const { dom, messages } = await popupHarness({ savedPreferences:{ guideCompleted } });
    try {
      const doc = dom.window.document;
      assert.equal(doc.getElementById('first-use').hidden, guideCompleted);
      assert.equal(doc.getElementById('guide-link').href, 'https://extension.test/guide.html');
      assert.equal(doc.getElementById('guide-link').hidden, false);
      assert.equal(messages.some((message) => ['OPE_TOGGLE_ACTIVE','OPE_SET_PREFERENCES'].includes(message.type)), false);
    } finally { dom.window.close(); }
  }
});
