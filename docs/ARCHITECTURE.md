# Architecture

OpenPlainEnglish has no runtime third-party dependencies or remote inference service. Its Manifest V3 extension requests only `activeTab`, `scripting` and `storage`.

## Reading flow

1. The toolbar popup asks the background service worker for the active tab's reader state. This does not inject the reader.
2. Explicit activation loads the bundled lexicon and injects `content.js` into the active HTTP(S) tab. The enable message targets the document ID returned by injection, preventing navigation races.
3. The isolated content script keeps one reader per document. The matcher prefers the longest literal term or alias and preserves UTF-16 offsets, Unicode boundaries and original whitespace.
4. The controller wraps eligible text with keyboard-accessible markers. It skips interactive, editable, hidden, code and explicitly non-English regions. Each scan is bounded to 15,000 text nodes and 750 marks; text nodes over 50,000 characters are skipped.
5. A shadow-root dialog shows source-checked explanations. Dynamic text, visibility, language and interactive-role changes reconcile existing marks. Owned UI writes are ignored to avoid observer feedback loops.
6. Disabling disconnects observation and removes markers while preserving current page text, including page edits made after activation. Navigation to a new document starts disabled.

## Feedback flow

An explanation passes only its entry ID and feedback category to the extension's options page. A draft contains `id`, `entryId`, `term`, `kind`, `note`, `createdAt` and `lexiconVersion`. There is no field for page text, title, address or browsing history.

The background validates known entries, supplies authoritative term/version metadata, and serializes saves, deletions and imports through one queue. Backup imports accept only bounded v1 JSON exports, retain historical glossary metadata, preserve existing IDs and merge the newest 100 records after a visible preview and confirmation. Drafts are retained in `chrome.storage.local`. User-written notes can still contain sensitive information; the interface asks readers to omit it.

Sharing requires a review dialog showing the exact issue body. Following the GitHub link transmits those fields in the URL; posting requires a separate action on GitHub. Source links and GitHub links are ordinary external browser navigations.

## Repository map

| Path | Responsibility |
| --- | --- |
| `src/core/` | Pure text matching |
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
