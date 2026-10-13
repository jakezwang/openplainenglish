/** Literal, Unicode-aware matching. Terms are data, never regular expressions. */
export function createMatcher(entries) {
  const byFirst = new Map();
  const seen = new Set();
  for (const entry of entries) {
    for (const term of [entry.term, ...(entry.aliases || [])]) {
      const folded = term.toLowerCase().replace(/\s+/gu, ' ');
      if (!folded || seen.has(folded)) continue;
      seen.add(folded);
      const bucket = byFirst.get(folded[0]) || [];
      bucket.push({ folded, entry });
      byFirst.set(folded[0], bucket);
    }
  }
  for (const bucket of byFirst.values()) bucket.sort((a, b) => b.folded.length - a.folded.length);
  const isWord = (character) => character != null && /[\p{L}\p{N}\p{M}_]/u.test(character);
  const pointAt = (text, index) => index < text.length ? String.fromCodePoint(text.codePointAt(index)) : undefined;
  const pointBefore = (text, index) => {
    if (!index) return undefined;
    const last = text.charCodeAt(index - 1);
    const previous = text.charCodeAt(index - 2);
    return pointAt(text, last >= 0xdc00 && last <= 0xdfff && previous >= 0xd800 && previous <= 0xdbff ? index - 2 : index - 1);
  };
  return {
    find(text) {
      const matches = [];
      // Folding each code point separately keeps an index map even for expanding
      // Unicode lowercase operations (e.g. capital dotted I).
      let folded = '';
      const starts = [];
      const ends = [];
      let offset = 0;
      for (const point of text) {
        const lower = /\s/u.test(point) ? ' ' : point.toLowerCase();
        if (lower === ' ' && folded.endsWith(' ')) {
          ends[ends.length - 1] = offset + point.length;
          offset += point.length;
          continue;
        }
        folded += lower;
        for (let j = 0; j < lower.length; j++) {
          starts.push(offset);
          ends.push(offset + point.length);
        }
        offset += point.length;
      }
      for (let i = 0; i < folded.length; i++) {
        const bucket = byFirst.get(folded[i]);
        if (!bucket) continue;
        if (isWord(pointBefore(folded, i))) continue;
        for (const candidate of bucket) {
          const end = i + candidate.folded.length;
          if (folded.startsWith(candidate.folded, i) && !isWord(pointAt(folded, end))) {
            const startOffset = starts[i];
            const endOffset = ends[end - 1];
            matches.push({ start: startOffset, end: endOffset, entry: candidate.entry, matchedText: text.slice(startOffset, endOffset) });
            i = end - 1;
            break;
          }
        }
      }
      return matches;
    },
  };
}
