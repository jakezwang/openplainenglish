// DEMO ONLY: a localhost adapter for inspecting the real extension UI.
// This module is never bundled into or copied to the extension artifact.
import { createFeedback, sanitizeFeedback, FEEDBACK_LIMIT } from '/src/shared/feedback.js';

const view = new URL(location.href).searchParams.get('view') === 'popup' ? 'popup' : 'options';
const STORAGE_KEY = 'opeDemoFeedback';
const listeners = new Set();
let memoryDrafts = [];
let state = { enabled: false, count: 0, truncated: false };
let lexicon;

function readDrafts() {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    return Array.isArray(stored) ? stored.slice(-FEEDBACK_LIMIT).map(sanitizeFeedback) : [];
  } catch {
    return memoryDrafts;
  }
}

function writeDrafts(drafts) {
  const oldValue = readDrafts();
  const newValue = drafts.slice(-FEEDBACK_LIMIT).map(sanitizeFeedback);
  memoryDrafts = newValue;
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(newValue)); }
  catch { /* The preview remains usable when browser storage is unavailable. */ }
  for (const listener of listeners) listener({ opeFeedback: { oldValue, newValue } }, 'local');
}

function announce(message) {
  const status = document.getElementById('preview-status');
  if (status) status.textContent = message;
}

function installMockChrome() {
  window.chrome = {
    runtime: {
      getURL(path) {
        if (path === 'options.html') return new URL('/demo/preview.html?view=options', location.origin).href;
        return new URL(`/${path}`, location.origin).href;
      },
      async sendMessage(message) {
        switch (message.type) {
          case 'OPE_GET_LEXICON': return { ok: true, lexicon };
          case 'OPE_GET_ACTIVE_STATE': return { ok: true, state: { ...state } };
          case 'OPE_TOGGLE_ACTIVE':
            state = { enabled: !state.enabled, count: state.enabled ? 0 : 7, truncated: false };
            announce(state.enabled ? 'Preview only · 7 example matches' : 'Browser preview · Test data only');
            return { ok: true, state: { ...state } };
          case 'OPE_OPEN_FIRST_ACTIVE':
            announce('Preview only · In the extension, this opens the first marked term.');
            return { ok: true, state: { ...state } };
          case 'OPE_SAVE_FEEDBACK': {
            try {
              const record = createFeedback(message.feedback, { id: crypto.randomUUID(), createdAt: new Date().toISOString() });
              writeDrafts([...readDrafts(), record]);
              return { ok: true };
            } catch (error) { return { ok: false, error: error.message }; }
          }
          case 'OPE_DELETE_FEEDBACK':
            writeDrafts(message.id === null ? [] : readDrafts().filter((item) => item.id !== message.id));
            return { ok: true };
          default: return { ok: false, error: 'This action is not available in the browser preview.' };
        }
      },
    },
    storage: {
      local: {
        async get() { return { opeFeedback: readDrafts() }; },
        async set(values) { if (Array.isArray(values.opeFeedback)) writeDrafts(values.opeFeedback); },
      },
      onChanged: {
        addListener(listener) { listeners.add(listener); },
        removeListener(listener) { listeners.delete(listener); },
      },
    },
  };
  // The actual popup closes after moving focus to the page; this preview stays open.
  window.close = () => {};
}

function insertPreviewBanner() {
  const banner = document.createElement('div');
  banner.id = 'preview-banner';
  banner.setAttribute('role', 'region');
  banner.setAttribute('aria-label', 'Browser preview controls');
  const status = document.createElement('span');
  status.id = 'preview-status';
  status.setAttribute('role', 'status');
  status.textContent = 'Browser preview · Test data only';
  const links = document.createElement('span');
  for (const [label, url] of [
    ['Reading demo', '/demo/index.html'],
    [view === 'options' ? 'Popup preview' : 'Glossary preview', `/demo/preview.html?view=${view === 'options' ? 'popup' : 'options'}`],
  ]) {
    const link = document.createElement('a');
    link.textContent = label;
    link.href = url;
    links.append(link);
  }
  banner.append(status, links);
  document.body.prepend(banner);
  const style = document.createElement('style');
  style.textContent = `
    #preview-banner{position:fixed;inset:0 0 auto 0;z-index:1000;min-height:40px;padding:9px 18px;display:flex;align-items:center;justify-content:space-between;gap:16px;background:#203c39;color:#fff;font:11px/1.5 Arial,sans-serif;letter-spacing:.15px;box-sizing:border-box}
    #preview-banner>span:last-child{display:flex;gap:18px;white-space:nowrap}
    #preview-banner a{color:#eef4e7;text-decoration:underline;text-underline-offset:3px}
    body[data-preview-view=options]{padding-top:40px}
    body[data-preview-view=options] .sidebar{top:40px;height:calc(100vh - 40px)}
    body[data-preview-view=popup]{margin:76px auto 28px;box-shadow:0 8px 35px #203c391f;border:1px solid #d7ddd4;border-radius:4px}
    @media(max-width:640px){#preview-banner{padding:8px 12px;font-size:9px;gap:8px}#preview-banner>span:last-child{gap:12px}body[data-preview-view=options] .sidebar{top:auto;height:auto}}
    @media(max-width:390px){body[data-preview-view=popup]{width:calc(100% - 24px)}}
  `;
  document.head.append(style);
}

async function boot() {
  if (!['127.0.0.1', 'localhost', '[::1]'].includes(location.hostname)) {
    throw new Error('This test adapter is available only on localhost.');
  }
  const [htmlResponse, dataResponse] = await Promise.all([
    fetch(`/src/${view}/${view}.html`),
    fetch('/data/health.json'),
  ]);
  if (!htmlResponse.ok || !dataResponse.ok) throw new Error('Preview files could not be loaded. Start the local development server.');
  const [html, data] = await Promise.all([htmlResponse.text(), dataResponse.json()]);
  lexicon = data;
  const parsed = new DOMParser().parseFromString(html, 'text/html');
  for (const script of parsed.querySelectorAll('script')) script.remove();
  for (const stylesheet of parsed.querySelectorAll('link[rel=stylesheet]')) {
    stylesheet.href = `/src/${view}/${view}.css`;
  }
  document.head.replaceChildren(...parsed.head.childNodes);
  document.body.replaceChildren(...parsed.body.childNodes);
  document.body.dataset.previewView = view;
  insertPreviewBanner();
  installMockChrome();
  await import(`/src/${view}/${view}.js`);
}

boot().catch((error) => {
  const message = document.createElement('p');
  message.className = 'preview-loading';
  message.setAttribute('role', 'alert');
  message.textContent = error.message || 'The preview could not start.';
  document.body.replaceChildren(message);
});
