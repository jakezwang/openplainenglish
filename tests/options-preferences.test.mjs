import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { JSDOM } from 'jsdom';
import { build } from 'esbuild';
import { translated } from '../src/options/i18n.js';
import { DEFAULT_PREFERENCES } from '../src/shared/preferences.js';

const pause = () => new Promise((resolve) => setTimeout(resolve, 15));
async function harness({ clipboardFails = false, language = 'zh-CN', destination = { schemaVersion:1, email:null } } = {}) {
  const html = await readFile(new URL('../src/options/options.html', import.meta.url), 'utf8');
  const bundle = await build({ entryPoints: [new URL('../src/options/options.js', import.meta.url).pathname], bundle: true, format: 'iife', write: false });
  const dom = new JSDOM(html, { runScripts: 'outside-only', url: 'https://extension.test/options.html#feedback' });
  const draft = { id: 'draft-1', entryId: 'x', term: 'Delete', kind: 'unclear', note: 'Delete', createdAt: '2026-10-13T00:00:00.000Z', lexiconVersion: '0.3.0' };
  let preferences = { ...DEFAULT_PREFERENCES, language };
  const calls = [], copied = [], downloads = [], blobs = [], fetches = [];
  dom.window.chrome = {
    runtime: { getURL:(path) => `https://extension.test/${path}`, sendMessage: async (message) => {
      calls.push(message);
      if (message.type === 'OPE_GET_PREFERENCES') return { ok: true, preferences };
      if (message.type === 'OPE_SET_PREFERENCES') { preferences = { ...preferences, ...message.preferences }; return { ok: true, preferences }; }
      if (message.type === 'OPE_GET_LEXICON') return { ok: true, lexicon: { version: '0.4.0', entries: [] } };
      throw new Error('Unexpected write');
    } },
    storage: { local: { get: async () => ({ opeFeedback: [draft] }) }, onChanged: { addListener() {} } },
  };
  Object.defineProperty(dom.window.navigator, 'clipboard', { value: { writeText: async (text) => { if (clipboardFails) throw new Error(); copied.push(text); } } });
  dom.window.URL.createObjectURL = (blob) => { blobs.push(blob); return 'blob:local-report'; };
  dom.window.URL.revokeObjectURL = () => {};
  dom.window.HTMLAnchorElement.prototype.click = function () { downloads.push({ href: this.href, filename: this.download }); };
  dom.window.HTMLDialogElement.prototype.showModal = function () { this.setAttribute('open', ''); };
  dom.window.HTMLDialogElement.prototype.close = function () { this.removeAttribute('open'); this.dispatchEvent(new dom.window.Event('close')); };
  dom.window.fetch = async (url, options) => {
    fetches.push(url);
    assert.equal(url, 'https://extension.test/data/feedback-config.json');
    assert.equal(options, undefined);
    return { ok:true, json:async () => destination };
  };
  dom.window.open = () => assert.fail('No automatic external navigation');
  dom.window.eval(bundle.outputFiles[0].text);
  await pause();
  return { dom, calls, copied, downloads, blobs, fetches };
}

test('Chinese feedback controls and preferences preserve user-authored text and round-trip to English', async () => {
  const { dom, calls } = await harness();
  try {
    const doc = dom.window.document;
    assert.equal(doc.documentElement.lang, 'zh-CN');
    assert.equal(doc.querySelector('.draft-note').textContent, 'Delete');
    assert.equal(doc.querySelector('.draft-heading h3').textContent, 'Delete');
    assert.equal(doc.getElementById('import-feedback').textContent, '导入 JSON');
    assert.match(doc.getElementById('save-feedback').textContent, /保存本机草稿/);
    doc.getElementById('preference-density').value = 'compact';
    doc.getElementById('preference-highlight').value = 'strong';
    doc.getElementById('preference-mode').value = 'annotate';
    doc.getElementById('preference-language').value = 'en';
    doc.getElementById('preference-includeFrames').checked = true;
    doc.getElementById('preferences-form').dispatchEvent(new dom.window.Event('submit', { cancelable: true }));
    await pause();
    assert.equal(doc.documentElement.lang, 'en');
    assert.equal(doc.body.dataset.density, 'compact');
    assert.equal(doc.getElementById('import-feedback').textContent, 'Import JSON');
    assert.equal(calls.at(-1).preferences.mode, 'annotate');
    assert.equal(calls.at(-1).preferences.includeFrames, true);
    assert.equal(calls.at(-1).preferences.includeShadowRoots, false);
    assert.equal(Object.hasOwn(calls.at(-1).preferences, 'guideCompleted'), false);
    assert.equal(calls.some((message) => message.type === 'OPE_SAVE_FEEDBACK'), false);
  } finally { dom.window.close(); }
});

test('configured email requires review and shows the exact destination, subject and body', async () => {
  const { dom, fetches } = await harness({ destination:{ schemaVersion:1, email:'feedback@example.org' } });
  try {
    const doc = dom.window.document;
    assert.equal(doc.getElementById('open-email').getAttribute('href'), null);
    const trigger = doc.querySelector('.draft-actions button'); trigger.focus(); trigger.click();
    const email = doc.getElementById('open-email');
    assert.equal(email.hidden, false);
    assert.equal(doc.getElementById('email-destination').hidden, false);
    assert.equal(doc.getElementById('email-unavailable').hidden, true);
    const url = new URL(email.href);
    assert.equal(url.pathname, doc.getElementById('mail-recipient').textContent);
    assert.equal(url.searchParams.get('subject'), doc.getElementById('mail-subject').textContent);
    assert.equal(url.searchParams.get('body'), doc.getElementById('share-preview').value);
    assert.equal(url.href.includes('extension.test'), false);
    assert.deepEqual(fetches, ['https://extension.test/data/feedback-config.json']);
    doc.getElementById('cancel-share').click();
    assert.equal(doc.activeElement, trigger);
  } finally { dom.window.close(); }
});

test('unconfigured or invalid owner email keeps account-free local report actions available', async () => {
  for (const destination of [{ schemaVersion:1, email:null }, { schemaVersion:1, email:'a@example.org?bcc=b@example.org' }, { schemaVersion:1, email:'a@example.org', endpoint:'https://bad.test' }]) {
    const { dom, copied } = await harness({ destination });
    try {
      const doc = dom.window.document;
      doc.querySelector('.draft-actions button').click();
      assert.equal(doc.getElementById('email-unavailable').hidden, false);
      assert.equal(doc.getElementById('open-email').hidden, true);
      assert.equal(doc.getElementById('open-email').getAttribute('href'), null);
      doc.getElementById('copy-report').click(); await pause();
      assert.deepEqual(copied, [doc.getElementById('share-preview').value]);
    } finally { dom.window.close(); }
  }
});

test('copy and single-report download occur only after review and include exactly reviewed text', async () => {
  const { dom, calls, copied, downloads, blobs } = await harness();
  try {
    const doc = dom.window.document;
    doc.getElementById('copy-report').click();
    doc.getElementById('download-report').click();
    await pause();
    assert.equal(copied.length, 0);
    assert.equal(downloads.length, 0);
    doc.querySelector('.draft-actions button').click();
    assert.equal(doc.getElementById('share-dialog').open, true);
    const text = doc.getElementById('share-preview').value;
    assert.equal(text.includes('extension.test'), false);
    assert.equal(text.includes('draft-1'), false);
    assert.equal(copied.length, 0);
    doc.getElementById('copy-report').click();
    await pause();
    assert.deepEqual(copied, [text]);
    doc.getElementById('download-report').click();
    assert.equal(downloads[0].filename, 'openplainenglish-feedback-report.txt');
    assert.equal(blobs[0].type, 'text/plain;charset=utf-8');
    assert.equal(calls.some((message) => !['OPE_GET_LEXICON', 'OPE_GET_PREFERENCES'].includes(message.type)), false);
    assert.equal(new URL(doc.getElementById('open-issue').href).searchParams.get('body'), text);
  } finally { dom.window.close(); }
});

test('clipboard refusal keeps review open and selects text for manual copying', async () => {
  const { dom } = await harness({ clipboardFails: true });
  try {
    const doc = dom.window.document;
    doc.querySelector('.draft-actions button').click();
    doc.getElementById('copy-report').click();
    await pause();
    const text = doc.getElementById('share-preview');
    assert.equal(doc.getElementById('share-dialog').open, true);
    assert.equal(text.selectionStart, 0);
    assert.equal(text.selectionEnd, text.value.length);
    assert.match(doc.getElementById('share-status').textContent, /已选中/);
  } finally { dom.window.close(); }
});


test('singular and plural dynamic search results localize without changing authored values', () => {
  assert.equal(translated('1 match in 112 health terms', 'zh-CN'), '112 个健康词条中找到 1 项');
  assert.equal(translated('2 matches in 112 health terms', 'zh-CN'), '112 个健康词条中找到 2 项');
  assert.equal(translated('112 health terms, ready to explore', 'zh-CN'), '112 个健康词条');
});
