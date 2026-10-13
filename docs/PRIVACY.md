# Privacy policy

Effective date: 2026-10-13. This policy describes OpenPlainEnglish v0.2, an unpacked browser extension for Chrome and Edge, and its separately labeled online demo.

## Page access

The extension works on the current HTTP(S) tab after you invoke and enable it. It uses `activeTab` and `scripting` to read supported text nodes, find bundled glossary terms, and add removable markers and explanation controls. Activation applies to that page load; a new document or reload requires you to enable it again. The original page wording remains available. This processing takes place in the browser.

OpenPlainEnglish does not automatically collect or store page text, page titles, browsing URLs, or browsing history. It does not upload page content. There is no analytics service, remote model, extension account, or runtime backend. Reading the bundled glossary uses an extension-local resource, not an external service.

The website you visit retains its own behavior and privacy policy. The extension does not prevent that site or other installed extensions from making network requests or collecting information.

## Local feedback

Feedback is saved in the browser's local extension storage. A record contains an ID, glossary entry ID, term, category (`unclear`, `inaccurate`, or `suggestion`), your note, creation time, and glossary version. Page URL, title, and body are not automatically added. The extension keeps up to 100 records; storage is not a cloud backup.

Your note is whatever you choose to write. Do not put personal health information, names, contact information, account information, or private documents in it. You can review feedback, export it to a local file, delete a draft, or delete all feedback from the management page. Keep exported files private if they contain sensitive material. Removing the extension removes its local extension storage; exported files remain wherever you saved them.

Importing a JSON backup reads the selected file locally and checks its schema and size. It shows a preview before you confirm a merge into local storage. Only the seven draft fields listed above are accepted. Existing draft IDs win; the newest 100 records remain, with overflow disclosed. Importing does not contact the project or GitHub. Keep a separate export before a merge that discards older drafts.

## Online demo

The public demo at `jakezwang.github.io/openplainenglish/` is hosted by GitHub Pages. Its host receives ordinary web requests, including the visitor's IP address and browser request information, to serve page files and the glossary. Hosting privacy terms apply; see [GitHub's privacy statement](https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement).

The reading example operates on invented text. The clearly labeled UI preview simulates browser extension APIs; it cannot access other tabs or establish that the installed extension works. Demo drafts use localStorage on the demo's web origin, separately from extension storage. They are not uploaded automatically. Other pages sharing the same web origin can access that storage, so use invented test feedback rather than personal information. Exports, imports, external source links and opening a GitHub draft follow the same explicit-action boundaries described here.

## Sharing and external links

Saving feedback does not send it to the project. The feedback interface prepares a GitHub issue only after you choose to do so. Review the note before opening the issue, then review the prepared issue on GitHub before submitting it.

Opening the prepared issue navigates the browser to GitHub. The prepared text appears in that navigation's URL and can be visible in browser history and to GitHub before you publish it. Published issues are public and may be copied, indexed, or retained. Deleting a local draft does not delete an opened URL from browser history or remove a GitHub issue. GitHub's privacy policy and account settings apply there.

Choosing a source link similarly opens the source website in your browser. Its privacy policy applies. OpenPlainEnglish does not automatically contact cited websites or GitHub during ordinary term matching and explanation reading.

## Permissions

| Permission | Why it is needed |
| --- | --- |
| `activeTab` | Temporarily access the tab you invoke the extension on. |
| `scripting` | Inject the reader and remove its markers on that tab. |
| `storage` | Keep feedback drafts in local extension storage. |

The manifest does not request access to all websites, browsing history, cookies, or accounts. Browser-internal pages, PDF files and the built-in PDF viewer, iframes, and shadow roots are outside the supported reading surface. Matching runs within individual text nodes rather than across separate HTML elements.

## Questions and changes

Raise a general privacy question in [GitHub issues](https://github.com/jakezwang/openplainenglish/issues/new/choose) without including private information. Report a suspected disclosure through [SECURITY.md](../SECURITY.md). Any change to these boundaries should update this policy and the relevant tests before release.
