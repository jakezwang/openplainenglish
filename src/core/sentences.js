const CLAUSE = /^(?:the\s+\S+|this\s+\S+|that\s+\S+|these\s+\S+|those\s+\S+|a\s+\S+|an\s+\S+|it|they|we|you|he|she)\s+(?:is|are|was|were|has|have|had|can|may|will|does|do|did|mentions?|contains?|shows?|lists?|states?|includes?|uses?|requires?)\b/iu;
const QUOTED = /["“”‘’'«»‹›「」『』]/u;
const UNSAFE = /[()[\]{}]|\b(?:if|unless|although|because|provided|except|respectively|when|whenever|while|whereas|until|once)\b/iu;
const words = (text) => text.match(/[\p{L}\p{N}]+(?:[.,:/%-][\p{L}\p{N}]+)*/gu)?.map((word) => word.toLowerCase()) || [];

/** An intentionally narrow, deterministic sentence experiment: no inference. */
export function proposeSentenceSplits(original) {
  if (typeof original !== 'string' || original.length > 20000) throw new TypeError('Use at most 20,000 characters.');
  const changes = [];
  // Quote boundaries can span sentences or paragraphs. Withhold all proposals
  // for quoted input instead of treating a middle sentence as unquoted prose.
  if (QUOTED.test(original)) return { original, text: original, changes, tokenSequencePreserved: true, limitation: 'Quoted input is retained unchanged.' };
  // Paragraph and sentence boundaries are retained; abbreviations/decimals may
  // conservatively suppress a proposal rather than guessing a sentence parse.
  const text = original.replace(/[^.!?\n]+(?:[.!?]|$)/gu, (sentence, offset) => {
    const trimmed = sentence.trim();
    if ((sentence.match(/;/gu) || []).length !== 1 || UNSAFE.test(sentence)) return sentence;
    const [left, right] = trimmed.replace(/[.!?]$/u, '').split(';').map((part) => part.trim());
    if (!left || !right || !CLAUSE.test(left) || !CLAUSE.test(right)) return sentence;
    const index = sentence.indexOf(';');
    const suffix = sentence.slice(index + 1);
    const gap = suffix.match(/^\s*/u)[0];
    if (!gap || !/[a-z]/u.test(suffix[gap.length])) return sentence;
    const replacement = `. ${suffix[gap.length].toUpperCase()}`;
    const changed = sentence.slice(0, index) + replacement + suffix.slice(gap.length + 1);
    if (JSON.stringify(words(changed)) !== JSON.stringify(words(sentence))) return sentence;
    changes.push({ start: offset + index, end: offset + index + 1 + gap.length + 1, original: sentence.slice(index, index + 1 + gap.length + 1), replacement, rule: 'split-explicit-independent-clauses' });
    return changed;
  });
  return { original, text, changes, tokenSequencePreserved: JSON.stringify(words(original)) === JSON.stringify(words(text)), limitation: 'Only separates two explicitly worded clauses at a semicolon. It does not understand meaning or paraphrase a sentence.' };
}
