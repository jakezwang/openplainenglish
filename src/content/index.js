import { createReader } from './controller.js';
import { normalizePreferences, validatePreferences } from '../shared/preferences.js';

// The isolated extension world retains this guard across repeated injections.
if (!globalThis.__openPlainEnglishInstalled) {
  globalThis.__openPlainEnglishInstalled = true;
  let reader;
  const offState = (mode = 'plain') => ({ enabled: false, mode, count: 0, replacedCount: 0, annotatedCount: 0, truncated: false });
  chrome.runtime.onMessage.addListener((message, sender, respond) => {
    if (sender?.id !== chrome.runtime.id || typeof message?.type !== 'string' || !message.type.startsWith('OPE_')) return false;
    try {
      if (['OPE_ENABLE', 'OPE_SET_MODE'].includes(message.type) && !['plain', 'annotate'].includes(message.mode ?? (message.type === 'OPE_ENABLE' ? 'plain' : undefined))) {
        respond({ ok: false, error: 'Choose Plain reading or Explain terms.' });
        return false;
      }
      if (message.type === 'OPE_ENABLE') {
        if (!['text/html', 'application/xhtml+xml'].includes(document.contentType)) {
          respond({ ok: false, error: 'The reader works on web pages. PDF documents, images and other file viewers are not supported yet.' });
          return;
        }
        if (!reader) reader = createReader({
          document,
          entries: message.entries,
          preferences: normalizePreferences(message.preferences),
          onFeedback(entry, kind) {
            chrome.runtime.sendMessage({ type: 'OPE_OPEN_FEEDBACK', entryId: entry.id, kind }).catch(() => {});
          },
        });
        else reader.setPreferences(normalizePreferences(message.preferences));
        respond({ ok: true, state: reader.enable({ mode: message.mode ?? 'plain' }) });
      } else if (message.type === 'OPE_SET_PREFERENCES') {
        const preferences = normalizePreferences(validatePreferences(message.preferences));
        reader?.setPreferences(preferences);
        respond({ ok: true, state: reader?.getState() || offState(preferences.mode) });
      } else if (message.type === 'OPE_SET_MODE') respond({ ok: true, state: reader?.setMode(message.mode) || offState(message.mode) });
      else if (message.type === 'OPE_DISABLE') respond({ ok: true, state: reader?.disable() || offState() });
      else if (message.type === 'OPE_GET_STATE') respond({ ok: true, state: reader?.getState() || offState() });
      else if (message.type === 'OPE_OPEN_FIRST') respond({ ok: true, opened: reader?.openFirst() || false, state: reader?.getState() || offState() });
      else if (message.type === 'OPE_REFRESH_SURFACES') respond({ ok: true, state: reader?.refreshSurfaces() || offState() });
      else return false;
    } catch {
      respond({ ok: false, error: 'The reader could not load this glossary. Reload the extension and try again.' });
    }
    return false;
  });
}
