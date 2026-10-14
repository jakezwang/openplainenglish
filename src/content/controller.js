import { createMatcher } from '../core/matcher.js';
import { assertReadingMode, getInlinePresentation } from '../core/inline.js';
import { DEFAULT_PREFERENCES, validatePreferences } from '../shared/preferences.js';
import { createPanel } from './panel.js';

const SKIP = 'script,style,noscript,form,label,textarea,input,select,option,button,summary,a,code,pre,kbd,samp,svg,math,canvas,iframe,video,audio,[contenteditable]:not([contenteditable="false" i]),[role="button"],[role="link"],[role="textbox"],[aria-hidden="true"],[hidden],[inert],[data-ope-owned]';
const TRANSPARENT = new Set(['SPAN', 'EM', 'STRONG', 'B', 'I', 'U', 'SMALL', 'MARK', 'S', 'DEL', 'INS']);
const BREAK = new Set(['BR', 'HR', 'WBR', 'IMG', 'OBJECT', 'EMBED']);
const LITERAL = 'cite,abbr,dfn,q,[itemprop="name"]';
const MARK_STYLE = `[data-ope-term] { color:inherit!important; background:rgba(118,173,141,.13)!important; border:0!important; border-bottom:1px dotted #237452!important; border-radius:2px!important; padding:0!important; margin:0!important; font:inherit!important; letter-spacing:inherit!important; text-transform:inherit!important; cursor:help!important; box-decoration-break:clone; } [data-ope-term][data-ope-highlight="strong"] { color:#172e2a!important; background:#d3e9cd!important; border-bottom:2px solid #237452!important; } [data-ope-term]:focus-visible { outline:2px solid #bb590d!important; outline-offset:3px!important; } @media print { [data-ope-term] { color:inherit!important; background:none!important; border:0!important; } [data-ope-owned="panel"] { display:none!important; } }`;

// Split only presentation text. Existing inline elements remain in place; their
// attributes, listeners, and identity never become restoration instructions.
function splitPresentation(original, display, pieces) {
  if (display === original) return pieces.map((piece) => piece.originalText);
  const chars = Array.from(display);
  const boundaries = [];
  let position = 0;
  for (const char of chars) { boundaries.push(position); position += char.length; }
  boundaries.push(position);
  let sourceOffset = 0;
  let previous = 0;
  return pieces.map((piece, index) => {
    sourceOffset += piece.originalText.length;
    let end = index === pieces.length - 1 ? display.length : boundaries[Math.round(chars.length * sourceOffset / original.length)];
    if (index < pieces.length - 1 && (/\s/u.test(original[sourceOffset] ?? '') || /\s/u.test(original[sourceOffset - 1] ?? ''))) {
      const afterWhitespace = /\s/u.test(original[sourceOffset - 1] ?? '');
      const candidates = [...display.matchAll(/\s+/gu)].map((match) => afterWhitespace ? match.index + match[0].length : match.index);
      if (candidates.length) end = candidates.reduce((best, candidate) => Math.abs(candidate - end) < Math.abs(best - end) ? candidate : best);
    }
    end = Math.max(previous, end);
    const text = display.slice(previous, end);
    previous = end;
    return text;
  });
}

export function createReader({ document, entries, onFeedback, onStateChange, onExplanationOpen, preferences = {}, maxMarks = 750, maxNodes = 15000 }) {
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
  let prefs = { ...DEFAULT_PREFERENCES, ...validatePreferences(preferences) };
  const view = document.defaultView;
  const matcher = createMatcher(entries);
  const marks = new Map();
  const groups = new Set();
  const restoredHints = new WeakMap();
  const ignored = new Set();
  const pendingRoots = new Set();
  let enabled = false;
  let mode = prefs.mode;
  let printing = false;
  let truncated = false;
  let style;
  let timer;
  let nodesRead = 0;
  let elementsRead = 0;
  let processing = false;
  let visibilityCache = new WeakMap();
  const panel = createPanel({ document, onFeedback, preferences: prefs,
    onRestore: (element) => { const group = marks.get(element)?.group; restoreOccurrence(element); return group?.primary; },
    onIgnore: (entry) => ignoreTerm(entry.id),
  });

  function inDocument(mark) { return mark.ownerDocument === document && mark.isConnected; }
  function unchanged(mark, record = marks.get(mark)) {
    return Boolean(record && mark.childNodes.length === 1 && mark.firstChild === record.node && record.node.data === record.displayText);
  }
  function usableMark(mark, record = marks.get(mark)) {
    return Boolean(record && inDocument(mark) && unchanged(mark, record)
      && Object.entries(record.attributes).every(([name, value]) => mark.getAttribute(name) === value)
      && !mark.matches('[hidden],[inert]'));
  }
  function usableGroup(group) { return groups.has(group) && group.pieces.every((piece) => usableMark(piece.mark, piece)); }
  function getState() {
    let count = 0;
    let replacedCount = 0;
    for (const group of groups) if (usableGroup(group)) { count++; if (group.presentation.replaced) replacedCount++; }
    return { enabled, mode, count, replacedCount, annotatedCount: count - replacedCount, truncated };
  }
  function notify() { onStateChange?.(getState()); }
  function observe() {
    if (enabled && document.documentElement) observer.observe(document.documentElement, {
      childList: true, subtree: true, characterData: true, attributes: true,
      attributeFilter: ['class', 'style', 'hidden', 'aria-hidden', 'lang', 'contenteditable', 'inert', 'role', 'open', 'tabindex', 'onclick', 'itemprop', 'data-ope-term', 'data-ope-owned'],
    });
  }
  function suspended(operation) {
    // Disconnect suppresses our own mutations, but must not discard site edits
    // already queued earlier in this JavaScript turn (for example before a
    // language/highlight update). Reconcile those records after our operation.
    const external = processing ? [] : observer.takeRecords();
    processing = true;
    observer.disconnect();
    try { return operation(); }
    finally {
      processing = false;
      observe();
      if (external.length) view.queueMicrotask(() => processMutations(external));
    }
  }
  function computed(element) {
    if (!visibilityCache.has(element)) visibilityCache.set(element, view.getComputedStyle(element));
    return visibilityCache.get(element);
  }
  function transparent(element) {
    return TRANSPARENT.has(element.tagName) && !element.matches('[lang],[role],[tabindex],[onclick]')
      && ['', 'inline', 'contents'].includes(computed(element).display);
  }
  function scanRoot(node) {
    let root = node?.nodeType === 3 ? node.parentElement : node;
    if (root === document.documentElement) return document.body;
    while (root?.parentElement && (transparent(root) || marks.has(root))) root = root.parentElement;
    return root;
  }
  function visible(element) {
    const own = computed(element);
    if (own.visibility === 'hidden' || own.visibility === 'collapse') return false;
    for (let parent = element; parent; parent = parent.parentElement) if (computed(parent).display === 'none') return false;
    return true;
  }
  function eligible(node) {
    const parent = node.parentElement;
    if (!parent || !node.data || parent.closest(SKIP) || parent.closest('details:not([open])')) return false;
    const lang = parent.closest('[lang]')?.getAttribute('lang');
    return !(lang && !/^en(?:-|$)/i.test(lang)) && visible(parent);
  }
  function restoreMark(mark) {
    const record = marks.get(mark);
    if (!record) return null;
    const parent = mark.parentNode;
    const retained = mark.contains(record.node) && record.node.data === record.displayText;
    if (retained) {
      record.node.data = record.originalText;
      if (record.group.restored) restoredHints.set(record.node, { entryId: record.group.entry.id, originalText: record.group.originalText });
    }
    const children = [...mark.childNodes];
    marks.delete(mark);
    if (parent) mark.replaceWith(...children);
    else {
      for (const [name, value] of Object.entries(record.attributes)) if (mark.getAttribute(name) === value) mark.removeAttribute(name);
    }
    return parent;
  }
  function restoreGroup(group) {
    const parents = new Set();
    for (const piece of group.pieces) { const parent = restoreMark(piece.mark); if (parent) parents.add(parent); }
    groups.delete(group);
    return parents;
  }
  function restoreAll({ normalize = false } = {}) {
    panel.close({ restoreFocus: false });
    const parents = new Set();
    for (const group of [...groups]) for (const parent of restoreGroup(group)) parents.add(parent);
    if (normalize) for (const parent of parents) parent.normalize();
  }

  function processMutations(mutations) {
    if (!enabled || processing) return;
    const invalidated = new Set();
    for (const mutation of mutations) {
      const element = mutation.target.nodeType === 1 ? mutation.target : mutation.target.parentElement;
      const changedMark = element?.closest('[data-ope-term]') || (marks.has(element) ? element : null);
      if (marks.has(changedMark)) { invalidated.add(marks.get(changedMark).group); continue; }
      if (element?.closest('[data-ope-owned]')) continue;
      if (mutation.type === 'characterData' || mutation.type === 'attributes') pendingRoots.add(scanRoot(mutation.target));
      else {
        const changed = [...mutation.addedNodes, ...mutation.removedNodes];
        if (changed.some((node) => node.nodeType === 3 || marks.has(node) || (node.nodeType === 1 && node.querySelector?.('[data-ope-term]')))) pendingRoots.add(scanRoot(mutation.target));
        else for (const node of mutation.addedNodes) if (!(node.nodeType === 1 && node.hasAttribute('data-ope-owned'))) pendingRoots.add(scanRoot(node));
      }
    }
    let removed = false;
    for (const group of groups) if (group.pieces.some((piece) => !inDocument(piece.mark))) { invalidated.add(group); removed = true; }
    if (invalidated.size) suspended(() => {
      panel.close({ restoreFocus: false });
      for (const group of invalidated) for (const parent of restoreGroup(group)) if (parent.isConnected) pendingRoots.add(scanRoot(parent));
    });
    for (const root of [...pendingRoots]) if (!root?.isConnected) pendingRoots.delete(root);
    if (!pendingRoots.size) { if (removed) notify(); return; }
    if (!timer) timer = view.setTimeout(flush, 80);
  }
  const observer = new view.MutationObserver(processMutations);

  function markMetadata(piece) {
    const { group, mark } = piece;
    const presentation = group.presentation;
    const zh = prefs.language === 'zh-CN';
    const ariaLabel = presentation.replaced
      ? (zh ? `${presentation.displayText}。原词：${group.originalText}。打开解释。` : `${presentation.displayText}. Original words: ${group.originalText}. Open explanation.`)
      : (zh ? `${group.originalText}。打开解释。` : `${group.originalText}: ${group.entry.short}. Open explanation.`);
    const title = presentation.replaced ? `${group.originalText} → ${presentation.displayText}` : `${group.originalText}. ${presentation.reason}`;
    for (const [name, value] of Object.entries(piece.attributes || {})) if (mark.getAttribute(name) === value) mark.removeAttribute(name);
    piece.attributes = { 'data-ope-owned': 'term', 'data-ope-term': group.entry.id, 'data-ope-highlight': prefs.highlight, title };
    if (mark === group.primary) Object.assign(piece.attributes, { tabindex: '0', role: 'button', 'aria-haspopup': 'dialog', 'aria-label': ariaLabel });
    else Object.assign(piece.attributes, { 'aria-hidden': 'true' });
    for (const [name, value] of Object.entries(piece.attributes)) mark.setAttribute(name, value);
  }
  function renderGroup(group, presentation) {
    group.presentation = presentation;
    const chunks = splitPresentation(group.originalText, presentation.displayText, group.pieces);
    group.primary = group.pieces[chunks.findIndex((chunk) => chunk.trim())]?.mark || group.pieces[0].mark;
    for (const [index, piece] of group.pieces.entries()) {
      piece.displayText = chunks[index];
      piece.node.data = chunks[index];
      markMetadata(piece);
    }
  }
  function restoreOccurrence(element) {
    const group = marks.get(element)?.group;
    if (!group || !usableGroup(group)) return getState();
    suspended(() => {
      group.restored = true;
      renderGroup(group, { ...group.presentation, displayText: group.originalText, replaced: false, reason: 'You restored this occurrence to its original wording.' });
    });
    notify();
    return getState();
  }
  function ignoreTerm(entryId) {
    if (!ids.has(entryId)) throw new TypeError('Choose a glossary term to ignore on this page.');
    ignored.add(entryId);
    suspended(() => {
      panel.close({ restoreFocus: false });
      for (const group of [...groups]) if (group.entry.id === entryId) restoreGroup(group);
    });
    notify();
    return getState();
  }

  function adjacentPoint(textNode, direction) {
    // Do not invent a word boundary at an excluded inline link/control/comment.
    // Read at most the adjacent sibling's first/last character, without scanning
    // that region or crossing the nearest ordinary flow container.
    let current = textNode;
    const previous = direction === 'before';
    let steps = 0;
    const edge = (root) => {
      const stack = [{ node: root }];
      while (stack.length) {
        if (++steps > 32) return '_'; // Unknown boundary: conservatively skip.
        const frame = stack.pop();
        if (frame.child) {
          const next = previous ? frame.child.previousSibling : frame.child.nextSibling;
          if (next) stack.push({ child: next });
          stack.push({ node: frame.child });
          continue;
        }
        const node = frame.node;
        if (node.nodeType === 3 && node.data) {
          if (!previous) return String.fromCodePoint(node.data.codePointAt(0));
          const last = node.data.charCodeAt(node.data.length - 1);
          const beforeLast = node.data.charCodeAt(node.data.length - 2);
          const offset = last >= 0xdc00 && last <= 0xdfff && beforeLast >= 0xd800 && beforeLast <= 0xdbff ? node.data.length - 2 : node.data.length - 1;
          return String.fromCodePoint(node.data.codePointAt(offset));
        }
        if (node.nodeType === 1) {
          if (BREAK.has(node.tagName) || /^(?:block|flex|grid|table|list-item|flow-root)/u.test(computed(node).display)) return undefined;
          const child = previous ? node.lastChild : node.firstChild;
          if (child) stack.push({ child });
        }
      }
      return '';
    };
    while (current?.parentElement) {
      if (++steps > 32) return '_';
      let sibling = previous ? current.previousSibling : current.nextSibling;
      while (sibling) {
        const point = edge(sibling);
        if (point !== '') return point;
        sibling = previous ? sibling.previousSibling : sibling.nextSibling;
      }
      current = current.parentElement;
      if (!transparent(current)) return undefined;
    }
    return undefined;
  }

  function decorateRun(run) {
    const text = run.map((part) => part.node.data).join('');
    if (!text.trim()) return;
    if (text.length > 50000) { truncated = true; return; }
    const found = matcher.find(text);
    const beforeEdge = adjacentPoint(run[0].node, 'before');
    const afterEdge = adjacentPoint(run.at(-1).node, 'after');
    const edits = new Map();
    let total = 0;
    for (const part of run) { part.start = total; total += part.node.data.length; part.end = total; }
    for (const match of found) {
      if (ignored.has(match.entry.id)) continue;
      if ((match.start === 0 && beforeEdge && /[\p{L}\p{N}\p{M}_]/u.test(beforeEdge))
        || (match.end === text.length && afterEdge && /[\p{L}\p{N}\p{M}_]/u.test(afterEdge))) continue;
      if (groups.size >= maxMarks) { truncated = true; break; }
      const parts = run.filter((part) => part.start < match.end && part.end > match.start);
      // Extremely fragmented markup is deliberately left alone.
      if (!parts.length || parts.length > 24) continue;
      const restored = parts.some((part) => {
        const hint = restoredHints.get(part.node);
        return hint?.entryId === match.entry.id && hint.originalText === match.matchedText;
      });
      const context = { before: text.slice(0, match.start), after: text.slice(match.end), literal: parts.some((part) => part.node.parentElement.closest(LITERAL)) };
      let presentation = getInlinePresentation(match.entry, match.matchedText, printing ? 'annotate' : mode, context);
      if (restored) presentation = { ...presentation, displayText: match.matchedText, replaced: false, reason: 'You restored this occurrence to its original wording.' };
      const group = { entry: match.entry, originalText: match.matchedText, presentation, pieces: [], restored };
      for (const part of parts) {
        const start = Math.max(0, match.start - part.start);
        const end = Math.min(part.node.data.length, match.end - part.start);
        const mark = document.createElement('span');
        const node = document.createTextNode('');
        mark.append(node);
        const piece = { group, mark, node, start, end, originalText: part.node.data.slice(start, end) };
        group.pieces.push(piece);
        if (!edits.has(part.node)) edits.set(part.node, []);
        edits.get(part.node).push(piece);
        marks.set(mark, piece);
      }
      renderGroup(group, presentation);
      groups.add(group);
    }
    for (const [node, pieces] of edits) {
      const fragment = document.createDocumentFragment();
      const original = node.data;
      let offset = 0;
      for (const piece of pieces) {
        if (piece.start > offset) fragment.append(document.createTextNode(original.slice(offset, piece.start)));
        fragment.append(piece.mark);
        offset = piece.end;
      }
      if (offset < original.length) fragment.append(document.createTextNode(original.slice(offset)));
      node.replaceWith(fragment);
    }
  }
  function scan(root) {
    root = scanRoot(root);
    if (!root?.isConnected || root.nodeType !== 1 || root.closest(SKIP)) return;
    const stack = [{ node: root }];
    const runs = [];
    let run = [];
    let runLength = 0;
    let oversizedRun = false;
    const finish = () => { if (run.length && !oversizedRun) runs.push(run); run = []; runLength = 0; oversizedRun = false; };
    while (stack.length) {
      const frame = stack.pop();
      if (frame.end) { finish(); continue; }
      if (frame.child) {
        if (frame.child.nextSibling) stack.push({ child: frame.child.nextSibling });
        stack.push({ node: frame.child });
        continue;
      }
      const node = frame.node;
      if (node.nodeType === 3) {
        if (!node.data) continue;
        if (nodesRead >= maxNodes) { truncated = true; run = []; oversizedRun = true; break; }
        nodesRead++;
        if (eligible(node)) {
          runLength += node.data.length;
          if (runLength > 50000) { truncated = true; oversizedRun = true; run = []; }
          if (!oversizedRun) run.push({ node });
        } else finish();
        continue;
      }
      if (node.nodeType !== 1) { finish(); continue; }
      if (++elementsRead > maxNodes * 8 + 512) { truncated = true; run = []; oversizedRun = true; break; }
      if (node.closest(SKIP) || BREAK.has(node.tagName)) { finish(); continue; }
      const boundary = !transparent(node);
      if (boundary) { finish(); stack.push({ end: true }); }
      if (node.firstChild) stack.push({ child: node.firstChild });
    }
    finish();
    for (const [index, current] of runs.entries()) {
      if (groups.size >= maxMarks) { if (current.some((part) => part.node.data.trim()) || index + 1 < runs.length) truncated = true; break; }
      decorateRun(current);
    }
  }
  function beginScan() { nodesRead = 0; elementsRead = 0; visibilityCache = new WeakMap(); }
  function flush() {
    timer = undefined;
    if (!enabled) return;
    suspended(() => {
      beginScan();
      const candidates = new Set([...pendingRoots].map(scanRoot).filter((root) => root?.isConnected));
      const roots = [...candidates].filter((root) => {
        for (let parent = root.parentElement; parent; parent = parent.parentElement) if (candidates.has(parent)) return false;
        return true;
      });
      for (const root of roots) {
        for (const group of [...groups]) if (group.pieces.some((piece) => root.contains(piece.mark))) { panel.close({ restoreFocus: false }); restoreGroup(group); }
        scan(root);
      }
      pendingRoots.clear();
    });
    notify();
  }
  function openMark(mark) {
    const group = marks.get(mark)?.group;
    const pending = group && [...pendingRoots].some((root) => root?.nodeType === 1 && group.pieces.some((piece) => root.contains(piece.mark)));
    const readable = group && group.pieces.every((piece) => {
      const parent = piece.mark.parentElement;
      const lang = parent?.closest('[lang]')?.getAttribute('lang');
      return parent && !parent.closest(SKIP) && !(lang && !/^en(?:-|$)/i.test(lang));
    });
    if (!pending && group && readable && usableGroup(group)) {
      panel.show(group.entry, group.primary, group.presentation);
      onExplanationOpen?.(group.entry);
      return true;
    }
    return false;
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
    prefs = { ...prefs, mode };
    if (enabled) suspended(() => { cancelPending(); restoreAll(); truncated = false; beginScan(); scan(document.body); });
    panel.setPreferences(prefs);
    notify();
    return getState();
  }
  function setPreferences(update) {
    const next = { ...prefs, ...validatePreferences(update) };
    const changedMode = mode !== next.mode;
    prefs = next;
    if (changedMode) setMode(next.mode);
    else if (enabled) suspended(() => { for (const group of groups) if (usableGroup(group)) for (const piece of group.pieces) markMetadata(piece); });
    panel.setPreferences(prefs);
    return getState();
  }
  function enable(options = {}) {
    if (!options || typeof options !== 'object' || Array.isArray(options)) throw new TypeError('Reader options must specify a valid mode.');
    const nextMode = options.mode === undefined ? mode : assertReadingMode(options.mode);
    if (enabled) return setMode(nextMode);
    mode = nextMode;
    prefs = { ...prefs, mode };
    panel.setPreferences(prefs);
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
    view.addEventListener('beforeprint', beforePrint);
    view.addEventListener('afterprint', afterPrint);
    observe();
    notify();
    return getState();
  }
  function disable() {
    enabled = false;
    printing = false;
    observer.disconnect();
    cancelPending();
    restoreAll({ normalize: true });
    document.removeEventListener('click', click);
    document.removeEventListener('keydown', keydown);
    view.removeEventListener('beforeprint', beforePrint);
    view.removeEventListener('afterprint', afterPrint);
    style?.remove();
    style = undefined;
    truncated = false;
    notify();
    return getState();
  }
  function beforePrint() {
    if (!enabled || printing) return;
    printing = true;
    suspended(() => { cancelPending(); restoreAll(); beginScan(); scan(document.body); });
    notify();
  }
  function afterPrint() {
    if (!enabled || !printing) return;
    printing = false;
    suspended(() => { cancelPending(); restoreAll(); beginScan(); scan(document.body); });
    notify();
  }
  function openFirst() {
    const first = [...groups].find(usableGroup)?.primary;
    if (first) { first.scrollIntoView?.({ block: 'center', behavior: 'instant' }); return openMark(first); }
    return false;
  }
  function getOriginalText() {
    // A read-only text-content view. Still-owned segments use private originals;
    // replaced/edited site nodes use the site's current text instead.
    const ownedNodes = new Map([...marks.values()].map((piece) => [piece.node, piece]));
    const walker = document.createTreeWalker(document.body || document.documentElement, view.NodeFilter.SHOW_TEXT);
    let text = '';
    let node;
    while ((node = walker.nextNode())) {
      const owned = node.parentElement?.closest('[data-ope-owned]');
      if (owned && !marks.has(owned)) continue;
      const piece = ownedNodes.get(node);
      text += piece && piece.mark.contains(node) && node.data === piece.displayText ? piece.originalText : node.data;
    }
    return text;
  }
  return { enable, disable, setMode, setPreferences, getState, openFirst, restoreOccurrence, ignoreTerm, getOriginalText, destroy() { disable(); panel.destroy(); } };
}
