import test from 'node:test';
import assert from 'node:assert/strict';
import { proposeSentenceSplits } from '../src/core/sentences.js';
test('sentence proposal keeps exact original, negation and numeric tokens with reversible offsets', () => {
  const original = 'The note lists 10 mg; it does not list 100 mg.';
  const result = proposeSentenceSplits(original);
  assert.equal(result.text, 'The note lists 10 mg. It does not list 100 mg.');
  assert.equal(result.original, original); assert.equal(result.tokenSequencePreserved, true);
  const change = result.changes[0];
  assert.equal(original.slice(change.start, change.end), change.original);
});
test('quoted, conditional, dependent and list fragments stay unchanged', () => {
  for (const original of ['"The note lists 10 mg; it does not list 100 mg."','If the note is correct; it does not establish a diagnosis.','The note lists 10 mg; not 100 mg.','The sample is red; blue; green.','A value is 10.5 mg; it is not 11 mg.']) assert.equal(proposeSentenceSplits(original).text,original);
});
test('multi-sentence and multi-paragraph quotations and conditional clauses are retained', () => {
  for (const original of ['“First sentence. The note lists 10 mg; it does not list 100 mg. Last sentence.”', '「First paragraph.\nThe note lists 10 mg; it does not list 100 mg.」', 'The report states this only when needed; it does not apply otherwise.']) assert.equal(proposeSentenceSplits(original).text, original);
});
