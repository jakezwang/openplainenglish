import test from 'node:test';
import assert from 'node:assert/strict';
import { createCommandHandler } from '../src/background/commands.js';

function harness(handle) {
  const calls = [];
  const chrome = { action: {
    setBadgeText: async (value) => calls.push({ badge: value.text }),
    setTitle: async (value) => calls.push({ title: value.title }),
  } };
  const actions = { handle: async (message) => { calls.push({ message }); return handle(message); } };
  return { chrome, calls, handle: createCommandHandler(chrome, actions) };
}

test('unknown commands are no-ops, including object-property names', async () => {
  const h = harness(() => assert.fail('unknown commands must not dispatch'));
  for (const command of ['unlisted', '', 'constructor', '__proto__', null, undefined, {}]) {
    assert.equal(await h.handle(command), undefined);
  }
  assert.deepEqual(h.calls, []);
});

test('successful toggle and restore reset both the badge and normal toolbar title', async () => {
  const h = harness(() => ({ ok: true }));
  for (const [command, type] of [['toggle-reading', 'OPE_TOGGLE_ACTIVE'], ['restore-original', 'OPE_DISABLE_ACTIVE']]) {
    assert.equal(await h.handle(command), true);
    assert.deepEqual(h.calls.splice(0), [{ message: { type } }, { badge: '' }, { title: 'OpenPlainEnglish' }]);
  }
});

test('resolved refusals and missing acknowledgments show a failure instead of clearing it', async () => {
  for (const response of [{ ok: false, error: 'Unsupported document' }, undefined, { state: { enabled: false } }]) {
    const h = harness(() => response);
    assert.equal(await h.handle('toggle-reading'), false);
    assert.deepEqual(h.calls.slice(1), [
      { badge: '!' }, { title: 'OpenPlainEnglish: open the toolbar on a regular web page to continue.' },
    ]);
  }
});

test('thrown failures do not poison later commands and their stale title is reset on recovery', async () => {
  let fail = true;
  const h = harness(() => { if (fail) { fail = false; throw new Error('Permission unavailable'); } return { ok: true }; });
  assert.equal(await h.handle('toggle-reading'), false);
  assert.equal(await h.handle('restore-original'), true);
  assert.deepEqual(h.calls.slice(-2), [{ badge: '' }, { title: 'OpenPlainEnglish' }]);
});

test('slow or rejected toolbar updates cannot overwrite a later command or leak a rejection', async () => {
  let release;
  let actions = 0;
  const h = harness(() => ({ ok: ++actions > 1 }));
  h.chrome.action.setBadgeText = async ({ text }) => {
    if (text === '!') await new Promise((resolve) => { release = resolve; });
    h.calls.push({ badge: text });
  };
  h.chrome.action.setTitle = async () => { throw new Error('Toolbar unavailable'); };
  const first = h.handle('toggle-reading');
  while (!release) await new Promise((resolve) => setImmediate(resolve));
  const second = h.handle('restore-original');
  assert.equal(actions, 1);
  release();
  assert.deepEqual(await Promise.all([first, second]), [false, true]);
  assert.equal(h.calls.at(-1).badge, '');
});
