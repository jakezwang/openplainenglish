import test from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { createReader } from '../src/content/controller.js';

const entries = [
  {
    id: 'pain', term: 'pain', aliases: [], domain: 'health',
    short: 'An unpleasant feeling', explanation: 'Pain can have different causes.',
    context: 'The word alone does not identify a cause.',
    sources: [{ label: 'Public reference', url: 'https://example.org/pain', license: 'Public-Domain-US' }],
    review: { status: 'source-checked', date: '2026-10-13', method: 'Compared with the cited source.' },
  },
  {
    id: 'asthma', term: 'asthma', aliases: [], domain: 'health',
    short: 'A condition affecting breathing', explanation: 'Asthma affects the airways.',
    context: 'An explanation of a term does not diagnose a person.',
    sources: [{ label: 'Public reference', url: 'https://example.org/asthma', license: 'Public-Domain-US' }],
    review: { status: 'source-checked', date: '2026-10-13', method: 'Compared with the cited source.' },
  },
];

function fixture(t, html, options = {}) {
  const dom = new JSDOM(`<!doctype html><html lang="en"><head></head><body>${html}</body></html>`, {
    url: 'https://public.example/reading', pretendToBeVisual: true,
  });
  const document = dom.window.document;
  const reader = createReader({ document, entries, ...options });
  t.after(() => { reader.destroy(); dom.window.close(); });
  return { dom, document, reader };
}

function marks(document) { return [...document.querySelectorAll('[data-ope-term]')]; }
function panel(document) { return document.querySelector('[data-ope-owned="panel"]')?.shadowRoot; }
async function eventually(condition) {
  const deadline = Date.now() + 1500;
  while (Date.now() < deadline) {
    if (condition()) return;
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
  assert.ok(condition(), 'the page update should be reflected in the reader');
}

test('enable is explicit and repeatable; disable restores wording and existing page structure', (t) => {
  const { document, reader } = fixture(t, '<article id="reading">Pain and <em>asthma</em>; pain.</article>');
  const article = document.getElementById('reading');
  const originalText = article.textContent;
  const originalHTML = article.innerHTML;
  assert.deepEqual(reader.getState(), { enabled: false, count: 0, truncated: false });
  assert.equal(marks(document).length, 0);
  assert.equal(reader.enable().count, 3);
  const firstMarks = marks(document);
  assert.equal(article.textContent, originalText);
  reader.enable();
  assert.deepEqual(marks(document), firstMarks, 'enabling twice must not add duplicate marks');
  assert.equal(document.querySelectorAll('style[data-ope-owned]').length, 1);
  assert.deepEqual(reader.disable(), { enabled: false, count: 0, truncated: false });
  assert.equal(article.innerHTML, originalHTML);
  assert.equal(document.querySelector('[data-ope-owned]'), null);
  assert.equal(reader.enable().count, 3);
});

test('forms, editing controls, interactive content, code, hidden and non-English passages are excluded', (t) => {
  const { document, reader } = fixture(t, `
    <p id="allowed">pain <span lang="en-US">asthma</span></p>
    <form>pain <label>pain <input value="pain"></label><textarea>pain</textarea><select><option>pain</option></select></form>
    <label>pain</label><a href="/">pain</a><button>pain</button><code>pain</code><pre>pain</pre><kbd>pain</kbd>
    <p contenteditable="true">pain</p><p contenteditable="plaintext-only">pain</p>
    <div role="button">pain</div><div role="link">pain</div><div role="textbox">pain</div>
    <p hidden>pain</p><div aria-hidden="true"><span>pain</span></div><div inert>pain</div>
    <div style="display:none"><span>pain</span></div><div style="visibility:hidden"><span>pain</span></div>
    <div lang="fr"><p>pain</p><p lang="en">asthma</p></div>
    <div data-ope-owned="fixture">pain</div><script>pain</script><style>.pain { color: red; }</style>
  `);
  reader.enable();
  assert.deepEqual(marks(document).map((mark) => mark.textContent), ['pain', 'asthma', 'asthma']);
  assert.ok(marks(document).every((mark) => mark.closest('#allowed, [lang="en"]')));
  assert.equal(document.querySelector('input').value, 'pain');
  assert.equal(document.querySelector('textarea').value, 'pain');
});

test('iframe and shadow-root content is not scanned; split-node phrases are not invented', (t) => {
  const phrase = { ...entries[0], id: 'chest-pain', term: 'chest pain', aliases: [] };
  const { document, reader } = fixture(t, '<p>chest <em>pain</em></p><iframe></iframe><div id="shadow"></div>', { entries: [phrase] });
  document.getElementById('shadow').attachShadow({ mode: 'open' }).innerHTML = '<p>chest pain</p>';
  document.querySelector('iframe').contentDocument.body.innerHTML = '<p>chest pain</p>';
  reader.enable();
  assert.equal(marks(document).length, 0);
  assert.equal(document.getElementById('shadow').shadowRoot.querySelector('[data-ope-term]'), null);
  assert.equal(document.querySelector('iframe').contentDocument.querySelector('[data-ope-term]'), null);
});

test('new and changed ordinary text is marked dynamically, and disconnected marks do not count', async (t) => {
  const { document, reader } = fixture(t, '<p id="first">Ordinary text.</p>');
  reader.enable();
  const added = document.createElement('p');
  added.textContent = 'pain and asthma';
  document.body.append(added);
  await eventually(() => reader.getState().count === 2);
  const first = document.getElementById('first');
  first.firstChild.data = 'pain appears now';
  await eventually(() => reader.getState().count === 3);
  added.remove();
  await eventually(() => reader.getState().count === 1);
  reader.disable();
  assert.equal(first.textContent, 'pain appears now');
  first.firstChild.data = 'asthma after disable';
  await new Promise((resolve) => setTimeout(resolve, 110));
  assert.equal(marks(document).length, 0, 'the observer must stop after disable');
});

test('page changes to previously marked text update its explanation rather than keeping a stale term', async (t) => {
  const { document, reader } = fixture(t, '<p>pain</p>');
  reader.enable();
  marks(document)[0].firstChild.data = 'asthma';
  await eventually(() => marks(document).length === 1 && marks(document)[0].dataset.opeTerm === 'asthma');
  marks(document)[0].firstChild.data = 'ordinary wording';
  await eventually(() => marks(document).length === 0);
  reader.disable();
  assert.equal(document.querySelector('p').textContent, 'ordinary wording');
});

test('disable preserves edits made by the page and removes its document listeners', (t) => {
  const { dom, document, reader } = fixture(t, '<p>pain</p>');
  reader.enable();
  const mark = marks(document)[0];
  mark.textContent = 'updated page wording';
  mark.click();
  assert.ok(panel(document));
  reader.disable();
  assert.equal(document.querySelector('p').textContent, 'updated page wording');
  assert.equal(panel(document), undefined);
  // A stale DOM reference must not reopen the reader after it has been disabled.
  document.body.append(mark);
  mark.click();
  mark.dispatchEvent(new dom.window.KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
  const escape = new dom.window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true });
  document.dispatchEvent(escape);
  assert.equal(panel(document), undefined);
  assert.equal(escape.defaultPrevented, false);
});

test('large-page work is bounded and reported without dropping original text', (t) => {
  const { document, reader } = fixture(t, `<article>${'<p>pain</p>'.repeat(20)}</article>`, { maxMarks: 3, maxNodes: 8 });
  const original = document.querySelector('article').textContent;
  const state = reader.enable();
  assert.equal(state.count, 3);
  assert.equal(state.truncated, true);
  assert.equal(document.querySelector('article').textContent, original);
  reader.disable();
  assert.equal(document.querySelector('article').textContent, original);
  assert.equal(marks(document).length, 0);
});

test('a node budget also limits pages without many matching terms', (t) => {
  const { document, reader } = fixture(t, '<p>ordinary</p><p>ordinary</p><p>ordinary</p><p>pain</p>', { maxNodes: 2 });
  assert.deepEqual(reader.enable(), { enabled: true, count: 0, truncated: true });
  assert.equal(marks(document).length, 0);
});

test('an exceptionally long text node is skipped and reported without changing its wording', (t) => {
  const longText = 'pain '.repeat(11000);
  const { document, reader } = fixture(t, '<article></article>');
  document.querySelector('article').textContent = longText;
  assert.deepEqual(reader.enable(), { enabled: true, count: 0, truncated: true });
  assert.equal(document.querySelector('article').textContent, longText);
});

test('click and keyboard controls show explanations; Escape restores focus', (t) => {
  const { dom, document, reader } = fixture(t, '<p>pain and asthma</p>');
  reader.enable();
  const [pain, asthma] = marks(document);
  assert.equal(pain.getAttribute('role'), 'button');
  assert.equal(pain.tabIndex, 0);
  assert.match(pain.getAttribute('aria-label'), /pain/i);
  pain.click();
  let shadow = panel(document);
  assert.ok(shadow.querySelector('[role="dialog"]'));
  assert.ok(shadow.textContent.includes(entries[0].explanation));
  assert.ok(shadow.textContent.includes(entries[0].context));
  assert.match(shadow.textContent, /not an independent clinical review/i);
  assert.equal(shadow.activeElement.getAttribute('aria-label'), 'Close explanation');
  document.dispatchEvent(new dom.window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }));
  assert.equal(panel(document), undefined);
  assert.equal(document.activeElement, pain);
  for (const key of ['Enter', ' ']) {
    asthma.focus();
    const event = new dom.window.KeyboardEvent('keydown', { key, bubbles: true, cancelable: true });
    asthma.dispatchEvent(event);
    assert.equal(event.defaultPrevented, true);
    shadow = panel(document);
    assert.ok(shadow.textContent.includes(entries[1].explanation));
    shadow.querySelector('[aria-label="Close explanation"]').click();
    assert.equal(document.activeElement, asthma);
  }
});

test('source URLs are safe, explanation text stays text, and feedback requires a chosen control', (t) => {
  const feedback = [];
  const unsafe = {
    ...entries[0], short: '<img src=x onerror="alert(1)">',
    explanation: '<script>alert(1)</script>',
    sources: [
      { label: '<b>Safe reference</b>', url: 'https://example.org/source' },
      { label: 'Script', url: 'javascript:alert(1)' },
      { label: 'Data', url: 'data:text/html,hello' },
      { label: 'Malformed', url: 'not a URL' },
    ],
  };
  const { document, reader } = fixture(t, '<p>pain</p>', { entries: [unsafe], onFeedback: (...args) => feedback.push(args) });
  reader.enable();
  assert.equal(feedback.length, 0);
  assert.equal(reader.openFirst(), true);
  const shadow = panel(document);
  assert.equal(shadow.querySelector('script, img, b'), null);
  const links = [...shadow.querySelectorAll('a')];
  assert.equal(links.length, 1);
  assert.equal(links[0].href, 'https://example.org/source');
  assert.equal(links[0].target, '_blank');
  assert.ok(links[0].relList.contains('noopener'));
  assert.ok(links[0].relList.contains('noreferrer'));
  assert.equal(feedback.length, 0);
  const buttons = [...shadow.querySelectorAll('button')];
  buttons.find((button) => /hard to understand/i.test(button.textContent)).click();
  buttons.find((button) => /inaccurate/i.test(button.textContent)).click();
  assert.deepEqual(feedback, [[unsafe, 'unclear'], [unsafe, 'inaccurate']]);
});

test('visibility changes remove marks and newly revealed content is annotated', async (t) => {
  const { document, reader } = fixture(t, '<section id="region" hidden><p>pain and asthma</p></section>');
  const region = document.getElementById('region');
  reader.enable();
  assert.equal(reader.getState().count, 0);
  region.hidden = false;
  await eventually(() => reader.getState().count === 2);
  region.style.display = 'none';
  await eventually(() => reader.getState().count === 0);
  region.style.display = '';
  await eventually(() => reader.getState().count === 2);
  reader.disable();
  assert.equal(region.textContent, 'pain and asthma');
});

test('a region that becomes editable is restored until it becomes readable again', async (t) => {
  const { document, reader } = fixture(t, '<section id="region"><p>pain</p></section>');
  const region = document.getElementById('region');
  reader.enable();
  assert.equal(reader.getState().count, 1);
  region.setAttribute('contenteditable', 'true');
  await eventually(() => reader.getState().count === 0);
  assert.equal(region.querySelector('[data-ope-term]'), null);
  assert.equal(region.textContent, 'pain');
  region.setAttribute('contenteditable', 'false');
  await eventually(() => reader.getState().count === 1);
});

test('an explanation closes when an attribute change removes its readable anchor', async (t) => {
  const { document, reader } = fixture(t, '<section id="region"><p>pain</p></section>');
  reader.enable();
  marks(document)[0].click();
  assert.ok(panel(document));
  document.getElementById('region').hidden = true;
  await eventually(() => reader.getState().count === 0);
  assert.equal(panel(document), undefined, 'a hidden or editable term must not leave a stale explanation open');
});

test('rendering reader state in an owned status region cannot trigger a notification loop', async (t) => {
  let notifications = 0;
  let document;
  const setup = fixture(t, '<p>pain</p><output id="status" data-ope-owned="status"></output>', {
    onStateChange(state) {
      notifications++;
      // Cap writes so a buggy observer produces a failing assertion rather than
      // starving the test runner in an endless mutation/microtask loop.
      if (notifications <= 10) document.getElementById('status').textContent = `Enabled: ${state.enabled}; marked: ${state.count}`;
    },
  });
  document = setup.document;
  setup.reader.enable();
  await new Promise((resolve) => setTimeout(resolve, 110));
  assert.equal(notifications, 1, 'owned status rendering must not count as a reader change');
  assert.equal(setup.reader.getState().count, 1);
  assert.equal(document.getElementById('status').querySelector('[data-ope-term]'), null);
});

test('changing the document language reconciles marks in inherited-language passages', async (t) => {
  const { document, reader } = fixture(t, '<p>pain</p><p lang="en">asthma</p>');
  reader.enable();
  assert.equal(reader.getState().count, 2);
  document.documentElement.lang = 'fr';
  await eventually(() => reader.getState().count === 1);
  assert.equal(marks(document)[0].textContent, 'asthma', 'an explicit English passage remains eligible');
  document.documentElement.lang = 'en';
  await eventually(() => reader.getState().count === 2);
});

test('a region that becomes interactive is unmarked until its role is removed', async (t) => {
  const { document, reader } = fixture(t, '<section id="region"><p>pain</p></section>');
  const region = document.getElementById('region');
  reader.enable();
  assert.equal(reader.getState().count, 1);
  region.setAttribute('role', 'button');
  await eventually(() => reader.getState().count === 0);
  assert.equal(region.querySelector('[data-ope-term]'), null);
  assert.equal(region.textContent, 'pain');
  region.removeAttribute('role');
  await eventually(() => reader.getState().count === 1);
});
