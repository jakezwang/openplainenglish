# Browser and reading-surface assessment

Assessed for v0.4.0 on 2026-10-13. A packaged draft or passing DOM test does not establish native browser compatibility.

| Target | Concrete delivery | Remaining validation or owner step |
| --- | --- | --- |
| Chrome desktop | MV3 ZIP, activeTab-only activation, shortcuts, local preferences and drafts | Native installation/upgrade/runtime, developer account registration/payment, publisher declarations, review and store URL |
| Edge desktop | Same Chromium package; Edge can install an approved Chrome Web Store listing after allowing extensions from other stores | Native Edge test and an approved Chrome listing are pending. A separate Microsoft publisher account is needed only if choosing an additional Edge Add-ons listing |
| Firefox desktop | Separate `-firefox-preview.zip`, nonpersistent background scripts, `browser` promise API namespace, stable extension ID, minimum Firefox 140 and no automatic data collection declaration | Native runtime, clipboard behavior, permissions/shortcuts, AMO account/signing/review. Unsigned ZIP is a developer draft, not a one-click installer |
| Safari macOS/iOS | Conversion assessment and shared web engine/data; regular-browser workshop usable without installing an extension | Local Safari packager is unavailable (`xcrun --find safari-web-extension-packager`). App Store Connect or an appropriate Apple toolchain plus owner developer membership/signing and device testing are required |
| Mobile web | Responsive paragraph workshop and reading demo, no account | Narrow desktop viewport checks are not real-device testing; device browser/keyboard/assistive technology still need checks |
| Firefox Android | Feasibility only; not advertised in Firefox manifest | Mozilla's Android compatibility declaration, Android runtime and store review after desktop stabilization |

Firefox's background model differs from Chromium, so the build replaces `background.service_worker` with `background.scripts`. The code selects the promise-based browser namespace when available. No new host permission is introduced. See [Mozilla background documentation](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/manifest.json/background) and [namespace differences](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Chrome_incompatibilities).

The Firefox draft declares a minimum of 140, matching the desktop introduction of built-in data-consent declarations. Ordinary reading, preferences and drafts stay local; the reviewer must also inspect the explicit user-directed GitHub feedback link. A final store declaration must describe the final shipped behavior. See [Mozilla data consent](https://extensionworkshop.com/documentation/develop/firefox-builtin-data-consent/) and [browser-specific manifest settings](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/manifest.json/browser_specific_settings).

Microsoft documents [installing Chrome Web Store extensions in Edge](https://support.microsoft.com/en-us/edge/add-turn-off-or-remove-extensions-in-microsoft-edge). That route does not require a separate Edge publisher account. An optional independent Edge Add-ons listing needs a publisher account and submission; see [Microsoft's extension overview](https://learn.microsoft.com/en-us/microsoft-edge/extensions/). Neither route establishes this extension's native Edge compatibility. Apple now documents both local packaging and App Store Connect packaging; owner account access and distribution obligations remain. See [Apple packaging](https://developer.apple.com/documentation/safariservices/packaging-a-web-extension-for-safari) and [distribution](https://developer.apple.com/documentation/safariservices/distributing-your-safari-web-extension).

## Additional reading surfaces

| Surface | Decision in this release | Reason and next experiment |
| --- | --- | --- |
| Plain paragraphs | Shipped local workshop with original/reading comparison, one-occurrence undo, original copy, and clear/reset | Explicit phrases only. Sentence restructuring is not implemented or presented as AI understanding |
| Text PDFs | Paste extracted text into the workshop; no PDF viewer injection | A future PDF text-layer adapter must retain page/line coordinates, reading order, original selection and a visible extraction warning; test multi-column and ligature cases before enabling |
| Scanned PDFs/images | No OCR implementation | OCR can change numbers, negation and units. A future local OCR experiment must first measure transcription accuracy, show the source image alongside output, and require correction before simplification |
| Iframes | Deliberately skipped, including same-origin frames | Each frame needs its own activation/lifecycle/restore contract. Cross-origin frames would widen permissions; no such access is requested here |
| Shadow DOM | Deliberately skipped | Open roots require separate observers/styles/focus handling; closed roots cannot be traversed. Do not promise whole-page coverage when components are inaccessible |
| Inline HTML | Supported only across documented transparent inline tags; complex/interactive boundaries stop a phrase | The reader keeps existing elements and restores owned text; see the regression fixtures and release evidence |
| Full sentence rewriting | Exploration delivered as constrained phrase comparison; no generative rewrite | Before a model-based experiment, define input consent, local vs remote processing, source retention, negation/numbers/units checks, uncertainty display and an independent paired evaluation |

The workshop in the v0.4 build provides the mobile/PDF-text path. It never opens local files, uploads text, saves paragraphs or automatically contacts a model. The compatibility lab exposes dynamic content, host edits, split phrases and large-page limits for repeatable inspection. Run `npm run preview:site` locally; after the v0.4 site deployment, the public [workshop](https://jakezwang.github.io/openplainenglish/demo/workbench.html) and [compatibility lab](https://jakezwang.github.io/openplainenglish/demo/compatibility.html) provide the same surfaces.
