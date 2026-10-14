import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createMatcher } from '../src/core/matcher.js';
import { getInlinePresentation } from '../src/core/inline.js';

const sha256 = (value) => createHash('sha256').update(value).digest('hex');

/** Offline literal-match measurement, not a comprehension or accuracy score. */
export function renderText(text, entries) {
  const matches = createMatcher(entries).find(text);
  let output = '';
  let cursor = 0;
  let replacements = 0;
  for (const match of matches) {
    const shown = getInlinePresentation(match.entry, match.matchedText, 'plain', {
      before: text.slice(0, match.start), after: text.slice(match.end),
    });
    output += text.slice(cursor, match.start) + shown.displayText;
    cursor = match.end;
    replacements += Number(shown.replaced);
  }
  return { output: output + text.slice(cursor), matches, replacements };
}

function measure(doc, entries) {
  const rendered = renderText(doc.text, entries);
  const covered = doc.gold.filter((gold) => rendered.matches.some((match) =>
    match.start === gold.start && match.end === gold.end && match.entry.id === gold.entryId));
  return {
    matches: rendered.matches.length,
    inlineReplacements: rendered.replacements,
    goldCovered: covered.length,
    coveredConcepts: [...new Set(covered.map((gold) => gold.entryId))].sort(),
    missingGold: doc.gold.filter((gold) => !covered.includes(gold)),
  };
}

export function analyzeCorpus(corpus, lexicon) {
  const documentIds = new Set();
  const documents = corpus.documents.map((doc) => {
    if (documentIds.has(doc.id)) throw new Error(`Duplicate document ${doc.id}`);
    documentIds.add(doc.id);
    if (sha256(doc.text) !== doc.sha256) throw new Error(`Snapshot hash mismatch: ${doc.id}`);
    let previousEnd = 0;
    for (const gold of doc.gold) {
      if (!Number.isInteger(gold.start) || !Number.isInteger(gold.end) || gold.start < previousEnd || gold.end <= gold.start
        || gold.end > doc.text.length || doc.text.slice(gold.start, gold.end) !== gold.text || !gold.entryId) {
        throw new Error(`Invalid gold span: ${doc.id}`);
      }
      previousEnd = gold.end;
    }
    return {
      id: doc.id, url: doc.url, snapshotSha256: doc.sha256,
      whitespaceTokens: doc.text.trim().split(/\s+/u).length,
      goldOccurrences: doc.gold.length,
      baseline: measure(doc, corpus.baseline.entries),
      current: measure(doc, lexicon.entries),
    };
  });
  const goldOccurrences = documents.reduce((n, doc) => n + doc.goldOccurrences, 0);
  const summarize = (key) => {
    const covered = documents.reduce((n, doc) => n + doc[key].goldCovered, 0);
    return {
      literalMatches: documents.reduce((n, doc) => n + doc[key].matches, 0),
      inlineReplacements: documents.reduce((n, doc) => n + doc[key].inlineReplacements, 0),
      goldCovered: covered,
      goldOccurrenceCoverage: goldOccurrences ? Number((covered / goldOccurrences).toFixed(6)) : null,
      uniqueCoveredConcepts: [...new Set(documents.flatMap((doc) => doc[key].coveredConcepts))].length,
    };
  };
  const behaviorCases = (corpus.behaviorCases || []).map((fixture) => {
    const actual = renderText(fixture.text, lexicon.entries);
    const actualEntryIds = actual.matches.map((match) => match.entry.id);
    return {
      id: fixture.id,
      pass: actual.output === fixture.expectedOutput && JSON.stringify(actualEntryIds) === JSON.stringify(fixture.expectedEntryIds),
      expectedOutput: fixture.expectedOutput, actualOutput: actual.output,
      expectedEntryIds: fixture.expectedEntryIds, actualEntryIds,
    };
  });
  return {
    corpusId: corpus.id, kind: corpus.kind, scope: corpus.scope,
    baselineVersion: corpus.baseline.version, lexiconVersion: lexicon.version,
    documentCount: documents.length,
    whitespaceTokens: documents.reduce((n, doc) => n + doc.whitespaceTokens, 0),
    goldOccurrences,
    uniqueGoldConcepts: new Set(corpus.documents.flatMap((doc) => doc.gold.map((gold) => gold.entryId))).size,
    baseline: summarize('baseline'), current: summarize('current'),
    documents,
    behaviorSummary: { total: behaviorCases.length, passed: behaviorCases.filter((item) => item.pass).length },
    behaviorCases,
  };
}

async function main(args) {
  let output;
  if (args.length) {
    if (args.length !== 2 || args[0] !== '--output' || !args[1]) throw new Error('Usage: node scripts/check-coverage.mjs [--output report.json]');
    output = resolve(args[1]);
  }
  const root = fileURLToPath(new URL('../', import.meta.url));
  const pairs = [
    ['data/coverage/health-reading.json', 'data/health.json'],
    ['data/coverage/public-service-reading.json', 'data/pilots/public-service.json'],
  ];
  const reports = [];
  for (const [corpusPath, lexiconPath] of pairs) {
    const [corpusText, lexiconText] = await Promise.all([readFile(resolve(root, corpusPath), 'utf8'), readFile(resolve(root, lexiconPath), 'utf8')]);
    reports.push({ corpusPath, corpusSha256: sha256(corpusText), lexiconPath, lexiconSha256: sha256(lexiconText),
      ...analyzeCorpus(JSON.parse(corpusText), JSON.parse(lexiconText)) });
  }
  const report = { method: 'Offline selected-span literal coverage and invented sentence regression; no semantic accuracy, clinical, representative-frequency, or comprehension claim.', reports };
  const json = JSON.stringify(report, null, 2) + '\n';
  if (output) { await mkdir(dirname(output), { recursive: true }); await writeFile(output, json); }
  else process.stdout.write(json);
  if (reports.some((item) => item.behaviorSummary.total !== item.behaviorSummary.passed)) process.exitCode = 1;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main(process.argv.slice(2)).catch((error) => { console.error(error.message); process.exitCode = 1; });
}
