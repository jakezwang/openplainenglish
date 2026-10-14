import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { DEFAULT_PREFERENCES, normalizePreferences, validatePreferences } from '../src/shared/preferences.js';

test('preferences normalize damaged storage without propagating unknown fields or invoking getters', () => {
  assert.equal(Object.isFrozen(DEFAULT_PREFERENCES), true);
  for (const value of [null, [], 'zh-CN', 4, new Date()]) assert.deepEqual(normalizePreferences(value), DEFAULT_PREFERENCES);
  const input = { language: 'zh-CN', mode: 'translate-all', density: 'compact', pageUrl: 'private' };
  Object.defineProperty(input, 'highlight', { get() { assert.fail('must not run accessors'); } });
  assert.deepEqual(normalizePreferences(input), { ...DEFAULT_PREFERENCES, language: 'zh-CN', density: 'compact' });
  assert.equal(input.mode, 'translate-all');
});

test('preference patches validate strictly, allow partial updates and reject hidden or unknown fields', () => {
  assert.deepEqual(validatePreferences({}), {});
  assert.deepEqual(validatePreferences({ mode: 'annotate', language: 'zh-CN' }), { mode: 'annotate', language: 'zh-CN' });
  for (const value of [null, [], 0, { language: 'zh' }, { density: 'tiny' }, { highlight: true }, { mode: '' }, { pageText: 'private' }, { [Symbol('extra')]: true }]) assert.throws(() => validatePreferences(value), TypeError);
  assert.throws(() => validatePreferences(Object.defineProperty({}, 'language', { get() { assert.fail(); } })), TypeError);
  assert.throws(() => validatePreferences(JSON.parse('{"__proto__":{"language":"zh-CN"}}')), TypeError);
});

test('plain preference records crossing JavaScript realms retain only their allowed settings', () => {
  const value = vm.runInNewContext('({ language: "zh-CN", density: "compact" })');
  assert.deepEqual(validatePreferences(value), { language: 'zh-CN', density: 'compact' });
  assert.equal(normalizePreferences(value).language, 'zh-CN');
});

test('v0.4 preferences migrate with reading surfaces off and guide incomplete; explicit booleans only', () => {
  const migrated = normalizePreferences({ language:'zh-CN', mode:'annotate' });
  assert.equal(migrated.includeFrames, false);
  assert.equal(migrated.includeShadowRoots, false);
  assert.equal(migrated.guideCompleted, false);
  const patch = { includeFrames:true, includeShadowRoots:true, guideCompleted:true };
  assert.deepEqual(validatePreferences(patch), patch);
  for (const key of Object.keys(patch)) {
    for (const value of ['true', 1, null, {}]) assert.throws(() => validatePreferences({ [key]:value }), TypeError);
    assert.equal(normalizePreferences({ [key]:'true' })[key], false);
  }
});
