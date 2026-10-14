# OpenPlainEnglish engine and data

The v0.5.0 build produces `openplainenglish-core-0.5.0.tgz`: an independent ES module package with a local text engine, an optional DOM reader, document-text helpers, conservative sentence splitting and two glossaries. It has no runtime dependencies, network calls, telemetry, account or API key. Install the local tarball after building it or downloading it from the release assets; it has **not** been published to the npm registry. Node.js 22.13 or newer is required for the example below.

```sh
npm install ./openplainenglish-core-0.5.0.tgz
```

```js
import { createTextEngine } from 'openplainenglish-core';
import health from 'openplainenglish-core/data/health.json' with { type: 'json' };

const engine = createTextEngine(health.entries);
const result = engine.analyze('Hypertension and biopsy are health terms.');
console.log(result.text); // High blood pressure and biopsy are health terms.
console.log(result.original); // Exact input, retained for comparison and undo.
console.log(result.matches); // Original UTF-16 offsets, entry ID, wording and reason.
```

`createTextEngine(entries)` snapshots 1–5,000 entries. `analyze(text, { mode: 'plain' | 'annotate', maxMatches: 750 })` accepts up to 200,000 UTF-16 code units and returns `original`, `text`, `matches`, `mode`, `replacedCount`, `annotatedCount`, `truncated`. The match limit is 1–5,000. Matches beyond that limit remain unchanged; the engine still scans the bounded input. All HTML-looking input is ordinary text: render with `textContent`, never `innerHTML`. This API does not sanitize HTML for you.

The engine uses explicit source-checked phrase pairs and conservative boundaries. It does not generate new definitions, resolve arbitrary ambiguous meanings or rewrite grammar. Definitions never become replacement text. `annotate` keeps the input exactly. Retain `original` to undo; do not reverse-match output wording. Copy/find in a rendered reading view sees displayed words; show an explicit original-copy control when the distinction matters.

For a browser application:

```js
import { createReader } from 'openplainenglish-core/browser';
const reader = createReader({ document, entries: health.entries,
  preferences: { language: 'en', density: 'comfortable', highlight: 'subtle', mode: 'plain' },
  onStateChange(state) { console.log(state); }
});
reader.enable({ mode: 'plain' });
// Later: reader.setMode('annotate'), reader.disable(), or reader.destroy().
```

The DOM reader changes eligible text in the supplied document, skips editable/interactive/hidden regions, and restores owned original text while preserving website mutations. Keep your controls inside elements with `data-ope-owned="your-ui"`. `includeFrames` and `includeShadowRoots` are default-off preferences for accessible same-origin HTML frame documents and open roots. Cross-origin frames and closed roots remain excluded; attaching a shadow root to an already-existing host can require a reader refresh. All scopes share work limits. Call `destroy()` on teardown. Native integration checks remain the integrator's responsibility.

```js
import { proposeSentenceSplits } from 'openplainenglish-core/sentences';
import { extractPageText, validateDocumentFile, DOCUMENT_LIMITS } from 'openplainenglish-core/documents';
const proposal = proposeSentenceSplits('The note lists 10 mg; it does not list 100 mg.');
console.log(proposal.text); // The note lists 10 mg. It does not list 100 mg.
console.log(proposal.changes); // Original UTF-16 offsets, old/new punctuation and initial.
```

Sentence proposals accept at most 20,000 characters and retain exact `original` text for undo. Only explicit clause patterns at a semicolon are considered; quoted input and recognized conditional wording are withheld. Token preservation is a mechanical check, not a semantic guarantee. Show the difference, ask for meaning review and preserve a way to undo; never silently replace a document with a candidate.

Document helpers validate sizes/types and map PDF.js-style text items to extracted text plus original item coordinates. They preserve engine order, flag some complex layouts and do not reconstruct arbitrary columns. The package includes neither a PDF parser nor an OCR model; callers provide those and must render the original for checking. The website demonstrates PDF.js and Tesseract separately. Limits are 15 MiB per input file, 100 PDF pages, 20 million image pixels and 20,000 extracted characters/items per page. No document is read or uploaded by importing these helpers.

The public-service pilot lives at `data/pilots/public-service.json`; opt into its entries explicitly instead of mixing domains by default. Data is CC0-1.0 (`data/LICENSE`); code is MIT (`LICENSE`). Explanations and phrases are editorial source comparisons, without completed independent expert review or reader-comprehension testing. Source links remain part of each entry. Respect the provenance notes when reusing source material.

From the repository, `npm ci` followed by `npm run package:sdk` validates both datasets and version alignment, then builds and packs only the allowlisted engine, data, licenses and this guide. It writes the tarball and a SHA-256 sidecar in `release/`. The offline packaging regression installs that local tarball in an empty consumer project and exercises the documented package exports. No registry publication or credentials are involved.
