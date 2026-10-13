# OpenPlainEnglish

[![Checks](https://github.com/jakezwang/openplainenglish/actions/workflows/ci.yml/badge.svg)](https://github.com/jakezwang/openplainenglish/actions/workflows/ci.yml)

[Install OpenPlainEnglish](https://jakezwang.github.io/openplainenglish/demo/install.html) · [Try the online demo](https://jakezwang.github.io/openplainenglish/) · [中文入门](README.zh-CN.md)

Understand health information without losing the original words.

OpenPlainEnglish is an open-source extension for Chromium-based desktop browsers such as Chrome and Edge. It explains selected health terms on the page you are reading and requires Chromium 116 or newer. Turn it on when you need it, open a marked term for an explanation, and turn it off to remove the marks. The original wording stays available throughout.

让专业语言更容易理解，让普通人也能平等地获取信息。首版提供 100 个英文医疗词条，保留原词、就地解释，本地处理；反馈先保存在设备上，由你决定是否公开分享。

![OpenPlainEnglish online demo with the dehydration explanation open](docs/images/online-demo-v0.2.jpg)

*Public demo verified in Chrome. See the [v0.2.0 verification record](docs/RELEASE-0.2.0.md) for checked behavior and remaining gaps. Actual extension installation and runtime are still awaiting manual verification.*

## What v0.2 does

- Marks terms from a bundled glossary of 100 English health entries, including useful phrases and aliases.
- Shows a short meaning, a fuller explanation, context, cited sources, and the entry's review status.
- Works locally on the current HTTP(S) page after you explicitly enable it.
- Provides a searchable glossary and local feedback drafts that you can review, export, import, delete, or submit to GitHub yourself. Backup imports show the affected drafts before you confirm a merge.
- Supports keyboard interaction and updates marks as ordinary page content changes.

This is an early reading aid. The initial explanations were authored with AI assistance and are **source-checked**, meaning their wording was compared with the cited material. They have not been independently clinically reviewed or tested for comprehension, and no measured improvement in understanding is claimed. They do not interpret your symptoms, records, test results, or treatment choices. A word's meaning also depends on its context.

The dictionary matches written terms and aliases; it does not infer whether a statement applies to you, interpret negation, or resolve every ambiguity. v0.2 covers English health terminology. Legal, insurance, food, translation, and OCR features are outside this release.

The first release supports ordinary web-page text. Browser internal pages, extension stores, local files, PDF files and the browser's PDF viewer, scanned images, embedded documents, iframes, and shadow roots are outside its supported scope. Matching happens within each text node, so a phrase split across separate HTML elements may not be marked. Forms, editable areas, links, buttons, code, hidden content, and explicitly non-English passages are skipped. Very large pages may receive only partial marking; the interface reports this limit.

## Install a release in Chrome or Edge

[Open the installation page](https://jakezwang.github.io/openplainenglish/demo/install.html). **A store installation is not available yet:** developer registration and store review are still pending. The installation page will link to verified Chrome/Edge store listings when published. Browser confirmation is required. Downloading a ZIP does not install the extension.

For the current developer preview:

1. Download the versioned extension ZIP from [Releases](https://github.com/jakezwang/openplainenglish/releases).
2. Extract the ZIP into a folder you can keep. Use the extracted folder containing `manifest.json`; do not select the ZIP itself.
3. Open `chrome://extensions` in Chrome or `edge://extensions` in Edge.
4. Turn on **Developer mode**, choose **Load unpacked**, and select that folder.
5. Pin OpenPlainEnglish if you want quick access to its toolbar button.

This release is distributed as an unpacked extension, with no browser-store installation or automatic updates. Export any feedback you want to retain before updating. To update an existing installation, replace the old extracted folder's contents with the newer release and use **Reload** on the extensions page. Reload an already-open web page before using the new version. Loading a different folder can create a separate installation with separate drafts. Removing the extension also removes its stored local feedback; exported files remain available separately.

## Read a page

1. Open an ordinary HTTP(S) page and choose OpenPlainEnglish from the toolbar.
2. Enable explanations for that page. The popup reports the number of marked terms.
3. Click a marked term, or focus it with the keyboard and activate it, to read its explanation. You can also open the first explanation from the popup.
4. Close the explanation to return to reading. Disable explanations from the popup to remove the marks.

Activation applies to the current page load. Reloading or navigating to a new document starts with explanations disabled; enable them again if needed. The glossary and saved feedback are available from the extension's management page. A source link opens the cited website only when you choose it. Feedback starts as a local draft; opening a prepared GitHub issue requires your action, and publishing it requires GitHub's submission step.

## Privacy and permissions

The extension has no analytics, remote model, account, or runtime service. Matching and explanations use bundled data. It does not automatically collect page text, page titles, browsing URLs, or browsing history. The newest 100 feedback drafts stay in the browser's local extension storage; saving beyond that limit removes the oldest draft. Export drafts you want to retain. v0.2 can restore v0.1 and v0.2 JSON exports after preview and confirmation, with duplicate IDs preserved and overflow clearly reported. There is no account sync. See [upgrading and restoring drafts](docs/UPGRADING.md).

| Permission | Purpose |
| --- | --- |
| `activeTab` | Access the current tab temporarily after you invoke the extension. |
| `scripting` | Add or remove the reader on that tab. |
| `storage` | Save your local feedback drafts. |

There are no blanket host permissions. Opening a source website or a prepared GitHub issue makes a normal browser navigation to that service. Public GitHub feedback can expose anything you type; remove personal health information and identifying details before sharing. Read the [privacy policy](docs/PRIVACY.md) for the data boundaries.

## Build and try the demo

Use Node.js 22 or 24 and npm. Install the pinned development dependencies, then build:

```sh
npm ci
npm run check
npm run package
```

Load `dist/` through **Load unpacked** to test your build. `npm run package` creates `release/openplainenglish-0.2.0.zip` and its `.sha256` checksum. Development dependencies are used for building and testing; the extension runtime has no third-party dependencies.

For the public-information demo:

```sh
npm run dev
```

Open the local URL printed by that command. Its **Enable reader** control exercises the shared reader without installing an extension. To test the installed extension on this page, leave the demo reader off and use the extension toolbar instead.

The links `demo/preview.html?view=options` and `demo/preview.html?view=popup` preview the real glossary and popup interfaces with clearly labeled mock browser APIs. They reuse the background action code while storing test drafts separately in browser localStorage. These previews help inspect layout and interaction; they do not verify extension installation, permissions, service-worker execution, or real tab access. The demo and adapters are excluded from the extension package. See [testing instructions](docs/TESTING.md) for the release checklist.

`npm run build:site` builds the static demo into `site/`, including support for repository URL prefixes. GitHub Actions deploys it to GitHub Pages only after both test jobs pass on `main`. Hosting receives ordinary page requests; drafts are processed locally. See the [privacy policy](docs/PRIVACY.md#online-demo).

## Improve an explanation

Use the explanation's feedback control or [open an issue](https://github.com/jakezwang/openplainenglish/issues/new/choose) to tell us which term was confusing and why. Plain-language and accessibility feedback are welcome even if you do not write code. Share a public reference or a made-up example instead of a private health document.

For data changes, contribute original explanations with a traceable source and accurate licensing. Maintainers review factual meaning, plain language, context, licensing, and tests before merging. The review label must describe the review that actually happened. See [CONTRIBUTING.md](CONTRIBUTING.md), the [review rubric](docs/REVIEW.md), [reader-testing protocol](docs/USER-TESTING.md), [source audit](docs/SOURCE-AUDIT.md), [lexicon guide](docs/LEXICON.md) and [architecture](docs/ARCHITECTURE.md).

## Licenses

Code and project documentation are under the [MIT License](LICENSE). The authored glossary dataset is separately dedicated under [CC0 1.0](data/LICENSE). Initial explanations are original project text, with public-domain source citations recorded per entry. Citations do not transfer ownership of source pages; referenced material retains its own terms and exceptions. See the [lexicon guide](docs/LEXICON.md) for provenance and the contribution policy.

Explanations adapted from cited public sources. CDC, NIH/NLM/NCI, FDA and the U.S. Government do not endorse OpenPlainEnglish.

Community participation follows the [Code of Conduct](CODE_OF_CONDUCT.md). Report security concerns using [SECURITY.md](SECURITY.md).
