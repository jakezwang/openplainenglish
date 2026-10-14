import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { analyzeCorpus } from '../scripts/check-coverage.mjs';

const read = async (path) => JSON.parse(await readFile(new URL('../' + path, import.meta.url), 'utf8'));

test('frozen reading snapshots and exact-span labels remain valid, including unresolved gaps', async () => {
  const corpus = await read('data/coverage/health-reading.json');
  const lexicon = await read('data/health.json');
  const result = analyzeCorpus(corpus, lexicon);
  assert.equal(result.documentCount, 4);
  assert.equal(result.goldOccurrences, 122);
  assert.equal(result.baselineVersion, '0.4.0');
  assert.equal(result.baseline.goldCovered, 80);
  assert.equal(result.baseline.inlineReplacements, 12);
  assert.ok(result.current.inlineReplacements > result.baseline.inlineReplacements, 'new phrases improve actual in-place coverage on the same text');
  assert.equal(result.historical.find((item) => item.version === '0.3.0').goldCovered, 39);
  assert.ok(result.current.goldCovered > result.baseline.goldCovered);
  assert.ok(result.current.goldCovered < result.goldOccurrences, 'do not erase remaining gaps from the denominator');
  assert.equal(result.behaviorSummary.passed, result.behaviorSummary.total);
  // A shorter hemoglobin match must not count as explaining the complete A1C test.
  const a1c = result.documents.find((doc) => doc.id === 'a1c');
  assert.ok(a1c.historical['0.3.0'].missingGold.some((span) => span.entryId === 'hemoglobin-a1c-test'));
  assert.ok(!a1c.baseline.missingGold.some((span) => span.entryId === 'hemoglobin-a1c-test'));
  assert.ok(!a1c.current.missingGold.some((span) => span.entryId === 'hemoglobin-a1c-test'));
});

test('coverage rejects changed text or invalid gold offsets rather than silently changing the denominator', async () => {
  const corpus = await read('data/coverage/health-reading.json');
  const lexicon = await read('data/health.json');
  const changed = structuredClone(corpus);
  changed.documents[0].text += ' extra text';
  assert.throws(() => analyzeCorpus(changed, lexicon), /hash mismatch/);
  const badSpan = structuredClone(corpus);
  badSpan.documents[0].gold[0].start += 1;
  assert.throws(() => analyzeCorpus(badSpan, lexicon), /Invalid gold span/);
});

test('public-service pairs preserve sentence grammar and leave excluded constructions unchanged', async () => {
  const corpus = await read('data/coverage/public-service-reading.json');
  const pilot = await read('data/pilots/public-service.json');
  const result = analyzeCorpus(corpus, pilot);
  assert.equal(result.documentCount, 0);
  assert.equal(result.current.goldOccurrenceCoverage, null, 'synthetic examples have no natural-text coverage rate');
  assert.equal(result.behaviorSummary.total, 22);
  assert.equal(result.behaviorSummary.passed, result.behaviorSummary.total,
    JSON.stringify(result.behaviorCases.filter((item) => !item.pass)));
  // The default health dictionary must not silently enable the pilot.
  const healthResult = analyzeCorpus(corpus, await read('data/health.json'));
  assert.equal(healthResult.behaviorSummary.passed, 8);
});
