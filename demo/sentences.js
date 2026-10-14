import { proposeSentenceSplits } from '../src/core/sentences.js';
const $ = (selector) => document.querySelector(selector);
let proposal, current = '', generation = 0;
function invalidate() {
  generation++; proposal = undefined; current = ''; $('#sentence-confirm').checked = false;
  for (const id of ['sentence-confirm','sentence-apply','sentence-undo','sentence-copy']) $(`#${id}`).disabled = true;
  for (const id of ['sentence-original','sentence-candidate','sentence-current','sentence-diff']) $(`#${id}`).textContent = '';
  $('#sentence-copy-fallback').hidden = true; $('#sentence-copy-text').value = '';
  $('#sentence-status').textContent = 'Preview the current text to compare a proposal.';
}
$('#sentence-input').addEventListener('input', invalidate);
$('#sentence-clear').addEventListener('click', () => { $('#sentence-input').value = ''; invalidate(); });
$('#sentence-example').addEventListener('click', () => { $('#sentence-input').value = 'The report mentions hypertension; it does not establish a diagnosis. The note lists 10 mg; it does not list 100 mg.'; invalidate(); });
$('#sentence-preview').addEventListener('click', () => {
  invalidate(); proposal = proposeSentenceSplits($('#sentence-input').value); current = proposal.original;
  $('#sentence-original').textContent = proposal.original; $('#sentence-candidate').textContent = proposal.text; $('#sentence-current').textContent = current;
  $('#sentence-diff').textContent = proposal.changes.length ? proposal.changes.map((change) => `At character ${change.start}: ${JSON.stringify(change.original)} → ${JSON.stringify(change.replacement)}`).join('\n') : 'No supported split. Original text retained.';
  $('#sentence-status').textContent = `${proposal.changes.length} proposed split(s). Word/number sequence preserved: ${proposal.tokenSequencePreserved ? 'yes' : 'no'}. Review meaning yourself before applying.`;
  $('#sentence-confirm').disabled = !proposal.changes.length; $('#sentence-copy').disabled = !current;
});
$('#sentence-confirm').addEventListener('change', () => { $('#sentence-apply').disabled = !proposal?.changes.length || !$('#sentence-confirm').checked; });
function clearCopy() { generation++; $('#sentence-copy-fallback').hidden = true; $('#sentence-copy-text').value = ''; }
$('#sentence-apply').addEventListener('click', () => { if (!proposal || !$('#sentence-confirm').checked) return; clearCopy(); current = proposal.text; $('#sentence-current').textContent = current; $('#sentence-undo').disabled = false; $('#sentence-status').textContent = 'Candidate applied locally. Undo restores the exact original.'; });
$('#sentence-undo').addEventListener('click', () => { if (!proposal) return; clearCopy(); current = proposal.original; $('#sentence-current').textContent = current; $('#sentence-undo').disabled = true; $('#sentence-status').textContent = 'Exact original restored.'; });
$('#sentence-copy').addEventListener('click', async () => { clearCopy(); const active = generation, text = current; try { await navigator.clipboard.writeText(text); if (active === generation) $('#sentence-status').textContent = 'Copied locally.'; } catch { if (active === generation) { $('#sentence-copy-fallback').hidden = false; $('#sentence-copy-text').value = text; $('#sentence-copy-text').focus(); $('#sentence-copy-text').select(); } } });
