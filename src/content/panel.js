import { DOMAIN_INLINE_REVIEW_METHOD } from '../core/inline.js';

const STYLE = `
:host { all:initial; font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif; color:#172e2a; font-size:15px; line-height:1.5; color-scheme:light; }
* { box-sizing:border-box; }
.panel { font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif; font-size:15px; line-height:1.5; color:#172e2a; color-scheme:light; position:fixed; z-index:2147483647; right:24px; bottom:24px; width:390px; max-width:calc(100vw - 24px); max-height:min(760px,calc(100dvh - 32px)); overflow-y:auto; background:#fffdf7; border:1px solid #b8cec4; border-radius:20px; box-shadow:0 14px 64px #142e293b; padding:24px; text-align:left; }
.panel.compact { padding:16px; font-size:14px; } .compact p { margin:7px 0; } .compact .context { margin:10px 0; } .compact h2 { font-size:23px; margin-bottom:10px; }
.top { display:flex; align-items:center; justify-content:space-between; gap:12px; padding-bottom:12px; border-bottom:1px solid #e1e6dc; }
.brand { font-size:11px; font-weight:750; letter-spacing:.06em; color:#49695b; }
button { font:inherit; color:inherit; cursor:pointer; border-radius:9px; border:1px solid #c4d2c8; background:#fffdf7; padding:9px 12px; text-align:center; }
button:hover { background:#e8f0e8; } button:disabled { opacity:.55; cursor:default; }
button:focus-visible,a:focus-visible,summary:focus-visible { outline:3px solid #ba580c; outline-offset:3px; }
.close { border:0; font-size:22px; line-height:1; padding:6px 8px; }
.term { font-size:14px; margin:12px 0 4px; color:#52685f; overflow-wrap:anywhere; user-select:text; }
.wording-note { margin:10px 0; font-size:12px; } .wording-note summary { cursor:pointer; color:#176549; }
h2 { font-family:Georgia,serif; font-size:27px; line-height:1.2; font-weight:500; margin:16px 0; color:#153b31; overflow-wrap:anywhere; }
p { margin:10px 0; font-size:14px; line-height:1.6; }
.context { border-left:3px solid #9bbb9e; padding:2px 0 2px 13px; margin:16px 0; }
.label { display:block; font-size:11px; font-weight:750; letter-spacing:.04em; color:#53665c; margin:12px 0 5px; }
.sources { display:flex; flex-wrap:wrap; gap:6px 12px; } a { color:#176549; text-underline-offset:3px; font-size:12px; overflow-wrap:anywhere; }
.review { font-size:11px; line-height:1.5; color:#637269; padding:12px 0; border-bottom:1px solid #e1e6dc; }
.feedback,.actions { display:flex; gap:8px; flex-wrap:wrap; margin-top:9px; } .feedback button,.actions button { font-size:12px; flex:1; }
.foot,.copy-status { font-size:11px; color:#637269; margin-top:12px; } .copy-status:empty { display:none; }
@media (max-width:480px) { .panel { right:12px; bottom:12px; padding:20px; } .panel.compact { padding:14px; } }
@media print { :host { display:none!important; } }
@media (prefers-reduced-motion:no-preference) { .panel { animation:enter .13s ease-out; } @keyframes enter { from { opacity:0; transform:translateY(5px); } to { opacity:1; transform:translateY(0); } } }
`;
const LABELS = {
  en: {
    brand: 'OpenPlainEnglish / In everyday words', close: 'Close explanation', original: 'Original words', plain: 'Plain wording on this page', wording: 'About this wording',
    context: 'Example context', sources: 'Check the source', feedback: 'Help make this clearer', unclear: 'Still hard to understand', inaccurate: 'May be inaccurate',
    copy: 'Copy original', copied: 'Original words copied.', copyFailed: 'Copy is unavailable. Select the original words above and copy them.', restore: 'Restore this occurrence', ignore: 'Ignore this term on this page',
    local: 'Your page stays on your device. Feedback starts as a local draft.', localReading: 'Your page stays on your device.', endorsement: 'Adapted from cited public sources. Source publishers and the U.S. Government do not endorse OpenPlainEnglish.',
    checked: 'Source-checked', review: 'Editorial comparison with the source; not an independent clinical review or a reader comprehension test.',
    domainReview: 'Editorial comparison with the source; not an independent domain-expert review or a reader comprehension test.',
    unconfirmed: 'Review status not confirmed. This explanation has not been independently reviewed or comprehension tested.',
    english: '',
  },
  'zh-CN': {
    brand: 'OpenPlainEnglish / 用日常用语阅读', close: '关闭解释', original: '原词', plain: '本页显示的通俗表达', wording: '关于这组表达',
    context: '示例语境', sources: '查看来源', feedback: '帮助改进解释', unclear: '仍然难懂', inaccurate: '可能不准确',
    copy: '复制原词', copied: '已复制原词。', copyFailed: '无法自动复制。请选中上方原词后手动复制。', restore: '仅此处恢复原词', ignore: '在本页忽略此术语',
    local: '网页内容留在你的设备上。反馈先保存为本地草稿。', localReading: '网页内容留在你的设备上。', endorsement: '依据所引公共来源改写。来源机构及美国政府不为 OpenPlainEnglish 背书。',
    checked: '已对照来源', review: '编辑已与来源对照；未经独立临床审核或读者理解测试。', domainReview: '编辑已与来源对照；未经独立领域专家审核或读者理解测试。',
    unconfirmed: '审核状态未确认。本解释未经独立审核或读者理解测试。', english: '以下释义和示例保留来源词库的英文；中文设置只翻译界面标签。',
  },
};
const REASONS = new Map([
  ['Annotation mode keeps the original wording.', '注释模式保留原词。'],
  ['Quoted words or an explicit name are kept in their original form.', '引述用词或明确标记的名称保留原词。'],
  ['This term is part of a joined compound, so the original wording is kept.', '此术语属于连字符连接的复合表达，因此保留原词。'],
  ['A possessive form is kept because this exact wording has no reviewed replacement.', '这个所有格形式没有经对照的对应表达，因此保留原词。'],
  ['No source-checked plain phrase is available, so the original wording is kept.', '没有已对照来源的通俗表达，因此保留原词。'],
  ['The plain phrase is not confirmed for this wording.', '尚未确认这组用词的通俗表达。'],
  ['This wording is already plain and is kept as written.', '这组用词已较通俗，按原样保留。'],
  ['No approved plain phrase covers this exact wording, so the original is kept.', '词库没有覆盖这组具体用词的通俗表达，因此保留原词。'],
  ['This capitalization is unusual, so the original wording is kept.', '大小写形式较特殊，因此保留原词。'],
  ['You restored this occurrence to its original wording.', '你已将这一处恢复为原词。'],
]);

export function createPanel({ document, onFeedback, onRestore, onIgnore, preferences = {} }) {
  let prefs = { language: 'en', density: 'comfortable', ...preferences };
  let host;
  let anchor;
  let currentEntry;
  let currentPresentation;
  function close({ restoreFocus = true } = {}) {
    if (!host) return;
    host.remove();
    host = undefined;
    document.removeEventListener('keydown', handleEscape, true);
    if (restoreFocus && anchor?.isConnected) anchor.focus({ preventScroll: true });
    anchor = undefined;
    currentEntry = undefined;
    currentPresentation = undefined;
  }
  function handleEscape(event) {
    if (event.key === 'Escape' && host) { event.preventDefault(); event.stopPropagation(); close(); }
  }
  function focusPage(element) {
    if (!element?.isConnected) return;
    const old = element.getAttribute('tabindex');
    if (old === null) element.setAttribute('tabindex', '-1');
    element.focus({ preventScroll: true });
    if (old === null) element.removeAttribute('tabindex');
  }
  function show(entry, element, presentation = {}) {
    close({ restoreFocus: false });
    anchor = element;
    currentEntry = entry;
    currentPresentation = presentation;
    const labels = LABELS[prefs.language] || LABELS.en;
    host = document.createElement('div');
    host.setAttribute('data-ope-owned', 'panel');
    host.style.cssText = 'all:initial!important;position:fixed!important;inset:0!important;z-index:2147483647!important;pointer-events:none!important;';
    const shadow = host.attachShadow({ mode: 'open' });
    const style = document.createElement('style');
    style.textContent = STYLE;
    shadow.append(style);
    const panel = document.createElement('section');
    panel.className = `panel${prefs.density === 'compact' ? ' compact' : ''}`;
    panel.lang = prefs.language;
    panel.style.pointerEvents = 'auto';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-modal', 'false');
    panel.setAttribute('aria-labelledby', 'ope-meaning');
    panel.setAttribute('aria-describedby', 'ope-explanation');
    const el = (tag, text, className) => {
      const node = document.createElement(tag);
      if (text != null) node.textContent = text;
      if (className) node.className = className;
      return node;
    };
    const button = (text, action, className) => {
      const node = el('button', text, className);
      node.type = 'button';
      node.addEventListener('click', action);
      return node;
    };
    const top = el('div', null, 'top');
    const closeButton = button('×', () => close(), 'close');
    closeButton.setAttribute('aria-label', labels.close);
    top.append(el('span', labels.brand, 'brand'), closeButton);
    const original = presentation.originalText ?? entry.term;
    const originalWords = el('p', original, 'term original-words');
    originalWords.lang = 'en';
    panel.append(top, el('span', labels.original, 'label'), originalWords);
    if (presentation.replaced) {
      const displayed = el('p', presentation.displayText, 'reading-words');
      displayed.lang = 'en';
      panel.append(el('span', labels.plain, 'label'), displayed);
    }
    if (presentation.reason && !presentation.replaced) panel.append(el('p', prefs.language === 'zh-CN' ? REASONS.get(presentation.reason) || presentation.reason : presentation.reason, 'presentation-note'));
    const status = el('p', '', 'copy-status');
    status.setAttribute('role', 'status');
    status.setAttribute('aria-live', 'polite');
    const actions = el('div', null, 'actions');
    const copy = button(labels.copy, async () => {
      try {
        if (!document.defaultView.navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
        await document.defaultView.navigator.clipboard.writeText(original);
        if (copy.isConnected) status.textContent = labels.copied;
      } catch { if (copy.isConnected) status.textContent = labels.copyFailed; }
    }, 'copy-original');
    const restore = button(labels.restore, () => {
      const currentAnchor = anchor;
      const nextAnchor = onRestore?.(currentAnchor);
      close({ restoreFocus: false });
      focusPage(nextAnchor || currentAnchor);
    }, 'restore-occurrence');
    restore.disabled = !presentation.replaced || !onRestore;
    const ignore = button(labels.ignore, () => {
      const current = currentEntry;
      const oldAnchor = anchor;
      const container = oldAnchor?.parentElement;
      close({ restoreFocus: false });
      onIgnore?.(current);
      const next = document.querySelector('[data-ope-term][tabindex="0"]');
      focusPage(next || container || document.body);
    }, 'ignore-term');
    ignore.disabled = !onIgnore;
    actions.append(copy, restore, ignore);
    panel.append(actions, status);
    if (presentation.note) {
      const wordingNote = el('details', null, 'wording-note');
      const note = el('p', presentation.note);
      note.lang = 'en';
      wordingNote.append(el('summary', labels.wording), note);
      panel.append(wordingNote);
    }
    if (labels.english) panel.append(el('p', labels.english, 'foot'));
    const heading = el('h2', entry.short);
    heading.id = 'ope-meaning';
    heading.lang = 'en';
    const description = el('p', entry.explanation);
    description.id = 'ope-explanation';
    description.lang = 'en';
    const context = el('div', null, 'context');
    const contextWords = el('p', entry.context);
    contextWords.lang = 'en';
    context.append(el('span', labels.context, 'label'), contextWords);
    panel.append(heading, description, context);
    const sources = el('div', null, 'sources');
    for (const source of entry.sources) {
      try {
        const url = new URL(source.url);
        if (url.protocol !== 'https:' || url.username || url.password) continue;
        const link = el('a', `${source.label} ↗`);
        link.href = source.url;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        sources.append(link);
      } catch { /* Invalid data cannot create unsafe links. */ }
    }
    panel.append(el('span', labels.sources, 'label'), sources);
    const generic = entry.inline?.review?.method === DOMAIN_INLINE_REVIEW_METHOD || entry.review?.method === DOMAIN_INLINE_REVIEW_METHOD;
    const reviewText = entry.review?.status === 'source-checked'
      ? `${labels.checked}${entry.review.date ? ` · ${entry.review.date}` : ''}. ${generic ? labels.domainReview : labels.review}`
      : labels.unconfirmed;
    panel.append(el('p', reviewText, 'review'));
    if (typeof onFeedback === 'function') {
      const feedback = el('div', null, 'feedback');
      for (const kind of ['unclear', 'inaccurate']) feedback.append(button(labels[kind], () => onFeedback(entry, kind)));
      panel.append(el('span', labels.feedback, 'label'), feedback);
    }
    panel.append(el('p', typeof onFeedback === 'function' ? labels.local : labels.localReading, 'foot'), el('p', labels.endorsement, 'foot'));
    panel.addEventListener('keydown', (event) => {
      if (event.key !== 'Tab') return;
      const focusable = [...panel.querySelectorAll('button:not(:disabled),a[href],summary')];
      const active = shadow.activeElement;
      if ((event.shiftKey && active === focusable[0]) || (!event.shiftKey && active === focusable.at(-1))) {
        event.preventDefault();
        // The dialog is nonmodal. Crossing its edge returns to the phrase;
        // the next Tab can continue through the page in its natural order.
        close();
      }
    });
    shadow.append(panel);
    (document.body || document.documentElement).append(host);
    document.addEventListener('keydown', handleEscape, true);
    closeButton.focus({ preventScroll: true });
  }
  function setPreferences(next) {
    prefs = { ...prefs, ...next };
    if (host && anchor?.isConnected) {
      const active = host.shadowRoot.activeElement;
      const className = active?.className;
      const noteOpen = host.shadowRoot.querySelector('.wording-note')?.open;
      show(currentEntry, anchor, currentPresentation);
      if (noteOpen) host.shadowRoot.querySelector('.wording-note')?.setAttribute('open', '');
      if (className && typeof className === 'string' && /^[a-z-]+$/u.test(className)) host.shadowRoot.querySelector(`.${className}`)?.focus({ preventScroll: true });
    }
  }
  return { show, close, setPreferences, destroy: () => close({ restoreFocus: false }) };
}
