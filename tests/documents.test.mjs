import test from 'node:test';
import assert from 'node:assert/strict';
import { DOCUMENT_LIMITS, extractPageText, validateDocumentFile, validateImageSize } from '../src/core/documents.js';
import { readFile } from 'node:fs/promises';
import { JSDOM } from 'jsdom';
import { createDocumentWorkshop } from '../demo/documents.js';

test('document input bounds exclude unknown types, oversized files, images and extracted pages', () => {
  assert.equal(validateDocumentFile({ size: 4, type: 'application/pdf' }), 'pdf');
  assert.throws(() => validateDocumentFile({ size: DOCUMENT_LIMITS.bytes + 1, type: 'image/png' }));
  assert.throws(() => validateDocumentFile({ size: 4, type: 'image/svg+xml' }));
  assert.throws(() => validateImageSize(10000, 10000));
  assert.throws(() => extractPageText([{ str: 'a'.repeat(20001), transform: [1,0,0,1,0,0] }]));
});
test('PDF extraction preserves word order, source positions, numbers and line boundaries', () => {
  const result = extractPageText([{str:'10 mg, not 100 mg.',transform:[1,0,0,12,40,700],height:12,width:100,hasEOL:true},{str:'Keep 5% and 12:30.',transform:[1,0,0,12,40,680],height:12,width:100}]);
  assert.equal(result.text, '10 mg, not 100 mg.\nKeep 5% and 12:30.');
  assert.equal(result.positions[1].start, 19); assert.equal(result.positions[1].y, 680);
});
test('real PDF parser handles text, columns and scanned page without inventing text', async () => {
  const { getDocument } = await import('pdfjs-dist/legacy/build/pdf.mjs');
  const task = getDocument({ data: new Uint8Array(await readFile(new URL('../demo/fixtures/reading-sample.pdf', import.meta.url))), isEvalSupported: false, useSystemFonts: true });
  try {
    const pdf = await task.promise; assert.equal(pdf.numPages, 3);
    const result = extractPageText((await (await pdf.getPage(1)).getTextContent()).items);
    assert.match(result.text, /10 mg, not 100 mg/u); assert.match(result.text, /5% and 12:30/u);
    assert.equal(extractPageText((await (await pdf.getPage(2)).getTextContent()).items).complexLayout, true);
    assert.equal(extractPageText((await (await pdf.getPage(3)).getTextContent()).items).text, '');
  } finally { await task.destroy(); }
});
test('clearing while PDF loading prevents late completion from resurrecting document state', async () => {
  const dom = new JSDOM(await readFile(new URL('../demo/documents.html', import.meta.url)), { url:'https://example.test/demo/documents.html' });
  let resolve, destroyed = 0;
  const pending = new Promise((r) => { resolve = r; });
  const workshop = createDocumentWorkshop({ document:dom.window.document, fetcher:async()=>({ok:true,json:async()=>({entries:[]})}), loadPDF:async()=>({GlobalWorkerOptions:{},getDocument:()=>({promise:pending,destroy:async()=>{destroyed++;}})}) });
  const opening = workshop.openFile({size:10,type:'application/pdf',name:'example.pdf',arrayBuffer:async()=>new ArrayBuffer(10)});
  await new Promise((r)=>setImmediate(r)); workshop.clear(); resolve({numPages:1}); await opening;
  assert.equal(dom.window.document.querySelector('#source-label').textContent, 'No document');
  assert.equal(dom.window.document.querySelector('#page-label').hidden, true); assert.equal(destroyed,1);
  dom.window.close();
});

test('canceling during OCR initialization terminates the late worker without recognizing or repopulating text', async () => {
  const dom = new JSDOM(await readFile(new URL('../demo/documents.html', import.meta.url)), { url:'https://example.test/demo/documents.html' });
  let resolve, terminated = 0, recognized = 0;
  const pending = new Promise((r) => { resolve = r; });
  const workshop = createDocumentWorkshop({ document:dom.window.document, fetcher:async()=>({ok:true,json:async()=>({entries:[]})}), loadOCR:async()=>({createWorker:()=>pending}) });
  const running = workshop.recognize({});
  await new Promise((r)=>setImmediate(r)); workshop.clear();
  resolve({terminate:async()=>{terminated++;},recognize:async()=>{recognized++;return {data:{text:'late text'}};}});
  await running;
  assert.ok(terminated >= 1); assert.equal(recognized,0);
  assert.equal(dom.window.document.querySelector('#extracted-text').value,'');
  assert.equal(dom.window.document.querySelector('#read-document').disabled,true);
  assert.equal(dom.window.document.querySelector('#source-label').textContent,'No document');
  dom.window.close();
});
