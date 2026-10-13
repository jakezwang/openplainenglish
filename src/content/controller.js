import { createMatcher } from '../core/matcher.js';
import { createPanel } from './panel.js';

const SKIP = 'script,style,noscript,form,label,textarea,input,select,option,button,a,code,pre,kbd,samp,svg,math,canvas,iframe,video,audio,[contenteditable]:not([contenteditable="false"]),[role="button"],[role="link"],[role="textbox"],[aria-hidden="true"],[hidden],[inert],[data-ope-owned]';
const MARK_STYLE = '[data-ope-term] { color:inherit!important; background:rgba(118,173,141,.18)!important; border:0!important; border-bottom:1px dotted #237452!important; border-radius:2px!important; padding:0 1px!important; margin:0!important; font:inherit!important; letter-spacing:inherit!important; text-transform:inherit!important; cursor:help!important; box-decoration-break:clone; } [data-ope-term]:focus-visible { outline:2px solid #bb590d!important; outline-offset:3px!important; }';

export function createReader({ document, entries, onFeedback, onStateChange, maxMarks = 750, maxNodes = 15000 }) {
  const view = document.defaultView;
  const matcher = createMatcher(entries);
  const entryMap = new Map(entries.map((entry) => [entry.id, entry]));
  const panel = createPanel({ document, onFeedback });
  const marks = new Set();
  let enabled = false;
  let truncated = false;
  let style;
  let timer;
  let nodesRead = 0;
  let processing = false;
  let visibilityCache = new WeakMap();
  const pendingRoots = new Set();
  const observer = new view.MutationObserver((mutations) => {
    if (!enabled || processing) return;
    const invalidated = new Set();
    for (const mutation of mutations) {
      const targetElement = mutation.target.nodeType === 1 ? mutation.target : mutation.target.parentElement;
      const changedMark = targetElement?.closest('[data-ope-term]');
      if (changedMark && marks.has(changedMark)) {
        invalidated.add(changedMark);
        continue;
      }
      if (mutation.type === 'characterData') {
        if (mutation.target.parentElement?.closest('[data-ope-owned]')) continue;
        pendingRoots.add(mutation.target);
      } else if (mutation.type === 'attributes') {
        if (!targetElement?.closest('[data-ope-owned]')) pendingRoots.add(mutation.target);
      } else {
        if (mutation.target.nodeType === 1 && mutation.target.closest('[data-ope-owned]')) continue;
        for (const node of mutation.addedNodes) {
          if (!(node.nodeType === 1 && node.hasAttribute('data-ope-owned'))) pendingRoots.add(node);
        }
      }
    }
    if (invalidated.size) {
      observer.disconnect();
      panel.close({ restoreFocus: false });
      for (const mark of invalidated) {
        const children = [...mark.childNodes];
        marks.delete(mark);
        mark.replaceWith(...children);
        for (const child of children) pendingRoots.add(child);
      }
      observe();
    }
    // Release disconnected markers so infinite-scroll pages do not leak memory.
    let removed = false;
    for (const mark of marks) if (!mark.isConnected) { marks.delete(mark); panel.close({ restoreFocus: false }); removed = true; }
    // A consumer may render status text inside its own excluded region. Do not
    // notify for those writes, or status rendering can create an observer loop.
    if (!pendingRoots.size) { if (removed) notify(); return; }
    if (!timer) timer = view.setTimeout(flush, 80);
  });
  function observe() {
    if (document.documentElement) observer.observe(document.documentElement, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ['class', 'style', 'hidden', 'aria-hidden', 'lang', 'contenteditable', 'inert', 'role'] });
  }
  function getState() { return { enabled, count: [...marks].filter((mark) => mark.isConnected).length, truncated }; }
  function notify() { onStateChange?.(getState()); }
  function visible(element) {
    if (!element || element === document.documentElement) return true;
    if (visibilityCache.has(element)) return visibilityCache.get(element);
    const computed = view.getComputedStyle(element);
    const value = computed.display !== 'none' && computed.visibility !== 'hidden' && computed.visibility !== 'collapse' && visible(element.parentElement);
    visibilityCache.set(element, value);
    return value;
  }
  function eligible(node) {
    const parent = node.parentElement;
    if (!parent || !node.textContent?.trim() || parent.closest(SKIP)) return false;
    // Do not add English annotations to explicitly non-English passages.
    const lang = parent.closest('[lang]')?.getAttribute('lang');
    if (lang && !/^en(?:-|$)/i.test(lang)) return false;
    return visible(parent);
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
      const mark = document.createElement('span');
      mark.dataset.opeOwned = 'term';
      mark.dataset.opeTerm = match.entry.id;
      mark.textContent = match.matchedText;
      mark.tabIndex = 0;
      mark.setAttribute('role', 'button');
      mark.setAttribute('aria-haspopup', 'dialog');
      mark.setAttribute('aria-label', `${match.matchedText}: ${match.entry.short}. Open explanation`);
      mark.title = match.entry.short;
      fragment.append(mark);
      marks.add(mark);
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
    let node;
    while ((node = walker.nextNode())) {
      nodes.push(node);
      if (nodes.length >= maxNodes) { truncated = true; break; }
    }
    for (const textNode of nodes) {
      decorate(textNode);
      if (marks.size >= maxMarks || nodesRead >= maxNodes) break;
    }
  }
  function flush() {
    timer = undefined;
    if (!enabled) return;
    processing = true;
    observer.disconnect();
    nodesRead = 0;
    visibilityCache = new WeakMap();
    for (const root of pendingRoots) {
      // Attributes can turn a previously readable region into a hidden or editable
      // area. Reconcile those existing marks before scanning its current content.
      if (root.nodeType === 1) for (const mark of [...marks]) {
        if (root.contains(mark)) { panel.close({ restoreFocus: false }); marks.delete(mark); mark.replaceWith(...mark.childNodes); }
      }
      scan(root);
    }
    pendingRoots.clear();
    processing = false;
    observe();
    notify();
  }
  function openMark(mark) {
    const entry = entryMap.get(mark?.dataset.opeTerm);
    if (entry && marks.has(mark)) panel.show(entry, mark);
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
  function enable() {
    if (enabled) return getState();
    enabled = true;
    truncated = false;
    nodesRead = 0;
    visibilityCache = new WeakMap();
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
    if (timer) view.clearTimeout(timer);
    timer = undefined;
    pendingRoots.clear();
    panel.close({ restoreFocus: false });
    document.removeEventListener('click', click);
    document.removeEventListener('keydown', keydown);
    const parents = new Set();
    for (const mark of marks) {
      if (!mark.isConnected) continue;
      parents.add(mark.parentNode);
      // Preserve edits made by the page since annotation; never restore a stale snapshot.
      mark.replaceWith(...mark.childNodes);
    }
    for (const parent of parents) parent?.normalize();
    marks.clear();
    style?.remove();
    style = undefined;
    truncated = false;
    notify();
    return getState();
  }
  function openFirst() {
    const first = [...marks].find((mark) => mark.isConnected);
    if (first) { first.scrollIntoView?.({ block: 'center', behavior: 'instant' }); openMark(first); }
    return Boolean(first);
  }
  return { enable, disable, getState, openFirst, destroy() { disable(); panel.destroy(); } };
}
