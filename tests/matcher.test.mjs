import test from 'node:test';
import assert from 'node:assert/strict';
import { createMatcher } from '../src/core/matcher.js';

const entry = (id, term, aliases = []) => ({ id, term, aliases });

test('matching prefers the longest phrase and returns original text with exclusive offsets', () => {
  const pain = entry('pain', 'pain');
  const chest = entry('chest', 'chest');
  const chestPain = entry('chest-pain', 'chest pain');
  const text = 'Chest pain, pain; CHEST PAIN.';
  const matches = createMatcher([pain, chest, chestPain]).find(text);
  assert.deepEqual(matches.map(({ start, end, entry: found, matchedText }) => ({ start, end, id: found.id, matchedText })), [
    { start: 0, end: 10, id: 'chest-pain', matchedText: 'Chest pain' },
    { start: 12, end: 16, id: 'pain', matchedText: 'pain' },
    { start: 18, end: 28, id: 'chest-pain', matchedText: 'CHEST PAIN' },
  ]);
  for (const match of matches) assert.equal(text.slice(match.start, match.end), match.matchedText);
});

test('aliases are case-insensitive literal text, including regex punctuation', () => {
  const inflammation = entry('inflammation', 'inflammation', ['A+B', 'C++', 'a.b']);
  const matcher = createMatcher([inflammation]);
  const matches = matcher.find('a+b, C++ and A.B; aaab and axb do not match.');
  assert.deepEqual(matches.map((match) => match.matchedText), ['a+b', 'C++', 'A.B']);
  assert.ok(matches.every((match) => match.entry === inflammation));
});

test('word boundaries reject adjacent letters, numbers, combining marks and underscores', () => {
  const matches = createMatcher([entry('pain', 'pain')]).find(
    'painless xpain painx pain2 2pain _pain pain_ épain painé pain\u0301 \u0301pain 中文pain pain中文 (pain) pain-pain',
  );
  assert.deepEqual(matches.map((match) => match.matchedText), ['pain', 'pain', 'pain']);
});

test('astral Unicode letters count as word characters on both sides', () => {
  const matcher = createMatcher([entry('pain', 'pain')]);
  assert.deepEqual(matcher.find('𐐀pain pain𐐀 𝒜pain pain𝒜'), []);
  assert.deepEqual(matcher.find('🫀pain🫀').map((match) => [match.start, match.end, match.matchedText]), [[2, 6, 'pain']]);
});

test('Unicode lowercase expansion keeps offsets in the original string', () => {
  const matcher = createMatcher([entry('dotted-i', 'İ'), entry('pain', 'pain')]);
  const text = '🫀 İ, PAIN.';
  assert.deepEqual(matcher.find(text).map((match) => [match.start, match.end, match.matchedText]), [
    [3, 4, 'İ'],
    [6, 10, 'PAIN'],
  ]);
});

test('duplicate aliases do not duplicate matches and repeated terms stay separate', () => {
  const pain = entry('pain', 'pain', ['PAIN', 'pain']);
  const matcher = createMatcher([pain]);
  const matches = matcher.find('pain pain pain');
  assert.equal(matches.length, 3);
  assert.deepEqual(matches.map((match) => match.start), [0, 5, 10]);
  assert.deepEqual(matcher.find(''), []);
  assert.deepEqual(matcher.find('ordinary words'), []);
});

test('phrases accept ordinary whitespace variations and preserve exact original offsets', () => {
  const phrase = entry('blood-pressure', 'blood pressure');
  const text = '🫀 Blood\n\t  pressure; blood\u00a0pressure, blood\r\npressure.';
  const matches = createMatcher([phrase]).find(text);
  assert.deepEqual(matches.map((match) => match.matchedText), ['Blood\n\t  pressure', 'blood\u00a0pressure', 'blood\r\npressure']);
  assert.ok(matches.every((match) => text.slice(match.start, match.end) === match.matchedText));
  assert.equal(matches[0].start, 3);
  assert.equal(matches.at(-1).end, text.length - 1);
});
