import test from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { createReader } from '../src/content/controller.js';
import { INLINE_REVIEW_METHOD } from '../src/core/inline.js';

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
  assert.deepEqual(reader.getState(), { enabled: false, mode: 'plain', count: 0, replacedCount: 0, annotatedCount: 0, truncated: false });
  assert.equal(marks(document).length, 0);
  assert.equal(reader.enable().count, 3);
  const firstMarks = marks(document);
  assert.equal(article.textContent, originalText);
  reader.enable();
  assert.deepEqual(marks(document), firstMarks, 'enabling twice must not add duplicate marks');
  assert.equal(document.querySelectorAll('style[data-ope-owned]').length, 1);
  assert.deepEqual(reader.disable(), { enabled: false, mode: 'plain', count: 0, replacedCount: 0, annotatedCount: 0, truncated: false });
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
  assert.equal(panel(document), undefined, 'changed wording must not open a stale explanation');
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
  assert.deepEqual(reader.enable(), { enabled: true, mode: 'plain', count: 0, replacedCount: 0, annotatedCount: 0, truncated: true });
  assert.equal(marks(document).length, 0);
});

test('an exceptionally long text node is skipped and reported without changing its wording', (t) => {
  const longText = 'pain '.repeat(11000);
  const { document, reader } = fixture(t, '<article></article>');
  document.querySelector('article').textContent = longText;
  assert.deepEqual(reader.enable(), { enabled: true, mode: 'plain', count: 0, replacedCount: 0, annotatedCount: 0, truncated: true });
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

test('closed details and its interactive summary are skipped until the content is opened', async (t) => {
  const { document, reader } = fixture(t, '<details><summary>pain</summary><p>asthma</p></details>');
  reader.enable();
  assert.equal(reader.getState().count, 0);
  document.querySelector('details').open = true;
  await eventually(() => reader.getState().count === 1);
  assert.equal(marks(document)[0].textContent, 'asthma');
  assert.equal(document.querySelector('summary [data-ope-term]'), null);
  document.querySelector('details').open = false;
  await eventually(() => reader.getState().count === 0);
});

test('root display hiding is honored and a visibility override can reveal readable text', async (t) => {
  const { document, reader } = fixture(t, '<div style="visibility:hidden"><p style="visibility:visible">pain</p></div>');
  document.documentElement.style.display = 'none';
  reader.enable();
  assert.equal(reader.getState().count, 0);
  document.documentElement.style.display = '';
  await eventually(() => reader.getState().count === 1);
});

test('attribute rescans preserve the longest phrase and coalesce nested changed regions', async (t) => {
  const phrase = { ...entries[0], id: 'chest-pain', term: 'chest pain' };
  const { document, reader } = fixture(t, '<section id="outer"><p id="inner">chest pain</p></section>', { entries: [entries[0], phrase], maxNodes: 2 });
  reader.enable();
  assert.equal(marks(document)[0].dataset.opeTerm, 'chest-pain');
  document.getElementById('outer').className = 'new-style';
  document.getElementById('inner').className = 'new-style';
  await new Promise((resolve) => setTimeout(resolve, 110));
  assert.equal(reader.getState().count, 1);
  assert.equal(marks(document)[0].dataset.opeTerm, 'chest-pain');
  assert.equal(document.getElementById('inner').textContent, 'chest pain');
});

test('unconfirmed review metadata is not displayed as source-checked', (t) => {
  const unchecked = { ...entries[0], review: { status: 'pending' } };
  const { document, reader } = fixture(t, '<p>pain</p>', { entries: [unchecked] });
  reader.enable();
  reader.openFirst();
  assert.match(panel(document).querySelector('.review').textContent, /Review status not confirmed/);
  assert.doesNotMatch(panel(document).querySelector('.review').textContent, /Source-checked/);
});

test('invalid glossary data is rejected before any page elements or listeners are installed', (t) => {
  const dom = new JSDOM('<p>pain</p>');
  t.after(() => dom.window.close());
  for (const invalid of [null, {}, [null], [{ ...entries[0], aliases: [1] }], [entries[0], entries[0]]]) {
    assert.throws(() => createReader({ document: dom.window.document, entries: invalid }), TypeError);
    assert.equal(dom.window.document.querySelector('[data-ope-owned]'), null);
  }
});

test('the mark limit reports unvisited nodes even when the separate node budget is not reached', (t) => {
  const { reader } = fixture(t, '<p>pain</p><p>pain</p><p>pain</p>', { maxMarks: 2, maxNodes: 100 });
  assert.deepEqual(reader.enable(), { enabled: true, mode: 'plain', count: 2, replacedCount: 0, annotatedCount: 2, truncated: true });
});

test('exactly filling a node or mark budget does not claim truncation when the page is complete', (t) => {
  const { reader } = fixture(t, '<p>pain</p><p>asthma</p>', { maxMarks: 2, maxNodes: 2 });
  assert.deepEqual(reader.enable(), { enabled: true, mode: 'plain', count: 2, replacedCount: 0, annotatedCount: 2, truncated: false });
});

const pressureEntry = {
  ...entries[0], id: 'hypertension', term: 'hypertension', aliases: ['high blood pressure'],
  short: 'An explanatory sentence, not an inline replacement.',
  inline: {
    replacements: [{ from: 'hypertension', to: 'high blood pressure' }],
    note: 'Only the technical term is changed; the already plain alias is kept.',
    review: { status: 'source-checked', date: '2026-10-13', method: INLINE_REVIEW_METHOD },
  },
};

test('plain reading counts replacements and annotation-only forms and restores every original spelling', (t) => {
  const original = 'Hypertension; hypertension; HYPERTENSION; HYpertension; high blood pressure; pain.';
  const { document, reader } = fixture(t, `<p>${original}</p>`, { entries: [pressureEntry, entries[0]] });
  assert.deepEqual(reader.enable(), { enabled: true, mode: 'plain', count: 6, replacedCount: 3, annotatedCount: 3, truncated: false });
  assert.equal(document.querySelector('p').textContent, 'High blood pressure; high blood pressure; HIGH BLOOD PRESSURE; HYpertension; high blood pressure; pain.');
  for (let cycle = 0; cycle < 3; cycle++) {
    reader.setMode('annotate');
    assert.equal(document.querySelector('p').textContent, original);
    assert.equal(reader.getState().replacedCount, 0);
    assert.equal(reader.getState().annotatedCount, 6);
    reader.setMode('plain');
    assert.equal(reader.getState().replacedCount, 3);
  }
  reader.disable();
  assert.equal(document.querySelector('p').textContent, original);
  assert.equal(document.querySelector('[data-ope-owned]'), null);
});

test('mode selection while off is remembered and invalid mode changes are atomic', (t) => {
  const { document, reader } = fixture(t, '<p>hypertension</p>', { entries: [pressureEntry] });
  reader.setMode('annotate');
  assert.equal(reader.getState().mode, 'annotate');
  assert.equal(document.querySelector('[data-ope-owned]'), null);
  assert.equal(reader.enable().mode, 'annotate');
  assert.equal(document.querySelector('p').textContent, 'hypertension');
  reader.enable({ mode: 'plain' });
  assert.equal(document.querySelector('p').textContent, 'high blood pressure');
  const html = document.body.innerHTML;
  const state = reader.getState();
  for (const operation of [() => reader.setMode('rewrite'), () => reader.enable({ mode: 'rewrite' }), () => reader.enable(null)]) {
    assert.throws(operation, TypeError);
    assert.equal(document.body.innerHTML, html);
    assert.deepEqual(reader.getState(), state);
  }
  reader.disable();
  assert.equal(reader.enable().mode, 'plain');
  assert.equal(reader.getState().replacedCount, 1);
});

test('same-node explicit plural phrases retain original whitespace through rescans and mode changes', async (t) => {
  const infarction = {
    ...entries[0], id: 'infarction', term: 'myocardial infarction', aliases: ['myocardial infarctions', 'heart attack', 'heart attacks'],
    inline: { replacements: [{ from: 'myocardial infarction', to: 'heart attack' }, { from: 'myocardial infarctions', to: 'heart attacks' }], note: 'Singular and plural forms are reviewed separately.', review: pressureEntry.inline.review },
  };
  const original = 'Myocardial\n\t  infarction and myocardial infarctions.';
  const { document, reader } = fixture(t, `<p>${original}</p>`, { entries: [infarction] });
  reader.enable();
  assert.equal(document.querySelector('p').textContent, 'Heart attack and heart attacks.');
  document.querySelector('p').className = 'new-style';
  await new Promise((resolve) => setTimeout(resolve, 110));
  assert.equal(reader.getState().replacedCount, 2, 'a rescan must use originals rather than promote rendered plain aliases to source text');
  reader.setMode('annotate');
  assert.equal(document.querySelector('p').textContent, original);
  reader.setMode('plain');
  reader.disable();
  assert.equal(document.querySelector('p').textContent, original);
});

test('immediate disable preserves host text edits and new same-value nodes', (t) => {
  for (const edit of ['data', 'same-value', 'paragraph']) {
    const { document, reader } = fixture(t, '<p>hypertension</p>', { entries: [pressureEntry] });
    reader.enable();
    const mark = marks(document)[0];
    if (edit === 'data') mark.firstChild.data = 'new host wording';
    else if (edit === 'same-value') mark.textContent = mark.textContent;
    else document.querySelector('p').textContent = 'The host replaced this paragraph.';
    mark.click();
    assert.equal(panel(document), undefined, 'a host-modified marker must not show stale original metadata');
    reader.disable();
    const expected = edit === 'data' ? 'new host wording' : edit === 'same-value' ? 'high blood pressure' : 'The host replaced this paragraph.';
    assert.equal(document.querySelector('p').textContent, expected);
    assert.equal(document.querySelector('[data-ope-term]'), null);
  }
});

test('host wrappers and appended nodes survive while an untouched private text node is restored', (t) => {
  const { document, reader } = fixture(t, '<p>hypertension</p>', { entries: [pressureEntry] });
  reader.enable();
  const mark = marks(document)[0];
  const emphasis = document.createElement('em');
  emphasis.className = 'host-format';
  emphasis.append(mark.firstChild);
  const addition = document.createElement('small');
  addition.textContent = ' (host note)';
  mark.append(emphasis, addition);
  reader.disable();
  assert.equal(document.querySelector('p').innerHTML, '<em class="host-format">hypertension</em><small> (host note)</small>');
  assert.equal(document.querySelector('em'), emphasis);
  assert.equal(document.querySelector('small'), addition);
});

test('removed and moved markers never reinsert stale site text or leave replacements in excluded regions', async (t) => {
  const { document, reader } = fixture(t, '<p id="reading">hypertension</p><form id="form"></form>', { entries: [pressureEntry] });
  reader.enable();
  const mark = marks(document)[0];
  document.getElementById('form').append(mark);
  reader.disable();
  assert.equal(document.getElementById('reading').textContent, '');
  assert.equal(document.getElementById('form').textContent, 'hypertension');
  document.getElementById('reading').textContent = 'hypertension';
  reader.enable();
  const held = marks(document)[0];
  held.remove();
  await eventually(() => reader.getState().count === 0);
  assert.equal(document.getElementById('reading').textContent, '');
  assert.equal(held.textContent, 'hypertension');
  assert.equal(held.hasAttribute('data-ope-owned'), false);
  reader.disable();
  assert.equal(document.getElementById('reading').textContent, '');
});

test('adjacent host edits re-evaluate compound and word boundaries before continuing plain reading', async (t) => {
  const { document, reader } = fixture(t, '<p>hypertension level</p>', { entries: [pressureEntry] });
  reader.enable();
  const paragraph = document.querySelector('p');
  paragraph.lastChild.data = '-related condition';
  await eventually(() => reader.getState().replacedCount === 0 && paragraph.textContent === 'hypertension-related condition');
  assert.equal(reader.getState().annotatedCount, 1);
  paragraph.lastChild.data = ' level';
  await eventually(() => reader.getState().replacedCount === 1);
  paragraph.prepend(document.createTextNode('pre'));
  await eventually(() => reader.getState().count === 0);
  assert.equal(paragraph.textContent, 'prehypertension level');
  reader.disable();
  assert.equal(paragraph.textContent, 'prehypertension level');
});

test('dynamic new content and metadata edits preserve originals through immediate mode switches', async (t) => {
  const { document, reader } = fixture(t, '<p>hypertension</p>', { entries: [pressureEntry] });
  reader.enable();
  const first = marks(document)[0];
  first.dataset.opeTerm = 'forged-entry';
  first.click();
  assert.equal(panel(document), undefined);
  await eventually(() => reader.getState().replacedCount === 1 && marks(document)[0].dataset.opeTerm === pressureEntry.id);
  const added = document.createElement('p');
  added.textContent = 'Hypertension';
  document.body.append(added);
  reader.setMode('annotate');
  assert.equal(reader.getState().count, 2);
  assert.equal(document.querySelector('p').textContent, 'hypertension');
  assert.equal(added.textContent, 'Hypertension');
  reader.setMode('plain');
  assert.equal(reader.getState().replacedCount, 2);
  reader.disable();
  assert.equal(added.textContent, 'Hypertension');
});

test('plain marks show exact original case in the panel and keep selection and feedback boundaries', (t) => {
  const feedback = [];
  const { document, reader } = fixture(t, '<p>HYPERTENSION</p>', { entries: [pressureEntry], onFeedback: (...args) => feedback.push(args) });
  reader.enable();
  const mark = marks(document)[0];
  assert.match(mark.title, /HYPERTENSION.*HIGH BLOOD PRESSURE/);
  assert.match(mark.getAttribute('aria-label'), /Original words: HYPERTENSION/);
  const range = document.createRange();
  range.selectNodeContents(mark);
  document.getSelection().addRange(range);
  mark.click();
  assert.equal(panel(document), undefined);
  assert.equal(document.getSelection().toString(), 'HIGH BLOOD PRESSURE');
  document.getSelection().removeAllRanges();
  mark.click();
  const shadow = panel(document);
  assert.equal(shadow.querySelector('.original-words').textContent, 'HYPERTENSION');
  assert.equal(shadow.querySelector('.reading-words').textContent, 'HIGH BLOOD PRESSURE');
  assert.equal(shadow.querySelector('details.wording-note').open, false);
  [...shadow.querySelectorAll('button')].find((button) => /inaccurate/i.test(button.textContent)).click();
  assert.deepEqual(feedback, [[pressureEntry, 'inaccurate']]);
});

test('replacement and annotation totals obey the shared mark limit in either mode', (t) => {
  const { document, reader } = fixture(t, '<p>hypertension</p><p>pain</p><p>hypertension</p>', { entries: [pressureEntry, entries[0]], maxMarks: 2 });
  assert.deepEqual(reader.enable(), { enabled: true, mode: 'plain', count: 2, replacedCount: 1, annotatedCount: 1, truncated: true });
  assert.deepEqual(reader.setMode('annotate'), { enabled: true, mode: 'annotate', count: 2, replacedCount: 0, annotatedCount: 2, truncated: true });
  reader.disable();
  assert.equal(document.body.textContent, 'hypertensionpainhypertension');
});
