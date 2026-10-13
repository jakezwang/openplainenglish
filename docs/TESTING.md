# Testing OpenPlainEnglish

Use invented text and public-information examples. Do not test with medical records, private account pages, browser profiles, credentials, or real feedback exports.

## Automated checks

The development toolchain supports Node.js 22 and 24. Starting from the repository root:

```sh
npm ci
npm run check
npm run package
```

`npm run check` runs lexicon validation, Node's test runner, and the build. `npm run package` creates the distributable ZIP and prints its path. A successful build alone does not verify browser behavior or the accuracy of an explanation.

The current automated tests cover:

- **Matching:** case-insensitive terms and aliases, longest phrases, repeated terms, punctuation, Unicode boundaries, and adjacent text that must not match.
- **Page handling:** enable/disable cycles, preservation of original wording, safe insertion, dynamic content, skipped editable/interactive/hidden content, and bounded work on large pages.
- **Feedback and background actions:** allowed fields, sanitization, the newest-100-record limit, concurrent saves, UI draft creation and review, confirmed deletion, supported-page checks, authoritative glossary metadata, and encoded issue URLs that omit automatically collected page URL, title, and body.
- **Lexicon:** schema, unique entries, sources, licensing, review metadata, and supported term/alias relationships.
- **Backup import:** strict schema/UTF-8 size/record bounds, atomic rejection, preview before confirmation, deduplication, overflow reporting, historical metadata preservation and serialization with saves/deletes.
- **Bundled integration:** real bundled popup, background and content scripts communicate in isolated in-memory contexts, including feedback and recovery after malformed messages. The browser APIs are test doubles; this does not emulate Chrome's permission grant or native extension host.
- **Distribution and website:** ZIP directory inspection, exact payload/asset allowlist, checksum, deterministic packaging, version/permission/CSP guards and repository-prefix static-site assets.
- **Source checker:** offline fixtures for HTTP failure classes, timeouts, concurrency/retry limits, dynamic term evidence and title extraction. Live source availability is checked separately.

The build checks that package, manifest and lexicon versions match, bundles the scripts, and copies declared assets. Packaging rebuilds the extension and writes a ZIP and SHA-256 checksum. Tests inspect archive contents and bytes against the build; CI additionally runs `unzip -t` and verifies the checksum with system tools. Actual browser installation still requires the checklist below.

CI repeats `npm ci`, `npm run check`, and `npm run package` on Node.js 22 and 24. Each job uploads its package for inspection. The online demo deploys only after both jobs pass on `main`. A CI artifact is a test build; a versioned GitHub Release is the user-facing release.

For a production-shaped static preview, run `npm run preview:site`; it serves the built site beneath `/openplainenglish/` to exercise GitHub Pages paths. A source run with `npm run dev` serves `/demo/`. Run `npm run check:sources -- --output artifacts/source-audit.json` for a separate, non-mutating live-source report; inspect failure counts even if the process exits successfully.

## Browser checks before release

Load the built `dist/` folder through **Load unpacked** on the browser's extensions page. Run `npm run dev` and open the demo URL it prints. Inspect the extension's popup, content-script context, and management page as needed; ordinary website requests are separate from extension-origin requests.

Leave the demo page's own reader disabled while testing the installed extension. `/demo/preview.html?view=options` and `?view=popup` use mock browser APIs to preview layout; draft storage there is separate from extension storage. A successful preview does not count as a successful extension runtime check.

Record the browser and version, extension version/commit, page or fixture used, results, and any limitations. Check Chrome and Edge when available; clearly record a browser that was not tested.

1. **Install and activation.** Confirm the unpacked extension loads without errors. On an HTTP(S) page, enable it from the popup and verify the count reflects marked terms. Before activation, the page has no injected marks.
2. **Explanations.** Open a term and inspect short meaning, fuller explanation, context, sources, and honest review status. Check a multiword term, alias, repeated term, punctuation boundary, and unrelated word that must not match. Source navigation must happen only after selecting a link.
3. **Keyboard and layout.** Reach a marked term and popup controls with the keyboard, activate the explanation, close it with Escape, and confirm useful focus returns. Inspect at narrow width and 200% zoom. Check readable contrast and announced control names; automated checks do not replace screen-reader testing.
4. **Page safety.** Confirm forms, editable areas, links, buttons, code, hidden text, and extension-owned UI are skipped. Add ordinary text dynamically and check new marks. Exercise a large fixture and verify a reported partial-marking limit. Disable and re-enable several times; compare the page text with its initial wording and check for duplicate marks.
5. **Privacy and feedback.** Save a draft, review it in the management page, export it, and delete it. Try a known term and a new-term suggestion. Confirm cancellation preserves a draft, confirmed deletion removes it, and export creates a readable JSON file. Inspect stored record fields: no page URL, title, or body should be present. Opening the prepared issue must be an explicit action, must allow review, and must not publish automatically. Confirm issue text contains only intended glossary metadata and your note. Do not publish a test issue unless needed; if published, identify it clearly and use invented content.
6. **Network and permissions.** Verify the built manifest has the three declared permissions and no host permissions. Ordinary matching, explanations, and local draft saving must not make extension-origin external requests. Source and GitHub navigation are expected only after the user's action. Do not mistake the local glossary load for an external request.
7. **Unsupported surfaces.** Check that browser-internal pages, PDF files, and the PDF viewer do not claim working support. Iframes and shadow roots are not scanned, and a phrase split across separate HTML elements may not match. A page without known terms should show a helpful zero-result state rather than an error. A full-page navigation or reload should start disabled.
8. **Release archive.** Extract the produced ZIP into a fresh folder and load that folder, not the source `dist/`, to confirm a release user can install it. Review archive contents for source maps, caches, credentials, feedback files, and other unintended data.

## Preparing a versioned release

For import verification, restore an invented v0.1 export in v0.2. Confirm that preview and cancellation leave storage unchanged, confirmation merges once, importing the same file adds no duplicates, excess drafts are disclosed, and invalid fields/oversized files fail without partial writes. Export again and compare the seven allowed fields. Do not use a personal feedback backup as a test fixture.

1. Keep the intended version aligned in `package.json`, `package-lock.json`, `manifest.json`, and `data/health.json`; keep review dates tied to actual source review.
2. Run `npm ci`, `npm run check`, and `npm run package` from the commit intended for release. The package script already rebuilds `dist/`.
3. Inspect the ZIP: `manifest.json` must be at its root, along with the compiled scripts and UI assets, icons, bundled dictionary, and licenses. It must not contain the demo adapter, development dependencies, feedback exports, private data, or source maps.
4. Compare the ZIP's SHA-256 digest with the adjacent `.sha256` file. For example, from the `release/` directory on macOS use `shasum -a 256 -c openplainenglish-0.1.0.zip.sha256`, substituting the release's version. A checksum checks the downloaded file against the published digest; it is not a signature or a security audit.
5. Complete and record the applicable browser checks above using the extracted ZIP. The checklist itself is not evidence that a check passed.
6. Create the version tag and GitHub Release for the tested commit, attaching both the versioned ZIP and checksum. CI artifacts are for inspection; the workflow does not publish a GitHub Release or browser-store listing automatically.

## Release record

The release description should identify the commit and version, commands that passed, browsers actually checked, package name, and remaining limitations. Keep clinical accuracy review and comprehension testing distinct from software tests; do not describe either as completed without the corresponding evidence.
