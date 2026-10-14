export const INLINE_REVIEW_METHOD = 'editorial source comparison; no independent clinical or user-comprehension review';
export const DOMAIN_INLINE_REVIEW_METHOD = 'editorial source comparison; no independent domain-expert or user-comprehension review';
export const READING_MODES = Object.freeze(['plain', 'annotate']);

export function assertReadingMode(mode) {
  if (!READING_MODES.includes(mode)) throw new TypeError('Choose plain or annotate as the reading mode.');
  return mode;
}

export function normalizeInlineText(text) {
  return typeof text === 'string' ? text.normalize('NFKC').toLocaleLowerCase('en-US').replace(/\s+/gu, ' ').trim() : '';
}

function safeText(value, limit) {
  return typeof value === 'string' && value.length <= limit * 2 && value === value.trim() && Boolean(value)
    && Array.from(value).length <= limit && !/[\p{Cc}\p{Cf}<>]/u.test(value);
}

function reviewed(inline) {
  const review = inline?.review;
  if (review?.status !== 'source-checked' || ![INLINE_REVIEW_METHOD, DOMAIN_INLINE_REVIEW_METHOD].includes(review.method) || typeof review.date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/u.test(review.date)
    || Object.keys(review).some((key) => !['status', 'date', 'method'].includes(key))) return false;
  const date = new Date(`${review.date}T00:00:00.000Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === review.date;
}

function initialCapital(text) {
  return text.replace(/\p{L}/u, (letter) => letter.toUpperCase());
}

function replacementCase(original, replacement) {
  const normalized = original.trim().replace(/\s+/gu, ' ');
  const lower = normalized.toLowerCase();
  if (normalized === lower) return replacement;
  if (normalized === normalized.toUpperCase()) return replacement.toUpperCase();
  if (normalized === initialCapital(lower)) return initialCapital(replacement);
  return null;
}

/** Dedicated, reviewed phrases only. This never derives wording from `short`. */
export function getInlinePresentation(entry, originalText, mode = 'plain', context = {}) {
  assertReadingMode(mode);
  if (typeof originalText !== 'string') throw new TypeError('An original matched phrase is required.');
  const kept = (reason, note = '') => ({ originalText, displayText: originalText, replaced: false, reason, note });
  if (mode === 'annotate') return kept('Annotation mode keeps the original wording.');
  // Literal cues protect wording a writer is referring to. They do not infer
  // sentence meaning, and also work when a phrase spans transparent inline tags.
  const before = typeof context.before === 'string' ? context.before : '';
  const after = typeof context.after === 'string' ? context.after : '';
  const left = before.trimEnd().at(-1);
  const right = after.trimStart().at(0);
  const enclosed = [['“', '”'], ['‘', '’'], ['«', '»']].some(([open, close]) => {
    const closing = after.indexOf(close);
    const nextOpening = after.indexOf(open);
    return before.lastIndexOf(open) > before.lastIndexOf(close) && closing >= 0 && (nextOpening < 0 || closing < nextOpening);
  }) || (before.split('"').length % 2 === 0 && after.includes('"'));
  const quoted = (left === '"' && right === '"') || (left === '“' && right === '”')
    || (left === '‘' && right === '’') || (left === '«' && right === '»')
    || (left === "'" && right === "'" && !/\p{L}'$/u.test(before) && !/^'\p{L}/u.test(after));
  if (context.literal || quoted || enclosed) return kept('Quoted words or an explicit name are kept in their original form.');
  if (typeof context.before === 'string' && /\p{L}[-‐‑‒–—]$/u.test(context.before)
    || typeof context.after === 'string' && /^[-‐‑‒–—]\p{L}/u.test(context.after)) {
    return kept('This term is part of a joined compound, so the original wording is kept.');
  }
  if (/^[’'](?:s\b|(?=\s|[.,;:!?]|$))/iu.test(after)) return kept('A possessive form is kept because this exact wording has no reviewed replacement.');
  const inline = entry?.inline;
  if (!reviewed(inline) || !Array.isArray(inline.replacements) || !inline.replacements.length || inline.replacements.length > 64 || !safeText(inline.note, 500)
    || Object.keys(inline).some((key) => !['replacements', 'note', 'review'].includes(key))) {
    return kept('No source-checked plain phrase is available, so the original wording is kept.');
  }
  const allowed = new Set([entry.term, ...(entry.aliases || [])].map(normalizeInlineText));
  const pairs = new Map();
  for (const pair of inline.replacements) {
    if (!pair || !safeText(pair.from, 100) || !safeText(pair.to, 96) || Object.keys(pair).some((key) => !['from', 'to'].includes(key))) return kept('The plain phrase is not confirmed for this wording.');
    const from = normalizeInlineText(pair.from);
    const to = pair.to.trim().replace(/\s+/gu, ' ');
    if (!from || !to || !allowed.has(from) || from === normalizeInlineText(to) || pairs.has(from)) return kept('The plain phrase is not confirmed for this wording.');
    pairs.set(from, to);
  }
  const original = normalizeInlineText(originalText);
  const pair = pairs.get(original);
  if (!pair) {
    const alreadyPlain = [...pairs.values()].some((to) => normalizeInlineText(to) === original);
    return kept(alreadyPlain ? 'This wording is already plain and is kept as written.' : 'No approved plain phrase covers this exact wording, so the original is kept.', inline.note);
  }
  const displayText = replacementCase(originalText, pair);
  if (displayText === null) return kept('This capitalization is unusual, so the original wording is kept.', inline.note);
  return { originalText, displayText, replaced: true, reason: 'A dedicated source-checked plain phrase is shown.', note: inline.note };
}
