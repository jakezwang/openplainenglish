import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { validateLexicon, assertValidLexicon, MAX_SHORT_LENGTH, MAX_INLINE_LENGTH, REVIEW_METHOD } from '../scripts/validate-lexicon.mjs';

const lexicon = JSON.parse(readFileSync(new URL('../data/health.json', import.meta.url), 'utf8'));
const changed = (mutate) => {
  const copy = structuredClone(lexicon);
  mutate(copy);
  return validateLexicon(copy);
};
const has = (errors, pattern) => assert.ok(errors.some((error) => pattern.test(error)), JSON.stringify(errors));

test('release lexicon has 132 fully attributed entries and honest review metadata', () => {
  assert.deepEqual(validateLexicon(lexicon), []);
  assert.ok(lexicon.entries.length === 132);
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

const withInline = (data) => data.entries.find((entry) => entry.id === 'hypertension');

test('inline data is optional and carries explicit pairs, inherited sources, and its own honest review', () => {
  const eligible = lexicon.entries.filter((entry) => entry.inline);
  assert.equal(eligible.length, 30);
  assert.equal(eligible.reduce((n, entry) => n + entry.inline.replacements.length, 0), 56);
  assert.ok(eligible.every((entry) => entry.sources.length && entry.inline.note && entry.inline.review.method === REVIEW_METHOD));
  assert.deepEqual(changed((data) => { for (const entry of data.entries) delete entry.inline; }), []);
  has(changed((data) => { withInline(data).sources = []; }), /at least one source/u);
});

test('inline review metadata and malformed nested structures cannot claim approval', () => {
  for (const value of [null, [], 'replace', {}, { replacements: [null] }]) {
    assert.ok(changed((data) => { withInline(data).inline = value; }).length);
  }
  for (const field of ['replacements', 'note', 'review']) {
    assert.ok(changed((data) => { delete withInline(data).inline[field]; }).length);
  }
  has(changed((data) => { withInline(data).inline.review.status = 'clinically-reviewed'; }), /unsupported review status/u);
  has(changed((data) => { withInline(data).inline.review.date = '2026-02-30'; }), /real date/u);
  has(changed((data) => { withInline(data).inline.review.method = 'expert approved'; }), /editorial method/u);
  has(changed((data) => { withInline(data).inline.review.approved = true; }), /unsupported inline review/u);
  has(changed((data) => { withInline(data).inline.source = 'unreviewed'; }), /unsupported inline fields/u);
});

test('inline pairs reject foreign, duplicate, identity, unsafe, and oversized replacements', () => {
  has(changed((data) => { withInline(data).inline.replacements = []; }), /explicit replacement pairs/u);
  has(changed((data) => { withInline(data).inline.replacements[0].from = 'diabetes'; }), /belong to this entry/u);
  has(changed((data) => { withInline(data).inline.replacements.push({ from: 'ＨＹＰＥＲＴＥＮＳＩＯＮ', to: 'high blood pressure' }); }), /duplicate inline source/u);
  has(changed((data) => { withInline(data).inline.replacements[0].to = 'HYPERTENSION'; }), /identity replacement/u);
  has(changed((data) => { withInline(data).inline.replacements[0].to = 'x'.repeat(MAX_INLINE_LENGTH + 1); }), /at most/u);
  for (const to of ['', '<b>pressure</b>', 'high\npressure', 'high\u0085pressure', 'high\u202Epressure']) {
    assert.ok(changed((data) => { withInline(data).inline.replacements[0].to = to; }).length, JSON.stringify(to));
  }
  has(changed((data) => { withInline(data).inline.replacements[0].html = true; }), /unsupported replacement fields/u);
});

test('curated sentence pairs preserve noun number, articles, and important modifiers', () => {
  const fixtures = [
    ['myocardial-infarction', 'myocardial infarction', 'The example describes a myocardial infarction.', 'The example describes a heart attack.'],
    ['myocardial-infarction', 'myocardial infarctions', 'No myocardial infarctions were recorded.', 'No heart attacks were recorded.'],
    ['benign-tumor', 'benign tumor', 'The example mentions a benign tumor.', 'The example mentions a noncancerous growth.'],
    ['malignant-tumor', 'malignant tumours', 'Two malignant tumours were described.', 'Two cancerous growths were described.'],
    ['white-blood-cell', 'leukocyte', 'The diagram labels a leukocyte.', 'The diagram labels a white blood cell.'],
    ['red-blood-cell', 'erythrocytes', 'The sample contains erythrocytes.', 'The sample contains red blood cells.'],
    ['platelet', 'thrombocytes', 'The report mentions low thrombocytes.', 'The report mentions low platelets.'],
    ['hypertension', 'hypertension', 'The example does not mention hypertension.', 'The example does not mention high blood pressure.'],
    ['hypoxemia', 'hypoxemia', 'The term hypoxemia concerns blood.', 'The term low blood oxygen concerns blood.'],
    ['hypoxia', 'hypoxia', 'The term hypoxia concerns tissue.', 'The term low tissue oxygen concerns tissue.'],
    ['chronic-disease', 'chronic conditions', 'Some chronic conditions need ongoing care.', 'Some long-term conditions need ongoing care.'],
    ['mortality-rate', 'mortality rate', 'The mortality rate was measured over one year.', 'The death rate was measured over one year.'],
  ];
  for (const [id, from, before, after] of fixtures) {
    const pair = lexicon.entries.find((entry) => entry.id === id).inline.replacements.find((item) => item.from === from);
    assert.ok(pair, from);
    assert.equal(before.replace(from, pair.to), after, from);
  }
});

test('definition-only terms, unsafe articles, abbreviations, and already plain aliases stay annotation-only', () => {
  const sources = new Set(lexicon.entries.flatMap((entry) => entry.inline?.replacements.map((pair) => pair.from) ?? []));
  for (const phrase of ['biopsy', 'biopsies', 'renal', 'respiratory', 'edema', 'esophagus', 'erythrocyte', 'hemoglobin', 'anemia', 'high blood pressure', 'low blood pressure', 'blood sugar', 'heart attack', 'heart attacks', 'platelet', 'platelets', 'death rate', 'shortness of breath', 'ECG', 'EKG', 'COPD', 'MRI', 'UTI', 'arrhythmia', 'enzyme', 'low-density lipoprotein', 'lipoprotein (a)', 'prediabetes']) {
    assert.equal(sources.has(phrase), false, phrase);
  }
});
