export const DOCUMENT_LIMITS = Object.freeze({ bytes: 15 * 1024 * 1024, pages: 100, pixels: 20_000_000, characters: 20000, textItems: 20000 });

export function validateDocumentFile(file) {
  if (!file || !Number.isFinite(file.size) || file.size <= 0 || file.size > DOCUMENT_LIMITS.bytes) throw new Error('Choose a nonempty PDF, PNG or JPEG up to 15 MB.');
  if (file.type === 'application/pdf' || (!file.type && /\.pdf$/iu.test(file.name || ''))) return 'pdf';
  if (['image/png', 'image/jpeg'].includes(file.type)) return 'image';
  throw new Error('Choose a PDF, PNG or JPEG. Other formats are not supported.');
}

// Keep the PDF engine's sequence and coordinates. Never pretend an arbitrary
// column reconstruction is authoritative; the original page remains visible.
export function extractPageText(items) {
  if (!Array.isArray(items) || items.length > DOCUMENT_LIMITS.textItems) throw new Error('This page has too many text items. Choose a simpler page.');
  let text = '';
  let previous;
  const positions = [];
  let complexLayout = false;
  for (const item of items) {
    if (typeof item.str !== 'string' || !Array.isArray(item.transform) || !item.str) continue;
    const [x, y] = item.transform.slice(4, 6);
    if (![x, y].every(Number.isFinite)) continue;
    const height = Math.max(Math.abs(item.height || 0), 1);
    if (previous) {
      const lineChange = Math.abs(previous.y - y) > Math.max(height, previous.height) * 0.6;
      const gap = x - previous.x - previous.width;
      if ((!lineChange && gap > height * 6) || (lineChange && y > previous.y + height)) complexLayout = true;
      if (!text.endsWith('\n')) {
        if (lineChange) text += '\n';
        else if (gap > height * 0.15 && !/\s$/u.test(text) && !/^\s/u.test(item.str)) text += ' ';
      }
    }
    const start = text.length;
    text += item.str;
    positions.push({ start, end: text.length, x, y, width: item.width || 0, height, direction: item.dir || 'ltr' });
    if (item.hasEOL) text += '\n';
    if (text.length > DOCUMENT_LIMITS.characters) throw new Error('This page exceeds 20,000 characters. Copy a smaller section into the paragraph workshop.');
    previous = { x, y, width: item.width || 0, height };
  }
  return { text, positions, complexLayout };
}

export function validateImageSize(width, height) {
  if (!Number.isFinite(width) || !Number.isFinite(height) || width < 1 || height < 1 || width * height > DOCUMENT_LIMITS.pixels) throw new Error('Choose an image with at most 20 million pixels.');
}
