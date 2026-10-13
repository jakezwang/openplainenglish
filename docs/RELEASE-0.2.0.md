# OpenPlainEnglish v0.2.0 — verification record

Verification date: **2026-10-13**. This preview adds feedback backup restoration, a public demo, release/integration checks and contributor guidance. The lexicon still contains 100 English health entries.

**The installed extension runtime has not been verified in a browser.** Automated integration tests use mocked Chrome APIs; browser demo checks exercise the shared reader and labeled UI adapters.

## Verified locally

| Surface | Observed result |
| --- | --- |
| Automated checks | **79 tests passed**, followed by a successful extension build. Tests cover matching, DOM mutations and visibility, truncation budgets, malformed messages, local draft validation/import, lexicon structure, distribution and offline source-checker fixtures. |
| Bundled integration | Built popup, background and content code exchanged messages through a mocked Chrome host. Tests cover enable/disable, counts, explanations, feedback, import serialization and malformed/foreign messages. This does not establish native browser permission or service-worker behavior. |
| Shared reader in Chrome | The static site served under `/openplainenglish/` loaded its data and modules, marked terms, and opened the dehydration explanation with a keyboard action. The updated explanation, context and source links appeared in the dialog. |
| Feedback UI preview | A generated hypertension draft was saved locally. Chrome produced a real JSON download with schema version 1 and exactly the seven expected draft fields. No browsing URL, page title or page text was included. Import validation, inspectable preview, explicit confirmation, deduplication, overflow and cancellation passed automated UI/helper tests. |
| Distribution | The final ZIP contains **16 files, 195,300 bytes**. Build tests check the exact allowlist, safe paths, packaged asset bytes, deterministic output, checksum, versions, permissions and CSP declaration. Independent `unzip -t` passed for every file. |
| Source audit | All **105 unique cited URLs** returned available responses. Supplemental official API probes returned evidence for 91 CDC/NCI queries. See the [audit report](SOURCE-AUDIT.md) for query-match limitations and the two wording changes. |

ZIP SHA-256: `f9015f4d6b3c5fd6bf073457274e3e425f8a20a06248f80ad0313400873f64c0`.

The dependency audit reported zero known vulnerabilities at verification time. This is not a security guarantee.

## Publication

The [online demo](https://jakezwang.github.io/openplainenglish/) and [v0.2.0 preview release](https://github.com/jakezwang/openplainenglish/releases/tag/v0.2.0) are the publication destinations. CI and public-browser verification will be recorded here after deployment. The deployment workflow requires both Node 22 and Node 24 checks to pass before publishing the static site.

## Remaining verification and limitations

- Browser automation policy blocked `chrome://extensions`; no workaround was attempted. Native installation, `activeTab` grants, service-worker lifecycle, enforced extension CSP and real extension-storage persistence remain on the [manual checklist](TESTING.md#browser-checks-before-release).
- The automation browser's file-upload permission was unavailable. Native file-picker import was not verified; import behavior was checked through automated UI and bundled-background tests. The real browser export was verified separately.
- Edge, screen-reader use, and a complete narrow-screen/200%-zoom review remain unverified.
- The 100 explanations remain AI-assisted, editorially source-checked wording. Independent clinical review and participant comprehension testing have not occurred. The [review rubric](REVIEW.md) and [participant protocol](USER-TESTING.md) are ready for that work; they are not results.
- The online demo uses separate origin-local test storage and labeled mock browser APIs. Hosting receives ordinary web requests; see [privacy](PRIVACY.md#online-demo). It does not install the extension.
- Matching remains limited to supported English page text. PDFs, images, iframes, shadow roots, local files and browser-internal pages are unsupported; large pages may be partially marked.
