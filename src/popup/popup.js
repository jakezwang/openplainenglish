const $ = (id) => document.getElementById(id);
const toggle = $('toggle');
let state = { enabled: false, count: 0, truncated: false };

function render() {
  toggle.textContent = state.enabled ? 'Turn off explanations' : 'Explain this page ↗';
  toggle.setAttribute('aria-pressed', String(state.enabled));
  $('state-dot').classList.toggle('active', state.enabled);
  $('state-label').textContent = state.enabled
    ? `${state.count} ${state.count === 1 ? 'term' : 'terms'} marked on this page`
    : 'Ready when you are.';
  $('first').hidden = !state.enabled || state.count === 0;
  $('detail').textContent = state.truncated
    ? 'This is a large page, so only part of it was checked. Marked terms are ready to explore.'
    : state.enabled && !state.count
      ? 'No matching health terms here yet. The glossary covers a focused set of terms.'
      : state.enabled
        ? 'Select a marked term to see its meaning and source. The original wording is preserved.'
        : 'You choose when to turn it on. Your original text stays available.';
}

async function request(type) {
  toggle.disabled = true;
  $('error').hidden = true;
  try {
    const response = await chrome.runtime.sendMessage({ type });
    if (!response?.ok) throw new Error(response?.error || 'This page is not available. Try a regular website.');
    if (response.state) state = response.state;
    render();
    return true;
  } catch (error) {
    $('error').textContent = error.message || 'Unable to reach this page. Try refreshing it.';
    $('error').hidden = false;
    if (type === 'OPE_GET_ACTIVE_STATE') $('state-label').textContent = 'Open a regular website to begin.';
    return false;
  } finally {
    toggle.disabled = false;
  }
}

toggle.addEventListener('click', () => request('OPE_TOGGLE_ACTIVE'));
$('first').addEventListener('click', async () => {
  if (await request('OPE_OPEN_FIRST_ACTIVE')) window.close();
});
$('glossary-link').href = chrome.runtime.getURL('options.html');
request('OPE_GET_ACTIVE_STATE');
