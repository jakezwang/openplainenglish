# OpenPlainEnglish v0.1.0 — verification record

Local verification date: **2026-10-13**. Scope: 100 English health entries, the shared reading interface, local feedback, and a Chromium extension package.

**The installed extension runtime has not been verified in a browser.** The results below distinguish the real shared reader on a localhost page from extension-page previews that use mock Chrome APIs.

![Localhost reading demo with marked health terms and the hypertension explanation open](images/reader-demo.jpg)

*Chrome localhost demo using the shared reader. This screenshot is not evidence of an installed extension.*

## Verified locally

| Surface | Observed result |
| --- | --- |
| Automated tests | **48 tests passed**, covering matching, page handling, lexicon validation, feedback and background actions. These tests do not install the extension. |
| Shared reader in Chrome | Enabling marked **8 terms**. Opening a term displayed an accessible dialog with short meaning, explanation, context, sources and review status. Escape closed it. Adding the sample paragraph increased the count to **11**. Disabling returned the count to **0** and preserved the page wording. |
| Options UI with labeled mock Chrome adapter | Searching `hypertension` returned **1 of 100** entries; details and sources opened. The feedback form received the selected term, saved a local draft and retained it after reload. The explicit GitHub preview showed the intended issue text. **No issue was posted.** This uses separate demo-origin storage. |
| Packaging integrity | Final ZIP: **16 files, 176,203 bytes**. Independent checks of this final artifact verified every CRC, safe paths, the exact asset allowlist, ZIP/dist byte equality and its checksum sidecar. `unzip -t` also passed. These checks do not demonstrate browser installation. |
| GitHub Actions | [Node 22 and Node 24 both passed](https://github.com/jakezwang/openplainenglish/actions/runs/38405129825): clean dependency installation, lexicon validation, 48 tests, build and package. The checked implementation is commit `7e7031904ee91c4dfcfd4601e1c29432729e3b5a`. |

The shared-reader verification followed fixes for a mutation-observer/status-render loop and placement of the accessible explanation panel in the document body.

Final ZIP SHA-256: `73928785612e7a61765b1adf374d303fab3aea1b94d2981be2c09f8eb5278400`.

The popup preview rendered correctly. Cancelling a local draft deletion preserved the draft. The dependency audit reported zero known vulnerabilities at verification time; this is not a security guarantee.

## Remaining verification and limitations

- Browser automation safety policy blocked access to `chrome://extensions`. No workaround was attempted. Loading the unpacked ZIP, real `activeTab` access, service-worker messaging, extension CSP enforcement and extension-storage persistence remain on the [manual checklist](TESTING.md#browser-checks-before-release).
- Edge, screen-reader use, and a complete narrow-screen/200%-zoom accessibility review are not verified in this record. A responsive layout and keyboard implementation do not establish accessibility certification.
- Definitions are AI-assisted original wording compared with cited sources. There has been no independent clinical review or reader-comprehension study.
- Matching is limited to supported English text nodes. It does not interpret records, negation or personal health status. PDFs, images, iframes, shadow roots, local files and browser-internal pages are unsupported; large pages can be partially marked.

The [v0.1.0 preview release](https://github.com/jakezwang/openplainenglish/releases/tag/v0.1.0) contains the ZIP and checksum. Later documentation-only changes can follow the implementation commit above. Installed-runtime verification remains outstanding; this release is for early evaluation.
