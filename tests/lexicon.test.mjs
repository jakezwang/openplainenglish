import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { validateLexicon, assertValidLexicon, MAX_SHORT_LENGTH } from '../scripts/validate-lexicon.mjs';

const lexicon = JSON.parse(readFileSync(new URL('../data/health.json', import.meta.url), 'utf8'));
const changed = (mutate) => {
  const copy = structuredClone(lexicon);
  mutate(copy);
  return validateLexicon(copy);
};
const has = (errors, pattern) => assert.ok(errors.some((error) => pattern.test(error)), JSON.stringify(errors));

test('release lexicon has about 100 fully attributed entries and honest review metadata', () => {
  assert.deepEqual(validateLexicon(lexicon), []);
  assert.ok(lexicon.entries.length >= 95 && lexicon.entries.length <= 110);
  assert.equal(assertValidLexicon(lexicon), lexicon);
  assert.ok(lexicon.entries.every((entry) => entry.review.status === 'source-checked'));
});

test('case-folded identifiers, terms, aliases, and Unicode-equivalent aliases cannot collide', () => {
  has(changed((x) => { x.entries[1].id = x.entries[0].id.toUpperCase(); }), /duplicate id/u);
  has(changed((x) => { x.entries[1].term = x.entries[0].term.toUpperCase(); }), /duplicate term or alias/u);
  has(changed((x) => { x.entries[1].aliases.push(x.entries[0].term.toUpperCase()); }), /duplicate term or alias/u);
  has(changed((x) => { x.entries[0].aliases.push(x.entries[0].term); }), /duplicate term or alias/u);
  has(changed((x) => { x.entries[0].aliases.push('ＭＲＩ'); }), /duplicate term or alias/u);
});

test('missing metadata and unsupported review claims are rejected', () => {
  for (const field of ['id', 'term', 'aliases', 'short', 'explanation', 'context', 'sources', 'review']) {
    assert.ok(changed((x) => { delete x.entries[0][field]; }).length > 0, field);
  }
  has(changed((x) => { x.entries[0].review.status = 'clinically-reviewed'; }), /unsupported review status/u);
  has(changed((x) => { x.entries[0].review.method = 'approved by experts'; }), /editorial method/u);
  has(changed((x) => { x.entries[0].review.date = '2026-02-30'; }), /real date/u);
  has(changed((x) => { delete x.entries[0].sources[0].license; }), /source license/u);
  has(changed((x) => { x.entries[0].sources = []; }), /at least one source/u);
});

test('unsafe source URLs and unreviewed copyrighted page types are rejected', () => {
  for (const url of ['not a url', 'javascript:alert(1)', 'http://www.cdc.gov/', 'https://user:pass@www.cdc.gov/', 'https://www.cdc.gov.evil.example/', 'https://medlineplus.gov:8443/', 'https://medlineplus.gov/ency/article/001150.htm', 'https://medlineplus.gov/druginfo/meds/a123.html']) {
    assert.ok(changed((x) => { x.entries[0].sources[0].url = url; }).length > 0, url);
  }
});

test('oversized short explanations, markup, and broad ambiguous matches are rejected', () => {
  has(changed((x) => { x.entries[0].short = 'x'.repeat(MAX_SHORT_LENGTH + 1); }), /at most/u);
  has(changed((x) => { x.entries[0].explanation = '<script>oops</script>'; }), /plain text/u);
  for (const alias of ['positive', 'negative', 'discharge', 'stroke', 'MI', 'BP', 'screening']) {
    has(changed((x) => { x.entries[0].aliases.push(alias); }), /ambiguous standalone/u);
  }
});

test('malformed structures produce validation errors without crashing', () => {
  for (const value of [null, [], {}, { entries: [] }, { entries: [null, 7, {}] }]) {
    assert.ok(validateLexicon(value).length > 0);
    assert.throws(() => assertValidLexicon(value), /Invalid lexicon/u);
  }
});

test('the initial clinical examples preserve material distinctions', () => {
  const entry = (id) => lexicon.entries.find((item) => item.id === id);
  assert.ok(entry('hypertension').aliases.includes('high blood pressure'));
  assert.match(entry('gastritis').short, /stomach lining/u);
  assert.match(entry('dehydration').short, /fluid/u);
  assert.match(entry('edema').short, /fluid/u);
  assert.ok(entry('myocardial-infarction').aliases.includes('heart attack'));
  assert.match(entry('hypoxemia').short, /blood/u);
  assert.match(entry('hypoxia').short, /tissue/u);
  assert.match(entry('adverse-event').context, /does not prove/u);
  assert.match(entry('carcinoma').explanation, /lining/u);
});
