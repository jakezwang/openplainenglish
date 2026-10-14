import test from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { createReader } from '../src/content/controller.js';
import { accessibleFrameDocument } from '../src/content/surfaces.js';
import { INLINE_REVIEW_METHOD } from '../src/core/inline.js';

const entry = {
  id: 'hypertension', term: 'hypertension', aliases: ['high blood pressure'], short: 'High blood pressure', explanation: 'An explanation.', context: 'A source example.',
  sources: [{ label: 'Source', url: 'https://example.org/source' }], review: { status: 'source-checked', date: '2026-10-13', method: INLINE_REVIEW_METHOD },
  inline: { replacements: [{ from: 'hypertension', to: 'high blood pressure' }], note: 'Only reviewed wording.', review: { status: 'source-checked', date: '2026-10-13', method: INLINE_REVIEW_METHOD } },
};
function fixture(t, html = '<p>hypertension</p><div id="host"></div><iframe id="frame"></iframe>', options = {}) {
  const dom = new JSDOM(`<!doctype html><html lang="en"><body>${html}</body></html>`, { url: 'https://example.org/reading', pretendToBeVisual: true });
  const document = dom.window.document;
  const host = document.getElementById('host');
  const shadow = host?.attachShadow({ mode: 'open' });
  if (shadow) shadow.innerHTML = '<p>hypertension in a component</p>';
  const frame = document.getElementById('frame');
  const child = frame?.contentDocument;
  if (child) child.body.innerHTML = '<p>hypertension in a frame</p>';
  const reader = createReader({ document, entries: [entry], ...options });
  t.after(() => { reader.destroy(); dom.window.close(); });
  return { dom, document, reader, host, shadow, frame, child };
}
function text(root) { return root.querySelector('p')?.textContent; }
function marks(root) { return [...root.querySelectorAll('[data-ope-term]')]; }
async function eventually(condition) {
  const end = Date.now() + 1800;
  while (!condition() && Date.now() < end) await new Promise((resolve) => setTimeout(resolve, 10));
  assert.ok(condition(), 'the opted-in surface update should settle');
}

test('both additional surfaces default off; the independent opt-ins apply only their chosen accessible DOM', (t) => {
  const { reader, document, shadow, child } = fixture(t);
  assert.equal(reader.enable().count, 1);
  assert.equal(text(document), 'high blood pressure');
  assert.equal(text(shadow), 'hypertension in a component');
  assert.equal(text(child), 'hypertension in a frame');
  reader.setPreferences({ includeFrames: true });
  assert.equal(reader.getState().count, 2);
  assert.equal(text(child), 'high blood pressure in a frame');
  assert.equal(marks(shadow).length, 0);
  reader.setPreferences({ includeShadowRoots: true });
  assert.equal(reader.getState().count, 3);
  assert.equal(text(shadow), 'high blood pressure in a component');
  reader.setPreferences({ includeFrames: false });
  assert.equal(reader.getState().count, 2);
  assert.equal(text(child), 'hypertension in a frame');
  reader.disable();
  assert.equal(text(document), 'hypertension');
  assert.equal(text(shadow), 'hypertension in a component');
  assert.equal(text(child), 'hypertension in a frame');
  assert.equal(shadow.querySelector('[data-ope-owned]'), null);
});

test('surface preferences while off never activate reading, and mode/display preferences propagate to all active surfaces', (t) => {
  const { reader, shadow, child } = fixture(t);
  reader.setPreferences({ includeFrames: true, includeShadowRoots: true, mode: 'annotate', language: 'zh-CN', highlight: 'strong', density: 'compact', guideCompleted: true });
  assert.equal(reader.getState().enabled, false);
  assert.equal(marks(shadow).length, 0);
  assert.equal(marks(child).length, 0);
  assert.equal(reader.enable().count, 3);
  assert.equal(reader.getState().replacedCount, 0);
  reader.setMode('plain');
  assert.equal(reader.getState().replacedCount, 3);
  assert.equal(marks(shadow)[0].dataset.opeHighlight, 'strong');
  assert.equal(marks(child)[0].dataset.opeHighlight, 'strong');
  marks(shadow)[0].click();
  const panel = shadow.ownerDocument.querySelector('[data-ope-owned="panel"]').shadowRoot;
  assert.equal(panel.querySelector('.panel').lang, 'zh-CN');
  assert.ok(panel.querySelector('.panel').classList.contains('compact'));
  reader.setPreferences({ mode: 'annotate' });
  assert.equal(reader.getState().replacedCount, 0);
  assert.equal(text(shadow), 'hypertension in a component');
  assert.equal(text(child), 'hypertension in a frame');
});

test('all surfaces share one mark limit and one initial text-node scan limit', (t) => {
  for (const limits of [{ maxMarks: 2 }, { maxNodes: 2 }]) {
    const { reader, document, shadow, child } = fixture(t, undefined, { preferences: { includeFrames: true, includeShadowRoots: true }, ...limits });
    const state = reader.enable();
    assert.equal(state.count, 2);
    assert.equal(state.truncated, true);
    assert.equal(marks(document).length + marks(shadow).length + marks(child).length, 2);
    reader.disable();
    assert.equal(text(shadow), 'hypertension in a component');
    assert.equal(text(child), 'hypertension in a frame');
  }
});

test('single occurrence restore stays local, while ignore is shared with current and subsequently added surfaces', async (t) => {
  const { reader, document, shadow, child } = fixture(t, undefined, { preferences: { includeFrames: true, includeShadowRoots: true } });
  reader.enable();
  reader.restoreOccurrence(marks(shadow)[0]);
  assert.equal(reader.getState().replacedCount, 2);
  assert.equal(text(shadow), 'hypertension in a component');
  assert.equal(text(child), 'high blood pressure in a frame');
  marks(child)[0].click();
  child.querySelector('[data-ope-owned="panel"]').shadowRoot.querySelector('.ignore-term').click();
  assert.equal(reader.getState().count, 0);
  assert.equal(text(document), 'hypertension');
  assert.equal(text(child), 'hypertension in a frame');
  const host = document.createElement('div');
  host.attachShadow({ mode: 'open' }).innerHTML = '<p>hypertension later</p>';
  document.body.append(host);
  await new Promise((resolve) => setTimeout(resolve, 120));
  assert.equal(marks(host.shadowRoot).length, 0);
  reader.disable();
  reader.enable();
  assert.equal(reader.getState().count, 0);
});

test('new host surfaces and dynamic text are observed, and removal restores held roots without reinserting them', async (t) => {
  const { reader, document, shadow, child, host, frame } = fixture(t, undefined, { preferences: { includeFrames: true, includeShadowRoots: true } });
  reader.enable();
  const added = document.createElement('div');
  added.attachShadow({ mode: 'open' }).innerHTML = '<p>hypertension later</p>';
  document.body.append(added);
  await eventually(() => reader.getState().count === 4);
  const p = document.createElement('p'); p.textContent = 'hypertension again'; shadow.append(p);
  await eventually(() => reader.getState().count === 5);
  const heldFrameParagraph = child.querySelector('p');
  host.remove();
  frame.remove();
  await eventually(() => reader.getState().count === 2 && text(shadow) === 'hypertension in a component' && heldFrameParagraph.textContent === 'hypertension in a frame');
  assert.equal(text(shadow), 'hypertension in a component');
  assert.equal(heldFrameParagraph.textContent, 'hypertension in a frame');
  assert.equal(child.querySelector('p'), null, 'the reader must not repopulate a document cleared by frame removal');
  assert.equal(shadow.querySelector('[data-ope-owned]'), null);
  assert.equal(child.querySelector('[data-ope-owned]'), null);
  p.textContent = 'hypertension after removal';
  const retiredText = child.createElement('p'); retiredText.textContent = 'hypertension after removal'; child.body.append(retiredText);
  await new Promise((resolve) => setTimeout(resolve, 120));
  assert.equal(marks(shadow).length, 0);
  assert.equal(marks(child).length, 0);
  assert.equal(document.body.contains(host), false);
});

test('same-origin frame navigation retires the old document and observes the new document after load', async (t) => {
  const { reader, frame, child, dom } = fixture(t, undefined, { preferences: { includeFrames: true } });
  reader.enable();
  const next = new JSDOM('<!doctype html><html lang="en"><body><p>hypertension new document</p></body></html>', { url: 'https://example.org/next', pretendToBeVisual: true });
  t.after(() => next.window.close());
  Object.defineProperty(frame, 'contentDocument', { configurable: true, get: () => next.window.document });
  frame.dispatchEvent(new dom.window.Event('load'));
  await eventually(() => text(next.window.document) === 'high blood pressure new document');
  assert.equal(text(child), 'hypertension in a frame');
  assert.equal(child.querySelector('[data-ope-owned]'), null);
  assert.equal(reader.getState().count, 2);
  child.body.firstChild.textContent = 'hypertension retired';
  await new Promise((resolve) => setTimeout(resolve, 120));
  assert.equal(marks(child).length, 0);
  reader.disable();
  assert.equal(text(next.window.document), 'hypertension new document');
});

test('cross-origin, inaccessible, sandboxed and closed surfaces stay unchanged', (t) => {
  const { reader, document, frame, child } = fixture(t, '<p>hypertension</p><iframe id="frame"></iframe><div id="closed"></div>', { preferences: { includeFrames: true, includeShadowRoots: true } });
  const closed = document.getElementById('closed').attachShadow({ mode: 'closed' });
  closed.innerHTML = '<p>hypertension closed</p>';
  frame.setAttribute('sandbox', 'allow-scripts');
  assert.equal(accessibleFrameDocument(frame), null);
  reader.enable();
  assert.equal(reader.getState().count, 1);
  assert.equal(marks(closed).length, 0);
  assert.equal(text(child), 'hypertension in a frame');
  frame.removeAttribute('sandbox');
  const foreign = new JSDOM('<p>hypertension foreign</p>', { url: 'https://foreign.example/' });
  t.after(() => foreign.window.close());
  Object.defineProperty(frame, 'contentDocument', { configurable: true, get: () => foreign.window.document });
  assert.equal(accessibleFrameDocument(frame), null);
  reader.refreshSurfaces();
  assert.equal(marks(foreign.window.document).length, 0);
  Object.defineProperty(frame, 'contentDocument', { configurable: true, get: () => { throw new Error('SecurityError'); } });
  assert.doesNotThrow(() => reader.refreshSurfaces());
  assert.equal(reader.getState().count, 1);
});

test('host text edits and new same-value nodes inside surfaces survive immediate opt-out and disable', (t) => {
  const { reader, shadow, child } = fixture(t, undefined, { preferences: { includeFrames: true, includeShadowRoots: true } });
  reader.enable();
  marks(shadow)[0].firstChild.data = 'website correction';
  marks(child)[0].textContent = marks(child)[0].textContent;
  reader.setPreferences({ includeShadowRoots: false, includeFrames: false });
  assert.equal(text(shadow), 'website correction in a component');
  assert.equal(text(child), 'high blood pressure in a frame');
  assert.equal(marks(shadow).length, 0);
  assert.equal(marks(child).length, 0);
  reader.disable();
  assert.equal(text(shadow), 'website correction in a component');
});

test('print events restore original wording across surfaces and never reactivate after disable', (t) => {
  const { reader, dom, document, shadow, child } = fixture(t, undefined, { preferences: { includeFrames: true, includeShadowRoots: true } });
  reader.enable();
  dom.window.dispatchEvent(new dom.window.Event('beforeprint'));
  assert.equal(text(document), 'hypertension');
  assert.equal(text(shadow), 'hypertension in a component');
  assert.equal(text(child), 'hypertension in a frame');
  dom.window.dispatchEvent(new dom.window.Event('afterprint'));
  assert.equal(reader.getState().replacedCount, 3);
  reader.setPreferences({ includeShadowRoots: false });
  dom.window.dispatchEvent(new dom.window.Event('beforeprint'));
  assert.equal(text(child), 'hypertension in a frame', 'opting out one shadow must not remove the document print handler');
  reader.disable();
  dom.window.dispatchEvent(new dom.window.Event('afterprint'));
  assert.equal(reader.getState().enabled, false);
});

test('composed exclusions and visibility changes protect hidden, editable and non-English hosts', async (t) => {
  const { reader, host, shadow, frame, child } = fixture(t, undefined, { preferences: { includeFrames: true, includeShadowRoots: true } });
  host.hidden = true; frame.setAttribute('contenteditable', 'true');
  assert.equal(reader.enable().count, 1);
  host.hidden = false; frame.removeAttribute('contenteditable');
  await eventually(() => reader.getState().count === 3);
  host.lang = 'fr'; frame.style.display = 'none';
  await eventually(() => reader.getState().count === 1);
  assert.equal(text(shadow), 'hypertension in a component');
  assert.equal(text(child), 'hypertension in a frame');
});

test('direct shadow text and nested opted-in surfaces are reversible; late root attachment uses explicit refresh', (t) => {
  const { reader, document, shadow } = fixture(t, '<p>hypertension</p><div id="host"></div><div id="late"></div>', { preferences: { includeFrames: true, includeShadowRoots: true } });
  shadow.textContent = 'hypertension';
  const nested = document.createElement('div');
  nested.attachShadow({ mode: 'open' }).innerHTML = '<p>hypertension nested</p>';
  shadow.append(nested);
  assert.equal(reader.enable().count, 3);
  assert.equal(shadow.firstChild.textContent, 'high blood pressure');
  const late = document.getElementById('late').attachShadow({ mode: 'open' });
  late.innerHTML = '<p>hypertension late</p>';
  assert.equal(marks(late).length, 0, 'attachShadow itself emits no parent DOM mutation');
  reader.refreshSurfaces();
  assert.equal(reader.getState().count, 4);
  reader.disable();
  assert.equal(shadow.firstChild.textContent, 'hypertension');
  assert.equal(text(nested.shadowRoot), 'hypertension nested');
  assert.equal(text(late), 'hypertension late');
});

test('nested same-origin frames inherit srcdoc origin and their open roots require both opt-ins', (t) => {
  const { reader, child } = fixture(t, undefined, { preferences: { includeFrames: true } });
  const component = child.createElement('div');
  const open = component.attachShadow({ mode: 'open' }); open.innerHTML = '<p>hypertension nested component</p>'; child.body.append(component);
  const nestedFrame = child.createElement('iframe'); child.body.append(nestedFrame);
  const nested = new JSDOM('<!doctype html><html lang="en"><body><p>hypertension nested frame</p></body></html>', { url: 'https://example.org/nested', pretendToBeVisual: true });
  t.after(() => nested.window.close());
  Object.defineProperty(nestedFrame, 'contentDocument', { configurable: true, get: () => nested.window.document });
  assert.equal(accessibleFrameDocument(nestedFrame), nested.window.document);
  assert.equal(reader.enable().count, 3);
  assert.equal(marks(open).length, 0);
  reader.setPreferences({ includeShadowRoots: true });
  assert.equal(reader.getState().count, 5);
  assert.equal(text(open), 'high blood pressure nested component');
  reader.disable();
  assert.equal(text(open), 'hypertension nested component');
  assert.equal(text(nested.window.document), 'hypertension nested frame');
});

test('adopting an open host into another opted-in document recreates its reader in the new owner context', async (t) => {
  const { reader, host, shadow, child } = fixture(t, '<div id="host"></div><iframe id="frame"></iframe>', { preferences: { includeFrames: true, includeShadowRoots: true } });
  child.body.replaceChildren();
  assert.equal(reader.enable().count, 1);
  child.body.append(host);
  await eventually(() => reader.getState().count === 1 && shadow.ownerDocument === child);
  assert.equal(text(shadow), 'high blood pressure in a component');
  marks(shadow)[0].click();
  assert.ok(child.querySelector('[data-ope-owned="panel"]'), 'an adopted phrase must open in its current document');
  shadow.querySelector('p').textContent = 'hypertension changed after adoption';
  await eventually(() => reader.getState().count === 1 && text(shadow) === 'high blood pressure changed after adoption');
  reader.disable();
  assert.equal(text(shadow), 'hypertension changed after adoption');
  assert.equal(shadow.querySelector('[data-ope-owned]'), null);
});
