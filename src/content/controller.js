import { createMatcher } from '../core/matcher.js';
import { assertReadingMode, getInlinePresentation } from '../core/inline.js';
import { createPanel } from './panel.js';

const SKIP = 'script,style,noscript,form,label,textarea,input,select,option,button,summary,a,code,pre,kbd,samp,svg,math,canvas,iframe,video,audio,[contenteditable]:not([contenteditable="false" i]),[role="button"],[role="link"],[role="textbox"],[aria-hidden="true"],[hidden],[inert],[data-ope-owned]';
const MARK_STYLE = '[data-ope-term] { color:inherit!important; background:rgba(118,173,141,.18)!important; border:0!important; border-bottom:1px dotted #237452!important; border-radius:2px!important; padding:0 1px!important; margin:0!important; font:inherit!important; letter-spacing:inherit!important; text-transform:inherit!important; cursor:help!important; box-decoration-break:clone; } [data-ope-term]:focus-visible { outline:2px solid #bb590d!important; outline-offset:3px!important; }';

export function createReader({ document, entries, onFeedback, onStateChange, maxMarks = 750, maxNodes = 15000 }) {
  if (!Array.isArray(entries) || entries.length > 5000) throw new TypeError('The reader needs a bounded glossary.');
  const ids = new Set();
  for (const entry of entries) {
    if (!entry || typeof entry.id !== 'string' || !/^[a-z\d][a-z\d._:-]*$/iu.test(entry.id) || ids.has(entry.id)
      || typeof entry.term !== 'string' || !entry.term.trim() || entry.term.length > 240
      || !Array.isArray(entry.aliases) || entry.aliases.length > 50 || entry.aliases.some((alias) => typeof alias !== 'string' || !alias.trim() || alias.length > 240)
      || ['short', 'explanation', 'context'].some((key) => typeof entry[key] !== 'string')
      || !Array.isArray(entry.sources) || entry.sources.some((source) => !source || typeof source.label !== 'string' || typeof source.url !== 'string')
      || !entry.review || typeof entry.review.status !== 'string') throw new TypeError('The reader glossary is invalid.');
    ids.add(entry.id);
  }
  if (!Number.isInteger(maxMarks) || maxMarks < 1 || !Number.isInteger(maxNodes) || maxNodes < 1) throw new TypeError('Reader work limits must be positive integers.');
  const view = document.defaultView;
  const matcher = createMatcher(entries);
  const panel = createPanel({ document, onFeedback });
  // Matched originals stay private; page attributes are never restoration data.
  const marks = new Map();
  const pendingRoots = new Set();
  let enabled = false;
  let mode = 'plain';
  let truncated = false;
  let style;
  let timer;
  let nodesRead = 0;
  let processing = false;
  let visibilityCache = new WeakMap();

  function inDocument(mark) { return mark.ownerDocument === document && mark.isConnected; }
  function unchanged(mark, record = marks.get(mark)) {
    return Boolean(record && mark.childNodes.length === 1 && mark.firstChild === record.node && record.node.data === record.presentation.displayText);
  }
  function usable(mark, record = marks.get(mark)) {
    return Boolean(record && inDocument(mark) && unchanged(mark, record) && mark.dataset.opeOwned === 'term' && mark.dataset.opeTerm === record.entry.id);
  }
  function getState() {
    let count = 0;
    let replacedCount = 0;
    for (const [mark, record] of marks) if (usable(mark, record)) { count++; if (record.presentation.replaced) replacedCount++; }
    return { enabled, mode, count, replacedCount, annotatedCount: count - replacedCount, truncated };
  }
  function notify() { onStateChange?.(getState()); }
  function observe() {
    if (enabled && document.documentElement) observer.observe(document.documentElement, {
      childList: true, subtree: true, characterData: true, attributes: true,
      attributeFilter: ['class', 'style', 'hidden', 'aria-hidden', 'lang', 'contenteditable', 'inert', 'role', 'open', 'data-ope-term', 'data-ope-owned'],
    });
  }
  function suspended(operation) {
    processing = true;
    observer.disconnect();
    try { return operation(); }
    finally { processing = false; observe(); }
  }
  function restoreMark(mark) {
    const record = marks.get(mark);
    if (!record) return null;
    const parent = mark.parentNode;
    // Restore only the still-owned text node. Hosts may wrap it or add siblings;
    // those structural changes remain intact. New/reworded nodes are host-owned.
    const retained = mark.contains(record.node) && record.node.data === record.presentation.displayText;
    if (retained) record.node.data = record.presentation.originalText;
    const children = [...mark.childNodes];
    marks.delete(mark);
    if (parent) mark.replaceWith(...children);
    else {
      // Restore a host-held detached marker without reinserting a removed node.
      mark.removeAttribute('data-ope-term');
      mark.removeAttribute('data-ope-owned');
      if (mark.getAttribute('role') === 'button') mark.removeAttribute('role');
      if (mark.getAttribute('tabindex') === '0') mark.removeAttribute('tabindex');
      if (mark.getAttribute('aria-haspopup') === 'dialog') mark.removeAttribute('aria-haspopup');
      if (mark.getAttribute('aria-label') === record.ariaLabel) mark.removeAttribute('aria-label');
      if (mark.title === record.title) mark.removeAttribute('title');
    }
    return parent;
  }
  function restoreAll() {
    panel.close({ restoreFocus: false });
    const parents = new Set();
    for (const mark of [...marks.keys()]) { const parent = restoreMark(mark); if (parent) parents.add(parent); }
    for (const parent of parents) parent.normalize();
  }

  const observer = new view.MutationObserver((mutations) => {
    if (!enabled || processing) return;
    const invalidated = new Set();
    for (const mutation of mutations) {
      const targetElement = mutation.target.nodeType === 1 ? mutation.target : mutation.target.parentElement;
      const changedMark = targetElement?.closest('[data-ope-term]') || (marks.has(targetElement) ? targetElement : null);
      if (changedMark && marks.has(changedMark)) { invalidated.add(changedMark); continue; }
      if (targetElement?.closest('[data-ope-owned]')) continue;
      if (mutation.type === 'characterData') pendingRoots.add(mutation.target.parentElement || mutation.target);
      else if (mutation.type === 'attributes') pendingRoots.add(mutation.target);
      else {
        const changed = [...mutation.addedNodes, ...mutation.removedNodes];
        if (changed.some((node) => node.nodeType === 3 || marks.has(node))) pendingRoots.add(mutation.target);
        else for (const node of mutation.addedNodes) if (!(node.nodeType === 1 && node.hasAttribute('data-ope-owned'))) pendingRoots.add(node);
      }
    }
    let removed = false;
    if (invalidated.size || [...marks.keys()].some((mark) => !inDocument(mark))) suspended(() => {
      panel.close({ restoreFocus: false });
      const parents = new Set();
      for (const mark of invalidated) { const parent = restoreMark(mark); if (parent) { parents.add(parent); pendingRoots.add(parent); } }
      for (const mark of [...marks.keys()]) if (!inDocument(mark)) { restoreMark(mark); removed = true; }
      for (const parent of parents) parent.normalize();
    });
    // Status writes in the consumer's excluded region must not recurse.
    if (!pendingRoots.size) { if (removed) notify(); return; }
    if (!timer) timer = view.setTimeout(flush, 80);
  });

  function visible(element) {
    function computed(node) {
      if (!visibilityCache.has(node)) visibilityCache.set(node, view.getComputedStyle(node));
      return visibilityCache.get(node);
    }
    const own = computed(element);
    if (own.visibility === 'hidden' || own.visibility === 'collapse') return false;
    for (let parent = element; parent; parent = parent.parentElement) if (computed(parent).display === 'none') return false;
    return true;
  }
  function eligible(node) {
    const parent = node.parentElement;
    if (!parent || !node.textContent?.trim() || parent.closest(SKIP) || parent.closest('details:not([open])')) return false;
    const lang = parent.closest('[lang]')?.getAttribute('lang');
    return !(lang && !/^en(?:-|$)/i.test(lang)) && visible(parent);
  }
  function decorate(node) {
    if (marks.size >= maxMarks || nodesRead >= maxNodes) { truncated = true; return; }
    nodesRead++;
    if (!eligible(node)) return;
    const text = node.textContent;
    if (text.length > 50000) { truncated = true; return; }
    const found = matcher.find(text);
    if (!found.length) return;
    const fragment = document.createDocumentFragment();
    let offset = 0;
    for (const match of found) {
      if (marks.size >= maxMarks) { truncated = true; break; }
      fragment.append(document.createTextNode(text.slice(offset, match.start)));
      const presentation = getInlinePresentation(match.entry, match.matchedText, mode, { before: text.slice(0, match.start), after: text.slice(match.end) });
      const mark = document.createElement('span');
      const renderedNode = document.createTextNode(presentation.displayText);
      mark.dataset.opeOwned = 'term';
      mark.dataset.opeTerm = match.entry.id;
      mark.append(renderedNode);
      mark.tabIndex = 0;
      mark.setAttribute('role', 'button');
      mark.setAttribute('aria-haspopup', 'dialog');
      const ariaLabel = presentation.replaced ? `${presentation.displayText}. Original words: ${presentation.originalText}. Open explanation.` : `${presentation.originalText}: ${match.entry.short}. Open explanation.`;
      const title = presentation.replaced ? `${presentation.originalText} → ${presentation.displayText}. Open explanation.` : `${presentation.originalText}. ${presentation.reason} Open explanation.`;
      mark.setAttribute('aria-label', ariaLabel);
      mark.title = title;
      fragment.append(mark);
      marks.set(mark, { entry: match.entry, node: renderedNode, presentation, ariaLabel, title });
      offset = match.end;
    }
    fragment.append(document.createTextNode(text.slice(offset)));
    node.replaceWith(fragment);
  }
  function scan(root) {
    if (!root?.isConnected) return;
    if (marks.size >= maxMarks || nodesRead >= maxNodes) { truncated = true; return; }
    if (root === document.documentElement) root = document.body;
    if (!root) return;
    if (root.nodeType === 3) { decorate(root); return; }
    if (root.nodeType !== 1 || root.closest(SKIP)) return;
    const walker = document.createTreeWalker(root, view.NodeFilter.SHOW_TEXT);
    const nodes = [];
    const remainingNodes = maxNodes - nodesRead;
    let node;
    while ((node = walker.nextNode())) {
      nodes.push(node);
      if (nodes.length >= remainingNodes) { if (walker.nextNode()) truncated = true; break; }
    }
    for (const [index, textNode] of nodes.entries()) {
      decorate(textNode);
      if (marks.size >= maxMarks || nodesRead >= maxNodes) { if (index + 1 < nodes.length) truncated = true; break; }
    }
  }
  function beginScan() { nodesRead = 0; visibilityCache = new WeakMap(); }
  function flush() {
    timer = undefined;
    if (!enabled) return;
    suspended(() => {
      beginScan();
      const candidates = new Set([...pendingRoots].map((root) => root === document.documentElement ? document.body : root).filter((root) => root?.isConnected));
      const roots = [...candidates].filter((root) => {
        for (let parent = root.parentElement; parent; parent = parent.parentElement) if (candidates.has(parent)) return false;
        return true;
      });
      for (const root of roots) {
        const parents = new Set();
        if (root.nodeType === 1) for (const mark of [...marks.keys()]) if (root.contains(mark)) {
          panel.close({ restoreFocus: false });
          const parent = restoreMark(mark);
          if (parent) parents.add(parent);
        }
        for (const parent of parents) parent.normalize();
        scan(root);
      }
      pendingRoots.clear();
    });
    notify();
  }
  function openMark(mark) {
    const record = marks.get(mark);
    const pending = [...pendingRoots].some((root) => root.nodeType === 1 && root.contains(mark));
    if (!pending && usable(mark, record)) panel.show(record.entry, mark, record.presentation);
  }
  function click(event) {
    const mark = event.target.closest?.('[data-ope-term]');
    if (!mark || document.getSelection()?.toString()) return;
    openMark(mark);
  }
  function keydown(event) {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    const mark = event.target.closest?.('[data-ope-term]');
    if (!mark || !marks.has(mark)) return;
    event.preventDefault();
    openMark(mark);
  }
  function cancelPending() { if (timer) view.clearTimeout(timer); timer = undefined; pendingRoots.clear(); }
  function setMode(nextMode) {
    assertReadingMode(nextMode);
    if (mode === nextMode) return getState();
    mode = nextMode;
    if (enabled) suspended(() => { cancelPending(); restoreAll(); truncated = false; beginScan(); scan(document.body); });
    notify();
    return getState();
  }
  function enable(options = {}) {
    if (!options || typeof options !== 'object' || Array.isArray(options)) throw new TypeError('Reader options must specify a valid mode.');
    const nextMode = options.mode === undefined ? mode : assertReadingMode(options.mode);
    if (enabled) return setMode(nextMode);
    mode = nextMode;
    enabled = true;
    truncated = false;
    beginScan();
    style = document.createElement('style');
    style.dataset.opeOwned = 'styles';
    style.textContent = MARK_STYLE;
    (document.head || document.documentElement).append(style);
    scan(document.body);
    document.addEventListener('click', click);
    document.addEventListener('keydown', keydown);
    observe();
    notify();
    return getState();
  }
  function disable() {
    enabled = false;
    observer.disconnect();
    cancelPending();
    restoreAll();
    document.removeEventListener('click', click);
    document.removeEventListener('keydown', keydown);
    style?.remove();
    style = undefined;
    truncated = false;
    notify();
    return getState();
  }
  function openFirst() {
    const first = [...marks.keys()].find((mark) => usable(mark));
    if (first) { first.scrollIntoView?.({ block: 'center', behavior: 'instant' }); openMark(first); }
    return Boolean(first);
  }
  return { enable, disable, setMode, getState, openFirst, destroy() { disable(); panel.destroy(); } };
}
