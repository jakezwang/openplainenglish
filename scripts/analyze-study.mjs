import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { studyPlan, STUDY_PASSAGES } from '../demo/study.js';

const CONDITIONS = ['original', 'annotate', 'plain'];
const hash = (value) => createHash('sha256').update(value).digest('hex');
const object = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);
const code = (value) => typeof value === 'string' && /^[A-Za-z0-9_-]{1,40}$/u.test(value);
const bool = (value) => typeof value === 'boolean';
const text = (value, max) => typeof value === 'string' && value.length <= max;
function check(ok, message) { if (!ok) throw new TypeError(message); }
function keys(value, allowed, label) { check(object(value) && Object.keys(value).every((key) => allowed.includes(key)), `Unsupported ${label} fields.`); }

export function validateSession(session) {
  keys(session, ['schemaVersion', 'protocol', 'glossaryVersion', 'participantCode', 'sequence', 'consent', 'completed', 'results'], 'session');
  check(session.schemaVersion === 1 && session.protocol === 'ope-three-condition-1', 'Unsupported study schema or protocol.');
  check(/^\d+\.\d+\.\d+$/u.test(session.glossaryVersion) && code(session.participantCode), 'Invalid glossary version or participant code.');
  check(session.consent === true, 'Export must record consent; this does not verify the consent process.');
  check(Array.isArray(session.results) && session.results.length <= 6 && session.completed === (session.results.length === 6), 'Completion status must agree with 0–6 submitted tasks.');
  const plan = studyPlan(session.sequence);
  for (const [index, row] of session.results.entries()) {
    keys(row, ['passage', 'condition', 'answer', 'skipped', 'seconds', 'confidence', 'originalConsulted', 'explanationOpens', 'interrupted', 'facilitatorNotes'], 'result');
    check(row.passage === plan[index].id && row.condition === plan[index].condition, 'Result order/condition does not match its assigned sequence.');
    check(bool(row.skipped) && text(row.answer, 1000) && (row.skipped ? row.answer === '' : Boolean(row.answer.trim())), 'Invalid answer or skip record.');
    check(Number.isFinite(row.seconds) && row.seconds >= 0, 'Seconds must be finite and nonnegative.');
    check(row.skipped ? row.confidence === null : Number.isInteger(row.confidence) && row.confidence >= 1 && row.confidence <= 5, 'Invalid confidence or skipped confidence.');
    check(bool(row.originalConsulted) && bool(row.interrupted) && Number.isSafeInteger(row.explanationOpens) && row.explanationOpens >= 0 && text(row.facilitatorNotes, 500), 'Invalid observation fields.');
  }
  return session;
}

export function responseKey(session, row) {
  return hash(JSON.stringify([session.protocol, session.glossaryVersion, session.participantCode, session.sequence, row.passage, row.answer, row.skipped]));
}
function stats(values) {
  if (!values.length) return { n: 0, mean: null, median: null, min: null, max: null };
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return { n: sorted.length, mean: sorted.reduce((n, value) => n + value, 0) / sorted.length,
    median: sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2,
    min: sorted[0], max: sorted.at(-1) };
}

function resolveScores(scores, responses) {
  scores ||= { schemaVersion: 1, protocol: 'ope-blind-scores-1', ratings: [], adjudications: [] };
  keys(scores, ['schemaVersion', 'protocol', 'ratings', 'adjudications'], 'scoring');
  check(scores.schemaVersion === 1 && scores.protocol === 'ope-blind-scores-1' && Array.isArray(scores.ratings) && Array.isArray(scores.adjudications), 'Unsupported scoring schema.');
  const groups = new Map();
  const adjudications = new Map();
  for (const rating of scores.ratings) {
    keys(rating, ['responseKey', 'reviewerCode', 'score', 'misconception'], 'rating');
    check(responses.has(rating.responseKey) && !responses.get(rating.responseKey).row.skipped && code(rating.reviewerCode), 'Unknown/skipped response key or invalid reviewer code.');
    const pending = rating.score === null && rating.misconception === null;
    check(pending || Number.isInteger(rating.score) && rating.score >= 0 && rating.score <= 2 && bool(rating.misconception), 'Rating needs score 0–2 and a misconception flag, or two null fields.');
    const group = groups.get(rating.responseKey) || [];
    check(!group.some((r) => r.reviewerCode === rating.reviewerCode) && group.length < 2, 'Use two distinct reviewer codes without duplicate ratings.');
    group.push(rating); groups.set(rating.responseKey, group);
  }
  for (const item of scores.adjudications) {
    keys(item, ['responseKey', 'reviewerCode', 'score', 'misconception', 'reason'], 'adjudication');
    const group = groups.get(item.responseKey) || [];
    check(group.length === 2 && group.every((r) => r.score !== null) && group.some((r) => r.score !== group[0].score || r.misconception !== group[0].misconception), 'Adjudicate only a disagreement between two completed ratings.');
    check(code(item.reviewerCode) && group.every((r) => r.reviewerCode !== item.reviewerCode) && !adjudications.has(item.responseKey), 'Adjudication needs a distinct third reviewer code and a unique response.');
    check(Number.isInteger(item.score) && item.score >= 0 && item.score <= 2 && bool(item.misconception) && text(item.reason, 500) && item.reason.trim(), 'Adjudication needs a score, misconception flag, and reason.');
    adjudications.set(item.responseKey, item);
  }
  const resolved = new Map();
  let disagreements = 0, pending = 0, flaggedByAnyReviewer = 0;
  for (const [key, response] of responses) {
    if (response.row.skipped) continue;
    const group = (groups.get(key) || []).filter((rating) => rating.score !== null);
    if (group.some((r) => r.misconception)) flaggedByAnyReviewer++;
    if (group.length < 2) { pending++; continue; }
    if (group[0].score === group[1].score && group[0].misconception === group[1].misconception) resolved.set(key, group[0]);
    else if (adjudications.has(key)) resolved.set(key, adjudications.get(key));
    else disagreements++;
  }
  return { resolved, summary: { agreedOrAdjudicated: resolved.size, pendingSecondOrBothRatings: pending, unresolvedDisagreements: disagreements, adjudicated: adjudications.size, flaggedByAnyReviewer } };
}

/** Descriptive analysis of supplied records; never fabricates participants or scores. */
export function analyzeStudy(sessions = [], scores) {
  check(Array.isArray(sessions) && sessions.length <= 10000, 'Provide at most 10,000 session exports.');
  const participants = new Set(); const responses = new Map();
  for (const session of sessions) {
    validateSession(session);
    check(!participants.has(session.participantCode), 'Duplicate participant code: do not silently pool repeat exposures or duplicate exports.');
    participants.add(session.participantCode);
    for (const row of session.results) responses.set(responseKey(session, row), { session, row });
  }
  const scoring = resolveScores(scores, responses);
  const cohorts = [...new Set(sessions.map((s) => s.glossaryVersion))].sort().map((glossaryVersion) => {
    const group = sessions.filter((s) => s.glossaryVersion === glossaryVersion);
    const summarize = (rows) => {
      const eligible = rows.filter(({ row }) => !row.skipped && !row.interrupted);
      const scored = eligible.filter(({ key }) => scoring.resolved.has(key));
      return { submitted: rows.length, skipped: rows.filter(({ row }) => row.skipped).length, interrupted: rows.filter(({ row }) => row.interrupted).length,
        primaryEligible: eligible.length, scored: scored.length, unscored: eligible.length - scored.length,
        score: stats(scored.map(({ key }) => scoring.resolved.get(key).score)), seconds: stats(eligible.map(({ row }) => row.seconds)), confidence: stats(eligible.map(({ row }) => row.confidence)),
        misconceptionCount: scored.filter(({ key }) => scoring.resolved.get(key).misconception).length,
        confidentMisunderstandingCount: scored.filter(({ key, row }) => row.confidence >= 4 && (scoring.resolved.get(key).score === 0 || scoring.resolved.get(key).misconception)).length,
        originalConsultations: eligible.filter(({ row }) => row.originalConsulted).length,
        explanationOpens: eligible.reduce((n, { row }) => n + row.explanationOpens, 0) };
    };
    const rows = group.flatMap((session) => session.results.map((row) => ({ key: responseKey(session, row), row })));
    const conditions = Object.fromEntries(CONDITIONS.map((condition) => [condition, summarize(rows.filter(({ row }) => row.condition === condition))]));
    const pairedSeconds = [], pairedScores = [];
    for (const session of group) {
      if (!session.completed || session.results.some((row) => row.skipped || row.interrupted)) continue;
      const average = (condition, value) => { const rows = session.results.filter((row) => row.condition === condition); return rows.reduce((n, row) => n + value(row), 0) / rows.length; };
      pairedSeconds.push(average('plain', (row) => row.seconds) - average('annotate', (row) => row.seconds));
      if (session.results.every((row) => scoring.resolved.has(responseKey(session, row)))) pairedScores.push(average('plain', (row) => scoring.resolved.get(responseKey(session, row)).score) - average('annotate', (row) => scoring.resolved.get(responseKey(session, row)).score));
    }
    return { glossaryVersion, sessions: group.length, completeSessions: group.filter((s) => s.completed).length,
      sequenceCounts: Object.fromEntries(Array.from({ length: 6 }, (_, i) => [i + 1, group.filter((s) => s.sequence === i + 1).length])),
      conditions, pairedPlainMinusAnnotate: { seconds: stats(pairedSeconds), score: stats(pairedScores) } };
  });
  return { schemaVersion: 1, protocol: 'ope-three-condition-1', status: sessions.length ? 'descriptive-input-records-only' : 'no-participant-data',
    evidenceLimit: 'Software validates records, not participant identity, consent conduct, human expertise, scorer independence, or clinical validity. No causal effect or significance conclusion is produced.',
    method: 'Skipped/interrupted tasks are counted but excluded from primary summaries. Scores require two distinct matching reviewer codes or a third-code adjudication. Versions are separate. Paired differences use only complete six-task sessions; score pairs also require every score. Time includes reading, controls and answering.',
    sessions: sessions.length, completeSessions: sessions.filter((s) => s.completed).length, partialSessions: sessions.filter((s) => !s.completed).length,
    scoring: scoring.summary, cohorts };
}

export function scoringPacket(sessions) {
  analyzeStudy(sessions);
  const responses = sessions.flatMap((session) => session.results.filter((row) => !row.skipped).map((row) => ({ responseKey: responseKey(session, row), passage: row.passage, question: STUDY_PASSAGES.find((p) => p.id === row.passage).question, answer: row.answer })));
  responses.sort((a, b) => a.responseKey.localeCompare(b.responseKey));
  return { warning: 'Private answers: do not publish without explicit participant permission. Conditions, sequence, participant codes, timings and observer notes are omitted; wording may still reveal condition. Give each scorer a separate copy before comparing ratings.', responses,
    scoringTemplate: { schemaVersion: 1, protocol: 'ope-blind-scores-1', ratings: responses.flatMap(({ responseKey }) => ['SCORER_1', 'SCORER_2'].map((reviewerCode) => ({ responseKey, reviewerCode, score: null, misconception: null }))), adjudications: [] } };
}
async function jsonFile(file) {
  const raw = await readFile(file);
  check(raw.length <= 20 * 1024 * 1024, 'Study file exceeds the 20 MiB limit.');
  return { raw, value: JSON.parse(raw) };
}
async function main(args) {
  const inputs = []; let scoresFile, output, packetFile;
  for (let i = 0; i < args.length; i += 2) {
    const [flag, value] = args.slice(i, i + 2);
    check(value && ['--input', '--scores', '--output', '--scoring-packet'].includes(flag), 'Usage: node scripts/analyze-study.mjs [--input session.json ...] [--scores scores.json] [--output report.json] [--scoring-packet private-packet.json]');
    if (flag === '--input') inputs.push(resolve(value));
    else if (flag === '--scores') { check(!scoresFile, 'Duplicate --scores.'); scoresFile = resolve(value); }
    else if (flag === '--output') { check(!output, 'Duplicate --output.'); output = resolve(value); }
    else { check(!packetFile, 'Duplicate --scoring-packet.'); packetFile = resolve(value); }
  }
  check(![output, packetFile].filter(Boolean).some((file) => inputs.includes(file) || file === scoresFile) && (!output || output !== packetFile), 'Output paths must not overwrite input/scoring files or each other.');
  const loaded = await Promise.all(inputs.map(jsonFile));
  const scoring = scoresFile ? await jsonFile(scoresFile) : null;
  const sessions = loaded.map(({ value }) => value);
  const report = { ...analyzeStudy(sessions, scoring?.value), inputSha256: loaded.map(({ raw }) => hash(raw)), scoringSha256: scoring ? hash(scoring.raw) : null };
  const write = async (file, value) => { await mkdir(dirname(file), { recursive: true }); await writeFile(file, JSON.stringify(value, null, 2) + '\n'); };
  if (output) await write(output, report); else process.stdout.write(JSON.stringify(report, null, 2) + '\n');
  if (packetFile) await write(packetFile, scoringPacket(sessions));
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main(process.argv.slice(2)).catch((error) => { console.error(error.message); process.exitCode = 1; });
