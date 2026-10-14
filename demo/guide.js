import { createReader } from '../src/content/controller.js';
import { normalizePreferences, validatePreferences } from '../src/shared/preferences.js';

const COPY = {
  en: { skip:'Skip to practice', language:'Interface language', eyebrow:'ONE MINUTE, AT YOUR PACE', title:'Keep control of the words.', intro:'Practise on this invented example. Nothing on another page will change, and nothing is sent.', saved:'You have completed this guide on this device. You can practise again.', steps:'Four small steps', stepStart:'Start plain reading.', stepOpen:'Select a marked phrase. Compare its original words in the explanation.', stepRestore:'In that explanation, choose “Restore this occurrence.”', stepStop:'Choose “Restore original” below to turn reading off.', sample:'INVENTED PRACTICE TEXT', sampleNote:'This example gives no measurements, diagnosis or advice about anyone.', start:'Start plain reading', stop:'Restore original', loading:'Loading the local glossary…', finish:'Finish and remember on this device', limitTitle:'Help with selected phrases.', limits:'Plain reading uses reviewed phrase pairs. It does not rewrite every sentence or understand every context. “Explain terms” keeps original wording with explanations. You decide when to start and stop.', access:'Keyboard: Tab reaches marked phrases, Enter opens an explanation, and Escape closes it. A new page always starts with reading off.', options:'Open the glossary & settings →', privacy:'Only your language choice and completion setting can be saved locally. Your practice actions are not recorded or uploaded.', ready:'Start when you are ready. This changes only the practice text.', open:'Select one of the marked phrases above to see its original words.', restore:'Find “Restore this occurrence” in the open explanation. The other occurrence will stay in plain wording.', stopHint:'One occurrence is original again. Now choose “Restore original” to stop reading.', done:'All original words are back. You have practised all four controls.', stopped:'Original wording restored. Start again whenever you want to complete the practice.', savedNow:'Completed and remembered on this device. Other pages remain unchanged.', failed:'The guide could not load. Reload this page to try again.', saveFailed:'The practice is complete, but the setting could not be saved. You can try again.', progress:(n)=>`${n} of 4 steps completed.` },
  'zh-CN': { skip:'跳到演练', language:'界面语言', eyebrow:'一分钟，按自己的节奏', title:'文字怎么变，由你掌控。', intro:'用这段虚构文字练习。不会改变其他网页，也不会发送任何内容。', saved:'你已在本机完成演练，仍可重新练习。', steps:'四个小步骤', stepStart:'开启白话阅读。', stepOpen:'点击标记的词语，在解释中比较原词。', stepRestore:'在解释中选择“仅此处恢复原词”。', stepStop:'点击下方“恢复原文”，关闭阅读。', sample:'虚构的练习文字', sampleNote:'示例不包含任何人的测量结果、诊断或建议。', start:'开启白话阅读', stop:'恢复原文', loading:'正在加载本机词库…', finish:'完成，并在本机记住', limitTitle:'帮助理解部分词语。', limits:'白话阅读只使用核对过的替换词，不改写每个句子，也不理解所有语境。“解释词语”模式保留原文并提供释义。何时开启或关闭，由你决定。', access:'键盘：Tab 移到标记词语，Enter 打开解释，Escape 关闭解释。新网页始终不会自动开启阅读。', options:'打开词库与设置 →', privacy:'只会在本机保存语言选择与完成状态，不记录或上传练习操作。', ready:'准备好后点击开始，只会改变上方练习文字。', open:'点击上方任一标记词语，查看原词。', restore:'在解释中找到“仅此处恢复原词”。另一处仍会显示白话用词。', stopHint:'一处已经恢复原词，现在点击“恢复原文”关闭阅读。', done:'原文已全部恢复，你已练习四个操作。', stopped:'原文已恢复，需要时可以重新开始演练。', savedNow:'完成状态已保存在本机，其他网页未改变。', failed:'无法加载演练，请重新加载页面后再试。', saveFailed:'演练已完成，但无法保存设置，可以重试。', progress:(n)=>`已完成 ${n} / 4 步。` },
};

const extensionRuntime = () => {
  const runtime = globalThis.browser?.runtime || globalThis.chrome?.runtime;
  return runtime?.id && runtime.sendMessage && runtime.getURL ? runtime : null;
};
async function readPreferences() {
  const runtime = extensionRuntime();
  if (runtime) { const response = await runtime.sendMessage({ type:'OPE_GET_PREFERENCES' }); if (!response?.ok) throw new Error(); return normalizePreferences(response.preferences); }
  try { return normalizePreferences(JSON.parse(localStorage.getItem('opeDemoPreferences') || 'null')); } catch { return normalizePreferences(); }
}
async function savePreferences(patch) {
  const clean = validatePreferences(patch), runtime = extensionRuntime();
  if (runtime) { const response = await runtime.sendMessage({ type:'OPE_SET_PREFERENCES', preferences:clean }); if (!response?.ok) throw new Error(); return normalizePreferences(response.preferences); }
  const current = await readPreferences(), next = { ...current, ...clean };
  localStorage.setItem('opeDemoPreferences', JSON.stringify(next));
  return next;
}

export async function initializeGuide(document) {
  const $ = (id) => document.getElementById(id);
  let preferences = await readPreferences().catch(() => normalizePreferences());
  let reader, ready = false, saving = false;
  let progress = { started:false, opened:false, restored:false, stopped:false };
  let enabled = false, hint = 'loading';
  const original = $('practice-text').textContent;
  const copy = () => COPY[preferences.language];
  function render() {
    const strings = copy();
    // The reader observes inherited language. Rewriting an unchanged root
    // attribute would schedule a full rescan after every state notification.
    if (document.documentElement.lang !== preferences.language) document.documentElement.lang = preferences.language;
    $('guide-language').value = preferences.language;
    for (const element of document.querySelectorAll('[data-copy]')) if (element.textContent !== strings[element.dataset.copy]) element.textContent = strings[element.dataset.copy];
    const steps = [progress.started, progress.opened, progress.restored, progress.stopped];
    for (const [index, id] of ['start','open','restore','stop'].entries()) {
      const element = $(`step-${id}`);
      element.classList.toggle('done', steps[index]);
      element.classList.toggle('current', !steps[index] && (index === 0 || steps[index-1]));
      if (!steps[index] && (index === 0 || steps[index-1])) { if (element.getAttribute('aria-current') !== 'step') element.setAttribute('aria-current','step'); }
      else if (element.hasAttribute('aria-current')) element.removeAttribute('aria-current');
    }
    $('guide-progress').textContent = strings.progress(steps.filter(Boolean).length);
    $('guide-hint').textContent = strings[hint];
    $('guide-saved').hidden = !preferences.guideCompleted;
    $('start-guide').disabled = !ready || enabled || saving;
    $('stop-guide').disabled = !enabled || saving;
    $('finish-guide').hidden = !progress.stopped;
    $('finish-guide').disabled = saving;
  }
  function onStateChange(state) {
    enabled = state.enabled;
    if (progress.opened && state.enabled && state.mode === 'plain' && state.count === 2 && state.replacedCount === 1) { progress.restored = true; hint = 'stopHint'; }
    render();
  }
  const runtime = extensionRuntime();
  for (const id of ['guide-back','guide-options']) $(id).href = runtime ? runtime.getURL('options.html') : './preview.html?view=options';
  render();
  $('start-guide').addEventListener('click', () => {
    if (!ready || enabled || saving) return;
    progress = { started:true, opened:false, restored:false, stopped:false };
    hint = 'open'; $('guide-error').hidden = true;
    reader.enable({ mode:'plain' }); render();
  });
  $('stop-guide').addEventListener('click', () => {
    if (!enabled) return;
    reader.disable();
    progress.stopped = progress.started && progress.opened && progress.restored && $('practice-text').textContent === original;
    hint = progress.stopped ? 'done' : 'stopped'; render();
    (progress.stopped ? $('finish-guide') : $('start-guide')).focus();
  });
  $('finish-guide').addEventListener('click', async () => {
    if (!progress.stopped || enabled || saving) return;
    saving = true; render(); $('guide-error').hidden = true;
    try { preferences = await savePreferences({ guideCompleted:true }); hint = 'savedNow'; }
    catch { $('guide-error').textContent = copy().saveFailed; $('guide-error').hidden = false; }
    finally { saving = false; render(); }
  });
  $('guide-language').addEventListener('change', async () => {
    const language = $('guide-language').value;
    if (!Object.hasOwn(COPY, language)) return;
    preferences = { ...preferences, language }; render(); reader?.setPreferences({ language });
    try { preferences = await savePreferences({ language }); render(); }
    catch { $('guide-error').textContent = copy().saveFailed; $('guide-error').hidden = false; }
  });
  try {
    const response = await fetch(runtime ? runtime.getURL('data/health.json') : new URL('../data/health.json', import.meta.url));
    if (!response.ok) throw new Error();
    const data = await response.json();
    if (!Array.isArray(data.entries) || !data.entries.some((entry) => entry.id === 'hypertension')) throw new Error();
    reader = createReader({ document, entries:data.entries, preferences:{ ...preferences, mode:'plain', includeFrames:false, includeShadowRoots:false }, onStateChange, onExplanationOpen(entry) {
      if (enabled && progress.started && entry.id === 'hypertension') { progress.opened = true; hint = progress.restored ? 'stopHint' : 'restore'; render(); }
    } });
    ready = true; hint = 'ready'; render();
    document.defaultView.addEventListener('pagehide', () => reader.destroy(), { once:true });
  } catch { $('guide-error').textContent = copy().failed; $('guide-error').hidden = false; render(); }
  return { destroy() { reader?.destroy(); } };
}

if (typeof document !== 'undefined') initializeGuide(document);
