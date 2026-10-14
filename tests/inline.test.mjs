import test from 'node:test';
import assert from 'node:assert/strict';
import { assertReadingMode, getInlinePresentation, INLINE_REVIEW_METHOD, DOMAIN_INLINE_REVIEW_METHOD, normalizeInlineText } from '../src/core/inline.js';

const review = { status: 'source-checked', date: '2026-10-13', method: INLINE_REVIEW_METHOD };
const entry = {
  term: 'myocardial infarction', aliases: ['myocardial infarctions', 'heart attack', 'heart attacks', 'MI'],
  short: 'This short definition must never become inline wording.',
  inline: {
    replacements: [{ from: 'myocardial infarction', to: 'heart attack' }, { from: 'myocardial infarctions', to: 'heart attacks' }],
    note: 'Only the reviewed technical forms are replaced.', review,
  },
};

test('dedicated pairs handle explicit plural forms and conservative letter case', () => {
  for (const [original, expected] of [['myocardial infarction', 'heart attack'], ['Myocardial infarction', 'Heart attack'], ['MYOCARDIAL INFARCTIONS', 'HEART ATTACKS'], ['myocardial\n\t infarction', 'heart attack']]) {
    const result = getInlinePresentation(entry, original);
    assert.equal(result.replaced, true);
    assert.equal(result.displayText, expected);
    assert.equal(result.originalText, original);
  }
  const mixed = getInlinePresentation(entry, 'myoCardial infarction');
  assert.equal(mixed.replaced, false);
  assert.equal(mixed.displayText, 'myoCardial infarction');
  assert.match(mixed.reason, /capitalization/);
});

test('plain aliases and unspecified forms stay original; short is never a substitute', () => {
  for (const original of ['heart attack', 'heart attacks', 'MI', 'myocardial']) {
    const result = getInlinePresentation(entry, original);
    assert.equal(result.replaced, false);
    assert.equal(result.displayText, original);
    assert.notEqual(result.displayText, entry.short);
  }
  assert.match(getInlinePresentation(entry, 'heart attack').reason, /already plain/);
  assert.equal(getInlinePresentation(entry, 'myocardial infarction', 'annotate').displayText, 'myocardial infarction');
});

test('review and pair metadata fail closed rather than inventing inline wording', () => {
  const bad = [
    undefined,
    { ...entry.inline, note: '' },
    { ...entry.inline, review: { ...review, status: 'pending' } },
    { ...entry.inline, review: { ...review, method: 'expert approved' } },
    { ...entry.inline, review: { ...review, date: '2026-02-30' } },
    { ...entry.inline, pageUrl: 'private' },
    { ...entry.inline, replacements: [{ from: 'not an entry term', to: 'plain phrase' }] },
    { ...entry.inline, replacements: [{ from: entry.term, to: entry.term.toUpperCase() }] },
    { ...entry.inline, replacements: [{ from: entry.term, to: '<b>heart attack</b>' }] },
    { ...entry.inline, replacements: [{ from: entry.term, to: 'heart\u202e attack' }] },
    { ...entry.inline, replacements: [{ from: entry.term, to: 'x'.repeat(97) }] },
    { ...entry.inline, replacements: [{ from: entry.term, to: 'heart attack' }, { from: entry.term.toUpperCase(), to: 'another phrase' }] },
  ];
  for (const inline of bad) {
    const result = getInlinePresentation({ ...entry, inline }, entry.term);
    assert.equal(result.replaced, false);
    assert.equal(result.displayText, entry.term);
  }
});

test('normalization is shared with the approved pair contract while original spelling stays available', () => {
  assert.equal(normalizeInlineText('  ＨＹＰＥＲＴＥＮＳＩＯＮ\u00a0 '), 'hypertension');
  const original = 'myocardial\u00a0\u00a0infarction';
  const result = getInlinePresentation(entry, original);
  assert.equal(result.originalText, original);
  assert.equal(result.displayText, 'heart attack');
});

test('joined compounds retain the term and annotation instead of rewriting a technical name', () => {
  for (const context of [{ before: 'post-' }, { after: '-related' }, { after: '‑induced' }]) {
    const result = getInlinePresentation(entry, entry.term, 'plain', context);
    assert.equal(result.replaced, false);
    assert.equal(result.displayText, entry.term);
    assert.match(result.reason, /compound/);
  }
  assert.equal(getInlinePresentation(entry, entry.term, 'plain', { before: 'a ', after: '.' }).replaced, true);
});

test('invalid modes fail before a presentation is returned', () => {
  for (const mode of ['replace', '', null, {}, 1]) {
    assert.throws(() => assertReadingMode(mode), TypeError);
    assert.throws(() => getInlinePresentation(entry, entry.term, mode), TypeError);
  }
});

test('literal quotations, explicit names and possessives keep exact source wording', () => {
  for (const context of [
    { before: 'The manual defines “', after: '”.' },
    { before: 'The title is “severe ', after: ' today”.' },
    { before: 'It calls this "', after: '".' },
    { before: "The phrase '", after: "'." },
    { literal: true }, { after: '’s definition' }, { after: "'s history" },
  ]) {
    const result = getInlinePresentation(entry, entry.term, 'plain', context);
    assert.equal(result.replaced, false);
    assert.equal(result.displayText, entry.term);
  }
  for (const context of [
    { before: "The patient's ", after: ' is recorded.' },
    { before: 'The word “condition” precedes ', after: '.' },
    { before: 'a ', after: ', followed by a checkup.' },
    { before: 'The manual defines ', after: '.' },
  ]) assert.equal(getInlinePresentation(entry, entry.term, 'plain', context).replaced, true);
});

test('the separately declared domain-expert review method is accepted without broadening review trust', () => {
  const generic = { ...entry, inline: { ...entry.inline, review: { ...review, method: DOMAIN_INLINE_REVIEW_METHOD } } };
  assert.equal(getInlinePresentation(generic, entry.term).displayText, 'heart attack');
  assert.equal(getInlinePresentation({ ...generic, inline: { ...generic.inline, review: { ...review, method: 'editorial source comparison' } } }, entry.term).replaced, false);
});
