# Architecture

The extension and standalone SDK have no runtime third-party dependencies or remote inference service. The separate document webpage uses locally hosted PDF.js and Tesseract assets. The Manifest V3 extension requests only `activeTab`, `scripting` and `storage`; these webpage libraries are not included in its package.

## Reading flow

1. The toolbar popup asks the background service worker for the active tab's reader state. This does not inject the reader.
2. Explicit activation loads the bundled lexicon and injects `content.js` into the active HTTP(S) tab. The enable message targets the document ID returned by injection, preventing navigation races.
3. The isolated content script keeps one coordinated reader for the activated document. The matcher prefers the longest literal term or alias and preserves UTF-16 offsets, Unicode boundaries and original whitespace. Optional same-origin frame and open-shadow-root readers participate only after an explicit preference enables them.
4. The controller defaults to `plain` mode. It replaces only exact reviewed `inline.replacements` pairs through the pure inline helper; other matches remain annotations. `annotate` mode keeps original wording for every match. Selecting a mode while disabled remembers the choice without activating. Both modes skip interactive, editable, hidden, code and explicitly non-English regions. Main-document and additional-scope scans share a 750-logical-phrase limit, 15,000 nonempty text-node visits per coordinated batch and bounded element work. Flow runs are bounded to 50,000 characters and each phrase to 24 inline segments; incomplete runs at a budget cutoff remain untouched.
5. A shadow-root dialog shows source-checked explanations. Dynamic text, visibility, language and interactive-role changes reconcile existing marks. Owned UI writes are ignored to avoid observer feedback loops.
6. Private per-marker records retain original text and rendered node identity. Disabling or switching modes restores only untouched owned text; website edits are preserved rather than overwritten by stale originals. Pending mutations are considered even before the observer callback runs. Original text stays in current-page memory, never persistent storage. Navigation to a new document starts disabled.

Reader state is `{ enabled, mode, count, replacedCount, annotatedCount, truncated }`. `count` is the sum of the two marked categories. Background actions validate mode before injection and reuse an active reader when changing mode. The matcher never feeds an explanation's `short` field into page replacement. See [replacement policy](INLINE-LEXICON.md).

The reader scans bounded runs across transparent inline formatting, preserving existing elements instead of flattening their HTML. A phrase can own multiple private text segments with one keyboard target. Single-occurrence restoration and ignored entry IDs apply within the current page session. Print handling temporarily exposes original wording. The pure `createTextEngine` API returns original offsets and keeps exact input for non-DOM consumers; it never calls a model or network service.

`opePreferences` stores exactly `language`, `density`, `highlight`, `mode`, `includeFrames`, `includeShadowRoots` and `guideCompleted`. The last three are booleans defaulting to `false`; older four-field records gain safe defaults. Values are validated and merged through the storage write queue. Reading settings apply only to already-injected readers; settings never inject or activate a new page. `guideCompleted` has no reading effect. Activation loads the remembered mode, while navigation always starts disabled. Command handlers reuse the normal toggle/restore actions; unavailable shortcuts are recoverable through the toolbar.

## Optional reading scopes

The coordinator can include up to **32 additional accessible scopes** beyond the main document: same-origin HTML frame documents and open shadow roots. Both preferences are off by default. Cross-origin or inaccessible frames, opaque sandboxed documents and closed roots are skipped. Discovery does not fetch a frame URL, change sandbox flags, request host permissions or hook `attachShadow`. Mode, display preferences and page-session ignores apply across active scopes; disabling a scope restores its owned text and tears down its reader.

Frame loads, new hosts and mutations inside discovered roots can trigger reconciliation. Creating a shadow root on an already connected host does not itself produce a parent DOM mutation. That case requires an explicit refresh/re-enable or a later discoverable DOM change. Scope and work limits can leave text unchecked, so aggregate counts and `truncated` must not imply complete webpage coverage. Native browser lifecycle and permission behavior remain separate acceptance checks.

## First-use practice

`demo/guide.html`, its stylesheet and its bundled script are the only demo page included in extension packages, as `guide.html`, `guide.css` and `guide.js`. The guide runs the shared reader on an invented example and requires start, original-word inspection, one-occurrence restoration and full restoration before the completion action is offered. Finishing writes only `guideCompleted: true`; it does not invoke active-tab activation. The popup shows an optional first-use link and retains a permanent replay link; options also links to the guide.

Extension guide preferences use background messages. On the website, the guide shares `opeDemoPreferences` with the explicitly mocked UI preview. Practice events remain transient. Guide rendering writes inherited language only when it changes, avoiding a root-attribute mutation/rescan loop.

## Feedback flow

An explanation passes only its entry ID and feedback category to the extension's options page. A draft contains `id`, `entryId`, `term`, `kind`, `note`, `createdAt` and `lexiconVersion`. There is no field for page text, title, address or browsing history.

The background validates known entries, supplies authoritative term/version metadata, and serializes saves, deletions and imports through one queue. Backup imports accept only bounded v1 JSON exports, retain historical glossary metadata, preserve existing IDs and merge the newest 100 records after a visible preview and confirmation. Drafts are retained in `chrome.storage.local`. User-written notes can still contain sensitive information; the interface asks readers to omit it.

Sharing requires a review dialog showing the exact issue body. Following the GitHub link transmits those fields in the URL; posting requires a separate action on GitHub. Source links and GitHub links are ordinary external browser navigations.

The same reviewed report can be copied or downloaded as text without a GitHub account. These actions do not deliver it to the maintainer. The owner-controlled `data/feedback-config.json` has schema `{ "schemaVersion": 1, "email": null }`; the default provides no email receiver. `src/options/feedback-destination.js` accepts only a single conservative mailbox, rejects unexpected fields and header/URL injection, encodes the subject/body separately and bounds the generated link. It does not accept a user-supplied remote endpoint.

With a valid configured address, the same review dialog exposes the exact recipient, subject and body before an explicit `mailto:` navigation. Opening the mail draft hands that text to the system mail handler; it does not send an email. The mail application's draft synchronization and sending are outside this project. Invalid or absent configuration leaves copy/download and explicit GitHub sharing available.

## Document and sentence webpages

`demo/documents.js` is a separate local-file workflow. PDF.js renders one selected page and supplies text items with positions; `extractPageText` preserves the parser's order and flags some complex layouts rather than asserting a correct reading order. Tesseract performs local English OCR for chosen PNG/JPEG images or scanned PDF pages. The original remains visible alongside editable extracted text. A user must confirm checking words, order, numbers, units and negation before the shared reader can simplify that corrected text.

Bounds are 15 MB per file (15 × 1,024 × 1,024 bytes), 100 PDF pages, 20 million pixels per processed image, 20,000 text items per page and 20,000 extracted characters. Encrypted PDFs are unsupported. Cancellation, clear, source changes and page changes invalidate generation tokens, cancel work and discard stale asynchronous results; page changes also discard earlier corrections. Files, canvases, text and original comparisons stay in page memory. There is no upload, result persistence or remote inference.

`scripts/build-vendor.mjs` copies allowlisted PDF.js/Tesseract code, workers, fonts, WebAssembly and the English model from pinned development dependencies into website-only `vendor/`. The document webpage loads these assets from its own origin as needed; it has no runtime CDN fallback. The host receives normal asset requests. Extension and SDK builds exclude these libraries and models.

`src/core/sentences.js` implements a separate deterministic experiment: it proposes splitting a narrowly recognized pair of clauses at one semicolon, preserving the word/number sequence while changing punctuation and capitalization. Quoted input is retained; conservative syntax guards suppress other proposals. These guards do not establish semantic equivalence. `demo/sentences.js` shows original, candidate and exact changes, requires review before applying, preserves the exact original for undo and invalidates stale previews/copy fallbacks when input changes. It calls no model and stores no text persistently.

## Repository map

| Path | Responsibility |
| --- | --- |
| `src/core/` | Pure matching/replacement, text engine, bounded document helpers and sentence experiment |
| `src/content/` | Page annotation, dialog and content-script messages |
| `src/background/` | Active-tab actions, lexicon loading and serialized draft storage |
| `src/popup/` | Per-page controls |
| `src/options/` | Searchable glossary, preferences, local feedback and owner-configured mail draft validation |
| `src/shared/` | Preference validation, feedback validation and issue formatting |
| `data/` | Versioned lexicons, coverage fixtures, CC0 dedication and feedback destination configuration |
| `scripts/` | Validation, extension/site/SDK builds, website-only vendor assets and packaging |
| `tests/` | Node test runner and jsdom regression checks |
| `demo/` | Reader examples, mock UI, workshop, document/sentence tools and study; only the first-use guide is included in extension packages |

The extension build copies an explicit asset allowlist into `dist/`, including the bundled guide and feedback configuration. Packaging writes a deterministic ZIP with a SHA-256 sidecar. Build and lexicon versions must match. The separate static-site build copies public tools and vendor assets into `site/`, without the extension manifest, injection entry point, service-worker entry point or user draft data. The UI preview reuses background action logic through simulated Chrome APIs and stores drafts/preferences separately from the extension.

The SDK exports the text engine, `./browser` DOM reader, `./sentences` experiment and `./documents` pure extraction/validation helpers, plus versioned data. The document helpers do not parse PDF bytes or run OCR by themselves; the SDK includes no PDF.js/Tesseract dependency or model. The SDK is a release tarball, not an npm registry publication. See [SDK usage](SDK.md), [testing](TESTING.md), [data provenance](LEXICON.md) and [changes](../CHANGELOG.md). A description of the implementation does not claim native installation, store approval, independent clinical review or participant validation.
