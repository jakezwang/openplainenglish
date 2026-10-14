# Privacy policy

Effective date: 2026-10-14. This policy describes OpenPlainEnglish v0.5, a browser-extension developer preview, and its separate online reading tools.

## Page access

The extension works on the current HTTP(S) tab after you invoke and enable it. It uses `activeTab` and `scripting` to read supported text nodes, find bundled glossary terms, and add removable replacements, markers and explanation controls. Plain reading uses packaged, reviewed replacement pairs; Explain terms keeps original words visible. The reader holds original matched text only in current-page memory to support comparison and restoration; it does not persist that text. Activation applies to that page load; a new document or reload requires you to enable it again. This processing takes place in the browser.

Two optional reading settings include accessible same-origin frame documents and open shadow-root components inside that tab. Both are off by default. Enabling a setting does not activate reading; if reading is already enabled, it can bring additional text into the local scan. Cross-origin or inaccessible frames, opaque sandboxed documents and closed shadow roots remain excluded. The reader uses bounded work shared across the main document and up to 32 additional accessible scopes. It does not request extra host permissions, fetch a frame's URL or change a frame's sandbox to gain access.

OpenPlainEnglish does not automatically collect or store page text, page titles, browsing URLs, or browsing history. It does not upload page content. There is no analytics service, remote model, extension account, or runtime backend. Reading the bundled glossary uses an extension-local resource, not an external service.

The website you visit retains its own behavior and privacy policy. The extension does not prevent that site or other installed extensions from making network requests or collecting information.

## Local preferences and practice

Seven preferences are saved locally as `opePreferences`: interface language (`language`), density (`density`), mark strength (`highlight`), reading mode (`mode`), the two optional areas (`includeFrames`, `includeShadowRoots`) and guide completion (`guideCompleted`). The optional areas and guide completion default to `false`; older saved preferences receive these defaults. Changing settings updates readers already enabled by the user; it does not activate other tabs. Per-occurrence restoration and ignored words live only in the current page's reader memory. No page identifier or ignored-term history is saved.

The reading guide uses invented text and the actual reader within its own page. It saves completion only after the user finishes and chooses to remember it; changing the guide's language also saves that preference. Practice progress is held in page memory, not recorded as an event history. Opening or completing the guide never enables reading on another page. The packaged extension guide uses extension storage. Its website counterpart shares the UI preview's separate local preferences.

## Local feedback

Feedback is saved in the browser's local extension storage. A record contains an ID, glossary entry ID, term, category (`unclear`, `inaccurate`, or `suggestion`), your note, creation time, and glossary version. Page URL, title, and body are not automatically added. The extension keeps up to 100 records; storage is not a cloud backup.

Your note is whatever you choose to write. Do not put personal health information, names, contact information, account information, or private documents in it. You can review feedback, export it to a local file, delete a draft, or delete all feedback from the management page. Keep exported files private if they contain sensitive material. Removing the extension removes its local extension storage; exported files remain wherever you saved them.

Importing a JSON backup reads the selected file locally and checks its schema and size. It shows a preview before you confirm a merge into local storage. Only the seven draft fields listed above are accepted. Existing draft IDs win; the newest 100 records remain, with overflow disclosed. Importing does not contact the project or GitHub. Keep a separate export before a merge that discards older drafts.

## Online demo

The public demo at `jakezwang.github.io/openplainenglish/` is hosted by GitHub Pages. Its host receives ordinary web requests, including the visitor's IP address and browser request information, to serve page files and the glossary. Hosting privacy terms apply; see [GitHub's privacy statement](https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement).

The reading example operates on invented text. The clearly labeled UI preview simulates browser extension APIs; it cannot access other tabs or establish that the installed extension works. Demo drafts use localStorage on the demo's web origin, separately from extension storage. Its seven preferences use a separate localStorage key, `opeDemoPreferences`. They are not uploaded automatically. Other pages sharing the same web origin can access that storage, so use invented test feedback rather than personal information. Exports, imports, source links and feedback sharing follow the same explicit-action boundaries described here.

The paragraph workshop retains pasted text only in its current tab memory. It does not use localStorage for paragraphs or upload them. The separate sentence experiment also holds input, candidate text and exact originals only in page memory. It proposes a limited punctuation change, shows a difference preview, requires confirmation before applying it and supports undo; it calls no model or remote rewrite service. Clipboard actions occur only after a click. Clearing either tool does not clear your device's clipboard or delete files you downloaded.

The study harness uses synthetic passages and keeps answers, timings, explanation-open counts and facilitator notes in memory until the user explicitly reviews and exports a local results file. It has no automatic submission or analytics. Prepared study software is not participant research: no actual participant results are claimed. Do not enter private health records into public demonstration tools.

## Local PDF and image reading

The separate document webpage reads only the PDF, PNG or JPEG that you choose through its file control, or an invented example you request. It displays the original and extracts text with PDF.js or recognizes English text with Tesseract. File bytes, filename, page images, text positions and recognized/corrected text stay in that page's memory. The tool does not upload the document, save it to localStorage or modify the original file. Clear or Cancel releases the current document and text; generation checks discard late processing results. Clipboard contents and downloads remain under your device's control.

PDF/OCR scripts, workers, fonts and the English recognition model are downloaded from the website's own origin as needed. The host sees these asset requests, not the chosen file's contents. There is no runtime CDN fallback or document-processing server. Ordinary browser caching can retain these public software assets; the tool does not use its OCR cache to store documents or results. The extension and standalone SDK do not bundle these PDF/OCR libraries.

Limits are 15 MB per file (15 × 1,024 × 1,024 bytes), 100 PDF pages, 20 million pixels per processed image and 20,000 extracted characters. Only one PDF page is processed at a time. Encrypted PDFs are unsupported. You must check reading order, wording, numbers, units and negation against the visible original before enabling plain reading. Recognition confidence is not an accuracy guarantee. Switching pages clears previous corrections and reading output. This webpage does not give the extension access to your filesystem or the browser's built-in PDF viewer.

## Sharing and external links

Saving feedback does not send it to the project. The feedback interface prepares a GitHub issue only after you choose to do so. Review the note before opening the issue, then review the prepared issue on GitHub before submitting it.

After the same review step, you can copy or download a plain-text report without using GitHub. This creates content under your control; it does not deliver feedback to a maintainer or choose a recipient for you.

The owner-controlled bundled `data/feedback-config.json` may specify one feedback email address. It currently contains `email: null`, so no email recipient or delivery service is configured. The interface continues to offer copy and download. Users cannot enter an arbitrary server endpoint into this configuration through the UI.

When a valid address is configured, the review dialog shows the recipient, subject and exact report body before offering **Open email draft**. That explicit action passes these fields to your system's mail handler through a `mailto:` link. OpenPlainEnglish does not send the email. Your mail application may add a signature or synchronize a draft with its provider before you send it; its policies apply. Review the draft there before sending. Deleting the local feedback draft does not delete a draft or message in a mail application.

Opening the prepared issue navigates the browser to GitHub. The prepared text appears in that navigation's URL and can be visible in browser history and to GitHub before you publish it. Published issues are public and may be copied, indexed, or retained. Deleting a local draft does not delete an opened URL from browser history or remove a GitHub issue. GitHub's privacy policy and account settings apply there.

Choosing a source link similarly opens the source website in your browser. Its privacy policy applies. OpenPlainEnglish does not automatically contact cited websites or GitHub during ordinary term matching and explanation reading.

## Permissions

| Permission | Why it is needed |
| --- | --- |
| `activeTab` | Temporarily access the tab you invoke the extension on. |
| `scripting` | Inject the reader and remove its markers on that tab. |
| `storage` | Keep feedback drafts and the seven preferences, including guide completion, in local extension storage. |

The manifest does not request access to all websites, browsing history, cookies or accounts. Browser-internal pages, local files and the built-in PDF viewer remain outside the extension's reading surface. Frames and open shadow roots require the explicit opt-ins described above; cross-origin/inaccessible frames and closed roots remain excluded. Matching can span a bounded set of transparent inline formatting tags while preserving those elements. Native browser installation, permissions, upgrade and store acceptance still require their separate verification; this policy is not a claim those checks passed.

## Limited Use

OpenPlainEnglish's use of page text, the active tab's URL, local reading preferences and feedback data follows the [Chrome Web Store User Data Policy](https://developer.chrome.com/docs/webstore/program-policies/limited-use), including its Limited Use requirements. This data is used only for local reading substitutions, original-word comparisons, explanations, reading settings and user-directed feedback features. It is not sold or used for advertising, profiling or credit decisions. The extension does not transmit page text or the active tab's URL. Feedback is sent to GitHub only when the user chooses to open a prepared issue after review, or handed to a configured mail application after an explicit email-draft action. Copying or exporting a report creates content under the user's control; it does not automatically deliver it to the project.

## Questions and changes

Raise a general privacy question in [GitHub issues](https://github.com/jakezwang/openplainenglish/issues/new/choose) without including private information. Report a suspected disclosure through [SECURITY.md](../SECURITY.md). Any change to these boundaries should update this policy and the relevant tests before release.
