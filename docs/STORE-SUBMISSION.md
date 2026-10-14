# Chrome Web Store submission draft

Prepared against OpenPlainEnglish v0.5.0 on 2026-10-14. This is a submission worksheet, not a claim that an item has been submitted, approved, or installed. The owner confirmed that a Chrome Web Store developer account has not yet been registered. Opening the developer console was blocked by the current browser tool; no account change, payment, upload, or submission occurred. Native installation, upgrade and file-picker import remain unverified. Actual participant sessions completed: **0**. The installation-entrance record at the end is historical v0.2 evidence; the [v0.3 record](RELEASE-0.3.0.md) also applies only to that release.

## Installation route and remaining blockers

Publish one Chrome Web Store item, then link the website's install button to that item's real public listing URL. Users still confirm installation in the browser. Desktop Edge can install the same Chrome listing; Edge may first ask the user to allow extensions from other stores. A second Edge listing is not required for this route. Do not invent a store URL or label a ZIP download as one-click installation. [Microsoft's installation instructions](https://support.microsoft.com/en-us/edge/add-turn-off-or-remove-extensions-in-microsoft-edge).

Current blockers are account registration, completion of the store materials and privacy declarations, an actual installed-extension smoke test, and Google's review/publication. Registration requires a one-time fee; use the amount shown in the official dashboard, not a hard-coded estimate. The account needs a publisher name, verified contact email, two-step verification, and an accurate trader/non-trader declaration. Free/open-source status alone does not determine that declaration. [Registration](https://developer.chrome.com/docs/webstore/register), [account setup](https://developer.chrome.com/docs/webstore/set-up-account), [two-step verification](https://developer.chrome.com/docs/webstore/program-policies/two-step-verification), [trader FAQ](https://developer.chrome.com/docs/webstore/program-policies/trader-verification-faq).

给账号所有者：在 [Chrome 开发者控制台](https://chrome.google.com/webstore/devconsole) 注册发布者账号，核对费用后自行完成付款；验证联系邮箱、启用两步验证，并按实际情况声明 Trader/Non-Trader。注册完成后才能创建条目、上传 ZIP、填写本页材料并送审。注册、付款和身份声明尚未完成；本文件没有代替你同意任何条款。

After registration, upload the release ZIP with `manifest.json` at its root. Complete Store listing, Privacy, Distribution, and reviewer test instructions. Choose public distribution for general installation, then submit for review. Review completion is required before a public install link is usable; no review ETA is promised here. [Official publishing workflow](https://developer.chrome.com/docs/webstore/publish).

After publication, inspect the live store item and confirm its name, publisher and version. Set `stores.chrome.url` to that exact public listing URL and `stores.chrome.verifiedAt` to the actual verification date (`YYYY-MM-DD`) in `demo/install-config.json`. The website activates store buttons only for an official listing URL with this editorial verification record. Edge automatically uses the Chrome listing unless a verified native Edge URL is configured. Run `npm run check` and deploy the site. Leave unapproved, private, or unavailable items as `null`; a plausible URL or recorded date alone is not evidence of store approval.

## Required material and current state

| Material | Preparation / current state |
|---|---|
| Package | Build `release/openplainenglish-0.5.0.zip` from the release commit; check its adjacent SHA-256 file and contents after any final code change. Manifest V3, minimum Chromium 116. |
| Store icon | `assets/icons/128.png` exists, 128×128 PNG with alpha; inspect artwork against the store's padding guidance. |
| Screenshots | At least one, up to five; use 1280×800 (preferred) or 640×400, square corners, full bleed. Plan final native v0.5 captures under `assets/store/v0.5/`; this is a pending output location, not a claim those captures exist or were submitted. Documentation screenshots show the web demo, not an installed extension. |
| Small promotional tile | `assets/store/promo-small.jpg`, rendered from the adjacent original HTML artwork and checked at exactly 440×280 pixels. This is brand artwork, not an installed-extension screenshot. |
| Optional material | A 1400×560 marquee image; inspect the dashboard's current requirements for any promotional video field. |
| Listing text | Paste-ready English draft below; choose the dashboard's applicable reading/productivity category. The interface supports English and Simplified Chinese; webpage content and glossary entries are not translated. |
| Privacy policy | Public policy URL, updated Limited Use commitment, and accurate dashboard data disclosures. |
| Homepage/support | `https://jakezwang.github.io/openplainenglish/` and `https://github.com/jakezwang/openplainenglish/issues`. |

The dimensions and image requirements above come from [Chrome's image specification](https://developer.chrome.com/docs/webstore/images). Store screenshots should show the actual user experience. Web-preview images may be prepared as clearly labeled draft material; do not present them as evidence of an installed extension. Capture final screenshots during the native smoke test. The store-listing guide's video wording is broader than the dedicated image guide; confirm the current dashboard instead of treating a video as a verified blocker. [Listing fields](https://developer.chrome.com/docs/webstore/cws-dashboard-listing).

Use the Chromium ZIP for this submission. The separately produced `openplainenglish-0.5.0-firefox-preview.zip` is an unsigned Firefox 140+ developer draft; it still needs native validation and AMO signing/review. The `openplainenglish-core-0.5.0.tgz` SDK is a developer tarball, not an extension installer or an npm registry publication. The web document reader, sentence experiment, paragraph workshop, study harness and opt-in 8-entry public-service pilot are separate surfaces; they are not included as features or data of this health-extension listing.

## Paste-ready listing

**Name:** OpenPlainEnglish

**Short description:** Read health terms in plainer English on the page, compare original words, and restore the original text anytime.

**Detailed description:**

```text
OpenPlainEnglish changes selected English health phrases into everyday wording on the page you are reading, while keeping the original words available.

Open the extension from your browser toolbar, select “Plain reading,” and choose “Read in plain English.” Separately reviewed word-form pairs change in place; other known terms keep their wording and offer explanations. Select a marked phrase to compare its original wording, read an explanation, inspect its sources, restore that occurrence or ignore the term on this page. Choose “Explain terms” to read original words with optional explanations, or “Restore original” to turn the reader off. Untouched replacements restore exactly; text newly written by the website is preserved. Enable the reader again after reloading or opening a new document.

Features:
• A four-step practice guide, with no automatic activation on other pages.
• Optional reading of accessible same-origin frames and open shadow roots, disabled by default.
• A bundled glossary of 132 English health terms and supported aliases.
• 56 explicit replacement pairs across 30 entries, separately checked against sources. The other terms and unapproved word forms remain unchanged.
• Separate counts for replaced phrases and terms kept with explanations.
• Support for phrases split across selected inline formatting, such as emphasis. Interactive and complex boundaries remain excluded.
• Source links and clear boundaries for each explanation.
• English and Simplified Chinese interface controls, comfortable or compact layout, subtle or strong highlights and a remembered reading mode. The English glossary and webpage content are not translated.
• Keyboard commands to toggle reading or restore originals, subject to the browser's shortcut assignments.
• A glossary searchable by original words, replacement wording, and meanings, with local feedback drafts for suggested improvements.
• Review a feedback report, then copy or download it without an account. Separately export/import JSON backups or delete local drafts. Opening a prepared GitHub issue is optional and requires an explicit choice.

Page text is processed locally to find glossary matches and apply eligible replacements. Original matched text stays in the current reader's memory for restoration; it is not saved or uploaded. The extension checks the active page's address to determine whether it supports that page. It does not upload page text or browsing addresses, run analytics, or require an account. Reading preferences and up to 100 feedback drafts stay in local extension storage without automatic sync. Copying or downloading a report sends nothing to the project. Opening a prepared issue sends the reviewed feedback text to GitHub; publishing it is a separate action. Leave personal health details out of feedback.

This release supports ordinary English web-page text. Optional settings extend reading to accessible same-origin HTML frames and open shadow roots; both start off. It does not interpret PDFs, scanned images, forms, cross-origin frames or closed roots. The website document reader and sentence experiment are separate from this extension listing. It applies a limited set of word and phrase pairs, not a whole-sentence rewrite or grammar engine. It does not understand every context, interpret negation, diagnose a condition, or recommend treatment. Some large pages may be only partly checked. Ordinary copy and browser Find see the displayed wording; restore original words when you need to use those instead. Use the original-word comparison or Explain terms whenever a substitution does not fit the sentence.

The glossary and replacement pairs have been compared with primary sources, but have not undergone independent clinical review or participant comprehension testing. Source-checked does not guarantee that a replacement fits every sentence. This is a reading aid, not medical advice.

Open source: code under MIT; authored glossary wording under CC0. Source material retains its own applicable terms. No government endorsement is implied.
```

## Privacy fields and permission justifications

**Single purpose:** Help readers understand selected English health terms in ordinary web-page text through on-demand, local phrase substitutions, original-word comparisons and source-linked explanations.

| Field | Paste-ready justification |
|---|---|
| `activeTab` | Temporarily access the tab where the user invokes the extension. The active URL is checked only for supported-page eligibility; supported text is processed locally to locate glossary terms and apply the selected reading mode after activation. No browsing history is collected or uploaded. |
| `scripting` | Inject the packaged reader into the user-selected supported tab after activation. Plain reading applies eligible phrase substitutions; Explain terms preserves original words. Both add removable explanation controls, and Restore original removes them while restoring untouched replacements. The reader does not load remote executable code. |
| `storage` | Keep interface language, density, highlight, reading mode, the two additional-scope preferences and guide completion locally, plus up to 100 user-authored feedback drafts: draft ID, entry ID, term, category, note, creation time and glossary version. Users can export/import draft backups, copy/download a reviewed report or delete drafts. Preferences are separate from the seven-field feedback backup. Page text, titles and URLs are not automatically saved with feedback. |
| Remote code | No. Executable code and glossary data are packaged with the extension. The runtime glossary fetch uses an extension-local URL. Source websites and GitHub open only through the user's explicit navigation. |

These justifications reflect `manifest.json`, `src/background/actions.js`, `src/background/main.js`, `src/background/commands.js`, `src/content/controller.js`, `src/options/options.js`, `src/shared/preferences.js` and `src/shared/feedback.js`. The manifest requests exactly `activeTab`, `scripting` and `storage`; it contains no blanket host permissions. The source/compatibility audit CLIs and study harness are separate tooling, not extension runtime telemetry.

Chrome requires purpose, permission, remote-code, and data-use declarations consistent with the privacy policy. Local-only handling still requires disclosure. [Privacy fields](https://developer.chrome.com/docs/webstore/cws-dashboard-privacy), [User Data FAQ, questions 2–3 and 14](https://developer.chrome.com/docs/webstore/program-policies/user-data-faq).

**Data-category recommendation:** disclose Website content for the text read locally. Disclose the active URL in any Web history/browsing-data field that includes visited URLs, while clearly stating there is no history log or upload. Disclose user-provided feedback notes and the possibility of locally processed health-related text. If the dashboard's Health information category covers that access, include it; a health-themed dictionary alone is not evidence that the extension collects a patient's medical record. Match the live field definitions and retain the explanation. Do not select a blanket “no user data” on the basis of no server. The current runtime does not request identity, payment, authentication, or location data; free-text notes can nevertheless contain whatever a user types, so do not promise they can never contain sensitive information.

The policy URL is `https://github.com/jakezwang/openplainenglish/blob/main/docs/PRIVACY.md`; the Limited Use commitment has been added to this policy. Verify that the updated version is public before entering it. Keep the separate online-demo hosting disclosure and the warning that opening a prepared issue exposes its text to GitHub before publication.

**Policy wording to check against the published privacy page before submission:**

```text
OpenPlainEnglish's use of page text, the active tab's URL, local reading preferences and feedback data follows the Chrome Web Store User Data Policy, including its Limited Use requirements. This data is used only to provide local reading substitutions, original-word comparisons, explanations, reading settings and user-directed feedback features. It is not sold or used for advertising, profiling, or credit decisions. The extension does not transmit page text or the active tab's URL. Feedback is sent to GitHub only when the user chooses to open a prepared issue after reviewing its contents.
```

The applicable instruction is: “An affirmative statement that your use of the data complies with the Limited Use restrictions must be disclosed” on the extension's website or a linked policy page. This project-specific draft deliberately does not suggest the extension accesses Google account APIs. [Limited Use, section 6](https://developer.chrome.com/docs/webstore/program-policies/limited-use).

## Reviewer test instructions and final smoke test

No account or credentials are needed for reading or copying/downloading a feedback report. GitHub sign-in is needed only if the tester elects to submit a public issue; submission is unnecessary for this test. These are instructions for a future native run, not recorded pass results. Use invented content and keep the webpage's own reader off to avoid two readers operating on the same text.

```text
1. Install the v0.5.0 package in a clean desktop Chrome profile. Open https://jakezwang.github.io/openplainenglish/ and leave the page's own demo reader disabled.
2. Open OpenPlainEnglish from the browser toolbar. Select “Explain terms” while off and confirm the page stays unchanged. Select “Plain reading,” then “Read in plain English.” In the sample article, hypertension should become high blood pressure; biopsy should retain its original wording with an explanation. Confirm separate replacement and explanation counts.
3. Open a marked replacement and inspect its original wording, explanation, context and source links. Restore that occurrence, then verify another occurrence still uses the selected mode. Ignore a term for this page and check its marks disappear. Switch to “Explain terms” and confirm original wording; switch back, then choose “Restore original” and compare text with its initial wording.
4. Enable Plain reading again and choose the page's “Add another paragraph.” Confirm new text is processed and counts update. Use the compatibility lab's synthetic fixtures to check supported inline formatting, website edits and limits, leaving that page's own reader off. Use keyboard focus and Escape; confirm one focus stop per logical phrase. Reload and confirm activation is off and page-session ignores are cleared.
5. In the glossary's “Reading preferences,” save Chinese, Compact, Strong and Explain terms. Reopen the popup and options page and check persistence, readable labels and unchanged English glossary/user notes. Change settings while off and confirm no activation. Test Ctrl+Shift+L toggle and Ctrl+Shift+U restore (Control on macOS); inspect browser shortcut assignments if a conflict prevents assignment.
6. Search the glossary for “high blood pressure,” inspect the explicit replacement pair and note, and compare annotation-only biopsy. Save an invented feedback draft. In its review dialog, copy and download the report without an account, verify exact text, and cancel without deleting the draft. Separately export JSON, exercise native import preview/cancellation/confirmation, and confirm deletion. A report text file is not a JSON backup.
7. If testing “Open GitHub draft,” inspect the reviewed text and destination without publishing. Verify no automatic page URL, title or body was added. Check that reading, settings and local drafts make no external extension-origin requests.
8. Check browser Find and normal copy use displayed wording. Inspect native print preview for original words and absence of explanation UI; cancel and confirm the reading view returns. Inspect keyboard flow, narrow layout and 200% zoom in both interface languages.
9. Exercise the four-step guide, then verify both advanced scope settings are initially off. Use the compatibility lab to check accessible frames/open roots and restoration.
10. Open a browser settings page or PDF and confirm the surface is unsupported. Follow docs/UPGRADING.md with invented older-version drafts to test an actual upgrade, default preferences and backup recovery. Record installation, upgrade, import, shortcut and print results separately; do not infer them from the website demo.
```

Repeat the normal reading flow in desktop Edge after installation from the approved Chrome listing, including the other-store prompt when applicable. Record browser versions, installation method, results, and final screenshots. Existing automated tests and browser-based demo checks do not substitute for this native test. Until it and store approval are complete, label the installation entrance with its actual availability rather than claiming installation is live.

The [testing guide](TESTING.md) covers additional mutation, accessibility, package and privacy checks. The [three-condition protocol](USER-TESTING.md) is ready to run but has no participant results. Store copy and screenshots must not imply improved comprehension, clinical validation, full contextual understanding or completed accessibility certification.

## Historical v0.2 installation entrance verification — 2026-10-13

The local browser flow was checked from the homepage's install link to the installation page. Both unconfigured store buttons stayed hidden, the web demo remained available, and manual steps were collapsed. Chrome/Edge selection, arrow-key navigation and the copy-address action worked. No extension-manager page was opened and no browser permission was changed. Downloading the preview ZIP through the page produced the actual release file with SHA-256 `f9015f4d6b3c5fd6bf073457274e3e425f8a20a06248f80ad0313400873f64c0`. No console errors were observed in this flow.

At that v0.2 checkpoint, `npm run check` passed all 83 tests and built the extension; `npm run build:site` passed. The added checks covered official store URL validation, unverified-link suppression, Edge fallback, release URL boundaries, and installation assets resolving beneath the repository URL prefix. The four new tests validated installation-link behavior, not native extension installation. Extension runtime/package version was v0.2.0; those changes affected the website and submission materials.
