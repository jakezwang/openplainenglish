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

test('transparent split-node phrases are one logical match; iframe and shadow roots stay excluded', (t) => {
  const phrase = { ...entries[0], id: 'chest-pain', term: 'chest pain', aliases: [] };
  const { document, reader } = fixture(t, '<p>chest <em>pain</em></p><iframe></iframe><div id="shadow"></div>', { entries: [phrase] });
  document.getElementById('shadow').attachShadow({ mode: 'open' }).innerHTML = '<p>chest pain</p>';
  document.querySelector('iframe').contentDocument.body.innerHTML = '<p>chest pain</p>';
  reader.enable();
  assert.equal(reader.getState().count, 1);
  assert.equal(marks(document).length, 2);
  assert.equal(document.querySelectorAll('[data-ope-term][tabindex="0"]').length, 1);
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

const infarctionEntry = {
  ...pressureEntry, id: 'infarction', term: 'myocardial infarction', aliases: ['myocardial infarctions', 'heart attack', 'heart attacks'],
  inline: { ...pressureEntry.inline, replacements: [{ from: 'myocardial infarction', to: 'heart attack' }, { from: 'myocardial infarctions', to: 'heart attacks' }] },
};

test('cross-inline replacements preserve original elements, wording, attributes and listeners through undo cycles', (t) => {
  const { dom, document, reader } = fixture(t, '<p id="reading"><strong class="original">Myocardial</strong> <em title="format">infarction</em>; myocardial <span>infarctions</span>.</p>', { entries: [infarctionEntry] });
  const paragraph = document.getElementById('reading');
  const originalHTML = paragraph.innerHTML;
  const strong = paragraph.querySelector('strong');
  const emphasis = paragraph.querySelector('em');
  let events = 0;
  emphasis.addEventListener('mouseenter', () => events++);
  assert.equal(reader.enable().count, 2);
  assert.equal(paragraph.textContent, 'Heart attack; heart attacks.');
  assert.equal(reader.getState().replacedCount, 2);
  assert.equal(paragraph.querySelectorAll('[role="button"]').length, 2, 'a split phrase has one logical button');
  assert.equal(paragraph.querySelectorAll('[tabindex="0"]').length, 2);
  for (let cycle = 0; cycle < 3; cycle++) {
    reader.setMode('annotate');
    assert.equal(paragraph.textContent, 'Myocardial infarction; myocardial infarctions.');
    reader.setMode('plain');
    assert.equal(paragraph.textContent, 'Heart attack; heart attacks.');
  }
  assert.equal(reader.getOriginalText(), 'Myocardial infarction; myocardial infarctions.');
  reader.disable();
  assert.equal(paragraph.innerHTML, originalHTML);
  assert.equal(paragraph.querySelector('strong'), strong);
  assert.equal(paragraph.querySelector('em'), emphasis);
  emphasis.dispatchEvent(new dom.window.Event('mouseenter'));
  assert.equal(events, 1);
});

test('cross-inline matching never bridges interactive, hidden, language, line-break or block boundaries', (t) => {
  const { document, reader } = fixture(t, `
    <p>myocardial <a href="/">infarction</a></p>
    <p>myocardial <span hidden>ignored</span>infarction</p>
    <p>myocardial <span lang="en">infarction</span></p>
    <p>myocardial<br>infarction</p>
    <p>myocardial <span style="display:block">infarction</span></p>
    <p>myocardial </p><p>infarction</p>
    <p id="allowed">myocardial <em><strong>infarction</strong></em></p>
  `, { entries: [infarctionEntry] });
  assert.equal(reader.enable().count, 1);
  assert.equal(document.getElementById('allowed').textContent, 'heart attack');
  assert.ok(marks(document).every((mark) => mark.closest('#allowed')));
});

test('the visible segment is the sole keyboard anchor when a short replacement leaves an empty first segment', (t) => {
  const purpose = { ...pressureEntry, id: 'purpose', term: 'for the purpose of', aliases: [], inline: { ...pressureEntry.inline, replacements: [{ from: 'for the purpose of', to: 'for' }] } };
  const { dom, document, reader } = fixture(t, '<p><span>f</span><em>or the purpose of</em> requesting a copy.</p>', { entries: [purpose] });
  reader.enable();
  const primary = document.querySelector('[data-ope-term][tabindex="0"]');
  assert.equal(primary.textContent, 'for');
  assert.equal(primary.hasAttribute('aria-hidden'), false);
  assert.equal(document.querySelectorAll('[data-ope-term][role="button"]').length, 1);
  primary.dispatchEvent(new dom.window.KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
  assert.ok(panel(document));
  panel(document).querySelector('.restore-occurrence').click();
  const originalPrimary = document.querySelector('[data-ope-term][tabindex="0"]');
  assert.equal(originalPrimary.textContent, 'f');
  assert.equal(document.activeElement, originalPrimary);
  reader.disable();
  assert.equal(document.querySelector('p').innerHTML, '<span>f</span><em>or the purpose of</em> requesting a copy.');
});

test('cross-inline host edits, removed fragments and retained wrapped nodes are preserved on immediate disable', (t) => {
  for (const action of ['edit', 'remove', 'wrap', 'new-node']) {
    const { document, reader } = fixture(t, '<p><strong>myocardial</strong> <em>infarction</em></p>', { entries: [infarctionEntry] });
    reader.enable();
    const paragraph = document.querySelector('p');
    const mark = document.querySelector('em [data-ope-term]');
    if (action === 'edit') mark.firstChild.data = 'host result';
    if (action === 'new-node') mark.textContent = mark.textContent;
    if (action === 'remove') document.querySelector('em').remove();
    if (action === 'wrap') { const small = document.createElement('small'); small.append(mark.firstChild); mark.append(small); }
    reader.disable();
    assert.equal(paragraph.textContent, action === 'edit' ? 'myocardial host result' : action === 'new-node' ? 'myocardial attack' : action === 'remove' ? 'myocardial ' : 'myocardial infarction');
    assert.equal(paragraph.querySelector('[data-ope-term]'), null);
    if (action === 'wrap') assert.equal(paragraph.querySelector('em small').textContent, 'infarction');
  }
});

test('dynamic edits across inline fragments reconcile the full phrase without reusing rendered output', async (t) => {
  const { document, reader } = fixture(t, '<p><strong>myocardial</strong> <em>infarction</em></p>', { entries: [infarctionEntry] });
  reader.enable();
  const paragraph = document.querySelector('p');
  paragraph.querySelector('em [data-ope-term]').firstChild.data = 'condition';
  await eventually(() => reader.getState().count === 0);
  assert.equal(paragraph.textContent, 'myocardial condition');
  paragraph.querySelector('em').textContent = 'infarction';
  await eventually(() => reader.getState().replacedCount === 1);
  paragraph.prepend(document.createTextNode('pre'));
  await eventually(() => reader.getState().count === 0);
  assert.equal(paragraph.textContent, 'premyocardial infarction');
});

test('restoring one occurrence leaves other replacements active and survives intact-source rescans', async (t) => {
  const { document, reader } = fixture(t, '<p>hypertension and hypertension.</p>', { entries: [pressureEntry] });
  reader.enable();
  marks(document)[0].click();
  panel(document).querySelector('.restore-occurrence').click();
  assert.equal(document.querySelector('p').textContent, 'hypertension and high blood pressure.');
  assert.equal(reader.getState().replacedCount, 1);
  assert.equal(document.activeElement, marks(document)[0]);
  document.querySelector('p').className = 'changed';
  await new Promise((resolve) => setTimeout(resolve, 110));
  assert.equal(document.querySelector('p').textContent, 'hypertension and high blood pressure.');
  reader.setMode('annotate');
  reader.setMode('plain');
  assert.equal(reader.getState().replacedCount, 1);
  reader.disable();
  assert.equal(document.querySelector('p').textContent, 'hypertension and hypertension.');
});

test('ignoring a term restores all its forms and excludes new occurrences for this page session', async (t) => {
  const { document, reader } = fixture(t, '<p>hypertension; high blood pressure; pain.</p>', { entries: [pressureEntry, entries[0]] });
  reader.enable();
  marks(document)[0].click();
  panel(document).querySelector('.ignore-term').click();
  assert.equal(reader.getState().count, 1);
  assert.equal(document.querySelector('p').textContent, 'hypertension; high blood pressure; pain.');
  assert.equal(panel(document), undefined);
  assert.equal(document.activeElement.dataset.opeTerm, 'pain');
  const added = document.createElement('p');
  added.textContent = 'Hypertension and pain.';
  document.body.append(added);
  await eventually(() => reader.getState().count === 2);
  reader.setMode('annotate');
  reader.setMode('plain');
  reader.disable();
  reader.enable();
  assert.equal(reader.getState().count, 2);
  assert.equal(document.querySelectorAll('[data-ope-term="hypertension"]').length, 0);
  assert.throws(() => reader.ignoreTerm('unknown'), TypeError);
});

test('plain-mode printing shows originals and afterprint respects host edits and a disabled reader', (t) => {
  const { dom, document, reader } = fixture(t, '<p><strong>myocardial</strong> infarction; hypertension.</p>', { entries: [infarctionEntry, pressureEntry] });
  reader.enable();
  dom.window.dispatchEvent(new dom.window.Event('beforeprint'));
  assert.equal(document.querySelector('p').textContent, 'myocardial infarction; hypertension.');
  assert.equal(reader.getState().mode, 'plain', 'printing must not change the remembered preference');
  assert.equal(reader.getState().replacedCount, 0);
  document.querySelector('[data-ope-term="hypertension"]').firstChild.data = 'host print wording';
  dom.window.dispatchEvent(new dom.window.Event('afterprint'));
  assert.equal(document.querySelector('p').textContent, 'heart attack; host print wording.');
  dom.window.dispatchEvent(new dom.window.Event('beforeprint'));
  reader.disable();
  dom.window.dispatchEvent(new dom.window.Event('afterprint'));
  assert.equal(reader.getState().enabled, false);
  assert.equal(document.querySelector('p').textContent, 'myocardial infarction; host print wording.');
});

test('preferences are validated atomically, remember mode while off and update panel labels without opening callbacks', (t) => {
  let opens = 0;
  const { document, reader } = fixture(t, '<p>hypertension</p>', { entries: [pressureEntry], preferences: { mode: 'annotate', language: 'zh-CN' }, onExplanationOpen: () => opens++ });
  assert.equal(reader.getState().mode, 'annotate');
  reader.setPreferences({ density: 'compact', highlight: 'strong', mode: 'plain' });
  assert.equal(document.querySelector('[data-ope-owned]'), null);
  reader.enable();
  assert.equal(document.querySelector('p').textContent, 'high blood pressure');
  assert.equal(marks(document)[0].dataset.opeHighlight, 'strong');
  reader.openFirst();
  assert.equal(opens, 1);
  assert.equal(panel(document).querySelector('.panel').lang, 'zh-CN');
  assert.ok(panel(document).querySelector('.panel').classList.contains('compact'));
  assert.equal(panel(document).querySelector('.copy-original').textContent, '复制原词');
  assert.equal(panel(document).querySelector('.context .label').textContent, '示例语境');
  assert.equal(panel(document).querySelector('#ope-explanation').lang, 'en');
  reader.setPreferences({ language: 'en', density: 'comfortable', highlight: 'subtle' });
  assert.equal(opens, 1);
  assert.equal(panel(document).querySelector('.context .label').textContent, 'Example context');
  const html = document.body.innerHTML;
  const state = reader.getState();
  for (const invalid of [{ mode: 'rewrite', language: 'en' }, { language: 'fr' }, { extra: 'metadata' }, null]) {
    assert.throws(() => reader.setPreferences(invalid), TypeError);
    assert.equal(document.body.innerHTML, html);
    assert.deepEqual(reader.getState(), state);
  }
});

test('copy original is user-triggered, preserves exact spelling and announces success or a manual fallback', async (t) => {
  const copied = [];
  const { dom, document, reader } = fixture(t, '<p>HYPERTENSION</p>', { entries: [pressureEntry] });
  Object.defineProperty(dom.window.navigator, 'clipboard', { configurable: true, value: { writeText: async (text) => copied.push(text) } });
  reader.enable();
  reader.openFirst();
  assert.deepEqual(copied, []);
  panel(document).querySelector('.copy-original').click();
  await eventually(() => panel(document).querySelector('.copy-status').textContent.includes('copied'));
  assert.deepEqual(copied, ['HYPERTENSION']);
  assert.equal(panel(document).querySelector('.copy-status').getAttribute('role'), 'status');
  assert.equal(document.querySelector('p').textContent, 'HIGH BLOOD PRESSURE');
  Object.defineProperty(dom.window.navigator, 'clipboard', { configurable: true, value: undefined });
  panel(document).querySelector('.copy-original').click();
  await eventually(() => panel(document).querySelector('.copy-status').textContent.includes('Select'));
  assert.deepEqual(copied, ['HYPERTENSION']);
});

test('explanation callbacks exclude stale markers and selection, and nonmodal Tab edges return focus to the phrase', (t) => {
  const opened = [];
  const { dom, document, reader } = fixture(t, '<p>hypertension</p>', { entries: [pressureEntry], onExplanationOpen: (entry) => opened.push(entry.id) });
  reader.enable();
  const mark = marks(document)[0];
  const range = document.createRange();
  range.selectNodeContents(mark);
  document.getSelection().addRange(range);
  mark.click();
  assert.deepEqual(opened, []);
  document.getSelection().removeAllRanges();
  mark.click();
  assert.deepEqual(opened, ['hypertension']);
  assert.equal(panel(document).querySelector('.panel').getAttribute('aria-modal'), 'false');
  panel(document).querySelector('.close').dispatchEvent(new dom.window.KeyboardEvent('keydown', { key: 'Tab', shiftKey: true, bubbles: true }));
  assert.equal(panel(document), undefined);
  assert.equal(document.activeElement, mark);
  mark.firstChild.data = 'host text';
  mark.click();
  assert.deepEqual(opened, ['hypertension']);
});

test('literal names and enclosing quotations remain annotations while ordinary prose can change', (t) => {
  const { document, reader } = fixture(t, '<p>The label says "history of hypertension". A patient has hypertension.</p><cite>Hypertension Review</cite><abbr title="name">hypertension</abbr><q>hypertension</q>', { entries: [pressureEntry] });
  assert.equal(reader.enable().count, 5);
  assert.equal(reader.getState().replacedCount, 1);
  assert.equal(document.querySelector('p').textContent, 'The label says "history of hypertension". A patient has high blood pressure.');
  assert.equal(document.querySelector('cite').textContent, 'Hypertension Review');
});

test('fragment and run limits bound pathological markup without making partial long-run replacements', (t) => {
  const phrase = { ...pressureEntry, id: 'fragmented', term: 'abcdefghijklmnopqrstuvwxyz', aliases: [], inline: { ...pressureEntry.inline, replacements: [{ from: 'abcdefghijklmnopqrstuvwxyz', to: 'letters' }] } };
  const fragmented = Array.from(phrase.term).map((letter) => `<span>${letter}</span>`).join('');
  const { document, reader } = fixture(t, `<p>${fragmented}</p><p>${'x'.repeat(30000)}<em>${'x'.repeat(30000)}</em> hypertension</p>`, { entries: [phrase, pressureEntry] });
  assert.equal(reader.enable().count, 0);
  assert.equal(reader.getState().truncated, true);
  assert.equal(document.querySelector('p').textContent, phrase.term);
  assert.ok(document.querySelectorAll('p')[1].textContent.endsWith('hypertension'));
});

test('a node-budget cutoff cannot turn an unread continuation into a false phrase boundary', (t) => {
  const { document, reader } = fixture(t, '<p><span>hypertension</span><em>-related</em></p><p>hypertension</p>', { entries: [pressureEntry], maxNodes: 1 });
  assert.equal(reader.enable().count, 0);
  assert.equal(reader.getState().truncated, true);
  assert.equal(document.querySelector('p').textContent, 'hypertension-related');
});

test('embedding without a feedback callback has no inert feedback controls or local-draft claim', (t) => {
  const { document, reader } = fixture(t, '<p>hypertension</p>', { entries: [pressureEntry] });
  reader.enable();
  reader.openFirst();
  assert.equal(panel(document).querySelector('.feedback'), null);
  assert.doesNotMatch(panel(document).textContent, /Feedback starts as a local draft|Help make this clearer/);
  assert.match(panel(document).textContent, /Your page stays on your device/);
});

test('same-turn preference and occurrence actions do not discard queued host mutations', async (t) => {
  for (const action of ['preferences', 'restore']) {
    const { document, reader } = fixture(t, '<p>hypertension</p>', { entries: [pressureEntry] });
    reader.enable();
    const mark = marks(document)[0];
    document.querySelector('p').prepend(document.createTextNode('pre'));
    if (action === 'preferences') reader.setPreferences({ language: 'zh-CN', highlight: 'strong' });
    else reader.restoreOccurrence(mark);
    await eventually(() => reader.getState().count === 0);
    assert.equal(document.querySelector('p').textContent, 'prehypertension');
    reader.disable();
    assert.equal(document.querySelector('p').textContent, 'prehypertension');
  }
});

test('an excluded inline region does not create a false Unicode word boundary for adjacent text', (t) => {
  const { document, reader } = fixture(t, '<p>hypertension<a href="/">ology</a></p><p><a href="/">pre</a>hypertension</p><p>hypertension<a href="/"> learn more</a></p><p>hypertension<a href="/">𐐀</a></p>', { entries: [pressureEntry] });
  assert.equal(reader.enable().count, 1);
  assert.equal(reader.getState().replacedCount, 1);
  assert.equal(document.querySelectorAll('p')[0].textContent, 'hypertensionology');
  assert.equal(document.querySelectorAll('p')[1].textContent, 'prehypertension');
  assert.equal(document.querySelectorAll('p')[2].textContent, 'high blood pressure learn more');
  assert.equal(document.querySelectorAll('p')[3].textContent, 'hypertension𐐀');
  assert.equal(document.querySelector('a [data-ope-term]'), null);
});
