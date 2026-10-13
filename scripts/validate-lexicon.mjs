import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const MAX_SHORT_LENGTH = 96;
export const REVIEW_METHOD = 'editorial source comparison; no independent clinical or user-comprehension review';
const SOURCE_LICENSES = new Set(['Public-Domain-US']);
const SOURCE_HOSTS = new Set(['www.cdc.gov', 'archive.cdc.gov', 'stacks.cdc.gov', 'www.cancer.gov', 'medlineplus.gov', 'www.fda.gov']);
const UNSAFE_MATCHES = new Set(['positive', 'negative', 'discharge', 'stroke', 'acute', 'chronic', 'screening', 'transmission', 'toxic', 'mi', 'bp', 'ra', 'ms', 'iv', 'im', 'ct', 'cat']);
const plainObject = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);
const normalize = (value) => value.normalize('NFKC').toLocaleLowerCase('en-US').replace(/\s+/gu, ' ').trim();

/** Validate offline. A successful result does not establish clinical accuracy or link availability. */
export function validateLexicon(lexicon) {
  const errors = [];
  const fail = (path, message) => errors.push(`${path}: ${message}`);
  const string = (value, path, max = 500) => {
    if (typeof value !== 'string' || !value.trim()) {
      fail(path, 'must be a non-empty string');
      return false;
    }
    if (value !== value.trim()) fail(path, 'must not have surrounding whitespace');
    if ([...value].length > max) fail(path, `must be at most ${max} characters`);
    if (/[\u0000-\u001f\u007f]/u.test(value)) fail(path, 'must not contain control characters');
    if (/[<>]/u.test(value)) fail(path, 'must be plain text, not markup');
    return true;
  };
  if (!plainObject(lexicon)) return ['lexicon: must be an object'];
  if (lexicon.schemaVersion !== 1) fail('schemaVersion', 'must be 1');
  if (typeof lexicon.version !== 'string' || !/^\d+\.\d+\.\d+$/u.test(lexicon.version)) fail('version', 'must be a release version such as 0.1.0');
  if (lexicon.license !== 'CC0-1.0') fail('license', 'authored lexicon must identify CC0-1.0');
  if (!Array.isArray(lexicon.entries) || lexicon.entries.length === 0) {
    fail('entries', 'must be a non-empty array');
    return errors;
  }
  const ids = new Map();
  const phrases = new Map();
  function registerPhrase(value, path) {
    if (!string(value, path, 100)) return;
    const key = normalize(value);
    if (key.length < 3) fail(path, 'matching phrases must contain at least 3 characters');
    if (UNSAFE_MATCHES.has(key)) fail(path, 'ambiguous standalone match is excluded from v0.1');
    if (phrases.has(key)) fail(path, `duplicate term or alias (case-insensitive); first used at ${phrases.get(key)}`);
    else phrases.set(key, path);
  }
  for (const [index, entry] of lexicon.entries.entries()) {
    const base = `entries[${index}]`;
    if (!plainObject(entry)) {
      fail(base, 'must be an object');
      continue;
    }
    if (string(entry.id, `${base}.id`, 100)) {
      const key = normalize(entry.id);
      if (!/^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/u.test(entry.id)) fail(`${base}.id`, 'must be a lowercase kebab-case identifier');
      if (ids.has(key)) fail(`${base}.id`, `duplicate id (case-insensitive); first used at ${ids.get(key)}`);
      else ids.set(key, `${base}.id`);
    }
    registerPhrase(entry.term, `${base}.term`);
    if (!Array.isArray(entry.aliases)) fail(`${base}.aliases`, 'must be an array');
    else entry.aliases.forEach((alias, i) => registerPhrase(alias, `${base}.aliases[${i}]`));
    if (entry.domain !== 'health') fail(`${base}.domain`, 'must be health in v0.1');
    string(entry.short, `${base}.short`, MAX_SHORT_LENGTH);
    string(entry.explanation, `${base}.explanation`);
    string(entry.context, `${base}.context`);
    if (!Array.isArray(entry.sources) || entry.sources.length === 0) fail(`${base}.sources`, 'must contain at least one source');
    else entry.sources.forEach((source, i) => {
      const path = `${base}.sources[${i}]`;
      if (!plainObject(source)) return fail(path, 'must be an object');
      string(source.label, `${path}.label`, 200);
      if (!SOURCE_LICENSES.has(source.license)) fail(`${path}.license`, 'missing or unreviewed source license');
      if (!string(source.url, `${path}.url`, 1000)) return;
      try {
        const url = new URL(source.url);
        if (url.protocol !== 'https:' || url.username || url.password || url.port || !SOURCE_HOSTS.has(url.hostname)) {
          fail(`${path}.url`, 'must be an HTTPS URL on a reviewed primary-source host without credentials or a custom port');
        }
        if (url.hostname === 'medlineplus.gov' && /^\/(ency|druginfo)\//u.test(url.pathname)) {
          fail(`${path}.url`, 'MedlinePlus encyclopedia and drug monographs are outside the reviewed reuse scope');
        }
      } catch {
        fail(`${path}.url`, 'must be a valid absolute URL');
      }
    });
    if (!plainObject(entry.review)) fail(`${base}.review`, 'must include review metadata');
    else {
      if (entry.review.status !== 'source-checked') fail(`${base}.review.status`, 'unsupported review status; v0.1 only uses source-checked');
      const date = entry.review.date;
      if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/u.test(date) || Number.isNaN(Date.parse(date)) || new Date(date).toISOString().slice(0, 10) !== date) {
        fail(`${base}.review.date`, 'must be a real date in YYYY-MM-DD format');
      }
      if (entry.review.method !== REVIEW_METHOD) fail(`${base}.review.method`, 'must state the editorial method and lack of independent clinical/user review');
    }
  }
  return errors;
}

export function assertValidLexicon(lexicon) {
  const errors = validateLexicon(lexicon);
  if (errors.length) throw new Error(`Invalid lexicon:\n${errors.join('\n')}`);
  return lexicon;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const path = process.argv[2] ?? fileURLToPath(new URL('../data/health.json', import.meta.url));
    const lexicon = JSON.parse(readFileSync(path, 'utf8'));
    assertValidLexicon(lexicon);
    console.log(`Lexicon ${lexicon.version}: ${lexicon.entries.length} entries passed structural and provenance checks.`);
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
