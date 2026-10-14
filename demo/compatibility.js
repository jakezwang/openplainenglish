import { createReader } from '../src/content/controller.js';
const $ = (selector) => document.querySelector(selector);
const fixture = $('#fixture');
const log = $('#log');
let reader;
let baseline = '';
let changed = false;
let closedRoot;
const fixtureHTML = '<h2>A fictional reading example</h2><p>Hypertension and gastritis may appear in health information. A biopsy is a different kind of term.</p><p>A phrase with formatting: blood <strong>glucose</strong>. Another: magnetic <em>resonance</em> imaging.</p><p>The quoted word “hypertension” is retained. Hypertension-related information may need more context.</p><ul><li>Hypertension in a list.</li><li>Gastrointestinal symptoms in a list.</li></ul><table><caption>Layout fixture</caption><tbody><tr><th scope="row">Example term</th><td>hypertension</td></tr></tbody></table><p><a href="#fixture">Hypertension in a link stays unchanged</a></p><label>Editable: <input value="hypertension"></label><div contenteditable="true" role="textbox" aria-label="Editable test text">hypertension</div><code>hypertension</code><p lang="fr">hypertension dans un texte français</p><p hidden>hypertension hidden</p><h3>Open component fixture</h3><div id="shadow-example"></div><h3>Closed component fixture · always skipped</h3><div id="closed-example"></div><h3>Same-origin iframe fixture</h3><iframe id="frame-example" title="Same-origin iframe fixture" style="width:100%;height:160px;border:1px solid #b8cec4" srcdoc="<!doctype html><html lang=&quot;en&quot;><body><p>hypertension inside an iframe</p></body></html>"></iframe>';
function snapshot() { return JSON.stringify({ page: fixture.textContent, open: $('#shadow-example')?.shadowRoot?.textContent, closed: closedRoot?.textContent, frame: $('#frame-example')?.contentDocument?.body?.textContent }); }
function record(message) { log.textContent += `${message}\n`; }
function stateChanged(state) {
  $('#lab-status').textContent = `${state.enabled ? state.mode : 'off'} · ${state.replacedCount} replacements · ${state.annotatedCount} explanations${state.truncated ? ' · PARTIAL PAGE LIMIT' : ''}`;
  $('#restore').disabled = !state.enabled;
}
function reset() {
  reader?.disable(); fixture.innerHTML = fixtureHTML;
  $('#shadow-example').attachShadow({ mode: 'open' }).innerHTML = '<p>hypertension inside a shadow root</p>';
  closedRoot = $('#closed-example').attachShadow({ mode: 'closed' }); closedRoot.innerHTML = '<p>hypertension inside a closed component stays original</p>';
  baseline = snapshot(); changed = false; log.textContent = ''; record('Fixture reset. Both surface preferences remain explicitly controlled above.');
  $('#frame-example').addEventListener('load', () => { if (!changed && !reader?.getState().enabled) baseline = snapshot(); record('Fixture iframe loaded; opted-in reading observes its accessible document.'); });
}
function enable(mode) {
  const start = performance.now();
  reader.getState().enabled ? reader.setMode(mode) : reader.enable({ mode });
  record(`${mode}: ${(performance.now() - start).toFixed(1)} ms synchronous scan.`);
}
$('#dynamic').addEventListener('click', () => { const p = document.createElement('p'); p.textContent = 'Newly loaded hypertension and gastritis.'; fixture.append(p); changed = true; record('Website added a paragraph; reader observer will reconcile it.'); });
$('#host-edit').addEventListener('click', () => { const mark = fixture.querySelector('[data-ope-term]'); if (!mark) return record('Enable the reader before this test.'); mark.textContent = 'Website correction'; changed = true; record('Website replaced a marked phrase. Restoration must retain Website correction.'); });
$('#long').addEventListener('click', () => { reader?.disable(); fixture.replaceChildren(); closedRoot = undefined; for (let i = 0; i < 1000; i++) { const p = document.createElement('p'); p.textContent = `Paragraph ${i + 1}: hypertension and biopsy in a long, fictional article.`; fixture.append(p); } baseline = snapshot(); changed = false; record('Loaded 1,000 paragraphs. The shared 750-mark limit should be disclosed.'); });
$('#reset').addEventListener('click', reset);
$('#restore').addEventListener('click', () => { const start = performance.now(); reader.disable(); record(`Restore: ${(performance.now() - start).toFixed(1)} ms. ${changed ? 'Website changes retained: inspect current text.' : `Exact source text across existing fixtures restored: ${snapshot() === baseline}`}`); });
function applySurfaces() { reader.setPreferences({ includeFrames: $('#include-frames').checked, includeShadowRoots: $('#include-shadows').checked }); record(`Explicit preferences: frames ${$('#include-frames').checked ? 'on' : 'off'}; open components ${$('#include-shadows').checked ? 'on' : 'off'}.`); }
$('#include-frames').addEventListener('change', applySurfaces);
$('#include-shadows').addEventListener('change', applySurfaces);
$('#refresh-surfaces').addEventListener('click', () => { reader.refreshSurfaces(); record('Accessible surfaces refreshed without adding permissions.'); });
$('#dynamic-surface').addEventListener('click', () => { const host = document.createElement('div'); host.attachShadow({ mode: 'open' }).innerHTML = '<p>hypertension in a newly added open component</p>'; fixture.append(host); changed = true; record('Added an open component; it is read only when the open-component preference is on.'); });
$('#navigate-frame').addEventListener('click', () => { const frame = $('#frame-example'); if (!frame) return record('Reset the fixture to create its iframe.'); frame.srcdoc = '<!doctype html><html lang="en"><body><p>hypertension in the new iframe document</p></body></html>'; changed = true; record('Navigated the same-origin srcdoc iframe; the old reader/document must be retired on load.'); });
$('#remove-surfaces').addEventListener('click', () => { $('#shadow-example')?.remove(); $('#frame-example')?.remove(); changed = true; record('Removed fixture surfaces; private originals restore in retained nodes and observers are torn down. Removed content is not reinserted.'); });
try {
  const response = await fetch(new URL('../data/health.json', import.meta.url));
  if (!response.ok) throw new Error('Glossary unavailable');
  const { entries } = await response.json();
  reset(); reader = createReader({ document, entries, onStateChange: stateChanged });
  for (const id of ['enable', 'annotate', 'dynamic', 'host-edit', 'long', 'reset', 'include-frames', 'include-shadows', 'refresh-surfaces', 'dynamic-surface', 'navigate-frame', 'remove-surfaces']) $(`#${id}`).disabled = false;
  $('#enable').addEventListener('click', () => enable('plain'));
  $('#annotate').addEventListener('click', () => enable('annotate'));
  stateChanged(reader.getState());
} catch { $('#lab-status').textContent = 'The glossary could not load. Reload the page to retry.'; }
