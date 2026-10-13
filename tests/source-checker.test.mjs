import test from 'node:test';
import assert from 'node:assert/strict';
import { auditSources, checkUrl, classifyHttp, collectSources, contentProbe, extractTitle } from '../scripts/check-sources.mjs';

const lexicon = { version: 'test', entries: [
  { id: 'a', sources: [{ label: 'A', url: 'https://example.test/a' }] },
  { id: 'b', sources: [{ label: 'A', url: 'https://example.test/a' }, { label: 'B', url: 'https://example.test/b' }] },
] };

test('extracts a document title without mistaking an SVG icon label for one', () => {
  assert.equal(extractTitle('<head><meta property="og:title" content="NCI Dictionary"></head><body><svg><title>Facebook</title></svg></body>'), 'NCI Dictionary');
  assert.equal(extractTitle('<head><title>Document</title></head><body><svg><title>Icon</title></svg></body>'), 'Document');
});

test('HTTP blocks, missing resources, and server failures remain distinct', () => {
  assert.equal(classifyHttp(200), 'available');
  for (const status of [401, 403, 429]) assert.equal(classifyHttp(status), 'blocked');
  for (const status of [404, 410]) assert.equal(classifyHttp(status), 'missing');
  assert.equal(classifyHttp(500), 'http-error');
});

test('deduplicates source URLs without losing affected entries', () => {
  const sources = collectSources(lexicon);
  assert.equal(sources.length, 2);
  assert.deepEqual(sources[0].entryIds, ['a', 'b']);
  assert.deepEqual(sources[0].labels, ['A']);
});

test('retries transient errors once, preserves a final HTTP block, and detects challenge titles', async () => {
  let calls = 0;
  const result = await checkUrl('https://example.test/a', { retryDelayMs: 0, fetchImpl: async () => new Response('Rate limited', { status: ++calls === 1 ? 503 : 429 }) });
  assert.equal(calls, 2);
  assert.equal(result.status, 'blocked');
  assert.equal(result.httpStatus, 429);
  const challenge = await checkUrl('https://example.test/a', { fetchImpl: async () => new Response('<title>Access Denied</title>') });
  assert.equal(challenge.status, 'blocked');
});

test('times out a stalled request and limits concurrency without a live network', async () => {
  const timedOut = await checkUrl('https://example.test/a', { timeoutMs: 5, retries: 0, fetchImpl: (_, { signal }) => new Promise((_, reject) => signal.addEventListener('abort', () => reject(new Error('aborted')), { once: true })) });
  assert.equal(timedOut.status, 'timeout');
  let active = 0;
  let maximum = 0;
  const report = await auditSources(lexicon, { concurrency: 1, fetchImpl: async () => {
    maximum = Math.max(maximum, ++active);
    await new Promise((done) => setTimeout(done, 1));
    active--;
    return new Response('<title>Test source</title>');
  } });
  assert.equal(maximum, 1);
  assert.deepEqual(report.summary, { available: 2 });
});

test('does not confuse a successful NCI shell with an existing definition', async () => {
  const url = 'https://www.cancer.gov/publications/dictionaries/cancer-terms/def/not-real';
  assert.equal(contentProbe(url).kind, 'nci-definition');
  const report = await auditSources({ entries: [{ id: 'x', sources: [{ label: 'X', url }] }] }, { fetchImpl: async (requested) => requested === url ? new Response('<title>NCI Dictionary</title>') : new Response('{}', { status: 404 }) });
  assert.equal(report.results[0].status, 'available');
  assert.equal(report.results[0].contentEvidence.status, 'missing');
});

test('retains CDC term evidence without treating an empty result as a definition', async () => {
  const url = 'https://www.cdc.gov/ccindex/everydaywords/index.html?word=Unknown';
  assert.match(contentProbe(url).url, /term=Unknown$/u);
  const report = await auditSources({ entries: [{ id: 'x', sources: [{ label: 'X', url }] }] }, { fetchImpl: async (requested) => requested === url ? new Response('<title>Everyday Words</title>') : new Response(JSON.stringify({ Entries: [] })) });
  assert.equal(report.results[0].contentEvidence.status, 'not-found');
  await assert.rejects(auditSources(lexicon, { concurrency: 9 }), /concurrency/u);
});
