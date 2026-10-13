import { createActions } from './actions.js';

let lexiconPromise;
const actions = createActions(chrome, () => {
  lexiconPromise ||= fetch(chrome.runtime.getURL('data/health.json')).then((response) => {
    if (!response.ok) throw new Error('The bundled dictionary could not be loaded. Reload the extension.');
    return response.json();
  }).catch((error) => { lexiconPromise = undefined; throw error; });
  return lexiconPromise;
});

chrome.runtime.onMessage.addListener((message, sender, respond) => {
  if (sender?.id !== chrome.runtime.id || typeof message?.type !== 'string' || !message.type.startsWith('OPE_')) return false;
  actions.handle(message).then(respond).catch((error) => {
    let detail = error?.message || 'Something went wrong. Please try again.';
    if (/cannot access|cannot be scripted|extensions gallery|missing host permission|frame|receiving end|could not establish connection/i.test(detail)) detail = 'This page cannot be annotated, or it changed while opening. Try a regular web page and enable the reader again.';
    respond({ ok: false, error: detail });
  });
  return true;
});
