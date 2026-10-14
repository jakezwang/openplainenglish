import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import vm from 'node:vm';
import { webcrypto } from 'node:crypto';
import { build } from 'esbuild';
import { JSDOM } from 'jsdom';

// Bundle in memory: this exercises shipped IIFEs without writing shared dist/
// or claiming to emulate Chrome's permission grant or native extension host.
const root = fileURLToPath(new URL('../', import.meta.url));
const lexicon = JSON.parse(await readFile(path.join(root, 'data/health.json'), 'utf8'));
const codes = Object.fromEntries(await Promise.all(['background/main', 'content/index', 'popup/popup'].map(async (entry) => {
  const result = await build({ absWorkingDir: root, entryPoints: [`src/${entry}.js`], bundle: true, format: 'iife', platform: 'browser', write: false, target: 'chrome116' });
  return [entry, result.outputFiles[0].text];
})));
const popupHTML = await readFile(path.join(root, 'src/popup/popup.html'), 'utf8');

async function eventually(condition) {
  const deadline = Date.now() + 1500;
  while (Date.now() < deadline) {
    if (condition()) return;
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
  assert.ok(condition(), 'the message flow should complete');
}

function runtime(t) {
  const id = 'openplainenglish-test';
  const page = new JSDOM('<!doctype html><html lang="en"><body><p>Hypertension and biopsy are health terms.</p></body></html>', { url: 'https://public.example/reading', runScripts: 'outside-only', pretendToBeVisual: true });
  const popup = new JSDOM(popupHTML, { url: `https://${id}.invalid/popup.html`, runScripts: 'outside-only', pretendToBeVisual: true });
  const closePopup = popup.window.close.bind(popup.window);
  const stored = { opeFeedback: [] };
  const opened = [];
  const fetched = [];
  const contentListeners = [];
  let backgroundListener;
  let injections = 0;
  let popupClosed = false;
  function dispatch(listener, message, sender) {
    return new Promise((resolve, reject) => {
      if (!listener) { reject(new Error('Receiving end does not exist')); return; }
      let replied = false;
      const waiting = listener(message, sender, (result) => { replied = true; resolve(result); });
      if (!waiting && !replied) reject(new Error('Receiving end does not exist'));
    });
  }
  const runtimeAPI = { id, getURL: (relative) => `chrome-extension://${id}/${relative}` };
  const chrome = {
    runtime: { ...runtimeAPI, onMessage: { addListener: (listener) => { backgroundListener = listener; } } },
    tabs: {
      query: async () => [{ id: 7, url: page.window.location.href }],
      sendMessage: async (_tab, message) => dispatch(contentListeners[0], message, { id }),
      create: async (options) => { opened.push(options.url); return { id: 8 }; },
    },
    scripting: { executeScript: async ({ target, files }) => {
      assert.equal(target.tabId, 7);
      assert.deepEqual(Array.from(files), ['content.js']);
      injections++;
      vm.runInContext(codes['content/index'], page.getInternalVMContext());
      return [{ documentId: 'current-document' }];
    } },
    storage: { local: { get: async () => structuredClone(stored), set: async (data) => Object.assign(stored, structuredClone(data)) } },
  };
  const background = vm.createContext({ chrome, crypto: webcrypto, URL, URLSearchParams, TextEncoder, console,
    fetch: async (url) => { fetched.push(url); assert.equal(url, runtimeAPI.getURL('data/health.json')); return { ok: true, json: async () => structuredClone(lexicon) }; },
  });
  vm.runInContext(codes['background/main'], background);
  const send = (message) => dispatch(backgroundListener, message, { id });
  page.window.chrome = { runtime: { ...runtimeAPI, onMessage: { addListener: (listener) => contentListeners.push(listener) }, sendMessage: send } };
  popup.window.chrome = { runtime: { ...runtimeAPI, sendMessage: send } };
  popup.window.close = () => { popupClosed = true; };
  vm.runInContext(codes['popup/popup'], popup.getInternalVMContext());
  t.after(async () => {
    if (contentListeners.length) await dispatch(contentListeners[0], { type: 'OPE_DISABLE' }, { id });
    page.window.close();
    closePopup();
  });
  return { page, popup, stored, opened, fetched, send, contentListeners,
    listener: () => backgroundListener, injections: () => injections, closed: () => popupClosed,
    inject: () => chrome.scripting.executeScript({ target: { tabId: 7 }, files: ['content.js'] }),
  };
}

test('bundled popup activation reaches content, explanation feedback and background using only local data', async (t) => {
  const app = runtime(t);
  const document = app.popup.window.document;
  await eventually(() => !document.getElementById('toggle').disabled);
  assert.equal(app.injections(), 0);
  assert.equal(app.fetched.length, 0);
  document.getElementById('toggle').click();
  await eventually(() => document.getElementById('toggle').getAttribute('aria-pressed') === 'true');
  assert.equal(app.page.window.document.querySelectorAll('[data-ope-term]').length, 2);
  assert.equal(app.page.window.document.querySelector('p').textContent, 'High blood pressure and biopsy are health terms.');
  const active = await app.send({ type: 'OPE_GET_ACTIVE_STATE' });
  assert.equal(active.state.mode, 'plain');
  assert.equal(active.state.replacedCount, 1);
  assert.equal(active.state.annotatedCount, 1);
  assert.equal(app.injections(), 1);
  assert.equal(app.fetched.length, 1);
  document.getElementById('first').click();
  await eventually(() => app.closed());
  const shadow = app.page.window.document.querySelector('[data-ope-owned="panel"]').shadowRoot;
  [...shadow.querySelectorAll('button')].find((button) => /hard to understand/i.test(button.textContent)).click();
  await eventually(() => app.opened.length === 1);
  assert.match(app.opened[0], /^chrome-extension:\/\/openplainenglish-test\/options.html#feedback\?/);
  assert.equal(app.opened[0].includes('public.example'), false);
  const entryId = app.page.window.document.querySelector('[data-ope-term]').dataset.opeTerm;
  const saved = await app.send({ type: 'OPE_SAVE_FEEDBACK', feedback: { entryId, kind: 'unclear', note: 'Please make the wording clearer.', pageUrl: 'private', pageText: 'private' } });
  assert.equal(saved.ok, true);
  assert.equal(app.stored.opeFeedback.length, 1);
  assert.equal(JSON.stringify(app.stored).includes('private'), false);
  await app.send({ type: 'OPE_TOGGLE_ACTIVE' });
  assert.equal(app.page.window.document.querySelector('[data-ope-owned]'), null);
  assert.equal(app.page.window.document.querySelector('p').textContent, 'Hypertension and biopsy are health terms.');
});

test('bundled mode controls switch the actual page in place and restore the exact current source text', async (t) => {
  const app = runtime(t);
  const popup = app.popup.window.document;
  const paragraph = app.page.window.document.querySelector('p');
  const source = paragraph.textContent;
  await eventually(() => !popup.getElementById('toggle').disabled);
  popup.getElementById('mode-annotate').click();
  await eventually(() => !popup.getElementById('toggle').disabled);
  assert.equal(app.injections(), 0, 'choosing a mode while off does not access page content');
  assert.equal(paragraph.textContent, source);
  popup.getElementById('toggle').click();
  await eventually(() => popup.getElementById('toggle').getAttribute('aria-pressed') === 'true');
  assert.equal(paragraph.textContent, source);
  assert.equal((await app.send({ type: 'OPE_GET_ACTIVE_STATE' })).state.mode, 'annotate');
  popup.getElementById('mode-plain').click();
  await eventually(() => paragraph.textContent.startsWith('High blood pressure'));
  assert.equal(app.injections(), 1);
  const beforeInvalid = paragraph.innerHTML;
  assert.equal((await app.send({ type: 'OPE_SET_MODE_ACTIVE', mode: 'translate-all' })).ok, false);
  assert.equal(paragraph.innerHTML, beforeInvalid);
  popup.getElementById('mode-annotate').click();
  await eventually(() => paragraph.textContent === source);
  popup.getElementById('mode-plain').click();
  await eventually(() => paragraph.textContent.startsWith('High blood pressure'));
  const changed = app.page.window.document.createElement('p');
  changed.textContent = 'hypertension appears in newly loaded text.';
  paragraph.after(changed);
  await eventually(() => changed.textContent === 'high blood pressure appears in newly loaded text.');
  // Site changes before the observer callback must win over the stored original.
  paragraph.querySelector('[data-ope-term]').textContent = 'Updated by the website';
  await app.send({ type: 'OPE_TOGGLE_ACTIVE' });
  assert.equal(paragraph.textContent, 'Updated by the website and biopsy are health terms.');
  assert.equal(changed.textContent, 'hypertension appears in newly loaded text.');
  assert.equal(app.page.window.document.querySelector('[data-ope-owned]'), null);
});

test('bundled message listeners reject foreign/malformed calls and recover after invalid enable data', async (t) => {
  const app = runtime(t);
  await eventually(() => !app.popup.window.document.getElementById('toggle').disabled);
  const background = app.listener();
  for (const message of [null, { type: 1 }, { type: {} }]) assert.equal(background(message, { id: 'openplainenglish-test' }, () => assert.fail('invalid messages must not respond')), false);
  assert.equal(background({ type: 'OPE_SAVE_FEEDBACK' }, { id: 'foreign-extension' }, () => assert.fail('foreign senders must not respond')), false);
  await app.inject();
  await app.inject();
  assert.equal(app.contentListeners.length, 1, 'reinjection must not register another listener');
  const listener = app.contentListeners[0];
  assert.equal(listener({ type: 1 }, { id: 'openplainenglish-test' }, () => assert.fail('malformed command')), false);
  assert.equal(listener({ type: 'OPE_ENABLE', entries: lexicon.entries }, { id: 'foreign-extension' }, () => assert.fail('foreign sender')), false);
  let response;
  listener({ type: 'OPE_ENABLE', entries: [null] }, { id: 'openplainenglish-test' }, (result) => { response = result; });
  assert.equal(response.ok, false);
  assert.equal(app.page.window.document.querySelector('[data-ope-owned]'), null);
  listener({ type: 'OPE_ENABLE', entries: lexicon.entries }, { id: 'openplainenglish-test' }, (result) => { response = result; });
  assert.equal(response.ok, true);
  assert.equal(response.state.count, 2);
  const activeText = app.page.window.document.querySelector('p').textContent;
  listener({ type: 'OPE_SET_MODE', mode: 'unsafe' }, { id: 'openplainenglish-test' }, (result) => { response = result; });
  assert.equal(response.ok, false);
  assert.equal(app.page.window.document.querySelector('p').textContent, activeText);
});
