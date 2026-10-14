import { createReader } from '../src/content/controller.js';
import { DOCUMENT_LIMITS, extractPageText, validateDocumentFile, validateImageSize } from '../src/core/documents.js';

export function createDocumentWorkshop({ document, fetcher = globalThis.fetch, loadPDF = () => import('../vendor/pdf/pdf.mjs'), loadOCR = () => import('../vendor/ocr/tesseract.esm.min.js') }) {
  const $ = (selector) => document.querySelector(selector);
  const view = document.defaultView;
  const status = $('#document-status');
  const input = $('#extracted-text');
  const output = $('#document-reading');
  let generation = 0, copyGeneration = 0, reader, entries, pdf, loadingTask, renderTask, textLayer, worker, imageURL;
  let busy = false, sourceName = '';
  const localURL = (relative) => new URL(relative, import.meta.url).href;
  function readingReset() {
    reader?.destroy(); reader = undefined; output.textContent = '';
    $('#restore-document').disabled = true; $('#copy-document').disabled = true;
    $('#document-count').textContent = 'Waiting for checked text';
  }
  function invalidateText() {
    copyGeneration++;
    readingReset(); $('#verified-text').checked = false;
    $('#read-document').disabled = true;
    $('#copy-checked').disabled = !input.value || busy;
    $('#document-copy-fallback').hidden = true; $('#document-copy-text').value = '';
  }
  function setBusy(value) {
    busy = value;
    $('#cancel-document').disabled = !value;
    $('#page-number').disabled = value;
    $('#ocr-page').disabled = value;
    $('#verified-text').disabled = value || !input.value.trim();
    input.disabled = value || !sourceName;
    $('#read-document').disabled = value || !entries || !input.value.trim() || !$('#verified-text').checked;
    $('#copy-checked').disabled = value || !input.value;
  }
  function stopWork({ releasePDF = false } = {}) {
    generation++; copyGeneration++;
    renderTask?.cancel(); renderTask = undefined;
    textLayer?.cancel(); textLayer = undefined;
    const previousWorker = worker; worker = undefined;
    if (previousWorker) void previousWorker.terminate().catch(() => {});
    if (releasePDF) {
      const previousTask = loadingTask; loadingTask = undefined; pdf = undefined;
      if (previousTask) void previousTask.destroy().catch(() => {});
    }
    return generation;
  }
  function clear() {
    stopWork({ releasePDF: true });
    if (imageURL) view.URL.revokeObjectURL(imageURL); imageURL = undefined;
    sourceName = ''; input.value = ''; invalidateText();
    $('#document-file').value = ''; $('#source-image').removeAttribute('src'); $('#source-image').hidden = true;
    $('#pdf-page').hidden = true; $('#pdf-text-layer').replaceChildren();
    $('#pdf-canvas').width = 1; $('#pdf-canvas').height = 1;
    $('#page-number').replaceChildren(); $('#page-label').hidden = true; $('#ocr-page').hidden = true;
    $('#source-label').textContent = 'No document'; setBusy(false);
    status.textContent = 'Cleared. Document text is no longer retained by this page.';
  }
  function setExtracted(text, message) {
    if (text.length > DOCUMENT_LIMITS.characters) throw new Error('Extracted text exceeds 20,000 characters. Use a smaller page or image.');
    input.value = text; invalidateText(); setBusy(false);
    status.textContent = message; $('#verified-text').disabled = !text.trim();
  }
  async function renderPage(number) {
    if (!pdf) return;
    const current = stopWork();
    input.value = ''; invalidateText(); setBusy(true);
    $('#pdf-text-layer').replaceChildren(); $('#ocr-page').hidden = true;
    status.textContent = `Reading PDF page ${number}…`;
    try {
      const page = await pdf.getPage(number);
      if (current !== generation) return;
      const api = await loadPDF();
      if (current !== generation) return;
      const base = page.getViewport({ scale: 1 });
      const available = Math.max(240, Math.min(740, $('#source-preview').clientWidth - 32 || 560));
      const viewport = page.getViewport({ scale: Math.min(1.5, available / base.width) });
      validateImageSize(viewport.width, viewport.height);
      const canvas = $('#pdf-canvas'); canvas.width = Math.ceil(viewport.width); canvas.height = Math.ceil(viewport.height);
      const pageElement = $('#pdf-page'); pageElement.hidden = false;
      pageElement.style.width = `${viewport.width}px`; pageElement.style.height = `${viewport.height}px`;
      pageElement.style.setProperty('--scale-factor', viewport.scale);
      pageElement.style.setProperty('--total-scale-factor', viewport.scale);
      pageElement.style.setProperty('--user-unit', '1');
      renderTask = page.render({ canvasContext: canvas.getContext('2d'), viewport });
      await renderTask.promise;
      if (current !== generation) return;
      const content = await page.getTextContent();
      if (current !== generation) return;
      const extracted = extractPageText(content.items);
      textLayer = new api.TextLayer({ textContentSource: content, container: $('#pdf-text-layer'), viewport });
      await textLayer.render();
      if (current !== generation) return;
      $('#source-label').textContent = `${sourceName} · page ${number}/${pdf.numPages}`;
      $('#ocr-page').hidden = Boolean(extracted.text.trim());
      setExtracted(extracted.text, extracted.text.trim() ? `${extracted.positions.length} positioned text items extracted. ${extracted.complexLayout ? 'Complex layout detected. ' : ''}Check reading order and all wording against the original before continuing.` : 'No selectable text on this page. Choose “Recognize this scanned page” for local English OCR.');
    } catch (error) { if (current === generation) { setBusy(false); status.textContent = `Page unavailable: ${error.message}`; } }
  }
  async function recognize(source) {
    const current = stopWork();
    input.value = ''; invalidateText(); setBusy(true);
    status.textContent = 'Loading local English OCR…';
    let ownWorker;
    try {
      const ocr = await loadOCR();
      const createWorker = ocr.createWorker || ocr.default?.createWorker;
      if (current !== generation) return;
      ownWorker = await createWorker('eng', 1, {
        workerPath: localURL('../vendor/ocr/worker.min.js'),
        corePath: localURL('../vendor/ocr/core'), langPath: localURL('../vendor/ocr/lang'),
        workerBlobURL: false, cacheMethod: 'none',
        logger: (event) => { if (current === generation) status.textContent = `Local OCR: ${event.status} ${Math.round((event.progress || 0) * 100)}%`; },
      });
      if (current !== generation) { await ownWorker.terminate(); return; }
      worker = ownWorker;
      const { data } = await ownWorker.recognize(source);
      if (current !== generation) return;
      setExtracted(data.text || '', `English OCR complete. Engine confidence: ${Math.round(data.confidence || 0)}% (not an accuracy guarantee). Check every word, number, unit and “not” before continuing.`);
    } catch (error) { if (current === generation) { setBusy(false); status.textContent = `OCR unavailable: ${error.message}. You can type corrected text from the visible original.`; } }
    finally { if (worker === ownWorker) worker = undefined; if (ownWorker) void ownWorker.terminate().catch(() => {}); }
  }
  async function recognizePDFPage() {
    if (!pdf || busy) return;
    const current = stopWork();
    input.value = ''; invalidateText(); setBusy(true);
    status.textContent = 'Preparing a higher-resolution page for local OCR…';
    try {
      const page = await pdf.getPage(Number($('#page-number').value));
      if (current !== generation) return;
      const base = page.getViewport({ scale: 1 });
      const scale = Math.min(3, Math.sqrt((DOCUMENT_LIMITS.pixels - 10000) / (base.width * base.height)));
      const viewport = page.getViewport({ scale });
      const canvas = document.createElement('canvas');
      canvas.width = Math.ceil(viewport.width); canvas.height = Math.ceil(viewport.height);
      validateImageSize(canvas.width, canvas.height);
      renderTask = page.render({ canvasContext: canvas.getContext('2d'), viewport });
      await renderTask.promise;
      if (current !== generation) return;
      await recognize(canvas);
    } catch (error) { if (current === generation) { setBusy(false); status.textContent = `OCR page unavailable: ${error.message}`; } }
  }
  async function openFile(file) {
    clear();
    const current = generation;
    try {
      const kind = validateDocumentFile(file);
      sourceName = file.name || 'Document'; $('#source-label').textContent = sourceName;
      setBusy(true); status.textContent = 'Opening locally…';
      if (kind === 'pdf') {
        const [api, bytes] = await Promise.all([loadPDF(), file.arrayBuffer()]);
        if (current !== generation) return;
        api.GlobalWorkerOptions.workerSrc = localURL('../vendor/pdf/pdf.worker.mjs');
        loadingTask = api.getDocument({ data: new Uint8Array(bytes), isEvalSupported: false, maxImageSize: DOCUMENT_LIMITS.pixels, stopAtErrors: true,
          cMapUrl: localURL('../vendor/pdf/cmaps/'), cMapPacked: true, standardFontDataUrl: localURL('../vendor/pdf/standard_fonts/'), wasmUrl: localURL('../vendor/pdf/wasm/'), iccUrl: localURL('../vendor/pdf/iccs/'), useSystemFonts: false });
        const loadedPDF = await loadingTask.promise;
        if (current !== generation) return;
        pdf = loadedPDF;
        if (pdf.numPages > DOCUMENT_LIMITS.pages) throw new Error('Use a PDF with at most 100 pages.');
        $('#page-label').hidden = false;
        for (let number = 1; number <= pdf.numPages; number++) { const option = document.createElement('option'); option.value = String(number); option.textContent = String(number); $('#page-number').append(option); }
        await renderPage(1);
      } else {
        imageURL = view.URL.createObjectURL(file);
        const image = $('#source-image'); image.src = imageURL; image.hidden = false;
        await image.decode();
        if (current !== generation) return;
        validateImageSize(image.naturalWidth, image.naturalHeight);
        await recognize(image);
      }
    } catch (error) { if (current === generation) { stopWork({ releasePDF: true }); setBusy(false); status.textContent = `Cannot open this file: ${error.message}`; } }
  }
  async function openSample(filename, type) {
    clear(); const current = generation; setBusy(true); status.textContent = 'Loading invented example…';
    try {
      const response = await fetcher(localURL(`fixtures/${filename}`));
      if (!response.ok) throw new Error('Sample unavailable.');
      const bytes = await response.arrayBuffer();
      if (current !== generation) return;
      await openFile(new view.File([bytes], filename, { type }));
    } catch (error) { if (current === generation) { setBusy(false); status.textContent = error.message; } }
  }
  async function copy(text) {
    const current = ++copyGeneration;
    $('#document-copy-fallback').hidden = true; $('#document-copy-text').value = '';
    try { await view.navigator.clipboard.writeText(text); if (current === copyGeneration) status.textContent = 'Copied locally.'; }
    catch { if (current === copyGeneration) { $('#document-copy-fallback').hidden = false; $('#document-copy-text').value = text; $('#document-copy-text').focus(); $('#document-copy-text').select(); status.textContent = 'Copy the selected text manually.'; } }
  }
  input.addEventListener('input', () => { invalidateText(); $('#verified-text').disabled = !input.value.trim(); });
  $('#verified-text').addEventListener('change', () => setBusy(busy));
  $('#document-file').addEventListener('change', (event) => { if (event.target.files[0]) void openFile(event.target.files[0]); });
  $('#sample-pdf').addEventListener('click', () => void openSample('reading-sample.pdf', 'application/pdf'));
  $('#sample-image').addEventListener('click', () => void openSample('reading-sample.png', 'image/png'));
  $('#clear-document').addEventListener('click', clear);
  $('#cancel-document').addEventListener('click', () => { clear(); status.textContent = 'Canceled. File and text cleared.'; });
  $('#page-number').addEventListener('change', () => void renderPage(Number($('#page-number').value)));
  $('#ocr-page').addEventListener('click', () => void recognizePDFPage());
  $('#read-document').addEventListener('click', () => {
    if (busy || !entries || !$('#verified-text').checked || !input.value.trim()) return;
    readingReset(); output.textContent = input.value;
    reader = createReader({ document, entries, onStateChange: (state) => {
      $('#document-count').textContent = state.enabled ? `${state.replacedCount} replaced · ${state.annotatedCount} explained${state.truncated ? ' · partial scan' : ''}` : 'Checked original text';
      $('#restore-document').disabled = !state.enabled;
    } });
    reader.enable({ mode: 'plain' }); $('#copy-document').disabled = false;
    status.textContent = 'Compare with your checked text and the original page. Select a marked phrase to restore or inspect its source.';
  });
  $('#restore-document').addEventListener('click', () => reader?.disable());
  $('#copy-document').addEventListener('click', () => void copy(output.textContent));
  $('#copy-checked').addEventListener('click', () => void copy(input.value));
  const ready = fetcher(localURL('../data/health.json')).then((response) => { if (!response.ok) throw new Error('Glossary unavailable'); return response.json(); }).then((data) => {
    if (!Array.isArray(data.entries) || !data.entries.length) throw new Error('Glossary unavailable');
    entries = data.entries; setBusy(busy);
  }).catch(() => { status.textContent = 'Glossary unavailable. You may inspect extracted text; reload to enable plain reading.'; });
  view.addEventListener('pagehide', clear, { once: true });
  return { ready, clear, openFile, recognize, destroy: clear };
}
if (typeof document !== 'undefined' && document.querySelector('#document-file')) createDocumentWorkshop({ document });
