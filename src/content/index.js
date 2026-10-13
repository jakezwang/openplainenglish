import { createReader } from './controller.js';

// The isolated extension world retains this guard across repeated injections.
if (!globalThis.__openPlainEnglishInstalled) {
  globalThis.__openPlainEnglishInstalled = true;
  let reader;
  chrome.runtime.onMessage.addListener((message, _sender, respond) => {
    if (!message?.type?.startsWith('OPE_')) return;
    if (message.type === 'OPE_ENABLE') {
      if (!['text/html', 'application/xhtml+xml'].includes(document.contentType)) {
        respond({ ok: false, error: 'The reader works on web pages. PDF documents, images and other file viewers are not supported yet.' });
        return;
      }
      if (!reader) reader = createReader({
        document,
        entries: message.entries,
        onFeedback(entry, kind) {
          chrome.runtime.sendMessage({ type: 'OPE_OPEN_FEEDBACK', entryId: entry.id, kind }).catch(() => {});
        },
      });
      respond({ ok: true, state: reader.enable() });
    } else if (message.type === 'OPE_DISABLE') respond({ ok: true, state: reader?.disable() || { enabled: false, count: 0, truncated: false } });
    else if (message.type === 'OPE_GET_STATE') respond({ ok: true, state: reader?.getState() || { enabled: false, count: 0, truncated: false } });
    else if (message.type === 'OPE_OPEN_FIRST') respond({ ok: true, opened: reader?.openFirst() || false, state: reader?.getState() || { enabled: false, count: 0, truncated: false } });
  });
}
