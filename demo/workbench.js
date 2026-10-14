import { createReader } from '../src/content/controller.js';

const $ = (selector) => document.querySelector(selector);
const input = $('#original');
const output = $('#reading-output');
const status = $('#status');
const samples = {
  health: 'Hypertension can occur without symptoms. A clinician may request a biopsy. Gastrointestinal symptoms may have several causes.\n\nA diagnosis should be discussed with your care team.',
  'public-service': 'At the present time, you can submit your application online. In the event that you need help, contact the office. You can provide other documents at a later date.',
};
const files = { health: '../data/health.json', 'public-service': '../data/pilots/public-service.json' };
let reader;
let entries;
let original = '';
let generation = 0;
let copyGeneration = 0;

function render(state) {
  $('#restore').disabled = !state.enabled;
  $('#result-label').textContent = state.enabled ? `${state.replacedCount} replaced · ${state.annotatedCount} explained` : original ? 'Original wording' : input.value ? 'Preview needed' : 'Waiting for text';
  if (state.truncated) status.textContent = 'Only part of this text was checked. Unchecked text is unchanged.';
}

async function load() {
  const current = ++generation;
  copyGeneration++;
  $('#copy-fallback').value = ''; $('#copy-fallback-label').hidden = true;
  reader?.destroy();
  reader = undefined;
  entries = undefined;
  output.textContent = original;
  $('#apply').disabled = true;
  $('#restore').disabled = true;
  status.textContent = 'Loading the local glossary…';
  try {
    const response = await fetch(new URL(files[$('#domain').value], import.meta.url));
    if (!response.ok) throw new Error('Glossary unavailable.');
    const lexicon = await response.json();
    if (current !== generation) return;
    if (!Array.isArray(lexicon.entries) || !lexicon.entries.length || lexicon.entries.length > 5000) throw new Error('Glossary unavailable.');
    entries = lexicon.entries;
    $('#apply').disabled = false;
    $('#result-label').textContent = original ? 'Original wording' : input.value ? 'Preview needed' : 'Waiting for text';
    status.textContent = `${entries.length} entries ready. Paste text or use an example.`;
  } catch {
    if (current === generation) { entries = undefined; $('#apply').disabled = true; status.textContent = 'The glossary could not load. Reload this page to try again.'; }
  }
}

function preview() {
  if (!entries) return;
  if (!input.value.trim()) { status.textContent = 'Paste some English text first.'; input.focus(); return; }
  if (input.value.length > 20000) { status.textContent = 'Use at most 20,000 characters at a time.'; return; }
  reader?.destroy();
  original = input.value;
  output.textContent = original;
  try {
    reader = createReader({ document, entries, preferences: { language: $('#language').value, density: 'comfortable', highlight: 'subtle', mode: 'plain' }, onStateChange: render });
    const state = reader.enable({ mode: 'plain' });
    $('#copy-original').disabled = false;
    $('#copy-reading').disabled = false;
    status.textContent = state.truncated ? 'Only part of this text was checked. Unchecked text is unchanged.' : state.count ? 'Select a marked phrase to compare, restore once or ignore it here. The original stays on the left.' : 'No glossary phrases matched. Your text is unchanged.';
  } catch {
    reader?.destroy(); reader = undefined; output.textContent = original;
    render({ enabled: false }); $('#copy-reading').disabled = false; $('#copy-original').disabled = false;
    status.textContent = 'The reading view could not start. Your original text is unchanged; try reloading the glossary.';
  }
}

async function copy(text) {
  const current = ++copyGeneration;
  $('#copy-fallback').value = ''; $('#copy-fallback-label').hidden = true;
  try { await navigator.clipboard.writeText(text); if (current === copyGeneration) status.textContent = 'Copied. Nothing was sent.'; }
  catch {
    if (current !== copyGeneration) return;
    $('#copy-fallback-label').hidden = false;
    $('#copy-fallback').value = text;
    $('#copy-fallback').focus();
    $('#copy-fallback').select();
    status.textContent = 'Clipboard access is unavailable. Copy the selected text below.';
  }
}

input.addEventListener('input', () => {
  copyGeneration++;
  reader?.destroy(); reader = undefined; original = ''; output.textContent = '';
  $('#copy-fallback').value = ''; $('#copy-fallback-label').hidden = true;
  $('#copy-original').disabled = !input.value;
  $('#copy-reading').disabled = true;
  $('#input-count').textContent = `${input.value.length.toLocaleString('en-US')} / 20,000`;
  render({ enabled: false });
  if (entries) status.textContent = input.value ? 'Input changed. Preview again to update the reading view.' : 'Paste text or use an example.';
});
$('#apply').addEventListener('click', preview);
$('#domain').addEventListener('change', load);
$('#language').addEventListener('change', () => reader?.setPreferences({ language: $('#language').value, density: 'comfortable', highlight: 'subtle', mode: 'plain' }));
$('#sample').addEventListener('click', () => {
  input.value = samples[$('#domain').value];
  input.dispatchEvent(new Event('input'));
  preview();
});
$('#restore').addEventListener('click', () => { reader?.disable(); status.textContent = 'Original wording restored. Your input is still on the left.'; });
$('#copy-original').addEventListener('click', () => copy(input.value));
$('#copy-reading').addEventListener('click', () => copy(output.textContent));
$('#clear').addEventListener('click', () => {
  reader?.destroy(); reader = undefined; original = ''; input.value = ''; output.textContent = '';
  $('#copy-fallback').value = ''; $('#copy-fallback-label').hidden = true;
  $('#copy-original').disabled = true; $('#copy-reading').disabled = true;
  input.dispatchEvent(new Event('input')); render({ enabled: false });
  status.textContent = 'Text cleared from this workshop. Clipboard contents, if copied, are controlled by your device.';
});
await load();
