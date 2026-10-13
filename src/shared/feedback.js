/** Local feedback is deliberately an allowlist: no page or browser metadata. */
export const FEEDBACK_KINDS = Object.freeze(['unclear', 'inaccurate', 'suggestion']);
export const FEEDBACK_LIMIT = 100;
export const FEEDBACK_IMPORT_MAX_BYTES = 1024 * 1024;
export const FEEDBACK_IMPORT_MAX_RECORDS = 1000;
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

const FEEDBACK_FIELDS = Object.freeze(['id', 'entryId', 'term', 'kind', 'note', 'createdAt', 'lexiconVersion']);
const FIELD_LIMITS = Object.freeze({ id: 80, entryId: 80, term: 120, kind: 10, note: 2000, createdAt: 24, lexiconVersion: 40 });

/** Read the format exported by v0.1 and later. A bad file is rejected atomically. */
export function parseFeedbackImport(json) {
  if (typeof json !== 'string') throw new TypeError('Choose a JSON feedback export.');
  if (json.length > FEEDBACK_IMPORT_MAX_BYTES || new TextEncoder().encode(json).length > FEEDBACK_IMPORT_MAX_BYTES) {
    throw new RangeError('This file is too large. Choose a feedback export no larger than 1 MiB.');
  }
  let data;
  try { data = JSON.parse(json); }
  catch { throw new TypeError('This file is not valid JSON. Choose an OpenPlainEnglish feedback export.'); }
  if (!data || typeof data !== 'object' || Array.isArray(data)
      || data.schemaVersion !== 1 || !Array.isArray(data.feedback)
      || Object.keys(data).some((key) => !['schemaVersion', 'feedback'].includes(key))) {
    throw new TypeError('Unsupported backup format. Expected schemaVersion 1 and a feedback list.');
  }
  if (data.feedback.length > FEEDBACK_IMPORT_MAX_RECORDS) throw new RangeError('A backup can contain at most 1,000 drafts.');
  return data.feedback.map((item, index) => {
    const prefix = `Draft ${index + 1}`;
    if (!item || typeof item !== 'object' || Array.isArray(item)
        || Object.keys(item).length !== FEEDBACK_FIELDS.length
        || FEEDBACK_FIELDS.some((key) => !Object.hasOwn(item, key) || typeof item[key] !== 'string')) {
      throw new TypeError(`${prefix} has missing or unsupported fields. No drafts were imported.`);
    }
    for (const key of FEEDBACK_FIELDS) {
      if (Array.from(item[key]).length > FIELD_LIMITS[key]) throw new RangeError(`${prefix} has an overlong ${key} field. No drafts were imported.`);
    }
    let record;
    try { record = createFeedback(item); }
    catch { throw new TypeError(`${prefix} has an invalid ID, date, category, term or note. No drafts were imported.`); }
    if (item.entryId && !record.entryId) throw new TypeError(`${prefix} has an invalid glossary entry ID. No drafts were imported.`);
    // Existing exports already meet these rules. Reject silent truncation or hidden
    // control characters, while allowing equivalent ISO timestamp precision.
    if (FEEDBACK_FIELDS.some((key) => key !== 'createdAt' && record[key] !== item[key])) {
      throw new TypeError(`${prefix} contains unsupported text formatting. No drafts were imported.`);
    }
    return record;
  });
}

/** Existing identity wins. Newest dates survive; equal dates use ascending ID. */
export function mergeFeedbackRecords(existing, imported) {
  const byId = new Map();
  for (const item of Array.isArray(existing) ? existing : []) {
    try {
      const record = createFeedback(item);
      if (!byId.has(record.id)) byId.set(record.id, { record, origin: 'local' });
    } catch { /* Discard malformed local records, never propagate unknown fields. */ }
  }
  let duplicateCount = 0;
  for (const item of imported) {
    const record = createFeedback(item);
    if (byId.has(record.id)) duplicateCount++;
    else byId.set(record.id, { record, origin: 'import' });
  }
  const ordered = [...byId.values()].sort((a, b) => {
    if (a.record.createdAt !== b.record.createdAt) return a.record.createdAt > b.record.createdAt ? -1 : 1;
    return a.record.id < b.record.id ? -1 : a.record.id > b.record.id ? 1 : 0;
  });
  const kept = ordered.slice(0, FEEDBACK_LIMIT);
  const dropped = ordered.slice(FEEDBACK_LIMIT);
  return {
    feedback: kept.map((item) => item.record).reverse(),
    importedCount: kept.filter((item) => item.origin === 'import').length,
    duplicateCount,
    discardedCount: dropped.length,
    totalCount: kept.length,
    localDiscardedCount: dropped.filter((item) => item.origin === 'local').length,
    importDiscardedCount: dropped.filter((item) => item.origin === 'import').length,
  };
}
