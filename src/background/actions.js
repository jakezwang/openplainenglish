import { createFeedback, mergeFeedbackRecords, parseFeedbackImport } from '../shared/feedback.js';
import { normalizePreferences, validatePreferences } from '../shared/preferences.js';

const OFF = { enabled: false, mode: 'plain', count: 0, replacedCount: 0, annotatedCount: 0, truncated: false };
function readingMode(mode) {
  if (!['plain', 'annotate'].includes(mode)) throw new TypeError('Choose Plain reading or Explain terms.');
  return mode;
}
const FEEDBACK_KINDS = new Set(['unclear', 'inaccurate', 'suggestion']);
export function isSupportedUrl(url = '') {
  try {
    const parsed = new URL(url);
    if (!['http:', 'https:'].includes(parsed.protocol)) return false;
    if (parsed.hostname === 'chromewebstore.google.com') return false;
    if (parsed.hostname === 'chrome.google.com' && parsed.pathname.startsWith('/webstore')) return false;
    if (parsed.hostname === 'microsoftedge.microsoft.com' && parsed.pathname.startsWith('/addons')) return false;
    if (parsed.hostname === 'addons.mozilla.org') return false;
    return true;
  } catch { return false; }
}

export function createActions(chrome, getLexicon) {
  let saveQueue = Promise.resolve();
  let readerQueue = Promise.resolve();
  function queued(operation) {
    const result = saveQueue.then(operation, operation);
    saveQueue = result.catch(() => {});
    return result;
  }
  async function preferences() {
    return normalizePreferences((await chrome.storage.local.get('opePreferences')).opePreferences);
  }
  async function savePreferences(patch) {
    const valid = validatePreferences(patch);
    return queued(async () => {
      const next = normalizePreferences({ ...await preferences(), ...valid });
      await chrome.storage.local.set({ opePreferences: next });
      return next;
    });
  }
  async function records() {
    const stored = await chrome.storage.local.get('opeFeedback');
    const valid = [];
    for (const item of Array.isArray(stored.opeFeedback) ? stored.opeFeedback : []) {
      try {
        if (!FEEDBACK_KINDS.has(item?.kind)) continue;
        valid.push(createFeedback(item));
      } catch { /* Old or damaged local records must not propagate unknown fields. */ }
    }
    return valid.slice(-100);
  }
  async function activeTab() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!Number.isInteger(tab?.id) || tab.id < 0) throw new Error('Open a regular web page first.');
    if (typeof tab.url !== 'string' || !tab.url) throw new Error('Open OpenPlainEnglish from the browser toolbar on the page you want to read, then try again.');
    if (!isSupportedUrl(tab.url)) throw new Error('Open a regular web page first. Browser settings, extension stores, PDFs and local files cannot be annotated.');
    return tab;
  }
  async function state(tabId) {
    try {
      const response = await chrome.tabs.sendMessage(tabId, { type: 'OPE_GET_STATE' });
      return { ...OFF, ...response?.state };
    } catch { return { ...OFF }; }
  }
  async function handle(message) {
    if (!message || typeof message !== 'object' || Array.isArray(message) || typeof message.type !== 'string') {
      throw new TypeError('Choose an OpenPlainEnglish action.');
    }
    if (['OPE_SET_PREFERENCES', 'OPE_TOGGLE_ACTIVE', 'OPE_SET_MODE_ACTIVE', 'OPE_DISABLE_ACTIVE'].includes(message.type)) {
      const result = readerQueue.then(() => dispatch(message), () => dispatch(message));
      readerQueue = result.catch(() => {});
      return result;
    }
    return dispatch(message);
  }
  async function dispatch(message) {
    switch (message.type) {
      case 'OPE_GET_PREFERENCES': return { ok: true, preferences: await preferences() };
      case 'OPE_SET_PREFERENCES': {
        const next = await savePreferences(message.preferences);
        // Only readers the user has already enabled receive settings. No injection,
        // URL collection, or activation occurs when a preference changes.
        const tabs = await chrome.tabs.query({});
        await Promise.allSettled(tabs.filter((tab) => Number.isInteger(tab.id)).map((tab) =>
          chrome.tabs.sendMessage(tab.id, { type: 'OPE_SET_PREFERENCES', preferences: next })));
        return { ok: true, preferences: next };
      }
      case 'OPE_GET_LEXICON': return { ok: true, lexicon: await getLexicon() };
      case 'OPE_GET_ACTIVE_STATE': {
        const tab = await activeTab();
        const current = await state(tab.id);
        return { ok: true, state: current.enabled ? current : { ...current, mode: (await preferences()).mode } };
      }
      case 'OPE_TOGGLE_ACTIVE': {
        if (message.mode != null) readingMode(message.mode);
        const tab = await activeTab();
        const current = await state(tab.id);
        if (current.enabled) return await chrome.tabs.sendMessage(tab.id, { type: 'OPE_DISABLE' });
        const prefs = message.mode == null ? await preferences() : await savePreferences({ mode: message.mode });
        const mode = prefs.mode;
        const lexicon = await getLexicon();
        const injection = await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ['content.js'] });
        const documentId = injection[0]?.documentId;
        return await chrome.tabs.sendMessage(tab.id, { type: 'OPE_ENABLE', entries: lexicon.entries, mode, preferences: prefs }, documentId ? { documentId } : undefined);
      }
      case 'OPE_SET_MODE_ACTIVE': {
        const mode = readingMode(message.mode);
        const tab = await activeTab();
        await savePreferences({ mode });
        const current = await state(tab.id);
        if (!current.enabled) return { ok: true, state: { ...current, mode } };
        return await chrome.tabs.sendMessage(tab.id, { type: 'OPE_SET_MODE', mode });
      }
      case 'OPE_DISABLE_ACTIVE': {
        const tab = await activeTab();
        const current = await state(tab.id);
        return current.enabled ? await chrome.tabs.sendMessage(tab.id, { type: 'OPE_DISABLE' }) : { ok: true, state: current };
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
        const feedback = message.feedback;
        if (!feedback || typeof feedback !== 'object' || Array.isArray(feedback) || !FEEDBACK_KINDS.has(feedback.kind)) throw new TypeError('Choose a feedback category and write a note.');
        if (typeof feedback.note !== 'string' || feedback.note.length > 4000 || Array.from(feedback.note).length > 2000) throw new TypeError('Feedback notes must be text of at most 2,000 characters.');
        const save = async () => {
          const lexicon = await getLexicon();
          const entry = lexicon.entries.find((item) => item.id === feedback.entryId);
          if (!entry && (feedback.kind !== 'suggestion' || feedback.entryId)) throw new Error('This term is not in the current lexicon.');
          if (!entry && (typeof feedback.term !== 'string' || feedback.term.length > 240 || Array.from(feedback.term).length > 120)) throw new TypeError('A suggested term must be text of at most 120 characters.');
          const record = createFeedback({ ...feedback, entryId: entry?.id || '', term: entry?.term || feedback.term, lexiconVersion: lexicon.version }, { id: crypto.randomUUID(), createdAt: new Date().toISOString() });
          const existing = await records();
          await chrome.storage.local.set({ opeFeedback: [...existing, record].slice(-100) });
          return { ok: true, feedback: record };
        };
        return await queued(save);
      }
      case 'OPE_DELETE_FEEDBACK': {
        if (message.id !== null && (typeof message.id !== 'string' || !message.id)) throw new Error('Choose a draft to delete.');
        const remove = async () => {
          const existing = await records();
          await chrome.storage.local.set({ opeFeedback: message.id === null ? [] : existing.filter((record) => record.id !== message.id) });
          return { ok: true };
        };
        return await queued(remove);
      }
      case 'OPE_IMPORT_FEEDBACK': {
        const imported = parseFeedbackImport(message.json);
        return await queued(async () => {
          const result = mergeFeedbackRecords(await records(), imported);
          await chrome.storage.local.set({ opeFeedback: result.feedback });
          const { feedback: _feedback, ...counts } = result;
          return { ok: true, ...counts };
        });
      }
      default: throw new Error('Unknown OpenPlainEnglish action.');
    }
  }
  return { handle };
}
