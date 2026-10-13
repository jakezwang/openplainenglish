const STORE_RULES = Object.freeze({
  chrome: { host: 'chromewebstore.google.com', path: /^\/detail\/(?:[^/]+\/)?[a-p]{32}\/?$/u },
  edge: { host: 'microsoftedge.microsoft.com', path: /^\/addons\/detail\/(?:[^/]+\/)?[a-p]{32}\/?$/u },
});

function officialHttpsUrl(value, host) {
  if (typeof value !== 'string') return null;
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' || url.hostname !== host || url.username || url.password || url.port || url.search || url.hash) return null;
    return url;
  } catch { return null; }
}

function validReviewDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/u.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

/** Config is an editorial record: only set a store URL after checking its live listing. */
export function normalizeInstallConfig(input) {
  if (!input || typeof input !== 'object' || input.schemaVersion !== 1) throw new TypeError('Unsupported installation configuration.');
  const stores = {};
  for (const [browser, rules] of Object.entries(STORE_RULES)) {
    const configured = input.stores?.[browser];
    const url = officialHttpsUrl(configured?.url, rules.host);
    stores[browser] = url && rules.path.test(url.pathname) && validReviewDate(configured?.verifiedAt)
      ? { url: url.href, verifiedAt: configured.verifiedAt }
      : { url: null, verifiedAt: null };
  }
  const version = input.release?.version;
  const zip = officialHttpsUrl(input.release?.zipUrl, 'github.com');
  const release = typeof version === 'string' && /^\d+\.\d+\.\d+$/u.test(version)
    && zip?.pathname === `/jakezwang/openplainenglish/releases/download/v${version}/openplainenglish-${version}.zip`
    ? { version, zipUrl: zip.href }
    : null;
  return { stores, release };
}

/** Edge can use a verified Chrome Web Store listing when no native listing exists. */
export function selectInstallStores(input) {
  const { stores } = normalizeInstallConfig(input);
  return {
    chrome: { ...stores.chrome, source: stores.chrome.url ? 'chrome' : null },
    edge: stores.edge.url
      ? { ...stores.edge, source: 'edge' }
      : { ...stores.chrome, source: stores.chrome.url ? 'chrome' : null },
  };
}

function configurePage(input) {
  const config = normalizeInstallConfig(input);
  const stores = selectInstallStores(input);
  let available = 0;
  for (const browser of Object.keys(STORE_RULES)) {
    const store = stores[browser];
    const link = document.getElementById(`${browser}-store`);
    const pending = document.getElementById(`${browser}-pending`);
    if (store.url) {
      link.href = store.url;
      link.hidden = false;
      pending.hidden = true;
      available++;
    } else {
      link.removeAttribute('href');
      link.hidden = true;
      pending.hidden = false;
    }
  }
  if (stores.edge.url && stores.edge.source === 'chrome') {
    document.getElementById('edge-source').textContent = 'CHROME WEB STORE';
    document.getElementById('edge-description').textContent = '通过 Chrome Web Store 安装。Edge 可能先请你允许来自其他商店的扩展。';
  }
  if (available) {
    document.getElementById('availability').textContent = '通过下方官方商店入口安装，最后一步由浏览器确认。';
    document.getElementById('store-description').textContent = '选择已开放的官方商店入口，查看扩展并确认添加。';
    document.getElementById('demo-link').classList.replace('primary', 'secondary');
  }
  if (config.release) {
    document.getElementById('zip-download').href = config.release.zipUrl;
    document.getElementById('release-version').textContent = `v${config.release.version}`;
  }
}

function setBrowser(browser, { focus = false } = {}) {
  const edge = browser === 'edge';
  for (const option of ['chrome', 'edge']) {
    const tab = document.getElementById(`tab-${option}`);
    const selected = option === browser;
    tab.setAttribute('aria-selected', String(selected));
    tab.tabIndex = selected ? 0 : -1;
    if (selected && focus) tab.focus();
  }
  document.getElementById('manual-panel').setAttribute('aria-labelledby', `tab-${browser}`);
  document.getElementById('manager-address').value = edge ? 'edge://extensions' : 'chrome://extensions';
  document.getElementById('copy-status').textContent = '';
  document.getElementById('load-instructions').textContent = `在 ${edge ? 'Edge' : 'Chrome'} 扩展管理页开启「开发者模式」，点击「加载已解压的扩展程序」，选择包含 manifest.json 的文件夹。确认版本后，可将扩展固定到工具栏。`;
}

async function boot() {
  const tabs = ['chrome', 'edge'];
  for (const browser of tabs) {
    const tab = document.getElementById(`tab-${browser}`);
    tab.addEventListener('click', () => setBrowser(browser));
    tab.addEventListener('keydown', (event) => {
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault();
      const next = event.key === 'Home' ? 'chrome' : event.key === 'End' ? 'edge' : tabs[1 - tabs.indexOf(browser)];
      setBrowser(next, { focus: true });
    });
  }
  document.getElementById('copy-address').addEventListener('click', async () => {
    const address = document.getElementById('manager-address');
    const button = document.getElementById('copy-address');
    const value = address.value;
    button.disabled = true;
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
      await navigator.clipboard.writeText(value);
      document.getElementById('copy-status').textContent = `已复制 ${value}。粘贴到浏览器地址栏，再按 Enter。`;
    } catch {
      address.focus();
      address.select();
      address.setSelectionRange(0, address.value.length);
      document.getElementById('copy-status').textContent = '地址已选中。按 Ctrl+C（Mac 为 ⌘C）复制，再粘贴到浏览器地址栏。';
    } finally { button.disabled = false; }
  });
  try {
    const response = await fetch(new URL('./install-config.json', import.meta.url));
    if (!response.ok) throw new Error('Installation configuration unavailable');
    configurePage(await response.json());
  } catch {
    document.getElementById('availability').textContent = '商店入口暂不可用。你可以先体验网页版，或展开下方手动安装。';
  }
}

if (typeof document !== 'undefined') boot();
