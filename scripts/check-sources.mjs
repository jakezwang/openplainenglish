import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const MAX_BODY_BYTES = 2 * 1024 * 1024;
const pause = (ms) => new Promise((done) => setTimeout(done, ms));
const cleanText = (value) => String(value ?? '').replace(/<[^>]*>/gu, ' ').replace(/&(?:amp|nbsp|quot);/gu, ' ').replace(/\s+/gu, ' ').trim();

export function extractTitle(html) {
  // SVG <title> elements label icons, not the document. NCI's shell uses og:title.
  const head = html.match(/<head\b[^>]*>([\s\S]*?)<\/head>/iu)?.[1] ?? html.replace(/<svg\b[^>]*>[\s\S]*?<\/svg>/giu, '');
  const title = head.match(/<title\b[^>]*>([\s\S]*?)<\/title>/iu)?.[1];
  const ogTitle = [...head.matchAll(/<meta\b[^>]*>/giu)].find(([tag]) => /\bproperty\s*=\s*["']og:title["']/iu.test(tag))?.[0].match(/\bcontent\s*=\s*(["'])([\s\S]*?)\1/iu)?.[2];
  return cleanText(title || ogTitle).slice(0, 300) || null;
}

export function classifyHttp(status) {
  if (status >= 200 && status < 300) return 'available';
  if ([401, 403, 429].includes(status)) return 'blocked';
  if ([404, 410].includes(status)) return 'missing';
  return 'http-error';
}

export function collectSources(lexicon) {
  const sources = new Map();
  for (const entry of lexicon.entries) {
    for (const source of entry.sources) {
      if (!sources.has(source.url)) sources.set(source.url, { url: source.url, labels: [], entryIds: [] });
      const item = sources.get(source.url);
      if (!item.labels.includes(source.label)) item.labels.push(source.label);
      if (!item.entryIds.includes(entry.id)) item.entryIds.push(entry.id);
    }
  }
  return [...sources.values()].sort((a, b) => a.url.localeCompare(b.url));
}

/** These two sites serve application shells; HTTP 200 alone does not establish a term exists. */
export function contentProbe(urlString) {
  const url = new URL(urlString);
  if (url.hostname === 'www.cancer.gov' && url.pathname.startsWith('/publications/dictionaries/cancer-terms/def/')) {
    const slug = url.pathname.split('/').filter(Boolean).at(-1);
    return { kind: 'nci-definition', url: `https://webapis.cancer.gov/glossary/v1/Terms/Cancer.gov/Patient/en/${encodeURIComponent(slug)}` };
  }
  if (url.hostname === 'www.cdc.gov' && url.pathname === '/ccindex/everydaywords/index.html' && url.searchParams.has('word')) {
    return { kind: 'cdc-entries', url: `https://tools.cdc.gov/ewapi/everydaywords.svc/entries?term=${encodeURIComponent(url.searchParams.get('word'))}` };
  }
  return null;
}

async function readBounded(response) {
  if (!response.body) return '';
  const reader = response.body.getReader();
  const chunks = [];
  let length = 0;
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      length += value.byteLength;
      if (length > MAX_BODY_BYTES) {
        await reader.cancel();
        throw new Error('body-limit');
      }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  return Buffer.concat(chunks).toString('utf8');
}

export async function checkUrl(url, { fetchImpl = fetch, timeoutMs = 12000, retries = 1, retryDelayMs = 350 } = {}) {
  let result;
  for (let attempt = 1; attempt <= retries + 1; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetchImpl(url, {
        signal: controller.signal,
        redirect: 'follow',
        headers: { 'User-Agent': 'OpenPlainEnglish-SourceAudit/1.0', Accept: 'text/html,application/json;q=0.9,*/*;q=0.1' },
      });
      const body = await readBounded(response);
      const title = extractTitle(body);
      result = { status: classifyHttp(response.status), httpStatus: response.status, finalUrl: response.url || url, attempts: attempt, title: title || null, body };
      // Challenge pages can return HTTP 200. Flag them rather than count them as content evidence.
      if (result.status === 'available' && /^(access denied|just a moment|attention required|request rejected|robot verification|verify you are human)\b/iu.test(title ?? '')) result.status = 'blocked';
    } catch (error) {
      result = { status: controller.signal.aborted ? 'timeout' : 'network-error', httpStatus: null, finalUrl: null, attempts: attempt, title: null, body: '', error: error.message === 'body-limit' ? 'body exceeded 2 MiB limit' : controller.signal.aborted ? 'request timed out' : String(error.message).slice(0, 200) };
    } finally { clearTimeout(timer); }
    const retryable = result.status === 'timeout' || result.status === 'network-error' || result.httpStatus === 429 || result.httpStatus >= 500;
    if (!retryable || attempt > retries) return result;
    await pause(retryDelayMs * attempt);
  }
  return result;
}

function parseEvidence(probe, response) {
  const { body, ...metadata } = response;
  if (response.status !== 'available') return { ...metadata, status: response.status, kind: probe.kind, url: probe.url };
  try {
    const data = JSON.parse(body);
    const terms = probe.kind === 'nci-definition'
      ? (data.definition?.text?.trim() ? [{ term: data.termName, excerpt: cleanText(data.definition.text).slice(0, 180) }] : [])
      : (data.Entries ?? []).filter((entry) => entry.PrimaryTerm?.TermText).map((entry) => ({ term: entry.PrimaryTerm.TermText, excerpt: cleanText(entry.Description || entry.Definitions).slice(0, 180) }));
    return { ...metadata, status: terms.length ? 'found' : 'not-found', kind: probe.kind, url: probe.url, terms };
  } catch {
    return { ...metadata, status: 'unreadable', kind: probe.kind, url: probe.url, message: 'Expected JSON was not returned.' };
  }
}

/** Network evidence only: never changes the lexicon or promotes its review status. */
export async function auditSources(lexicon, { concurrency = 4, ...requestOptions } = {}) {
  if (!Number.isInteger(concurrency) || concurrency < 1 || concurrency > 8) throw new Error('concurrency must be an integer from 1 to 8');
  const sources = collectSources(lexicon);
  const results = new Array(sources.length);
  let next = 0;
  await Promise.all(Array.from({ length: Math.min(concurrency, sources.length) }, async () => {
    while (next < sources.length) {
      const index = next++;
      const source = sources[index];
      const { body, ...response } = await checkUrl(source.url, requestOptions);
      const probe = contentProbe(source.url);
      const evidence = probe ? parseEvidence(probe, await checkUrl(probe.url, requestOptions)) : null;
      results[index] = { ...source, ...response, ...(evidence ? { contentEvidence: evidence } : {}) };
    }
  }));
  const summary = {};
  const contentSummary = {};
  for (const result of results) {
    summary[result.status] = (summary[result.status] ?? 0) + 1;
    if (result.contentEvidence) contentSummary[result.contentEvidence.status] = (contentSummary[result.contentEvidence.status] ?? 0) + 1;
  }
  return { checkedAt: new Date().toISOString(), lexiconVersion: lexicon.version, sourceCount: sources.length, summary, contentSummary, scope: 'HTTP reachability and selected official API term-presence evidence only; not factual, licensing, clinical, or comprehension approval.', results };
}

async function main() {
  const args = process.argv.slice(2);
  let input = fileURLToPath(new URL('../data/health.json', import.meta.url));
  let output;
  let concurrency = 4;
  let timeoutMs = 12000;
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    const value = args[++i];
    if (!value) throw new Error(`Missing value for ${arg}`);
    if (arg === '--input') input = resolve(value);
    else if (arg === '--output') output = resolve(value);
    else if (arg === '--concurrency') concurrency = Number(value);
    else if (arg === '--timeout-ms') timeoutMs = Number(value);
    else throw new Error(`Unknown option: ${arg}`);
  }
  if (!Number.isInteger(timeoutMs) || timeoutMs < 100 || timeoutMs > 60000) throw new Error('timeout-ms must be an integer from 100 to 60000');
  const raw = await readFile(input, 'utf8');
  const report = await auditSources(JSON.parse(raw), { concurrency, timeoutMs });
  report.inputSha256 = createHash('sha256').update(raw).digest('hex');
  const json = `${JSON.stringify(report, null, 2)}\n`;
  if (output) {
    await mkdir(dirname(output), { recursive: true });
    await writeFile(output, json);
    console.error(`Audited ${report.sourceCount} source URLs: ${JSON.stringify(report.summary)}. Report: ${output}`);
  } else process.stdout.write(json);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => { console.error(error.message); process.exitCode = 1; });
}
