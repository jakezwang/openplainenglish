# OpenPlainEnglish

[![Checks](https://github.com/jakezwang/openplainenglish/actions/workflows/ci.yml/badge.svg)](https://github.com/jakezwang/openplainenglish/actions/workflows/ci.yml)

[Install OpenPlainEnglish](https://jakezwang.github.io/openplainenglish/demo/install.html) · [Try the online demo](https://jakezwang.github.io/openplainenglish/) · [中文入门](README.zh-CN.md)

[Read your own paragraph](https://jakezwang.github.io/openplainenglish/demo/workbench.html) · [Reusable engine and data](docs/SDK.md) · [P0–P2 completion ledger](docs/BACKLOG.md)

[First-use guide](https://jakezwang.github.io/openplainenglish/demo/guide.html) · [Read a PDF or image](https://jakezwang.github.io/openplainenglish/demo/documents.html) · [Sentence-splitting experiment](https://jakezwang.github.io/openplainenglish/demo/sentences.html)

Understand health information without losing the original words.

OpenPlainEnglish is an open-source extension for Chromium-based desktop browsers such as Chrome and Edge, requiring Chromium 116 or newer. Turn on **Plain reading** to replace selected health terms with reviewed everyday wording directly in the page. Click a marked phrase to compare it with the original and inspect its explanation and sources. **Restore original** returns untouched replacements to the exact original text. You can also choose **Explain terms** to keep every original word visible.

让专业语言更容易理解，让普通人也能平等地获取信息。v0.5 提供整页就地白话替换、原词对照和一键恢复；132 个英文医疗词条中，只有另行核对过的替换短语会改写正文，其余保留原词并提供解释。处理在本机完成。

![Local document reading with original image and checked plain wording](docs/images/online-demo-v0.5.png)

*Web demo of the shared reader. See the [v0.5.0 verification record](docs/RELEASE-0.5.0.md) for checked behavior and remaining gaps. Actual extension installation and runtime are still awaiting manual verification.*

## What v0.5 does

- Replaces supported terms in place using separately reviewed word-form pairs; keeps other terms available as clickable explanations. See the [replacement guide](docs/INLINE-LEXICON.md) for exact coverage and exclusions.
- Switches between **Plain reading** and **Explain terms** without reloading. Selecting a mode while off does not activate page processing.
- Shows the original matched wording alongside each replacement and restores untouched text exactly. Website edits made while reading are preserved.
- Marks terms from a bundled glossary of 132 English health entries, including useful phrases and aliases.
- Shows a short meaning, a fuller explanation, context, cited sources, and the entry's review status.
- Works locally on the current HTTP(S) page after you explicitly enable it.
- Provides a searchable glossary and local feedback drafts that you can review, export, import, delete, or submit to GitHub yourself. Backup imports show the affected drafts before you confirm a merge.
- Supports keyboard interaction and updates marks as ordinary page content changes.
- Restores one occurrence or ignores a term for the current page; keeps quoted wording and uncertain forms unchanged.
- Remembers English/Chinese interface, reading mode, density and mark strength. Shortcuts toggle reading or restore originals; new pages still start off.
- Matches supported phrases across transparent inline formatting, offers original-word copy, and uses original wording when printing.
- Adds a four-step practice guide, local PDF text extraction and English image/scanned-page OCR, with a required source check before plain reading. Files stay in the browser tab; the original remains visible.
- Includes 56 explicit replacement pairs across 30 entries. A fixed public corpus separately tracks explanation coverage and actual inline substitutions.
- Adds an opt-in sentence-splitting experiment with exact differences, review and undo, plus an offline analyzer for exported reader studies. No participant results are fabricated.
- Offers optional same-origin frame/open Shadow DOM reading, a local paragraph workshop, an eight-entry public-service pilot and an independent engine/data tarball. Firefox has a separate developer draft; see the [browser assessment](docs/BROWSERS-AND-SURFACES.md).

This is an early reading aid. The initial explanations were authored with AI assistance and are **source-checked**, meaning their wording was compared with the cited material. They have not been independently clinically reviewed or tested for comprehension, and no measured improvement in understanding is claimed. They do not interpret your symptoms, records, test results, or treatment choices. A word's meaning also depends on its context.

The dictionary matches written terms and aliases; it does not infer whether a statement applies to you, interpret negation, or resolve every ambiguity. Replacements are bounded editorial pairs. Unreviewed forms and unusual mixed capitalization retain their original wording. The separate sentence experiment only proposes conservative semicolon splits; it does not claim general semantic rewriting. English health terminology remains the main scope; the public-service dataset is an explicit pilot.

The extension supports ordinary web-page text, with separate default-off options for accessible same-origin HTML frames and open shadow roots. Cross-origin frames and closed roots remain excluded. Browser internal pages, extension stores, local files and the built-in PDF viewer remain outside the extension's scope. Phrases may span transparent inline formatting; interactive, editable, hidden, code and explicitly non-English regions are skipped. Large pages can be partly scanned, with the limit disclosed. The separate document reader processes PDF/PNG/JPEG files up to 15 MB, at most 100 PDF pages, one page at a time. OCR and extraction can lose wording or reading order; users must check the original before continuing.

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
2. Choose **Plain reading** and **Read in plain English**. The popup separately counts replaced phrases and terms kept for explanation.
3. Click a marked phrase, or focus it with the keyboard and activate it, to compare the original, read its explanation and check sources. You can also open the first explanation from the popup.
4. Switch to **Explain terms** to read the original text with explanation markers. Choose **Restore original** to remove all reader changes.

Activation applies to the current page load. Reloading or navigating to a new document starts with explanations disabled; enable them again if needed. The glossary and saved feedback are available from the extension's management page. A source link opens the cited website only when you choose it. Feedback starts as a local draft; opening a prepared GitHub issue requires your action, and publishing it requires GitHub's submission step.

## Privacy and permissions

The extension has no analytics, remote model, account, or runtime service. Matching, replacements and explanations use bundled data. Original matched text is held only in the current reader's memory for restoration, not saved or uploaded. It does not automatically collect page text, page titles, browsing URLs, or browsing history. The newest 100 feedback drafts stay in the browser's local extension storage; saving beyond that limit removes the oldest draft. Export drafts you want to retain. v0.5 can restore earlier v1 JSON exports after preview and confirmation, with duplicate IDs preserved and overflow clearly reported. There is no account sync. See [upgrading and restoring drafts](docs/UPGRADING.md).

| Permission | Purpose |
| --- | --- |
| `activeTab` | Access the current tab temporarily after you invoke the extension. |
| `scripting` | Add or remove the reader on that tab. |
| `storage` | Save local feedback drafts, reading preferences and guide completion. |

There are no blanket host permissions. Opening a source website or a prepared GitHub issue makes a normal browser navigation to that service. Public GitHub feedback can expose anything you type; remove personal health information and identifying details before sharing. Read the [privacy policy](docs/PRIVACY.md) for the data boundaries.

## Build and try the demo

Use Node.js 22.13 or later (CI uses Node 22 and 24) and npm. Install the pinned development dependencies, then build:

```sh
npm ci
npm run check
npm run package
```

Load `dist/` through **Load unpacked** to test your build. `npm run package` creates `release/openplainenglish-0.5.0.zip` and its `.sha256` checksum. Development dependencies are used for building and testing; the extension runtime has no third-party dependencies.

For the public-information demo:

```sh
npm run build:vendor
npm run dev
```

Open the local URL printed by that command. Its **Read in plain English** control exercises the shared reader without installing an extension. To test the installed extension on this page, leave the demo reader off and use the extension toolbar instead.

The links `demo/preview.html?view=options` and `demo/preview.html?view=popup` preview the real glossary and popup interfaces with clearly labeled mock browser APIs. They reuse background action code while storing test drafts separately in localStorage. These previews do not verify native extension installation or permissions. The practice guide is packaged with the extension; the other web tools and API adapters remain website-only. See [testing instructions](docs/TESTING.md).

`npm run build:site` builds the static demo into `site/`, including support for repository URL prefixes. GitHub Actions deploys it to GitHub Pages only after both test jobs pass on `main`. Hosting receives ordinary page requests; drafts are processed locally. See the [privacy policy](docs/PRIVACY.md#online-demo).

## Improve an explanation

Use the explanation's feedback control or [open an issue](https://github.com/jakezwang/openplainenglish/issues/new/choose) to tell us which term was confusing and why. Plain-language and accessibility feedback are welcome even if you do not write code. Share a public reference or a made-up example instead of a private health document.

For data changes, contribute original explanations with a traceable source and accurate licensing. Maintainers review factual meaning, plain language, context, licensing, and tests before merging. The review label must describe the review that actually happened. See [CONTRIBUTING.md](CONTRIBUTING.md), the [review rubric](docs/REVIEW.md), [reader-testing protocol](docs/USER-TESTING.md), [source audit](docs/SOURCE-AUDIT.md), [lexicon guide](docs/LEXICON.md) and [architecture](docs/ARCHITECTURE.md).

## Licenses

Code and project documentation are under the [MIT License](LICENSE). The authored glossary dataset is separately dedicated under [CC0 1.0](data/LICENSE). Initial explanations are original project text, with public-domain source citations recorded per entry. Citations do not transfer ownership of source pages; referenced material retains its own terms and exceptions. See the [lexicon guide](docs/LEXICON.md) for provenance and the contribution policy.

The website's document reader separately bundles PDF.js, Tesseract.js, its WebAssembly core and English language data under their own licenses. `npm run build:vendor` copies version-pinned assets and license notices; these dependencies are excluded from the extension and SDK. The deployed `vendor/NOTICE.txt` records attribution.

Explanations adapted from cited public sources. CDC, NIH/NLM/NCI, FDA and the U.S. Government do not endorse OpenPlainEnglish.

Community participation follows the [Code of Conduct](CODE_OF_CONDUCT.md). Report security concerns using [SECURITY.md](SECURITY.md).
