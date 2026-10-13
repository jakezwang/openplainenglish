import { createFeedback } from '../shared/feedback.js';

const OFF = { enabled: false, count: 0, truncated: false };
const FEEDBACK_KINDS = new Set(['unclear', 'inaccurate', 'suggestion']);
export function isSupportedUrl(url = '') {
  try {
    const parsed = new URL(url);
    if (!['http:', 'https:'].includes(parsed.protocol)) return false;
    if (parsed.hostname === 'chromewebstore.google.com') return false;
    if (parsed.hostname === 'chrome.google.com' && parsed.pathname.startsWith('/webstore')) return false;
    if (parsed.hostname === 'microsoftedge.microsoft.com' && parsed.pathname.startsWith('/addons')) return false;
    return true;
  } catch { return false; }
}

export function createActions(chrome, getLexicon) {
  let saveQueue = Promise.resolve();
  async function activeTab() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id || !isSupportedUrl(tab.url)) throw new Error('Open a regular web page first. Browser settings, extension stores, PDFs and local files cannot be annotated.');
    return tab;
  }
  async function state(tabId) {
    try {
      const response = await chrome.tabs.sendMessage(tabId, { type: 'OPE_GET_STATE' });
      return response?.state || { ...OFF };
    } catch { return { ...OFF }; }
  }
  async function handle(message) {
    switch (message.type) {
      case 'OPE_GET_LEXICON': return { ok: true, lexicon: await getLexicon() };
      case 'OPE_GET_ACTIVE_STATE': {
        const tab = await activeTab();
        return { ok: true, state: await state(tab.id) };
      }
      case 'OPE_TOGGLE_ACTIVE': {
        const tab = await activeTab();
        const current = await state(tab.id);
        if (current.enabled) return await chrome.tabs.sendMessage(tab.id, { type: 'OPE_DISABLE' });
        const lexicon = await getLexicon();
        const injection = await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ['content.js'] });
        const documentId = injection[0]?.documentId;
        return await chrome.tabs.sendMessage(tab.id, { type: 'OPE_ENABLE', entries: lexicon.entries }, documentId ? { documentId } : undefined);
      }
      case 'OPE_OPEN_FIRST_ACTIVE': {
        const tab = await activeTab();
        return await chrome.tabs.sendMessage(tab.id, { type: 'OPE_OPEN_FIRST' });
      }
      case 'OPE_OPEN_FEEDBACK': {
        const lexicon = await getLexicon();
        if (!lexicon.entries.some((entry) => entry.id === message.entryId) || !FEEDBACK_KINDS.has(message.kind)) throw new Error('Choose a term and feedback category first.');
        const params = new URLSearchParams({ entry: message.entryId, kind: message.kind });
        await chrome.tabs.create({ url: chrome.runtime.getURL(`options.html#feedback?${params}`) });
        return { ok: true };
      }
      case 'OPE_SAVE_FEEDBACK': {
        const save = async () => {
          const lexicon = await getLexicon();
          const entry = lexicon.entries.find((item) => item.id === message.feedback?.entryId);
          if (!entry && (message.feedback?.kind !== 'suggestion' || message.feedback?.entryId)) throw new Error('This term is not in the current lexicon.');
          const record = createFeedback({ ...message.feedback, entryId: entry?.id || '', term: entry?.term || message.feedback?.term, lexiconVersion: lexicon.version }, { id: crypto.randomUUID(), createdAt: new Date().toISOString() });
          const stored = await chrome.storage.local.get('opeFeedback');
          const records = Array.isArray(stored.opeFeedback) ? stored.opeFeedback : [];
          await chrome.storage.local.set({ opeFeedback: [...records.filter((item) => item.id !== record.id), record].slice(-100) });
          return { ok: true, feedback: record };
        };
        const result = saveQueue.then(save, save);
        saveQueue = result.catch(() => {});
        return await result;
      }
      case 'OPE_DELETE_FEEDBACK': {
        if (message.id !== null && (typeof message.id !== 'string' || !message.id)) throw new Error('Choose a draft to delete.');
        const remove = async () => {
          const stored = await chrome.storage.local.get('opeFeedback');
          const records = Array.isArray(stored.opeFeedback) ? stored.opeFeedback : [];
          await chrome.storage.local.set({ opeFeedback: message.id === null ? [] : records.filter((record) => record.id !== message.id) });
          return { ok: true };
        };
        const result = saveQueue.then(remove, remove);
        saveQueue = result.catch(() => {});
        return await result;
      }
      default: throw new Error('Unknown OpenPlainEnglish action.');
    }
  }
  return { handle };
}
