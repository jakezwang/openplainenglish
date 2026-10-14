# Architecture

OpenPlainEnglish has no runtime third-party dependencies or remote inference service. Its Manifest V3 extension requests only `activeTab`, `scripting` and `storage`.

## Reading flow

1. The toolbar popup asks the background service worker for the active tab's reader state. This does not inject the reader.
2. Explicit activation loads the bundled lexicon and injects `content.js` into the active HTTP(S) tab. The enable message targets the document ID returned by injection, preventing navigation races.
3. The isolated content script keeps one reader per document. The matcher prefers the longest literal term or alias and preserves UTF-16 offsets, Unicode boundaries and original whitespace.
4. The controller defaults to `plain` mode. It replaces only exact reviewed `inline.replacements` pairs through the pure inline helper; other matches remain annotations. `annotate` mode keeps original wording for every match. Selecting a mode while disabled remembers the choice without activating. Both modes skip interactive, editable, hidden, code and explicitly non-English regions. Each scan is bounded to 15,000 text nodes, a separate element-work budget and 750 logical phrases. Flow runs are bounded to 50,000 characters and each phrase to 24 inline segments; incomplete runs at a budget cutoff remain untouched.
5. A shadow-root dialog shows source-checked explanations. Dynamic text, visibility, language and interactive-role changes reconcile existing marks. Owned UI writes are ignored to avoid observer feedback loops.
6. Private per-marker records retain original text and rendered node identity. Disabling or switching modes restores only untouched owned text; website edits are preserved rather than overwritten by stale originals. Pending mutations are considered even before the observer callback runs. Original text stays in current-page memory, never persistent storage. Navigation to a new document starts disabled.

Reader state is `{ enabled, mode, count, replacedCount, annotatedCount, truncated }`. `count` is the sum of the two marked categories. Background actions validate mode before injection and reuse an active reader when changing mode. The matcher never feeds an explanation's `short` field into page replacement. See [replacement policy](INLINE-LEXICON.md).

v0.4 scans bounded runs across transparent inline formatting, preserving existing elements instead of flattening their HTML. A phrase can own multiple private text segments with one keyboard target. Single-occurrence restoration and ignored entry IDs apply within the current page session. Print handling temporarily exposes original wording. The pure `createTextEngine` API returns original offsets and keeps exact input for non-DOM consumers; it never calls a model or network service.

`opePreferences` stores exactly `language`, `density`, `highlight` and `mode`. Values are validated, merged through the storage write queue and applied only to already-injected readers; settings never inject or activate a new page. Activation loads the remembered mode, while navigation always starts disabled. The command handlers reuse the normal toggle/restore actions. Unavailable shortcuts are recoverable through the toolbar.

## Feedback flow

An explanation passes only its entry ID and feedback category to the extension's options page. A draft contains `id`, `entryId`, `term`, `kind`, `note`, `createdAt` and `lexiconVersion`. There is no field for page text, title, address or browsing history.

The background validates known entries, supplies authoritative term/version metadata, and serializes saves, deletions and imports through one queue. Backup imports accept only bounded v1 JSON exports, retain historical glossary metadata, preserve existing IDs and merge the newest 100 records after a visible preview and confirmation. Drafts are retained in `chrome.storage.local`. User-written notes can still contain sensitive information; the interface asks readers to omit it.

Sharing requires a review dialog showing the exact issue body. Following the GitHub link transmits those fields in the URL; posting requires a separate action on GitHub. Source links and GitHub links are ordinary external browser navigations.

The same reviewed report can be copied or downloaded as text without a GitHub account. These actions do not deliver it to the maintainer. No anonymous inbox, email address or feedback backend is invented. Users choose their own sharing destination.

## Repository map

| Path | Responsibility |
| --- | --- |
| `src/core/` | Pure text matching and reviewed inline replacement selection |
| `src/content/` | Page annotation, dialog and content-script messages |
| `src/background/` | Active-tab actions, lexicon loading and serialized draft storage |
| `src/popup/` | Per-page controls |
| `src/options/` | Searchable glossary and local feedback management |
| `src/shared/` | Feedback validation and issue formatting |
| `data/` | Versioned lexicon and CC0 dedication |
| `scripts/` | Validation, build, deterministic ZIP and local development server |
| `tests/` | Node test runner and jsdom regression checks |
| `demo/` | Shared-reader example and explicitly mocked extension UI previews; excluded from extension packages |

The extension build copies an explicit asset allowlist into `dist/`. Packaging writes a deterministic ZIP with a SHA-256 sidecar. Build and lexicon versions must match. The separate static-site build copies public demo assets into `site/`, without the extension manifest, injection entry point, service-worker entry point or user draft data. The demo reuses background action logic through simulated Chrome APIs and stores drafts separately in localStorage. See [testing](TESTING.md), [data provenance](LEXICON.md) and [changes](../CHANGELOG.md) for evidence and boundaries.
