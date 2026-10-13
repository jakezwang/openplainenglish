import {
  createFeedback,
  sanitizeFeedback,
  createFeedbackIssueBody,
  createFeedbackIssueUrl,
  FEEDBACK_KINDS,
  FEEDBACK_LIMIT,
  FEEDBACK_IMPORT_MAX_BYTES,
  parseFeedbackImport,
  mergeFeedbackRecords,
} from '../shared/feedback.js';

const $ = (id) => document.getElementById(id);
const kindLabels = {
  unclear: 'Hard to understand',
  inaccurate: 'May be inaccurate',
  suggestion: 'Suggestion or new term',
};
let lexicon = { version: '', entries: [] };
let drafts = [];
let pendingDelete = null;
let activeEntryId = '';
let pendingImport = null;
let importBusy = false;

function node(tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}

function error(message) {
  $('page-error').textContent = message;
  $('page-error').hidden = false;
  $('page-error').setAttribute('tabindex', '-1');
  $('page-error').focus();
}

function feedbackLink(entry, label = 'Could this be clearer?') {
  const link = node('a', 'entry-feedback', label);
  link.href = `#feedback?entry=${encodeURIComponent(entry.id)}&kind=unclear`;
  link.setAttribute('aria-label', `${label} Give feedback on ${entry.term}`);
  return link;
}

function sourceLink(source) {
  try {
    const url = new URL(source.url);
    if (!['https:', 'http:'].includes(url.protocol)) return null;
    const link = node('a', '', `${source.label} ↗`);
    link.href = url.href;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    return link;
  } catch {
    return null;
  }
}

function entryCard(entry) {
  const article = node('article', 'entry');
  const header = node('div', 'entry-header');
  header.append(node('h2', '', entry.term), node('p', 'entry-short', entry.short));
  const details = node('details');
  const summary = node('summary', '', 'Meaning, context & source');
  summary.setAttribute('aria-label', `Meaning, context and source for ${entry.term}`);
  const body = node('div', 'entry-details');
  body.append(node('p', '', entry.explanation));
  if (entry.context) body.append(node('p', 'entry-context', entry.context));
  if (entry.aliases?.length) body.append(node('p', 'review-status', `Also written as: ${entry.aliases.join(', ')}`));
  const sources = node('ul', 'entry-sources');
  for (const source of entry.sources || []) {
    const link = sourceLink(source);
    if (link) {
      const item = node('li');
      item.append(link);
      sources.append(item);
    }
  }
  body.append(sources);
  const checked = entry.review?.status === 'source-checked';
  body.append(node('p', 'review-status', checked
    ? `Source-checked${entry.review.date ? ` · ${entry.review.date}` : ''}. Not independently clinically reviewed or comprehension tested.`
    : 'Review status not confirmed.'));
  body.append(feedbackLink(entry));
  details.append(summary, body);
  article.append(header, details);
  return article;
}

function renderGlossary() {
  const query = $('search').value.trim().toLocaleLowerCase();
  const matching = lexicon.entries.filter((entry) =>
    [entry.term, entry.short, ...(entry.aliases || [])].some((value) => value.toLocaleLowerCase().includes(query)));
  const fragment = document.createDocumentFragment();
  for (const entry of matching) fragment.append(entryCard(entry));
  $('glossary-list').replaceChildren(fragment);
  $('result-count').textContent = query
    ? `${matching.length} ${matching.length === 1 ? 'match' : 'matches'} in ${lexicon.entries.length} health terms`
    : `${lexicon.entries.length} health terms, ready to explore`;
  $('empty-glossary').hidden = matching.length > 0;
}

function route({ focus = false } = {}) {
  const [section, query = ''] = location.hash.slice(1).split('?');
  const feedback = section === 'feedback';
  $('glossary-section').hidden = feedback;
  $('feedback-section').hidden = !feedback;
  $('nav-glossary').removeAttribute('aria-current');
  $('nav-feedback').removeAttribute('aria-current');
  $(feedback ? 'nav-feedback' : 'nav-glossary').setAttribute('aria-current', 'page');
  document.title = `${feedback ? 'Your feedback' : 'Glossary'} · OpenPlainEnglish`;
  const params = new URLSearchParams(query);
  if (feedback && params.has('entry')) {
    const entry = lexicon.entries.find((item) => item.id === params.get('entry'));
    if (entry) {
      activeEntryId = entry.id;
      $('feedback-term').value = entry.term;
    }
  }
  if (feedback && FEEDBACK_KINDS.includes(params.get('kind'))) $('feedback-kind').value = params.get('kind');
  if (focus) {
    if (feedback && params.has('entry')) $('feedback-note').focus();
    else $('main').focus();
  }
}

async function readDrafts() {
  const data = await chrome.storage.local.get('opeFeedback');
  const stored = Array.isArray(data.opeFeedback) ? data.opeFeedback : [];
  return stored.slice(-FEEDBACK_LIMIT).map(sanitizeFeedback).filter((item) => item.id && item.createdAt);
}

async function refreshDrafts() {
  drafts = await readDrafts();
  renderDrafts();
}

function reviewDraft(draft) {
  $('share-preview').value = createFeedbackIssueBody(draft);
  $('open-issue').href = createFeedbackIssueUrl(draft);
  $('share-dialog').showModal();
}

function confirmDelete(id = null) {
  pendingDelete = id ? { id } : { all: true };
  $('delete-title').textContent = id ? 'Delete this draft?' : 'Delete all local drafts?';
  $('delete-description').textContent = id
    ? 'This removes the draft from this device. This cannot be undone.'
    : 'This removes all feedback drafts from this device. Export a copy first if you want to keep them. This cannot be undone.';
  $('delete-dialog').returnValue = '';
  $('delete-dialog').showModal();
}

function draftCard(draft) {
  const article = node('article', 'draft');
  const heading = node('div', 'draft-heading');
  const date = new Date(draft.createdAt);
  const time = node('time', 'draft-date', date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }));
  time.dateTime = draft.createdAt;
  heading.append(node('h3', '', draft.term), time);
  const actions = node('div', 'draft-actions');
  const share = node('button', 'text-button', 'Review & share on GitHub ↗');
  share.type = 'button';
  share.setAttribute('aria-label', `Review and share feedback on ${draft.term}`);
  share.addEventListener('click', () => reviewDraft(draft));
  const remove = node('button', 'text-button danger', 'Delete');
  remove.type = 'button';
  remove.setAttribute('aria-label', `Delete feedback on ${draft.term}`);
  remove.addEventListener('click', () => confirmDelete(draft.id));
  actions.append(share, remove);
  article.append(heading, node('p', 'draft-kind', kindLabels[draft.kind]), node('p', 'draft-note', draft.note), actions);
  return article;
}

function renderDrafts() {
  $('draft-count').textContent = String(drafts.length);
  $('empty-feedback').hidden = drafts.length > 0;
  $('export-feedback').disabled = drafts.length === 0;
  $('delete-all').disabled = drafts.length === 0;
  $('feedback-list').replaceChildren(...[...drafts].reverse().map(draftCard));
}

$('feedback-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  $('save-feedback').disabled = true;
  $('page-error').hidden = true;
  try {
    const term = $('feedback-term').value.trim();
    const entry = lexicon.entries.find((item) => item.term.toLocaleLowerCase() === term.toLocaleLowerCase());
    const knownEntry = lexicon.entries.find((item) => item.id === activeEntryId && item.term === term);
    const newTerm = !entry && !knownEntry;
    if (newTerm) $('feedback-kind').value = 'suggestion';
    const feedback = createFeedback({
      term,
      entryId: entry?.id || knownEntry?.id || '',
      kind: $('feedback-kind').value,
      note: $('feedback-note').value,
      lexiconVersion: lexicon.version,
    }, { id: crypto.randomUUID(), createdAt: new Date().toISOString() });
    const result = await chrome.runtime.sendMessage({ type: 'OPE_SAVE_FEEDBACK', feedback });
    if (!result?.ok) throw new Error(result?.error || 'The draft could not be saved.');
    const wasFull = drafts.length >= FEEDBACK_LIMIT;
    $('feedback-note').value = '';
    await refreshDrafts();
    $('feedback-status').textContent = wasFull
      ? 'Draft saved on this device. Only the most recent 100 drafts are kept.'
      : newTerm
        ? 'New-term suggestion saved on this device. Review it below whenever you’re ready to share.'
        : 'Draft saved on this device. Review it below whenever you’re ready to share.';
  } catch (failure) {
    error(failure.message || 'The draft could not be saved. Your note is still here.');
  } finally {
    $('save-feedback').disabled = false;
  }
});

$('delete-dialog').addEventListener('close', async () => {
  const deletion = pendingDelete;
  pendingDelete = null;
  if ($('delete-dialog').returnValue !== 'confirm' || !deletion) return;
  try {
    const result = await chrome.runtime.sendMessage({ type: 'OPE_DELETE_FEEDBACK', id: deletion.all ? null : deletion.id });
    if (!result?.ok) throw new Error(result?.error || 'Unable to delete the draft.');
    await refreshDrafts();
    $('feedback-status').textContent = deletion.all ? 'All local drafts deleted.' : 'Local draft deleted.';
    $('feedback-status').setAttribute('tabindex', '-1');
    $('feedback-status').focus();
  } catch {
    error('Unable to delete the draft. Please try again.');
  }
});

$('export-feedback').addEventListener('click', async () => {
  try {
    const items = await readDrafts();
    const blob = new Blob([JSON.stringify({ schemaVersion: 1, feedback: items }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = node('a');
    link.href = url;
    link.download = `openplainenglish-feedback-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    $('feedback-status').textContent = 'Export prepared. Your local drafts are still saved.';
  } catch {
    error('Unable to export drafts. Please try again.');
  }
});

function previewImport(records, name) {
  const preview = mergeFeedbackRecords(drafts, records);
  $('import-file-name').textContent = name;
  $('import-file-count').textContent = String(records.length);
  $('import-new-count').textContent = String(preview.importedCount);
  $('import-duplicate-count').textContent = String(preview.duplicateCount);
  $('import-total-count').textContent = String(preview.totalCount);
  $('import-overflow').hidden = preview.discardedCount === 0;
  $('import-overflow').textContent = `The 100-draft limit leaves out ${preview.localDiscardedCount} existing drafts and ${preview.importDiscardedCount} drafts from this file. Export your current drafts first if you want to keep them all.`;
  const fragment = document.createDocumentFragment();
  for (const item of records) {
    const record = node('article', 'import-record');
    record.append(node('h3', '', item.term), node('p', 'review-status', `${kindLabels[item.kind]} · ${item.createdAt.slice(0, 10)}`), node('p', 'draft-note', item.note));
    fragment.append(record);
  }
  $('import-records').replaceChildren(fragment);
}

$('import-feedback').addEventListener('click', () => $('import-file').click());
$('import-file').addEventListener('change', async () => {
  const file = $('import-file').files?.[0];
  if (!file) return;
  $('import-feedback').disabled = true;
  $('page-error').hidden = true;
  $('import-status').textContent = 'Reading your backup on this device…';
  pendingImport = null;
  try {
    if (file.size > FEEDBACK_IMPORT_MAX_BYTES) throw new RangeError('This file is too large. Choose a feedback export no larger than 1 MiB.');
    const json = await file.text();
    const records = parseFeedbackImport(json);
    if (!records.length) throw new Error('This backup contains no drafts to restore.');
    await refreshDrafts();
    pendingImport = { json };
    previewImport(records, file.name);
    $('import-error').hidden = true;
    $('import-dialog').showModal();
    $('import-status').textContent = 'Backup ready for review. Your drafts have not changed.';
  } catch (failure) {
    $('import-status').textContent = '';
    error(failure.message || 'Unable to read this backup. Your drafts have not changed.');
  } finally {
    $('import-feedback').disabled = false;
    $('import-file').value = '';
  }
});

$('cancel-import').addEventListener('click', () => $('import-dialog').close());
$('import-dialog').addEventListener('cancel', (event) => { if (importBusy) event.preventDefault(); });
$('import-dialog').addEventListener('close', () => {
  if (!importBusy) pendingImport = null;
  $('import-feedback').focus();
});
$('confirm-import').addEventListener('click', async () => {
  if (!pendingImport || importBusy) return;
  importBusy = true;
  $('confirm-import').disabled = true;
  $('cancel-import').disabled = true;
  $('confirm-import').textContent = 'Restoring…';
  $('import-error').hidden = true;
  try {
    const result = await chrome.runtime.sendMessage({ type: 'OPE_IMPORT_FEEDBACK', json: pendingImport.json });
    if (!result?.ok) throw new Error(result?.error || 'The backup could not be restored.');
    await refreshDrafts();
    pendingImport = null;
    $('import-dialog').close();
    $('import-status').textContent = `Restored ${result.importedCount} drafts. Skipped ${result.duplicateCount} duplicates; ${result.discardedCount} older drafts left out by the 100-draft limit. ${result.totalCount} drafts are now stored on this device.`;
    $('import-status').setAttribute('tabindex', '-1');
    $('import-status').focus();
  } catch (failure) {
    $('import-error').textContent = failure.message || 'Unable to restore the backup. Please try again.';
    $('import-error').hidden = false;
    $('import-error').setAttribute('tabindex', '-1');
    $('import-error').focus();
  } finally {
    importBusy = false;
    $('confirm-import').disabled = false;
    $('cancel-import').disabled = false;
    $('confirm-import').textContent = 'Merge local drafts';
  }
});

$('delete-all').addEventListener('click', () => confirmDelete());
$('cancel-share').addEventListener('click', () => $('share-dialog').close());
$('open-issue').addEventListener('click', () => $('share-dialog').close());
$('search').addEventListener('input', renderGlossary);
window.addEventListener('hashchange', () => route({ focus: true }));
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'local' && changes.opeFeedback) refreshDrafts().catch(() => error('Unable to refresh local drafts.'));
});

route();
async function initialize() {
  const results = await Promise.allSettled([
    chrome.runtime.sendMessage({ type: 'OPE_GET_LEXICON' }),
    refreshDrafts(),
  ]);
  const [dictionary, localFeedback] = results;
  if (dictionary.status === 'fulfilled' && dictionary.value?.ok && Array.isArray(dictionary.value.lexicon?.entries)) {
    lexicon = dictionary.value.lexicon;
    lexicon.entries = [...lexicon.entries].sort((a, b) => a.term.localeCompare(b.term));
    $('version').textContent = `Edition ${lexicon.version}`;
    const terms = document.createDocumentFragment();
    for (const entry of lexicon.entries) {
      const option = node('option');
      option.value = entry.term;
      terms.append(option);
    }
    $('term-list').append(terms);
    renderGlossary();
    route();
  } else {
    $('result-count').textContent = 'The glossary is unavailable.';
    error('Unable to load the bundled glossary. Reload this page to try again.');
  }
  if (localFeedback.status === 'rejected') error('Unable to read local feedback. Reload this page to try again.');
}
initialize();
