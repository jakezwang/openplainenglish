# P0–P2 execution ledger

This ledger tracks the backlog requested on 2026-10-13. “Delivered” means the stated implementation or preparation exists with evidence; it does not turn pending human, store or native-browser checks into passes. The release remains a developer preview until those checks are completed. See [v0.4 evidence](RELEASE-0.4.0.md).

| ID | Item | Delivery and remaining boundary |
| --- | --- | --- |
| P0-1 | Real Chrome/Edge install and runtime | Release ZIP/checksum, bundled integration tests and executable [compatibility lab](../demo/compatibility.html). Native extension installation, permissions, service worker and actual-site use still need a person; extension-management UI access was blocked |
| P0-2 | Real upgrade and feedback backup restore | Backward-compatible import validation/preview/merge tests and [upgrade checklist](UPGRADING.md). Actual extension upgrade and native file chooser remain unverified; file access was blocked. A simulated API preview is not equivalent |
| P0-3 | Chrome Web Store account | [Account/material worksheet](STORE-SUBMISSION.md) prepared. Owner must register, pay, verify contact information and accept publisher terms |
| P0-4 | Store submission | v0.4 package, metadata, privacy, reviewer instructions, icons and promo artwork prepared. Installed-extension screenshots, owner declarations, upload, review and responses await the account and native verification |
| P0-5 | Genuine one-click install | Installation page ready with validated store-URL configuration and ZIP fallback. No fake store button or installation claim. Activate the real listing only after store approval |
| P1-1 | Independent content review | [Pair ledger](INLINE-LEXICON.md), source evidence and [independent review form](REVIEW.md) prepared. No independent human reviewer has signed off; this stays open |
| P1-2 | Better-than-dictionary evaluation | [Three-condition protocol](USER-TESTING.md) and [runnable study](../demo/study.html): balanced sequences, six synthetic passages, time/confidence/answers/lookup counts, interruption notes and explicit local export. Zero real participant results; benefit remains unproven |
| P1-3 | Site compatibility/performance | Public HTML snapshot checker plus dynamic/complex/long-article browser fixture delivered. [Evidence record](RELEASE-0.4.0.md) separates JSDOM, rendered lab and native extension checks. Live installed-extension use on real sites remains open |
| P1-4 | Accessibility | Keyboard/focus, localized labels, live statuses, responsive layouts and automated DOM checks delivered. Browser evidence is recorded separately. Screen-reader listening and real-device checks need people; no WCAG-conformance claim |
| P1-5 | One-occurrence restore and ignore on page | Reader panel actions and regression coverage delivered. Choices stay within the current page session; they do not create a browsing/term history |
| P1-6 | Meaningful coverage | 12 sourced health additions, fixed four-page public corpus, exact-span gold labels, baseline/current coverage and explicit unresolved gaps. [Coverage report](COVERAGE.md); no arbitrary word-count or comprehension claim |
| P1-7 | Context and grammar boundaries | Conservative literal quotation/name, possessive, compound and capitalization boundaries; explicit inflections and positive/negative cases. Uncertain wording stays original; no general semantic disambiguation |
| P1-8 | Cross-inline matching | Bounded transparent-inline runs, logical phrase grouping, preserved host elements and restoration tests. Interactive/complex boundaries stop a phrase |
| P1-9 | Copy/find/print | Original phrase copy, full original copy in the paragraph workshop, visible-word copy/find semantics, original-word printing lifecycle. Native print preview still needs a person |
| P1-10 | Honest explanation wording | Static example-context label replaces the implication of understanding the current sentence; review limitations remain visible |
| P2-1 | Preferences/localization | English/Chinese UI, compact/comfortable density, subtle/strong marks, remembered mode, toggle/restore shortcuts. Only preferences persist; new pages still start disabled |
| P2-2 | Lower feedback barrier | Review then copy/download a report without GitHub. Existing GitHub submission remains optional. No anonymous receiving service is deployed; the owner must choose a contact/service if direct account-free delivery is desired |
| P2-3 | Community/source maintenance | [Community rules](COMMUNITY.md), two-person review policy, dispute fallback, source-recheck/change records and a manual GitHub source-audit workflow. Workflow policy is not a claim that human reviewers exist |
| P2-4 | New-domain pilot | Separate, opt-in public-service dataset: 8 entries / 14 pairs with source/grammar boundaries. Available in workshop and SDK; excluded from the extension's default health lexicon |
| P2-5 | More browsers/devices | Firefox developer ZIP and [browser assessment](BROWSERS-AND-SURFACES.md). Native Firefox/signing, Edge runtime and Safari/Android device checks remain pending; Safari packager is unavailable locally. Edge can use an approved Chrome listing; its own publisher account is optional |
| P2-6 | Additional reading surfaces | PDF-text/OCR/iframe/Shadow DOM assessed individually with explicit decisions and acceptance gates. Paste-text workshop provides a current path; no unimplemented OCR/PDF viewer support is advertised |
| P2-7 | Paragraph simplification experiment | Local paragraph comparison, undo, source inspection and copy delivered. This constrained experiment uses editorially source-checked phrases; independent human review and sentence restructuring/model rewriting remain open |
| P2-8 | Reusable engine/data | Independent `openplainenglish-core` tarball build, browser/text APIs, both datasets, licenses, examples and offline packed-install tests. The release asset must be attached by the publisher; no npm account or registry publication claimed |

## Steps that need the owner or external participants

1. Register the Chrome Web Store developer account and complete payment/verification/terms; then provide access to the publisher workflow.
2. In a real browser, install the release, check the native extension/upgrade/import/print checklist, and capture genuine extension screenshots. The automated browser tool cannot perform the blocked management/file-access steps.
3. Complete publisher declarations and submit the prepared package; wait for store review, then supply the approved listing URL for the installation page.
4. Arrange independent language/domain review and consenting readers. The review pack and study are ready, but the project has no signed expert review or observed effectiveness results.
5. If desired, choose a public contact destination for direct feedback without a GitHub account; choose additional browser stores/developer memberships and real test devices.

No participant messages, account registration, purchases, publisher declarations or review endorsements were sent or invented during this implementation.
