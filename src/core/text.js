import { createMatcher } from './matcher.js';
import { assertReadingMode, getInlinePresentation } from './inline.js';

/** A local, deterministic phrase editor. Offsets always refer to the original UTF-16 string. */
export function createTextEngine(entries) {
  if (!Array.isArray(entries) || !entries.length || entries.length > 5000) throw new TypeError('Use 1–5,000 glossary entries.');
  const snapshot = structuredClone(entries);
  const ids = new Set();
  for (const entry of snapshot) {
    if (!entry || typeof entry.id !== 'string' || !entry.id || ids.has(entry.id)
      || typeof entry.term !== 'string' || !entry.term || entry.term.length > 200
      || !Array.isArray(entry.aliases) || entry.aliases.length > 100
      || entry.aliases.some((term) => typeof term !== 'string' || !term || term.length > 200)) throw new TypeError('Use valid entries with unique IDs and bounded terms.');
    ids.add(entry.id);
  }
  const matcher = createMatcher(snapshot);
  return Object.freeze({
    analyze(original, { mode = 'plain', maxMatches = 750 } = {}) {
      assertReadingMode(mode);
      if (typeof original !== 'string' || original.length > 200000) throw new TypeError('Text must contain at most 200,000 UTF-16 code units.');
      if (!Number.isInteger(maxMatches) || maxMatches < 1 || maxMatches > 5000) throw new TypeError('Choose a match limit between 1 and 5,000.');
      const found = matcher.find(original);
      const matches = found.slice(0, maxMatches).map(({ entry, start, end, matchedText }) => ({
        entryId: entry.id, start, end,
        ...getInlinePresentation(entry, matchedText, mode, { before: original.slice(0, start), after: original.slice(end) }),
      }));
      let plain = '';
      let cursor = 0;
      for (const match of matches) {
        plain += original.slice(cursor, match.start) + match.displayText;
        cursor = match.end;
      }
      plain += original.slice(cursor);
      const replacedCount = matches.filter((match) => match.replaced).length;
      return { original, text: plain, mode, matches, replacedCount, annotatedCount: matches.length - replacedCount, truncated: found.length > maxMatches };
    },
  });
}
