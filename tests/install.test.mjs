import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeInstallConfig, selectInstallStores } from '../demo/install.js';

const id = 'a'.repeat(32);
const base = {
  schemaVersion: 1,
  release: { version: '0.2.0', zipUrl: 'https://github.com/jakezwang/openplainenglish/releases/download/v0.2.0/openplainenglish-0.2.0.zip' },
  stores: {
    chrome: { url: null, verifiedAt: null },
    edge: { url: null, verifiedAt: null },
  },
};

test('unverified or unavailable store listings stay disabled; release ZIP stays a separate fallback', () => {
  const normalized = normalizeInstallConfig(base);
  assert.equal(normalized.stores.chrome.url, null);
  assert.equal(normalized.stores.edge.url, null);
  assert.equal(normalized.release.zipUrl, base.release.zipUrl);
  assert.equal(normalizeInstallConfig({ ...base, stores: { chrome: { url: `https://chromewebstore.google.com/detail/example/${id}` } } }).stores.chrome.url, null);
});

test('store links require the correct official HTTPS host, listing path and recorded review date', () => {
  const chrome = `https://chromewebstore.google.com/detail/example/${id}`;
  const edge = `https://microsoftedge.microsoft.com/addons/detail/example/${id}`;
  const result = normalizeInstallConfig({ ...base, stores: {
    chrome: { url: chrome, verifiedAt: '2026-10-13' },
    edge: { url: edge, verifiedAt: '2026-10-13' },
  } });
  assert.equal(result.stores.chrome.url, chrome);
  assert.equal(result.stores.edge.url, edge);
  for (const url of [
    chrome.replace('https:', 'http:'),
    chrome.replace('google.com', 'google.com.evil.example'),
    chrome.replace('https://', 'https://user:password@'),
    chrome.replace('google.com/', 'google.com:444/'),
    'javascript:alert(1)',
    'https://chromewebstore.google.com/',
    `${chrome}?redirect=https://evil.example`,
    `${chrome}#javascript:alert(1)`,
    edge,
  ]) assert.equal(normalizeInstallConfig({ ...base, stores: { chrome: { url, verifiedAt: '2026-10-13' } } }).stores.chrome.url, null, url);
  assert.equal(normalizeInstallConfig({ ...base, stores: { chrome: { url: chrome, verifiedAt: '2026-02-31' } } }).stores.chrome.url, null);
});

test('release config cannot redirect ZIP fallback to another repository or mismatched version', () => {
  for (const zipUrl of [
    base.release.zipUrl.replace('jakezwang/', 'someone/'),
    base.release.zipUrl.replace('github.com', 'github.com.evil.example'),
    base.release.zipUrl.replace('v0.2.0/', 'v0.1.0/'),
    `${base.release.zipUrl}?redirect=elsewhere`,
  ]) assert.equal(normalizeInstallConfig({ ...base, release: { ...base.release, zipUrl } }).release, null);
  assert.throws(() => normalizeInstallConfig({ schemaVersion: 2 }), TypeError);
});

test('Edge uses a verified Chrome listing as fallback and prefers its own verified listing', () => {
  const chrome = { url: `https://chromewebstore.google.com/detail/example/${id}`, verifiedAt: '2026-10-13' };
  const edge = { url: `https://microsoftedge.microsoft.com/addons/detail/example/${id}`, verifiedAt: '2026-10-13' };
  const fallback = selectInstallStores({ ...base, stores: { ...base.stores, chrome } });
  assert.equal(fallback.edge.url, chrome.url);
  assert.equal(fallback.edge.source, 'chrome');
  assert.equal(fallback.edge.verifiedAt, chrome.verifiedAt);
  const native = selectInstallStores({ ...base, stores: { chrome, edge } });
  assert.equal(native.edge.url, edge.url);
  assert.equal(native.edge.source, 'edge');
  const unverified = selectInstallStores({ ...base, stores: { chrome: { ...chrome, verifiedAt: null }, edge: base.stores.edge } });
  assert.equal(unverified.edge.url, null);
});
