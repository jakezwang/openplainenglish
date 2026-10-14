// Accessible DOM only. This module never requests permissions, fetches a frame,
// changes a sandbox, or hooks attachShadow to expose closed component internals.
export function composedParent(element) {
  return element?.parentElement || element?.getRootNode?.().host || null;
}

export function composedClosest(element, selector) {
  for (let current = element; current; current = composedParent(current)) if (current.matches?.(selector)) return current;
  return null;
}

export function createScanBudget({ view, maxMarks, maxNodes, notify }) {
  const pending = new Set();
  let timer;
  let depth = 0;
  const budget = {
    maxMarks, maxNodes, marked: 0, nodesRead: 0, elementsRead: 0,
    ignored: new Set(),
    get active() { return depth > 0; },
    batch(operation) {
      if (!depth) { budget.nodesRead = 0; budget.elementsRead = 0; }
      depth++;
      try { return operation(); }
      finally { depth--; }
    },
    schedule(operation) {
      pending.add(operation);
      if (!timer) timer = view.setTimeout(() => {
        timer = undefined;
        const operations = [...pending];
        pending.clear();
        budget.batch(() => { for (const operation of operations) operation(); });
        notify?.();
      }, 80);
    },
    cancel(operation) {
      pending.delete(operation);
      if (!pending.size && timer) { view.clearTimeout(timer); timer = undefined; }
    },
    clear() { pending.clear(); if (timer) view.clearTimeout(timer); timer = undefined; },
  };
  return budget;
}

const HOST_SKIP = 'script,style,noscript,form,label,textarea,input,select,option,button,summary,a,code,pre,kbd,samp,svg,math,canvas,video,audio,[contenteditable]:not([contenteditable="false" i]),[role="button"],[role="link"],[role="textbox"],[aria-hidden="true"],[hidden],[inert],[data-ope-owned]';

function eligibleHost(host) {
  if (!host.isConnected || composedClosest(host, HOST_SKIP) || composedClosest(host, 'details:not([open])')) return false;
  const lang = composedClosest(host, '[lang]')?.getAttribute('lang');
  if (lang && !/^en(?:-|$)/i.test(lang)) return false;
  for (let element = host; element; element = composedParent(element)) {
    const style = element.ownerDocument.defaultView?.getComputedStyle(element);
    if (!style || style.display === 'none' || style.visibility === 'hidden' || style.visibility === 'collapse') return false;
  }
  return true;
}

export function accessibleFrameDocument(frame) {
  try {
    if (frame.hasAttribute('sandbox') && !frame.sandbox?.contains?.('allow-same-origin')
      && !frame.getAttribute('sandbox').split(/\s+/u).includes('allow-same-origin')) return null;
    const document = frame.contentDocument;
    if (!document?.defaultView || !document.documentElement || !document.body || !['text/html', 'application/xhtml+xml'].includes(document.contentType)) return null;
    // Browsers enforce origin access. This additional check also rejects foreign
    // documents in DOM test environments that do not implement that boundary.
    const url = new URL(document.URL);
    let parentDocument = frame.ownerDocument;
    let parentOrigin = parentDocument.defaultView.location.origin;
    // about:blank/srcdoc inherits its embedding document's security origin even
    // though location.origin serializes as null. Resolve that inherited context
    // for nested accessible frames, with a fixed-depth bound.
    for (let depth = 0; depth < 32 && parentOrigin === 'null' && new URL(parentDocument.URL).protocol === 'about:'; depth++) {
      const ownerFrame = parentDocument.defaultView.frameElement;
      if (!ownerFrame) break;
      parentDocument = ownerFrame.ownerDocument;
      parentOrigin = parentDocument.defaultView.location.origin;
    }
    if (!['about:', 'blob:'].includes(url.protocol) && url.origin !== parentOrigin) return null;
    if (url.protocol === 'blob:' && url.origin !== parentOrigin) return null;
    return document;
  } catch { return null; }
}

export function createSurfaceRegistry({ document, budget, getPreferences, onChange }) {
  let enabled = false;
  let truncated = false;
  const observed = new Map();
  const frames = new Map();
  let descriptors = [];
  function affected(mutations) {
    for (const mutation of mutations) {
      const element = mutation.target.nodeType === 1 ? mutation.target : mutation.target.parentElement;
      if (composedClosest(element, '[data-ope-owned]')) continue;
      if (mutation.type === 'attributes') return true;
      if ([...mutation.addedNodes, ...mutation.removedNodes].some((node) => node.nodeType === 1 && !node.hasAttribute('data-ope-owned'))) return true;
    }
    return false;
  }
  function schedule() { if (enabled) budget.schedule(refresh); }
  function refresh() {
    if (!enabled) return;
    const prefs = getPreferences();
    const next = [];
    const foundFrames = new Set();
    const seen = new Set([document]);
    const queue = [{ root: document, document, type: 'document', host: null, parent: null }];
    let stopped = false;
    truncated = false;
    if (prefs.includeFrames || prefs.includeShadowRoots) for (let index = 0; index < queue.length && !stopped; index++) {
      const surface = queue[index];
      const root = surface.root.nodeType === 9 ? surface.document.body : surface.root;
      if (!root) continue;
      const stack = [{ node: root }];
      while (stack.length) {
        if (++budget.elementsRead > budget.maxNodes * 8 + 512) { truncated = true; stopped = true; break; }
        const frame = stack.pop();
        if (frame.child) {
          if (frame.child.nextSibling) stack.push({ child: frame.child.nextSibling });
          stack.push({ node: frame.child });
          continue;
        }
        const element = frame.node;
        if (element.nodeType === 11) { if (element.firstChild) stack.push({ child: element.firstChild }); continue; }
        if (element.nodeType !== 1 || element.matches(HOST_SKIP)) continue;
        const add = (descriptor) => {
          if (!descriptor || seen.has(descriptor.root)) return;
          if (next.length >= 32) { truncated = true; return; }
          seen.add(descriptor.root);
          next.push(descriptor);
          queue.push(descriptor);
        };
        if (prefs.includeFrames && element.tagName === 'IFRAME' && eligibleHost(element)) {
          foundFrames.add(element);
          const child = accessibleFrameDocument(element);
          if (child) add({ root: child, document: child, host: element, type: 'frame', parent: surface.root });
        }
        if (prefs.includeShadowRoots && element.shadowRoot?.mode === 'open' && eligibleHost(element)) {
          add({ root: element.shadowRoot, document: element.ownerDocument, host: element, type: 'shadow', parent: surface.root });
        }
        if (element.firstChild) stack.push({ child: element.firstChild });
      }
    }
    descriptors = next;
    const targets = new Set(prefs.includeFrames || prefs.includeShadowRoots ? [document, ...next.map((surface) => surface.root)] : []);
    for (const [root, observer] of observed) if (!targets.has(root)) { observer.disconnect(); observed.delete(root); }
    for (const root of targets) if (!observed.has(root)) {
      const owner = root.nodeType === 9 ? root : root.ownerDocument;
      const observer = new owner.defaultView.MutationObserver((mutations) => { if (affected(mutations)) schedule(); });
      observer.observe(root.nodeType === 9 ? root.documentElement : root, {
        subtree: true, childList: true, attributes: true,
        attributeFilter: ['class', 'style', 'hidden', 'aria-hidden', 'lang', 'contenteditable', 'inert', 'role', 'open', 'sandbox', 'src', 'srcdoc'],
      });
      observed.set(root, observer);
    }
    for (const [frame, listener] of frames) if (!foundFrames.has(frame)) { frame.removeEventListener('load', listener); frames.delete(frame); }
    for (const frame of foundFrames) if (!frames.has(frame)) { frame.addEventListener('load', schedule); frames.set(frame, schedule); }
    onChange(next);
  }
  function start() { enabled = true; refresh(); }
  function stop() {
    enabled = false;
    budget.cancel(refresh);
    for (const observer of observed.values()) observer.disconnect();
    observed.clear();
    for (const [frame, listener] of frames) frame.removeEventListener('load', listener);
    frames.clear();
    descriptors = [];
    truncated = false;
  }
  return { start, stop, refresh, getDescriptors: () => descriptors, isTruncated: () => truncated };
}
