import test from 'node:test';
import assert from 'node:assert/strict';
import { createActions, isSupportedUrl } from '../src/background/actions.js';

const lexicon = { version: '0.1.0', entries: [{ id: 'hypertension', term: 'hypertension' }] };
function mockBrowser() {
  const calls = [];
  const saved = { opeFeedback: [] };
  let current = { enabled: false, count: 0, truncated: false };
  const api = {
    runtime: { getURL: (path) => `chrome-extension://test/${path}` },
    tabs: {
      query: async () => [{ id: 7, url: 'https://example.org/health' }],
      sendMessage: async (id, message, options) => {
        calls.push({ id, message, options });
        if (message.type === 'OPE_ENABLE') current = { enabled: true, count: 2, truncated: false };
        if (message.type === 'OPE_DISABLE') current = { enabled: false, count: 0, truncated: false };
        return { ok: true, state: current };
      },
      create: async (options) => calls.push({ opened: options.url }),
    },
    scripting: { executeScript: async (options) => { calls.push({ injection: options }); return [{ documentId: 'current-document' }]; } },
    storage: { local: {
      get: async () => structuredClone(saved),
      set: async (data) => { Object.assign(saved, structuredClone(data)); },
    } },
  };
  return { api, saved, calls, actions: createActions(api, async () => lexicon) };
}

test('supported pages exclude browser pages, local files, and extension stores', () => {
  for (const value of ['chrome://settings', 'about:blank', 'file:///tmp/a.html', 'https://chromewebstore.google.com/detail/test', 'https://chrome.google.com/webstore/detail/test', 'https://microsoftedge.microsoft.com/addons/detail/test', 'javascript:alert(1)', 'invalid']) assert.equal(isSupportedUrl(value), false, value);
  assert.equal(isSupportedUrl('https://example.org'), true);
  assert.equal(isSupportedUrl('http://127.0.0.1:4173/'), true);
});

test('opening the popup only reads state; enabling injects current-tab code and local entries', async () => {
  const { actions, calls } = mockBrowser();
  assert.equal((await actions.handle({ type: 'OPE_GET_ACTIVE_STATE' })).state.enabled, false);
  assert.equal(calls.some((call) => call.injection), false);
  const result = await actions.handle({ type: 'OPE_TOGGLE_ACTIVE' });
  assert.equal(result.state.enabled, true);
  const injection = calls.find((call) => call.injection).injection;
  assert.deepEqual(injection.target, { tabId: 7 });
  const enable = calls.find((call) => call.message?.type === 'OPE_ENABLE');
  assert.equal(enable.options.documentId, 'current-document');
  assert.deepEqual(enable.message.entries, lexicon.entries);
  assert.equal((await actions.handle({ type: 'OPE_TOGGLE_ACTIVE' })).state.enabled, false);
  assert.equal(calls.filter((call) => call.injection).length, 1);
});

test('page without installed listener is off; unsupported page returns actionable error', async () => {
  const { api, actions } = mockBrowser();
  api.tabs.sendMessage = async () => { throw new Error('Receiving end does not exist'); };
  assert.equal((await actions.handle({ type: 'OPE_GET_ACTIVE_STATE' })).state.enabled, false);
  api.tabs.query = async () => [{ id: 7, url: 'chrome://extensions' }];
  await assert.rejects(actions.handle({ type: 'OPE_TOGGLE_ACTIVE' }), /regular web page/);
});

test('feedback opens only a known glossary entry, without page information', async () => {
  const { actions, calls } = mockBrowser();
  await actions.handle({ type: 'OPE_OPEN_FEEDBACK', entryId: 'hypertension', kind: 'unclear', pageUrl: 'https://private.example/' });
  assert.equal(calls[0].opened, 'chrome-extension://test/options.html#feedback?entry=hypertension&kind=unclear');
  await assert.rejects(actions.handle({ type: 'OPE_OPEN_FEEDBACK', entryId: '../secrets', kind: 'unclear' }), /Choose a term/);
  await assert.rejects(actions.handle({ type: 'OPE_OPEN_FEEDBACK', entryId: 'hypertension', kind: 'malicious' }), /Choose a term/);
});

test('feedback saves authoritative term/version and new identity, strips metadata, and permits new-term suggestions', async () => {
  const { actions, saved } = mockBrowser();
  await actions.handle({ type: 'OPE_SAVE_FEEDBACK', feedback: { entryId: 'hypertension', term: 'forged', kind: 'inaccurate', note: 'Please clarify the context.', id: 'forged', lexiconVersion: 'forged', pageUrl: 'private', pageText: 'private' } });
  const record = saved.opeFeedback[0];
  assert.equal(record.term, 'hypertension');
  assert.equal(record.lexiconVersion, '0.1.0');
  assert.notEqual(record.id, 'forged');
  assert.equal('pageUrl' in record, false);
  assert.equal('pageText' in record, false);
  await actions.handle({ type: 'OPE_SAVE_FEEDBACK', feedback: { entryId: '', term: 'new word', kind: 'suggestion', note: 'Please add a sourced explanation.' } });
  assert.equal(saved.opeFeedback[1].term, 'new word');
  await assert.rejects(actions.handle({ type: 'OPE_SAVE_FEEDBACK', feedback: { entryId: 'unknown', term: 'unknown', kind: 'inaccurate', note: 'x' } }), /not in the current lexicon/);
});

test('concurrent feedback writes preserve drafts and retain only the newest 100', async () => {
  const { actions, saved } = mockBrowser();
  await Promise.all(Array.from({ length: 105 }, (_, index) => actions.handle({ type: 'OPE_SAVE_FEEDBACK', feedback: { entryId: 'hypertension', kind: 'unclear', note: `Draft ${index}` } })));
  assert.equal(saved.opeFeedback.length, 100);
  assert.equal(saved.opeFeedback[0].note, 'Draft 5');
  assert.equal(saved.opeFeedback.at(-1).note, 'Draft 104');
  assert.equal(new Set(saved.opeFeedback.map((record) => record.id)).size, 100);
});

test('deletes share the write queue with saves, including clearing and saving again', async () => {
  const { actions, saved } = mockBrowser();
  const first = await actions.handle({ type: 'OPE_SAVE_FEEDBACK', feedback: { entryId: 'hypertension', kind: 'unclear', note: 'First draft' } });
  await Promise.all([
    actions.handle({ type: 'OPE_DELETE_FEEDBACK', id: first.feedback.id }),
    actions.handle({ type: 'OPE_SAVE_FEEDBACK', feedback: { entryId: 'hypertension', kind: 'unclear', note: 'Second draft' } }),
  ]);
  assert.deepEqual(saved.opeFeedback.map((record) => record.note), ['Second draft']);
  await Promise.all([
    actions.handle({ type: 'OPE_DELETE_FEEDBACK', id: null }),
    actions.handle({ type: 'OPE_SAVE_FEEDBACK', feedback: { entryId: 'hypertension', kind: 'unclear', note: 'After clearing' } }),
  ]);
  assert.deepEqual(saved.opeFeedback.map((record) => record.note), ['After clearing']);
  await assert.rejects(actions.handle({ type: 'OPE_DELETE_FEEDBACK', id: '' }), /Choose a draft/);
});

const backupRecord = (id = 'backup-1') => ({
  id, entryId: 'older-glossary-term', term: 'An older term', kind: 'suggestion', note: 'Keep this draft.',
  createdAt: '2020-01-01T00:00:00.000Z', lexiconVersion: '0.1.0',
});
const backup = (feedback) => JSON.stringify({ schemaVersion: 1, feedback });

test('malformed messages and oversized feedback fail without changing storage', async () => {
  const { actions, saved } = mockBrowser();
  for (const message of [null, [], 1, { type: 1 }, { type: 'OPE_SAVE_FEEDBACK', feedback: null }, { type: 'OPE_SAVE_FEEDBACK', feedback: { entryId: 'hypertension', kind: 'unknown', note: 'x' } }, { type: 'OPE_SAVE_FEEDBACK', feedback: { entryId: 'hypertension', kind: 'unclear', note: 'x'.repeat(2001) } }]) {
    await assert.rejects(actions.handle(message));
    assert.deepEqual(saved.opeFeedback, []);
  }
});

test('imports are revalidated atomically, retain historical metadata, and preserve existing identities', async () => {
  const { actions, saved } = mockBrowser();
  saved.opeFeedback = [backupRecord('existing')];
  const before = structuredClone(saved.opeFeedback);
  await assert.rejects(actions.handle({ type: 'OPE_IMPORT_FEEDBACK', json: backup([{ ...backupRecord(), pageUrl: 'https://private.example/' }]) }), /unsupported fields/);
  assert.deepEqual(saved.opeFeedback, before);
  const result = await actions.handle({ type: 'OPE_IMPORT_FEEDBACK', json: backup([{ ...backupRecord('existing'), note: 'Must not overwrite.' }, backupRecord('new')]) });
  assert.equal(result.importedCount, 1);
  assert.equal(result.duplicateCount, 1);
  assert.equal(result.totalCount, 2);
  assert.equal('feedback' in result, false, 'the response needs counts rather than draft contents');
  assert.equal(saved.opeFeedback.find((record) => record.id === 'existing').note, 'Keep this draft.');
  assert.equal(saved.opeFeedback.find((record) => record.id === 'new').entryId, 'older-glossary-term');
  assert.equal(saved.opeFeedback.find((record) => record.id === 'new').lexiconVersion, '0.1.0');
});

test('import, delete and save operations share one queue', async () => {
  const { actions, saved } = mockBrowser();
  await Promise.all([
    actions.handle({ type: 'OPE_IMPORT_FEEDBACK', json: backup([backupRecord()]) }),
    actions.handle({ type: 'OPE_DELETE_FEEDBACK', id: null }),
    actions.handle({ type: 'OPE_SAVE_FEEDBACK', feedback: { entryId: 'hypertension', kind: 'unclear', note: 'Saved after clearing.' } }),
  ]);
  assert.deepEqual(saved.opeFeedback.map((record) => record.note), ['Saved after clearing.']);
});

test('a storage failure does not poison later queued writes', async () => {
  const { actions, api, saved } = mockBrowser();
  const set = api.storage.local.set;
  let fail = true;
  api.storage.local.set = async (data) => {
    if (fail) { fail = false; throw new Error('Storage unavailable'); }
    return set(data);
  };
  await assert.rejects(actions.handle({ type: 'OPE_SAVE_FEEDBACK', feedback: { entryId: 'hypertension', kind: 'unclear', note: 'Unstored.' } }), /Storage unavailable/);
  await actions.handle({ type: 'OPE_SAVE_FEEDBACK', feedback: { entryId: 'hypertension', kind: 'unclear', note: 'Stored.' } });
  assert.deepEqual(saved.opeFeedback.map((record) => record.note), ['Stored.']);
});

test('a write cleans malformed legacy storage and strips unsupported record metadata', async () => {
  const { actions, saved } = mockBrowser();
  saved.opeFeedback = [null, { bad: true }, { ...backupRecord('valid'), pageUrl: 'private', pageText: 'private' }];
  await actions.handle({ type: 'OPE_SAVE_FEEDBACK', feedback: { entryId: 'hypertension', kind: 'unclear', note: 'New note.' } });
  assert.equal(saved.opeFeedback.length, 2);
  assert.equal(JSON.stringify(saved.opeFeedback).includes('private'), false);
});

test('missing active-tab access asks for a toolbar invocation without guessing a URL or injecting', async () => {
  const { actions, api, calls } = mockBrowser();
  api.tabs.query = async () => [{ id: 7 }];
  await assert.rejects(actions.handle({ type: 'OPE_TOGGLE_ACTIVE' }), /browser toolbar/);
  assert.equal(calls.length, 0);
  api.tabs.query = async () => [{ id: -1, url: 'https://example.org/' }];
  await assert.rejects(actions.handle({ type: 'OPE_TOGGLE_ACTIVE' }), /regular web page/);
  api.tabs.query = async () => [{ id: 0, url: 'https://example.org/' }];
  assert.equal((await actions.handle({ type: 'OPE_GET_ACTIVE_STATE' })).state.enabled, false);
});
