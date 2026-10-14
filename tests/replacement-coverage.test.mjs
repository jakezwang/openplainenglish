import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { JSDOM } from 'jsdom';
import { createReader } from '../src/content/controller.js';

const lexicon = JSON.parse(await readFile(new URL('../data/health.json', import.meta.url), 'utf8'));

test('every shipped replacement form reaches the page, switches back to its source, and restores exactly', (t) => {
  const pairs = lexicon.entries.flatMap((entry) => entry.inline?.replacements || []);
  assert.equal(pairs.length, 40);
  const dom = new JSDOM('<!doctype html><html lang="en"><body></body></html>', { pretendToBeVisual: true });
  const { document } = dom.window;
  const paragraphs = pairs.map(({ from }) => {
    const paragraph = document.createElement('p');
    paragraph.textContent = `Example: ${from}.`;
    document.body.append(paragraph);
    return paragraph;
  });
  const originals = paragraphs.map((paragraph) => paragraph.textContent);
  const reader = createReader({ document, entries: lexicon.entries });
  t.after(() => { reader.destroy(); dom.window.close(); });
  const plain = reader.enable();
  assert.equal(plain.replacedCount, pairs.length);
  assert.equal(plain.annotatedCount, 0);
  assert.deepEqual(paragraphs.map((paragraph) => paragraph.textContent), pairs.map(({ to }) => `Example: ${to}.`));
  const annotated = reader.setMode('annotate');
  assert.equal(annotated.replacedCount, 0);
  assert.equal(annotated.annotatedCount, pairs.length);
  assert.deepEqual(paragraphs.map((paragraph) => paragraph.textContent), originals);
  reader.setMode('plain');
  reader.disable();
  assert.deepEqual(paragraphs.map((paragraph) => paragraph.textContent), originals);
  assert.equal(document.querySelector('[data-ope-owned]'), null);
});
