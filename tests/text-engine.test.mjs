import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createTextEngine } from '../src/core/text.js';

const lexicon = JSON.parse(await readFile(new URL('../data/health.json', import.meta.url)));
const engine = createTextEngine(lexicon.entries);
test('paragraph engine keeps an exact original and source offsets through changing lengths', () => {
  const original = '🙂 Hypertension and gastritis.\n\nA biopsy may help.';
  const result = engine.analyze(original);
  assert.equal(result.original, original);
  assert.match(result.text, /^🙂 High blood pressure/);
  assert.ok(result.replacedCount >= 1);
  for (const match of result.matches) assert.equal(original.slice(match.start, match.end), match.originalText);
  assert.equal(engine.analyze(original, { mode: 'annotate' }).text, original);
  assert.ok(result.text.includes('\n\n'), 'paragraph boundaries survive');
});
test('engine bounds work, keeps unprocessed text, and never derives a replacement from a definition', () => {
  const result = engine.analyze('hypertension hypertension biopsy', { maxMatches: 1 });
  assert.equal(result.text, 'high blood pressure hypertension biopsy');
  assert.equal(result.truncated, true);
  assert.equal(engine.analyze('biopsy').replacedCount, 0);
  assert.throws(() => engine.analyze('a'.repeat(200001)), /200,000/);
  assert.throws(() => engine.analyze('x', { maxMatches: 0 }), /limit/);
  assert.throws(() => engine.analyze('x', { mode: 'ai' }), /mode/);
});
test('engine snapshots data and accepts text as inert text, never HTML', () => {
  const entries = structuredClone(lexicon.entries);
  const independent = createTextEngine(entries);
  entries.find((e) => e.id === 'hypertension').inline.replacements[0].to = 'WRONG';
  const text = '<script>hypertension</script>';
  assert.equal(independent.analyze(text).text, '<script>high blood pressure</script>');
  assert.equal(independent.analyze('Hypertension').text, 'High blood pressure');
  assert.throws(() => createTextEngine([entries[0], entries[0]]), /unique/);
});
