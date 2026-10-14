import { createReader } from '../src/content/controller.js';
const $ = (selector) => document.querySelector(selector);
const fixture = $('#fixture');
const log = $('#log');
let reader;
let baseline = '';
let changed = false;
const fixtureHTML = '<h2>A fictional reading example</h2><p>Hypertension and gastritis may appear in health information. A biopsy is a different kind of term.</p><p>A phrase with formatting: blood <strong>glucose</strong>. Another: magnetic <em>resonance</em> imaging.</p><p>The quoted word “hypertension” is retained. Hypertension-related information may need more context.</p><ul><li>Hypertension in a list.</li><li>Gastrointestinal symptoms in a list.</li></ul><table><caption>Layout fixture</caption><tbody><tr><th scope="row">Example term</th><td>hypertension</td></tr></tbody></table><p><a href="#fixture">Hypertension in a link stays unchanged</a></p><label>Editable: <input value="hypertension"></label><div contenteditable="true" role="textbox" aria-label="Editable test text">hypertension</div><code>hypertension</code><p lang="fr">hypertension dans un texte français</p><p hidden>hypertension hidden</p><div id="shadow-example"></div><iframe title="Unscanned frame fixture" srcdoc="<p>hypertension inside an iframe</p>"></iframe>';
function record(message) { log.textContent += `${message}\n`; }
function stateChanged(state) {
  $('#lab-status').textContent = `${state.enabled ? state.mode : 'off'} · ${state.replacedCount} replacements · ${state.annotatedCount} explanations${state.truncated ? ' · PARTIAL PAGE LIMIT' : ''}`;
  $('#restore').disabled = !state.enabled;
}
function reset() {
  reader?.disable(); fixture.innerHTML = fixtureHTML;
  $('#shadow-example').attachShadow({ mode: 'open' }).innerHTML = '<p>hypertension inside a shadow root</p>';
  baseline = fixture.textContent; changed = false; log.textContent = ''; record('Fixture reset. Original text snapshot retained in this tab.');
}
function enable(mode) {
  const start = performance.now();
  reader.getState().enabled ? reader.setMode(mode) : reader.enable({ mode });
  record(`${mode}: ${(performance.now() - start).toFixed(1)} ms synchronous scan.`);
}
$('#dynamic').addEventListener('click', () => { const p = document.createElement('p'); p.textContent = 'Newly loaded hypertension and gastritis.'; fixture.append(p); changed = true; record('Website added a paragraph; reader observer will reconcile it.'); });
$('#host-edit').addEventListener('click', () => { const mark = fixture.querySelector('[data-ope-term]'); if (!mark) return record('Enable the reader before this test.'); mark.textContent = 'Website correction'; changed = true; record('Website replaced a marked phrase. Restoration must retain Website correction.'); });
$('#long').addEventListener('click', () => { reader?.disable(); fixture.replaceChildren(); for (let i = 0; i < 1000; i++) { const p = document.createElement('p'); p.textContent = `Paragraph ${i + 1}: hypertension and biopsy in a long, fictional article.`; fixture.append(p); } baseline = fixture.textContent; changed = false; record('Loaded 1,000 paragraphs. The 750-mark limit should be disclosed.'); });
$('#reset').addEventListener('click', reset);
$('#restore').addEventListener('click', () => { const start = performance.now(); reader.disable(); record(`Restore: ${(performance.now() - start).toFixed(1)} ms. ${changed ? 'Website changes retained: inspect current text.' : `Exact source text restored: ${fixture.textContent === baseline}`}`); });
try {
  const response = await fetch(new URL('../data/health.json', import.meta.url));
  if (!response.ok) throw new Error('Glossary unavailable');
  const { entries } = await response.json();
  reset(); reader = createReader({ document, entries, onStateChange: stateChanged });
  for (const id of ['enable', 'annotate', 'dynamic', 'host-edit', 'long', 'reset']) $(`#${id}`).disabled = false;
  $('#enable').addEventListener('click', () => enable('plain'));
  $('#annotate').addEventListener('click', () => enable('annotate'));
  stateChanged(reader.getState());
} catch { $('#lab-status').textContent = 'The glossary could not load. Reload the page to retry.'; }
