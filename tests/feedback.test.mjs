import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { JSDOM } from 'jsdom';
import { build } from 'esbuild';
import {
  sanitizeFeedback, createFeedback, createFeedbackIssueBody, createFeedbackIssueUrl, FEEDBACK_LIMIT,
  parseFeedbackImport, mergeFeedbackRecords, FEEDBACK_IMPORT_MAX_BYTES, FEEDBACK_IMPORT_MAX_RECORDS,
} from '../src/shared/feedback.js';

const sample = {
  id: 'draft-1',
  entryId: 'gastritis',
  term: 'gastritis',
  kind: 'unclear',
  note: 'Could you explain the word “lining”?',
  createdAt: '2026-10-13T12:00:00.000Z',
  lexiconVersion: '0.1.0',
};
const backup = (feedback) => JSON.stringify({ schemaVersion: 1, feedback });

test('v1 JSON exports round-trip without losing draft identity or old glossary metadata', () => {
  const record = { ...sample, entryId: 'retired-entry', lexiconVersion: '0.1.0' };
  assert.deepEqual(parseFeedbackImport(backup([record])), [record]);
  assert.deepEqual(parseFeedbackImport(backup([])), []);
});

test('import rejects invalid schema, unknown private fields, unsafe formatting and invalid entries atomically', () => {
  for (const invalid of [
    'not JSON', '[]', JSON.stringify({ schemaVersion: 2, feedback: [] }),
    JSON.stringify({ schemaVersion: 1, feedback: [], pageUrl: 'private' }),
    backup([{ ...sample, pageUrl: 'https://private.example' }]),
    backup([{ ...sample, note: { body: 'private' } }]),
    backup([{ ...sample, kind: 'other' }]),
    backup([{ ...sample, createdAt: '2026-02-31T12:00:00Z' }]),
    backup([{ ...sample, entryId: '../private' }]),
    backup([{ ...sample, term: 'A'.repeat(121) }]),
    backup([{ ...sample, note: 'hidden\u202econtent' }]),
    backup([sample, { ...sample, id: '' }]),
  ]) assert.throws(() => parseFeedbackImport(invalid), { name: /TypeError|RangeError/ });
});

test('import limits bound UTF-8 bytes and record count', () => {
  assert.throws(() => parseFeedbackImport(' '.repeat(FEEDBACK_IMPORT_MAX_BYTES + 1)), /too large/);
  const unicode = `"${'🫀'.repeat(FEEDBACK_IMPORT_MAX_BYTES / 3)}"`;
  assert.ok(unicode.length < FEEDBACK_IMPORT_MAX_BYTES);
  assert.throws(() => parseFeedbackImport(unicode), /too large/);
  assert.throws(() => parseFeedbackImport(backup(Array.from({ length: FEEDBACK_IMPORT_MAX_RECORDS + 1 }, () => sample))), /at most 1,000/);
});

test('merge preserves local identity, deduplicates imports and never propagates extra metadata', () => {
  const existing = [{ ...sample, pageUrl: 'private' }];
  const imported = [{ ...sample, note: 'Must not overwrite local note' }, { ...sample, id: 'new' }, { ...sample, id: 'new', note: 'Later duplicate' }];
  const result = mergeFeedbackRecords(existing, imported);
  assert.equal(result.importedCount, 1);
  assert.equal(result.duplicateCount, 2);
  assert.equal(result.totalCount, 2);
  assert.deepEqual(result.feedback.find((item) => item.id === sample.id), sample);
  assert.equal(result.feedback.find((item) => item.id === 'new').note, sample.note);
  assert.equal(JSON.stringify(result).includes('private'), false);
  assert.equal(existing.length, 1);
  assert.equal(imported.length, 3);
});

test('merge retains newest 100 predictably and reports local and imported records left out', () => {
  const rows = Array.from({ length: 102 }, (_, index) => ({
    ...sample, id: `id-${String(index).padStart(3, '0')}`, createdAt: new Date(Date.UTC(2026, 0, 1, 0, index)).toISOString(),
  }));
  const result = mergeFeedbackRecords([rows[0]], rows.slice(1));
  assert.equal(result.totalCount, 100);
  assert.equal(result.importedCount, 100);
  assert.equal(result.discardedCount, 2);
  assert.equal(result.localDiscardedCount, 1);
  assert.equal(result.importDiscardedCount, 1);
  assert.equal(result.feedback[0].id, 'id-002');
  assert.equal(result.feedback.at(-1).id, 'id-101');
  const equalDates = rows.map((record) => ({ ...record, createdAt: sample.createdAt }));
  const tied = mergeFeedbackRecords([], [...equalDates].reverse());
  assert.equal(tied.feedback.some((record) => record.id === 'id-101'), false);
  assert.equal(tied.feedback.some((record) => record.id === 'id-000'), true);
  assert.deepEqual(tied.feedback, mergeFeedbackRecords([], equalDates).feedback);
});

test('feedback allowlist excludes browser metadata and arbitrary nested data', () => {
  const actual = sanitizeFeedback({
    ...sample,
    pageUrl: 'https://private.example/patient/123',
    url: 'https://private.example',
    pageTitle: 'Patient medical record',
    pageText: 'Private health information',
    context: { html: '<p>Private health information</p>' },
  });
  assert.deepEqual(actual, sample);
  assert.equal(JSON.stringify(actual).includes('private'), false);
});

test('sanitization handles hostile types without stringifying user objects', () => {
  const actual = sanitizeFeedback({ term: { toString() { throw new Error('must not execute'); } }, note: ['private'], kind: 'page-upload', createdAt: 42 });
  assert.equal(actual.term, '');
  assert.equal(actual.note, '');
  assert.equal(actual.kind, 'unclear');
  assert.equal(actual.createdAt, '');
  assert.deepEqual(sanitizeFeedback(null), sanitizeFeedback([]));
});

test('text sanitization removes invisible control and bidi characters while preserving paragraphs', () => {
  const actual = sanitizeFeedback({ ...sample, term: '  blood\n  pressure\u202e\u200b  ', note: 'One\r\nTwo\u0000\u2066\u2069\u001b\nThree' });
  assert.equal(actual.term, 'blood pressure');
  assert.equal(actual.note, 'One\nTwo\nThree');
});

test('length limits preserve complete Unicode code points and do not mutate inputs', () => {
  const source = { ...sample, term: '🫀'.repeat(130), note: 'A'.repeat(2100), lexiconVersion: 'x'.repeat(50) };
  const actual = sanitizeFeedback(source);
  assert.equal(Array.from(actual.term).length, 120);
  assert.equal(actual.note.length, 2000);
  assert.equal(actual.lexiconVersion.length, 40);
  assert.equal(source.note.length, 2100);
  assert.equal(actual.term.endsWith('🫀'), true);
  assert.equal(FEEDBACK_LIMIT, 100);
});

test('createFeedback requires explicit valid identity, date, term and note', () => {
  const { id, createdAt, ...input } = sample;
  assert.deepEqual(createFeedback(input, { id, createdAt }), sample);
  for (const bad of [{ id: '' }, { createdAt: 'not a date' }, { note: '  ' }, { term: '' }, { kind: 'page-upload' }]) {
    assert.throws(() => createFeedback({ ...sample, ...bad }), TypeError);
  }
  assert.equal(sanitizeFeedback({ ...sample, id: '../private?key=value' }).id, '');
  assert.equal(sanitizeFeedback({ ...sample, createdAt: '2026-99-99T12:00:00Z' }).createdAt, '');
  assert.equal(sanitizeFeedback({ ...sample, createdAt: '2026-02-31T12:00:00Z' }).createdAt, '');
});

test('GitHub issue URL is pinned and encodes text without injecting URL parameters', () => {
  const feedback = { ...sample, term: 'A & B #?=中文', note: 'Why?\n&assignee=someone&labels=urgent\nhttps://example.org/?a=b#c' };
  const url = new URL(createFeedbackIssueUrl(feedback));
  assert.equal(url.origin, 'https://github.com');
  assert.equal(url.pathname, '/jakezwang/openplainenglish/issues/new');
  assert.equal(url.hash, '');
  assert.deepEqual([...url.searchParams.keys()], ['title', 'body']);
  assert.equal(url.searchParams.get('title'), '[unclear] A & B #?=中文');
  assert.equal(url.searchParams.get('body'), createFeedbackIssueBody(feedback));
  assert.ok(url.searchParams.get('body').includes(feedback.note));
});

test('sharing includes only reviewed fields and omits draft ID and creation time', () => {
  const body = createFeedbackIssueBody({ ...sample, pageUrl: 'https://patient.example/private' });
  assert.ok(body.includes(sample.term));
  assert.ok(body.includes(sample.note));
  assert.equal(body.includes(sample.id), false);
  assert.equal(body.includes(sample.createdAt), false);
  assert.equal(body.includes('patient.example'), false);
});

async function optionsHarness({ feedback = [], hash = '#feedback?entry=gastritis&kind=inaccurate' } = {}) {
  const html = await readFile(new URL('../src/options/options.html', import.meta.url), 'utf8');
  const bundled = await build({
    entryPoints: [new URL('../src/options/options.js', import.meta.url).pathname],
    bundle: true,
    write: false,
    format: 'iife',
  });
  const dom = new JSDOM(html, { url: `https://extension.test/options.html${hash}`, runScripts: 'outside-only' });
  let stored = [...feedback];
  const calls = [];
  const external = [];
  const entry = {
    id: 'gastritis', term: 'gastritis', aliases: [], short: 'Inflammation of the stomach lining',
    explanation: 'The stomach lining is inflamed.', context: 'A word about a condition.',
    sources: [{ label: 'Source', url: 'https://example.org/health' }],
    review: { status: 'source-checked', date: '2026-10-13' },
  };
  dom.window.chrome = {
    runtime: { sendMessage: async (message) => {
      calls.push(message);
      if (message.type === 'OPE_GET_LEXICON') return { ok: true, lexicon: { version: '0.1.0', entries: [entry] } };
      if (message.type === 'OPE_SAVE_FEEDBACK') { stored.push(message.feedback); return { ok: true }; }
      if (message.type === 'OPE_DELETE_FEEDBACK') {
        stored = message.id === null ? [] : stored.filter((item) => item.id !== message.id);
        return { ok: true };
      }
      if (message.type === 'OPE_IMPORT_FEEDBACK') {
        const result = mergeFeedbackRecords(stored, parseFeedbackImport(message.json));
        stored = result.feedback;
        return { ok: true, ...result };
      }
      throw new Error('Unexpected message');
    } },
    storage: {
      local: { get: async () => ({ opeFeedback: stored }), set: async (data) => { stored = data.opeFeedback; } },
      onChanged: { addListener() {} },
    },
  };
  dom.window.fetch = (...args) => { external.push(args); throw new Error('No network allowed'); };
  dom.window.TextEncoder = TextEncoder;
  dom.window.open = (...args) => { external.push(args); };
  dom.window.HTMLDialogElement.prototype.showModal = function () { this.setAttribute('open', ''); };
  dom.window.HTMLDialogElement.prototype.close = function (value = '') {
    this.returnValue = value;
    this.removeAttribute('open');
    this.dispatchEvent(new dom.window.Event('close'));
  };
  dom.window.eval(bundled.outputFiles[0].text);
  const settle = () => new Promise((resolve) => setTimeout(resolve, 10));
  await settle();
  return { dom, calls, external, settle, getStored: () => stored };
}

test('options hash prefills a known term and local save sends no page metadata or network requests', async () => {
  const { dom, calls, external, settle, getStored } = await optionsHarness();
  try {
    const document = dom.window.document;
    assert.equal(document.getElementById('feedback-term').value, 'gastritis');
    assert.equal(document.getElementById('feedback-kind').value, 'inaccurate');
    assert.equal(document.getElementById('glossary-section').hidden, true);
    document.getElementById('feedback-note').value = '<img src=x onerror=alert(1)> What does lining mean?';
    document.getElementById('feedback-form').dispatchEvent(new dom.window.Event('submit', { bubbles: true, cancelable: true }));
    await settle();
    const saved = calls.find((message) => message.type === 'OPE_SAVE_FEEDBACK');
    assert.ok(saved);
    assert.deepEqual(Object.keys(saved.feedback).sort(), Object.keys(sample).sort());
    assert.equal(JSON.stringify(saved).includes('extension.test'), false);
    assert.equal(getStored().length, 1);
    assert.equal(document.querySelector('#feedback-list img'), null);
    assert.ok(document.querySelector('.draft-note').textContent.includes('<img'));
    assert.equal(external.length, 0);
    document.querySelector('.draft-actions button').click();
    assert.equal(document.getElementById('share-dialog').open, true);
    assert.ok(document.getElementById('share-preview').value.includes('What does lining mean?'));
    assert.equal(new URL(document.getElementById('open-issue').href).hostname, 'github.com');
    assert.equal(external.length, 0, 'reviewing a draft must not send it anywhere');
  } finally { dom.window.close(); }
});

test('local deletion requires confirmation and cancelling preserves drafts', async () => {
  const { dom, calls, settle, getStored } = await optionsHarness({ feedback: [sample] });
  try {
    const document = dom.window.document;
    const dialog = document.getElementById('delete-dialog');
    document.getElementById('delete-all').click();
    assert.equal(dialog.open, true);
    assert.equal(getStored().length, 1);
    dialog.close('cancel');
    await settle();
    assert.equal(getStored().length, 1);
    assert.equal(calls.some((message) => message.type === 'OPE_DELETE_FEEDBACK'), false);
    document.getElementById('delete-all').click();
    dialog.close('confirm');
    await settle();
    assert.equal(getStored().length, 0);
    assert.equal(calls.find((message) => message.type === 'OPE_DELETE_FEEDBACK').id, null);
    assert.equal(document.getElementById('draft-count').textContent, '0');
  } finally { dom.window.close(); }
});

test('new terms are saved as suggestions without assigning an unrelated entry ID', async () => {
  const { dom, calls, settle } = await optionsHarness();
  try {
    const document = dom.window.document;
    document.getElementById('feedback-term').value = 'a new term';
    document.getElementById('feedback-note').value = 'Please add this term to the glossary.';
    document.getElementById('feedback-form').dispatchEvent(new dom.window.Event('submit', { bubbles: true, cancelable: true }));
    await settle();
    const saved = calls.find((message) => message.type === 'OPE_SAVE_FEEDBACK').feedback;
    assert.equal(saved.entryId, '');
    assert.equal(saved.term, 'a new term');
    assert.equal(saved.kind, 'suggestion');
    assert.match(document.getElementById('feedback-status').textContent, /New-term suggestion/);
  } finally { dom.window.close(); }
});

function selectBackup(dom, json, size = new TextEncoder().encode(json).length) {
  const input = dom.window.document.getElementById('import-file');
  Object.defineProperty(input, 'files', { configurable: true, value: [{ name: 'backup.json', size, text: async () => json }] });
  input.dispatchEvent(new dom.window.Event('change', { bubbles: true }));
}

test('import preview is local, inspectable, and makes no changes until explicitly confirmed', async () => {
  const { dom, calls, external, settle, getStored } = await optionsHarness({ feedback: [sample] });
  try {
    const document = dom.window.document;
    const imported = { ...sample, id: 'new', note: '<img src=x> A restored note.' };
    selectBackup(dom, backup([sample, imported]));
    await settle();
    assert.equal(document.getElementById('import-dialog').open, true);
    assert.equal(document.getElementById('import-file-count').textContent, '2');
    assert.equal(document.getElementById('import-new-count').textContent, '1');
    assert.equal(document.getElementById('import-duplicate-count').textContent, '1');
    assert.equal(document.querySelector('#import-records img'), null);
    assert.ok(document.getElementById('import-records').textContent.includes(imported.note));
    assert.equal(getStored().length, 1);
    assert.equal(calls.some((message) => message.type === 'OPE_IMPORT_FEEDBACK'), false);
    assert.equal(external.length, 0);
    document.getElementById('cancel-import').click();
    await settle();
    assert.equal(getStored().length, 1);
    selectBackup(dom, backup([sample, imported]));
    await settle();
    document.getElementById('confirm-import').click();
    await settle();
    assert.equal(getStored().length, 2);
    assert.equal(document.getElementById('import-dialog').open, false);
    assert.match(document.getElementById('import-status').textContent, /Restored 1 drafts/);
    assert.equal(external.length, 0);
  } finally { dom.window.close(); }
});

test('invalid or oversized backup leaves storage untouched and presents a focused error', async () => {
  const { dom, calls, settle, getStored } = await optionsHarness({ feedback: [sample] });
  try {
    const document = dom.window.document;
    selectBackup(dom, backup([{ ...sample, pageUrl: 'private' }]));
    await settle();
    assert.equal(document.getElementById('import-dialog').open, false);
    assert.match(document.getElementById('page-error').textContent, /unsupported fields/);
    assert.equal(document.activeElement.id, 'page-error');
    selectBackup(dom, backup([sample]), FEEDBACK_IMPORT_MAX_BYTES + 1);
    await settle();
    assert.match(document.getElementById('page-error').textContent, /too large/);
    assert.deepEqual(getStored(), [sample]);
    assert.equal(calls.some((message) => message.type === 'OPE_IMPORT_FEEDBACK'), false);
  } finally { dom.window.close(); }
});
