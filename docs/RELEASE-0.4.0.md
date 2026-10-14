# v0.4.0 verification record

Verified on 2026-10-13 (America/New_York; some machine reports use 2026-10-14 UTC). This remains a **developer preview**. The [P0–P2 ledger](BACKLOG.md) distinguishes delivered work from owner actions and independent validation.

## What ships

- Original/reading paragraph comparison, exact original copy, visible-reading copy, single-occurrence restore and page-session term ignore.
- Bounded matching across transparent inline formatting, conservative quotation/name/compound/possessive guards, preservation of website edits, and original-word printing lifecycle.
- English/Chinese interface labels, comfortable/compact panels, subtle/strong marks, remembered mode, toggle/restore shortcuts, and explicit local feedback report review/copy/download.
- A separate public-service pilot, a six-passage three-condition study, and a visible compatibility lab.
- A Chromium ZIP, an unsigned Firefox developer ZIP, and an independently usable engine/data tarball with licenses and examples.

The health glossary contains 112 entries; 21 have 40 explicit inline pairs. The optional public-service pilot contains 8 entries and 14 pairs. The 12 new health entries are explanation-only. The default extension continues to load only health data.

## Automated evidence

`npm run check` passed all **165 tests**, validated both lexicons and built the Chromium extension locally on Node 26.10.0. Tests cover literal boundaries, transparent inline groups, exact restoration, host edits, bounded traversal, mutation timing, keyboard/focus structure, preferences, serialized background actions, feedback allowlists/imports, study/export behavior and the workshop. Final test totals and CI links are recorded in the release notes.

`npm run package`, `npm run package:firefox` and `npm run package:sdk` produce downloadable archives and SHA-256 sidecars. ZIP integrity and checksums are checked independently. SDK checks exercise packaged imports and both datasets. A package passing these checks is not an installed-extension result.

Source checks found 112/112 unique health URLs available and 91 official MedlinePlus API topic matches; both unique public-service source URLs were available. Reports are release assets. Availability does not establish editorial accuracy or independent approval. The frozen four-page corpus covers 80/122 selected labeled occurrences versus 39/122 with the frozen previous dictionary; inline-eligible occurrences remain 12. See [coverage and its selection limits](COVERAGE.md).

## Public HTML snapshot checks

`npm run check:compatibility` downloads three public pages, uses JSDOM without executing site scripts or loading page resources, then restores the reader. The report includes source URLs, hashes, method, logical phrase/segment counts and timing. All three restored both text and markup exactly and had one keyboard target per logical phrase, with secondary segments hidden from assistive technology.

| Snapshot | Logical phrases | Inline segments | Initial scan, this run |
| --- | ---: | ---: | ---: |
| MedlinePlus lab-result explanation | 23 | 25 | 70.87 ms |
| MedlinePlus cholesterol-level test | 99 | 99 | 72.19 ms |
| CPSC plain-language principles | 7 | 7 | 55.57 ms |

These single local timings are diagnostic observations, not browser performance guarantees. They do not exercise native permissions, live site scripts, layout, installation or accessibility software.

## Rendered Chrome checks

Using the actual source reader in regular browser pages:

- The compatibility fixture reported 9 logical phrases across 12 marker segments, including `blood <strong>glucose</strong>` and `magnetic <em>resonance</em> imaging`. Existing bold/italic structure remained intact. Quoted and compound wording stayed original.
- Enter opened the explanation; Escape returned focus to the phrase. Restoring one occurrence returned focus to its new original-word marker. Ignoring a term removed its other page markers and also excluded a newly added occurrence.
- A simulated website correction remained present after disabling the reader. A 1,000-paragraph fixture disclosed the 750-mark limit and restored its exact source text; the observed scan was 76.5 ms and restore 18.8 ms. That run retained the session's ignored hypertension term and therefore counted 750 biopsy explanations.
- The workshop showed original and reading text side by side. After the copy-complete status, clipboard contents matched the full original and full current reading text respectively. The public-service sample produced three replacements. Chinese explanation controls and the explicit English-content notice were visible.
- Options preview persisted Chinese/compact/strong/annotation preferences across reload; popup preview used the remembered mode. These pages use a simulated extension API and do not verify native extension storage or permissions.
- An invented feedback report was reviewed, copied and downloaded as a text file without opening GitHub or sending feedback. Canceling the share review retained the draft.
- A synthetic six-passage study run completed in sequence 3 and downloaded valid JSON: six records, two per condition, explicit completion/consent, and one explanation opening for the exercised phrase. These are workflow checks, **not participant observations**; no effectiveness result is claimed.

![Original and reading comparison with Chinese explanation controls](images/online-demo-v0.4.png)

The browser viewport override and zoom shortcut did not change the measured 1,264-CSS-pixel viewport in this environment. Narrow viewport and 200% native zoom checks remain unverified. An auxiliary local responsive fixture could not be opened through the browser tool; no layout pass is inferred. Automated print-event tests pass, but native print preview, screen-reader listening and physical-device checks remain open.

## Release and remaining gates

The [v0.4.0 release](https://github.com/jakezwang/openplainenglish/releases/tag/v0.4.0) provides packages, checksums and evidence reports. The [workshop](https://jakezwang.github.io/openplainenglish/demo/workbench.html), [study](https://jakezwang.github.io/openplainenglish/demo/study.html) and [compatibility lab](https://jakezwang.github.io/openplainenglish/demo/compatibility.html) are regular browser pages and require no extension account.

Native extension-manager automation was rejected by automatic approval review. Native file selection was unavailable because the browser integration lacks local-file access; no permission change or bypass was attempted. The developer console was also inaccessible. Consequently native Chrome/Edge installation, actual upgrade/import, extension screenshots and store submission are pending owner steps. The Chrome Web Store account has not been opened or paid for, and there is no approved store URL. Firefox is unsigned and has not had a native runtime check. Safari conversion was not produced because the local packager was unavailable.

Independent expert review, real consenting-reader testing, native browser/device accessibility checks, publisher declarations, signing and external store review remain open. No reviewer, participant, endorsement, store approval or comprehension gain has been invented. See [owner steps](BACKLOG.md#steps-that-need-the-owner-or-external-participants).
