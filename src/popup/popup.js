const $ = (id) => document.getElementById(id);
const toggle = $('toggle');
let state = { enabled: false, mode: 'plain', count: 0, replacedCount: 0, annotatedCount: 0, truncated: false };
let selectedMode = 'plain';
let busy = false;

function render() {
  toggle.textContent = state.enabled ? 'Restore original' : selectedMode === 'plain' ? 'Read in plain English ↗' : 'Explain terms on this page ↗';
  toggle.setAttribute('aria-pressed', String(state.enabled));
  $('mode-plain').checked = selectedMode === 'plain';
  $('mode-annotate').checked = selectedMode === 'annotate';
  $('state-dot').classList.toggle('active', state.enabled);
  $('state-label').textContent = !state.enabled ? 'Ready when you are.'
    : state.mode === 'plain' ? `${state.replacedCount} replaced · ${state.annotatedCount} explained`
      : `${state.count} ${state.count === 1 ? 'term' : 'terms'} marked · original wording`;
  $('first').hidden = !state.enabled || state.count === 0;
  $('first').textContent = state.mode === 'plain' ? 'View a term & its original →' : 'Go to the first explanation →';
  const limit = state.truncated ? ' Large page: only part was checked.' : '';
  $('detail').textContent = (!state.enabled
    ? selectedMode === 'plain' ? 'Uses reviewed phrase substitutions. Restore originals any time.' : 'Keep the page wording and open explanations for marked terms.'
    : !state.count ? 'No matching health terms here yet. This is a focused glossary.'
      : state.mode === 'plain' && state.replacedCount === 0 ? 'No reviewed substitutions match this page. Marked terms still have explanations.'
        : state.mode === 'plain' ? 'Only reviewed phrases change. Select a marked phrase for its original, context and source.'
          : 'Original wording is shown. Select a marked term for its meaning and source.') + limit;
}

function setBusy(value) {
  busy = value;
  toggle.disabled = value;
  $('first').disabled = value;
  $('mode-picker').disabled = value;
}

async function request(type, fields = {}) {
  if (busy) return false;
  setBusy(true);
  $('error').hidden = true;
  try {
    const response = await chrome.runtime.sendMessage({ type, ...fields });
    if (!response?.ok) throw new Error(response?.error || 'This page is not available. Try a regular website.');
    if (response.state) {
      state = { ...state, ...response.state };
      selectedMode = state.mode === 'annotate' ? 'annotate' : 'plain';
    }
    render();
    return true;
  } catch (error) {
    if (state.enabled) selectedMode = state.mode;
    render();
    $('error').textContent = error.message || 'Unable to reach this page. Try refreshing it.';
    $('error').hidden = false;
    if (type === 'OPE_GET_ACTIVE_STATE') $('state-label').textContent = 'Open a regular website to begin.';
    return false;
  } finally { setBusy(false); }
}

toggle.addEventListener('click', () => request('OPE_TOGGLE_ACTIVE', { mode: selectedMode }));
for (const input of document.querySelectorAll('input[name="mode"]')) input.addEventListener('change', () => {
  if (!input.checked || busy) return;
  if (state.enabled) request('OPE_SET_MODE_ACTIVE', { mode: input.value });
  else { selectedMode = input.value; render(); }
});
$('first').addEventListener('click', async () => {
  if (await request('OPE_OPEN_FIRST_ACTIVE')) window.close();
});
$('glossary-link').href = chrome.runtime.getURL('options.html');
request('OPE_GET_ACTIVE_STATE');
