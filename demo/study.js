import { createReader } from '../src/content/controller.js';

export const STUDY_PASSAGES = Object.freeze([
  { id: 1, text: 'A fictional leaflet mentions hypertension. It gives no measurements for any reader.', question: '这里的词语表示什么？这段话能判断读者是否患有这种情况吗？ / What does the term mean? Does the passage establish that the reader has it?' },
  { id: 2, text: 'A teaching example discusses blood glucose. No test result is included.', question: '这里在讨论血液中的什么？ / What substance in the blood is being discussed?' },
  { id: 3, text: 'An invented article calls a condition a chronic disease. It does not describe how severe it is.', question: '这个说法主要描述持续时间，还是严重程度？为什么？ / Does the phrase mainly describe duration or severity? Why?' },
  { id: 4, text: 'A fictional note mentions dyspnea. It gives no explanation of what caused the symptom.', question: '这个症状用日常语言怎么说？这段话有说明病因吗？ / What is the symptom in everyday words? Does the passage identify its cause?' },
  { id: 5, text: 'A teaching report describes a benign tumor. It includes no advice about treatment.', question: '这个说法是否表示癌性生长？它能保证完全无害或不需要治疗吗？ / Does this mean a cancerous growth? Does it guarantee harmlessness or no need for treatment?' },
  { id: 6, text: 'An invented chart compares the mortality rate in two fictional groups over one year.', question: '图表比较的是哪一种比率？是否只是死亡人数？ / What kind of rate is compared? Is that simply a count of deaths?' },
]);
const conditions = ['original', 'annotate', 'plain'];
export function studyPlan(sequence) {
  if (!Number.isInteger(sequence) || sequence < 1 || sequence > 6) throw new TypeError('Choose sequence 1–6.');
  const order = sequence > 3 ? [...STUDY_PASSAGES].reverse() : STUDY_PASSAGES;
  return order.map((passage, index) => ({ ...passage, condition: conditions[(index + (sequence - 1) % 3) % 3] }));
}

async function boot() {
  const $ = (id) => document.getElementById(id);
  let reader, version, session, plan, current = 0, started = 0, originalConsulted = false, showingOriginal = false, explanationOpens = 0;
  const names = { original: '原文 / Original text', annotate: '词典式解释 / Explain terms', plain: '原位白话 / Plain reading' };
  const exportText = () => JSON.stringify({ schemaVersion: 1, protocol: 'ope-three-condition-1', glossaryVersion: version, participantCode: session.code, sequence: session.sequence, consent: true, completed: session.results.length === 6, results: session.results }, null, 2);
  function previewResults() { $('result-json').value = exportText(); $('result-review').hidden = false; }
  function showPassage() {
    reader.disable();
    originalConsulted = false; showingOriginal = false; explanationOpens = 0;
    const item = plan[current];
    $('passage').textContent = item.text;
    $('progress').textContent = `${current + 1} / 6`;
    $('condition-heading').textContent = names[item.condition];
    $('condition-help').textContent = item.condition === 'original' ? '按原文阅读；本段未开启辅助。 / Read without assistance.' : item.condition === 'annotate' ? '保留原词，点击标记可查解释。 / Original words with optional explanations.' : '部分词语在原处替换，点击可对照原文。 / Selected words change in place; select them to compare originals.';
    $('question').textContent = item.question;
    $('answer').value = ''; $('skip').checked = false; $('confidence').value = '';
    $('interruption').checked = false; $('facilitator-notes').value = '';
    $('original').disabled = item.condition === 'original';
    $('original').textContent = '查看原文 / View original';
    $('next').textContent = current === 5 ? '完成 / Finish' : '下一段 / Next passage';
    $('result-review').hidden = true;
    if (item.condition !== 'original') reader.enable({ mode: item.condition });
    $('condition-heading').tabIndex = -1; $('condition-heading').focus();
    started = performance.now();
  }
  try {
    const response = await fetch(new URL('../data/health.json', import.meta.url));
    if (!response.ok) throw new Error();
    const data = await response.json(); version = data.version;
    reader = createReader({ document, entries: data.entries, onExplanationOpen() { explanationOpens++; }, onStateChange(state) {
      $('reading-count').textContent = state.enabled ? `${state.replacedCount} 处替换 / replaced · ${state.annotatedCount} 处解释 / explained` : '原文 / Original wording';
      $('practice-count').textContent = $('reading-count').textContent;
    } });
    $('participant').value = `P-${crypto.randomUUID().slice(0, 8)}`;
    for (const mode of ['plain', 'annotate', 'restore']) {
      $(`practice-${mode}`).disabled = false;
      $(`practice-${mode}`).addEventListener('click', () => mode === 'restore' ? reader.disable() : reader.enable({ mode }));
    }
    $('start').disabled = false; $('start').textContent = '开始六段试测 / Begin';
  } catch { $('status').textContent = '词库未加载，无法开始。请重新加载。 / Glossary unavailable. Reload to try again.'; return; }
  $('setup-form').addEventListener('submit', (event) => {
    event.preventDefault();
    if (!$('consent').checked || !/^[A-Za-z0-9_-]{1,40}$/u.test($('participant').value)) return;
    const sequence = Number($('sequence').value);
    plan = studyPlan(sequence); session = { code: $('participant').value, sequence, results: [] };
    reader.disable(); $('practice').hidden = true;
    $('setup').hidden = true; $('session').hidden = false; $('result-tools').hidden = false;
    showPassage();
  });
  $('original').addEventListener('click', () => {
    if (!session) return;
    originalConsulted = true; showingOriginal = !showingOriginal;
    if (showingOriginal) reader.disable(); else reader.enable({ mode: plan[current].condition });
    $('original').textContent = showingOriginal ? '返回分配的模式 / Return to assigned mode' : '查看原文 / View original';
  });
  $('answer-form').addEventListener('submit', (event) => {
    event.preventDefault();
    const skipped = $('skip').checked, answer = $('answer').value.trim(), confidence = Number($('confidence').value);
    if (!skipped && (!answer || confidence < 1 || confidence > 5)) { $('status').textContent = '请填写答案和信心，或选择跳过。 / Answer and select confidence, or skip.'; $('answer').focus(); return; }
    const item = plan[current];
    session.results.push({ passage: item.id, condition: item.condition, answer: skipped ? '' : answer.slice(0, 1000), skipped, seconds: Math.round((performance.now() - started) / 100) / 10, confidence: skipped ? null : confidence, originalConsulted, explanationOpens, interrupted: $('interruption').checked, facilitatorNotes: $('facilitator-notes').value.trim().slice(0, 500) });
    $('status').textContent = '';
    current++;
    if (current < plan.length) showPassage();
    else {
      reader.disable(); $('session').hidden = true; $('complete').hidden = false; $('stop').hidden = true;
      $('complete').tabIndex = -1; $('complete').focus(); previewResults();
    }
  });
  $('review-results').addEventListener('click', () => { if (session) previewResults(); });
  $('stop').addEventListener('click', () => {
    if (!session) return;
    reader.disable(); $('session').hidden = true; $('stop').hidden = true; previewResults();
    $('status').textContent = '已停止。当前未提交的答案不在导出中；已完成题目可检查后下载。 / Stopped. Only completed tasks are included.';
  });
  $('download-results').addEventListener('click', () => {
    if (!session || $('result-review').hidden) return;
    try {
      const url = URL.createObjectURL(new Blob([$('result-json').value], { type: 'application/json' }));
      const link = document.createElement('a'); link.href = url; link.download = `openplainenglish-study-${session.code}.json`;
      document.body.append(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
      $('status').textContent = '已准备下载。没有上传结果。 / Download prepared; no results uploaded.';
    } catch { $('result-json').focus(); $('result-json').select(); $('status').textContent = '无法下载，已选中文字，可手动复制。 / Download unavailable; copy the selected text.'; }
  });
}
if (typeof document !== 'undefined') boot();
