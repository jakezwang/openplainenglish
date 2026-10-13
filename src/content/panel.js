const STYLE = `
:host { all: initial; font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #172e2a; font-size: 15px; line-height: 1.5; color-scheme: light; }
* { box-sizing: border-box; }
.panel { font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; font-size: 15px; line-height: 1.5; color: #172e2a; color-scheme: light; position: fixed; z-index: 2147483647; right: 24px; bottom: 24px; width: 382px; max-width: calc(100vw - 24px); max-height: min(680px, calc(100dvh - 32px)); overflow-y: auto; background: #fffdf7; border: 1px solid #b8cec4; border-radius: 20px; box-shadow: 0 14px 64px #142e293b; padding: 24px; text-align: left; }
.top { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding-bottom: 14px; border-bottom: 1px solid #e1e6dc; }
.brand { font-size: 11px; font-weight: 750; letter-spacing: .08em; text-transform: uppercase; color: #49695b; }
button { font: inherit; color: inherit; cursor: pointer; border-radius: 9px; border: 1px solid #c4d2c8; background: #fffdf7; padding: 9px 12px; text-align: center; }
button:hover { background: #e8f0e8; }
button:focus-visible, a:focus-visible { outline: 3px solid #ba580c; outline-offset: 3px; }
.close { border: 0; font-size: 22px; line-height: 1; padding: 6px 8px; }
.term { font-size: 14px; margin: 19px 0 4px; color: #52685f; overflow-wrap: anywhere; }
h2 { font-family: Georgia, serif; font-size: 27px; line-height: 1.2; font-weight: 500; margin: 0 0 16px; color: #153b31; overflow-wrap: anywhere; }
p { margin: 10px 0; font-size: 14px; line-height: 1.6; }
.context { border-left: 3px solid #9bbb9e; padding: 2px 0 2px 13px; margin: 16px 0; }
.label { display: block; font-size: 11px; font-weight: 750; letter-spacing: .06em; text-transform: uppercase; color: #53665c; margin-bottom: 5px; }
.sources { display: flex; flex-wrap: wrap; gap: 6px 12px; }
a { color: #176549; text-underline-offset: 3px; font-size: 12px; overflow-wrap: anywhere; }
.review { font-size: 11px; line-height: 1.5; color: #637269; padding: 12px 0; border-bottom: 1px solid #e1e6dc; }
.feedback { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 9px; }
.feedback button { font-size: 12px; flex: 1; }
.foot { font-size: 11px; color: #637269; margin-top: 14px; }
@media (max-width: 480px) { .panel { right: 12px; bottom: 12px; padding: 20px; } }
@media (prefers-reduced-motion: no-preference) { .panel { animation: enter .13s ease-out; } @keyframes enter { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } } }
`;

export function createPanel({ document, onFeedback }) {
  let host;
  let anchor;
  let currentEntry;
  function close({ restoreFocus = true } = {}) {
    if (!host) return;
    host.remove();
    host = undefined;
    document.removeEventListener('keydown', handleEscape, true);
    if (restoreFocus && anchor?.isConnected) anchor.focus({ preventScroll: true });
    anchor = undefined;
    currentEntry = undefined;
  }
  function handleEscape(event) {
    if (event.key === 'Escape' && host) {
      event.preventDefault();
      event.stopPropagation();
      close();
    }
  }
  function show(entry, element) {
    close({ restoreFocus: false });
    anchor = element;
    currentEntry = entry;
    host = document.createElement('div');
    host.setAttribute('data-ope-owned', 'panel');
    // Reset the host too: site styles cannot move the dialog into a page grid.
    host.style.cssText = 'all:initial!important;position:fixed!important;inset:0!important;z-index:2147483647!important;pointer-events:none!important;';
    const shadow = host.attachShadow({ mode: 'open' });
    const style = document.createElement('style');
    style.textContent = STYLE;
    shadow.append(style);
    const panel = document.createElement('section');
    panel.className = 'panel';
    panel.style.pointerEvents = 'auto';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-labelledby', 'ope-meaning');
    panel.setAttribute('aria-describedby', 'ope-explanation');
    const el = (tag, text, className) => {
      const node = document.createElement(tag);
      if (text != null) node.textContent = text;
      if (className) node.className = className;
      return node;
    };
    const top = el('div', null, 'top');
    top.append(el('span', 'OpenPlainEnglish / In everyday words', 'brand'));
    const closeButton = el('button', '×', 'close');
    closeButton.type = 'button';
    closeButton.setAttribute('aria-label', 'Close explanation');
    closeButton.addEventListener('click', () => close());
    top.append(closeButton);
    panel.append(top, el('p', entry.term, 'term'));
    const heading = el('h2', entry.short);
    heading.id = 'ope-meaning';
    const description = el('p', entry.explanation);
    description.id = 'ope-explanation';
    const context = el('div', null, 'context');
    context.append(el('span', 'In this context', 'label'), el('p', entry.context));
    panel.append(heading, description, context);
    const sources = el('div', null, 'sources');
    for (const source of entry.sources) {
      try {
        if (new URL(source.url).protocol !== 'https:') continue;
        const link = el('a', `${source.label} ↗`);
        link.href = source.url;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        sources.append(link);
      } catch { /* Invalid data cannot create unsafe links. */ }
    }
    panel.append(el('span', 'Check the source', 'label'), sources);
    panel.append(el('p', `Source-checked · ${entry.review.date}. Editorial comparison with the source; not an independent clinical review or a reader comprehension test.`, 'review'));
    panel.append(el('span', 'Help make this clearer', 'label'));
    const feedback = el('div', null, 'feedback');
    for (const [kind, text] of [['unclear', 'Still hard to understand'], ['inaccurate', 'May be inaccurate']]) {
      const button = el('button', text);
      button.type = 'button';
      button.addEventListener('click', () => onFeedback?.(currentEntry, kind));
      feedback.append(button);
    }
    panel.append(feedback, el('p', 'Your page stays on your device. Feedback starts as a local draft.', 'foot'));
    panel.append(el('p', 'Adapted from cited public sources. Source publishers and the U.S. Government do not endorse OpenPlainEnglish.', 'foot'));
    shadow.append(panel);
    (document.body || document.documentElement).append(host);
    document.addEventListener('keydown', handleEscape, true);
    closeButton.focus({ preventScroll: true });
  }
  return { show, close, destroy: () => close({ restoreFocus: false }) };
}
