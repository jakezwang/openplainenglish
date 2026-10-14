import { createReader } from '../src/content/controller.js';

const toggle = document.querySelector('#toggle');
const status = document.querySelector('#status');
const modePicker = document.querySelector('#mode-picker');
let reader;
let selectedMode = 'plain';

function render(state) {
  if (state.enabled) selectedMode = state.mode;
  document.querySelector('#mode-plain').checked = selectedMode === 'plain';
  document.querySelector('#mode-annotate').checked = selectedMode === 'annotate';
  toggle.textContent = state.enabled ? 'Restore original' : selectedMode === 'plain' ? 'Read in plain English' : 'Explain terms on this page';
  toggle.setAttribute('aria-pressed', String(state.enabled));
  const limit = state.truncated ? ' Only part of this large page was checked.' : '';
  status.textContent = !state.enabled ? 'Ready when you are. The original page is shown.'
    : state.mode === 'plain' ? `${state.replacedCount} phrases replaced · ${state.annotatedCount} terms kept with explanations.${limit}`
      : `${state.count} terms marked. Original wording is shown.${limit}`;
  document.querySelector('#mode-note').textContent = state.enabled && state.mode === 'plain' && state.replacedCount === 0
    ? 'No reviewed substitutions match this text. Marked terms still have explanations.'
    : selectedMode === 'annotate' ? 'Read the original wording and select marked terms for explanations.'
      : 'Reviewed phrases change; other known terms keep their wording and offer explanations. This is not a full-page rewrite.';
}

try {
  const response = await fetch(new URL('../data/health.json', import.meta.url));
  if (!response.ok) throw new Error('Dictionary unavailable.');
  const lexicon = await response.json();
  reader = createReader({
    document,
    entries: lexicon.entries,
    onStateChange: render,
    onFeedback(entry, kind) {
      const params = new URLSearchParams({ entry: entry.id, kind });
      window.open(new URL(`./preview.html?view=options#feedback?${params}`, import.meta.url), '_blank', 'noopener,noreferrer');
    },
  });
  toggle.disabled = false;
  modePicker.disabled = false;
  render(reader.getState());
  toggle.addEventListener('click', () => {
    try { reader.getState().enabled ? reader.disable() : reader.enable({ mode: selectedMode }); }
    catch { status.textContent = 'The reader could not update this page. Reload it to try again.'; }
  });
  for (const input of document.querySelectorAll('input[name="mode"]')) input.addEventListener('change', () => {
    if (!input.checked) return;
    const previous = selectedMode;
    selectedMode = input.value;
    try {
      if (reader.getState().enabled) reader.setMode(selectedMode);
      else render(reader.getState());
    } catch {
      selectedMode = previous;
      render(reader.getState());
      status.textContent = 'The reading mode could not change. Your last mode is still selected.';
    }
  });
} catch {
  toggle.textContent = 'Dictionary unavailable';
  status.textContent = 'Reload the page to try loading the reader again.';
}

document.querySelector('#add').addEventListener('click', () => {
  const paragraph = document.createElement('p');
  paragraph.textContent = 'Newly added text can have unfamiliar terms, too. This example mentions hypertension, gastritis and dehydration.';
  document.querySelector('#article').append(paragraph);
});
