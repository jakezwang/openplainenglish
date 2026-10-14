# v0.5.0 verification record

Verified on 2026-10-14. This is a **developer preview**: native-extension acceptance, store publication, independent expert review and real-reader comprehension results remain separate gates. See the [execution ledger](BACKLOG.md).

## Shipped changes

- Four-step practice guide: enable, inspect original words, restore one occurrence, restore all; completion is optional and local. New documents still start off.
- Default-off reading of accessible same-origin HTML frames and open Shadow DOM. All scopes share limits, preferences and ignore state; navigation, removal, host changes and cross-document adoption are handled. Cross-origin/isolated frames and closed roots remain excluded.
- Local PDF page rendering, selectable text layer, positioned extraction and English OCR for PNG/JPEG/scanned pages. The original stays visible and users must correct/check extracted text before plain reading. PDF OCR uses a higher-resolution render separate from the screen preview. No document upload or persistent document storage.
- Conservative semicolon-split proposals, changed-span review, explicit application and exact undo. This is a deterministic experiment, not general sentence paraphrasing or validated semantic simplification.
- Health data grows to 132 entries, 133 aliases and 56 explicit pairs across 30 entries. The separate public-service pilot remains 8 entries/14 pairs.
- Reviewed feedback can open a configured email draft; the shipped destination is unset. Copy/download remain available. No email is automatically sent.
- Strict offline study-export analysis with blinded scoring packets, two-reviewer agreement/adjudication, missing-data handling and explicit no-data output. Actual participant sessions: **0**.

## Automated evidence

`npm run check` passed **201 tests**, validated both lexicons and built the extension. Tests include packaged integration, all 56 health pairs reaching/restoring the DOM, surface lifecycle and shared limits, deferred PDF/OCR cancellation, the actual PDF parser on a three-page fixture, delayed guide stability, quotation/conditional sentence exclusions, feedback and study analysis. Test doubles do not establish native permissions or installed-extension behavior.

`npm run package`, `npm run package:firefox`, `npm run package:sdk` and `npm run build:site` create the versioned packages and website. Each package has a SHA-256 sidecar. Archive integrity and digests are checked independently. The SDK includes text/browser APIs and pure sentence/document helpers; PDF.js/Tesseract and model assets remain website-only. The static site bundles pinned dependencies and license notices from its own origin.

`web-ext 10.7.0 lint` reports **0 errors, 1 warning**: the desktop Firefox 140 minimum predates Android's support for the data-consent manifest key (142). This package targets desktop; Android is not advertised or validated. Static lint is not native Firefox acceptance or AMO signing. The dependency audit reports zero known vulnerabilities at audit time; it is not a security certification.

Live source audit: **125/125** unique health URLs available, **94** official MedlinePlus API term-evidence matches; **2/2** pilot URLs available. Availability does not establish editorial correctness or human review. The unchanged four-page corpus and 122 selected spans yield explanation coverage **80→104** and actual inline occurrences **12→16**. See [coverage limitations](COVERAGE.md).

Public HTML snapshots, with site scripts disabled in JSDOM, restored text and markup exactly: MedlinePlus lab results 23 logical marks, cholesterol 103 and CPSC plain language 7. Single-run scan times were 73.71, 79.25 and 55.22 ms respectively. These are diagnostic snapshot measurements, not browser speed guarantees.

## Rendered Chrome evidence

The shared source reader and real PDF/OCR engines were exercised on regular browser pages:

- The guide completed all four actions, persisted completion after Finish, and reloaded with reading off. Both English and Chinese controls were inspected. A browser-discovered repeated-rescan bug was fixed and given an asynchronous regression test.
- The compatibility lab initially left its frame and open component untouched. Enabling both opt-ins changed the displayed count from 4 replacements/5 explanations to 6/5; adding a component and navigating the actual `srcdoc` iframe produced 7/5. A frame explanation opened, one occurrence restored, and full disable returned zero marks. Native extension injection was not involved.
- The three-page synthetic PDF exercised text extraction, two columns and a scan with no text layer. Column order needs manual checking. Image and higher-resolution scanned-page OCR both read the synthetic sample with engine confidence 95%; all sample numbers, units and negation were inspected. This is one invented fixture, not an OCR accuracy benchmark. An initial low-resolution scan was visibly inaccurate and was corrected by changing the rendering path.
- Checked document text produced two replacements and one annotation while retaining `10 mg, not 100 mg`, `5%`, `12:30` and the diagnostic negation. Restore matched the corrected input exactly. Unit tests also prevent late PDF/OCR work from refilling cleared state. The copy action announced success, but the automation clipboard readback was empty, so native clipboard contents are not claimed verified in this release.
- The sentence example produced two explicit punctuation/initial changes only after review, then Undo restored the exact original. Quoted and recognized conditional inputs have regression coverage.
- At a requested 320-pixel viewport, the guide/settings/document/sentence pages measured 305 CSS pixels after the scrollbar and no horizontal document overflow; the popup measured 320/320. English/Chinese guide and explanation layouts were inspected. Browser testing found and fixed file-input overflow and a panel offset; the narrow panel then occupied x=12…293 within the 305-pixel layout. A 390-pixel document layout was also inspected.

![Local image OCR, checked text and plain reading](images/online-demo-v0.5.png)

The native zoom shortcut did not change the measured viewport, so **200% native zoom remains unverified**. Screen-reader listening, real mobile devices, native print preview and file-picker use also remain open. Responsive emulation and DOM attributes do not substitute for those checks.

## Release and owner steps

The [v0.5.0 release](https://github.com/jakezwang/openplainenglish/releases/tag/v0.5.0) supplies Chromium, unsigned Firefox and SDK packages, store preparation and evidence reports. The [guide](https://jakezwang.github.io/openplainenglish/demo/guide.html), [document reader](https://jakezwang.github.io/openplainenglish/demo/documents.html) and [sentence experiment](https://jakezwang.github.io/openplainenglish/demo/sentences.html) require no extension account.

Prior native extension-manager automation was rejected by automatic approval review. The browser integration also lacked native file access and blocked the developer-console path; those restrictions were not bypassed or retried. A prior browser release-download block was not bypassed. Package metadata/digests can be checked independently, but they are not proof of a browser download or installation.

The owner still needs to register/pay/verify the store account, complete publisher declarations, perform native install/upgrade/import/print checks, capture actual extension screenshots and submit for review. There is no approved one-click store listing yet. A public feedback inbox, extra browser memberships/devices, independent reviewers and consenting study participants require owner/other-person participation. No messages, endorsements, participant results or store approvals have been invented.
