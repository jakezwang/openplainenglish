# Chrome Web Store submission draft

Prepared against OpenPlainEnglish v0.2.0 on 2026-10-13. This is a submission worksheet, not a claim that an item has been submitted, approved, or installed. The owner confirmed that a Chrome Web Store developer account has not yet been registered. Opening the developer console was blocked by the current browser tool; no account change, payment, upload, or submission occurred. Native installed-extension behavior remains unverified.

## Installation route and remaining blockers

Publish one Chrome Web Store item, then link the website's install button to that item's real public listing URL. Users still confirm installation in the browser. Desktop Edge can install the same Chrome listing; Edge may first ask the user to allow extensions from other stores. A second Edge listing is not required for this route. Do not invent a store URL or label a ZIP download as one-click installation. [Microsoft's installation instructions](https://support.microsoft.com/en-us/edge/add-turn-off-or-remove-extensions-in-microsoft-edge).

Current blockers are account registration, completion of the store materials and privacy declarations, an actual installed-extension smoke test, and Google's review/publication. Registration requires a one-time fee; use the amount shown in the official dashboard, not a hard-coded estimate. The account needs a publisher name, verified contact email, two-step verification, and an accurate trader/non-trader declaration. Free/open-source status alone does not determine that declaration. [Registration](https://developer.chrome.com/docs/webstore/register), [account setup](https://developer.chrome.com/docs/webstore/set-up-account), [two-step verification](https://developer.chrome.com/docs/webstore/program-policies/two-step-verification), [trader FAQ](https://developer.chrome.com/docs/webstore/program-policies/trader-verification-faq).

给账号所有者：在 [Chrome 开发者控制台](https://chrome.google.com/webstore/devconsole) 注册发布者账号，核对费用后自行完成付款；验证联系邮箱、启用两步验证，并按实际情况声明 Trader/Non-Trader。注册完成后才能创建条目、上传 ZIP、填写本页材料并送审。注册、付款和身份声明尚未完成；本文件没有代替你同意任何条款。

After registration, upload the release ZIP with `manifest.json` at its root. Complete Store listing, Privacy, Distribution, and reviewer test instructions. Choose public distribution for general installation, then submit for review. Review completion is required before a public install link is usable; no review ETA is promised here. [Official publishing workflow](https://developer.chrome.com/docs/webstore/publish).

After publication, inspect the live store item and confirm its name, publisher and version. Set `stores.chrome.url` to that exact public listing URL and `stores.chrome.verifiedAt` to the actual verification date (`YYYY-MM-DD`) in `demo/install-config.json`. The website activates store buttons only for an official listing URL with this editorial verification record. Edge automatically uses the Chrome listing unless a verified native Edge URL is configured. Run `npm run check` and deploy the site. Leave unapproved, private, or unavailable items as `null`; a plausible URL or recorded date alone is not evidence of store approval.

## Required material and current state

| Material | Preparation / current state |
|---|---|
| Package | `release/openplainenglish-0.2.0.zip`; recheck its checksum and contents after any final code change. Manifest V3, minimum Chromium 116. |
| Store icon | `assets/icons/128.png` exists, 128×128 PNG with alpha; inspect artwork against the store's padding guidance. |
| Screenshots | At least one, up to five; use 1280×800 (preferred) or 640×400, square corners, full bleed. Existing `docs/images/*.jpg` files are 1264/1265×1130 and do not meet these dimensions. |
| Small promotional tile | `assets/store/promo-small.jpg`, rendered from the adjacent original HTML artwork and checked at exactly 440×280 pixels. This is brand artwork, not an installed-extension screenshot. |
| Optional material | A 1400×560 marquee image; inspect the dashboard's current requirements for any promotional video field. |
| Listing text | Paste-ready draft below; language English; choose the dashboard's applicable reading/productivity category. No translation support is claimed. |
| Privacy policy | Public policy URL, updated Limited Use commitment, and accurate dashboard data disclosures. |
| Homepage/support | `https://jakezwang.github.io/openplainenglish/` and `https://github.com/jakezwang/openplainenglish/issues`. |

The dimensions and image requirements above come from [Chrome's image specification](https://developer.chrome.com/docs/webstore/images). Store screenshots should show the actual user experience. Web-preview images may be prepared as clearly labeled draft material; do not present them as evidence of an installed extension. Capture final screenshots during the native smoke test. The store-listing guide's video wording is broader than the dedicated image guide; confirm the current dashboard instead of treating a video as a verified blocker. [Listing fields](https://developer.chrome.com/docs/webstore/cws-dashboard-listing).

## Paste-ready listing

**Name:** OpenPlainEnglish

**Short description:** Understand health terms where you read. Short, sourced explanations on demand, with a local open dictionary.

**Detailed description:**

```text
OpenPlainEnglish explains selected English health terms on the page you are reading, while keeping the original wording available.

Open the extension from your browser toolbar and choose “Explain this page.” Marked terms open short explanations, fuller context, and links to their sources. Turn it off to remove the marks. Enable it again after reloading or opening a new document.

Features:
• A bundled glossary of 100 English health terms and supported aliases.
• Source links and clear boundaries for each explanation.
• A searchable glossary and local feedback drafts.
• Export, import, and delete your feedback. Review a draft before choosing to open it on GitHub.

Page text is processed locally to find glossary matches. The extension checks the active page's address to determine whether it supports that page. It does not upload page text or browsing addresses, run analytics, or require an account. Feedback stays in local extension storage unless you export it or explicitly open a prepared GitHub issue. Opening that issue sends your chosen note to GitHub; publishing it is a separate action. Leave personal health details out of feedback.

This release supports ordinary English web-page text. It does not interpret PDFs, scanned images, forms, embedded frames, or shadow-root content. It matches glossary words and phrases; it does not understand every context, interpret negation, diagnose a condition, or recommend treatment. Some large pages may be only partly marked.

The glossary has been compared with primary sources, but has not undergone independent clinical review or participant comprehension testing. It is a reading aid, not medical advice.

Open source: code under MIT; authored glossary wording under CC0. Source material retains its own applicable terms. No government endorsement is implied.
```

## Privacy fields and permission justifications

**Single purpose:** Help readers understand selected English health terms in ordinary web-page text through an on-demand, locally processed glossary with source-linked explanations.

| Field | Paste-ready justification |
|---|---|
| `activeTab` | Temporarily access the tab where the user invokes the extension. The active URL is checked only for supported-page eligibility; supported text is processed locally to locate glossary terms after the user enables explanations. No browsing history is collected or uploaded. |
| `scripting` | Inject the packaged reader into the user-selected supported tab after activation. The reader adds removable glossary markers and explanation controls. It does not load remote executable code. |
| `storage` | Keep up to 100 user-authored feedback drafts in local extension storage, including term, category, note, ID, creation time, and glossary version. Users can export, import, or delete them. Page text, titles, and URLs are not automatically saved with feedback. |
| Remote code | No. Executable code and glossary data are packaged with the extension. The runtime glossary fetch uses an extension-local URL. Source websites and GitHub open only through the user's explicit navigation. |

These justifications reflect `manifest.json`, `src/background/actions.js`, `src/background/main.js`, `src/content/controller.js`, `src/options/options.js`, and `src/shared/feedback.js`. The manifest requests exactly `activeTab`, `scripting`, and `storage`; it contains no blanket host permissions. The source-audit CLI is development tooling and is not extension runtime behavior.

Chrome requires purpose, permission, remote-code, and data-use declarations consistent with the privacy policy. Local-only handling still requires disclosure. [Privacy fields](https://developer.chrome.com/docs/webstore/cws-dashboard-privacy), [User Data FAQ, questions 2–3 and 14](https://developer.chrome.com/docs/webstore/program-policies/user-data-faq).

**Data-category recommendation:** disclose Website content for the text read locally. Disclose the active URL in any Web history/browsing-data field that includes visited URLs, while clearly stating there is no history log or upload. Disclose user-provided feedback notes and the possibility of locally processed health-related text. If the dashboard's Health information category covers that access, include it; a health-themed dictionary alone is not evidence that the extension collects a patient's medical record. Match the live field definitions and retain the explanation. Do not select a blanket “no user data” on the basis of no server. The current runtime does not request identity, payment, authentication, or location data; free-text notes can nevertheless contain whatever a user types, so do not promise they can never contain sensitive information.

The policy URL is `https://github.com/jakezwang/openplainenglish/blob/main/docs/PRIVACY.md`; the Limited Use commitment has been added to this policy. Verify that the updated version is public before entering it. Keep the separate online-demo hosting disclosure and the warning that opening a prepared issue exposes its text to GitHub before publication.

**Recommended Limited Use addition to the policy:**

```text
OpenPlainEnglish's use of page text, the active tab's URL, and feedback data follows the Chrome Web Store User Data Policy, including its Limited Use requirements. This data is used only to provide reading explanations and user-directed feedback features. It is not sold or used for advertising, profiling, or credit decisions. The extension does not transmit page text or the active tab's URL. Feedback is sent to GitHub only when the user chooses to open a prepared issue after reviewing its contents.
```

The applicable instruction is: “An affirmative statement that your use of the data complies with the Limited Use restrictions must be disclosed” on the extension's website or a linked policy page. This project-specific draft deliberately does not suggest the extension accesses Google account APIs. [Limited Use, section 6](https://developer.chrome.com/docs/webstore/program-policies/limited-use).

## Reviewer test instructions and final smoke test

No account or credentials are needed for the reading feature. GitHub sign-in is needed only if the tester elects to submit public feedback; submission is unnecessary for this test.

```text
1. Install this package in a clean desktop Chrome profile. Open https://jakezwang.github.io/openplainenglish/ and leave the page's own demo reader disabled.
2. Open OpenPlainEnglish from the browser toolbar, then choose “Explain this page.” Open a marked term; confirm its explanation, context, and source links.
3. Use keyboard focus to open and close an explanation. Turn the extension off and confirm the original page remains readable. Reload the page and confirm activation is off again.
4. Open the glossary from the extension, search for “gastritis,” and create an invented feedback draft. Confirm it appears locally. Test export, import preview, and delete with invented text.
5. Open the share preview and cancel it; confirm no issue is submitted. If testing “Open GitHub draft,” review the destination but do not publish test feedback.
6. Open a browser settings page or PDF and confirm the extension explains that the surface is unsupported.
```

Repeat the normal reading flow in desktop Edge after installation from the approved Chrome listing, including the other-store prompt when applicable. Record browser versions, installation method, results, and final screenshots. Existing automated tests and browser-based demo checks do not substitute for this native test. Until it and store approval are complete, label the installation entrance with its actual availability rather than claiming installation is live.

## Installation entrance verification — 2026-10-13

The local browser flow was checked from the homepage's install link to the installation page. Both unconfigured store buttons stayed hidden, the web demo remained available, and manual steps were collapsed. Chrome/Edge selection, arrow-key navigation and the copy-address action worked. No extension-manager page was opened and no browser permission was changed. Downloading the preview ZIP through the page produced the actual release file with SHA-256 `f9015f4d6b3c5fd6bf073457274e3e425f8a20a06248f80ad0313400873f64c0`. No console errors were observed in this flow.

`npm run check` passed all 83 tests and built the extension; `npm run build:site` passed. New checks cover official store URL validation, unverified-link suppression, Edge fallback, release URL boundaries, and installation assets resolving beneath the repository URL prefix. The four new tests validate installation-link behavior, not native extension installation. Extension runtime/package version remains v0.2.0; these changes affect the website and submission materials.
