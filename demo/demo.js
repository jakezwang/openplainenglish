import { createReader } from '/src/content/controller.js';

const toggle = document.querySelector('#toggle');
const status = document.querySelector('#status');
let reader;
try {
  const response = await fetch('/data/health.json');
  if (!response.ok) throw new Error('Dictionary unavailable.');
  const lexicon = await response.json();
  reader = createReader({
    document,
    entries: lexicon.entries,
    onStateChange(state) {
      toggle.textContent = state.enabled ? 'Turn off reader' : 'Enable reader';
      toggle.setAttribute('aria-pressed', String(state.enabled));
      status.textContent = state.enabled ? `${state.count} terms ready to explore${state.truncated ? ' · page limit reached' : ''}. Select an underlined term.` : 'Reader is off. Your page is unchanged.';
    },
    onFeedback(entry, kind) {
      const params = new URLSearchParams({ entry: entry.id, kind });
      window.open(`/demo/preview.html?view=options#feedback?${params}`, '_blank', 'noopener,noreferrer');
    },
  });
  toggle.disabled = false;
  toggle.textContent = 'Enable reader';
  status.textContent = `${lexicon.entries.length} sourced entries, ready on this device.`;
  toggle.addEventListener('click', () => reader.getState().enabled ? reader.disable() : reader.enable());
} catch { toggle.textContent = 'Dictionary unavailable'; status.textContent = 'Build the project and reload this demo.'; }
document.querySelector('#add').addEventListener('click', () => {
  const paragraph = document.createElement('p');
  paragraph.textContent = 'Newly added text can have unfamiliar terms, too. This example mentions hypertension, gastritis and dehydration.';
  document.querySelector('#article').append(paragraph);
});
