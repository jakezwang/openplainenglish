import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { studyPlan } from '../demo/study.js';
import { analyzeStudy, responseKey, scoringPacket, validateSession } from '../scripts/analyze-study.mjs';

// Synthetic software fixtures only: these are not participant records or study findings.
function fixture(code = 'SYNTHETIC_1', sequence = 1, glossaryVersion = '0.5.0') {
  return { schemaVersion: 1, protocol: 'ope-three-condition-1', glossaryVersion, participantCode: code, sequence, consent: true, completed: true,
    results: studyPlan(sequence).map((item) => ({ passage: item.id, condition: item.condition, answer: 'Synthetic test answer, not participant data.', skipped: false,
      seconds: item.condition === 'plain' ? 12 : 20, confidence: 4, originalConsulted: false, explanationOpens: item.condition === 'annotate' ? 1 : 0, interrupted: false, facilitatorNotes: '' })) };
}
const scoresFor = (session) => ({ schemaVersion: 1, protocol: 'ope-blind-scores-1', ratings: session.results.flatMap((row) => ['FIRST', 'SECOND'].map((reviewerCode) => ({ responseKey: responseKey(session, row), reviewerCode, score: row.condition === 'plain' ? 2 : 1, misconception: false }))), adjudications: [] });

test('empty inputs give no participant data and no invented effect or score', () => {
  const report = analyzeStudy();
  assert.equal(report.status, 'no-participant-data'); assert.equal(report.sessions, 0);
  assert.deepEqual(report.cohorts, []); assert.equal(report.scoring.agreedOrAdjudicated, 0);
  assert.deepEqual(scoringPacket([]).responses, []);
});
test('all six assigned orders validate, but tampering and duplicate exposure do not', () => {
  for (let sequence = 1; sequence <= 6; sequence++) assert.equal(validateSession(fixture('SYNTHETIC_'+sequence, sequence)).sequence, sequence);
  const session = fixture(); const wrong = structuredClone(session); wrong.results[0].condition = 'plain';
  assert.throws(() => analyzeStudy([wrong]), /assigned sequence/);
  assert.throws(() => analyzeStudy([session, session]), /Duplicate participant/);
  assert.throws(() => analyzeStudy([{ ...session, consent: false }]), /consent/);
  const bad = structuredClone(session); bad.results[0].seconds = Infinity;
  assert.throws(() => analyzeStudy([bad]), /Seconds/);
  bad.results[0].seconds = 1; bad.results[0].confidence = 6;
  assert.throws(() => analyzeStudy([bad]), /confidence/);
  assert.throws(() => analyzeStudy([{ ...session, completed: false }]), /Completion/);
});
test('unscored answers never become comprehension scores and the packet hides assignment metadata', () => {
  const session = fixture(); const report = analyzeStudy([session]);
  assert.equal(report.scoring.pendingSecondOrBothRatings, 6);
  assert.equal(report.cohorts[0].conditions.plain.score.mean, null);
  assert.equal(report.cohorts[0].pairedPlainMinusAnnotate.score.n, 0);
  const packet = scoringPacket([session]);
  assert.equal(packet.responses.length, 6);
  for (const row of packet.responses) assert.deepEqual(Object.keys(row).sort(), ['answer', 'passage', 'question', 'responseKey']);
  assert.equal(analyzeStudy([session], packet.scoringTemplate).scoring.agreedOrAdjudicated, 0);
  assert.doesNotMatch(JSON.stringify(report), /Synthetic test answer|SYNTHETIC_1/);
});
test('two reviewers and explicit adjudication resolve scores without concealing disputes', () => {
  const session = fixture(); const scores = scoresFor(session);
  const report = analyzeStudy([session], scores);
  assert.equal(report.scoring.agreedOrAdjudicated, 6);
  assert.equal(report.cohorts[0].pairedPlainMinusAnnotate.score.mean, 1);
  assert.equal(report.cohorts[0].pairedPlainMinusAnnotate.seconds.mean, -8);
  scores.ratings[1].score = 0; scores.ratings[1].misconception = true;
  const disputed = analyzeStudy([session], scores);
  assert.equal(disputed.scoring.unresolvedDisagreements, 1);
  assert.equal(disputed.scoring.flaggedByAnyReviewer, 1);
  assert.equal(disputed.cohorts[0].pairedPlainMinusAnnotate.score.n, 0);
  scores.adjudications.push({ responseKey: scores.ratings[0].responseKey, reviewerCode: 'THIRD', score: 0, misconception: true, reason: 'Synthetic adjudication fixture.' });
  const resolved = analyzeStudy([session], scores);
  assert.equal(resolved.scoring.adjudicated, 1);
  assert.equal(resolved.cohorts[0].conditions.original.confidentMisunderstandingCount, 1);
  scores.adjudications[0].reviewerCode = 'FIRST';
  assert.throws(() => analyzeStudy([session], scores), /third reviewer/);
});
test('score files cannot silently attach to different answers or duplicate reviewers', () => {
  const session = fixture(); const scores = scoresFor(session);
  const changed = structuredClone(session); changed.results[0].answer += ' changed';
  assert.throws(() => analyzeStudy([changed], scores), /Unknown\/skipped/);
  scores.ratings[1].reviewerCode = scores.ratings[0].reviewerCode;
  assert.throws(() => analyzeStudy([session], scores), /distinct reviewer/);
});
test('skips, interruptions, partial sessions, and glossary versions keep explicit denominators', () => {
  const session = fixture(); session.results[0].skipped = true; session.results[0].answer = ''; session.results[0].confidence = null;
  session.results[1].interrupted = true;
  const partial = fixture('SYNTHETIC_2', 4, '0.4.0'); partial.results = partial.results.slice(0, 1); partial.completed = false;
  const report = analyzeStudy([session, partial]);
  assert.equal(report.partialSessions, 1); assert.equal(report.cohorts.length, 2);
  const cohort = report.cohorts.find((c) => c.glossaryVersion === '0.5.0');
  assert.equal(cohort.conditions.original.skipped, 1); assert.equal(cohort.conditions.original.primaryEligible, 1);
  assert.equal(cohort.conditions.annotate.interrupted, 1); assert.equal(cohort.conditions.annotate.primaryEligible, 1);
  assert.equal(cohort.pairedPlainMinusAnnotate.seconds.n, 0);
});
test('CLI reads only explicit exports, writes private packets on request, and protects inputs', async (t) => {
  const temporary = await mkdtemp(path.join(tmpdir(), 'ope-study-test-')); t.after(() => rm(temporary, { recursive: true, force: true }));
  const input = path.join(temporary, 'synthetic.json'), report = path.join(temporary, 'report.json'), packet = path.join(temporary, 'private.json');
  const raw = JSON.stringify(fixture()); await writeFile(input, raw);
  const exec = promisify(execFile);
  await exec(process.execPath, ['scripts/analyze-study.mjs', '--input', input, '--output', report, '--scoring-packet', packet]);
  const parsed = JSON.parse(await readFile(report)); assert.equal(parsed.sessions, 1); assert.equal(parsed.inputSha256.length, 1);
  assert.equal(JSON.parse(await readFile(packet)).responses.length, 6);
  await assert.rejects(exec(process.execPath, ['scripts/analyze-study.mjs', '--input', input, '--output', input]), /overwrite/);
  assert.equal(await readFile(input, 'utf8'), raw);
});
