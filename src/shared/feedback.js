/** Local feedback is deliberately an allowlist: no page or browser metadata. */
export const FEEDBACK_KINDS = Object.freeze(['unclear', 'inaccurate', 'suggestion']);
export const FEEDBACK_LIMIT = 100;
const ISSUE_BASE = 'https://github.com/jakezwang/openplainenglish/issues/new';
const UNSAFE_CONTROLS = /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f-\u009f\u200b-\u200f\u202a-\u202e\u2066-\u2069\ufeff]/gu;

function text(value, length, multiline = false) {
  if (typeof value !== 'string') return '';
  let clean = value.normalize('NFC').replace(/\r\n?/gu, '\n').replace(UNSAFE_CONTROLS, '');
  if (!multiline) clean = clean.replace(/\s+/gu, ' ');
  return Array.from(clean.trim()).slice(0, length).join('');
}

function identifier(value) {
  const clean = text(value, 80);
  return /^[a-z\d][a-z\d._:-]*$/iu.test(clean) ? clean : '';
}

function timestamp(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z$/u.test(value)) return '';
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return '';
  const normalized = date.toISOString();
  return normalized.slice(0, 19) === value.slice(0, 19) ? normalized : '';
}

export function sanitizeFeedback(input) {
  const item = input && typeof input === 'object' && !Array.isArray(input) ? input : {};
  return {
    id: identifier(item.id),
    entryId: identifier(item.entryId),
    term: text(item.term, 120),
    kind: FEEDBACK_KINDS.includes(item.kind) ? item.kind : 'unclear',
    note: text(item.note, 2000, true),
    createdAt: timestamp(item.createdAt),
    lexiconVersion: text(item.lexiconVersion, 40),
  };
}

/** Callers supply identity and time; this helper is deterministic and has no I/O. */
export function createFeedback(input, metadata = {}) {
  const feedback = sanitizeFeedback({ ...input, ...metadata });
  if (input?.kind !== undefined && !FEEDBACK_KINDS.includes(input.kind)) {
    throw new TypeError('Choose unclear, inaccurate, or suggestion as the feedback kind.');
  }
  if (!feedback.id || !feedback.createdAt || !feedback.term || !feedback.note) {
    throw new TypeError('Feedback needs an ID, a valid date, a term, and a note.');
  }
  return feedback;
}

export function createFeedbackIssueBody(input) {
  const item = sanitizeFeedback(input);
  return [
    '## Explanation feedback',
    `Term: ${item.term}`,
    `Entry ID: ${item.entryId || 'New term'}`,
    `Kind: ${item.kind}`,
    `Lexicon version: ${item.lexiconVersion || 'Unknown'}`,
    '',
    '## My note',
    item.note,
    '',
    'Submitted after review in OpenPlainEnglish. No page address or page text is collected automatically.',
  ].join('\n');
}

export function createFeedbackIssueUrl(input) {
  const item = sanitizeFeedback(input);
  const url = new URL(ISSUE_BASE);
  url.searchParams.set('title', `[${item.kind}] ${item.term || 'Explanation feedback'}`);
  url.searchParams.set('body', createFeedbackIssueBody(item));
  return url.href;
}
